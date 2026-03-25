import type { AIService } from "./types";
import {
  LLMRateLimitError,
  LLMOutputInvalidError,
  LLMOutputSchema,
  type LLMOutput,
} from "./types";
import { GroqService } from "./groq";
import { CerebrasService } from "./cerebras";
import { GeminiService } from "./gemini";
import { OpenRouterService } from "./openrouter";

// ============================================================
// LLM Round-Robin Orchestrator
// Source: Stack §🧠, SDD §7.2
//
// Pattern: cycle through providers in order defined by
// LLM_PROVIDER_ORDER env var. On 429, skip to next.
// On JSON validation failure, retry once with same provider.
// ============================================================

/** Registry of all available provider constructors */
const PROVIDER_REGISTRY: Record<string, () => AIService> = {
  groq: () => new GroqService(),
  cerebras: () => new CerebrasService(),
  gemini: () => new GeminiService(),
  openrouter: () => new OpenRouterService(),
};

/** State: tracks the index of the current provider for round-robin */
let currentProviderIndex = 0;

/**
 * Get the ordered list of provider names from .env.
 * Default: groq → cerebras → gemini → openrouter
 */
function getProviderOrder(): string[] {
  const order = process.env.LLM_PROVIDER_ORDER ?? "groq,cerebras,gemini,openrouter";
  return order
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p in PROVIDER_REGISTRY);
}

/**
 * Extract JSON from an LLM response that might be wrapped in markdown fences or have extra text.
 * SDD §7.2: Robust extraction using first '{' and last '}' indices.
 */
function extractJSON(text: string): string {
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
 * Call the LLM with round-robin fallback.
 *
 * - Cycles through providers in order.
 * - On 429: advances to next provider.
 * - On JSON validation failure: retries once with same provider.
 * - After exhausting all providers: throws LLMOutputInvalidError.
 *
 * @returns Validated LLM output that matches the Zod schema.
 */
export async function callLLM(prompt: string): Promise<LLMOutput> {
  const providerOrder = getProviderOrder();

  if (providerOrder.length === 0) {
    throw new LLMOutputInvalidError(
      "No LLM providers configured. Set LLM_PROVIDER_ORDER in .env."
    );
  }

  const errors: string[] = [];

  // Try each provider in round-robin order
  for (let attempts = 0; attempts < providerOrder.length; attempts++) {
    const providerName =
      providerOrder[currentProviderIndex % providerOrder.length];
    const provider = PROVIDER_REGISTRY[providerName]();

    try {
      // First attempt with 30s timeout
      console.log(`\n[LLM] >>> INTENTO ${attempts + 1}: Llamando a [${providerName.toUpperCase()}]...`);
      const rawOutput = await provider.chat(prompt, AbortSignal.timeout(30000));
      const result = parseAndValidate(rawOutput);

      if (result.success) {
        // Advance index for next call (round-robin)
        currentProviderIndex =
          (currentProviderIndex + 1) % providerOrder.length;
        console.log(`[LLM] <<< ✅ [${providerName.toUpperCase()}] respondió con éxito.`);
        return result.data;
      }

      // JSON validation failed — SDD says retry once with same provider
      console.warn(
        `[LLM] ⚠️ [${providerName.toUpperCase()}]: JSON inválido, reintentando una vez...`,
      );
      const retryOutput = await provider.chat(prompt, AbortSignal.timeout(30000));
      const retryResult = parseAndValidate(retryOutput);

      if (retryResult.success) {
        currentProviderIndex =
          (currentProviderIndex + 1) % providerOrder.length;
        console.log(`[LLM] <<< ✅ [${providerName.toUpperCase()}] respondió con éxito (al segundo intento).`);
        return retryResult.data;
      }

      console.error(`[LLM] ❌ [${providerName.toUpperCase()}]: Falló validación JSON tras 2 intentos.`);
      errors.push(
        `${providerName}: JSON validation failed after 2 attempts`,
      );
    } catch (error: any) {
      const isTimeout = error?.name === "TimeoutError" || error?.name === "AbortError";
      
      if (isTimeout) {
        console.warn(`[LLM] ⏱️ [${providerName.toUpperCase()}]: Timeout (30s). Saltando...`);
        errors.push(`${providerName}: timed out (30s)`);
      } else if (error instanceof LLMRateLimitError) {
        console.warn(`[LLM] 🚦 [${providerName.toUpperCase()}]: Rate Limit (429). Saltando...`);
        errors.push(`${providerName}: rate limited (429)`);
      } else {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`[LLM] 💥 [${providerName.toUpperCase()}]: Error inesperado: ${msg}`);
        errors.push(`${providerName}: ${msg}`);
      }
    }

    // Advance to next provider
    currentProviderIndex =
      (currentProviderIndex + 1) % providerOrder.length;
  }

  // All providers failed
  throw new LLMOutputInvalidError(
    `All LLM providers failed. Errors: ${errors.join("; ")}`,
  );
}

/**
 * Parse raw LLM text output and validate against Zod schema.
 */
function parseAndValidate(raw: string): {
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
    // If the output contains these strings, it means the LLM copied the placeholders
    // from the prompt instead of generating real content.
    const forbiddenPatterns = [
      "[CONTENIDO_GENERADO_IA:",
      "[ACCIÓN_ESPECÍFICA]",
      "[RAZÓN_TÉCNICA]",
      "[VALOR_PARA_ATS]",
      // Legacy patterns just in case
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
    // --------------------------------

    const parsed = JSON.parse(jsonStr);
    const validated = LLMOutputSchema.parse(parsed);
    return { success: true, data: validated };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const snippet = raw ? raw.slice(0, 100) : "NULL";
    console.warn(`[LLM] Validation failed: ${msg}. Raw snippet: ${snippet}...`);
    return { success: false, error: msg };
  }
}

/**
 * Re-export types for convenience.
 */
export { LLMOutputInvalidError, LLMRateLimitError } from "./types";
export type { AIService, LLMOutput } from "./types";
