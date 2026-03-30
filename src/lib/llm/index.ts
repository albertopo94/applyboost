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
// LLM Business-Aligned Orchestrator
// Pattern: Gemini First (High Resiliency) -> Fallbacks
// ============================================================

const PROVIDER_REGISTRY: Record<string, () => AIService> = {
  gemini: () => new GeminiService(),
  groq: () => new GroqService(),
  cerebras: () => new CerebrasService(),
};

function getProviderOrder(): string[] {
  const order = process.env.LLM_PROVIDER_ORDER ?? "gemini,groq,cerebras";
  return order
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p in PROVIDER_REGISTRY);
}

/**
 * Call the LLM with strict priority and deep Gemini resiliency.
 */
export async function callLLM(
  prompt: string, 
  excludeGeminiIndex?: number,
  originalCV?: string
): Promise<LLMOutput> {
  const providerOrder = getProviderOrder();
  const errors: string[] = [];

  for (const providerName of providerOrder) {
    const provider = PROVIDER_REGISTRY[providerName]();

    try {
      console.log(`\n[LLM] >>> LLAMANDO A [${providerName.toUpperCase()}]...`);
      
      // Resiliency: 2 JSON validation attempts per provider
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const rawOutput = await provider.chat(prompt, AbortSignal.timeout(55000), excludeGeminiIndex);
          const result = parseAndValidate(rawOutput, { originalCV });

          if (result.success) {
            console.log(`[LLM] <<< ✅ [${providerName.toUpperCase()}] respondió con éxito.`);
            return result.data;
          }

          console.warn(`[LLM] ⚠️ [${providerName.toUpperCase()}] JSON inválido (Intento ${attempt}).`);
          if (attempt === 2) throw new LLMInvalidResponseError(providerName, "JSON validation failed after 2 attempts");
        } catch (inner: any) {
          const isFallbackable = inner instanceof LLMRateLimitError || 
                                inner instanceof LLMTimeoutError ||
                                inner?.name === "TimeoutError" || 
                                inner?.name === "AbortError";
          
          if (isFallbackable) throw inner; // Fallback to next provider
          if (attempt === 2) throw inner;
        }
      }
    } catch (error: any) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[LLM] 🔄 [${providerName.toUpperCase()}] falló: ${msg}. Saltando...`);
      errors.push(`${providerName}: ${msg}`);
    }
  }

  throw new LLMInvalidResponseError("orchestrator", `Todos los proveedores fallaron: ${errors.join("; ")}`);
}

export { LLMInvalidResponseError, LLMRateLimitError, LLMTimeoutError, LLMProviderError } from "./types";
export type { AIService, LLMOutput } from "./types";
