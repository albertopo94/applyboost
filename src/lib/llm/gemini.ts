import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIService } from "./types";
import { LLMRateLimitError } from "./types";
import { GeminiKeyManager } from "./gemini-key-manager";

/**
 * Gemini LLM service (Google AI) using the official SDK.
 * Now supports automatic API Key rotation and index exclusion.
 */
export class GeminiService implements AIService {
  readonly name = "gemini";
  private readonly modelName: string;

  constructor() {
    this.modelName = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
  }

  async chat(prompt: string, signal?: AbortSignal, excludeGeminiIndex?: number): Promise<string> {
    const keys = GeminiKeyManager.getKeys();
    if (keys.length === 0) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    let lastError: any = null;

    // Internal rotation loop
    for (let i = 0; i < keys.length; i++) {
      // 1. Pre-emptive cooldown check (Global)
      if (!GeminiKeyManager.isKeyAvailable(i)) {
        console.log(`[GEMINI_COOLDOWN] Skipping Key #${i} (exhausted, waiting for reset).`);
        continue;
      }

      // 2. Logic: skip the key if it matches the excluded index (Per-request)
      if (excludeGeminiIndex !== undefined && i === excludeGeminiIndex) {
        if (keys.length > 1) {
          console.log(`[GEMINI_EXCLUSION] Skipping Key #${i} (used by OCR).`);
          continue; 
        }
        // If it's the only key, we have no choice but to try it (though it's unlikely to work)
        console.warn(`[GEMINI_EXCLUSION] Key #${i} is the only key available. Trying anyway.`);
      }

      const apiKey = keys[i];
      const genAI = new GoogleGenerativeAI(apiKey);

      try {
        if (i > 0 || (excludeGeminiIndex !== undefined && i > 0)) {
          console.log(`[GEMINI_ROTATION] Attempting with Key #${i}.`);
        }

        const model = genAI.getGenerativeModel({
          model: this.modelName,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        });

        // Wrap in a manual promise race for the timeout if signal is provided
        const generationPromise = model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const response = await (signal 
          ? Promise.race([
              generationPromise,
              new Promise<never>((_, reject) => {
                if (signal.aborted) reject(new Error("TimeoutError"));
                signal.addEventListener("abort", () => reject(new Error("TimeoutError")));
              })
            ])
          : generationPromise);

        const text = response.response.text();

        if (!text) {
          throw new Error("Gemini returned empty response");
        }

        return text;

      } catch (error: any) {
        lastError = error;
        
        // Handle Rate Limit (429) specifically by continuing the loop
        if (error?.status === 429 || error?.message?.includes("429")) {
          console.warn(`[GEMINI_RATE_LIMIT] Key #${i} exhausted. Rotating...`);
          GeminiKeyManager.markAsExhausted(i); // Mark for 60s cooldown
          continue; 
        }
        
        // If it's a timeout or other fatal error, we stop rotation and propagate
        const isTimeout = error?.name === "TimeoutError" || error?.name === "AbortError";
        if (isTimeout) throw error;

        // For other errors, if we have more keys, we could try them, 
        // but typically structural errors won't be fixed by changing the key.
        if (i === keys.length - 1) break;
      }
    }

    // If we reached here, all keys failed or were rate limited
    if (lastError?.status === 429 || lastError?.message?.includes("429")) {
      throw new LLMRateLimitError(this.name);
    }
    
    const msg = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(`Gemini all keys failed. Last error: ${msg}`);
  }
}
