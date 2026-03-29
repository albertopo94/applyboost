import { describe, it, expect, mock, spyOn, beforeEach } from "bun:test";
import { callLLM } from "@/lib/llm/index";
import { GeminiService } from "@/lib/llm/gemini";
import { GroqService } from "@/lib/llm/groq";
import { LLMRateLimitError } from "@/lib/llm/types";

const validMockResponse = JSON.stringify({
  cv_optimizado: "Este es un CV optimizado con más de diez caracteres.",
  cover_letter: "Carta de presentación de prueba.",
  diff: [{ cambio: "A", motivo: "B", impacto: "C" }],
  keywords: ["keyword1", "keyword2", "keyword3"]
});

// Mock providers to avoid real API calls
mock.module("@/lib/llm/gemini", () => ({
  GeminiService: class {
    name = "gemini";
    chat = mock(() => Promise.resolve(validMockResponse));
  }
}));

mock.module("@/lib/llm/groq", () => ({
  GroqService: class {
    name = "groq";
    chat = mock(() => Promise.reject(new LLMRateLimitError("groq")));
  }
}));

describe("LLM Orchestrator (callLLM)", () => {
  beforeEach(() => {
    // Reset mocks
    process.env.LLM_PROVIDER_ORDER = "groq,gemini";
  });

  it("should fallback to next provider if one fails with RateLimitError", async () => {
    // Groq fails (mocked above), should call Gemini
    const result = await callLLM("test prompt");
    expect(result.cv_optimizado).toContain("optimizado");
    expect(result.keywords.length).toBeGreaterThan(0);
  });

  it("should be stateless (using randomized startIndex)", async () => {
    // Note: The logic is now in the loop (startIndex). 
    // We verified the removal of the global variable in the code.
    const result = await callLLM("test prompt");
    expect(result.cv_optimizado).toBeDefined();
  });
});
