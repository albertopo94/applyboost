# UI Delta: selective-ui-rollback

## MODIFIED Requirements

### Requirement: Google Branding Style
El botón de Google **DEBE** mostrar el texto "Google" con los colores corporativos letra por letra (G: #4285F4, o: #EA4335, o: #FBBC05, g: #4285F4, l: #34A853, e: #EA4335).
(Anteriormente: Texto en un solo color según el tema).

#### Scenario: Google Logo in Header
- GIVEN un usuario no autenticado en el header
- WHEN el usuario ve el botón de login
- THEN el texto "Google" debe aparecer con los colores específicos
- AND el botón debe tener un estilo minimalista con borde `slate-200`

---

### Requirement: Premium Auth Modal Aesthetic
El modal de autenticación **DEBE** tener bordes redondeados de `2.5rem`, una rotación de `3deg` en el contenedor del icono y una sombra azul suave (`shadow-blue-500/20`).
(Anteriormente: Bordes estándar del sistema y sin rotaciones).

#### Scenario: Professional SaaS Modal
- GIVEN el modal de autenticación abierto
- WHEN el usuario lo visualiza
- THEN el borde debe ser de `2.5rem` (40px)
- AND el icono central debe estar rotado `-3deg` dentro de un marco de `3deg`

---

### Requirement: Ultra-thin Quota Banner
La barra de cuota para usuarios anónimos **DEBE** ser ultra-delgada con un tamaño de fuente de `10px` y un padding vertical de `1.5` (6px).
(Anteriormente: Estilo de banner estándar más grueso).

#### Scenario: Minimalist Quota Feedback
- GIVEN un usuario en modo invitado
- WHEN aparece el banner de cuota
- THEN la fuente debe ser `10px` y en mayúsculas negritas (`uppercase font-bold`)
- AND el banner debe tener un color de fondo azul muy tenue (`blue-50/50`)

---

### Requirement: Legacy Wizard Steps Style
Los círculos con números del Wizard **DEBE** tener un tamaño de `6x6` (24px) con fondo `blue-50` y borde `blue-100`.
(Anteriormente: Estilo de pasos modernizado/estandarizado).

#### Scenario: Step-by-Step Clarity
- GIVEN el formulario inicial (Wizard)
- WHEN el usuario ve los pasos explicativos (1, 2, 3)
- THEN cada número debe estar encerrado en un círculo con fondo celeste y borde sutil
- AND el texto de cada paso debe tener una fuente de `15px`
