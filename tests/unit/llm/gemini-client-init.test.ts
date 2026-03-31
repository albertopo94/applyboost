import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { GeminiClient } from "../../../src/lib/llm/gemini-client";

describe("GeminiClient Initialization", () => {
  const originalEnv = process.env.GEMINI_MODEL;

  beforeEach(() => {
    delete process.env.GEMINI_MODEL;
  });

  afterEach(() => {
    process.env.GEMINI_MODEL = originalEnv;
  });

  it("should default to 'gemini-3-flash-preview' when GEMINI_MODEL env var is missing", () => {
    const client = new GeminiClient("fake-key");
    
    // This will FAIL currently as it defaults to gemini-1.5-flash
    expect((client as any).modelName).toBe("gemini-3-flash-preview");
  });
});
