import type { AIService } from "./types";
import { LLMRateLimitError, LLMProviderError, LLMTimeoutError } from "./types";
import { GeminiKeyManager } from "./gemini-key-manager";
import { GeminiClient } from "./gemini-client";

/**
 * Gemini Service (Stateless Provider Wrapper)
 * Implements AIService while handling multi-key rotation logic internally.
 */
export class GeminiService implements AIService {
  readonly name = "gemini";

  async chat(prompt: string, signal?: AbortSignal, excludeGeminiIndex?: number): Promise<string> {
    const keys = GeminiKeyManager.getKeys();
    if (keys.length === 0) {
      throw new LLMProviderError(this.name, "GEMINI_API_KEY is not configured");
    }

    let lastError: any = null;
    let keysAttempted = 0;

    for (let i = 0; i < keys.length; i++) {
      // 1. Cooldown & Exclusion checks
      if (!GeminiKeyManager.isKeyAvailable(i) && keys.length > 1) continue;
      if (excludeGeminiIndex !== undefined && i === excludeGeminiIndex && keys.length > 1) continue;

      const apiKey = keys[i];
      keysAttempted++;
      
      const client = new GeminiClient(apiKey);

      try {
        const result = await client.chat(prompt, signal);
        
        // Success resets global health
        GeminiKeyManager.resetHealth();
        
        return result;
      } catch (error: any) {
        lastError = error;
        
        if (error instanceof LLMRateLimitError) {
          console.warn(`[GEMINI_ROTATION][Key #${i}] Rate Limit / Overload. Rotating...`);
          // Gemini specifically needs cooldowns for 429
          GeminiKeyManager.markAsExhausted(i, 60000); 
          continue; 
        }

        if (error instanceof LLMTimeoutError) {
          console.warn(`[GEMINI_ROTATION][Key #${i}] Gemini Chat took too long. Rotating...`);
          
          // Report failure to the global circuit breaker
          GeminiKeyManager.reportFailure();
          
          GeminiKeyManager.markAsExhausted(i, 10000); // 10s cooldown for timeout
          continue; // ROTATE TO NEXT KEY instead of throwing immediately
        }
        
        // If it's a fatal error or other fallbackable error, let's propagate 
        // Or if we should rotate on other errors, add them here.
        throw error;
      }
    }

    if (keysAttempted === 0) {
      throw new LLMRateLimitError(this.name, "ALL_KEYS_IN_COOLDOWN");
    }

    throw lastError || new LLMProviderError(this.name, "All keys failed");
  }
}
