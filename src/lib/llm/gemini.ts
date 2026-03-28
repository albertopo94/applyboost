import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIService } from "./types";
import { LLMRateLimitError } from "./types";

/**
 * Gemini LLM service (Google AI) using the official SDK.
 * SDK: https://ai.google.dev/api/rest
 */
export class GeminiService implements AIService {
  readonly name = "gemini";

  private readonly apiKey: string;
  private readonly model: string;
  private readonly genAI: GoogleGenerativeAI;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY ?? "";
    this.model = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  async chat(prompt: string, signal?: AbortSignal): Promise<string> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.model,
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
      if (error?.status === 429 || error?.message?.includes("429")) {
        throw new LLMRateLimitError(this.name);
      }
      
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Gemini SDK error: ${msg}`);
    }
  }
}
