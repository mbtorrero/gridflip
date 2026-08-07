# Cómo crear un microjuego nuevo

Guía paso a paso. Si eres una IA, esto complementa a [`AGENTS.md`](AGENTS.md); si eres una persona, no necesitas saber programación avanzada para seguir esto — cada archivo es corto y el patrón se repite igual en los cuatro juegos existentes.

## Filosofía (léelo antes de empezar)

- **Cero servidor, cero build.** Todo se abre con doble clic sobre `index.html`. Si algo necesita `fetch()`, instalar paquetes, o un paso de compilación, está mal planteado.
- **Cada juego es una carpeta autocontenida.** No debe depender de archivos de OTRO juego (solo de los compartidos en la raíz: `theme.css`, `utils.js`).
- **Copia, no reinventes.** El punto de partida siempre es la carpeta [`TEMPLATE/`](TEMPLATE/), que ya es un juego completo y funcional (mecánica mínima: tocar la casilla marcada).

## Paso 0: antes de escribir código, pregunta

Si alguien pide "hazme un juego nuevo" (a una IA o a una persona), **no se empieza a programar con supuestos** — se pregunta primero lo que haga falta:

- **Nombre** del juego.
- **Descripción corta**: qué hace el jugador, en una frase.
- **Mecánica y dificultades**: cómo se juega, y en qué varía cada nivel de dificultad (¿tamaño?, ¿velocidad?, ¿distancia entre opciones?, ¿cuántos niveles hay?).
- **Selector de niveles**: ¿lo hay? ¿cuántas dificultades?
- **Estadísticas**: qué debe mostrar la pantalla de Stats (partidas completadas, mejor tiempo, mejor puntuación...).
- **Daily challenge**: ¿lo necesita este juego, o no? (no todos lo necesitan — SEQUENCE no lo tiene, y está bien así).

Dos reglas fijas del proyecto que **no se preguntan, se aplican siempre**, sin excepción:

- **Nunca hay vidas.** Ningún juego debe tener un sistema donde te quedas sin intentos y la partida termina en fallo. Un error se corrige, se repite la ronda, o simplemente se sigue — nunca "game over".
- **La pantalla de resultado es breve y concisa.** Al terminar un nivel se muestra un resumen corto de cómo le fue al jugador (tiempo, aciertos, rondas...) — nunca una lista larga ni texto de relleno.

## Paso a paso

### 1. Copia la plantilla

Copia toda la carpeta `TEMPLATE/` y ponle el nombre de tu juego en mayúsculas (mismo estilo que `GRIDFLIP`, `MATCHCOLOR`, `SEQUENCE`), por ejemplo `MEMORYGRID/`.

### 2. Renombra el juego por dentro

Dentro de tu carpeta nueva, cambia:
- `metadata.json`: campo `"id"` y `"name"`.
- `i18n/en_US.js`: claves `"NAME"` y `"TAGLINE"`.
- `index.js`: `id: 'MEMORYGRID'` en el objeto `Game`.
- `index.html`: el `<title>` y los `data-i18n="NAME"` (el texto de respaldo que aparece antes de que cargue el i18n).

### 3. Reemplaza la mecánica

Todo lo marcado `TODO` en `TEMPLATE/index.js` es lo único que tienes que sustituir: la generación de cada ronda y qué cuenta como "acierto". El resto (pantallas, modal de salir, modal de resultado, estadísticas, selección de dificultad) ya funciona sin tocarlo.

### 4. Ajusta las pantallas que necesites

Los seis archivos por juego, y para qué sirve cada uno:

| Archivo | Para qué |
|---|---|
| `index.html` | Las pantallas (loading/title/level/instructions/stats/game) + el modal de salir + el modal de resultado. |
| `index.js` | Un único objeto `Game` con toda la lógica: `init`, `startLevel`, el bucle de rondas, el render, los manejadores de click. |
| `styles.css` | Solo el layout específico de este juego. Todo lo compartido (botones, HUD, modales, tiles) ya está en `theme.css` — no lo dupliques. |
| `assets.js` | `window.assets = [...]` — lista de imágenes/fuentes/audio a precargar. `[]` si no hay ninguno. |
| `metadata.json` | `id`, `name`, `shortDescription`, `skills` (ver la lista completa de habilidades válidas en `GRIDFLIP/metadata.json`), `supportedLanguages`, `gamemodes`. |
| `i18n/en_US.js` | `window.lb = { CLAVE: "texto", ... }` — todos los textos de la interfaz, nunca texto suelto directo en el HTML/JS. |

Opcionales, solo si tu juego los necesita de verdad:
- `dailyChallenges.js` + modo diario: mira cómo lo hacen GRIDFLIP/MATCHCOLOR (una semilla derivada de la fecha, no un archivo que haya que actualizar cada día).
- `assets/img/`, `assets/audio/`: solo si el juego tiene imágenes o sonido propios.

### 5. Sigue las reglas de siempre (no son opcionales)

- El enlace de "volver a inicio" (la marca, arriba a la izquierda) **solo va en la pantalla de título**. Ninguna otra pantalla lo lleva.
- **Orden fijo de la topbar, igual en los cuatro juegos**: marca, salir (Quit + modal de confirmación), silenciar, idioma, info (instrucciones). Salir e info solo aparecen en la topbar de la pantalla de juego — la de título solo lleva marca/silenciar/idioma. Quit es la única forma de salir a mitad de partida y siempre vuelve a la pantalla de título de tu juego. Info abre `#instructions-modal` (mismo contenido que `#instructions-screen`, para no tener que salir a mitad de partida solo para consultarlo). `TEMPLATE/` ya trae los cuatro botones — no los quites ni cambies el orden.
- Si hay niveles de dificultad, la dificultad elegida es **fija durante todo el nivel** — nunca debe ir subiendo ronda a ronda dentro del mismo nivel.
- **Nunca debe salir una barra de scroll.** Usa `clamp(min, Xvmin, max)` para tamaños en CSS, o calcula tamaños en JS acotando por ancho Y alto (mira `sizeOptionsGrid` en `MATCHCOLOR/index.js` como ejemplo).
- Usa siempre las clases de `theme.css` (`.cf-button-primary`, `.cf-tile`, `.cf-hud-card`, `.cf-modal`, etc.) en vez de inventar estilos nuevos para cosas que ya existen.
- Iconos: SVG en línea, nunca emoji, en la interfaz. (Emoji sólo está bien dentro de un texto para compartir/copiar, si tu juego tiene esa función — ver `SHARE_TEMPLATE` en MATCHCOLOR).
- **Evita texto dentro del juego siempre que un visual sirva igual.** Por ejemplo, para mostrar en qué ronda vas usa las `.progress-dots` de `theme.css` (un punto gris por ronda, se pone verde con un check al completarla) en vez de un texto tipo "Ronda 3/8" — es más rápido de leer y no hay que traducirlo. `TEMPLATE/` ya lo hace así.
- Al terminar un nivel, muestra el `#result-modal` con algo relevante para tu juego (tiempo, aciertos, rondas...) — nunca vuelvas en silencio a la pantalla de título. Trae dos grupos de botones ya montados en `TEMPLATE/` (`#result-play-again-actions` y `#result-continue-actions`), que `Game.finishLevel` alterna según `levelOptions.daily`: nivel normal → PLAY AGAIN + EXIT; challenge diario → un único CONTINUE (solo hay un diario al día, no tiene sentido "jugar otra vez"). Si tu juego no tiene modo diario, deja siempre visible el de play-again (mira SEQUENCE).
- **Gate de contraseña y `noindex` temporales**: mientras el sitio esté en un GitHub Pages público (antes de desplegar con auth real en AWS, ver `DEPLOY.md`), cada `index.html` lleva un `<script>` embebido al inicio del `<head>` que pide una contraseña con `prompt()`, y una `<meta name="robots" content="noindex, nofollow">` para que no lo indexen buscadores. `TEMPLATE/index.html` ya trae ambos — cópialos tal cual, no los quites ni los muevas a `index.js`.

### 6. Pruébalo

No hace falta servidor: abre `TUJUEGO/index.html` directamente con doble clic o arrastrándolo a un navegador. Si algo no carga, revisa la consola del navegador — el error más común es un `fetch()` en vez de `Utils.loadScript` (fetch no funciona con `file://`).

Si editas JS, verifica que no tenga errores de sintaxis antes de probarlo:
```bash
node --check TUJUEGO/index.js
```

### 7. Añádelo al launcher

Abre el [`main.js`](main.js) de la raíz y añade una línea:
```js
{ id: 'MEMORYGRID', name: 'Memory Grid' },
```
Con eso ya aparece como tarjeta en el launcher (`index.html` de la raíz).

## Checklist final

- [ ] Carpeta renombrada, `id`/`NAME` actualizados en los 4 sitios (metadata, i18n, index.js, index.html).
- [ ] Mecánica reemplazada, pantallas de título/nivel/instrucciones/estadísticas funcionando.
- [ ] Solo la pantalla de título tiene el enlace de inicio; la topbar de la pantalla de juego mantiene el orden marca/salir/silenciar/idioma/info.
- [ ] Dificultad (si aplica) fija por nivel, no por ronda.
- [ ] Sin scroll en ningún tamaño de pantalla razonable.
- [ ] Modal de resultado muestra algo específico del juego, no un mensaje genérico vacío.
- [ ] Texto sustituido por visuales donde tenga sentido (rondas → `.progress-dots`, no texto).
- [ ] El `<script>` del gate de contraseña y la meta `noindex` siguen en el `<head>` del `index.html` (heredados de TEMPLATE).
- [ ] `node --check` sin errores en todos los `.js` del juego.
- [ ] Añadido a `main.js`.
