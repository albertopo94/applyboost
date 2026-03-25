# HLD — High Level Design — Magic Generar PDF

## 1. Información del Documento

| Campo | Valor |
| --- | --- |
| Título | HLD — High Level Design — Magic Generar PDF |
| Versión | 1.0 |
| Fecha de creación | 20 marzo 2026 |
| Última actualización | 20 marzo 2026 |
| Autor(es) | Fundador / Tech Lead |
| Revisado por | — |
| Aprobado por | — |
| Estado | Borrador |
| Documentos relacionados | PRD — Magic Generar PDF / BRD — Magic Generar PDF / Stack Técnico & Decisiones de Infraestructura |

---

## 2. Historial de Cambios

| Versión | Fecha | Autor | Descripción del cambio |
| --- | --- | --- | --- |
| 1.0 | 20 mar 2026 | Fundador | Versión inicial — MVP Módulo 1: CV & Cover Letter Dinámico |

---

## 3. Resumen Ejecutivo

Magic Generar PDF es una aplicación web SaaS que automatiza la generación de documentos profesionales mediante IA. El MVP cubre el Módulo 1: optimización de CVs y generación de cover letters personalizadas para candidaturas laborales.

El enfoque arquitectónico es un **monolito modular** construido sobre Next.js, donde el frontend y el backend (API Routes) conviven en el mismo repositorio y se despliegan como una unidad en Vercel. La base de datos, la autenticación y el almacenamiento temporal se delegan a Supabase (PostgreSQL en Frankfurt, EU). La generación de documentos se realiza íntegramente en el servidor propio: Puppeteer para PDF y docx.js para DOC, sin dependencia de APIs de terceros para el renderizado.

La arquitectura separa estrictamente la capa de **generación de contenido** (LLM → JSON) de la capa de **generación de formato** (JSON → HTML → PDF / DOC). Esta separación es el principio de diseño fundamental del sistema y garantiza que la IA nunca tenga control sobre el formato final del documento.

---

## 4. Contexto y Objetivos

**4.1 Contexto del sistema**

El sistema es nuevo, sin sistemas previos que reemplazar ni integrar. Nace como SaaS web independiente. El problema que resuelve es la fricción del proceso manual de adaptar un CV a cada oferta de trabajo (30-60 min por candidatura), reemplazándolo por un flujo automatizado de menos de 30 segundos con resultado de calidad profesional.

El sistema no compite en la categoría genérica de generadores de PDF sino en el nicho de herramientas de optimización de candidaturas laborales. El PDF es el entregable final de un workflow con valor de negocio directo.

**4.2 Objetivos arquitectónicos**

| Atributo | Requisito | Justificación |
| --- | --- | --- |
| Rendimiento | Generación completa ≤30s en el percentil 90 | El tiempo de espera es crítico para la percepción de valor. Más de 30s genera abandono |
| Privacidad (GDPR) | Ningún dato sensible del CV persiste en servidores de terceros | Los CVs contienen datos personales sensibles. Obligación legal en la UE |
| Fiabilidad del output | La IA nunca inventa datos. 100% de campos faltantes marcados como FALTA_DATO | La confianza del usuario es el activo principal del producto |
| Escalabilidad | Soportar al menos 50 generaciones concurrentes sin degradación | Objetivo de crecimiento del MVP |
| Disponibilidad | Uptime ≥99% mensual | Producto de pago — indisponibilidad genera chargebacks |
| Mantenibilidad | Un solo pipeline de renderizado para todos los módulos actuales y futuros | Reducir la complejidad al añadir los módulos 2-4 en el futuro |
| Seguridad | API Keys nunca expuestas en el cliente. Todas las llamadas externas desde el servidor | Riesgo de seguridad crítico si se exponen claves de LLM o Stripe |

**4.3 Restricciones arquitectónicas**

- Presupuesto de infraestructura en MVP: €0/mes (free tiers). Escalado pagado solo al superar los límites.
- Puppeteer debe ejecutarse en el servidor (Vercel Function) con `@sparticuz/chromium`. Límite de 50MB por función y 60s de timeout en Vercel Pro. Debe validarse con PDFs reales antes del lanzamiento.
- GDPR obligatorio: datos de CV no pueden enviarse a servicios fuera de la UE para renderizado. Puppeteer en servidor propio es la solución.
- Monolito modular en el MVP: no se justifica arquitectura de microservicios hasta que el volumen y la complejidad lo requieran.
- Stack definido y no negociable para el MVP: Next.js + Supabase + Vercel + Gemini API + Puppeteer + docx.js + Stripe + Resend.

---

## 5. Vista General del Sistema

**5.1 Diagrama de contexto (Nivel 0)**

```
                      ┌────────────────────────────────┐
                      │                                │
[Usuario]  ───────▶  │     MAGIC GENERAR PDF        │
(navegador)          │      (Aplicación Web SaaS)     │
                      │                                │
                      └────────────────────────────────┘
                             │      │      │      │
                             ▼      ▼      ▼      ▼
                      [Gemini] [Stripe] [Google] [Supabase]
                        API    (pagos)   OAuth    (BD+Auth)
                                             │
                                        [Resend]
                                        (email)
```

**5.2 Descripción de actores y sistemas externos**

| Actor / Sistema externo | Tipo | Descripción de la interacción |
| --- | --- | --- |
| Usuario (candidato) | Persona | Accede desde el navegador. Sube CV, pega oferta, recibe resultado, exporta documento |
| Gemini API (Google) | Sistema externo | Recibe el prompt maestro con CV + oferta + preferencias. Devuelve JSON estructurado (cv_optimizado, cover_letter, diff, keywords) |
| Google OAuth | Sistema externo | Autentica al usuario con su cuenta Gmail. Devuelve token JWT |
| Supabase | Sistema externo | Gestiona PostgreSQL (BD), Auth (JWT + RLS), Storage temporal (archivos subidos) |
| Stripe | Sistema externo | Procesa pagos de los tiers de exportación. Envía webhooks al sistema para acreditar exportaciones |
| Resend | Sistema externo | Recibe peticiones del servidor para enviar emails transaccionales (bienvenida, confirmación de pago) |

---

## 6. Arquitectura del Sistema

**6.1 Diagrama de componentes (Nivel 1)**

```
┌────────────────────────────────────────────────────────────────┐
│                     VERCEL (Despliegue)                              │
│                                                                      │
│  ┌────────────────────────────┐  ┌────────────────────────────┐  │
│  │   FRONTEND (Next.js/React)   │  │   BACKEND (API Routes Node.js) │  │
│  │                              │  │                              │  │
│  │  • Wizard de Input (P1)      │  │  • /api/generate              │  │
│  │  • Preview + Diff (P2)       │  │  • /api/export/pdf            │  │
│  │  • Paywall UI                 │  │  • /api/export/doc            │  │
│  │  • Historial                  │  │  • /api/stripe/webhook        │  │
│  │  • Perfil / Settings          │  │  • /api/auth/[...nextauth]    │  │
│  └────────────────────────────┘  └────────────────────────────┘  │
│           │  HTTPS/JSON                        │                       │
│           └───────────────────────────┘                       │
│                                                                      │
│  ┌────────────────────────────┐  ┌────────────────────────────┐  │
│  │   MOTOR DE CONTENIDO (IA)    │  │   MOTOR DE DOCUMENTOS        │  │
│  │                              │  │                              │  │
│  │  • Orquestador de prompt      │  │  • Pipeline JSON→HTML→PDF    │  │
│  │  • Llamada a Gemini API       │  │    (Puppeteer)               │  │
│  │  • Validador de JSON (Zod)    │  │  • Pipeline JSON→DOC          │  │
│  │  • Keyword matching ATS       │  │    (docx.js)                 │  │
│  │  • Detector de idioma         │  │  • Plantillas HTML/CSS        │  │
│  └────────────────────────────┘  └────────────────────────────┘  │
│                                                                      │
└────────────────────────────────────────────────────────────────┘
            │                              │
            ▼                              ▼
┌────────────────────┐  ┌────────────────────┐
│  SUPABASE (EU)        │  │  SERVICIOS EXTERNOS       │
│  • PostgreSQL          │  │  • Gemini API (LLM)        │
│  • Auth (JWT + RLS)    │  │  • Stripe (pagos)          │
│  • Storage temporal    │  │  • Google OAuth            │
└────────────────────┘  │  • Resend (email)          │
                          └────────────────────┘
```

**6.2 Descripción de componentes**

| Componente | Responsabilidad | Tecnología | Expone / Consume |
| --- | --- | --- | --- |
| Frontend | Wizard de input (P1), preview con edición inline (P2), paywall UI, historial, perfil | Next.js / React / Tailwind CSS | Consume: API Routes del backend |
| Backend (API Routes) | Orquesta toda la lógica de negocio: autenticación, generación, exportación, pagos | Node.js (Next.js API Routes) | Expone: REST endpoints internos. Consume: Gemini, Supabase, Stripe, Resend |
| Motor de contenido (IA) | Construye el prompt maestro, llama al LLM, valida el JSON de respuesta, calcula Score ATS por keyword matching | Gemini API + Zod (validación) + algoritmo determinista de keyword matching | Consume: Gemini API. Expone: JSON validado al Motor de Documentos |
| Motor de documentos | Renderiza el JSON validado a PDF (Puppeteer) y DOC (docx.js) en memoria del servidor | Puppeteer + @sparticuz/chromium + docx.js | Consume: JSON del Motor de contenido. Expone: buffer binario (PDF/DOC) al backend |
| Supabase (BD + Auth + Storage) | Persistencia de datos de usuario, historial, logs de uso, exportaciones disponibles. Autenticación JWT con RLS. Storage temporal de archivos subidos | PostgreSQL + Supabase Auth + Supabase Storage (Frankfurt EU) | Consume: llamadas desde el backend. Expone: SDK Supabase |
| Stripe | Procesamiento de pagos. Webhooks para acreditar exportaciones tras pago exitoso | Stripe API + Webhooks | Consume: llamadas desde /api/stripe/checkout. Expone: webhooks a /api/stripe/webhook |
| Resend | Emails transaccionales: bienvenida, confirmación de pago | Resend API | Consume: llamadas desde el backend. Expone: API REST |

**6.3 Diagrama de despliegue**

```
┌──────────────────────────────────────────────────────────────┐
│ VERCEL (CDN global + Serverless Functions)                        │
│                                                                   │
│  ┌───────────────────┐  ┌──────────────────────────┐  │
│  │ Next.js App          │  │ Vercel Functions (Node.js)     │  │
│  │ (páginas estáticas  │  │                                │  │
│  │ y SSR)               │  │  /api/generate                 │  │
│  │                      │  │  /api/export/pdf (Puppeteer)   │  │
│  │  Servida desde CDN   │  │  /api/export/doc (docx.js)     │  │
│  │  global de Vercel    │  │  /api/stripe/webhook           │  │
│  └───────────────────┘  └──────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                │                          │
                ▼                          ▼
┌──────────────────────┐  ┌──────────────────────┐
│ SUPABASE                 │  │ SERVICIOS EXTERNOS       │
│ Frankfurt (EU West)      │  │ (Cloud global)           │
│                          │  │                          │
│ • PostgreSQL (BD)        │  │ • Gemini API (US/Global)  │
│ • Auth (JWT)             │  │ • Stripe (EU)             │
│ • Storage temporal       │  │ • Google OAuth            │
│   (TTL: 1h)              │  │ • Resend (email)          │
└──────────────────────┘  └──────────────────────┘

Entornos: Development (local) → Staging (Vercel Preview) → Production (Vercel Production)
Cada entorno tiene su propio proyecto Supabase separado.
```

---

## 7. Flujos Principales

**Flujo 1 — Generación completa (CV + Cover Letter)**

```
[Usuario]
    │
    │ 1. Sube CV (PDF/DOC/texto) + pega oferta (texto/URL) + preferencias
    ▼
[Frontend — Pantalla 1]
    │
    │ 2. Valida inputs obligatorios (CV + oferta presentes)
    │    Si falta alguno: bloquea y muestra mensaje de error
    │ 3. Si la oferta es URL: intenta extraer contenido (scraping HTML)
    │    Si falla: segundo intento vía LLM
    │    Si falla: solicita pegar el texto manualmente
    │ 4. POST /api/generate con { cv, job_description, preferences, output_language }
    ▼
[Backend — /api/generate]
    │
    │ 5. Verifica sesión JWT (Supabase Auth)
    │    ⚠️ DECISIÓN: El registro es OBLIGATORIO antes de generar.
    │    Un usuario no autenticado recibe 401 en este punto.
    │    El frontend detecta el 401 y muestra el modal de login ("Continuar con Gmail")
    │    antes de reintentar la generación. No existe sesión anónima temporal.
    │ 6. Parsea el CV según formato (pdf-parse / mammoth / texto plano)
    │ 7. Detecta idioma de la oferta (si no hay override manual del usuario)
    │ 8. Construye el prompt maestro con CV + oferta + preferencias + idioma
    │ 9. Llama a Gemini API (una sola llamada)
    ▼
[Gemini API]
    │
    │ 10. Devuelve JSON: { cv_optimizado, cover_letter, diff, keywords }
    ▼
[Backend — /api/generate (continuación)]
    │
    │ 11. Valida el JSON con Zod (esquema estricto)
    │     Si falla la validación: reintento o error informado al usuario
    │ 12. Calcula Score ATS (keyword matching determinista):
    │     score_original = match(keywords, cv_original)
    │     score_optimizado = match(keywords, cv_optimizado)
    │ 13. Guarda la generación en BD (tabla generations)
    │ 14. Registra log de uso en BD (tabla generation_logs)
    │ 15. Devuelve al frontend: { cv_optimizado, cover_letter, diff, keywords,
    │                             score_original, score_optimizado }
    ▼
[Frontend — Pantalla 2]
    │
    │ 16. Muestra preview editable, Score ATS, Diff y sección cover letter
    │ 17. Usuario revisa, edita inline (opcional) y pulsa Descargar PDF
    ▼
[Backend — /api/export/pdf]
    │
    │ 18. Verifica sesión y exportaciones disponibles del usuario
    │     Si no tiene exportaciones: devuelve 402 → frontend muestra paywall
    │ 19. Inyecta el JSON en la plantilla HTML/CSS del CV
    │ 20. Puppeteer renderiza el HTML a PDF en memoria
    │ 21. Descuenta 1 exportación del contador del usuario en BD
    │ 22. Actualiza log de uso (formato: PDF)
    │ 23. Devuelve el buffer PDF al cliente
    ▼
[Usuario]
    │
    │ 24. Descarga el PDF desde el navegador
```

**Flujo 2 — Registro y primera exportación gratuita**

```
[Usuario]
    │ 1. Pulsa "Continuar con Gmail" en el paywall
    ▼
[Google OAuth]
    │ 2. Autentica al usuario y devuelve token
    ▼
[Backend — /api/auth]
    │ 3. Supabase Auth recibe el token de Google
    │ 4. Crea la sesión JWT y el registro de usuario en BD
    │ 5. Si es el primer registro: acredita 1 exportación gratuita
    │    (campo exports_available = 1 en tabla users)
    │ 6. Resend envía email de bienvenida
    ▼
[Frontend]
    │ 7. Redirige al usuario de vuelta al resultado
    │ 8. Los botones de descarga están desbloqueados (1 exportación disponible)
```

**Flujo 3 — Pago y acreditación de exportaciones**

```
[Usuario]
    │ 1. Selecciona tier en el paywall (9€/10 exp. o 19€/mes)
    ▼
[Backend — /api/stripe/checkout]
    │ 2. Crea sesión de pago en Stripe con el tier seleccionado
    │ 3. Redirige al usuario al checkout de Stripe
    ▼
[Stripe]
    │ 4. Usuario completa el pago
    │ 5. Stripe envía webhook a /api/stripe/webhook
    ▼
[Backend — /api/stripe/webhook]
    │ 6. Verifica la firma del webhook (STRIPE_WEBHOOK_SECRET)
    │ 7. Identifica el evento: payment_intent.succeeded
    │ 8. Acredita las exportaciones en BD según el tier:
    │    9€ → exports_available += 10
    │    19€/mes → activa suscripción ilimitada hasta fecha de renovación
    │ 9. Resend envía email de confirmación de pago
    ▼
[Frontend]
    │ 10. Usuario es redirigido de vuelta a la app con exportaciones disponibles
```

**Flujo 4 — Edge case: CV no parseable**

```
[Frontend]
    │ 1. Usuario sube un PDF escaneado (imagen, sin texto extraible)
    ▼
[Backend — /api/generate]
    │ 2. pdf-parse intenta extraer texto → resultado vacío o <50 caracteres
    │ 3. El backend detecta el error de parsing antes de llamar al LLM
    │ 4. Devuelve error 422 con código: CV_PARSE_ERROR
    ▼
[Frontend]
    │ 5. Muestra mensaje: "No pudimos leer el PDF, pega tu CV como texto"
    │ 6. Muestra textarea para que el usuario pegue su CV manualmente
    │ 7. El flujo continúa normalmente desde el paso 8 del Flujo 1
```

---

## 8. Modelo de Datos (Alto Nivel)

> El detalle completo de atributos, tipos y relaciones se encuentra en el ERD.
> 

```
[users]
    │
    ├──── [generations] (1 usuario → N generaciones)
    │           │
    │           ├──── [generation_logs] (1 generación → 1 log)
    │           └──── [cv_versions] (1 generación → 1 versión del CV)
    │
    └──── [user_exports] (1 usuario → 1 registro de exportaciones)
```

| Entidad | Descripción | Almacenamiento |
| --- | --- | --- |
| users | Perfil del usuario: id, email, nombre, exports_available, subscription_status, subscription_expires_at, created_at | PostgreSQL (Supabase) |
| generations | Cada generación realizada: id, user_id, cv_text, job_description, output_language, tone, generated_at, interview_result (sí/no/pendiente) | PostgreSQL (Supabase) |
| cv_versions | Versión del CV generada: id, generation_id, cv_optimizado (JSON), cover_letter, diff (JSON), score_original, score_optimizado | PostgreSQL (Supabase) |
| generation_logs | Log de uso por generación: id, generation_id, falta_dato_fields (JSON), manual_edits (bool), regenerations (int), time_in_preview_seconds, export_format | PostgreSQL (Supabase) |
| user_exports | Control de exportaciones disponibles por usuario: id, user_id, exports_available, subscription_active, subscription_expires_at | PostgreSQL (Supabase) |
| archivos temporales | CVs subidos antes de parsear. TTL máximo: 1 hora. Se eliminan automáticamente tras la generación | Supabase Storage |

---

## 9. Integraciones Externas

| Sistema externo | Protocolo | Dirección | Propósito | SLA esperado |
| --- | --- | --- | --- | --- |
| Gemini API (Google) | REST / HTTPS | Saliente | Procesamiento del CV y la oferta. Devuelve JSON estructurado en una sola llamada | 99.9% (Google SLA) |
| Google OAuth | OAuth 2.0 / HTTPS | Saliente | Autenticación del usuario con cuenta Gmail | 99.99% (Google SLA) |
| Supabase | SDK Node.js / HTTPS | Saliente | BD PostgreSQL + Auth JWT + Storage temporal | 99.9% (Supabase SLA Pro) |
| Stripe | REST / HTTPS + Webhooks | Saliente + Entrante | Creación de sesiones de pago y recepción de eventos de pago completado | 99.99% (Stripe SLA) |
| Resend | REST / HTTPS | Saliente | Emails transaccionales (bienvenida, confirmación de pago) | 99.9% |

---

## 10. Decisiones Arquitectónicas Clave

| Decisión | Alternativas descartadas | Justificación |
| --- | --- | --- |
| Monolito modular (Next.js) en lugar de microservicios | Microservicios separados (API independiente + frontend independiente) | El volumen del MVP no justifica la complejidad operativa de microservicios. El monolito modular permite iterar rápido y escalar cuando sea necesario |
| Puppeteer en el servidor propio (Vercel Function) para generar PDFs | Google Docs API, PDFKit, WeasyPrint | Puppeteer garantiza diseño pixel-perfect con HTML/CSS, no envía datos a terceros (GDPR) y el HTML se destruye en memoria tras generar el PDF |
| Separación estricta: LLM genera contenido (JSON), código genera formato (PDF/DOC) | Dejar que la IA genere HTML directamente o use un motor de plantillas | La IA no es determinista en formato. Separar responsabilidades garantiza consistencia visual y evita que un cambio en el LLM rompa el diseño |
| Score ATS calculado por keyword matching determinista en el backend | Score estimado por el LLM | El LLM heredaría la misma falta de confiabilidad que se intenta evitar. El keyword matching es reproducible, explicable y no alucina |
| Supabase como proveedor único de BD + Auth + Storage | Neon (BD) + Firebase Auth + Backblaze (storage) | Un solo proveedor reduce la complejidad de integración, el JWT de Supabase se propaga automáticamente al RLS de PostgreSQL y los servidores están en Frankfurt (GDPR) |
| Vercel como plataforma de despliegue en lugar de VPS propio | Hetzner VPS, Railway, Render | Despliegue automático desde Git sin configuración de servidor. Coste €0 en MVP. Se reevaluará si el coste supera ~€200/mes |
| Una sola llamada al LLM por generación | Múltiples llamadas (una por output) | Reduce latencia total y coste por token. El prompt maestro fuerza los 4 outputs (cv_optimizado, cover_letter, diff, keywords) en una sola respuesta JSON |

---

## 11. Consideraciones de Seguridad

**Autenticación y autorización:**

- Google OAuth 2.0 como único proveedor de autenticación en el MVP. Sin gestión de contraseñas propias.
- JWT gestionado por Supabase Auth. Se propaga automáticamente al RLS de PostgreSQL: cada usuario solo puede acceder a sus propios registros a nivel de base de datos, no solo a nivel de aplicación.
- Todas las API Routes verifican la sesión JWT antes de ejecutar cualquier lógica.

**Protección de datos sensibles:**

- Los CVs contienen datos personales sensibles (nombre, teléfono, experiencia laboral). El archivo original se elimina automáticamente de Supabase Storage tras la generación (TTL máximo: 1 hora).
- El HTML del CV se renderiza en memoria en la Vercel Function y nunca se escribe a disco ni a storage.
- Ningún dato del CV se envía a servicios fuera de la UE para renderizado. Gemini API recibe solo el texto (sin archivos binarios).

**Gestión de secretos:**

- Todas las API Keys se almacenan como Vercel Environment Variables (cifradas). Nunca en el repositorio de código ni en archivos `.env` versionados.
- Las llamadas a Gemini, Stripe y Resend se realizan únicamente desde API Routes del servidor. Nunca desde el cliente.
- Los webhooks de Stripe se verifican con `STRIPE_WEBHOOK_SECRET` antes de procesarse.

**Superficie de ataque:**

- El frontend no tiene acceso directo a la BD. Toda interacción pasa por las API Routes del backend.
- Validación con Zod del JSON devuelto por el LLM antes de usarlo en cualquier operación.
- Rate limiting por usuario en `/api/generate` para prevenir abuso del free tier y costes descontrolados del LLM.

**Cumplimiento regulatorio (GDPR):**

- Servidores de datos en Frankfurt (EU West) via Supabase.
- Derecho al borrado: hard delete en cascada de todos los registros del usuario.
- Sin cookies de seguimiento de terceros. Consentimiento explícito en el registro.
- Política de Privacidad pública obligatoria antes del lanzamiento.

---

## 12. Consideraciones de Escalabilidad y Disponibilidad

**Estrategia de escalado:**

- **Vercel:** Escala automáticamente las Serverless Functions bajo demanda. No requiere configuración manual.
- **Supabase:** Escala verticalmente (free → Pro → Team) según el volumen de BD, MAU y storage. Criterios de activación documentados en el Stack Técnico.
- **Gemini API:** Escala según el plan contratado. Monitorizar el consumo de tokens y activar plan de pago antes de superar el free tier.
- **Puppeteer:** El cuello de botella potencial es el tiempo de CPU por generación (~3-5s). **Criterio de activación del plan de contingencia:** si la tasa de timeouts de Puppeteer supera el 5% de las exportaciones en producción, mover `/api/export/pdf` a Railway como servicio dedicado. Ver sección 14 (Riesgos Técnicos) para el detalle.

**Puntos únicos de falla (SPOF) y mitigaciones:**

| SPOF | Probabilidad | Mitigación |
| --- | --- | --- |
| Gemini API no disponible | Baja | Mostrar mensaje de error claro al usuario. Sin fallback LLM en el MVP (añadir en fase 2). |
| Supabase no disponible | Baja | Uptime 99.9% garantizado en plan Pro. Monitorizar con alertas. |
| Vercel Function timeout (Puppeteer) | Media | Validar con CVs de 2+ páginas antes del lanzamiento. Criterio de migración: si la tasa de timeouts supera el 5% de exportaciones en producción → mover `/api/export/pdf` a Railway como servicio dedicado. |
| Stripe webhook fallido | Baja | Stripe reintenta los webhooks automáticamente. Implementar idempotencia en el handler. |

**Estrategia de backup:**

- Supabase Pro incluye backups diarios automáticos con retención de 7 días.
- Los CVs originales y los HTMLs de PDFs no se persisten — no requieren backup.
- Los JSONs de CVs optimizados y covers sí se persisten en BD (tabla cv_versions) y están cubiertos por el backup de Supabase.

**Estrategia de caché:**

- No se implementa caché de generaciones en el MVP. Cada generación es única (CV + oferta + preferencias distintas).
- Las páginas estáticas de Next.js se sirven desde la CDN de Vercel con caché automático.

---

## 13. Monitoreo y Observabilidad

**Métricas clave a monitorear:**

- Tiempo de respuesta de `/api/generate` (percentil 50, 90, 99)
- Tiempo de generación de PDF en Puppeteer
- Tasa de error de validación del JSON del LLM
- Consumo de tokens de Gemini API (coste por día)
- Número de generaciones y exportaciones por día
- Tasa de conversión: generaciones / exportaciones de pago
- Uptime de Vercel y Supabase

**Herramientas (MVP):**

- **Logging:** Vercel Functions Logs (integrado en el dashboard de Vercel)
- **Errores:** Sentry (plan gratuito) para captura de excepciones en frontend y backend
- **Uptime:** UptimeRobot o Better Uptime (plan gratuito) para monitorización del endpoint principal
- **Métricas de negocio:** Tablas `generations` y `generation_logs` en Supabase — consultables via Supabase Studio o queries SQL directas

**SLIs/SLOs del MVP:**

| SLI | SLO |
| --- | --- |
| Disponibilidad del endpoint `/api/generate` | ≥99% mensual |
| Tiempo de generación completa (P90) | ≤30 segundos |
| Tasa de error 5xx en API Routes | <1% |
| Tiempo de generación de PDF (P95) | <5 segundos |

---

## 14. Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
| --- | --- | --- | --- |
| Puppeteer supera el timeout de 60s en Vercel Pro con CVs complejos | Media | Alto | Validar con CVs reales antes del lanzamiento. Si hay timeouts: mover Puppeteer a Railway o Render como servicio dedicado |
| El LLM devuelve JSON inválido o con estructura inesperada | Media | Alto | Validación esquématica con Zod obligatoria. Si falla: reintento automático una vez. Si falla de nuevo: error informado al usuario sin exponer detalles internos |
| URLs de ofertas de trabajo (LinkedIn, InfoJobs) bloquean el scraping | Alta | Medio | Fallback documentado y fluido: solicitar pegado manual. El usuario nunca queda bloqueado |
| El free tier de Gemini API (1.500 req/día) se supera con crecimiento rápido | Media | Medio | Monitorizar el consumo diario desde el día 1. Activar plan de pago de Gemini antes de alcanzar el límite |
| Supabase pausa el proyecto gratuito por inactividad (7 días) | Alta en MVP sin usuarios | Alto | Activar Supabase Pro ($25/mes) en cuanto haya los primeros usuarios reales |
| Fuga de API Key de Gemini o Stripe en el repositorio | Baja | Alto | `.gitignore` incluye todos los archivos `.env` desde el primer commit. Auditoría del repositorio antes del primer despliegue |
| El formato DOC generado no coincide con el preview y genera frustración | Media | Medio | Advertencia visible antes de descargar. Recomendación de usar PDF para envíos a reclutadores |

---

## 15. Aprobaciones

| Rol | Nombre | Decisión | Fecha |
| --- | --- | --- | --- |
| Arquitecto principal / Tech Lead | — | Aprobado / Rechazado | — |
| Product Owner | — | Aprobado / Rechazado | — |
| Representante de Seguridad | — | Aprobado / Rechazado | — |
| Director de Ingeniería | — | Aprobado / Rechazado | — |