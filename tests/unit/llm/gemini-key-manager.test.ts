import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { GeminiKeyManager } from "@/lib/llm/gemini-key-manager";

describe("GeminiKeyManager (Circuit Breaker)", () => {
  beforeEach(() => {
    // Reset keys and health state before each test
    process.env.GEMINI_API_KEYS = "key1,key2,key3";
    (GeminiKeyManager as any).keys = []; // Force re-parsing
    (GeminiKeyManager as any).consecutiveFailures = 0;
    (GeminiKeyManager as any).lastFailureTime = 0;
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEYS;
  });

  it("should start as healthy", () => {
    expect(GeminiKeyManager.isHealthy()).toBe(true);
  });

  it("should become unhealthy after 2 consecutive failures", () => {
    GeminiKeyManager.reportFailure();
    expect(GeminiKeyManager.isHealthy()).toBe(true); // 1 failure is fine

    GeminiKeyManager.reportFailure();
    expect(GeminiKeyManager.isHealthy()).toBe(false); // 2 failures = Unhealthy
  });

  it("should recover health after reset", () => {
    GeminiKeyManager.reportFailure();
    GeminiKeyManager.reportFailure();
    expect(GeminiKeyManager.isHealthy()).toBe(false);

    GeminiKeyManager.resetHealth();
    expect(GeminiKeyManager.isHealthy()).toBe(true);
    expect((GeminiKeyManager as any).consecutiveFailures).toBe(0);
  });
});
