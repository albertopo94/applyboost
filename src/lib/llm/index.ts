import type { AIService } from "./types";
import {
  LLMRateLimitError,
  LLMOutputInvalidError,
  type LLMOutput,
} from "./types";
import { GroqService } from "./groq";
import { CerebrasService } from "./cerebras";
import { GeminiService } from "./gemini";
import { OpenRouterService } from "./openrouter";
import { parseAndValidate } from "./utils/jsonUtils";

// ============================================================
// LLM Round-Robin Orchestrator
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
 */
function getProviderOrder(): string[] {
  const order = process.env.LLM_PROVIDER_ORDER ?? "groq,cerebras,gemini,openrouter";
  return order
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p in PROVIDER_REGISTRY);
}

/**
 * Call the LLM with round-robin fallback.
 */
export async function callLLM(
  prompt: string, 
  excludeGeminiIndex?: number
): Promise<LLMOutput> {
  const providerOrder = getProviderOrder();

  if (providerOrder.length === 0) {
    throw new LLMOutputInvalidError(
      "No LLM providers configured. Set LLM_PROVIDER_ORDER in .env."
    );
  }

  const errors: string[] = [];

  for (let attempts = 0; attempts < providerOrder.length; attempts++) {
    const providerName =
      providerOrder[currentProviderIndex % providerOrder.length];
    const provider = PROVIDER_REGISTRY[providerName]();

    try {
      console.log(`\n[LLM] >>> INTENTO ${attempts + 1}: Llamando a [${providerName.toUpperCase()}]...`);
      const rawOutput = await provider.chat(prompt, AbortSignal.timeout(30000), excludeGeminiIndex);
      const result = parseAndValidate(rawOutput);

      if (result.success) {
        currentProviderIndex = (currentProviderIndex + 1) % providerOrder.length;
        console.log(`[LLM] <<< ✅ [${providerName.toUpperCase()}] respondió con éxito.`);
        return result.data;
      }

      // JSON validation failed — retry once with same provider
      console.warn(`[LLM] ⚠️ [${providerName.toUpperCase()}]: JSON inválido, reintentando una vez...`);
      const retryOutput = await provider.chat(prompt, AbortSignal.timeout(30000), excludeGeminiIndex);
      const retryResult = parseAndValidate(retryOutput);

      if (retryResult.success) {
        currentProviderIndex = (currentProviderIndex + 1) % providerOrder.length;
        console.log(`[LLM] <<< ✅ [${providerName.toUpperCase()}] respondió con éxito (al segundo intento).`);
        return retryResult.data;
      }

      console.error(`[LLM] ❌ [${providerName.toUpperCase()}]: Falló validación JSON tras 2 intentos.`);
      errors.push(`${providerName}: JSON validation failed after 2 attempts`);
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

    currentProviderIndex = (currentProviderIndex + 1) % providerOrder.length;
  }

  throw new LLMOutputInvalidError(`All LLM providers failed. Errors: ${errors.join("; ")}`);
}

/**
 * Re-export types for convenience.
 */
export { LLMOutputInvalidError, LLMRateLimitError } from "./types";
export type { AIService, LLMOutput } from "./types";
