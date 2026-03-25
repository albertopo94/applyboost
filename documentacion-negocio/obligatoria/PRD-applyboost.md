# PRD — Magic Generar PDF (Product Requirements Document)

## 1. Información del Documento

| Campo | Valor |
| --- | --- |
| Título del documento | PRD — Magic Generar PDF |
| Versión | 1.0 |
| Fecha de creación | 20 marzo 2026 |
| Última actualización | 20 marzo 2026 |
| Autor(es) | Fundador / Product Owner |
| Revisado por | — |
| Aprobado por | — |
| Estado | Borrador |

---

## 2. Historial de Cambios

| Versión | Fecha | Autor | Descripción del cambio |
| --- | --- | --- | --- |
| 1.0 | 20 mar 2026 | Fundador | Versión inicial — MVP Módulo 1: CV & Cover Letter Dinámico |

---

## 3. Propósito y Alcance

**3.1 Propósito**

Este documento define los requisitos funcionales y no funcionales del producto Magic Generar PDF, concretamente del MVP inicial correspondiente al Módulo 1: CV & Cover Letter Dinámico. Va dirigido al equipo de desarrollo, al Product Owner y a cualquier stakeholder que necesite entender qué debe hacer el producto antes de su construcción.

**3.2 Alcance del producto**

Magic Generar PDF es un motor de automatización de flujos de trabajo documentales basado en IA. Toma inputs no estructurados del usuario (CVs, ofertas de trabajo, notas), los procesa mediante un LLM de forma estructurada y genera documentos finales (PDF / DOC / texto) precisos, profesionales y listos para usar.

El MVP cubre exclusivamente el Módulo 1: optimización de CVs y generación de cover letters personalizadas para candidaturas laborales.

**Fuera de alcance del MVP:**

- Módulo 2: Contratos y Documentos Legales
- Módulo 3: Facturas Inteligentes
- Módulo 4: Reportes Automáticos
- Integración con GitHub (Modo Dev)
- Extensión de Chrome
- Aplicación móvil nativa
- Panel de administración interno

**3.3 Definiciones, acrónimos y abreviaturas**

| Término | Definición |
| --- | --- |
| ATS | Applicant Tracking System. Software usado por empresas para filtrar CVs automáticamente antes de que un humano los revise. |
| Score ATS | Puntuación de match calculada por keyword matching determinista entre el CV y la oferta. |
| Diff | Lista de cambios realizados por la IA al CV original, con motivo e impacto esperado de cada cambio. |
| FALTA_DATO | Marca insertada por la IA cuando detecta que falta información relevante en lugar de inventarla. |
| LLM | Large Language Model. Motor de IA (Gemini API) usado para procesar el CV y la oferta y devolver JSON estructurado. |
| Cover Letter | Carta de presentación personalizada generada en el mismo flujo que el CV optimizado. |
| Prompt maestro | Prompt único estructurado que el backend envía al LLM con todos los inputs del usuario. Devuelve el JSON completo en una sola llamada. |
| Pipeline JSON→HTML→PDF | Flujo de renderizado: el JSON del LLM se inyecta en una plantilla HTML y Puppeteer lo convierte a PDF pixel-perfect. |
| Paywall | Barrera de pago que aparece en el momento de exportar (descargar PDF/DOC). El flujo previo es gratuito. |

**3.4 Referencias**

- BRD — Magic Generar PDF
- Stack Técnico & Decisiones de Infraestructura — Magic Generar PDF
- Wireframes — Módulo 1
- Página principal: 📑 Magic Generar PDF (app)
- Módulo 1: CV & Cover Letter Dinámico

---

## 4. Descripción General del Producto

**4.1 Perspectiva del producto**

Producto nuevo sin sistema previo que reemplazar. Se trata de una aplicación web SaaS accesible desde navegador (desktop y mobile). No compite en la categoría genérica de "generadores de PDF" sino en el nicho de herramientas de optimización de candidaturas laborales, donde el PDF es el entregable final de un flujo de trabajo con valor de negocio directo.

Integraciones externas requeridas: LLM APIs round-robin (Groq / Cerebras / Gemini / OpenRouter — configuradas vía .env), Google OAuth (autenticación), Stripe (pagos), Resend (email transaccional), Supabase self-hosted (BD + auth + storage), Dokploy + CubePath (despliegue en VPS Barcelona), Puppeteer nativo (generación de PDF).

**4.2 Funciones principales del producto**

- Ingesta de CV en PDF, DOC o texto pegado
- Ingesta de oferta de trabajo por texto o URL con fallback automático a pegado manual
- Procesamiento por LLM con prompt maestro estructurado (salida JSON en una sola llamada)
- Cálculo determinista de Score ATS por keyword matching en el backend
- Generación de Diff explicado (qué cambió y por qué)
- Generación de Cover Letter conectada al CV y a la oferta
- Sección "Por qué funciona esta cover letter" (genera confianza antes de exportar)
- Edición inline del resultado antes de exportar
- Exportación en PDF (pixel-perfect via Puppeteer), DOC (docx.js) y texto plano
- Historial de versiones vinculado a cada candidatura con campo "¿Conseguiste entrevista?"
- Registro de logs de uso por generación (moat de datos)
- Autenticación con Google OAuth y paywall en el momento de exportar

**4.3 Clases y características de usuarios**

| Tipo de usuario | Descripción | Necesidad principal |
| --- | --- | --- |
| Candidato Junior/Mid tech | Perfil tech o digital de 1-5 años de experiencia en España o Italia, aplica a volumen alto de ofertas | Reducir el tiempo de adaptación del CV por oferta de 30-60 min a <30 segundos |
| Candidato en búsqueda activa | Cualquier perfil que aplica a más de 10 ofertas al mes | Automatizar la personalización sin perder autenticidad |
| Candidato en cambio de mercado | Usuario que aplica a ofertas en otro idioma o país | Adaptación cultural del CV al mercado de destino, no solo traducción |

**Usuario no objetivo del MVP:** Reclutadores, empresas, perfiles no tech con baja tolerancia a herramientas digitales.

**4.4 Entorno operativo**

- Plataforma: Aplicación web (Next.js + React), accesible desde cualquier navegador moderno
- Dispositivos: Desktop (caso de uso principal) y mobile (responsive)
- Backend: Bun (Next.js API Routes) desplegado vía Dokploy sobre CubePath VPS (Barcelona, EU)
- Base de datos: PostgreSQL en Supabase self-hosted (Barcelona, EU, mismo VPS)
- Integraciones: LLM APIs round-robin (Groq/Cerebras/Gemini/OpenRouter), Google OAuth, Stripe, Resend, Puppeteer (nativo), docx.js
- Sin modo offline: requiere conexión a internet

**4.5 Restricciones de diseño e implementación**

- Las API Keys deben mantenerse siempre en el backend. Nunca expuestas en el cliente.
- El HTML de los CVs se renderiza en memoria en el servidor y se destruye tras generar el PDF. Sin persistencia en terceros.
- El formato DOC no replica el diseño visual del PDF. Limitación técnica de docx.js asumida y comunicada al usuario.
- El Score ATS es una estimación por keyword matching, no un sistema certificado. Debe comunicarse como tal.
- La extensión de Chrome y el scraping de LinkedIn/InfoJobs pueden tener restricciones de términos de servicio. Requieren análisis legal antes de implementar (fuera del MVP).
- Puppeteer se ejecuta en VPS (Dokploy / CubePath) sin límites de tamaño ni timeout de entornos serverless. Se instala vía `bunx puppeteer browsers install chrome` en el setup del contenedor. Debe validarse con PDFs reales antes del lanzamiento.
- Cumplimiento obligatorio del GDPR: datos sensibles del CV no pueden persistir en servidores de terceros.

**4.6 Supuestos y dependencias**

- El usuario tiene un CV existente en algún formato digital (PDF, DOC o texto)
- Al menos un proveedor LLM del pool configurado (Groq, Cerebras, Gemini, OpenRouter) tiene cuota disponible y calidad suficiente para optimización de CVs sin alucinaciones frecuentes con el prompt maestro bien estructurado
- El keyword matching determinista para el Score ATS es percibido como suficientemente útil por el usuario del MVP
- Puppeteer puede ejecutarse en el VPS de CubePath sin restricciones de entorno serverless (ni límites de tamaño ni timeouts de función)
- El mercado objetivo tiene tolerancia a pagar 9€ si el valor es demostrado antes del cobro
- Dependencias externas: disponibilidad de al menos un proveedor LLM del pool (Groq / Cerebras / Gemini / OpenRouter), Google OAuth, Stripe, Supabase self-hosted y CubePath VPS

---

## 5. Requisitos del Sistema

**5.1 Requisitos funcionales**

| ID | Requisito | Prioridad | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-001 | El sistema debe permitir al usuario subir su CV en formato PDF, DOC o pegarlo como texto | Alta | El sistema acepta los tres formatos sin error y extrae el texto correctamente en el 95% de los casos |
| RF-002 | El sistema debe permitir ingresar la oferta de trabajo por texto pegado o por URL | Alta | El sistema intenta extraer el contenido de la URL automáticamente. Si falla, solicita pegar el texto sin bloquear el flujo |
| RF-003 | El sistema debe detectar automáticamente el idioma de la oferta y usarlo como idioma de salida por defecto | Alta | El idioma detectado aparece en el selector con etiqueta "Detectado: [idioma]". El usuario puede cambiarlo manualmente (ES/EN/IT) |
| RF-004 | El sistema debe permitir al usuario seleccionar qué quiere generar: CV solo, Cover Letter sola, o ambos | Alta | Los tres modos funcionan de forma independiente y producen salidas correctas en cada combinación |
| RF-005 | El sistema debe permitir al usuario seleccionar el formato de salida: PDF, DOC o texto | Alta | Cada formato se genera correctamente. El DOC muestra advertencia antes de descargar. El texto es copiable solo desde la pantalla de exportación |
| RF-006 | El sistema debe procesar el CV y la oferta en una sola llamada al LLM y devolver un JSON estructurado con cv_optimizado, cover_letter, diff y keywords | Alta | El JSON devuelto pasa la validación esquématica del backend antes de usarse. Si falla la validación se reintenta o se informa al usuario |
| RF-007 | El sistema debe calcular el Score ATS de forma determinista en el backend mediante keyword matching | Alta | El score del CV original y del CV optimizado son visibles en la pantalla de resultado. El cálculo no depende del LLM |
| RF-008 | El sistema debe mostrar el Diff: lista de qué cambió y por qué, antes de exportar | Alta | El Diff muestra al menos 3 cambios con su motivo en el 90% de las generaciones. Es visible antes de cualquier acción de exportación |
| RF-009 | El sistema debe mostrar la sección "Por qué funciona esta cover letter" junto a la cover letter generada | Alta | La sección aparece siempre que se genera una cover letter y explica al menos 2 conexiones entre el perfil del candidato y los requisitos de la oferta |
| RF-010 | El sistema NO debe inventar experiencia, fechas ni métricas. Si falta información debe marcar FALTA_DATO | Alta | En QA con CVs incompletos, el 100% de los campos faltantes se marcan como FALTA_DATO y cero campos se inventan |
| RF-011 | Los FALTA_DATO deben tener tres niveles: bloqueante (sin CV o sin oferta), avisador (dato importante no crítico) y silencioso (dato opcional ausente) | Alta | El flujo se bloquea solo cuando falta CV u oferta. Para datos importantes genera output pero muestra el marcador editable. Para opcionales genera sin avisar |
| RF-012 | El usuario debe poder editar el resultado inline antes de exportar | Alta | El texto del CV y la cover letter es editable directamente en el preview. La estructura (secciones, formato visual) está protegida. Cambiar idioma o tono dispara regeneración completa |
| RF-013 | El score ATS debe congelarse y mostrar etiqueta explicativa si el usuario edita el resultado manualmente | Media | Tras cualquier edición manual, el score muestra la etiqueta "Score calculado antes de tu edición manual" y no se recalcula en tiempo real |
| RF-014 | El texto del preview (CV y Cover Letter) no debe ser copiable sin exportar | Alta | Click derecho, selección de texto y Ctrl+C/Ctrl+V están deshabilitados en el área de preview. El contenido solo es accesible mediante exportación |
| RF-015 | El sistema debe exportar el CV en PDF pixel-perfect con diseño profesional | Alta | El PDF generado no tiene márgenes rotos, texto cortado ni problemas de paginación en el 95% de los casos en QA |
| RF-016 | El sistema debe exportar el CV en DOC usando docx.js desde el mismo JSON que el PDF | Media | El DOC se genera correctamente con estructura jerárquica. Muestra advertencia visible antes de descargar |
| RF-017 | El sistema debe requerir registro con Google (Gmail) para exportar | Alta | El botón "Continuar con Gmail" funciona correctamente con Google OAuth. El registro completa en menos de 3 clics |
| RF-018 | El sistema debe otorgar 1 exportación gratuita al registrarse | Alta | Tras el primer registro, el usuario puede exportar 1 vez sin pago. La exportación gratuita se descuenta automáticamente y no se puede recuperar |
| RF-019 | El sistema debe ofrecer dos tiers de pago: 9€/10 exportaciones y 19€/mes ilimitado | Alta | Ambos tiers son seleccionables en la pantalla de paywall. El pago se procesa via Stripe. Las exportaciones se acreditan inmediatamente tras el pago |
| RF-020 | El sistema debe guardar el historial de versiones de cada candidatura | Media | Cada generación queda guardada con el CV generado, la oferta asociada, el idioma, el tono y la fecha. El usuario puede consultarlas desde su perfil |
| RF-021 | El historial debe incluir un campo opcional "¿Conseguiste entrevista?" (Sí / No / Pendiente) | Media | El campo aparece en cada entrada del historial y puede editarse en cualquier momento. No es obligatorio para continuar |
| RF-022 | El sistema debe mostrar mensajes de estado en cada fase del proceso, nunca un spinner sin texto | Alta | En QA, cada fase del procesamiento muestra su mensaje correspondiente. No existe ningún estado donde el usuario vea solo un spinner sin texto |
| RF-023 | El sistema debe registrar logs de uso por generación desde el día 1 | Alta | La tabla generation_logs registra correctamente: campos FALTA_DATO marcados/rellenados, ediciones manuales, regeneraciones, tiempo en preview y formato descargado |
| RF-024 | El sistema debe soportar inputs y outputs en español, inglés e italiano con adaptación cultural | Alta | Un CV en español optimizado para una oferta en inglés produce CV y cover letter en inglés con vocabulario y tono apropiados para el mercado anglosajón |
| RF-025 | La cover letter generada debe seguir una estructura definida sin clichés de apertura | Alta | En QA, ningún output generado empieza con "I am very excited to apply". La estructura es: apertura directa → conexión → ejemplos de impacto → cierre. Máximo 300 palabras |

**5.2 Requisitos no funcionales**

| ID | Categoría | Descripción | Criterio de verificación |
| --- | --- | --- | --- |
| RNF-001 | Rendimiento | El tiempo entre pulsar "Optimizar y generar" y ver la pantalla de resultado debe ser ≤30 segundos en condiciones normales | Medido en QA con al menos 20 generaciones consecutivas. El percentil 90 debe ser ≤30s |
| RNF-002 | Rendimiento | Puppeteer debe generar el PDF en menos de 5 segundos una vez recibido el JSON | Medido en el servidor. El percentil 95 debe ser <5s |
| RNF-003 | Seguridad | Todas las comunicaciones deben ir cifradas en tránsito (HTTPS/TLS) | Certificado SSL activo en producción. Sin endpoints HTTP sin cifrar |
| RNF-004 | Seguridad | Las API Keys nunca deben estar expuestas en el cliente ni en el repositorio | Auditoría del código: ninguna API Key en archivos versionados. Todas las llamadas a APIs externas desde API Routes del servidor |
| RNF-005 | Privacidad (GDPR) | Los archivos originales subidos (PDF/DOC del CV) deben eliminarse automáticamente tras la generación | TTL máximo de 1 hora en Supabase Storage. Verificado en QA con inspección del bucket tras generación |
| RNF-006 | Privacidad (GDPR) | El HTML del CV no debe persistir en el servidor tras generar el PDF | El HTML se renderiza en memoria en la Vercel Function y no se escribe a disco ni a storage |
| RNF-007 | Privacidad (GDPR) | El usuario debe poder eliminar su cuenta y todos sus datos de forma permanente | Botón "Eliminar cuenta" en ajustes. Hard delete en cascada verificado en QA: ningún registro del usuario persiste tras la eliminación |
| RNF-008 | Disponibilidad | El sistema debe tener un uptime mínimo del 99% en producción | Monitorizado con UptimeRobot (plan gratuito) apuntando al endpoint `/api/generate`. Alertas configuradas al fundador vía email ante cualquier caída. Medido mensualmente. |
| RNF-009 | Escalabilidad | El sistema debe soportar al menos 50 generaciones concurrentes sin degradación de rendimiento | El número 50 se deriva de la estimación de usuarios activos simultáneos en el pico del MVP: 500 usuarios registrados en los primeros 6 meses (OBJ-001), con una tasa de uso simultáneo estimada del 10% en hora punta = ~50 sesiones concurrentes. Test de carga con k6 antes del lanzamiento. El percentil 95 de tiempo de respuesta no debe aumentar más de un 50% bajo carga. |
| RNF-010 | Usabilidad | El flujo completo (de subir CV a ver resultado) debe ser completable sin instrucciones externas | Test de usabilidad con 5 usuarios del perfil objetivo. Al menos 4 de 5 completan el flujo sin ayuda en el primer intento |
| RNF-011 | Compatibilidad | La aplicación debe funcionar correctamente en Chrome, Firefox, Safari y Edge en sus últimas dos versiones | QA cross-browser en los 4 navegadores antes del lanzamiento |
| RNF-012 | Mantenibilidad | La plantilla HTML/CSS del PDF y la plantilla DOC son independientes. Cada cambio de diseño debe aplicarse en los dos sitios | Documentado en el Stack Técnico. El equipo de desarrollo conoce el coste de doble mantenimiento antes de empezar |
| RNF-013 | Gobernanza Documental | Todo PR debe llevar actualizados los archivos de gobernanza que correspondan según el tipo de cambio introducido: docs/README.md, docs/PROJECT_STATE.md, docs/ARCHITECTURE.md, AGENTS.md y/o CHANGELOG.md. El incumplimiento bloquea el merge. Ver §9.3 del SDD para la checklist completa. | El revisor del PR verifica la checklist documental antes de aprobar. Si algún archivo de gobernanza no está actualizado, el PR se rechaza con el comentario: 'Gobernanza pendiente — ver §9.3 del SDD'. |
| RNF-014 | Gobernanza Documental | CHANGELOG.md debe actualizarse en cada PR antes del merge, siguiendo el formato Keep a Changelog (categorías: Added, Changed, Deprecated, Removed, Fixed, Security). Sin entrada en CHANGELOG.md = PR bloqueado. | Presencia de entrada en CHANGELOG.md verificable en el diff del PR. El revisor confirma que la categoría y la descripción son correctas antes de aprobar. |

**5.3 Requisitos de interfaces externas**

*Interfaz de usuario (UI):*

- Aplicación web responsiva. Flujo de 2 pantallas: Pantalla 1 (Input) y Pantalla 2 (Output/resultado).
- Pantalla 1 organizada en 3 secciones de scroll natural: (A) ¿Qué tienes?, (B) ¿Qué quieres generar?, (C) ¿En qué formato?
- Pantalla 2 muestra: Score ATS antes/después, preview con edición inline, Diff, Cover Letter con su sección explicativa, y botones de descarga detrás del paywall.
- Estados de proceso visibles con mensajes de texto en cada fase (nunca spinner vacío).
- El texto del preview no es copiable (deshabilitado click derecho, selección y Ctrl+C/Ctrl+V).

*Interfaces de software (APIs e integraciones):*

| Sistema externo | Tipo de integración | Propósito |
| --- | --- | --- |
| Gemini API (Google) | REST API (llamada desde API Route) | Procesamiento del CV y la oferta. Devuelve JSON estructurado |
| Google OAuth | OAuth 2.0 | Autenticación del usuario con cuenta Gmail |
| Supabase | SDK Node.js | BD PostgreSQL + Auth + Storage temporal de archivos subidos |
| Stripe | REST API + Webhooks | Procesamiento de pagos para los tiers de exportación |
| Resend | REST API | Emails transaccionales (bienvenida, confirmación de pago) |
| Puppeteer | Librería Node.js | Renderizado de HTML a PDF en el servidor |
| docx.js | Librería Node.js | Generación de archivos .docx desde JSON |

*Interfaces de comunicación:*

- HTTPS en todas las comunicaciones cliente-servidor
- WebHooks de Stripe para confirmación de pagos y actualización de exportaciones disponibles

---

## 6. Gestión de Requisitos

**6.1 Trazabilidad**

| ID Requisito PRD | Requisito de negocio BRD | User Story |
| --- | --- | --- |
| RF-001, RF-002 | RN-001 | Como candidato, quiero subir mi CV y pegar una oferta para que el sistema los procese automáticamente |
| RF-006, RF-008, RF-009 | RN-001, RN-002, RN-003 | Como candidato, quiero ver qué cambió y por qué antes de descargar el documento |
| RF-010, RF-011 | RN-004 | Como candidato, quiero que el sistema jamas invente información que no está en mi CV |
| RF-015, RF-016 | RN-005 | Como candidato, quiero descargar el resultado en PDF con diseño profesional listo para enviar |
| RF-003, RF-024 | RN-006 | Como candidato italiano, quiero que mi CV se adapte culturalmente al mercado italiano sin que yo tenga que hacer nada |
| RF-017, RF-018, RF-019 | RN-007 | Como nuevo usuario, quiero registrarme con Gmail y tener una exportación gratuita para probar el producto |
| RF-022 | RN-008 | Como candidato, quiero saber en qué fase está el sistema mientras procesa mi CV |
| RF-005, RNF-005, RNF-006 | RN-009 | Como usuario, quiero saber que mis datos personales no se guardan en servidores externos |
| RF-020, RF-021 | RN-010 | Como candidato, quiero revisar qué versiones de mi CV he generado y a qué ofertas las envié |

**6.2 Criterios de priorización**

Se aplica el método **MoSCoW**:

- **Must have (MVP obligatorio):** RF-001 a RF-012, RF-014, RF-015, RF-017, RF-018, RF-019, RF-022, RF-023, RF-024, RF-025 + todos los RNF de seguridad y privacidad.
- **Should have (MVP recomendado):** RF-013 (score congelado tras edición), RF-016 (DOC), RF-020 (historial), RF-021 (campo entrevista).
- **Could have (post-MVP):** Integración GitHub (Modo Dev), SEO programático, extensión de Chrome, soporte idiomas adicionales.
- **Won’t have (fuera de alcance):** Módulos 2-4, app móvil nativa, panel de administración interno.

**6.3 Gestión de cambios**

Todo cambio material a este PRD debe:

1. Ser propuesto por escrito por el solicitante (Product Owner, Tech Lead o stakeholder).
2. Evaluarse en términos de impacto en alcance, tiempo y coste antes de aprobarse.
3. Reflejarse en una nueva versión del documento (v1.1, v1.2, etc.) con entrada en el Historial de Cambios.
4. Ser aprobado por el Product Owner antes de trasladarse al equipo de desarrollo.
5. Comunicarse explícitamente a todos los stakeholders afectados.

---

## 7. Aprobaciones

| Rol | Nombre | Firma | Fecha |
| --- | --- | --- | --- |
| Product Manager / Owner | — | — | — |
| Sponsor de negocio | — | — | — |
| Representante técnico (Tech Lead) | — | — | — |
| QA Lead | — | — | — |