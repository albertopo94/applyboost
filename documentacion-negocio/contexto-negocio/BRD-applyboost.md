# BRD — Magic Generar PDF (app)

## 1. Información del Documento

| Campo | Valor |
| --- | --- |
| Título del documento | BRD — Magic Generar PDF (app) |
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
| 1.0 | 20 mar 2026 | Fundador | Versión inicial — basada en documentación del producto |

---

## 3. Resumen Ejecutivo

Magic Generar PDF es un motor de automatización de flujos de trabajo documentales basado en IA. El sistema toma inputs no estructurados del usuario (CVs, ofertas de trabajo, notas, datos financieros), los procesa mediante un LLM de forma estructurada, y genera documentos finales (PDF / DOC / texto) precisos, profesionales y listos para usar sin fricción técnica.

El producto no compite en la categoría genérica de "generadores de PDF". Compite en nichos verticales específicos donde el documento final tiene valor de negocio directo: optimización de candidaturas laborales, contratos legales, facturas para freelancers y reportes financieros automáticos.

El MVP inicial se centra en el **Módulo 1: CV & Cover Letter Dinámico**, orientado a perfiles tech y digitales Junior/Mid en España e Italia que aplican a volumen alto de ofertas. El impacto esperado es reducir de 30-60 minutos a menos de 30 segundos el tiempo necesario para adaptar un CV a una oferta específica, con un resultado de calidad profesional y optimizado para filtros ATS.

---

## 4. Contexto y Antecedentes

**4.1 Situación actual**

Los candidatos envían el mismo CV genérico a todas las ofertas porque adaptarlo manualmente es un proceso lento (estimado 30-60 min por candidatura). Resultado: los filtros automáticos ATS (Applicant Tracking Systems) los rechazan antes de que un humano vea su perfil. Las herramientas existentes (ChatGPT, Canva, Google Docs) requieren ingeniería de prompts, no generan PDFs con diseño exacto, y obligan al usuario a hacer copy-paste manual entre herramientas.

**4.2 Problema u oportunidad de negocio**

Existe una brecha clara entre la demanda de personalización de candidaturas y la oferta de herramientas que lo resuelvan con cero fricción. El usuario no quiere aprender a usar una herramienta — quiere pegar una URL de oferta y recibir un PDF listo para enviar en 15 segundos. Ninguna herramienta actual resuelve esto de forma completa: diseño pixel-perfect + optimización ATS + cover letter integrada + control del usuario sobre el resultado.

**4.3 Alineación estratégica**

El producto se construye sobre una ventaja competitiva a largo plazo (moat) basada en dos pilares:

1. **Dominio del workflow del nicho:** ser dueños del flujo completo (ingesta → estructuración → adaptación → validación → render → exportación), no solo de una parte.
2. **Datos de uso acumulados:** cada generación alimenta una tabla de logs (campos FALTA_DATO, ediciones manuales, regeneraciones, tiempo en preview, formato descargado) que retroalimenta el prompt maestro y los validadores con el tiempo. Este activo de datos no puede ser replicado rápidamente por competidores nuevos.

---

## 5. Objetivos del Negocio

| ID | Objetivo | Indicador de éxito | Responsable |
| --- | --- | --- | --- |
| OBJ-001 | Validar que el usuario percibe valor real antes de pagar | % de usuarios que completan el flujo y llegan a la pantalla de resultado (objetivo: >60%) | Product Owner |
| OBJ-002 | Generar conversión a pago desde la exportación | % de usuarios que exportan al menos una vez tras la prueba gratuita (objetivo: >20%) | Product Owner |
| OBJ-003 | Posicionar el producto como herramienta de confianza, no de magia negra | % de usuarios que descargan el PDF sin editar el resultado manualmente (objetivo: >50% en primeros 30 días) | Product Owner |
| OBJ-004 | Validar el diferenciador multi-idioma cultural como driver de adopción en Italia | % de usuarios italianos sobre total de registros en los primeros 60 días | Product Owner |
| OBJ-005 | Establecer el modelo de datos desde el día 1 para construir el moat | Tabla de logs operativa desde el primer día en producción | Tech Lead |

---

## 6. Alcance del Proyecto

**6.1 Dentro del alcance (MVP — Módulo 1)**

- Ingesta de CV en PDF, DOC o texto pegado
- Ingesta de oferta de trabajo por texto o URL (con fallback a pegado manual si la URL es inaccesible)
- Ingesta opcional de cover letter de referencia y notas/preferencias del usuario
- Clasificación de intención: CV solo / Cover Letter solo / Ambos
- Detección automática de idioma de la oferta con override manual (ES / EN / IT)
- Procesamiento por LLM con prompt maestro estructurado (salida en JSON)
- Cálculo determinista de Score ATS por keyword matching en el backend
- Generación de Diff explicado (qué cambió y por qué)
- Generación de sección "Por qué funciona esta cover letter"
- Edición inline del output antes de exportar (texto libre, estructura protegida)
- Exportación en PDF (Puppeteer), DOC (docx.js) y texto plano
- Paywall en el momento de exportar: 1 exportación gratuita con registro Gmail, 9€/10 exportaciones, 19€/mes ilimitado
- Preview no copiable (deshabilitado click derecho, selección y Ctrl+C/Ctrl+V)
- Historial de versiones vinculado a cada oferta, con campo opcional "¿Conseguiste entrevista?"
- Registro de logs de uso por generación (campos FALTA_DATO, ediciones, regeneraciones, tiempo, formato)
- Autenticación con Google (Gmail)

**6.2 Fuera del alcance (MVP)**

- Módulo 2: Contratos y Documentos Legales
- Módulo 3: Facturas Inteligentes
- Módulo 4: Reportes Automáticos
- Integración con GitHub (Modo Dev) — feature post-MVP del Módulo 1
- SEO programático y extensión de Chrome — canales de adquisición post-validación
- Aplicación móvil nativa
- Panel de administración / dashboard de métricas interno
- Soporte multi-idioma más allá de ES / EN / IT

**6.3 Supuestos**

- El usuario tiene un CV existente en algún formato digital (PDF, DOC o texto)
- El mercado objetivo (perfiles tech Junior/Mid en España e Italia) tiene tolerancia a probar herramientas de IA de pago si el valor es evidente antes del cobro
- El LLM seleccionado (Gemini API) tiene suficiente calidad para optimización de CVs sin alucinaciones frecuentes si el prompt está bien estructurado
- Puppeteer puede ejecutarse en el servidor propio sin restricciones de infraestructura
- El keyword matching determinista para el Score ATS es suficientemente preciso para generar confianza en el usuario del MVP

**6.4 Restricciones**

- Privacidad y GDPR: datos sensibles (CVs, DNIs si aplica) no deben persistir en servidores de terceros. El HTML se renderiza en memoria en el servidor propio y se destruye tras generar el PDF.
- Las API Keys del LLM deben mantenerse siempre en el backend, nunca expuestas en el cliente.
- El formato DOC no replica el diseño visual del PDF — limitación técnica de docx.js asumida y comunicada al usuario mediante advertencia visible.
- Coste por token del LLM debe modelarse en el pricing para mantener márgenes positivos desde el tier de 9€/10 exportaciones.
- La extensión de Chrome e InfoJobs scraping pueden tener restricciones de términos de servicio que requieren análisis legal antes de implementar.

**6.5 Dependencias**

- Disponibilidad y estabilidad de la Gemini API (o LLM equivalente)
- Capacidad de Puppeteer para correr en el entorno de servidor elegido
- Integración con Stripe para procesamiento de pagos
- Integración con Google OAuth para autenticación
- Accesibilidad del contenido de URLs de ofertas de trabajo (LinkedIn, InfoJobs, etc.) — con fallback documentado cuando están bloqueadas

---

## 7. Stakeholders

| Stakeholder | Rol | Interés en el proyecto | Nivel de influencia |
| --- | --- | --- | --- |
| Fundador | Patrocinador + Product Owner | Validar el modelo de negocio y construir el MVP | Alto |
| Perfiles tech Junior/Mid (ES + IT) | Usuario final | Conseguir más entrevistas con menos esfuerzo | Alto |
| Reclutadores y sistemas ATS | Usuario indirecto | Reciben los CVs generados — no interactúan con el producto | Medio |
| Área Legal/Compliance | Asesor externo | GDPR, términos de servicio, scraping de URLs | Medio |
| Proveedor LLM (Google Gemini) | Proveedor tecnológico | Disponibilidad y costos de API | Alto |

---

## 8. Requisitos de Negocio

| ID | Requisito de negocio | Prioridad | Origen | Criterio de aceptación |
| --- | --- | --- | --- | --- |
| RN-001 | El sistema debe generar un CV optimizado para ATS a partir de un CV base y una oferta de trabajo | Alta | Product Owner | El CV generado contiene las keywords principales de la oferta y el Score ATS mejora respecto al CV original |
| RN-002 | El sistema debe generar una Cover Letter personalizada conectada al CV y a la oferta | Alta | Product Owner | La cover letter no usa clichés de apertura, tiene estructura definida (apertura directa → conexión → ejemplos → cierre) y máximo 300 palabras |
| RN-003 | El sistema debe mostrar al usuario exactamente qué cambió y por qué antes de exportar | Alta | Product Owner | El Diff es visible en la pantalla de resultado con al menos 3 cambios explicados antes de cualquier exportación |
| RN-004 | El sistema no debe inventar experiencia, fechas ni métricas que no estén en el CV original | Alta | Product Owner | Si falta un dato relevante, el sistema marca FALTA_DATO en lugar de inventar. Validado en QA con CVs incompletos |
| RN-005 | El usuario debe poder exportar el resultado en PDF con diseño profesional pixel-perfect | Alta | Product Owner | El PDF generado no tiene márgenes rotos, texto cortado ni problemas de paginación en al menos el 95% de los casos |
| RN-006 | El sistema debe soportar inputs y outputs en español, inglés e italiano con adaptación cultural | Alta | Product Owner | Un CV en español optimizado para una oferta en inglés produce un CV y cover letter en inglés con vocabulario y tono apropiados para el mercado anglosajón |
| RN-007 | El usuario debe poder registrarse con Gmail y recibir 1 exportación gratuita | Alta | Product Owner | El flujo de registro con Google OAuth completa en menos de 3 clics y la exportación gratuita se activa automáticamente |
| RN-008 | El sistema debe procesar y generar el resultado en menos de 30 segundos en condiciones normales | Media | Product Owner | El tiempo entre pulsar "Optimizar y generar" y ver la pantalla de resultado es ≤30s en el 90% de los casos |
| RN-009 | Los datos sensibles del usuario (CV, oferta) no deben persistir en servidores de terceros | Alta | GDPR / Legal | El HTML se renderiza en memoria en el servidor propio y se destruye tras generar el PDF. No se crean archivos temporales en Google Drive ni servicios externos |
| RN-010 | El sistema debe guardar el historial de versiones vinculado a cada oferta | Media | Product Owner | El usuario puede ver versiones anteriores de su CV con la oferta asociada y el resultado (entrevista sí/no/pendiente) |

---

## 9. Requisitos de Transición

- **Onboarding:** El primer uso debe ser autoexplicativo sin necesidad de tutorial. El wizard de 2 pantallas (Input → Output) debe guiar al usuario sin documentación adicional.
- **Migración de datos:** No aplica para el MVP — no hay sistema previo que migrar.
- **Capacitación:** No aplica para usuarios finales. El equipo de desarrollo debe documentar el prompt maestro y los validadores antes del primer despliegue.
- **Rollout:** Lanzamiento inicial con landing page + registro Gmail + 1 exportación gratuita. Validación con usuarios beta antes de activar los tiers de pago.

---

## 10. Análisis de Impacto

**10.1 Impacto en procesos de negocio**

El producto reemplaza un proceso manual de 30-60 minutos (adaptar CV + redactar cover letter + exportar a PDF) por un flujo automatizado de menos de 30 segundos. El proceso afectado es completamente del lado del usuario final — no hay procesos internos de empresa que se modifiquen en el MVP.

**10.2 Impacto organizacional**

No aplica en el MVP — el equipo es unipersonal o muy reducido. A futuro, el volumen de logs de uso generará necesidad de un rol de Data Analyst para explotar el moat de datos.

**10.3 Impacto en sistemas existentes**

No hay sistemas existentes que reemplazar. El producto es nuevo. Las integraciones nuevas que introduce son: Google OAuth, Stripe, Gemini API (o LLM equivalente), Puppeteer en servidor propio.

---

## 11. Análisis Costo-Beneficio (resumen)

| Concepto | Estimación |
| --- | --- |
| Costo estimado del proyecto (MVP) | Por definir — principalmente tiempo de desarrollo + costos de infraestructura (servidor, dominio, SSL) |
| Costo variable por exportación | Costo por token LLM + tiempo de Puppeteer (estimado <0,01€ por generación completa — ver Stack Técnico para el desglose detallado) |
| Beneficio esperado — tier 9€/10 exp. | Margen positivo si el costo por exportación es <0,90€ |
| Beneficio esperado — tier 19€/mes | Rentable a partir de ~25 exportaciones/mes por usuario al precio de <0,76€/exportación |
| ROI estimado | Pendiente de validar con datos reales post-lanzamiento |
| Período de recuperación | Pendiente — depende de velocidad de adquisición de usuarios |

---

## 12. Riesgos de Negocio

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
| --- | --- | --- | --- | --- |
| R-001 | El LLM genera alucinaciones (inventa experiencia o métricas) erosionando la confianza del usuario | Media | Alto | Sistema de validación con FALTA_DATO + reglas deterministas en el prompt + revisión humana obligatoria antes de exportar |
| R-002 | El Score ATS por keyword matching es percibido como poco preciso o arbitrario | Media | Medio | Comunicar claramente que es una estimación de keywords y mostrar el antes/después para que el valor sea tangible independientemente del número exacto |
| R-003 | Las URLs de ofertas de trabajo (LinkedIn, InfoJobs) bloquean el scraping | Alta | Medio | Fallback documentado y fluido: el sistema solicita pegar el texto manualmente sin bloquear el flujo |
| R-004 | El formato DOC no se ve igual que el preview y genera frustración | Media | Medio | Advertencia visible antes de descargar + recomendación de usar PDF para envíos a reclutadores |
| R-005 | Competidores grandes (LinkedIn, Google) integran funcionalidad similar de forma nativa | Baja (corto plazo) | Alto | El moat está en el workflow completo + datos acumulados + adaptación cultural multi-idioma, no solo en la generación de PDF |
| R-006 | Costos de LLM por token escalan más rápido que los ingresos en los primeros meses | Media | Medio | Modelar el costo por generación desde el día 1 y activar rate limiting en el tier gratuito si es necesario |
| R-007 | Problemas de GDPR por manejo incorrecto de datos sensibles del CV | Baja | Alto | Arquitectura sin persistencia de datos en terceros, política de borrado automático tras generar el PDF, revisión legal antes del lanzamiento |

---

## 13. Criterios de Aceptación del Proyecto

El negocio considerará el MVP exitoso cuando se cumplan estas condiciones:

1. **Flujo completo funcional:** Un usuario puede pasar de subir un CV a descargar un PDF optimizado en menos de 30 segundos sin errores bloqueantes.
2. **Calidad del output:** Al menos el 80% de los CVs generados en pruebas beta no requieren correcciones mayores por parte del usuario.
3. **Confianza en el sistema:** El sistema nunca inventa experiencia o métricas — el 100% de los campos inventados se marcan como FALTA_DATO en QA.
4. **Conversión validada:** Al menos el 15% de los usuarios que completan el flujo gratuito realizan una compra en los primeros 30 días.
5. **Infraestructura estable:** El sistema soporta al menos 50 generaciones concurrentes sin degradación de rendimiento.
6. **Compliance GDPR:** Ningún dato sensible de usuario persiste en servidores de terceros tras la generación del PDF.

---

## 14. Aprobaciones

| Rol | Nombre | Firma | Fecha |
| --- | --- | --- | --- |
| Patrocinador del proyecto | — | — | — |
| Product Owner | — | — | — |
| Director de TI / Tech Lead | — | — | — |
| Representante Legal/Compliance | — | — | — |