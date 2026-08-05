// utils.js
const Utils = {
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

        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            const key = el.getAttribute('data-i18n-aria');
            if (i18n[key]) {
                el.setAttribute('aria-label', i18n[key]);
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

    LANGUAGE_STORAGE_KEY: 'cf_language',

    getPreferredLanguage(fallback = 'en_US') {
        try {
            return localStorage.getItem(Utils.LANGUAGE_STORAGE_KEY) || fallback;
        } catch (e) {
            return fallback;
        }
    },

    setPreferredLanguage(languageKey) {
        try {
            localStorage.setItem(Utils.LANGUAGE_STORAGE_KEY, languageKey);
        } catch (e) { /* ignore */ }
    },

    // Fills in every `.cf-lang-switcher` on the page (there's one wherever the
    // brand mark shows) with the shared language list from languages.js, and
    // wires its native <select> to call onChange(languageKey) on selection.
    // The <select> is invisible and sits on top of the styled button — that's
    // what gives phones/tablets their native picker UI for free.
    setupLanguageSwitcher(currentKey, onChange) {
        const languages = window.CF_LANGUAGES || [];
        document.querySelectorAll('.cf-lang-switcher').forEach(switcher => {
            const select = switcher.querySelector('.cf-lang-select');
            if (!select) return;
            select.innerHTML = languages.map(l => `<option value="${l.code}">${l.label}</option>`).join('');
            select.addEventListener('change', () => onChange(select.value));
        });
        Utils.syncLanguageSwitcher(currentKey);
    },

    // Updates every switcher's selected value and short-code label to match
    // the language currently in use (call after loading a new bundle).
    syncLanguageSwitcher(languageKey) {
        const lang = (window.CF_LANGUAGES || []).find(l => l.code === languageKey);
        document.querySelectorAll('.cf-lang-switcher').forEach(switcher => {
            const select = switcher.querySelector('.cf-lang-select');
            const label = switcher.querySelector('.cf-lang-current');
            if (select) select.value = languageKey;
            if (label) label.textContent = lang ? lang.short : languageKey;
        });
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

    simpleUniqueArray(array = []) {
        return [...new Set(array)];
    },

    formatTime(totalSeconds) {
        const m = Math.floor(totalSeconds / 60);
        const s = Math.floor(totalSeconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    },

    // Fills in {placeholders} from vars, so share text stays localizable —
    // a translation can reorder {date}/{steps}/{time} however it needs to.
    formatTemplate(template, vars = {}) {
        return template.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? vars[key] : match));
    },

    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            }
        } catch (e) { /* fall through to the legacy method below */ }
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(textarea);
            return ok;
        } catch (e) {
            return false;
        }
    },

    finishGame(levelOptions = {}, stats = {}) {
        const eventData = {
            gameId: this.gameId,
            levelOptions: levelOptions,
            stats: stats
        };
        if ((window.parent && window.parent !== window) || Utils.isEmbedded()) {
            window.parent.postMessage({ type: 'MICROGAME_COMPLETE', data: eventData }, '*');
        } else {
            console.log("Game Finished", eventData);
        }
    },

    // If it is inside an iframe
    isEmbedded() {
        return !!(window.parent && window.parent !== window);
    },

    getQueryParam(name) {
        try {
            return new URLSearchParams(window.location.search).get(name);
        } catch (e) {
            return null;
        }
    },

    notifyReady() {
        if (Utils.isEmbedded()) {
            window.parent.postMessage({ type: 'MICROGAME_READY' }, '*');
        }
    },

    notifyError(message) {
        if (Utils.isEmbedded()) {
            window.parent.postMessage({ type: 'MICROGAME_ERROR', data: { message } }, '*');
        }
    },

    listenForHostCommands(handlers = { onStartLevel: ()=>{} }) {
        if ((window.parent && window.parent !== window) || !Utils.isEmbedded()) return;
        if (!handlers) { return; }

        // In case css is different
        document.body.classList.add('is-embedded');

        window.addEventListener('message', (event) => {
            const msg = event.data || {};
            if (msg.type === 'MICROGAME_START_LEVEL' && typeof handlers.onStartLevel === 'function') {
                handlers.onStartLevel(msg.data || {});
            } else if (msg.type === 'MICROGAME_SET_MUTED') {
                const muted = !!(msg.data && msg.data.muted);
                Utils.setVolume(muted ? 0 : 1);
            }
        });

        window.addEventListener('error', (event) => {
            Utils.notifyError(event.message || 'Unknown error');
        });
    }
};