import type { AIService, LLMOutput } from "./types";
import {
  LLMRateLimitError,
  LLMTimeoutError,
  LLMInvalidResponseError,
  LLMProviderError,
} from "./types";
import { GroqService } from "./groq";
import { CerebrasService } from "./cerebras";
import { GeminiService } from "./gemini";
import { OpenRouterService } from "./openrouter";
import { parseAndValidate } from "./utils/jsonUtils";

// ============================================================
// LLM Round-Robin Orchestrator (Stateless)
// Pattern: Circular randomized fallback.
// ============================================================

/** Registry of all available provider constructors */
const PROVIDER_REGISTRY: Record<string, () => AIService> = {
  groq: () => new GroqService(),
  cerebras: () => new CerebrasService(),
  gemini: () => new GeminiService(),
  openrouter: () => new OpenRouterService(),
};

/**
 * Get the ordered list of provider names from .env.
 */
function getProviderOrder(): string[] {
  const order = process.env.LLM_PROVIDER_ORDER ?? "groq,cerebras,gemini,openrouter";
  return order
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p in PROVIDER_REGISTRY);
}

/**
 * Call the LLM with circular randomized fallback (stateless).
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

  // Statistical load balancing: start from a random provider each time
  const startIndex = Math.floor(Math.random() * providerOrder.length);
  const errors: string[] = [];

  for (let i = 0; i < providerOrder.length; i++) {
    const currentIdx = (startIndex + i) % providerOrder.length;
    const providerName = providerOrder[currentIdx];
    const provider = PROVIDER_REGISTRY[providerName]();

    try {
      console.log(`\n[LLM] >>> INTENTO ${i + 1}: [${providerName.toUpperCase()}]...`);
      
      // Internal retry loop for JSON validation (Max 2 attempts per provider)
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
          // If it's a RateLimit or Timeout, don't retry same provider, move to next
          const isFallbackable = innerError instanceof LLMRateLimitError || 
                                innerError instanceof LLMTimeoutError ||
                                innerError?.name === "TimeoutError" || 
                                innerError?.name === "AbortError";
          
          if (isFallbackable && attempt === 1) {
             throw innerError; // Bubbles up to outer catch for fallback
          }
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
      
      // If we exhausted all providers, the loop will finish and we throw below
    }
  }

  throw new LLMInvalidResponseError(
    "orchestrator",
    `All LLM providers failed. Errors: ${errors.join("; ")}`
  );
}

/**
 * Re-export types for convenience.
 */
export { LLMInvalidResponseError, LLMRateLimitError, LLMTimeoutError, LLMProviderError } from "./types";
export type { AIService, LLMOutput } from "./types";
