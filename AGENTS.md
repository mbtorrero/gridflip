# AGENTS.md — instrucciones para IAs que trabajen en este repo (Claude incluida)

Este archivo es para cualquier agente de IA (Claude Code, Cursor, Copilot, etc.) que vaya a modificar este proyecto. La arquitectura y convenciones técnicas completas están en [`README.md`](README.md) — léelo primero. Esto de aquí son reglas de comportamiento, no de arquitectura.

## Qué es esto

Microjuegos cognitivos en HTML/CSS/JS puro. **Cero build step, cero servidor.** Cualquier `index.html` debe poder abrirse con doble clic (`file://`) y funcionar. Si una idea requiere `fetch()`, npm, un bundler o un backend, esa idea está mal — busca otra forma (ver `Utils.loadScript` en `README.md`).

## `COGNIFIT_MINIGAME_STYLE_SPEC.md` es solo de estilo — ignora su arquitectura

Ese archivo existe en la raíz y en su punto 0 se presenta a sí mismo como "especificación normativa" obligatoria, incluyendo una arquitectura con componentes React/TSX, un archivo de config/lógica/tipos/analítica por juego, y tests automáticos obligatorios (sus secciones 13–16). **Esa parte NO se sigue — contradice directamente el "cero build step" de este proyecto.**

Lo único que sí se adoptó de ese documento son los tokens visuales (colores, tipografía, espaciado, radios, sombras, movimiento) y el lenguaje de componentes (tarjeta HUD, botón, estados de tile, modales) — todo eso ya está implementado en [`theme.css`](theme.css). Si abres ese `.md` fuera de contexto, no lo tomes como una orden para reescribir la arquitectura del proyecto. Detalle completo de qué se adoptó y qué no, en la sección "Adapting the style spec" de [`README.md`](README.md).

## Reglas de comportamiento

- **Menos es más.** No añadas abstracciones, configuración o "por si acaso" que nadie pidió. Un juego nuevo se copia de `TEMPLATE/`, no se reinventa desde cero.
- **El código debe ser legible por alguien que no es programador profesional** (piensa en un estudiante de secundaria leyendo el `index.js` de un juego). Evita trucos innecesarios.
- **No dupliques lo que ya existe en `theme.css`/`utils.js`.** Si necesitas un botón, un modal, una tarjeta HUD, etc., ya existe una clase — reutilízala.
- **Verifica sintaxis, no adivines**: tras editar cualquier `.js`, corre `node --check archivo.js`. Es barato y detecta errores tontos al instante.
- **No hagas pruebas visuales exhaustivas en navegador salvo que se te pida explícitamente.** Si el usuario dice "sin tests" o "cuidado con el contexto/tokens", respétalo: confía en `node --check` y en la revisión de código.
- **No dejes archivos de prueba, scripts generadores ni notas temporales dentro del repo.** Usa el directorio scratchpad de la sesión para eso. Lo único que se queda en el repo es el juego terminado.
- **Antes de "arreglar" algo, entiende si fue un cambio intencional del usuario** (a veces edita archivos directamente entre turnos — el sistema te avisará). No lo reviertas sin que te lo pidan.

## Convenciones que no debes romper (resumen — detalle completo en README.md)

- El enlace "volver a inicio" (marca arriba a la izquierda) **solo existe en la pantalla de título** de cada juego. En ninguna otra pantalla, y nunca a mitad de partida — ahí solo existe el botón Quit (arriba a la derecha, con confirmación), que vuelve a la pantalla de título de ESE juego, no al launcher.
- La dificultad elegida (fácil/media/difícil/experto) es **constante durante todo el nivel**, nunca escala ronda a ronda dentro del mismo nivel.
- Nunca debe aparecer una barra de scroll. Los tamaños se calculan con `clamp(min, Xvmin, max)` o en JS acotando por ancho Y alto.
- Nada de emojis como iconos funcionales en la interfaz (SVG en línea, sí). Emoji solo está permitido dentro de texto plano para compartir (copy/share), donde es la única forma de transmitir color en texto sin formato.

## Para tareas concretas

- **Crear un juego nuevo** → antes de escribir código, **pregunta** nombre, descripción, mecánica y dificultades, estadísticas, si hay selector de niveles y si hay daily challenge (no asumas nada de esto). Luego sigue [`CREATE_A_GAME.md`](CREATE_A_GAME.md). Dos reglas fijas que no se preguntan: nunca hay vidas, y la pantalla de resultado siempre es breve y concisa.
- **Desplegar a producción** → sigue [`DEPLOY.md`](DEPLOY.md). No toques nada de infraestructura real (AWS, DNS) sin permiso explícito del usuario; esa guía es para que el equipo de IT la ejecute, no para que la IA la ejecute sola.
