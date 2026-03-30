Prompt 1 — analizar oferta
Analiza esta oferta y devuelve: 1) 8 keywords ATS prioritarias, 2) 3 skills técnicas clave, 3) tono y seniority.
Oferta: {{job_description}}

Prompt 2 — analizar CV
Extrae del CV: 1) skills principales, 2) experiencia relevante resumida, 3) huecos frente a la oferta.
CV: {{cv_text}}

Prompt 3 — adaptar
Reescribe las secciones: titular (summary), primer bloque de experiencia y 6 bullets de logros, optimizados para las keywords: {{keywords}}. No inventes experiencia. Si hay que recortar, prioriza lo más relevante.
CV original: {{cv_text}}

Prompt 4 — diff / explicación
Resume los cambios: Bullets añadidos, keywords insertadas, frases reescritas. Indica por qué cada cambio aumenta el match ATS.


1) Extraer keywords ATS
Eres un experto en reclutamiento técnico. Dada esta oferta, devuelve una lista ordenada de 10 keywords que un ATS buscaría, separadas por comas. Incluye variaciones (p.ej. "nodejs", "node.js").
Oferta: {{job_description}}

2) Reescritura de experiencia (bullets)
Eres editor profesional de CVs. Toma este fragmento de experiencia (rol, empresa, tareas) y reescríbelo en 4 bullets orientados a impacto y métricas, usando las siguientes keywords: {{keywords}}. No inventes datos; si falta número, sugiere dónde preguntar al candidato.
Fragmento: {{experience_text}}

3) Explicación de cambios
Enumera cada cambio realizado, el motivo (ATS/claridad/tono) y el impacto esperado (1–2 líneas). Formato: "- Cambio → Motivo → Impacto".


Escribe una cover letter personalizada basada en:

- CV del candidato
- oferta de trabajo


Reglas:
- no usar frases genéricas típicas
- no repetir el CV literalmente
- explicar por qué encaja específicamente en este rol
- usar un tono natural y humano
- ser concreta (máximo 250-300 palabras)
- adaptar el lenguaje al país/idioma de la oferta

Estructura:
1. apertura breve y directa
2. conexión clara entre experiencia y requisitos clave
3. 1–2 ejemplos concretos (impacto o logros)
4. cierre con intención

Oferta:
{{job_description}}

CV:
{{cv_text}}




Eres un experto en optimización de CVs y redacción profesional. Tienes que producir cuatro salidas separadas en JSON: 
1) "cv_optimizado": versión del CV adaptada a la oferta;
2) "cover_letter": carta de presentación personalizada (máx 250 palabras);
3) "diff": lista de cambios realizados y razones (formato: [{campo, antes, despues, motivo}]);
4) "keywords": lista de 12 keywords/variantes importantes para ATS.

Reglas:
- NO inventes experiencia ni fechas. Si faltan métricas, marca "FALTA_DATO" para que el usuario lo confirme.
- Optimiza para ATS usando palabras clave de la oferta.
- Mantén coherencia: no contradigas el CV original.
- Adapta el tono al de la oferta (formal, técnico, comercial...).
- Incluye en la cover letter un elemento personal que tome la "preferencia" del usuario (ej. querer sonar más senior).
- Devuelve en JSON puro y válido.

Input:
- CV_TEXT: {{cv_text}}
- JOB_DESCRIPTION: {{job_description}}
- USER_PREFERENCES: {{user_preferences}}  (ej.: "enfatizar experiencia internacional")


