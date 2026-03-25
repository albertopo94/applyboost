# SDD — Software Design Document — Magic Generar PDF

## 1. Información del Documento

| Campo | Valor |
| --- | --- |
| Título | SDD — Software Design Document — Magic Generar PDF |
| Versión | 1.0 |
| Fecha de creación | 20 marzo 2026 |
| Última actualización | 20 marzo 2026 |
| Autor(es) | Fundador / Tech Lead |
| Revisado por | — |
| Aprobado por | — |
| Estado | Borrador |
| Documentos relacionados | PRD / BRD / HLD / Stack Técnico — Magic Generar PDF |

---

## 2. Historial de Cambios

| Versión | Fecha | Autor | Descripción del cambio |
| --- | --- | --- | --- |
| 1.0 | 20 mar 2026 | Fundador | Versión inicial — MVP Módulo 1: CV & Cover Letter Dinámico |

---

## 3. Resumen Ejecutivo

Este documento especifica el diseño técnico detallado de Magic Generar PDF (MVP — Módulo 1). Describe cómo se construye cada componente del sistema: sus responsabilidades exactas, interfaces, lógica de negocio, manejo de errores y decisiones técnicas.

El sistema se construye como un **monolito modular** sobre Next.js (frontend + API Routes en Bun), con Supabase self-hosted como capa de datos y autenticación, y Dokploy sobre CubePath VPS como plataforma de despliegue. La decisión de diseño más importante es la **separación estricta entre el Motor de Contenido (IA → JSON) y el Motor de Documentos (JSON → PDF/DOC)**: la IA nunca toca el formato final del documento, garantizando consistencia visual y eliminando alucinaciones de diseño.

Todos los componentes son **stateless**: no guardan estado en memoria entre peticiones. El estado persiste exclusivamente en PostgreSQL (Supabase self-hosted). El motor LLM sigue un patrón **round-robin multi-modelo**: cicla por la lista de proveedores configurada en .env y hace fallback automático al siguiente si el actual retorna 429 (cuota agotada).

---

## 4. Contexto y Alcance

**4.1 Contexto**

Este SDD detalla la implementación del MVP del Módulo 1. La arquitectura general del sistema (componentes, flujos de datos, integraciones) está documentada en el HLD. Este documento entra en el detalle de construcción de cada componente: contratos de API, estructuras de datos, lógica de negocio, casos borde y manejo de errores.

**4.2 Alcance de este documento**

Cubre los siguientes componentes del MVP:

- Frontend (Next.js/React): wizard de input, pantalla de resultado, paywall, historial (incluye página `/historial` con campo `interview_result`)
- API Route `/api/generate`: orquestación completa del flujo de generación
- API Route `/api/export/pdf`: generación de PDF con Puppeteer
- API Route `/api/export/doc`: generación de DOC con docx.js
- API Route `/api/stripe/checkout` y `/api/stripe/webhook`: flujo de pagos
- API Route `/api/auth`: autenticación con Google OAuth via Supabase
- Motor de Contenido: prompt maestro, llamada a Gemini, validación con Zod, Score ATS
- Motor de Documentos: pipeline HTML→PDF (Puppeteer) y JSON→DOC (docx.js)
- Modelo de datos: esquema completo de tablas PostgreSQL

**4.3 Fuera del alcance**

- Módulos 2, 3 y 4 (Contratos, Facturas, Reportes)
- Integración con GitHub (Modo Dev)
- Extensión de Chrome
- Panel de administración interno
- Infraestructura de CI/CD (cubierta en el Stack Técnico)

**4.4 Supuestos y dependencias**

- Supabase self-hosted desplegado vía Docker Compose en el VPS de Barcelona (CubePath, EU) antes del primer despliegue
- Cuenta de Stripe configurada con los dos productos (9€/10 exp. y 19€/mes) antes del primer despliegue
- API keys de los proveedores LLM configurados (Groq, Cerebras, Gemini, OpenRouter...) definidas en .env antes del primer despliegue
- Puppeteer instalado y Chromium disponible en el VPS — sin dependencia de `@sparticuz/chromium`. Se instala vía `bunx puppeteer browsers install chrome` en el setup del contenedor Docker.

---

## 5. Trazabilidad de Requisitos

| ID Requisito (PRD) | Descripción del requisito | Sección del SDD que lo satisface |
| --- | --- | --- |
| RF-001 | Subir CV en PDF, DOC o texto | Sección 7.1 (Ingesta y normalización de inputs) |
| RF-002 | Ingesta de oferta por texto o URL | Sección 7.1 |
| RF-003 | Detección automática de idioma con override | Sección 7.2 (Motor de Contenido — Prompt Maestro) |
| RF-004 | Selección de qué generar (CV / Cover / Ambos) | Sección 7.2 |
| RF-005 | Selección de formato de salida (PDF/DOC/texto) | Secciones 7.3 y 7.4 |
| RF-006 | Una sola llamada al LLM con JSON estructurado | Sección 7.2 |
| RF-007 | Score ATS determinista por keyword matching | Sección 7.2 |
| RF-008 | Diff explicado visible antes de exportar | Sección 7.2 |
| RF-009 | Sección "Por qué funciona esta cover letter" | Sección 7.2 |
| RF-010 | No inventar datos. Marcar FALTA_DATO | Sección 7.2 |
| RF-011 | Tres niveles de criticidad de FALTA_DATO | Sección 7.2 |
| RF-012 | Edición inline del resultado antes de exportar | Sección 7.5 (Frontend — Pantalla 2) |
| RF-013 | Score ATS congelado tras edición manual | Sección 7.5 |
| RF-014 | Preview no copiable | Sección 7.5 |
| RF-015 | Exportar PDF pixel-perfect | Sección 7.3 |
| RF-016 | Exportar DOC con docx.js | Sección 7.4 |
| RF-017 | Registro con Google OAuth | Sección 7.6 (Autenticación) |
| RF-018 | 1 exportación gratuita al registrarse | Sección 7.6 |
| RF-019 | Tiers de pago: 9€/10 exp. y 19€/mes | Sección 7.7 (Flujo de pagos) |
| RF-020 | Historial de versiones por candidatura | Sección 10 (Modelo de datos) |
| RF-021 | Campo "¿Conseguiste entrevista?" en historial | Sección 10 |
| RF-022 | Estados del proceso con mensajes de texto | Sección 7.5 |
| RF-023 | Logs de uso por generación desde el día 1 | Sección 10 |
| RF-024 | Soporte ES/EN/IT con adaptación cultural | Sección 7.2 |
| RF-025 | Cover letter sin clichés, estructura definida | Sección 7.2 |
| RNF-001 | Generación completa ≤30s P90 | Sección 9.1 |
| RNF-003-006 | Seguridad y GDPR | Sección 9.2 |
| RNF-007 | Borrado de cuenta y datos en cascada | Sección 7.6 |
| RNF-009 | 50 generaciones concurrentes | Sección 9.3 |

---

## 6. Arquitectura del Componente

**6.1 Diagrama de arquitectura interna**

```
FRONTEND (Next.js/React)
  / Landing, /generate Wizard, /historial, /perfil
            | HTTPS + JWT
BACKEND — Bun / Dokploy + CubePath VPS
  /api/generate     → Orquestador principal
  /api/export/pdf   → Puppeteer (nativo, sin limite serverless)
  /api/export/doc   → docx.js
  /api/stripe/*     → Pagos
  /api/auth/*       → Google OAuth via Supabase

  lib/llm/    callLLM() round-robin + fallback 429
  lib/prompt/ buildPromptMaestro()
  lib/ats/    calculateATSScore()
  lib/render/ generatePDF() / generateDOC()
  lib/db/     supabaseClient (self-hosted)
            | SDK
SUPABASE self-hosted      LLM APIs (round-robin)
PostgreSQL + Auth          Groq / Cerebras / Gemini / OpenRouter
Barcelona (EU, GDPR)       Stripe / Resend / Google OAuth
```

**6.2 Responsabilidades del componente**

- **Frontend:** Captura y valida inputs del usuario, muestra estados de proceso, renderiza el preview editable, gestiona el paywall y delega toda la lógica de negocio al backend.
- **Backend (/api/generate):** Orquesta el flujo completo: parseo del CV, construcción del prompt, llamada al LLM, validación del JSON, cálculo del Score ATS, persistencia en BD y log de uso.
- **Motor de Contenido:** Responsable de transformar inputs desordenados en JSON estructurado y validado. Nunca genera formato.
- **Motor de Documentos:** Responsable de transformar el JSON validado en el archivo final (PDF o DOC). Nunca interpreta contenido.
- **Supabase:** Persistencia de datos, autenticación, RLS y storage temporal. El backend no gestiona sesiones propias.

**6.3 Patrones de diseño utilizados**

| Patrón | Dónde se aplica | Justificación |
| --- | --- | --- |
| Separation of Concerns | Motor de Contenido vs Motor de Documentos | La IA nunca toca el formato. El renderizador nunca interpreta contenido. Cambios en uno no afectan al otro |
| Stateless Functions | Todas las API Routes | Permite escalado horizontal automático en Vercel sin coordinación entre instancias |
| Schema Validation (Zod) | Output del LLM | Valida el JSON de Gemini antes de usarlo. Previene alucinaciones de estructura y fallos en cascada |
| Optimistic UI | Estados del proceso en el frontend | El usuario ve feedback inmediato (spinners con texto) mientras el backend procesa |
| Idempotent Webhook Handler | /api/stripe/webhook | Los webhooks de Stripe pueden llegar más de una vez. La lógica de acreditación debe ser idempotente |

---

## 7. Especificación Funcional

### 7.1 Ingesta y Normalización de Inputs

**Descripción:** Convierte todos los inputs del usuario (CV, oferta, cover vieja, notas) a texto plano estructurado antes de llamar al LLM.

**Flujo principal:**

1. El frontend envía los inputs como `multipart/form-data` o JSON a `/api/generate`
2. El backend detecta el formato del CV:
    - PDF: usa `pdf-parse` para extraer texto
    - DOC/DOCX: usa `mammoth` para extraer texto
    - Texto plano: usa directamente
3. Si el texto extraído del CV tiene menos de 50 caracteres: devuelve error `CV_PARSE_ERROR` (422)
4. Para la oferta:
    - Si es texto: usa directamente
    - Si es URL: intenta scraping HTML con `cheerio` extrayendo el contenido del `<body>`
    - Si el scraping devuelve menos de 100 caracteres: segundo intento usando el LLM para interpretar la URL
    - Si ambos fallan: devuelve error `JOB_URL_UNREADABLE` (422) — el frontend pide pegar manualmente
5. Normaliza todos los inputs a texto UTF-8 limpio (elimina caracteres de control, normaliza espacios)

**Casos borde:**

- CV es una imagen escaneada (PDF sin capa de texto): `pdf-parse` devuelve string vacío → error `CV_PARSE_ERROR`
- DOC con formato muy complejo o corrupto: `mammoth` lanza excepción → capturada, devuelve error `CV_PARSE_ERROR`
- URL de oferta protegida por login (LinkedIn job detail): scraping devuelve HTML del login → `cheerio` extrae <100 chars → fallback a pegado manual
- CV en idioma distinto al de la oferta: el normalizador no transforma, el LLM gestiona la traducción en el paso siguiente

**Reglas de negocio:**

- RN-INP-001: Sin CV presente (texto vacío tras normalizar) → bloquear antes de llamar al LLM
- RN-INP-002: Sin oferta presente (texto vacío tras normalizar) → bloquear antes de llamar al LLM
- RN-INP-003: Cover vieja y notas son opcionales. Su ausencia no bloquea el flujo

---

### 7.2 Motor de Contenido (Prompt Maestro + LLM + Score ATS)

**Descripción:** Construye el prompt maestro, invoca al motor LLM round-robin (selecciona el siguiente proveedor disponible y hace fallback en 429), valida el JSON de respuesta y calcula el Score ATS.

**Flujo principal:**

1. Detectar idioma de la oferta con `franc` (librería de detección de idioma en Node.js)
2. Si el usuario tiene override manual de idioma: usar ese. Si no: usar el idioma detectado
3. Construir el prompt maestro con `buildPromptMaestro()` inyectando:
    - `cv_text`: texto normalizado del CV
    - `job_description`: texto normalizado de la oferta
    - `cover_reference`: texto de la cover vieja (o string vacío si no hay)
    - `user_preferences`: notas y preferencias del usuario
    - `output_language`: código de idioma (`es` / `en` / `it`)
    - `generate_cv`: boolean
    - `generate_cover`: boolean
4. Invocar al motor LLM round-robin: el orquestador selecciona el siguiente proveedor disponible en la lista .env. Si recibe 429, avanza automáticamente al siguiente sin devolver error al usuario.
5. Parsear la respuesta: extraer el bloque JSON de la respuesta de texto
6. Validar el JSON con Zod contra el esquema esperado:
    - Si falla: un reintento automático con el mismo prompt
    - Si falla de nuevo: devuelve error `LLM_OUTPUT_INVALID` (500)
7. Calcular Score ATS con `calculateATSScore()`:
    - Extraer `keywords` del JSON validado
    - `score_original` = (keywords presentes en cv_text original / total keywords) × 100
    - `score_optimizado` = (keywords presentes en cv_optimizado / total keywords) × 100
    - Aplicar peso extra (×1.5) a keywords que aparecen en título, resumen o sección de skills del CV
8. Devolver el objeto de resultado completo al orquestador

**Estructura del prompt maestro:**

```
Eres un experto en optimización de CVs y redacción profesional para el mercado {output_language}.

INPUTS:
- CV_TEXT: {cv_text}
- JOB_DESCRIPTION: {job_description}
- COVER_REFERENCE: {cover_reference}
- USER_PREFERENCES: {user_preferences}

REGLAS ABSOLUTAS:
1. NO inventes experiencia, fechas ni métricas que no estén en CV_TEXT.
2. Si falta información relevante, marca el campo exacto como "FALTA_DATO: [descripción de qué falta]".
3. El idioma de TODOS los outputs debe ser {output_language}.
4. La cover letter NO puede empezar con "I am very excited to apply" ni variantes.
5. Estructura obligatoria de cover letter: apertura directa → conexión experiencia-requisitos → 1-2 ejemplos de impacto → cierre. Máximo 300 palabras.
6. Devuelve SOLO JSON válido. Sin texto antes ni después del JSON. Sin bloques de código Markdown.

OUTPUT esperado (JSON):
{
  "cv_optimizado": "texto completo del CV adaptado",
  "cover_letter": "texto de la carta de presentación",
  "cover_letter_explanation": "sección explicando por qué funciona esta cover (2-3 puntos)",
  "diff": [{"cambio": "", "motivo": "", "impacto": ""}, ...],
  "keywords": ["keyword1", "keyword2", ...]
}
```

**Esquema Zod de validación:**

```jsx
const LLMOutputSchema = z.object({
  cv_optimizado: z.string().min(100),
  cover_letter: z.string().min(50).max(2000).optional(),
  cover_letter_explanation: z.string().min(20).optional(),
  diff: z.array(z.object({
    cambio: z.string(),
    motivo: z.string(),
    impacto: z.string()
  })).min(1),
  keywords: z.array(z.string()).min(5).max(20)
})
```

**Casos borde:**

- Gemini devuelve JSON envuelto en bloques de código Markdown (`json ...` ): extraer con regex antes de parsear
- Gemini devuelve texto parcialmente válido: Zod falla → reintento automático
- Oferta muy corta (<100 caracteres): el LLM usa keywords estándar del sector inferido del CV y lo indica en el diff
- Usuario sin métricas en su CV: el LLM usa valor cualitativo y marca `FALTA_DATO` donde correspond

**Niveles de FALTA_DATO:**

- **Bloqueante** (sin CV o sin oferta): el backend no llega a llamar al LLM. Error devuelto al frontend antes del procesamiento.
- **Avisador** (dato importante no crítico): el LLM marca `FALTA_DATO` en el campo. El backend detecta estos marcadores en el JSON y los añade a `falta_dato_fields`. El frontend los muestra como campos editables en amarillo.
- **Silencioso** (dato opcional ausente): el LLM genera sin ese input. Sin marcadores ni avisos.

---

### 7.3 Motor de Documentos — PDF (Puppeteer)

**Descripción:** Recibe el JSON validado del Motor de Contenido y genera un archivo PDF pixel-perfect usando Puppeteer y una plantilla HTML/CSS.

**Flujo principal:**

1. Recibir el objeto `cv_optimizado` (string de texto estructurado)
2. Parsear el texto del CV a un objeto de datos estructurado (`CVDataObject`) usando un parser dedicado
    
    > ⚠️ **Nota de implementación:** `cv_optimizado` llega como texto plano con formato Markdown ligero (secciones separadas por cabeceras `##`). El parser en `lib/parsers/cvStructureParser.ts` debe inferir la estructura detectando cabeceras de sección estándar (Experiencia, Educación, Skills, etc.) en los tres idiomas soportados (ES/EN/IT). Si el parser no puede inferir una sección, la incluye en un campo `raw_text` del `CVDataObject` para que Puppeteer la renderice como bloque de texto sin estructura. **No se debe lanzar error si falta alguna sección — el PDF se genera siempre.**
    > 
3. Inyectar `CVDataObject` en la plantilla HTML/CSS del CV usando un motor de plantillas (Handlebars o template literals)
4. Lanzar instancia de Puppeteer con `@sparticuz/chromium` (versión compatible con Vercel)
5. Cargar el HTML en Puppeteer con `page.setContent(html)`
6. Generar el PDF con `page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } })`
7. Cerrar la instancia de Puppeteer
8. Devolver el buffer binario del PDF al endpoint `/api/export/pdf`
9. El endpoint descuenta 1 exportación del usuario en BD y devuelve el buffer al cliente con headers `Content-Type: application/pdf` y `Content-Disposition: attachment; filename="cv-optimizado.pdf"`

**Casos borde:**

- Puppeteer supera el timeout de 60s (Vercel Pro): devolver error `PDF_TIMEOUT` (504). El frontend informa al usuario y ofrece reintentar.
- El HTML generado tiene contenido que desborda la página A4: la plantilla CSS debe incluir `page-break-inside: avoid` en los bloques de experiencia y regla de overflow controlado.
- CV muy largo (más de 2 páginas): Puppeteer genera automáticamente múltiples páginas. No es un error, es comportamiento esperado.

**Reglas de la plantilla HTML/CSS:**

- Fuente: Inter o similar (Google Fonts, cargada localmente para no depender de red externa en Puppeteer)
- Ancho fijo: 210mm (A4). Nunca usar unidades relativas en márgenes exteriores.
- Colores: escala de grises + un color de acento configurable (por defecto azul oscuro #1e3a5f)
- Los márgenes, tipografía y espaciados están fijados en CSS y no los puede cambiar el usuario

---

### 7.4 Motor de Documentos — DOC (docx.js)

**Descripción:** Recibe el mismo `CVDataObject` que el motor PDF y genera un archivo .docx con `docx.js`.

**Flujo principal:**

1. Recibir `CVDataObject` (mismo objeto que usa la plantilla HTML)
2. Construir el documento docx usando la API de `docx.js`:
    - `Paragraph` con `HeadingLevel` para secciones
    - `TextRun` para contenido de texto
    - Sin columnas ni tablas complejas
3. Serializar el documento a buffer con `Packer.toBuffer(doc)`
4. Devolver el buffer al endpoint `/api/export/doc`
5. El endpoint descuenta 1 exportación y devuelve el buffer con headers `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document` y `Content-Disposition: attachment; filename="cv-optimizado.docx"`

**Limitaciones documentadas y comunicadas al usuario:**

- Sin columnas: el DOC es de una sola columna. El PDF puede tener diseño de dos columnas si la plantilla lo usa.
- Sin imágenes ni iconos: solo texto estructurado.
- La fuente puede variar según el editor de texto del usuario (Word, LibreOffice, Google Docs).
- Advertencia visible en el frontend antes de descargar: *"El formato DOC puede variar ligeramente respecto al preview. Recomendamos el PDF para enviar a reclutadores."*

---

### 7.5 Frontend — Pantalla 1 (Input) y Pantalla 2 (Resultado)

**Pantalla 1 — Input:**

Estructura de componentes React:

```
<GeneratePage>
  <SectionA_Inputs>
    <CVInput />         ← upload PDF/DOC o textarea
    <JobInput />        ← textarea o URL con validación
    <CoverRefInput />   ← opcional, upload o textarea
    <NotesInput />      ← opcional: chips de tono/enfoque + textarea libre
    <LanguageSelector /> ← detección automática + override manual
  </SectionA_Inputs>
  <SectionB_WhatToGenerate>
    <CheckboxCV />      ← default: checked
    <CheckboxCover />   ← default: checked
  </SectionB_WhatToGenerate>
  <SectionC_Format>
    <FormatSelector />  ← PDF (default) / DOC / Texto
  </SectionC_Format>
  <GenerateButton />    ← disabled si CV o Oferta vacíos
</GeneratePage>
```

**Estado del proceso (entre P1 y P2):**

El frontend gestiona un estado `processStatus` con los siguientes valores y mensajes:

| Estado | Mensaje visible |
| --- | --- |
| `parsing_cv` | "Leyendo tu CV..." |
| `parsing_job` | "Analizando la oferta..." |
| `structuring` | "Estructurando tu perfil..." |
| `generating` | "Optimizando y generando cover letter..." |
| `calculating_ats` | "Calculando Score ATS..." |
| `rendering` | "Preparando tu preview..." |
| `done` | "Listo para exportar" |
| `error_cv_parse` | "No pudimos leer el PDF, pega tu CV como texto" |
| `error_job_url` | "No pudimos leer el enlace, pega el texto de la oferta" |
| `error_missing_data` | "Completa los datos marcados antes de continuar" |
| `error_fatal` | "Algo salió mal, inténtalo de nuevo" |

**Pantalla 2 — Resultado:**

- El preview del CV es editable mediante `contenteditable` en React, con las siguientes restricciones aplicadas via CSS y event listeners:
    - `user-select: none` + `onCopy: (e) => e.preventDefault()` + `onContextMenu: (e) => e.preventDefault()` para deshabilitar copia
    - Los elementos de estructura (títulos de sección, separadores) tienen `contenteditable="false"` para protegerlos
    - Solo los bloques de texto de contenido tienen `contenteditable="true"`
- Si el usuario edita cualquier campo: se activa el flag `userHasEdited = true` en el estado del componente
- Si `userHasEdited === true`: el Score ATS muestra la etiqueta *"Score calculado antes de tu edición manual"*
- Cambiar idioma o tono: dispara un nuevo `POST /api/generate` con los mismos inputs pero con los nuevos parámetros

**Paywall:**

- Los botones de descarga verifican `exports_available > 0 || subscription_active` antes de llamar a la API de exportación
- Si no hay exportaciones: muestra el modal de paywall con los dos tiers
- El modal de paywall no reemplaza la pantalla de resultado: el usuario puede seguir viendo y editando el preview

**Página /historial — Especificación:**

- Lista todas las generaciones del usuario ordenadas por `created_at DESC`
- Cada entrada muestra: nombre inferido de la oferta (primeros 60 caracteres de `job_description`), idioma, tono, fecha, Score ATS conseguido, y formato exportado
- El campo `interview_result` aparece en cada entrada como un selector de tres estados: **Pendiente** (default) / **Sí, conseguí entrevista** / **No, no llamó nadie**
- El selector es editable en cualquier momento directamente desde la lista, sin navegar a otra pantalla
- El cambio se guarda con un `PATCH /api/generations/:id` que actualiza únicamente el campo `interview_result`
- No hay notificación ni recordatorio automático en el MVP — el usuario lo rellena de forma voluntaria cuando quiera

---

### 7.6 Autenticación (Google OAuth + Supabase Auth)

**Flujo de registro:**

1. Usuario pulsa "Continuar con Gmail"
2. El frontend llama a `supabase.auth.signInWithOAuth({ provider: 'google' })`
3. Google OAuth redirige de vuelta a la app con el token
4. Supabase Auth verifica el token, crea la sesión JWT y el registro en `auth.users`
5. Un trigger de PostgreSQL en Supabase ejecuta automáticamente:
    - Inserta registro en tabla `users` con `exports_available = 1`
    - Inserta registro en tabla `user_exports` con el contador inicial
6. Resend envía email de bienvenida (llamada desde Supabase Database Webhook o desde el frontend tras detectar sesión nueva)

**Sesión y RLS:**

- El JWT de Supabase se almacena automáticamente en el cliente via el SDK `supabase-js`
- Cada query a PostgreSQL desde el backend incluye el JWT en el header `Authorization: Bearer {token}`
- RLS en cada tabla garantiza que los usuarios solo acceden a sus propios registros a nivel de BD, no solo de aplicación

**Borrado de cuenta (GDPR):**

1. Usuario pulsa "Eliminar cuenta" en la página de perfil
2. Se muestra diálogo de confirmación: *"Esta acción es irreversible. Se eliminarán todos tus datos."*
3. Tras confirmación: el frontend llama a `DELETE /api/user`
4. El backend ejecuta hard delete en cascada:
    - Elimina archivos temporales en Supabase Storage del usuario
    - Elimina registros en `generation_logs`, `cv_versions`, `generations`, `user_exports`, `users`
    - Llama a `supabase.auth.admin.deleteUser(userId)` para eliminar el registro de autenticación
5. Devuelve 200. El frontend cierra la sesión y redirige a la landing.

---

### 7.7 Flujo de Pagos (Stripe)

**Crear sesión de pago (`POST /api/stripe/checkout`):**

```jsx
// Request
{ tier: '10_exports' | 'monthly_unlimited' }

// Lógica
1. Verificar sesión JWT del usuario
2. Crear Stripe Checkout Session con el price_id correspondiente al tier
3. Incluir metadata: { user_id: string, tier: string }
4. Devolver { checkout_url: string }

// Response
{ checkout_url: 'https://checkout.stripe.com/...' }
```

**Recibir evento de Stripe (`POST /api/stripe/webhook`):**

```jsx
// Lógica (idempotente)
1. Verificar firma del webhook con stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
2. Identificar el evento: payment_intent.succeeded o checkout.session.completed
3. Extraer user_id y tier de metadata
4. Verificar si este payment_intent ya fue procesado (tabla stripe_events) ← idempotencia
5. Si no fue procesado:
   - tier '10_exports':
       UPDATE user_exports SET exports_available = exports_available + 10 WHERE user_id = {user_id}
       -- FUENTE DE VERDAD: user_exports, no users. canExport() lee de user_exports.
       -- Actualizar también users.exports_available para mantener consistencia:
       UPDATE users SET exports_available = exports_available + 10 WHERE id = {user_id}
   - tier 'monthly_unlimited':
       UPDATE user_exports SET subscription_active = true, subscription_expires_at = now() + interval '1 month' WHERE user_id = {user_id}
       UPDATE users SET subscription_active = true, subscription_expires_at = now() + interval '1 month' WHERE id = {user_id}
6. Insertar en tabla stripe_events el payment_intent_id para prevenir duplicados
7. Llamar a lib/email/sendPaymentConfirm()
8. Devolver 200
```

**Verificación de exportaciones disponibles (antes de cada exportación):**

```jsx
async function canExport(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_exports')
    .select('exports_available, subscription_active, subscription_expires_at')
    .eq('user_id', userId)
    .single()

  if (data.subscription_active && data.subscription_expires_at > new Date()) return true
  if (data.exports_available > 0) return true
  return false
}
```

---

## 8. Interfaces (API)

**8.1 `POST /api/generate`**

| Campo | Valor |
| --- | --- |
| Endpoint | `POST /api/generate` |
| Descripción | Orquesta el flujo completo de generación de CV y cover letter |
| Autenticación | Bearer JWT (Supabase) |
| Rate limiting | 10 req/hora por usuario autenticado |
| Content-Type | `multipart/form-data` |

Request:

```jsx
{
  cv_file: File | null,          // PDF o DOC subido
  cv_text: string | null,        // Texto pegado directamente
  job_text: string | null,       // Texto de la oferta pegado
  job_url: string | null,        // URL de la oferta
  cover_ref_file: File | null,   // Cover vieja (opcional)
  cover_ref_text: string | null, // Cover vieja como texto (opcional)
  user_notes: string | null,     // Notas libres del usuario (opcional)
  tone: 'technical' | 'senior' | 'direct' | null,
  focus: 'backend' | 'frontend' | 'fullstack' | null,
  output_language: 'es' | 'en' | 'it' | 'auto',
  generate_cv: boolean,          // default: true
  generate_cover: boolean,       // default: true
  output_format: 'pdf' | 'doc' | 'text'
}
```

Response exitoso (200):

```jsx
{
  generation_id: string,         // UUID para referencia en exportación
  cv_optimizado: string,         // Texto del CV optimizado
  cover_letter: string | null,
  cover_letter_explanation: string | null,
  diff: [{ cambio: string, motivo: string, impacto: string }],
  keywords: string[],
  score_original: number,        // 0-100
  score_optimizado: number,      // 0-100
  falta_dato_fields: string[]    // Campos marcados como FALTA_DATO
}
```

Errores:

| Código HTTP | Código de error | Descripción |
| --- | --- | --- |
| 400 | MISSING_CV | No se proporcionó CV |
| 400 | MISSING_JOB | No se proporcionó oferta |
| 401 | UNAUTHORIZED | JWT inválido o ausente |
| 422 | CV_PARSE_ERROR | No se pudo extraer texto del CV |
| 422 | JOB_URL_UNREADABLE | La URL de la oferta no es accesible |
| 429 | RATE_LIMIT_EXCEEDED | Se superaron los 10 req/hora |
| 500 | LLM_OUTPUT_INVALID | El LLM no devolvió JSON válido tras 2 intentos |
| 500 | INTERNAL_ERROR | Error interno del servidor |

**8.2 `POST /api/export/pdf`**

| Campo | Valor |
| --- | --- |
| Endpoint | `POST /api/export/pdf` |
| Descripción | Genera el PDF del CV y lo devuelve como buffer |
| Autenticación | Bearer JWT |
| Rate limiting | 20 req/hora por usuario |

Request:

```jsx
{ generation_id: string, cv_text_edited: string } // cv_text_edited si el usuario editó
```

Response exitoso (200): Buffer binario PDF con headers `Content-Type: application/pdf`

Errores:

| Código HTTP | Código de error | Descripción |
| --- | --- | --- |
| 402 | NO_EXPORTS_AVAILABLE | El usuario no tiene exportaciones disponibles |
| 401 | UNAUTHORIZED | JWT inválido |
| 504 | PDF_TIMEOUT | Puppeteer superó el timeout de 60s |
| 500 | PDF_ERROR | Error en la generación del PDF |

**8.3 `POST /api/export/doc`**

Mismo contrato que `/api/export/pdf` salvo:

- Response: Buffer .docx con `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Sin riesgo de timeout (docx.js es síncrono y rápido)

**8.4 `POST /api/stripe/checkout`**

Request: `{ tier: '10_exports' | 'monthly_unlimited' }`

Response: `{ checkout_url: string }`

Errores: 401 (no autenticado), 400 (tier inválido), 500 (error Stripe)

**8.5 `POST /api/stripe/webhook`**

- Sin autenticación JWT. Autenticado via firma HMAC del webhook de Stripe.
- Siempre devuelve 200 (Stripe reintenta si recibe 4xx o 5xx)

**8.6 Interfaces consumidas (APIs externas)**

| Sistema | Endpoint / Método | Contrato esperado |
| --- | --- | --- |
| Gemini API | `POST /v1/models/gemini-pro:generateContent` | Input: `{contents: [{parts: [{text: prompt}]}]}`. Output: JSON con `candidates[0].content.parts[0].text` |
| Supabase Auth | SDK `supabase.auth.*` | JWT + sesiones gestionadas automáticamente por el SDK |
| Supabase DB | SDK `supabase.from('tabla').select/insert/update/delete` | RLS aplicado automáticamente vía JWT |
| Stripe | SDK `stripe.checkout.sessions.create()`, `stripe.webhooks.constructEvent()` | Documentación oficial de Stripe API |
| Resend | SDK `resend.emails.send()` | `{from, to, subject, html}` |

---

## 9. Requisitos No Funcionales

**9.1 Rendimiento**

| Métrica | Requisito | Cómo se mide |
| --- | --- | --- |
| Latencia P90 `/api/generate` | ≤25s (dominado por el LLM) | Vercel Function logs |
| Latencia P95 `/api/export/pdf` | ≤5s (Puppeteer) | Vercel Function logs |
| Latencia P95 `/api/export/doc` | ≤1s (docx.js síncrono) | Vercel Function logs |
| Latencia P95 endpoints restantes | ≤500ms | Vercel Function logs |
| Concurrencia soportada | 50 generaciones simultáneas | Load test con k6 antes del lanzamiento |

**9.2 Seguridad**

- **Autenticación:** JWT de Supabase verificado en cada API Route antes de ejecutar cualquier lógica. Sin excepciones salvo `/api/stripe/webhook` (autenticado vía firma HMAC) y endpoints públicos de lectura.
- **Autorización:** RLS en PostgreSQL como segunda capa. Aunque el backend falle al filtrar por `user_id`, la BD rechaza el acceso a registros de otros usuarios.
- **Inputs:** Toda entrada del usuario se sanitiza (eliminar HTML, limitar tamaño máximo: CV ≤5MB, texto ≤100KB) antes de procesarse.
- **API Keys:** Almacenadas en Vercel Environment Variables (cifradas). Nunca expuestas en el cliente. El bundle de Next.js en el cliente no contiene ninguna variable prefijada con `NEXT_PUBLIC_` que sea sensible.
- **Cabeceras HTTP de seguridad:** Configuradas en `next.config.js`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Content-Security-Policy` estricto.
- **Datos sensibles en logs:** Nunca loguear `cv_text`, `job_description`, `cover_ref_text` ni tokens JWT. Solo loguear `user_id`, `generation_id`, timestamps y errores.
- **GDPR:** Ver sección 7.6 (borrado en cascada). Los archivos subidos tienen TTL de 1 hora en Supabase Storage.

**9.3 Escalabilidad**

- Todas las API Routes son **stateless**. No guardan estado en memoria entre peticiones. El estado persiste solo en PostgreSQL.
- Vercel Functions escalan automáticamente bajo demanda sin configuración manual.
- El cuello de botella potencial es Puppeteer: cada instancia consume ~200-400MB de RAM. Vercel tiene límite de 1GB por función en el plan Pro. Si se supera la concurrencia máxima soportada: evaluar mover `/api/export/pdf` a Railway o Render como servicio dedicado.
- Rate limiting en `/api/generate` (10 req/hora por usuario) para prevenir abuso del LLM y costes descontrolados.

**9.4 Disponibilidad y resiliencia**

- **Fallos de Gemini API:** Devolver `LLM_OUTPUT_INVALID` al usuario con mensaje claro. Sin fallback LLM en el MVP.
- **Fallos de Supabase:** Devolver `INTERNAL_ERROR`. Monitorizar con UptimeRobot. Supabase Pro tiene SLA del 99.9%.
- **Fallos de Stripe webhook:** Stripe reintenta automáticamente durante 72h. El handler es idempotente para manejar reintentos.
- **Fallos de Puppeteer (timeout):** Devolver `PDF_TIMEOUT` (504). El frontend ofrece reintentar sin perder el resultado.
- **Sin circuit breakers en el MVP:** Se añadirán si la tasa de errores de servicios externos supera el 1% sostenido.

---

## 10. Modelo de Datos

**Esquema PostgreSQL completo:**

```sql
-- Extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios (complementa auth.users de Supabase)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  exports_available INTEGER NOT NULL DEFAULT 1, -- 1 gratuita al registrarse
  subscription_active BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de generaciones
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cv_text TEXT NOT NULL,              -- CV original normalizado
  job_description TEXT NOT NULL,      -- Oferta normalizada
  job_url TEXT,                       -- URL original si se proporcionó
  output_language CHAR(2) NOT NULL,   -- 'es' | 'en' | 'it'
  tone TEXT,                          -- 'technical' | 'senior' | 'direct' | null
  focus TEXT,                         -- 'backend' | 'frontend' | 'fullstack' | null
  generate_cv BOOLEAN NOT NULL DEFAULT TRUE,
  generate_cover BOOLEAN NOT NULL DEFAULT TRUE,
  interview_result TEXT CHECK (interview_result IN ('yes', 'no', 'pending')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de versiones de CV generadas
CREATE TABLE cv_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generation_id UUID NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
  cv_optimizado TEXT NOT NULL,        -- Texto del CV optimizado
  cover_letter TEXT,                  -- Texto de la cover letter
  cover_letter_explanation TEXT,      -- Explicación de por qué funciona
  diff JSONB NOT NULL,                -- [{cambio, motivo, impacto}]
  keywords TEXT[] NOT NULL,           -- Array de keywords ATS
  score_original INTEGER NOT NULL,    -- 0-100
  score_optimizado INTEGER NOT NULL,  -- 0-100
  falta_dato_fields TEXT[],           -- Campos marcados como FALTA_DATO
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de logs de uso (moat de datos)
CREATE TABLE generation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generation_id UUID NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
  falta_dato_fields TEXT[],           -- Campos que tenían FALTA_DATO
  falta_dato_filled TEXT[],           -- Campos FALTA_DATO que el usuario rellenó
  manual_edits BOOLEAN NOT NULL DEFAULT FALSE,
  regenerations INTEGER NOT NULL DEFAULT 0,
  time_in_preview_seconds INTEGER,    -- Tiempo hasta exportar (medido en frontend)
  export_format TEXT CHECK (export_format IN ('pdf', 'doc', 'text', 'none')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de control de exportaciones
CREATE TABLE user_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  exports_available INTEGER NOT NULL DEFAULT 0,
  subscription_active BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de idempotencia de pagos Stripe
CREATE TABLE stripe_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_intent_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id),
  tier TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: cada usuario solo accede a sus propios registros
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "generations_own_data" ON generations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "cv_versions_own_data" ON cv_versions FOR ALL USING (
  auth.uid() = (SELECT user_id FROM generations WHERE id = generation_id)
);
CREATE POLICY "logs_own_data" ON generation_logs FOR ALL USING (
  auth.uid() = (SELECT user_id FROM generations WHERE id = generation_id)
);
CREATE POLICY "exports_own_data" ON user_exports FOR ALL USING (auth.uid() = user_id);

-- Trigger: crear registros en users y user_exports al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, full_name, exports_available)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 1);

  INSERT INTO user_exports (user_id, exports_available)
  VALUES (NEW.id, 1);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**DTOs (TypeScript):**

```tsx
// Output del LLM (validado con Zod)
type LLMOutput = {
  cv_optimizado: string
  cover_letter?: string
  cover_letter_explanation?: string
  diff: { cambio: string; motivo: string; impacto: string }[]
  keywords: string[]
}

// Objeto de datos estructurado del CV (input al Motor de Documentos)
type CVDataObject = {
  name: string
  contact: { email?: string; phone?: string; location?: string; linkedin?: string }
  summary?: string
  experience: { company: string; role: string; dates: string; bullets: string[] }[]
  education: { institution: string; degree: string; dates: string }[]
  skills: string[]
  languages?: string[]
  projects?: { name: string; description: string; url?: string }[]
}

// Respuesta de /api/generate
type GenerateResponse = {
  generation_id: string
  cv_optimizado: string
  cover_letter?: string
  cover_letter_explanation?: string
  diff: { cambio: string; motivo: string; impacto: string }[]
  keywords: string[]
  score_original: number
  score_optimizado: number
  falta_dato_fields: string[]
}
```

---

## 11. Manejo de Errores y Logging

**11.1 Estrategia de manejo de errores**

Tres tipos de errores:

- **Errores de validación (4xx):** Inputs del usuario inválidos o incompletos. Se devuelven con mensaje claro al usuario. No se loguean como errores en el servidor.
- **Errores de negocio (402, 422):** El flujo no puede completarse por condiciones de negocio (sin exportaciones, CV no parseable). Se devuelven con código de error específico para que el frontend muestre el mensaje correcto.
- **Errores de infraestructura (5xx):** Fallos de Gemini, Supabase, Puppeteer o Stripe. Se loguean en Sentry con contexto completo (sin datos personales). El usuario recibe un mensaje genérico.

Formato estándar de respuesta de error:

```jsx
{
  error: {
    code: 'ERROR_CODE',      // Código de error máquina
    message: 'Descripción para el usuario',
    request_id: 'uuid'       // Para correlación con logs del servidor
  }
}
```

**11.2 Estrategia de logging**

| Nivel | Cuándo |
| --- | --- |
| `INFO` | Inicio y fin de cada generación (con `generation_id`, `user_id`, duración) |
| `INFO` | Webhooks de Stripe procesados correctamente |
| `WARN` | Reintento automático del LLM |
| `WARN` | URL de oferta inaccesible (fallback a pegado manual) |
| `ERROR` | Fallo de validación Zod tras 2 intentos |
| `ERROR` | Timeout de Puppeteer |
| `ERROR` | Fallo de Stripe webhook tras verificación |

**Datos que NUNCA deben aparecer en logs:**

- `cv_text` (datos personales del candidato)
- `job_description` (puede contener información confidencial)
- JWT tokens
- `STRIPE_SECRET_KEY` ni ningún otro secreto
- Emails de usuarios

**Correlación de logs:** Cada petición genera un `request_id` (UUID v4) que se incluye en todos los logs relacionados y en la respuesta de error al cliente.

---

## 12. Testing

| Tipo de test | Herramienta | Cobertura objetivo | Qué cubre |
| --- | --- | --- | --- |
| Unit tests | Jest | ≥80% de `lib/` | `calculateATSScore()`, `buildPromptMaestro()`, parsers de CV, validación Zod, lógica de idempotencia del webhook |
| Integration tests | Jest + Supabase local | Flujos críticos | `/api/generate` completo con mock de Gemini, flujo de pago con Stripe test mode, borrado de cuenta en cascada |
| E2E tests | Playwright | Flujo feliz completo | Usuario sube CV + pega oferta + ve resultado + exporta PDF |
| Load tests | k6 | Endpoints críticos | 50 generaciones concurrentes en `/api/generate`. P90 ≤25s, P99 ≤60s |
| Tests de seguridad | Manual + OWASP ZAP | Antes del lanzamiento | Verificar que RLS bloquea acceso cruzado entre usuarios. Verificar que no hay API Keys en el bundle del cliente |

**Tests prioritarios antes del primer lanzamiento (MVP mínimo):**

1. `calculateATSScore()` con CVs y listas de keywords de prueba — garantiza que el score es reproducible
2. Validación Zod con JSON válido, inválido y JSON con bloques Markdown — garantiza que el parsing del LLM es robusto
3. Flujo de pago completo con Stripe test mode — garantiza que las exportaciones se acreditan correctamente
4. Borrado de cuenta: verificar que ningún registro persiste en BD tras el hard delete
5. RLS: verificar que el usuario B no puede acceder a los registros del usuario A

---

## 13. Consideraciones de Despliegue

**Variables de entorno requeridas (por entorno):**

| Variable | Entorno | Descripción |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Todos | URL del proyecto Supabase (pública, no sensible) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Todos | Clave anónima de Supabase (pública, protegida por RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor | Clave de servicio Supabase (nunca en cliente) |
| `GEMINI_API_KEY` | Solo servidor | Clave de Gemini API |
| `STRIPE_SECRET_KEY` | Solo servidor | Clave secreta de Stripe |
| `STRIPE_WEBHOOK_SECRET` | Solo servidor | Secreto de verificación de webhooks Stripe |
| `RESEND_API_KEY` | Solo servidor | Clave de Resend |
| `NEXT_PUBLIC_APP_URL` | Todos | URL base de la app (para redirects de OAuth y Stripe) |

**Estrategia de despliegue:**

- Push a rama `feature/*` → despliegue automático en Vercel Preview (Staging)
- Push a `main` → despliegue automático en Vercel Production
- Sin blue/green ni canary en el MVP: despliegue directo con rollback instantáneo via Vercel si es necesario

**Migraciones de BD:**

- Gestionadas con Supabase CLI: `supabase db push`
- Siempre aditivas en el MVP (nuevas tablas, nuevas columnas, nuevos índices)
- Nunca destructivas sin deprecación previa (no se elimina una columna sin ciclo de deprecación)
- Ejecutadas manualmente en el orden: Development → Staging → Production

---

## 14. Monitoreo y Alertas

| Métrica | Umbral de alerta | Severidad | Acción |
| --- | --- | --- | --- |
| Tasa de error 5xx en `/api/generate` | >2% en 10 min | Critical | Notificación inmediata al fundador |
| Latencia P90 de `/api/generate` | >30s sostenido | Warning | Revisar logs de Gemini API |
| Timeout de Puppeteer | >5% de las exportaciones | Critical | Evaluar migrar Puppeteer a Railway |
| Consumo de tokens Gemini | >80% del límite diario | Warning | Activar plan de pago de Gemini |
| Uptime del endpoint principal | <99% mensual | Critical | Revisar estado de Vercel y Supabase |
| Fallo de webhook Stripe | Cualquiera | Critical | Revisar logs de Stripe Dashboard |

**Herramientas MVP:**

- Sentry (errores de frontend y backend)
- Vercel Functions Logs (latencia y errores por endpoint)
- UptimeRobot (uptime del endpoint `/api/generate`)
- Stripe Dashboard (estado de webhooks y pagos)
- Supabase Studio (queries directas a `generation_logs` para métricas de negocio)

---

## 15. Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
| --- | --- | --- | --- |
| Puppeteer supera el timeout de 60s en Vercel Pro con CVs complejos | Media | Alto | Validar con CVs de 2+ páginas antes del lanzamiento. Si hay timeouts frecuentes: mover `/api/export/pdf` a Railway como microservicio dedicado |
| Gemini devuelve JSON inválido o con estructura inesperada de forma recurrente | Media | Alto | Validación con Zod + 1 reintento automático. Monitorizar tasa de fallos de validación desde el día 1 con Sentry |
| `@sparticuz/chromium` no compatible con la versión de Node.js de Vercel | Media | Alto | Verificar compatibilidad de versiones antes del primer despliegue en Staging |
| Webhook de Stripe procesado dos veces (fallo de red + reintento) | Media | Medio | Handler idempotente con tabla `stripe_events`. Verificado en tests de integración |
| RLS mal configurado permite acceso cruzado entre usuarios | Baja | Alto | Tests de seguridad manual antes del lanzamiento. Usuario B intenta acceder a registros de Usuario A |
| Fuga de API Key en el bundle de Next.js del cliente | Baja | Alto | Auditoría del bundle antes del lanzamiento. Ninguna variable sin `NEXT_PUBLIC_` debe aparecer en el cliente |

---

## 16. Aprobaciones

| Rol | Nombre | Decisión | Fecha |
| --- | --- | --- | --- |
| Arquitecto principal / Tech Lead | — | Aprobado / Rechazado | — |
| Product Owner | — | Aprobado / Rechazado | — |
| Representante de Seguridad | — | Aprobado / Rechazado | — |
| QA Lead | — | Aprobado / Rechazado | — |

---

## 17. Gobernanza Documental — Estándar Obligatorio del Proyecto

<aside>
⚠️ ⚠️ Esta sección NO es una recomendación. Es un estándar operativo del proyecto con el mismo peso que cualquier decisión de arquitectura. Su incumplimiento bloquea el merge de cualquier PR.

</aside>

**17.1 Propósito**

Todo proyecto de software sin documentación viva es un proyecto que acumula deuda oculta. La gobernanza documental no es burocracia — es el mecanismo que permite que cualquier miembro del equipo, una IA o un nuevo colaborador entienda el estado real del sistema en cualquier momento, sin depender de la memoria de ninguna persona.

**17.2 Archivos de Gobernanza — Estructura Obligatoria del Repositorio**

El repositorio del proyecto DEBE contener y mantener actualizados los siguientes archivos en todo momento:

- **`docs/README.md`** — Objetivo del proyecto, instrucciones de setup local, comandos principales (dev, test, build, deploy) y estructura del repositorio. Es la puerta de entrada al proyecto. Debe estar siempre actualizado.
- **`docs/PROJECT_STATE.md`** — Estado actual del proyecto: funcionalidades completadas, en progreso y pendientes. Métricas clave si aplica. Se actualiza en cada PR que cierra una tarea o cambia el alcance.
- **`docs/ARCHITECTURE.md`** — Stack tecnológico, ADRs (Architecture Decision Records), integraciones con servicios externos y riesgos técnicos conocidos. Se actualiza cada vez que se toma una decisión de arquitectura o se incorpora/elimina una dependencia crítica.
- **`AGENTS.md`** — Contexto para herramientas de IA (Copilot, Cursor, agentes autónomos). Incluye: descripción del proyecto, restricciones técnicas no negociables, convenciones de código, comandos frecuentes y zonas del código que requieren atención especial. Se actualiza cuando cambian las reglas del juego.
- **`CHANGELOG.md`** — Registro cronológico de cambios por versión, siguiendo el formato Keep a Changelog (https://keepachangelog.com). Se actualiza en cada PR antes del merge. Categorías: Added, Changed, Deprecated, Removed, Fixed, Security.

**17.3 Definition of Done (DoD) — Condición de Merge**

Un Pull Request NO puede ser mergeado si no cumple todos los ítems aplicables de la siguiente checklist documental. El revisor del PR es responsable de validarla:

- ☐  Si el PR agrega, elimina o modifica una funcionalidad → PROJECT_STATE.md actualizado.
- ☐  Si el PR toma una decisión de arquitectura (nueva librería, cambio de patrón, integración) → ARCHITECTURE.md actualizado con el ADR correspondiente.
- ☐  Si el PR cambia comandos de setup, estructura de carpetas o variables de entorno → README.md actualizado.
- ☐  Si el PR cambia convenciones de código o restricciones técnicas → AGENTS.md actualizado.
- ☐  CHANGELOG.md actualizado con la entrada correspondiente al PR (categoría + descripción concisa).

**17.4 Regla de Formato para ADRs en ARCHITECTURE.md**

Cada Architecture Decision Record (ADR) debe seguir esta estructura mínima:

```markdown
## ADR-NNN — Título de la decisión
**Fecha**: YYYY-MM-DD
**Estado**: Aceptada | En revisión | Reemplazada por ADR-XXX

**Contexto**: Por qué se tomó esta decisión. Qué problema resuelve.
**Decisión**: Qué se decidió hacer exactamente.
**Alternativas consideradas**: Qué otras opciones se evaluaron y por qué se descartaron.
**Consecuencias**: Qué implica esta decisión (beneficios y trade-offs).
```

**17.5 Responsabilidades**

- **Al abrir el PR:** eres responsable de actualizar los archivos de gobernanza que le corresponden al cambio que introdujo.
- **Al revisor el PR:** eres responsable de verificar que la checklist del DoD esté cumplida antes de aprobar. Si los docs no están actualizados, el PR se rechaza con el comentario: 'Gobernanza pendiente — ver §9.3 del SDD'.
- **Tech Lead / Product Owner:** es responsable de que esta sección del SDD se respete. Cualquier excepción debe ser documentada explícitamente y justificada en el PR con la etiqueta [GOV-EXCEPTION].