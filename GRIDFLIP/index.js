const Game = {
    id: 'GRIDFLIP',
    i18n: {},
    assets: {},
    stats: {},
    size: 3,
    state: { data: [] },
    levelOptions: { size: 3, state: [] },
    taps: 0,
    startTime: 0,
    elapsedSeconds: 0,

    init: async function(config = {}) {
        const languageKey = config.languageKey || 'en_US';
        const assetsPath = config.assetsPath || (window.location.href.substring(0, window.location.href.lastIndexOf('/')) + '/');

        const assets = await Utils.loadScript(assetsPath + 'assets.js', 'assets') || [];
        this.i18n = await Utils.loadLanguageBundle(assetsPath, languageKey);
        const dailyChallenges = await Utils.loadScript(assetsPath + 'dailyChallenges.js', 'dailyChallenges') || [];

        this.assetsPath = assetsPath;
        this.assets = assets;
        this.stats = config.stats || JSON.parse(localStorage.getItem(this.id + '/stats')) || {};
        Utils.gameId = this.id;

        await Utils.preloadAssets(assets);
        Utils.setBackground(assets.find(t => t.id === 'bg'));

        Utils.applyLocalization(this.i18n);
        Utils.switchScreen('loading-screen', 'title-screen');

        Utils.listenForHostCommands({ onStartLevel: () => this.startLevel() });
        Utils.notifyReady();
    },

    startDaily(){
        let levelConfig = null;
        try {
            const challenges = window.dailyChallenges || [];
            const now = new Date();
            const start = new Date(now.getFullYear(), 0, 0);
            const diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
            const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
            const todayStr = now.toISOString().split('T')[0];
            window.todayStr = todayStr;
            if (Array.isArray(challenges)) {
                levelConfig = challenges.find(c => c.date === todayStr) || challenges[dayOfYear % challenges.length];
                this.startLevel(levelConfig);
            } else if (typeof challenges === 'object' && challenges !== null) {
                levelConfig = challenges[todayStr];
                if (!levelConfig) {
                    const keys = Object.keys(challenges);
                    if (keys.length > 0) {
                        levelConfig = challenges[keys[dayOfYear % keys.length]];
                        this.startLevel(levelConfig);
                    }
                }
            }
        } catch (e) {
            console.warn("Could not load daily challenge, falling back to random level.", e);
        }
    },

    start: async function(levelConfig) {
        const size = levelConfig ? (levelConfig.size || 3) : 3;
        const initialState = levelConfig && levelConfig.state ? [...levelConfig.initialState] : this.randomLevelStates(size);
        this.startLevel({ size, state: initialState });
    },

    startLevel: function(options = {}) {
        const size = options.size || 3;
        this.size = size;
        const initialState = options.state ? [...options.state] : this.randomLevelStates(size);
        
        this.levelOptions = { size, state: [...initialState], daily: options.daily };
        this.state.data = [...initialState];
        this.taps = 0;
        this.startTime = performance.now();

        this.renderGrid();
        Utils.switchScreen('title-screen', 'game-screen');
        Utils.switchScreen('level-screen', 'game-screen');
    },

    randomLevelStates: function(size) {
        const arr = new Array(size * size).fill(0);
        const clicks = Math.floor(Math.random() * (size * size)) + size;
        for (let i = 0; i < clicks; i++) {
            const r = Math.floor(Math.random() * (size * size));
            this.toggleVirtual(arr, r, size);
        }
        return arr;
    },

    toggleVirtual: function(arr, i, s) {
        const x = i % s, y = Math.floor(i / s);
        const toggle = (cx, cy) => {
            if (cx >= 0 && cx < s && cy >= 0 && cy < s) arr[cy * s + cx] ^= 1;
        };
        toggle(x, y); toggle(x - 1, y); toggle(x + 1, y); toggle(x, y - 1); toggle(x, y + 1);
    },

    renderGrid: function() {
        const container = document.getElementById('grid-container');
        container.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        container.style.gridTemplateRows = `repeat(${this.size}, 1fr)`;
        container.innerHTML = '';

        this.state.data.forEach((val, i) => {
            const tile = document.createElement('div');
            tile.className = `tile cf-tile ${val ? 'flipped' : ''}`;
            tile.onclick = () => this.clickTile(i);
            
            tile.innerHTML = `
                <div class="tile-inner">
                    <div class="tile-face tile-front"><img src="${this.assets.find( a => a.id == 'a').src}" alt="A"></div>
                    <div class="tile-face tile-back"><img src="${this.assets.find( a => a.id == 'b').src}" alt="B"></div>
                </div>`;
            container.appendChild(tile);
        });
    },

    clickTile: function(i) {
        if (window.audio?.click) Utils.playSound(window.audio.click);
        this.taps++;

        this.toggleVirtual(this.state.data, i, this.size);
        
        const tiles = document.querySelectorAll('.tile');
        this.state.data.forEach((val, idx) => {
            if (val) tiles[idx].classList.add('flipped');
            else tiles[idx].classList.remove('flipped');
        });

        this.checkWin();
    },

    checkWin: function() {
        const sum = this.state.data.reduce((a, b) => a + b, 0);
        if (sum === 0 || sum === this.state.data.length) { // Win
            document.querySelectorAll('.tile').forEach(t => t.classList.add('is-correct'));
            if (window.audio?.win) Utils.playSound(window.audio.win);
            this.elapsedSeconds = (performance.now() - this.startTime) / 1000;
            setTimeout(() => {
                this.stats = this.stats ? this.stats : {};
                this.stats.gamesCompleted = (this.stats.gamesCompleted + 1) || 1;
                this.stats.dailyChallengesDates = this.stats.dailyChallengesDates ? this.stats.dailyChallengesDates : [];
                if(this.levelOptions.daily){
                    this.stats.dailyChallengesDates.push(window.todayStr);
                    this.stats.dailyChallengesDates = Utils.simpleUniqueArray(this.stats.dailyChallengesDates);
                    this.stats.dailyChallengesCompleted = this.stats.dailyChallengesDates.length;
                }
                localStorage.setItem(this.id + '/stats', JSON.stringify(this.stats));
                Utils.finishGame(this.levelOptions, { taps: this.taps, seconds: this.elapsedSeconds });
                this.showResult();
            }, 400);
        }
    },

    showResult: function() {
        document.getElementById('result-taps').innerText = this.taps;
        document.getElementById('result-time').innerText = Utils.formatTime(this.elapsedSeconds);
        document.getElementById('result-share').style.display = this.levelOptions.daily ? '' : 'none';
        document.getElementById('result-modal').classList.add('active');
    },

    copyShareText: function() {
        const template = this.i18n['SHARE_TEMPLATE'] || 'Gridflip: {date} Solved in {steps} steps in {time}';
        const text = Utils.formatTemplate(template, {
            date: window.todayStr || '',
            steps: this.taps,
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

    requestQuit: function() {
        document.getElementById('quit-modal').classList.add('active');
    },

    cancelQuit: function() {
        document.getElementById('quit-modal').classList.remove('active');
    },

    confirmQuit: function() {
        document.getElementById('quit-modal').classList.remove('active');
        this.quit();
    },

    showStats: function() {
        document.getElementById('stat-games-won').innerText = this.stats.gamesCompleted || 0;
        document.getElementById('stat-dailies-won').innerText = this.stats.dailyChallengesCompleted || 0;
        Utils.switchScreen('title-screen', 'stats-screen');
    }
};

document.addEventListener('DOMContentLoaded', () => Game.init());