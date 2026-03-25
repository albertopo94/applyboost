import type { AIService } from "./types";
import { LLMRateLimitError } from "./types";

/**
 * Cerebras LLM service.
 * API: https://cloud.cerebras.ai/docs
 * Compatible with OpenAI chat completions format.
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
      throw new Error("CEREBRAS_API_KEY is not configured");
    }

    const res = await fetch(
      "https://api.cerebras.ai/v1/chat/completions",
      {
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
        signal, // Pass the AbortSignal
      },
    );

    if (res.status === 429) {
      throw new LLMRateLimitError(this.name);
    }

    if (!res.ok) {
      throw new Error(`Cerebras API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
  }
}
