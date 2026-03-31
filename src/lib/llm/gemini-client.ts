import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";
import { LLMRateLimitError, LLMTimeoutError, LLMProviderError } from "./types";

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    cv_optimizado: { type: SchemaType.STRING },
    cv_explanation: { type: SchemaType.STRING },
    cover_letter: { type: SchemaType.STRING },
    cover_letter_explanation: { type: SchemaType.STRING },
    diff: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          cambio: { type: SchemaType.STRING },
          motivo: { type: SchemaType.STRING },
          impacto: { type: SchemaType.STRING }
        },
        required: ["cambio", "motivo", "impacto"]
      }
    },
    keywords: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    falta_dato_fields: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
  },
  required: ["cv_optimizado", "diff", "keywords", "falta_dato_fields"]
};

/**
 * Gemini Client: Handles a single request using a SINGLE API key.
 * This class is agnostically focused on the LLM interaction.
 */
export class GeminiClient {
  private readonly modelName: string;

  constructor(private readonly apiKey: string) {
    this.modelName = process.env.GEMINI_MODEL ?? "gemini-3-flash-preview";
  }

  async chat(prompt: string, signal?: AbortSignal): Promise<string> {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    try {
      const generationPromise = model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const response = await (signal 
        ? Promise.race([
            generationPromise,
            new Promise<never>((_, reject) => {
              if (signal.aborted) reject(new LLMTimeoutError("gemini"));
              signal.addEventListener("abort", () => reject(new LLMTimeoutError("gemini")));
            })
          ])
        : generationPromise);

      const text = response.response.text();
      if (!text) throw new LLMProviderError("gemini", "Empty response from Gemini");

      return text;
    } catch (error: any) {
      const status = error?.status;
      const message = error?.message || "";
      
      if (status === 429 || message.includes("429") || status === 503 || message.includes("503")) {
        throw new LLMRateLimitError("gemini");
      }
      
      if (error instanceof LLMTimeoutError || error?.name === "TimeoutError" || error?.name === "AbortError") {
        throw new LLMTimeoutError("gemini");
      }

      throw new LLMProviderError("gemini", message, error);
    }
  }
}
