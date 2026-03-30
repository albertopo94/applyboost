# Spec: legacy-insights-injection

## Requirements

1. **Keyword Variations**: The system MUST include technical synonyms and variants (e.g., "NodeJS", "Node.js") in the `keywords` list to maximize ATS coverage.
2. **Proactive Metrics**: The `falta_dato_fields` SHALL NOT be just a list of missing items. It MUST include actionable suggestions for metrics (e.g., "Add % of improvement" or "Add number of users managed").
3. **Seniority Mirroring**: The CV re-writing process MUST detect the seniority level of the Job Description and adjust the verb choices and professional summary to match (Strategic verbs for Senior, Executional verbs for Junior).

## Scenarios

### Scenario 1: Comprehensive Keywords
**Given** a job description asking for "NextJS"
**When** the keywords are generated
**Then** the list MUST include variants like ["Next.js", "NextJS", "Next JS"].

### Scenario 2: Actionable Missing Data
**Given** a CV bullet like "Developed web apps"
**When** identifying missing data
**Then** the `falta_dato_fields` SHOULD suggest: "Hito Web: Considera añadir una métrica de impacto (ej. tiempo de carga reducido en X% o número de usuarios finales)".

### Scenario 3: Seniority Verbal Tone
**Given** a "Senior" job offer
**When** re-writing the CV summary
**Then** the model MUST prioritize verbs like "Orchestrated", "Designed", or "Led" instead of "Worked on".
