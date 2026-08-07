// TEMPLATE — minimal working microgame. Copy this whole folder, rename
// TEMPLATE everywhere (folder name, id, i18n NAME), then replace the
// mechanic below (marked with TODO). Everything else — screens, mute
// button, mid-game instructions, quit modal, result modal (play again /
// continue), stats, difficulty selection, embedding in the CogniFit feed
// (Utils.setupSwipeForwarding, Utils.listenForHostCommands) — already
// works.

const CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';

// TODO: replace with your own difficulty tuning. Keep it a plain object
// keyed by difficulty name so index.html's buttons need no other changes.
const DIFFICULTIES = {
    easy: { tiles: 4, rounds: 3 },
    medium: { tiles: 6, rounds: 3 },
    hard: { tiles: 9, rounds: 3 },
};

const Game = {
    id: 'TEMPLATE',
    i18n: {},
    assets: {},
    stats: {},
    levelOptions: {},
    difficulty: 'easy',
    round: 0,
    target: 0,
    startTime: 0,

    init: async function(config = {}) {
        const languageKey = Utils.getPreferredLanguage(config.languageKey || 'en_US');
        const assetsPath = config.assetsPath || (window.location.href.substring(0, window.location.href.lastIndexOf('/')) + '/');

        const assets = await Utils.loadScript(assetsPath + 'assets.js', 'assets') || [];
        this.i18n = await Utils.loadLanguageBundle(assetsPath, languageKey);

        this.assetsPath = assetsPath;
        this.assets = assets;
        this.stats = config.stats || JSON.parse(localStorage.getItem(this.id + '/stats')) || {};

        await Utils.preloadAssets(assets);
        Utils.applyLocalization(this.i18n);
        Utils.setupLanguageSwitcher(languageKey, (newKey) => this.changeLanguage(newKey));
        Utils.setupMuteButton();
        Utils.setupSwipeForwarding();
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

    startLevel: function(options = {}) {
        this.difficulty = DIFFICULTIES[options.difficulty] ? options.difficulty : 'easy';
        this.levelOptions = { difficulty: this.difficulty };
        this.round = 0;
        this.startTime = performance.now();

        Utils.switchScreen('title-screen', 'game-screen');
        Utils.switchScreen('level-screen', 'game-screen');
        this.renderRoundDots();
        this.nextRound();
    },

    // A grey dot per round — lights up green with a check once you clear it.
    // Prefer this over a text label like "Round 3/8": faster to read, and
    // there's nothing to translate.
    renderRoundDots: function() {
        const container = document.getElementById('round-dots');
        container.innerHTML = '';
        const cfg = DIFFICULTIES[this.difficulty];
        for (let i = 0; i < cfg.rounds; i++) {
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

    // TODO: this is the whole mechanic — pick a random tile as the target,
    // render N tiles, and wait for a tap. Replace with your own logic; the
    // round/finish/result plumbing around it can mostly stay as-is.
    nextRound: function() {
        const cfg = DIFFICULTIES[this.difficulty];
        if (this.round >= cfg.rounds) { this.finishLevel(); return; }
        this.round++;

        this.target = Math.floor(Math.random() * cfg.tiles);
        const field = document.getElementById('playfield');
        field.style.gridTemplateColumns = `repeat(${Math.ceil(Math.sqrt(cfg.tiles))}, 1fr)`;
        field.innerHTML = '';
        for (let i = 0; i < cfg.tiles; i++) {
            const tile = document.createElement('button');
            tile.className = 'cf-tile tile-btn';
            if (i === this.target) tile.classList.add('is-selected');
            tile.setAttribute('aria-label', `Tile ${i + 1}`);
            tile.onclick = () => this.handleTap(i, tile);
            field.appendChild(tile);
        }
    },

    handleTap: function(i, tile) {
        if (i === this.target) {
            tile.classList.add('is-correct');
            this.markRoundDot(this.round - 1);
            setTimeout(() => this.nextRound(), 300);
        } else {
            tile.classList.add('is-error');
            setTimeout(() => tile.classList.remove('is-error'), 300);
        }
    },

    finishLevel: function() {
        const seconds = (performance.now() - this.startTime) / 1000;
        this.stats.gamesCompleted = (this.stats.gamesCompleted || 0) + 1;
        localStorage.setItem(this.id + '/stats', JSON.stringify(this.stats));
        Utils.finishGame(this.levelOptions, { seconds });

        document.getElementById('result-time').innerText = Utils.formatTime(seconds);

        // TEMPLATE has no daily mode, so isDaily is always false here and
        // play-again is always offered — this check is only here so the
        // pattern matches games that do have one (see MATCHCOLOR/GRIDFLIP):
        // a daily result shows #result-continue-actions instead, since
        // there's only one daily challenge per day.
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
        Utils.switchScreen('game-screen', 'title-screen');
        Utils.switchScreen('level-screen', 'title-screen');
    },

    requestQuit: function() { document.getElementById('quit-modal').classList.add('active'); },
    cancelQuit: function() { document.getElementById('quit-modal').classList.remove('active'); },
    confirmQuit: function() {
        document.getElementById('quit-modal').classList.remove('active');
        this.quit();
    },

    // Same content as #instructions-screen, reachable mid-game via the
    // topbar's info button — see index.html for why there are two copies.
    showInstructions: function() { document.getElementById('instructions-modal').classList.add('active'); },
    hideInstructions: function() { document.getElementById('instructions-modal').classList.remove('active'); },

    showStats: function() {
        document.getElementById('stat-games-won').innerText = this.stats.gamesCompleted || 0;
        Utils.switchScreen('title-screen', 'stats-screen');
    }
};

document.addEventListener('DOMContentLoaded', () => Game.init());
