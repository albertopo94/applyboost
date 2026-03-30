# Auditoría Integral ApplyBoost - Preparación para Inversión (Marzo 2026)

*Documento generado bajo protocolo SDD Antigravity.*

## 0. Resumen Ejecutivo
ApplyBoost es una plataforma de optimización de perfiles profesionales (CV + Cover Letter) diseñada bajo tres principios rectores: **Fricción Cero** en la adquisición de usuarios, **Transparencia** en la toma de decisiones de la IA, y **Resiliencia Extrema** en la infraestructura subyacente. A diferencia de competidores genéricos, ApplyBoost posee "fosos defensivos" (moats) tecnológicos reales, como su motor de extracción visual (Ojo de Dios) y un orquestador de modelos (LLM Round-Robin) que garantiza uptime casi total con costos operativos marginales.

---

## 1. 🎨 Pilar I: Experiencia del Usuario (UX)

La plataforma ha sido diseñada obsesivamente para la conversión y la retención, minimizando la carga cognitiva del usuario.

### Fortalezas y Aciertos
*   **Fricción Cero (Generación Anónima):** El usuario no necesita registrarse para experimentar el "momento Ajá". Puede generar su primer CV optimizado de forma inmediata. El muro de pago/registro (Paywall) se presenta recién en la fase de exportación, cuando el valor ya ha sido demostrado.
*   **Feedback en Tiempo Real (SSE):** El proceso de optimización, que suele ser lento (OCR + LLM + Scraper), se percibe fluido gracias a los eventos enviados por Server-Sent Events (`/api/generate`). El usuario ve qué está pasando en cada milisegundo (parseando, analizando, redactando).
*   **Editor "What You See Is What You Get":** La vista final (`EditorPreview`) no es un simple PDF estático. Es un entorno editable donde el usuario mantiene el control total (`HighlightedContent`).
*   **Transparencia Radica ("AuditSidebar"):** La IA no es una caja negra. La barra lateral explica *exactamente* por qué se cambió cada frase, educando al candidato sobre cómo superar los filtros ATS.
*   **Localización Nativa:** Soporte robusto y sin costuras para ES, EN e IT, detectando automáticamente el idioma de la oferta laboral para alinear el CV.

### Áreas de Mejora (UX)
*   La interfaz de edición libre en formato Markdown puede resultar intimidante para usuarios muy poco técnicos (aunque se han integrado avisos mitigadores).

---

## 2. 💡 Pilar II: Creatividad y Valor Añadido (USPs)

Aquí es donde ApplyBoost se separa de ser "un bot que resume textos" para convertirse en una herramienta de grado profesional.

### El "Ojo de Dios" (Multimodal OCR)
Los ATS tradicionales (y los OCRs baratos) fallan miserablemente leyendo barras de progreso, gráficos circulares o columnas complejas en PDFs modernos. ApplyBoost utiliza `GeminiVisionService` para interpretar visualmente el documento. Entiende la semántica del diseño, no solo el texto plano. Este es un *moat* tecnológico brutal.

### Scraper Inteligente de Ofertas (Arquitectura B->C->A)
El módulo `orchestrator.ts` en `job-sources` no depende de un solo método frágil. Tiene una cascada defensiva:
1. Intenta extraer datos usando selectores específicos de dominio (ej. LinkedIn, Infojobs).
2. Si falla, intenta extraer la URL destino saltando redirecciones.
3. Si todo falla o el servidor bloquea el scraping, tiene un fallback gracefully preparado para que el usuario pegue el texto manual.

### Determinismo en el Caos (ATS Scoring)
Mientras otras plataformas dejan que la IA "invente" un puntaje aleatorio que no transmite confianza, ApplyBoost usa un algoritmo puramente determinista y matemático (`calculateATSScore.ts`). La IA solo extrae las *keywords* de la oferta; luego el sistema calcula matemáticamente la aparición y el peso de estas palabras en zonas críticas del CV (ej: Resumen vs Experiencia antigua). Esto garantiza que si el usuario hace un cambio, el número responda lógicamente.

---

## 3. ⚙️ Pilar III: Implementación Técnica y Arquitectura

La arquitectura demuestra un nivel de "Engineering Maturity" que justifica la inversión, operando bajo la premisa de *High Availability* en un entorno de VPS restrictivo.

### Stack Tecnológico
*   **Framework:** Next.js 15 (App Router) - Serverless Edge / Node.
*   **Base de Datos y Auth:** Supabase (PostgreSQL + RLS Policies estrictas).
*   **Backend Híbrido:** Generación de documentos on-the-fly con Puppeteer (Server) acoplado a un motor de plantillas dinámicas.

### Fortalezas de Ingeniería Críticas
*   **Orquestador de LLMs (Priority Fallback):** El corazón del sistema en `src/lib/llm/index.ts`. Si un proveedor se cae (ej. Gemini tira un 429), el sistema hace fallback automático e invisible a Groq y luego a Cerebras. Esto garantiza una alta disponibilidad en la generación de texto sin depender de un solo proveedor comercial.
*   **Rotación de API Keys (Gemini):** Implementado un `GeminiKeyManager` que maneja un pool de claves (cooldown, rotación por rate-limit) para saltarse las restricciones de cuota gratuita, demostrando mentalidad de "Bootstrapper" eficiente para maximizar márgenes de ganancia temprana.
*   **Generación de Documentos Píxel-Perfect:** El motor `pdfGenerator.ts` utiliza Puppeteer para garantizar que el PDF final sea idéntico a lo que el usuario aprobó en la web, procesando HTML a PDF de manera estricta.
*   **Arquitectura de Datos Segura:** Sincronización automática de usuarios (`auth.users` -> `public.users`) mediante Triggers de Postgres, manteniendo las políticas de RLS cerradas y los créditos controlados transaccionalmente (`user_exports`).

### Riesgos y Cuellos de Botella (Technical Debt)
*   **Sobrecarga de RAM (Puppeteer):** La generación de PDFs en servidor requiere Chromium. En un VPS de 768MB de RAM, si ocurren 5 solicitudes de exportación simultáneas, podría causar un Out-Of-Memory (OOM). Se debe priorizar migrar la exportación de PDF a un microservicio Serverless dedicado (AWS Lambda/Vercel) o a un Worker externo.
*   **Dependencia en Gemini Vision:** Aunque el texto tiene fallbacks, la fase inicial del "Ojo de Dios" depende exclusivamente de Gemini Pro Vision. Si Google degrada esa API, el flujo principal se estanca.

---
*Fin del reporte auditado.*