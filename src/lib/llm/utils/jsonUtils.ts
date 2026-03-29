import { LLMOutputSchema, type LLMOutput } from "../types";
import { validateIntegrity } from "./integrityUtils";

/**
 * Extract JSON from an LLM response that might be wrapped in markdown fences or have extra text.
 * SDD §7.2: Robust extraction using first '{' and last '}' indices.
 */
export function extractJSON(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start !== -1 && end !== -1 && end > start) {
    let candidate = text.slice(start, end + 1);
    // Remove control characters that often break JSON.parse
    candidate = candidate.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
    return candidate;
  }

  return text.trim();
}

/**
 * Parse raw LLM text output and validate against Zod schema.
 */
export function parseAndValidate(
  raw: string,
  context?: { originalCV?: string }
): {
  success: true;
  data: LLMOutput;
} | {
  success: false;
  error: string;
} {
  try {
    if (!raw) throw new Error("Empty response from LLM");
    const jsonStr = extractJSON(raw);

    // --- CHECK FOR PROMPT COPYING ---
    const forbiddenPatterns = [
      "[CONTENIDO_GENERADO_IA:",
      "[ACCIÓN_ESPECÍFICA]",
      "[RAZÓN_TÉCNICA]",
      "[VALOR_PARA_ATS]",
      "Carta de presentación profesional, asimétrica y persuasiva.",
      "Texto completo del CV del usuario optimizado estratégicamente",
      "Breve explicación (string o array de strings)",
      "acción realizada",
      "por qué se hizo",
      "beneficio esperado"
    ];

    for (const pattern of forbiddenPatterns) {
      if (jsonStr.includes(pattern)) {
        throw new Error(`LLM copied descriptive prompt text: "${pattern}"`);
      }
    }

    const parsed = JSON.parse(jsonStr);
    const validated = LLMOutputSchema.parse(parsed);

    // --- INTEGRITY & FACT-CHECKING ---
    if (context?.originalCV) {
      const integrity = validateIntegrity(validated.cv_optimizado, context.originalCV);
      
      // Separate Security from Hallucinations
      const securityIssues = integrity.issues.filter(i => i.includes("Security Breach"));
      const hallucinationIssues = integrity.issues.filter(i => !i.includes("Security Breach"));

      if (securityIssues.length > 0) {
        throw new Error(`Security Breach Detected: ${securityIssues.join("; ")}`);
      }

      if (hallucinationIssues.length > 0) {
        console.warn(`[INTEGRITY_WARNING] Hallucinations detected: ${hallucinationIssues.join("; ")}`);
        // We let it pass to save tokens, but we log it for future prompt tuning.
      }
    }

    return { success: true, data: validated };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const snippet = raw ? raw.slice(0, 100) : "NULL";
    console.warn(`[LLM] Validation failed: ${msg}. Raw snippet: ${snippet}...`);
    return { success: false, error: msg };
  }
}
