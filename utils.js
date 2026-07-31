// utils.js
const Utils = {
    // Missing state storage for finishGame helpers
    stats: {},
    gameId: 'microgame_default',

    setBackground(bgAsset, styleOptions = {}) {
        if (bgAsset && bgAsset.src) {
            document.querySelectorAll('.screen').forEach(s => {
                s.style.backgroundImage = `url('${bgAsset.src}')`;
                s.style.backgroundSize = styleOptions.backgroundSize || 'cover';
                s.style.backgroundPosition = styleOptions.backgroundPosition || 'center';
            });
        }
    },

    applyLocalization: function(i18n) {
        if (!i18n || Object.keys(i18n).length === 0) return;
        
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (i18n[key]) {
                el.innerText = i18n[key];
            }
        });
    },

    async loadJSON(id, src) {
        try {
            const response = await fetch(src);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            window.json = window.json || {};
            window.json[id] = data;
            return data;
        } catch (e) {
            console.warn(`Failed to load JSON from ${src}:`, e);
            return null;
        }
    },

    async loadImage(id, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image at: ${src}`));
            img.src = src; // Fixed variable name from imgURL
        });
    },

    async loadFont(id, src) {
        try {
            const font = new FontFace(id, `url(${src})`);
            await font.load();
            document.fonts.add(font);
        } catch (e) { 
            console.warn(`Font ${id} failed to load:`, e); 
        }
    },

    async loadAudio(id, src) {
        return new Promise((resolve) => {
            const audio = new Audio();
            
            const handleCanPlay = () => {
                window.audio = window.audio || {};
                audio.playOnce = function() {
                    audio.volume = window.volume || 1;
                    audio.currentTime = 0;
                    audio.play().catch(() => {});
                };
                window.audio[id] = audio;
                resolve(audio);
            };

            audio.addEventListener('canplaythrough', handleCanPlay, { once: true });
            audio.addEventListener('error', () => {
                console.warn(`Failed to load audio: ${src}`);
                resolve(null); // Resolve anyway to avoid blocking Promise.all
            }, { once: true });

            audio.src = src;
            audio.load();
        });
    },

    async preloadAssets(assetsArray = []) {
        try {
            const loadPromises = assetsArray
                .filter(a => a.preload)
                .map(a => {
                    switch (a.type) {
                        case 'image':
                        case 'img':
                            return this.loadImage(a.id, a.src);
                        case 'font':
                            return this.loadFont(a.id, a.src);
                        case 'audio':
                        case 'sfx':
                        case 'bgm':
                        case 'sound':
                            return this.loadAudio(a.id, a.src);
                        case 'json':
                            return this.loadJSON(a.id, a.src); // Fixed copy-paste bug
                        default:
                            return null;
                    }
                })
                .filter(Boolean); // Clean filters out null/undefined

            await Promise.all(loadPromises);
        } catch (e) {
            console.warn("Error preloading assets: " + e);
        }
    },

    async loadScript(src, varname = 'res') {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                script.remove(); // Clean up DOM
                resolve(window[varname] || {});
            };
            script.onerror = () => {
                script.remove();
                reject(new Error(`Failed to load script: ${src}`));
            };
            document.head.appendChild(script);
        });
    },

    async loadLanguageBundle(assetsPath = '', languageKey = 'en_US') {
        let basePath = assetsPath.replace(/[^/]*$/, '');
        if (basePath && !basePath.endsWith('/')) basePath += '/';

        const sanitizeKey = (key) => 'i18n_' + key.replace(/[^a-zA-Z0-9_]/g, '_');

        const pathsToTry = [
            { url: `${basePath}i18n/${languageKey}.js` },
            { url: `${basePath}${languageKey}.js` },
            { url: `${basePath}i18n/en_US.js` }
        ];

        for (const option of pathsToTry) {
            try {
                await this.loadScript(option.url);
                return window.lb;
            } catch (e) {
                // Ignore and try fallback path
            }
        }

        console.warn(`[Utils] Could not load language bundle for '${languageKey}'. Using empty fallback.`);
        window.lb = {};
        return window.lb;
    },

    setVolume(val = 1.0) {
        window.volume = val;
        const audios = window.audio || {};
        Object.keys(audios).forEach(k => {
            if (audios[k]) audios[k].volume = val;
        });
    },

    playSound(audio) {
        if (audio) {
            audio.currentTime = 0;
            if (typeof audio.play === 'function') {
                audio.play().catch(() => {});
            }
        }
    },

    switchScreen(hideId, showId) {
        const hideEl = document.getElementById(hideId);
        const showEl = document.getElementById(showId);
        if (hideEl) hideEl.classList.remove('active');
        if (showEl) showEl.classList.add('active');
    },

    // Mock storage helpers required by finishGame
    saveStatistic(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    getStatistic(key) {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : null;
    },

    incrementStat(key) {
        const current = this.getStatistic(key) || 0;
        this.saveStatistic(key, current + 1);
    },

    finishGame(isDaily) {
        this.incrementStat(isDaily ? 'dailyChallengesCompleted' : 'gamesCompleted');
        if (isDaily) {
            const today = new Date().toISOString().split('T')[0];
            let streak = this.getStatistic('dailyChallengeStreak') || [];
            if (!streak.includes(today)) streak.push(today);
            if (streak.length > 10) streak.shift();
            this.saveStatistic('dailyChallengeStreak', streak);
        }
        
        const eventData = { gameId: this.gameId, type: isDaily ? 'daily' : 'regular', stats: this.stats };
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'MICROGAME_COMPLETE', data: eventData }, '*');
        } else {
            console.log("Game Finished", eventData);
        }
    }
};