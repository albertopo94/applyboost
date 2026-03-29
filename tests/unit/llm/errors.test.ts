import { describe, it, expect } from "bun:test";
import { 
  LLMBaseError, 
  LLMRateLimitError, 
  LLMTimeoutError, 
  LLMInvalidResponseError, 
  LLMProviderError 
} from "@/lib/llm/types";

describe("LLM Error Hierarchy", () => {
  it("should correctly identify instances of LLMBaseError", () => {
    const error = new LLMRateLimitError("groq");
    expect(error instanceof LLMBaseError).toBe(true);
    expect(error.provider).toBe("groq");
    expect(error.name).toBe("LLMRateLimitError");
  });

  it("should handle TimeoutError correctly", () => {
    const error = new LLMTimeoutError("gemini");
    expect(error instanceof LLMBaseError).toBe(true);
    expect(error.provider).toBe("gemini");
    expect(error.name).toBe("LLMTimeoutError");
  });

  it("should handle InvalidResponseError correctly", () => {
    const error = new LLMInvalidResponseError("cerebras", "JSON parse error");
    expect(error.provider).toBe("cerebras");
    expect(error.message).toContain("JSON parse error");
  });

  it("should wrap original errors in ProviderError", () => {
    const original = new Error("Something went wrong");
    const error = new LLMProviderError("openrouter", original.message, original);
    expect(error.provider).toBe("openrouter");
    expect(error.originalError).toBe(original);
  });
});
