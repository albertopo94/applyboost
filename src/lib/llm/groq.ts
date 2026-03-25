import type { AIService } from "./types";
import { LLMRateLimitError } from "./types";

/**
 * Groq LLM service.
 * API: https://console.groq.com/docs/api
 * Compatible with OpenAI chat completions format.
 */
export class GroqService implements AIService {
  readonly name = "groq";

  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY ?? "";
    this.model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
  }

  async chat(prompt: string, signal?: AbortSignal): Promise<string> {
    if (!this.apiKey) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 4096,
        response_format: { type: "json_object" },
      }),
      signal, // Pass the AbortSignal
    });

    if (res.status === 429) {
      throw new LLMRateLimitError(this.name);
    }

    if (!res.ok) {
      throw new Error(`Groq API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
  }
}
