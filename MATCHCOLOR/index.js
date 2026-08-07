const CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';
const CROSS_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

// t goes from 0 (easiest) to 1 (hardest): lerp slides from `from` to `to`.
function lerp(from, to, t) {
    return from + (to - from) * t;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// The chosen level (option count) sets one fixed difficulty for every round
// in it — EASY stays clearly-different colors throughout, EXPERT stays
// close together throughout. Difficulty does not ramp up round by round.
const DIFFICULTY_BY_OPTIONS = { 4: 0, 6: 1 / 3, 9: 2 / 3, 12: 1 };

const Game = {
    id: 'MATCHCOLOR',
    i18n: {},
    assets: {},
    stats: {},
    levelOptions: { options: 4 },
    roundsPerLevel: 8,
    round: 0,
    score: 0,
    startTime: 0,
    elapsedSeconds: 0,
    locked: false,
    rng: null,
    current: null,

    init: async function(config = {}) {
        const languageKey = Utils.getPreferredLanguage(config.languageKey || 'en_US');
        const assetsPath = config.assetsPath || (window.location.href.substring(0, window.location.href.lastIndexOf('/')) + '/');

        const assets = await Utils.loadScript(assetsPath + 'assets.js', 'assets') || [];
        this.i18n = await Utils.loadLanguageBundle(assetsPath, languageKey);
        await Utils.loadScript(assetsPath + 'dailyChallenges.js', 'dailyChallenges');

        this.assetsPath = assetsPath;
        this.assets = assets;
        this.stats = config.stats || JSON.parse(localStorage.getItem(this.id + '/stats')) || {};

        await Utils.preloadAssets(assets);
        Utils.setBackground(assets.find(a => a.id === 'bg'));
        Utils.applyLocalization(this.i18n);
        Utils.setupLanguageSwitcher(languageKey, (newKey) => this.changeLanguage(newKey));
        Utils.setupMuteButton();
        Utils.setupSwipeForwarding();
        Utils.switchScreen('loading-screen', 'title-screen');

        window.addEventListener('resize', () => { if (this.current) this.sizeOptionsGrid(); });
        Utils.listenForHostCommands({ onStartLevel: () => this.startLevel() });
        Utils.notifyReady();
    },

    changeLanguage: async function(languageKey) {
        this.i18n = await Utils.loadLanguageBundle(this.assetsPath, languageKey);
        Utils.applyLocalization(this.i18n);
        Utils.setPreferredLanguage(languageKey);
        Utils.syncLanguageSwitcher(languageKey);
    },

    startDaily: function() {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        window.todayStr = todayStr;
        const overrides = window.dailyChallenges || {};
        const challenge = overrides[todayStr] || { seed: todayStr, options: 6 };
        this.startLevel({ ...challenge, daily: true });
    },

    startLevel: function(options = {}) {
        const numOptions = options.options || 4;
        this.levelOptions = { options: numOptions, daily: options.daily, seed: options.seed };
        this.rng = options.seed ? this.seededRandom(options.seed) : null;
        this.difficulty = DIFFICULTY_BY_OPTIONS[numOptions] ?? 0.5;
        this.round = 0;
        this.score = 0;
        this.startTime = performance.now();

        Utils.switchScreen('title-screen', 'game-screen');
        Utils.switchScreen('level-screen', 'game-screen');
        this.renderDots();
        this.nextRound();
    },

    // Deterministic PRNG so a "daily challenge" is identical for everyone who
    // plays it that day, without needing to hand-author level data per date.
    seededRandom: function(seedStr) {
        let h = 1779033703 ^ seedStr.length;
        for (let i = 0; i < seedStr.length; i++) {
            h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
            h = (h << 13) | (h >>> 19);
        }
        return function() {
            h = Math.imul(h ^ (h >>> 16), 2246822507);
            h = Math.imul(h ^ (h >>> 13), 3266489909);
            h ^= h >>> 16;
            return (h >>> 0) / 4294967296;
        };
    },

    // A grey dot per round, in order — lights up green with a check or red
    // with a cross once that round is answered. No lives, no failure state:
    // every level runs the same fixed number of rounds to completion.
    renderDots: function() {
        const container = document.getElementById('progress-dots');
        container.innerHTML = '';
        for (let i = 0; i < this.roundsPerLevel; i++) {
            const dot = document.createElement('div');
            dot.className = 'progress-dot';
            dot.id = 'dot-' + i;
            container.appendChild(dot);
        }
    },

    markDot: function(index, correct) {
        const dot = document.getElementById('dot-' + index);
        if (!dot) return;
        dot.classList.add(correct ? 'state-correct' : 'state-wrong');
        dot.innerHTML = correct ? CHECK_ICON : CROSS_ICON;
    },

    nextRound: function() {
        if (this.round >= this.roundsPerLevel) { this.finishLevel(); return; }
        this.round++;
        this.locked = false;
        this.current = this.buildRound(this.levelOptions.options, this.difficulty);
        this.renderRound();
    },

    // Colors differ in hue, saturation AND lightness — not hue alone. Easy
    // levels push all three far apart; harder levels shrink all three, so
    // the options look more alike — but this is fixed per level, the same
    // for every round in it, not something that ramps up round by round.
    buildRound: function(numOptions, difficulty) {
        const rand = this.rng || Math.random;
        const hueSpread = lerp(130, 25, difficulty);
        const satSpread = lerp(30, 6, difficulty);
        const lightSpread = lerp(22, 5, difficulty);
        const minDistance = lerp(30, 7, difficulty);

        const makeRandomColor = () => ({
            h: rand() * 360,
            s: 55 + rand() * 20,
            l: 42 + rand() * 16,
        });

        const target = makeRandomColor();
        const colors = [target];
        let attempts = 0;
        while (colors.length < numOptions && attempts < 500) {
            attempts++;
            const candidate = {
                h: (target.h + (rand() * 2 - 1) * hueSpread + 360) % 360,
                s: clamp(target.s + (rand() * 2 - 1) * satSpread, 20, 90),
                l: clamp(target.l + (rand() * 2 - 1) * lightSpread, 25, 75),
            };
            if (!colors.some(existing => this.colorDistance(existing, candidate) < minDistance)) colors.push(candidate);
        }
        while (colors.length < numOptions) colors.push(makeRandomColor());

        for (let i = colors.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1));
            [colors[i], colors[j]] = [colors[j], colors[i]];
        }
        return { target, options: colors, targetIndex: colors.indexOf(target) };
    },

    hueDistance: function(a, b) {
        const d = Math.abs(a - b) % 360;
        return Math.min(d, 360 - d);
    },

    // One "how different do these look" number combining all three channels.
    colorDistance: function(a, b) {
        const dh = this.hueDistance(a.h, b.h);
        const ds = a.s - b.s;
        const dl = a.l - b.l;
        return Math.sqrt(dh * dh + ds * ds + dl * dl);
    },

    swatchColor: function(color) {
        return `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
    },

    renderRound: function() {
        document.getElementById('target-swatch').style.background = this.swatchColor(this.current.target);

        const grid = document.getElementById('options-grid');
        grid.innerHTML = '';

        this.current.options.forEach((color, i) => {
            const btn = document.createElement('button');
            btn.className = 'cf-tile color-swatch';
            btn.style.background = this.swatchColor(color);
            btn.setAttribute('aria-label', `${this.i18n['SR_COLOR_OPTION'] || 'Color option'} ${i + 1}`);
            btn.onclick = () => this.selectOption(i, btn);
            grid.appendChild(btn);
        });

        this.sizeOptionsGrid();
    },

    // Cell size is bounded by BOTH available width and available height —
    // a pure CSS aspect-ratio-on-width grid overflows vertically on short
    // (landscape) screens, since a wide grid of 1:1 cells is also tall.
    sizeOptionsGrid: function() {
        if (!this.current) return;
        const grid = document.getElementById('options-grid');
        const n = this.current.options.length;
        const cols = Math.ceil(Math.sqrt(n));
        const rows = Math.ceil(n / cols);
        const gap = 12;

        const stageTop = grid.getBoundingClientRect().top;
        const availableWidth = Math.min(window.innerWidth * 0.92, 520);
        const availableHeight = Math.max(160, window.innerHeight - stageTop - 24);

        const cellFromWidth = (availableWidth - gap * (cols - 1)) / cols;
        const cellFromHeight = (availableHeight - gap * (rows - 1)) / rows;
        const cellSize = Math.max(44, Math.min(cellFromWidth, cellFromHeight));

        // Setting both columns AND rows to the same fixed size (rather than
        // letting row height default from content) is what guarantees every
        // swatch is a perfect, uniform square.
        grid.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
        grid.style.gridAutoRows = `${cellSize}px`;
        grid.style.width = (cellSize * cols + gap * (cols - 1)) + 'px';
    },

    selectOption: function(index, btn) {
        if (this.locked) return;
        this.locked = true;
        const correct = index === this.current.targetIndex;
        const liveRegion = document.getElementById('live-region');

        if (window.audio?.click) Utils.playSound(window.audio.click);

        if (correct) {
            btn.classList.add('is-correct');
            this.score += 10;
            liveRegion.innerText = 'Correct';
            if (window.audio?.correct) Utils.playSound(window.audio.correct);
        } else {
            btn.classList.add('is-error');
            liveRegion.innerText = 'Try again';
            if (window.audio?.wrong) Utils.playSound(window.audio.wrong);
        }
        this.markDot(this.round - 1, correct);
        document.querySelectorAll('.color-swatch').forEach(el => el.classList.add('is-disabled'));

        setTimeout(() => this.nextRound(), correct ? 500 : 650);
    },

    finishLevel: function() {
        this.elapsedSeconds = (performance.now() - this.startTime) / 1000;
        this.stats.bestScore = Math.max(this.stats.bestScore || 0, this.score);
        this.stats.gamesCompleted = (this.stats.gamesCompleted || 0) + 1;
        if (this.levelOptions.daily) {
            this.stats.dailyChallengesDates = this.stats.dailyChallengesDates || [];
            this.stats.dailyChallengesDates.push(window.todayStr);
            this.stats.dailyChallengesCompleted = this.stats.dailyChallengesDates.length;
        }
        localStorage.setItem(this.id + '/stats', JSON.stringify(this.stats));
        Utils.finishGame(this.levelOptions, { score: this.score, round: this.round, seconds: this.elapsedSeconds });

        if (window.audio?.win) Utils.playSound(window.audio.win);
        this.showResult();
    },

    // Reuses the live progress dots (already colored/checked per round) as
    // the result's "red and green circles" — no separate state to track.
    showResult: function() {
        const isDaily = !!this.levelOptions.daily;
        document.getElementById('result-dots').innerHTML = document.getElementById('progress-dots').innerHTML;
        document.getElementById('result-time').innerText = Utils.formatTime(this.elapsedSeconds);
        document.getElementById('result-share').style.display = isDaily ? '' : 'none';
        document.getElementById('result-play-again-actions').style.display = isDaily ? 'none' : '';
        document.getElementById('result-continue-actions').style.display = isDaily ? '' : 'none';
        document.getElementById('result-modal').classList.add('active');
    },

    // Not offered after a daily challenge — there's only one per day.
    playAgain: function() {
        document.getElementById('result-modal').classList.remove('active');
        this.startLevel({ options: this.levelOptions.options });
    },

    copyShareText: function() {
        const dots = [...document.querySelectorAll('#progress-dots .progress-dot')]
            .map(dot => dot.classList.contains('state-correct') ? '🟢' : '🔴')
            .join('');
        const correct = document.querySelectorAll('#progress-dots .state-correct').length;
        const template = this.i18n['SHARE_TEMPLATE'] || 'Match the Color: {date} {dots} {correct}/{total} solved in {time}';
        const text = Utils.formatTemplate(template, {
            date: window.todayStr || '',
            dots,
            correct,
            total: this.roundsPerLevel,
            time: Utils.formatTime(this.elapsedSeconds),
        });
        Utils.copyToClipboard(text).then(ok => {
            const btn = document.getElementById('share-copy-btn');
            if (!btn || !ok) return;
            const original = btn.innerText;
            btn.innerText = this.i18n['BTN_COPIED'] || 'COPIED!';
            setTimeout(() => { btn.innerText = original; }, 1500);
        });
    },

    acknowledgeResult: function() {
        document.getElementById('result-modal').classList.remove('active');
        this.quit();
    },

    quit: function() {
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
        document.getElementById('stat-dailies-won').innerText = this.stats.dailyChallengesCompleted || 0;
        document.getElementById('stat-best-score').innerText = this.stats.bestScore || 0;
        Utils.switchScreen('title-screen', 'stats-screen');
    }
};

document.addEventListener('DOMContentLoaded', () => Game.init());
