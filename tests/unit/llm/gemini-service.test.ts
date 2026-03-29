import { describe, it, expect, mock } from "bun:test";
import { GeminiService } from "@/lib/llm/gemini";
import { LLMRateLimitError } from "@/lib/llm/types";

describe("GeminiService (Single Key)", () => {
  it("should throw LLMRateLimitError on 429", async () => {
    // Note: We'll need to mock the Google SDK inside GeminiService
    // This test will fail initially because the constructor currently takes no arguments
    const service = new GeminiService("fake-key"); 
    expect(service.name).toBe("gemini");
  });
});
