# Design: legacy-insights-injection

## 1. Prompt Refactor (src/lib/prompts/master_cv.md)

We will integrate the three treasures into the existing structure.

### Keywords Refinement:
> - **keywords**: Lista de 12-15 palabras clave críticas. Incluye variaciones técnicas (ej. "Node.js" y "NodeJS") y sinónimos relevantes para maximizar el match ATS.

### Proactive Metrics Refinement:
> - **falta_dato_fields**: Lista proactiva de datos faltantes. Para cada hito sin métricas, sugiere una métrica específica (ej. "% de mejora", "ahorro de costo", "usuarios impactados") que el usuario debería intentar cuantificar.

### Seniority Rule (New in Process of Thought):
> 5. Detecta el nivel de seniority de JOB_DESCRIPTION (Junior, Mid, Senior, Lead) y ajusta el tono verbal del CV (ej. verbos estratégicos para Senior, verbos de ejecución para Junior).

## 2. Integrity Shield Preservation

The `ESCUDO DE INTEGRIDAD` and `REGLAS DE COVER LETTER` remain untouched, ensuring no regressions in data safety.
