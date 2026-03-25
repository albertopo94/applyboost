import type { AIService } from "./types";
import { LLMRateLimitError } from "./types";

/**
 * OpenRouter LLM service.
 * API: https://openrouter.ai/docs
 * Compatible with OpenAI chat completions format.
 * Acts as a gateway to multiple models — we default to Llama 3.3 70B.
 */
export class OpenRouterService implements AIService {
  readonly name = "openrouter";

  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY ?? "";
    this.model =
      process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.3-70b-instruct";
  }

  async chat(prompt: string, signal?: AbortSignal): Promise<string> {
    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const res = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
          "X-Title": "ApplyBoost",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 4096,
          // Removed response_format to ensure compatibility with all "free" models
        }),
        signal, // Pass the AbortSignal
      },
    );

    if (res.status === 429) {
      throw new LLMRateLimitError(this.name);
    }

    if (!res.ok) {
      throw new Error(
        `OpenRouter API error: ${res.status} ${res.statusText}`,
      );
    }

    const data = await res.json();
    return data.choices[0].message.content;
  }
}
