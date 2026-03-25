/**
 * Build the master prompt for the LLM orchestration.
 * SDD §7.2: Injects rules, languages, and raw inputs.
 */
export interface MasterPromptOptions {
  cvText: string;
  jobDescription: string;
  coverReference?: string;
  userPreferences?: string;
  outputLanguage: "es" | "en" | "it" | "auto";
}

export function buildMasterPrompt(options: MasterPromptOptions): string {
  const {
    cvText,
    jobDescription,
    coverReference,
    userPreferences,
    outputLanguage,
  } = options;

  const targetLanguage = outputLanguage === "auto" ? "el idioma de la oferta laboral (JOB_DESCRIPTION)" : outputLanguage;

  let prompt = `### INSTRUCCIÓN DE IDENTIDAD
Eres un experto Senior en optimización de CVs y ATS (Applicant Tracking Systems).
Tu objetivo es transformar el CV del usuario para que sea un match perfecto con la oferta laboral, manteniendo la honestidad pero maximizando el impacto.

### REGLAS DE ORO (INCUMPLIMIENTO = FALLO CRÍTICO)
1. IDIOMA: Todo el JSON debe estar en ${targetLanguage}. Si el CV y la Oferta están en el mismo idioma, usa ese. Si son distintos, prioriza el idioma de la oferta.
2. NO INVENTAR: No alucines empresas, fechas o títulos. Si falta algo vital, usa "FALTA_DATO: [detalle]".
3. EXTENSIÓN Y DETALLE: Genera un CV optimizado completo y detallado. No resumas excesivamente. Queremos que el documento se vea profesional y ocupe el espacio necesario para cubrir todos los requisitos de la oferta.
4. NO REPETIR: Jamás copies el texto de la oferta laboral (JOB_DESCRIPTION) en los campos de salida. Tu trabajo es reescribir el CV del usuario basándote en la oferta.
5. ESTRUCTURA COVER LETTER: No uses saludos genéricos. Empieza con un gancho fuerte, conecta experiencia real con los requisitos y termina con un llamado a la acción claro. Máximo 300 palabras.
6. FORMATO JSON: Devuelve ÚNICAMENTE un objeto JSON puro. Sin bloques de markdown, sin texto previo ni posterior.

### FORMATO DEL CONTENIDO
El campo "cv_optimizado" DEBE ser un string largo que contenga el CV completo en formato Markdown real.
- Usa headers (##) para las secciones principales (EXPERIENCIA, EDUCACIÓN, SKILLS).
- Usa negritas (**) para resaltar cargos, empresas o logros clave.
- Usa listas de bullets (-) para describir responsabilidades y logros.
- ⚠️ IMPORTANTE: Usa saltos de línea dobles (\n\n) para separar títulos, párrafos y elementos de lista tanto en "cv_optimizado" como en "cover_letter". El texto no debe aparecer amontonado.
- PROHIBIDO: No devuelvas un solo párrafo biográfico. No devuelvas objetos JSON anidados dentro de los campos string.

Ejemplo de estructura esperada en "cv_optimizado":
## NOMBRE COMPLETO

Ciudad, País | Email | LinkedIn

## RESUMEN PROFESIONAL

Texto persuasivo de 3-4 líneas...

## EXPERIENCIA LABORAL

- **Puesto Actual/Reciente** | Empresa (Mes Año – Actualidad)
  - Logro principal cuantificable con métricas...
  - Responsabilidad clave alineada con la oferta laboral...

## EDUCACIÓN

- **Título Obtenido** | Institución (Año de graduación)

### INPUTS DEL USUARIO
<CV_TEXT>
${cvText}
</CV_TEXT>

<JOB_DESCRIPTION>
${jobDescription}
</JOB_DESCRIPTION>
`;

  if (coverReference) {
    prompt += `\n<COVER_REFERENCE_OLD>\n${coverReference}\n</COVER_REFERENCE_OLD>\n`;
  }

  if (userPreferences) {
    prompt += `\n<USER_PREFERENCES>\n${userPreferences}\n</USER_PREFERENCES>\n`;
  }

  prompt += `
### OUTPUT ESPERADO (JSON)
⚠️ IMPORTANTE: No copies las descripciones de los campos del ejemplo. Debes generar contenido original y detallado basado en los datos proporcionados en <CV_TEXT> y <JOB_DESCRIPTION>.

{
  "cv_optimizado": "## NOMBRE... (Todo el CV formateado en Markdown real)",
  "cover_letter": "Estimado/a... \\n\\n[Párrafo 1 con gancho]\\n\\n[Párrafo 2 con conexión experiencia-oferta]\\n\\n[Párrafo 3 con cierre y CTA]\\n\\nAtentamente, \\n[Nombre]",
  "cover_letter_explanation": "Explicación de la estrategia utilizada",
  "diff": [
    {"cambio": "acción realizada", "motivo": "razón técnica", "impacto": "valor para ATS"}
  ],
  "keywords": ["keyword1", "keyword2"] 
}
`;

  return prompt;
}
