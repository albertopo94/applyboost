import type { AIService } from "./types";
import { LLMRateLimitError, LLMProviderError } from "./types";

/**
 * Cerebras LLM service.
 */
export class CerebrasService implements AIService {
  readonly name = "cerebras";

  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    this.apiKey = process.env.CEREBRAS_API_KEY ?? "";
    this.model = process.env.CEREBRAS_MODEL ?? "llama3.1-8b";
  }

  async chat(prompt: string, signal?: AbortSignal): Promise<string> {
    if (!this.apiKey) {
      throw new LLMProviderError(this.name, "CEREBRAS_API_KEY is not configured");
    }

    try {
      const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          max_completion_tokens: 4096,
          top_p: 1,
        }),
        signal,
      });

      if (res.status === 429 || res.status === 503) {
        throw new LLMRateLimitError(this.name);
      }

      if (!res.ok) {
        throw new LLMProviderError(this.name, `Cerebras API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) throw new LLMProviderError(this.name, "Empty response from Cerebras");
      
      return content;
    } catch (error: any) {
      if (error instanceof LLMRateLimitError || error instanceof LLMProviderError) throw error;
      if (error?.name === "TimeoutError" || error?.name === "AbortError") {
        throw new LLMProviderError(this.name, "Timeout or Aborted", error);
      }
      throw new LLMProviderError(this.name, error.message, error);
    }
  }
}
