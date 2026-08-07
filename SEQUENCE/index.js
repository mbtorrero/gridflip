const DIRECTIONS = ['up', 'down', 'left', 'right'];

const ARROW_ICONS = {
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
};
const CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';

// A distinct musical tone per direction (plus a lower "buzz" for mistakes),
// synthesized with the Web Audio API — no audio files to ship or load.
const NOTE_FREQUENCIES = { up: 659.25, right: 493.88, down: 440.0, left: 587.33 };
const ERROR_FREQUENCY = 174.61;
let audioCtx = null;

function playTone(freq, durationMs) {
    try {
        if(window.volume == 0) { return; }
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = audioCtx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const peak = (window.volume != null ? window.volume : 1) * 0.22;
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(peak, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
        osc.start(now);
        osc.stop(now + durationMs / 1000 + 0.02);
    } catch (e) {
        // Web Audio unavailable — sound is a bonus, never required to play.
    }
}

// Each round is a brand-new random sequence at the given length (not a
// Simon-style sequence that keeps extending). "avoidRepeat" bans the same
// direction twice in a row when generating that difficulty's sequences.
const DIFFICULTIES = {
    easy: { lengths: [3, 4, 5, 6], noteDuration: 1000, avoidRepeat: true },
    medium: { lengths: [4, 5, 6, 7], noteDuration: 750, avoidRepeat: false },
    hard: { lengths: [5, 6, 7, 8], noteDuration: 500, avoidRepeat: false },
    expert: { lengths: [8, 8, 8, 8], noteDuration: 400, avoidRepeat: false },
};

const Game = {
    id: 'SEQUENCE',
    i18n: {},
    assets: {},
    stats: {},
    levelOptions: {},
    difficulty: 'easy',
    roundIndex: 0,
    sequence: [],
    inputIndex: 0,
    busy: false,
    timeouts: [],
    mistakeCount: 0,

    init: async function(config = {}) {
        const languageKey = Utils.getPreferredLanguage(config.languageKey || 'en_US');
        const assetsPath = config.assetsPath || (window.location.href.substring(0, window.location.href.lastIndexOf('/')) + '/');

        const assets = await Utils.loadScript(assetsPath + 'assets.js', 'assets') || [];
        this.i18n = await Utils.loadLanguageBundle(assetsPath, languageKey);

        this.assetsPath = assetsPath;
        this.assets = assets;
        this.stats = config.stats || JSON.parse(localStorage.getItem(this.id + '/stats')) || {};

        await Utils.preloadAssets(assets);
        Utils.setBackground(assets.find(a => a.id === 'bg'));
        Utils.applyLocalization(this.i18n);
        Utils.setupLanguageSwitcher(languageKey, (newKey) => this.changeLanguage(newKey));
        Utils.setupMuteButton();
        Utils.setupSwipeForwarding();
        this.attachInputHandlers();
        Utils.switchScreen('loading-screen', 'title-screen');

        Utils.listenForHostCommands({ onStartLevel: () => this.startLevel() });
        Utils.notifyReady();
    },

    changeLanguage: async function(languageKey) {
        this.i18n = await Utils.loadLanguageBundle(this.assetsPath, languageKey);
        Utils.applyLocalization(this.i18n);
        Utils.setPreferredLanguage(languageKey);
        Utils.syncLanguageSwitcher(languageKey);
    },

    attachInputHandlers: function() {
        document.querySelectorAll('.dpad-btn[data-dir]').forEach(btn => {
            btn.addEventListener('click', () => this.handleInput(btn.dataset.dir, btn));
        });
    },

    startLevel: function(options = {}) {
        this.clearTimeouts();
        this.difficulty = DIFFICULTIES[options.difficulty] ? options.difficulty : 'easy';
        this.levelOptions = { difficulty: this.difficulty };
        this.roundIndex = 0;
        this.mistakeCount = 0;

        Utils.switchScreen('title-screen', 'game-screen');
        Utils.switchScreen('level-screen', 'game-screen');
        this.renderRoundDots();
        this.startRound();
    },

    clearTimeouts: function() {
        this.timeouts.forEach(id => clearTimeout(id));
        this.timeouts = [];
    },

    after: function(ms, fn) {
        const id = setTimeout(fn, ms);
        this.timeouts.push(id);
        return id;
    },

    renderRoundDots: function() {
        const container = document.getElementById('round-dots');
        container.innerHTML = '';
        const total = DIFFICULTIES[this.difficulty].lengths.length;
        for (let i = 0; i < total; i++) {
            const dot = document.createElement('div');
            dot.className = 'progress-dot';
            dot.id = 'round-dot-' + i;
            container.appendChild(dot);
        }
    },

    markRoundDot: function(index) {
        const dot = document.getElementById('round-dot-' + index);
        if (!dot) return;
        dot.classList.add('state-correct');
        dot.innerHTML = CHECK_ICON;
    },

    startRound: function() {
        const lengths = DIFFICULTIES[this.difficulty].lengths;
        if (this.roundIndex >= lengths.length) { this.finishLevel(); return; }
        const length = lengths[this.roundIndex];
        this.sequence = this.generateSequence(length);
        this.renderNoteRow(length);
        this.playSequence();
    },

    generateSequence: function(length) {
        const cfg = DIFFICULTIES[this.difficulty];
        const seq = [];
        for (let i = 0; i < length; i++) {
            let dir, attempts = 0;
            do {
                dir = DIRECTIONS[Math.floor(Math.random() * 4)];
                attempts++;
            } while (cfg.avoidRepeat && dir === seq[seq.length - 1] && attempts < 20);
            seq.push(dir);
        }
        return seq;
    },

    // One row of slots, reused for both phases: the sequence reveals itself
    // here as it plays, then — cleared back to empty — the same slots fill
    // in again as the player taps each direction back correctly.
    renderNoteRow: function(length) {
        const container = document.getElementById('note-row');
        container.innerHTML = '';
        for (let i = 0; i < length; i++) {
            const slot = document.createElement('div');
            slot.className = 'note-slot';
            slot.id = 'note-slot-' + i;
            container.appendChild(slot);
        }
    },

    resetNoteRow: function() {
        document.querySelectorAll('.note-slot').forEach(s => { s.classList.remove('filled', 'revealed'); s.innerHTML = ''; });
    },

    playSequence: function() {
        this.clearTimeouts();
        this.busy = true;
        this.inputIndex = 0;
        this.setDpadEnabled(false);
        this.setPhaseLabel('WATCH_LABEL');
        this.resetNoteRow();

        const cfg = DIFFICULTIES[this.difficulty];
        const onDur = cfg.noteDuration * 0.6;
        let t = 1000; // leading silence
        this.sequence.forEach((dir, i) => {
            this.after(t, () => {
                this.setDpadActive(dir, true);
                playTone(NOTE_FREQUENCIES[dir], onDur);
                const slot = document.getElementById('note-slot-' + i);
                if (slot) { slot.classList.add('revealed'); slot.innerHTML = ARROW_ICONS[dir]; }
            });
            this.after(t + onDur, () => this.setDpadActive(dir, false));
            t += cfg.noteDuration;
        });
        t += 1000; // trailing pause before input is allowed
        this.after(t, () => {
            this.busy = false;
            this.resetNoteRow();
            this.setDpadEnabled(true);
            this.setPhaseLabel('REPEAT_LABEL');
        });
    },

    replaySequence: function() {
        if (this.busy || !this.sequence.length) return;
        this.playSequence();
    },

    setPhaseLabel: function(key) {
        const el = document.getElementById('phase-label');
        if (el) el.innerText = this.i18n[key] || key;
    },

    setDpadEnabled: function(enabled) {
        document.querySelectorAll('.dpad-btn[data-dir]').forEach(btn => btn.classList.toggle('is-disabled', !enabled));
        const replay = document.getElementById('replay-btn');
        if (replay) replay.disabled = !enabled;
    },

    setDpadActive: function(dir, active) {
        const btn = document.querySelector(`.dpad-btn[data-dir="${dir}"]`);
        if (btn) btn.classList.toggle('is-selected', active);
    },

    // Lights up every arrow at once (red for a mistake, green for a
    // completed round) for a moment, then clears it.
    flashDpad: function(cls, duration) {
        const btns = document.querySelectorAll('.dpad-btn[data-dir]');
        btns.forEach(b => b.classList.add(cls));
        this.after(duration, () => btns.forEach(b => b.classList.remove(cls)));
    },

    handleInput: function(dir, btn) {
        if (this.busy) return;
        const expected = this.sequence[this.inputIndex];

        if (dir === expected) {
            playTone(NOTE_FREQUENCIES[dir], 150);
            const slot = document.getElementById('note-slot-' + this.inputIndex);
            if (slot) { slot.classList.add('filled'); slot.innerHTML = ARROW_ICONS[dir]; }
            btn.classList.add('is-correct');
            this.after(150, () => btn.classList.remove('is-correct'));
            this.inputIndex++;

            if (this.inputIndex >= this.sequence.length) {
                this.busy = true;
                this.setDpadEnabled(false);
                this.markRoundDot(this.roundIndex);
                if (window.audio?.correct) Utils.playSound(window.audio.correct);
                this.flashDpad('flash-win', 500);
                const noteRow = document.getElementById('note-row');
                noteRow.classList.add('flash-win');
                this.after(500, () => noteRow.classList.remove('flash-win'));
                this.roundIndex++;
                this.after(700, () => this.startRound());
            }
        } else {
            this.mistakeCount++;
            playTone(ERROR_FREQUENCY, 220);
            if (window.audio?.wrong) Utils.playSound(window.audio.wrong);
            this.busy = true;
            this.setDpadEnabled(false);
            this.resetNoteRow();
            this.flashDpad('flash-wrong', 400);
            const dpad = document.querySelector('.dpad');
            dpad.classList.add('shake');
            this.after(400, () => dpad.classList.remove('shake'));
            const liveRegion = document.getElementById('live-region');
            if (liveRegion) liveRegion.innerText = 'Try again';
            this.after(500, () => this.playSequence());
        }
    },

    finishLevel: function() {
        this.stats.gamesCompleted = (this.stats.gamesCompleted || 0) + 1;
        localStorage.setItem(this.id + '/stats', JSON.stringify(this.stats));
        Utils.finishGame(this.levelOptions, { difficulty: this.difficulty, mistakes: this.mistakeCount });

        if (window.audio?.win) Utils.playSound(window.audio.win);

        document.getElementById('result-mistakes').innerText = this.mistakeCount;

        // SEQUENCE has no daily-challenge mode, so play-again is always
        // offered — kept as a flag check anyway to match the other games'
        // pattern in case that changes later.
        const isDaily = !!this.levelOptions.daily;
        document.getElementById('result-play-again-actions').style.display = isDaily ? 'none' : '';
        document.getElementById('result-continue-actions').style.display = isDaily ? '' : 'none';
        document.getElementById('result-modal').classList.add('active');
    },

    playAgain: function() {
        document.getElementById('result-modal').classList.remove('active');
        this.startLevel({ difficulty: this.levelOptions.difficulty });
    },

    acknowledgeResult: function() {
        document.getElementById('result-modal').classList.remove('active');
        this.quit();
    },

    quit: function() {
        this.clearTimeouts();
        Utils.switchScreen('game-screen', 'title-screen');
        Utils.switchScreen('level-screen', 'title-screen');
    },

    requestQuit: function() { document.getElementById('quit-modal').classList.add('active'); },
    cancelQuit: function() { document.getElementById('quit-modal').classList.remove('active'); },
    confirmQuit: function() {
        document.getElementById('quit-modal').classList.remove('active');
        this.quit();
    },

    showStats: function() {
        document.getElementById('stat-games-won').innerText = this.stats.gamesCompleted || 0;
        Utils.switchScreen('title-screen', 'stats-screen');
    }
};

document.addEventListener('DOMContentLoaded', () => Game.init());
