# CogniFit Micro Games

Lightweight cognitive games. Every game is plain HTML/CSS/JS — open its `index.html` directly in a browser (`file://` works, no server, no build step, no bundler). Keep it that way: don't introduce anything (npm, a framework, TypeScript, fetch-based data loading) that requires a build step or a server to run.

Related docs: [`AGENTS.md`](AGENTS.md) (guía para IAs, en español), [`CREATE_A_GAME.md`](CREATE_A_GAME.md) (cómo crear un juego nuevo, en español), [`DEPLOY.md`](DEPLOY.md) (despliegue en AWS para IT, en español).

## Start here to add a new game

1. Copy the [`TEMPLATE/`](TEMPLATE/) folder, rename it, and update `id`/`NAME` inside it (metadata.json, index.js, i18n). It's a complete, working game (a trivial "tap the marked tile" mechanic) — everything except the mechanic itself (marked `TODO`) already works: screens, topbar (mute + mid-game instructions), quit confirmation, result modal (play again / continue), stats, difficulty selection, embedding in the CogniFit feed.
2. Replace the `TODO`-marked mechanic in `index.js` with your own.
3. Add one line to root [`main.js`](main.js)'s `window.games` list so it shows up on the launcher ([`index.html`](index.html)).
4. Look at GRIDFLIP (simplest), MATCHCOLOR (rounds + difficulty + daily challenge + share), SEQUENCE (timed sequence + Web Audio), or MININONOGRAM (drag-to-paint + mark mode) for real examples of more involved mechanics.

## Adapting the style spec

`COGNIFIT_MINIGAME_STYLE_SPEC.md` describes the intended visual identity and product requirements. Its color/type/spacing/motion tokens and component language (HUD card, primary button, tile states, modals) are implemented as-is in [`theme.css`](theme.css).

Its section 13–16 (per-game TSX/config/logic/types/analytics files, a React shell, mandatory automated test suites, an 11-state machine with an analytics pipeline) is **not** followed — that assumes a build pipeline, which breaks "open `index.html` directly." Every game keeps a flat structure instead (see below).

## Folder structure (per game)

```
GAMENAME/
  index.html          screens (loading/title/level/instructions/stats/game), quit-modal, result-modal
                       links ../theme.css then styles.css
  index.js            a single `Game` object: init, level/round flow, rendering, event handlers
  styles.css          game-specific layout only — reuse theme.css classes for anything shared
  assets.js           window.assets = [{id, type, src, preload}, ...]  ([] if none)
  dailyChallenges.js  window.dailyChallenges = {}  (optional per-date overrides only; derive the rest from the date — see GRIDFLIP/MATCHCOLOR)
  metadata.json        id, name, shortDescription, skills, supportedLanguages, gamemodes
  i18n/en_US.js        window.lb = { KEY: "text", ... }
  assets/img, assets/audio   only if the game actually has images/sound
```

Root-level files: [`theme.css`](theme.css) and [`utils.js`](utils.js) (shared by every game), [`index.html`](index.html) + [`main.js`](main.js) (the launcher — a plain page, not a "game", so it doesn't follow the structure above).

## Shared pieces

- **`theme.css`** — design tokens (`--cf-*`, sized with `clamp(min, Xvmin, max)` so text/spacing/controls scale with whichever screen dimension is tighter — this is what lets every screen avoid ever needing to scroll) and reusable classes: `.cf-app`/`.screen` (`.cf-topbar` + `.cf-screen-body`), `.cf-brand`, `.cf-hud-card`, `.cf-icon-btn`, `.cf-button-primary`/`.cf-button-secondary`, `.cf-menu`, `.cf-level-select`/`.cf-level-grid` (multi-column level picker + full-width BACK row), `.cf-tile` (+ `.is-selected`/`.is-correct`/`.is-error`/`.is-disabled`), `.cf-modal-overlay`/`.cf-modal`. Link it before the game's own `styles.css` so the game can override.
- **`utils.js`** — asset loading (`Utils.loadScript/loadImage/loadFont/loadAudio/loadJSON`, `Utils.preloadAssets`), `Utils.loadLanguageBundle`/`Utils.applyLocalization` (handles `data-i18n` text and `data-i18n-aria` labels), `Utils.switchScreen`, `Utils.setBackground`, `Utils.playSound`/`Utils.setVolume`, `Utils.setupMuteButton`/`Utils.toggleMute` (the topbar mute button, persisted to `localStorage`), `Utils.setupSwipeForwarding` (see "Embedding in the CogniFit feed" below), `Utils.finishGame` (posts `MICROGAME_COMPLETE` to the parent frame), `Utils.formatTime(seconds)` (`"1:23"`), `Utils.formatTemplate(str, vars)` (fills `{placeholders}`, for localizable share text), `Utils.copyToClipboard(text)`. `Utils.loadJSON` uses `fetch`, which **fails under `file://`** — for anything that must work offline (i18n, daily challenges, level data), use `Utils.loadScript` assigning to a `window.*` global instead, same as every game already does.

## Conventions every game follows

- **Screens & scaling**: a screen is `.cf-topbar` (optional, normal flow) + `.cf-screen-body` (centers its content, `flex: 1 1 auto`). Anything meant to keep a fixed size inside `.cf-screen-body` needs `flex-shrink: 0` — a column flex container will shrink it toward zero before it shrinks text. `.screen` has `overflow: hidden` — there must never be a scrollbar, so size things with `clamp(min, Xvmin, max)` (or compute pixel sizes in JS bounded by both width and height, see MATCHCOLOR's `sizeOptionsGrid`) rather than assuming scroll will save you.
- **Top-left "home" link**: only the **title screen**'s brand mark is a link back to the root launcher (`../index.html`). No other screen has it — not level/instructions/stats, and *not* the game screen.
- **Topbar order is fixed, same on every game**: brand, exit (Quit icon-button + confirmation modal), mute, language, info (instructions). Exit and info only appear on the **game screen**'s topbar — title screen's topbar only has brand/mute/language. Quit is the only way to leave mid-game, and it always returns to **that game's own title screen**, never the launcher — don't add a second way to leave. Info opens `#instructions-modal`, the same content as `#instructions-screen` shown a second way so it's reachable without quitting first (see TEMPLATE for both).
- **Level selection is a grid**: `.cf-level-select > .cf-level-grid` (multi-column, auto-fit) for the level buttons, with BACK as its own full-width button below the grid, not inside it.
- **Difficulty is per level, not per round**: if a game has an EASY/MEDIUM/HARD/EXPERT choice, whatever that choice controls (color distance, sequence length, timing, whatever) must be **constant for every round within that level**. It must not ramp up round-by-round inside a single level — that's a real bug we hit once (see MATCHCOLOR's `DIFFICULTY_BY_OPTIONS`, computed once in `startLevel`, reused unchanged every round).
- **Quit confirmation**: `#quit-modal` + `Game.requestQuit/cancelQuit/confirmQuit`, never a bare "back" button mid-game.
- **Result modal**: on finishing a level, show `#result-modal` (don't just silently return to title screen) with whatever is meaningful for that game (time, taps, round-by-round dots, score — see GRIDFLIP/MATCHCOLOR). Its action buttons are two sets, toggled by `levelOptions.daily`: `#result-play-again-actions` (PLAY AGAIN + EXIT) for a normal level, `#result-continue-actions` (a single CONTINUE) for a daily challenge — there's only one of those per day, so replaying it doesn't make sense. Games with no daily mode at all (e.g. SEQUENCE) just always show play-again. If the run *was* a daily challenge, also add a "copy result" button building shareable text via `Utils.formatTemplate` from an i18n `SHARE_TEMPLATE` key (so translations can reorder `{placeholders}`) and `Utils.copyToClipboard`.
- **Stats**: persist to `localStorage['<GAME_ID>/stats']`, read back with `JSON.parse(localStorage.getItem(...)) || {}` — mind the exact casing (`getItem`, not `getitem`); that typo previously broke GRIDFLIP on every load.
- **Daily challenges** (optional): derive from the date (seeded PRNG or day-of-year index — see GRIDFLIP/MATCHCOLOR) rather than requiring a new hand-authored entry every day. `dailyChallenges.js` is only for optional curated overrides on specific dates. Don't add a daily mode if it doesn't make sense for the mechanic (SEQUENCE has none, on purpose).
- **`metadata.json`**'s `skills`/`supportedLanguages`/`gamemodes` enums are documented once, in `GRIDFLIP/metadata.json` — don't repeat the full lists in every game.
- **Sound**: optional and non-essential (everything must also be conveyed visually). Either synthesize short tones with the Web Audio API (see SEQUENCE's `playTone` — no files needed) or ship short WAV files under `assets/audio/` loaded via `assets.js` (`type: "audio"`) and played with `Utils.playSound(window.audio.<id>)`. Either way, keep it simple and pleasant — no external audio libraries.
- **Icons**: inline SVG (line icons, `stroke="currentColor"`), never emoji, in the UI itself. Emoji are fine *only* inside plain-text share strings (e.g. 🟢/🔴 in MATCHCOLOR's share text), since that's the one context where color can't otherwise be conveyed in plain text.

## Embedding in the CogniFit feed

Every game can also run embedded in an `<iframe>` inside the CogniFit app's feed, not just standalone from the root launcher. `Utils.isEmbedded()` (true only inside an iframe with a different parent) gates all of the following — none of it does anything when a game is opened standalone, so you don't need to think about it while just adding a game; it comes for free from `TEMPLATE`. The postMessage contract, all handled in `utils.js`:

- **Host → game**: `MICROGAME_START_LEVEL` (calls the `onStartLevel` callback passed to `Utils.listenForHostCommands`), `MICROGAME_SET_MUTED`, `MICROGAME_SET_PADDINGS` (`{top, right, bottom, left}` in px — overrides the `--cf-pad-*` vars in `theme.css` that `.cf-app`/`.screen` pad by, so the game's own content clears whatever the host draws on top of it, e.g. its HUD or bottom nav bar; only the sides passed in are touched, the rest keep their own safe-area default).
- **Game → host**: `MICROGAME_READY` (once, from `Utils.notifyReady()` at the end of `init`), `MICROGAME_LEVEL_STARTED`/`MICROGAME_LEVEL_EXITED` (fired automatically by `Utils.switchScreen` around the `'game-screen'` transition every game already uses — no game-specific code needed), `MICROGAME_COMPLETE` (`Utils.finishGame`), `MICROGAME_ERROR`, `MICROGAME_TOUCH_START`/`MICROGAME_TOUCH_MOVE`/`MICROGAME_TOUCH_END` (`Utils.setupSwipeForwarding` — the host's own swipe-to-scroll can't see touches that land inside this iframe, so touches starting on an element with no click/pointer handler of its own are forwarded as raw coordinates; touches on a button, tile, or anything else with its own handler are left alone, so a game's own drag interactions, e.g. Mini Nonogram's paint-drag, are never affected by this).

Call `Utils.setupSwipeForwarding()` once from `init`, same as `Utils.setupMuteButton()` — `TEMPLATE` already does both.

## Games

- **GRIDFLIP** — flip tiles so they all match; flipping one flips its neighbors too. Simplest example; good first read.
- **MATCHCOLOR** — tap the swatch matching the target color, distractors get closer in hue/saturation/lightness the higher the difficulty (fixed per level, not per round). Good example of: rounds, per-round result dots reused in both the HUD and the result modal, daily challenge, share text.
- **SEQUENCE** — Simon-style: watch a sequence of directions flash (distinct Web Audio tone per direction), then tap them back on a 4-direction pad. One shared row of slots both reveals the sequence and confirms input. Good example of: timed playback via `setTimeout`, whole-control-group feedback animations (flash + shake), no daily mode, mistake counter shown on the result modal.
- **MININONOGRAM** — reveal a hidden picture by painting grid cells using row/column number clues, with a mark mode for flagging cells you're sure are empty. Good example of: drag-to-paint spanning multiple cells (`pointermove` + `elementFromPoint`, not relying on the element the drag started on), a toggle button (`aria-pressed`), daily challenge.
- **TEMPLATE** — not a real game; the starting skeleton for a new one (see above). Not listed in `main.js`'s launcher list.
