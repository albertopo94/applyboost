import type { AIService, LLMOutput } from "./types";
import {
  LLMRateLimitError,
  LLMTimeoutError,
  LLMInvalidResponseError,
} from "./types";
import { GroqService } from "./groq";
import { CerebrasService } from "./cerebras";
import { GeminiService } from "./gemini";
import { parseAndValidate } from "./utils/jsonUtils";

// ============================================================
// LLM Priority Orchestrator (Stateless)
// Pattern: Strict priority fallback.
// ============================================================

/** Registry of all available provider constructors */
const PROVIDER_REGISTRY: Record<string, () => AIService> = {
  gemini: () => new GeminiService(),
  groq: () => new GroqService(),
  cerebras: () => new CerebrasService(),
};

/**
 * Get the ordered list of provider names from .env.
 * Default: gemini, groq, cerebras
 */
function getProviderOrder(): string[] {
  const order = process.env.LLM_PROVIDER_ORDER ?? "gemini,groq,cerebras";
  return order
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p in PROVIDER_REGISTRY);
}

/**
 * Call the LLM with strict priority fallback.
 * Always tries the first provider in LLM_PROVIDER_ORDER first.
 */
export async function callLLM(
  prompt: string, 
  excludeGeminiIndex?: number,
  originalCV?: string
): Promise<LLMOutput> {
  const providerOrder = getProviderOrder();

  if (providerOrder.length === 0) {
    throw new LLMInvalidResponseError(
      "orchestrator",
      "No LLM providers configured. Set LLM_PROVIDER_ORDER in .env."
    );
  }

  const errors: string[] = [];

  // Use strict order (no randomization as per business logic requirement)
  for (let i = 0; i < providerOrder.length; i++) {
    const providerName = providerOrder[i];
    const provider = PROVIDER_REGISTRY[providerName]();

    try {
      console.log(`\n[LLM] >>> INTENTO ${i + 1}: [${providerName.toUpperCase()}]...`);
      
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const rawOutput = await provider.chat(prompt, AbortSignal.timeout(55000), excludeGeminiIndex);
          const result = parseAndValidate(rawOutput, { originalCV });

          if (result.success) {
            console.log(`[LLM] <<< ✅ [${providerName.toUpperCase()}] respondió con éxito.`);
            return result.data;
          }

          console.warn(`[LLM] ⚠️ [${providerName.toUpperCase()}] Intento ${attempt}: JSON inválido.`);
          if (attempt === 2) {
            throw new LLMInvalidResponseError(providerName, "JSON validation failed after 2 attempts");
          }
        } catch (innerError: any) {
          const isFallbackable = innerError instanceof LLMRateLimitError || 
                                innerError instanceof LLMTimeoutError ||
                                innerError?.name === "TimeoutError" || 
                                innerError?.name === "AbortError";
          
          if (isFallbackable && attempt === 1) throw innerError;
          if (attempt === 2) throw innerError;
        }
      }
    } catch (error: any) {
      const providerTag = providerName.toUpperCase();
      
      if (error instanceof LLMRateLimitError || error?.status === 429) {
        console.warn(`[LLM] 🚦 [${providerTag}]: Rate Limit reached. Saltando...`);
        errors.push(`${providerName}: Rate limit`);
      } else if (error instanceof LLMTimeoutError || error?.name === "TimeoutError") {
        console.warn(`[LLM] ⏱️ [${providerTag}]: Timeout (55s). Saltando...`);
        errors.push(`${providerName}: Timeout`);
      } else {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`[LLM] 💥 [${providerTag}]: Error inesperado: ${msg}`);
        errors.push(`${providerName}: ${msg}`);
      }
    }
  }

  throw new LLMInvalidResponseError(
    "orchestrator",
    `All LLM providers failed. Errors: ${errors.join("; ")}`
  );
}

export { LLMInvalidResponseError, LLMRateLimitError, LLMTimeoutError, LLMProviderError } from "./types";
export type { AIService, LLMOutput } from "./types";
