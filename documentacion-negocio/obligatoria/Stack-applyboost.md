# Stack Técnico & Decisiones de Infraestructura — Magic Generar PDF

Documento de referencia técnica para el desarrollo de Magic Generar PDF. Recoge el stack tecnológico elegido, las decisiones de infraestructura, las obligaciones legales (GDPR), el análisis de costes por fases y la gestión de secretos.

> **Decisión fundamental:** Magic Generar PDF es una **aplicación web** (no una app móvil nativa). Se despliega como SaaS accesible desde navegador en desktop y mobile. El MVP arranca con el **Módulo 1: CV & Cover Letter Dinámico**.
> 

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Justificación |
| --- | --- | --- |
| Frontend | Next.js + React | Framework full-stack con SSR/SSG. Routing, API routes y UI en un solo repositorio. Ideal para SaaS web con SEO programático futuro. |
| Estilos | Tailwind CSS | Utilidades CSS sin fricción. Diseño responsive desde el día 1 sin escribir CSS custom. |
| Autenticación | Supabase Auth + Google OAuth | Registro y login con Gmail en un clic. JWT propagado automáticamente a PostgreSQL para RLS. |
| Backend / API | Bun + Next.js API Routes | Runtime de alto rendimiento compatible con Node.js. ~3x más rápido en startup y throughput. Lógica de negocio, orquestación del LLM round-robin, keyword matching del Score ATS, validaciones y generación de documentos. |
| Base de datos | PostgreSQL (Supabase self-hosted) | Supabase self-hosted vía Docker Compose en VPS Barcelona (EU). RLS nativo por usuario. GDPR compliant. Sin riesgo de pausa por inactividad. Sin límites de free tier. |
| Motor LLM | Round-robin multi-modelo (Groq, Cerebras, Gemini, OpenRouter...) | Cicla por lista priorizada de modelos vía .env. Si el actual agota cuota (429), pasa automáticamente al siguiente. Cero dependencia de un solo proveedor. Costo operativo cercano a €0. |
| Generación de DOC | docx.js (compatible con Bun) | Genera archivos .docx desde el mismo JSON que alimenta el PDF. Segunda salida del mismo pipeline, sin flujo paralelo. |
| Despliegue | Dokploy (CubePath VPS — Barcelona, EU) | PaaS self-hosted sobre Docker. Despliegue continuo desde Git, dominios, SSL automático y backups. Control total del entorno — Puppeteer corre sin límites de serverless. |
| Almacenamiento temporal | Supabase Storage | Solo para archivos en tránsito (CVs subidos antes de parsear). Se eliminan automáticamente tras la generación. |
| Generación de PDF | Puppeteer (headless Chromium) | Renderiza HTML/CSS a PDF pixel-perfect en el servidor propio. Sin dependencia de Google Docs ni APIs externas. El HTML se renderiza en memoria y se destruye tras generar el PDF. |
| Pagos | Stripe | Procesamiento de pagos para los tiers de exportación. Sin coste fijo, comisión del 1,4% + €0,25 por transacción (tarjetas EU). |
| Email transaccional | Resend | Emails de bienvenida, confirmación de pago y recuperación de cuenta. Plan gratuito: 3.000 emails/mes. |

---

## 🧠 Motor LLM — Decisiones de Implementación

- **Arquitectura:** Round-robin sobre lista priorizada de proveedores LLM definida en .env. Orden por defecto: Groq → Cerebras → Gemini → OpenRouter → ... (configurable sin tocar código). Si el proveedor activo devuelve 429 (cuota agotada), pasa automáticamente al siguiente sin fallar.
- **Patrón de servicio:** Cada proveedor implementa la interfaz AIService (name + chat). El orquestador es agnóstico al modelo — agregar un nuevo proveedor solo requiere crear su service y añadirlo a la lista en .env. Patrón implementado en /api-LLM-sinPagar.
- **Modo de uso:** Una sola llamada al LLM por generación, forzando salida en JSON estructurado. Sin llamadas múltiples ni fragmentadas para reducir latencia y coste por token.
- **El LLM nunca toca el formato:** Solo extrae y transforma contenido (texto del CV, keywords, cover letter, diff). El renderizado del documento es 100% determinista en el backend, independientemente del modelo LLM elegido.
- **Idioma:** El idioma de salida se pasa siempre como parámetro explícito al prompt maestro — nunca se deja inferir a la IA.
- **Control de alucinaciones:** El prompt maestro incluye la regla `FALTA_DATO`: si falta información, el sistema la marca en lugar de inventarla. Validación esquemática obligatoria del JSON devuelto antes de usarlo.
- **Salida del LLM (JSON):**
    - `cv_optimizado`: CV adaptado a la oferta
    - `cover_letter`: carta de presentación personalizada
    - `diff`: lista de cambios realizados y razones
    - `keywords`: lista de keywords para el Score ATS
- **Score ATS:** Calculado de forma **determinista en el backend** mediante keyword matching, no por la IA. El LLM extrae las keywords; el backend hace la comparación y calcula el porcentaje. Peso extra para keywords en título, resumen y skills.

---

## 📄 Motor de Documentos — Decisiones de Implementación

### PDF (Puppeteer)

- Renderiza HTML/CSS a PDF en el servidor propio (headless Chromium)
- Control absoluto del diseño: márgenes, tipografía, paginación pixel-perfect
- El HTML se renderiza en memoria y se destruye tras generar el PDF — sin archivos temporales
- Sin dependencia de Google Docs ni APIs externas — sin rate limits ajenos, sin datos en terceros
- Respuesta estimada: <5 segundos por generación

### DOC (docx.js)

- Genera .docx desde el mismo JSON estructurado que alimenta el PDF
- Segunda salida del mismo motor — sin pipeline paralelo ni plantillas separadas
- **No replica** el diseño visual del PDF: sin columnas complejas ni elementos gráficos
- Advertencia visible antes de descargar: *“El formato DOC puede variar ligeramente respecto al preview. Recomendamos el PDF para enviar a reclutadores.”*
- Mantenimiento: la plantilla DOC y la plantilla HTML/PDF son independientes — cada cambio de diseño debe aplicarse en los dos sitios. Coste asumido y documentado.

### Pipeline unificado

```
JSON (LLM output)
       ↓
   Backend Node.js
   ├── HTML template → Puppeteer → PDF
   └── docx.js → DOC
```

---

## 🏗️ Decisión de Infraestructura — Variante A (Vercel + Supabase) vs Variante B (Self-hosted)

### Variante A — Vercel + Supabase Cloud (DESCARTADA ❌)

### Variante B — CubePath VPS + Dokploy + Supabase self-hosted (ELEGIDA ✅)

| Ventaja | Detalle |
| --- | --- |
| Despliegue | Push a Git → deploy automático en Vercel. Sin configuración de servidor. |
| Base de datos + Auth integrados | Supabase gestiona PostgreSQL + Auth + Storage en un solo proveedor. JWT propagado automáticamente a RLS. |
| GDPR | Supabase Frankfurt (EU West). Ningún dato de usuario fuera de la UE. |
| Coste MVP | €0/mes |
| Setup estimado | ~1-2 días |
| Escalado | Lineal y predecible: Vercel Pro + Supabase Pro cuando llegue el momento |

| Problema | Detalle |
| --- | --- |
| Gestión de servidor | Nginx, SSL, actualizaciones de seguridad, backups — trabajo de DevOps no justificado en el MVP |
| Puppeteer en VPS | Viable pero requiere configurar Chromium manualmente. En Vercel se gestiona via `@sparticuz/chromium`. |
| Coste MVP | ~€10-20/mes (VPS mínimo) vs €0 en Variante A |
| Setup estimado | ~5-7 días |

> **Motivo de elección:** CubePath VPS + Dokploy ofrece control total del entorno de ejecución, costes fijos predecibles y elimina los límites de funciones serverless que afectaban a Puppeteer en Variante A. Supabase self-hosted sobre Docker Compose elimina el riesgo de pausa por inactividad y las restricciones de free tier. El VPS está ubicado en Barcelona (España, UE) garantizando cumplimiento GDPR desde el primer día.
> 

> ⚠️ **Excepción con Puppeteer en Vercel:** Vercel tiene un límite de 50MB por función serverless y un timeout de 10s en el plan gratuito (60s en Pro). Puppeteer con `@sparticuz/chromium` entra dentro de ese límite pero debe validarse con los primeros PDFs reales. Si hay problemas de timeout en generaciones complejas, la solución es mover Puppeteer a un servicio separado (Railway o Render) manteniendo el resto en Vercel.
> 

---

## 💰 Escalado de Costes por Fases

| Fase | Exportaciones/mes aprox. | Coste mensual | Qué ocurre |
| --- | --- | --- | --- |
| MVP | 0–1.000 | €0 | Todo en free tier (Vercel, Supabase, Gemini, Resend) |
| Primeros usuarios | 1.000–5.000 | ~€25-30/mes | Supabase Pro ($25) si se supera free tier. Vercel gratuito aguanta. |
| Tracción | 5.000–20.000 | ~€50-80/mes | Vercel Pro ($20) + Supabase Pro ($25) + coste LLM |
| Escala media | 20.000–100.000 | ~€150-300/mes | Supabase Pro con add-ons de compute + Vercel Pro |
| Escala grande | +100.000 exportaciones | A evaluar | Evaluar Supabase Team o self-hosted en Hetzner VPS |

**Coste variable por exportación (estimado):**

| Concepto | Coste estimado |
| --- | --- |
| Llamada LLM (Gemini) | ~€0,002–0,005 por generación |
| Puppeteer (CPU en Vercel) | Incluido en el plan hasta límite de tiempo de función |
| Supabase (BD + Storage) | Despreciable por generación |
| **Total estimado por exportación** | **<€0,01** |

> **Margen confirmado:** Con un coste variable <€0,01 por exportación y un precio de €0,90/exportación (tier de 9€/10), el margen bruto por exportación es >98% antes de costes fijos.
> 

**Validación de límites de free tier por proveedor:**

| Proveedor | Límite gratuito | Consumo estimado (500 usuarios/mes) | ¿Aguanta? | Plan de pago si se supera |
| --- | --- | --- | --- | --- |
| Gemini API | 1.500 req/día | ~500 req/día (500 usuarios × 1 generación/día media) | ✅ Sí hasta ~1.500 usuarios activos/día | Plan de pago: ~$0,0025/1K tokens. Coste bajo. |
| Vercel | 100GB bandwidth + 100h compute/mes | Bajo en MVP | ✅ Sí en MVP | Pro: $20/mes |
| Supabase | 500MB BD + 1GB storage + 50K MAU | Bajo en MVP | ✅ Sí hasta ~2.000 MAU | Pro: $25/mes |
| Resend | 3.000 emails/mes | ~500-1.000 emails/mes en MVP | ✅ Sí en MVP | Pro: $20/mes para 50.000 emails |
| Stripe | Sin free tier, solo comisión | 1,4% + €0,25 por transacción EU | ✅ Sin coste fijo | — |

> ⚠️ **Riesgo operativo — Supabase pausa proyectos inactivos:** Supabase pausa automáticamente los proyectos en el plan gratuito si no hay actividad durante 7 días. En fase MVP con usuarios reales esto causaría una interrupción inesperada. **Mitigación:** activar el Plan Pro ($25/mes) en cuanto haya los primeros usuarios reales, sin esperar al límite de free tier.
> 

---

## 🔒 GDPR y Privacidad — Obligaciones Legales

> Magic Generar PDF opera en la UE y está sujeto al Reglamento General de Protección de Datos (GDPR). Las siguientes decisiones son obligatorias, no opcionales.
> 

**1. Servidores en la UE**

VPS CubePath en Barcelona (España, UE). Toda la infraestructura — aplicación, base de datos, almacenamiento — corre en el mismo servidor en territorio español. Ningún dato de usuario se almacena fuera de la UE. El servidor es de acceso exclusivo (no compartido), lo que garantiza aislamiento total de datos entre proyectos.

**2. Datos sensibles del CV — Sin persistencia en terceros**

Los CVs contienen datos personales sensibles (nombre, DNI en algunos casos, dirección, teléfono). Arquitectura obligatoria:

- El CV subido se almacena temporalmente en Supabase Storage (EU) solo durante el procesamiento
- El HTML se renderiza en memoria en el servidor (Vercel Function) y se destruye tras generar el PDF
- Ningún archivo temporal se crea en Google Drive ni en servicios externos
- El PDF final se entrega directamente al usuario — no se almacena en el servidor más allá de la descarga
- El CV original subido se elimina automáticamente de Supabase Storage tras la generación (TTL máximo: 1 hora)

**3. Derecho al Borrado (Right to Erasure — Art. 17 GDPR)**

Cualquier usuario puede solicitar la eliminación permanente de su cuenta y todos sus datos asociados.

- Botón **“Eliminar cuenta”** accesible desde los ajustes del perfil
- Hard delete en cascada de todos sus registros (perfil estructurado, historial de versiones, logs de uso)
- No se conservan copias de los CVs originales tras la eliminación
- Proceso irreversible con confirmación explícita antes de ejecutarse

**4. Consentimiento Explícito en el Registro**

- Checkbox no pre-marcado para aceptar Términos de Uso y Política de Privacidad
- El email solo puede usarse para acceso a la cuenta y notificaciones transaccionales
- Marketing o comunicaciones comerciales requieren consentimiento separado y explícito

**5. Retención de Datos**

- El CV base estructurado y el historial de versiones se conservan mientras el usuario tenga cuenta activa
- Los archivos originales subidos (PDF/DOC del CV) se eliminan automáticamente tras la generación
- Los logs de uso (campos FALTA_DATO, ediciones, regeneraciones) se conservan de forma anónima para mejorar el sistema
- Política de Privacidad pública obligatoria antes del lanzamiento

---

## 📡 Infraestructura — Decisiones Clave

- **Aplicación web responsiva:** Funciona en desktop y mobile desde el navegador. Sin app nativa en el MVP. El flujo de 2 pantallas (Input → Output) está diseñado para ser usable en móvil aunque el caso de uso principal es desktop.
- **Preview no copiable:** El texto del preview (CV y Cover Letter) en la Pantalla 2 tiene deshabilitado el click derecho, la selección de texto y Ctrl+C/Ctrl+V. El contenido solo es accesible mediante exportación (detrás del paywall).
- **Paywall en el momento de exportar:** El flujo completo es gratuito. El paywall cae al pulsar cualquier botón de descarga (PDF, DOC, texto). 1 exportación gratuita al registrarse con Gmail.
- **Sin modo offline:** La app requiere conexión a internet. El LLM, Puppeteer y la BD son servicios en la nube.
- **Autenticación exclusivamente con Google OAuth en el MVP:** Simplifica el flujo de registro y elimina la gestión de contraseñas. Email/contraseña se evalúa para fases posteriores.
- **Logs de uso desde el día 1:** Cada generación registra: campos FALTA_DATO marcados y rellenados, ediciones manuales realizadas, regeneraciones con otro tono/idioma, tiempo en preview antes de exportar, formato descargado. Tabla `generation_logs` en PostgreSQL desde el primer despliegue.

---

## 🧪 Entornos — Desarrollo, Staging y Producción

| Entorno | Supabase project | Vercel config | Uso |
| --- | --- | --- | --- |
| Development | Proyecto Supabase separado (free tier) | `ENV=dev` en `.env.local` | Desarrollo local. Datos de prueba. Migraciones nuevas. |
| Staging | Proyecto Supabase separado (free tier) | Variables de entorno en Vercel Preview | Validación de releases. Beta cerrada. |
| Production | Proyecto Supabase Pro | Variables de entorno en Vercel Production | Usuarios reales. Solo recibe releases validados en staging. |

**Reglas de gestión de migraciones de BD:**

1. Toda migración se prueba primero en Development con `supabase db reset`.
2. Se despliega en Staging con `supabase db push` y se valida manualmente.
3. Solo se despliega en Production tras validación en Staging.
4. Las migraciones en Production son siempre aditivas en el MVP — nunca destructivas sin deprecación previa.

**Reglas de gestión de API Routes (Next.js):**

1. Las API Routes se prueban localmente con `next dev`.
2. Se despliegan automáticamente en Vercel Preview al hacer push a una rama de feature.
3. Solo se mergean a `main` (Production) tras validación en Preview/Staging.
4. Los secretos de cada entorno se gestionan por separado en Vercel Environment Variables.

---

## 🔑 Gestión de Secretos y API Keys

Magic Generar PDF usa cinco proveedores externos con claves de API sensibles. Su gestión incorrecta es un riesgo de seguridad crítico.

**Almacenamiento:**

- Todas las claves se almacenan como **Vercel Environment Variables** (cifradas) o **Supabase Vault secrets**, nunca en el repositorio de código ni en archivos `.env` versionados.
- Las claves nunca se exponen en el cliente (Next.js). Todas las llamadas a APIs externas se hacen desde API Routes del servidor.
- El `.gitignore` debe incluir explícitamente `.env.local` y cualquier archivo `.env.*` desde el primer commit.

**Claves a gestionar:**

| Clave | Proveedor | Dónde se usa | Rotación recomendada |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Google | API Route `generate` (llamada al LLM) | Cada 90 días |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | API Routes con acceso admin a la BD | Cada 90 días |
| `STRIPE_SECRET_KEY` | Stripe | API Route de webhooks y creación de sesiones de pago | Cada 90 días |
| `STRIPE_WEBHOOK_SECRET` | Stripe | Verificación de webhooks de Stripe | Cada 90 días o al rotar el endpoint |
| `RESEND_API_KEY` | Resend | API Route de emails transaccionales | Cada 90 días |

**Rotación periódica de claves — mecanismo de recordatorio:**

Cada clave debe rotarse cada 90 días. Para garantizar que esto ocurre en la práctica y no solo en papel: crear una tarea recurrente cada 90 días en el gestor de tareas del equipo (Notion, Linear o equivalente) titulada "Rotar API Keys — Magic Generar PDF", con la lista de las 5 claves como checklist. La primera tarea se crea el mismo día del primer despliegue en producción.

**Protocolo ante filtración de una clave:**

1. Revocar la clave comprometida en el dashboard del proveedor de forma inmediata.
2. Generar una nueva clave en el mismo dashboard.
3. Actualizar la variable de entorno en Vercel (Production, Preview y Development por separado).
4. Hacer un nuevo despliegue en Vercel para que las nuevas variables entren en vigor.
5. Verificar en logs que las llamadas posteriores usan la nueva clave correctamente.

**Acceso a los secretos:**

- Solo el fundador tiene acceso a los dashboards de Vercel y Supabase en el MVP.
- **Plan de acceso de emergencia:** Antes del primer despliegue en producción, el fundador debe designar una segunda persona de confianza (co-fundador, CTO, persona cercana) con acceso de respaldo a los dashboards de Vercel y Supabase. Esta persona solo actúa si el fundador no está disponible ante un incidente en producción. El acceso se gestiona como miembro adicional en Vercel Team y Supabase Organization con rol de administrador.
- Al crecer el equipo, restringir el acceso por rol usando las políticas de equipos de Vercel y Supabase Organizations.

---

## 📊 Gobernanza Documental — Estándar Obligatorio del Proyecto

<aside>
🚨 **Esto no es una recomendación. Es un requisito de contribución.** Ningún PR se mergea si no cumple con la gobernanza documental definida aquí.

</aside>

### Archivos de gobernanza y su propósito

- `docs/README.md` — Objetivo del proyecto, setup local, comandos principales y estructura de carpetas. Se actualiza cada vez que cambia el setup o la estructura.
- `docs/PROJECT_STATE.md` — Estado actual: completado, en progreso, pendiente y métricas clave. Se actualiza en cada sprint o milestone relevante.
- `docs/ARCHITECTURE.md` — Stack, ADRs (Architecture Decision Records), integraciones y riesgos técnicos. Cada decisión arquitectónica significativa genera un ADR nuevo.
- `AGENTS.md` — Contexto para agentes de IA: restricciones, comandos frecuentes, convenciones del proyecto. Actualizar cuando cambian convenciones o se agregan herramientas.
- `CHANGELOG.md` — Cambios por versión en formato Keep a Changelog. Obligatorio en cada PR que toque funcionalidad, API o infraestructura.

### Definition of Done — checklist de merge

- ✅ El código funciona y los tests pasan
- ✅ CHANGELOG.md actualizado con la entrada correspondiente
- ✅ Si cambió el setup, arquitectura o estructura → docs/README.md o docs/ARCHITECTURE.md actualizados
- ✅ Si se tomó una decisión arquitectónica → ADR nuevo en docs/ARCHITECTURE.md
- ✅ Si cambiaron comandos, convenciones o context de IA → AGENTS.md actualizado

### Formato ADR (Architecture Decision Record)

```markdown
## ADR-XXX: [Título de la decisión]

**Fecha:** YYYY-MM-DD  
**Estado:** Propuesta | Aceptada | Descartada | Reemplazada por ADR-YYY

**Contexto:** Por qué fue necesario tomar esta decisión.

**Decisión:** Qué se decidió y por qué.

**Consecuencias:** Qué implica esta decisión a futuro (ventajas y deuda asumida).
```