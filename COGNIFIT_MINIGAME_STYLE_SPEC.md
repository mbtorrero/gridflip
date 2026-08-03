---
title: "CogniFit Micro Games — Especificación de Diseño e Implementación"
version: "1.0"
language: "es"
status: "Canonical"
audience: "Claude Code, Codex, Cursor, Copilot y cualquier IA que programe nuevos microjuegos CogniFit"
---

# CogniFit Micro Games — Especificación de Diseño e Implementación

## 0. Instrucción principal para la IA

Al programar un nuevo microjuego de CogniFit, **debes respetar este documento como una especificación normativa**. El objetivo es que todos los juegos parezcan parte del mismo ecosistema aunque cambien la mecánica, las reglas, los estímulos o la habilidad cognitiva entrenada. Este documento está desfasado a nivel de qué tiene que tener cada juego, pero tiene buenas guías para estilos y colores.

Interpreta las palabras de esta forma:

- **DEBE / MUST**: obligatorio.
- **NO DEBE / MUST NOT**: prohibido.
- **DEBERÍA / SHOULD**: recomendado salvo motivo técnico claro.
- **PUEDE / MAY**: opcional.

No improvises un lenguaje visual nuevo. No sustituyas los tokens definidos aquí por colores o estilos “parecidos”. Si una decisión visual no está especificada, utiliza el patrón ya definido en este documento y prioriza: **claridad, accesibilidad, coherencia CogniFit, foco cognitivo y sensación premium**.

---

# 1. Objetivo del sistema visual

Cada microjuego debe transmitir simultáneamente:

1. **Salud cognitiva y ciencia**: precisión, confianza, estructura y claridad.
2. **Juego atractivo**: recompensa visual, energía y sensación de progreso.
3. **Tecnología premium**: profundidad, luz, gradientes y animaciones suaves.
4. **Accesibilidad para usuarios 50+**: textos grandes, controles evidentes, contraste alto y ausencia de ruido visual.
5. **Coherencia de producto**: un usuario debe reconocer inmediatamente que el juego pertenece a CogniFit.

La interfaz no debe parecer un casino, un juego infantil, una app genérica de puzzles ni una experiencia cyberpunk agresiva.

---

# 2. Principios visuales obligatorios

## 2.1. Jerarquía

La prioridad visual siempre será:

1. Área de juego y estímulos.
2. Acción principal del momento.
3. Información esencial del HUD: puntuación, nivel, intentos, tiempo o progreso.
4. Nombre y objetivo del juego.
5. Ajustes, ayuda y salida.

El logo y la decoración nunca deben competir con el área de juego.

## 2.2. Foco

- Debe existir **un único foco visual principal por estado**.
- Los elementos activos deben destacar mediante brillo, cambio de elevación y contraste.
- Los elementos secundarios deben tener menos luminosidad y menor saturación.
- El fondo debe acompañar, nunca distraer.

## 2.3. Sensación general

- Premium, tecnológica, científica y amable.
- Profundidad mediante capas translúcidas, sombras y luces suaves.
- Bordes redondeados consistentes.
- Iconografía limpia y monolineal.
- Animaciones cortas, predecibles y no agresivas.

---

# 3. Design tokens canónicos

## 3.1. Colores

Usar estos valores como base. No crear variaciones arbitrarias.

```css
:root {
  /* Fondos */
  --cf-bg-950: #020B2D;
  --cf-bg-900: #06164A;
  --cf-bg-850: #071B63;
  --cf-bg-panel: rgba(7, 25, 79, 0.78);
  --cf-bg-panel-strong: rgba(6, 20, 66, 0.92);
  --cf-bg-overlay: rgba(2, 8, 34, 0.66);

  /* Marca y acciones */
  --cf-blue-500: #2F6BFF;
  --cf-blue-400: #4F82FF;
  --cf-cyan-400: #27D7FF;
  --cf-cyan-300: #5CE7FF;
  --cf-violet-500: #8E5BFF;
  --cf-violet-400: #A36CFF;

  /* Recompensa y éxito */
  --cf-gold-500: #FFC83D;
  --cf-gold-400: #FFD75F;
  --cf-success-500: #35D07F;

  /* Error y advertencia */
  --cf-error-500: #FF5E6C;
  --cf-warning-500: #FF9F43;

  /* Texto */
  --cf-text-primary: #F7FAFF;
  --cf-text-secondary: #B8C5E8;
  --cf-text-muted: #7F90B9;
  --cf-text-dark: #07112F;

  /* Líneas y superficies */
  --cf-border-soft: rgba(126, 159, 255, 0.22);
  --cf-border-medium: rgba(111, 150, 255, 0.42);
  --cf-white-08: rgba(255,255,255,0.08);
  --cf-white-12: rgba(255,255,255,0.12);
  --cf-white-18: rgba(255,255,255,0.18);
}
```

## 3.2. Gradientes

```css
:root {
  --cf-gradient-page:
    radial-gradient(circle at 20% 15%, rgba(47,107,255,.22), transparent 32%),
    radial-gradient(circle at 85% 75%, rgba(142,91,255,.20), transparent 36%),
    linear-gradient(180deg, #06164A 0%, #020B2D 100%);

  --cf-gradient-primary:
    linear-gradient(100deg, #7049F7 0%, #2F6BFF 52%, #27D7FF 100%);

  --cf-gradient-purple-card:
    linear-gradient(145deg, #6D39D8 0%, #3A1C91 100%);

  --cf-gradient-gold-card:
    linear-gradient(145deg, #FFCA2E 0%, #C97800 100%);

  --cf-gradient-panel:
    linear-gradient(180deg, rgba(13,35,105,.92) 0%, rgba(4,16,57,.88) 100%);
}
```

## 3.3. Tipografía

```css
:root {
  --cf-font-ui: Inter, "SF Pro Display", "SF Pro Text", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

Normas:

- Todo el texto de interfaz debe usar `--cf-font-ui`.
- El logotipo debe utilizar el asset oficial de CogniFit. **No recrear el logotipo con una fuente.**
- Títulos: peso 700–800.
- Texto de interfaz: peso 400–600.
- Métricas: peso 700, números tabulares cuando sea posible.
- Evitar mayúsculas sostenidas en títulos largos.

Escala recomendada:

```css
:root {
  --cf-type-display: clamp(32px, 4vw, 48px);
  --cf-type-h1: clamp(26px, 3vw, 36px);
  --cf-type-h2: clamp(22px, 2.4vw, 30px);
  --cf-type-body-lg: clamp(18px, 2vw, 22px);
  --cf-type-body: clamp(16px, 1.7vw, 19px);
  --cf-type-label: clamp(13px, 1.3vw, 16px);
  --cf-type-metric: clamp(24px, 3vw, 38px);
}
```

Para usuarios 50+:

- Texto funcional mínimo: **16 px**.
- Texto principal: **18 px o más**.
- Botón principal: **18–22 px**, peso 700.
- No usar textos finos por debajo de 400 de peso.

## 3.4. Espaciado

Usar una escala de 4 px.

```css
:root {
  --cf-space-1: 4px;
  --cf-space-2: 8px;
  --cf-space-3: 12px;
  --cf-space-4: 16px;
  --cf-space-5: 20px;
  --cf-space-6: 24px;
  --cf-space-8: 32px;
  --cf-space-10: 40px;
  --cf-space-12: 48px;
  --cf-space-16: 64px;
}
```

## 3.5. Bordes y radios

```css
:root {
  --cf-radius-sm: 10px;
  --cf-radius-md: 16px;
  --cf-radius-lg: 24px;
  --cf-radius-xl: 32px;
  --cf-radius-pill: 999px;
}
```

Reglas:

- Paneles HUD: 16–20 px.
- Cartas de juego: 18–24 px.
- Botón principal: forma píldora o radio mínimo de 22 px.
- Modales: 24–32 px.

## 3.6. Sombras y luminosidad

```css
:root {
  --cf-shadow-panel:
    0 14px 40px rgba(0, 6, 35, .42),
    inset 0 1px 0 rgba(255,255,255,.10);

  --cf-shadow-blue:
    0 0 0 1px rgba(79,130,255,.65),
    0 0 22px rgba(47,107,255,.38),
    0 12px 30px rgba(0,0,0,.34);

  --cf-shadow-purple:
    0 0 0 1px rgba(177,111,255,.78),
    0 0 22px rgba(142,91,255,.45),
    0 12px 26px rgba(0,0,0,.35);

  --cf-shadow-gold:
    0 0 0 1px rgba(255,214,80,.90),
    0 0 24px rgba(255,190,30,.55),
    0 12px 26px rgba(0,0,0,.35);
}
```

Los brillos deben ser visibles pero suaves. Nunca usar neón excesivo que reduzca la legibilidad.

---

# 4. Estructura obligatoria de pantalla

Todos los microjuegos deben compartir esta arquitectura conceptual:

```text
MicroGameShell
├── TopBar
│   ├── CogniFitBrand
│   ├── GameIdentity
│   ├── HUDSummary
│   └── SettingsButton
├── MainGameArea
│   ├── InstructionOrCurrentGoal
│   ├── Playfield
│   └── ContextualFeedback
├── PrimaryActionArea
│   └── PrimaryCTA
└── OptionalLayers
    ├── PauseModal
    ├── HelpModal
    ├── ResultModal
    └── TutorialOverlay
```

## 4.1. Cabecera

La cabecera debe incluir:

- Logo oficial de CogniFit o marca compacta.
- Nombre del juego.
- Descripción corta del objetivo, máximo 70 caracteres.
- HUD con 2–4 métricas relevantes.
- Botón de ajustes o pausa.

No mostrar más de cuatro métricas simultáneas.

Ejemplos de métricas válidas:

- Puntos.
- Nivel.
- Intentos o vidas.
- Tiempo restante.
- Ronda actual.
- Precisión.
- Progreso.

## 4.2. Área de juego

- Debe ocupar la mayor parte de la pantalla.
- Debe estar visualmente centrada.
- Debe quedar libre de elementos decorativos superpuestos.
- Debe mantener una zona de seguridad mínima de 16 px en móvil y 32 px en escritorio.
- Debe escalar sin perder proporciones ni provocar scroll horizontal.

## 4.3. Acción principal

- Solo debe existir **una acción primaria por pantalla**.
- Debe usar el gradiente `--cf-gradient-primary`.
- Debe tener alto mínimo de 56 px en móvil y 60 px en escritorio.
- Debe incluir verbo claro: `Continuar`, `Empezar`, `Confirmar`, `Siguiente`, `Repetir nivel`.
- No usar `OK`, `Go`, `Quit` ni etiquetas ambiguas.

## 4.4. Salida, pausa y ajustes

- Deben colocarse en la parte superior derecha.
- El icono debe medir al menos 24 px dentro de un área táctil mínima de 48×48 px.
- Salir durante una partida debe pedir confirmación si se perderá progreso.
- Nunca usar un botón rojo grande permanente para salir de una partida.

---

# 5. Componentes canónicos

## 5.1. Panel HUD

```css
.cf-hud-card {
  background: var(--cf-gradient-panel);
  border: 1px solid var(--cf-border-soft);
  border-radius: var(--cf-radius-md);
  box-shadow: var(--cf-shadow-panel);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
```

Cada panel debe contener:

- Etiqueta breve en texto secundario.
- Valor principal grande.
- Icono simple opcional.
- Máximo dos niveles de información.

## 5.2. Carta o ficha interactiva

Estados obligatorios:

### Normal

- Fondo violeta oscuro.
- Borde violeta medio.
- Sombra moderada.

### Hover / focus

- Elevación ligera.
- Borde más luminoso.
- Escala máxima `1.02`.

### Seleccionada

- Brillo violeta o azul.
- Borde de 2 px.
- Indicador inequívoco, no dependiente solo del color.

### Acierto / coincidencia

- Fondo dorado.
- Brillo cálido.
- Animación breve de pulso.
- Icono o patrón de confirmación.

### Error

- Destello rojo muy breve.
- Sacudida máxima de 4 px.
- Nunca dejar la carta roja permanentemente.

### Deshabilitada

- Opacidad entre 0.35 y 0.55.
- Sin brillo.
- Cursor y semántica de deshabilitado.

## 5.3. Botón principal

```css
.cf-button-primary {
  min-height: 56px;
  padding: 0 28px;
  border: 1px solid rgba(117, 225, 255, .75);
  border-radius: var(--cf-radius-pill);
  background: var(--cf-gradient-primary);
  color: var(--cf-text-primary);
  font: 700 var(--cf-type-body-lg) / 1 var(--cf-font-ui);
  box-shadow:
    0 0 24px rgba(39, 215, 255, .30),
    0 12px 28px rgba(0,0,0,.35),
    inset 0 1px 0 rgba(255,255,255,.20);
}
```

Estados:

- Hover: subir 1–2 px y aumentar brillo un 10 %.
- Active: escala `0.98` durante 80–120 ms.
- Focus visible: anillo externo de 3 px cian.
- Disabled: opacidad 0.45, sin glow, sin movimiento.

## 5.4. Botón secundario

- Fondo transparente o panel oscuro.
- Borde azul suave.
- Texto blanco o azul claro.
- Sin competir con la acción principal.

## 5.5. Modales

- Fondo de la pantalla atenuado con `--cf-bg-overlay`.
- Panel central con alto contraste.
- Título directo.
- Máximo dos acciones.
- Botón primario a la derecha en escritorio y abajo en móvil.
- Cierre accesible mediante botón, teclado y lector de pantalla.

---

# 6. Fondos y decoración

El fondo debe construirse con capas, no con fotografías aleatorias.

Capas recomendadas:

1. Gradiente azul marino oscuro.
2. Uno o dos halos radiales azules/violetas.
3. Patrón sutil de nodos neuronales o líneas cognitivas.
4. Ondas luminosas abstractas en bordes o zona inferior.

Reglas:

- Opacidad de patrones decorativos: 5–16 %.
- No colocar decoración detrás de textos pequeños.
- Evitar fondos temáticos literales que rompan la coherencia entre juegos.
- La temática del juego debe expresarse principalmente mediante estímulos y assets del playfield, no mediante una fotografía de fondo.

---

# 7. Iconografía

- Estilo lineal o duotono simple.
- Grosor visual coherente, equivalente a 1.75–2.25 px a 24 px.
- Esquinas redondeadas.
- Usar SVG, no emojis.
- Tamaño estándar: 20, 24 o 32 px.
- Los iconos nunca deben sustituir etiquetas esenciales sin tooltip o texto accesible.

Iconos recurrentes:

- Cerebro / habilidad cognitiva.
- Ajustes.
- Pausa.
- Información.
- Sonido.
- Tiempo.
- Nivel.
- Puntos.
- Intentos.
- Repetir.
- Continuar.

---

# 8. Animación y feedback

## 8.1. Duraciones

```css
:root {
  --cf-motion-fast: 120ms;
  --cf-motion-base: 200ms;
  --cf-motion-slow: 320ms;
  --cf-ease-standard: cubic-bezier(.2,.8,.2,1);
}
```

## 8.2. Reglas

- Interacción táctil: 80–150 ms.
- Cambio de estado: 150–250 ms.
- Entrada de modal: 200–320 ms.
- Resultado o recompensa: máximo 600 ms.
- Nunca bloquear la siguiente interacción por una animación decorativa larga.
- Respetar `prefers-reduced-motion`.

## 8.3. Feedback correcto

Acierto:

- Brillo dorado o verde.
- Pequeño pulso.
- Sonido breve opcional.
- Confirmación visual inmediata.

Error:

- Destello rojo breve.
- Vibración o sonido suave opcional.
- Mensaje neutral, nunca punitivo.

Ejemplos de microcopy:

- `¡Bien!`
- `Correcto`
- `Sigue así`
- `Inténtalo de nuevo`
- `Mira con atención`

No usar mensajes humillantes, infantiles o agresivos.

---

# 9. Sonido y vibración

- El sonido debe ser opcional y controlable.
- Mantener un botón de sonido accesible desde ajustes o pausa.
- Los sonidos deben ser breves, suaves y no estridentes.
- No depender del sonido para comunicar información esencial.
- La vibración debe ser corta y opcional.
- Respetar la configuración del sistema cuando sea posible.

---

# 10. Accesibilidad obligatoria

## 10.1. Contraste

- Texto normal: ratio mínimo 4.5:1.
- Texto grande: ratio mínimo 3:1.
- Controles y estados: ratio mínimo 3:1 respecto al fondo.

## 10.2. Tacto y puntero

- Área táctil mínima: 48×48 px.
- Separación recomendada entre controles: 8 px.
- No requerir precisión excesiva para usuarios 50+.

## 10.3. Estados no dependientes del color

Cada estado debe expresarse mediante al menos dos señales:

- Color + icono.
- Color + borde.
- Color + texto.
- Color + animación.

## 10.4. Lectores de pantalla

- Todos los botones deben tener nombre accesible.
- Las cartas deben anunciar posición, estado y contenido cuando corresponda.
- Los cambios de puntuación o resultado deben anunciarse mediante región viva sin interrumpir al usuario.
- El orden de tabulación debe seguir el orden visual.

## 10.5. Teclado

En web o escritorio:

- Todo debe poder operarse con teclado.
- `Enter` o `Space` activa el elemento enfocado.
- `Escape` pausa o cierra un modal, sin perder datos accidentalmente.
- El foco debe ser claramente visible.

---

# 11. Responsive y dispositivos

## 11.1. Mobile portrait / iPhone

Orden recomendado:

1. Safe area superior.
2. Marca compacta y ajustes.
3. Identidad del juego.
4. HUD en una fila de 2–3 columnas o carrusel no necesario.
5. Área de juego.
6. Botón principal.
7. Safe area inferior.

Reglas:

- Usar `env(safe-area-inset-top)` y `env(safe-area-inset-bottom)`.
- No colocar controles bajo el notch, Dynamic Island o indicador de inicio.
- Evitar scroll durante la ronda principal siempre que sea posible.
- El playfield debe adaptarse al ancho disponible con `min()` y `clamp()`.
- En pantallas estrechas, reducir decoración antes que reducir textos o controles.

Ejemplo:

```css
.cf-app {
  min-height: 100dvh;
  padding-top: max(16px, env(safe-area-inset-top));
  padding-bottom: max(18px, env(safe-area-inset-bottom));
}

.cf-playfield {
  width: min(92vw, 620px);
  aspect-ratio: var(--game-aspect-ratio, 1 / 1);
}
```

## 11.2. Tablet

- Aumentar el área de juego.
- Mantener HUD compacto.
- No expandir textos hasta líneas excesivamente largas.

## 11.3. Desktop / landscape

- Cabecera horizontal con marca, identidad, HUD y ajustes.
- Área de juego centrada.
- Máximo ancho recomendado del contenido: 1440 px.
- Mantener márgenes laterales amplios y fondo decorativo visible.
- El playfield debe seguir siendo el foco, no la cabecera.

---

# 12. Localización y texto

- Todos los textos deben estar externalizados en archivos de traducción.
- No introducir textos directamente dentro de componentes visuales.
- Preparar la interfaz para textos un 35 % más largos.
- Evitar anchuras rígidas basadas en español o inglés.
- Utilizar números y fechas según locale.
- Evitar abreviaturas no explicadas.

Ejemplo de claves:

```json
{
  "game.title": "Memoria visual",
  "game.subtitle": "Encuentra y recuerda los pares",
  "hud.score": "Puntos",
  "hud.level": "Nivel",
  "hud.attempts": "Intentos",
  "actions.continue": "Continuar",
  "actions.pause": "Pausar",
  "actions.exit": "Salir"
}
```

---

# 13. Arquitectura técnica recomendada

La IA debe separar visuales, lógica y configuración.

```text
src/
├── microgames/
│   └── <game-id>/
│       ├── Game.tsx
│       ├── game.config.ts
│       ├── game.logic.ts
│       ├── game.types.ts
│       ├── game.i18n.json
│       ├── game.analytics.ts
│       ├── components/
│       ├── assets/
│       └── tests/
├── design-system/
│   ├── tokens.css
│   ├── MicroGameShell.tsx
│   ├── HudCard.tsx
│   ├── PrimaryButton.tsx
│   ├── GameModal.tsx
│   └── GameCard.tsx
└── shared/
```

Obligatorio:

- Los tokens globales deben estar centralizados.
- No duplicar CSS de botones, HUD, modales o cabeceras en cada juego.
- La mecánica debe estar desacoplada de la presentación.
- La dificultad debe configurarse mediante datos, no mediante estilos hardcoded.
- Las métricas y eventos deben usar nombres consistentes.

---

# 14. Contrato de configuración del juego

Cada juego debería exponer una configuración similar a esta:

```ts
export interface CogniFitMicroGameConfig {
  id: string;
  titleKey: string;
  subtitleKey: string;
  cognitiveSkills: string[];
  theme: {
    accent: "blue" | "violet" | "cyan" | "gold";
    playfieldAspectRatio: `${number} / ${number}`;
  };
  hud: Array<"score" | "level" | "attempts" | "timer" | "progress" | "accuracy">;
  accessibility: {
    supportsKeyboard: boolean;
    supportsReducedMotion: boolean;
    hasNonColorStateIndicators: boolean;
  };
  difficulty: {
    initialLevel: number;
    maxLevel: number;
    adaptive: boolean;
  };
}
```

La configuración puede variar por stack, pero debe conservar estos conceptos.

---

# 15. Estados mínimos de un microjuego

Todo juego debe implementar explícitamente:

```text
idle
instructions
ready
playing
paused
roundSuccess
roundFailure
levelComplete
gameComplete
exiting
error
```

Cada estado debe tener:

- UI definida.
- Acción primaria definida.
- Comportamiento de pausa/salida definido.
- Eventos analíticos definidos.
- Comportamiento accesible definido.

---

# 16. Analítica mínima

Eventos recomendados:

```text
microgame_viewed
microgame_started
microgame_instructions_opened
microgame_round_started
microgame_action_performed
microgame_round_completed
microgame_level_completed
microgame_paused
microgame_resumed
microgame_exited
microgame_completed
microgame_error
```

Propiedades sugeridas:

```json
{
  "game_id": "visual-memory-pairs",
  "session_id": "...",
  "level": 3,
  "difficulty": "adaptive",
  "score": 1250,
  "accuracy": 0.84,
  "reaction_time_ms": 740,
  "duration_ms": 92000,
  "attempts_remaining": 2,
  "locale": "es-ES",
  "device_type": "mobile"
}
```

No incluir datos personales innecesarios.

---

# 17. Qué debe repetirse en todos los juegos

- Fondo azul marino con profundidad y decoración cognitiva sutil.
- Paleta azul, cian y violeta con dorado para recompensa.
- Misma familia tipográfica.
- Misma cabecera o `MicroGameShell`.
- Mismo sistema HUD.
- Mismo botón principal.
- Mismos radios, sombras y brillos.
- Misma iconografía.
- Mismo lenguaje de feedback.
- Mismo comportamiento de pausa, ayuda y salida.
- Misma accesibilidad.
- Misma estructura de localización.
- Misma instrumentación analítica.

---

# 18. Qué puede variar entre juegos

- Mecánica cognitiva.
- Tipo y forma de los estímulos.
- Distribución interna del playfield.
- Número de rondas.
- Reglas de puntuación.
- Habilidad o habilidades entrenadas.
- Tema abstracto de los assets.
- Acento secundario dentro de la paleta permitida.
- Tipo de feedback contextual necesario.

La variación debe ocurrir dentro del playfield, no reinventando la aplicación completa.

---

# 19. Prohibiciones

Un microjuego CogniFit **NO DEBE**:

- Usar fondos fotográficos recargados.
- Usar colores fuera de la paleta sin aprobación.
- Usar tipografías decorativas.
- Usar emojis como iconos funcionales.
- Crear botones con estilos nuevos.
- Mostrar más de una acción primaria.
- Usar textos por debajo de 16 px.
- Depender solo del color para comunicar estados.
- Utilizar animaciones parpadeantes, bruscas o excesivas.
- Mostrar mensajes de error agresivos.
- Parecer infantil o caricaturesco salvo que el producto sea explícitamente infantil.
- Copiar interfaces de casino, slots o juegos de apuestas.
- Poner decoración por encima del contenido cognitivo.
- Introducir scroll horizontal.
- Ocultar controles bajo safe areas.
- Hardcodear textos o niveles de dificultad dentro del componente visual.
- Duplicar el sistema de diseño en cada juego.

---

# 20. Checklist de aceptación visual

Antes de considerar terminado un juego, la IA debe verificar:

## Marca y estilo

- [ ] Se reconoce inmediatamente como parte de CogniFit.
- [ ] Usa exclusivamente los tokens de color definidos.
- [ ] Usa la tipografía y pesos establecidos.
- [ ] Usa el mismo patrón de cabecera, HUD, botones y modales.

## Jerarquía

- [ ] El playfield es el foco principal.
- [ ] Solo hay una acción primaria.
- [ ] Las métricas no compiten con la tarea.
- [ ] La decoración no distrae.

## Responsive

- [ ] Funciona en iPhone pequeño y grande.
- [ ] Respeta notch, Dynamic Island y safe areas.
- [ ] Funciona en tablet y desktop.
- [ ] No hay scroll horizontal ni elementos cortados.

## Accesibilidad

- [ ] Texto mínimo de 16 px.
- [ ] Controles de 48×48 px o mayores.
- [ ] Contraste suficiente.
- [ ] Navegación por teclado.
- [ ] Lector de pantalla.
- [ ] Estados no dependientes solo del color.
- [ ] Soporta reducción de movimiento.

## Interacción

- [ ] Feedback de acierto inmediato y gratificante.
- [ ] Feedback de error suave y claro.
- [ ] Pausa, reanudación y salida funcionan.
- [ ] No se pierde progreso sin confirmación.
- [ ] Las animaciones no bloquean la partida.

## Ingeniería

- [ ] Componentes compartidos reutilizados.
- [ ] Lógica desacoplada de UI.
- [ ] Textos localizados.
- [ ] Tests de estados principales.
- [ ] Analítica implementada.
- [ ] No hay valores visuales hardcodeados fuera de tokens.

---

# 21. Definition of Done

Un microjuego solo está terminado cuando:

1. Cumple toda la checklist de aceptación.
2. Se integra dentro de `MicroGameShell` sin estilos duplicados.
3. Tiene estados completos de inicio, juego, pausa, resultado y salida.
4. Funciona correctamente en móvil vertical y escritorio horizontal.
5. Es usable por una persona de 50+ sin instrucciones externas.
6. Mantiene el foco en la tarea cognitiva.
7. Tiene feedback inmediato, accesible y no punitivo.
8. Tiene localización, analítica y pruebas básicas.
9. Visualmente puede colocarse junto a cualquier otro microjuego CogniFit sin parecer de otra aplicación.

---

# 22. Prompt base para Claude Code, Codex o cualquier IA

Copiar este bloque al pedir un nuevo microjuego:

```text
Programa un nuevo microjuego para CogniFit siguiendo estrictamente el archivo
COGNIFIT_MINIGAME_STYLE_SPEC.md.

Requisitos:
- No inventes un sistema visual nuevo.
- Usa el MicroGameShell, tokens, componentes, estados, accesibilidad, responsive,
  localización y analítica definidos en la especificación.
- El área de juego debe ser el foco principal.
- Debe existir una sola acción primaria por estado.
- El diseño debe ser especialmente claro para usuarios de 50 años o más.
- Separa lógica, UI, configuración, traducciones, analítica y tests.
- No hardcodees colores, textos ni tamaños fuera del design system.
- Implementa todos los estados mínimos y la checklist de aceptación.

microjuego solicitado:
[NOMBRE DEL JUEGO]

Objetivo cognitivo:
[HABILIDAD O HABILIDADES]

Mecánica:
[DESCRIPCIÓN DE LA MECÁNICA]

Reglas:
[REGLAS]

Dificultad adaptativa:
[CRITERIOS DE ADAPTACIÓN]

Entrega:
1. Arquitectura de componentes.
2. Código funcional completo.
3. Estilos reutilizando el design system.
4. Traducciones iniciales ES/EN.
5. Analítica.
6. Tests.
7. Instrucciones de ejecución.
8. Checklist final indicando cómo se cumple cada requisito del archivo de estilos.
```

---

# 23. Resumen machine-readable

```yaml
cognifit_minigame_style:
  version: "1.0"
  visual_identity:
    mood: [premium, scientific, technological, calm, motivating, accessible]
    forbidden: [casino, childish, noisy, photographic_backgrounds, arbitrary_colors]
  colors:
    background: "#020B2D"
    background_secondary: "#06164A"
    primary: "#2F6BFF"
    cyan: "#27D7FF"
    violet: "#8E5BFF"
    reward: "#FFC83D"
    success: "#35D07F"
    error: "#FF5E6C"
    text_primary: "#F7FAFF"
    text_secondary: "#B8C5E8"
  typography:
    family: "Inter, SF Pro, system-ui, sans-serif"
    minimum_ui_size_px: 16
    primary_button_size_px: "18-22"
  geometry:
    spacing_base_px: 4
    touch_target_min_px: 48
    panel_radius_px: "16-20"
    card_radius_px: "18-24"
    modal_radius_px: "24-32"
  layout:
    required_sections: [top_bar, game_identity, hud, playfield, primary_action]
    maximum_hud_metrics: 4
    primary_actions_per_state: 1
  motion:
    interaction_ms: "80-150"
    state_change_ms: "150-250"
    modal_ms: "200-320"
    supports_reduced_motion: true
  accessibility:
    wcag_text_contrast: "4.5:1"
    keyboard_required: true
    screen_reader_required: true
    non_color_state_indicator_required: true
  responsive:
    mobile_portrait: true
    tablet: true
    desktop_landscape: true
    safe_area_support: true
  implementation:
    shared_design_system_required: true
    hardcoded_visual_values_forbidden: true
    localized_strings_required: true
    analytics_required: true
    tests_required: true
```

---

**Objetivo final:** cualquier microjuego nuevo debe ser distinto en su mecánica, pero inequívocamente CogniFit en su estructura, lenguaje visual, accesibilidad y experiencia de uso.
