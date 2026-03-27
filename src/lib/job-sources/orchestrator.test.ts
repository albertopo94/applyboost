import { describe, expect, it, mock, afterEach } from "bun:test";
import { extractJobDescription } from "./orchestrator";

// Mocking extractors and resolvers to isolate orchestrator logic
mock.module("./extractors/linkedinExtractor", () => ({
  extractLinkedIn: async ({ url }: { url: string }) => {
    if (url.includes("fail")) return { status: "blocked", domain: "linkedin", extractor: "mock", confidence: 0.1, strategyPath: "B_fail_C_fail_A" };
    return { status: "ok", text: "LinkedIn Job Text", domain: "linkedin", extractor: "mock", confidence: 0.95, strategyPath: "B_ok" };
  }
}));

mock.module("./extractors/genericExtractor", () => ({
  extractGeneric: async ({ url }: { url: string }) => {
    if (url.includes("fail")) return { status: "unreadable", domain: "generic", extractor: "mock", confidence: 0.1, strategyPath: "B_fail_C_fail_A" };
    return { status: "ok", text: "Generic Job Text", domain: "generic", extractor: "mock", confidence: 0.6, strategyPath: "B_ok" };
  }
}));

mock.module("./resolvers/alternativeResolver", () => ({
  resolveAlternativeUrl: async ({ url }: { url: string }) => {
    if (url.includes("has-alt")) return "https://www.linkedin.com/jobs/view/999/";
    return null;
  }
}));

describe("orchestrator", () => {
  it("should succeed with Strategy B when first attempt is OK (LinkedIn)", async () => {
    const result = await extractJobDescription({ url: "https://www.linkedin.com/jobs/view/123", requestId: "test-1" });
    
    expect(result.status).toBe("ok");
    expect(result.text).toBe("LinkedIn Job Text");
    expect(result.strategyPath).toBe("B_ok");
  });

  it("should succeed with Strategy B when first attempt is OK (Generic)", async () => {
    const result = await extractJobDescription({ url: "https://example.com/job/123", requestId: "test-2" });
    
    expect(result.status).toBe("ok");
    expect(result.text).toBe("Generic Job Text");
    expect(result.strategyPath).toBe("B_ok");
  });

  it("should succeed with Strategy C when B fails but an alternative URL is found and extracted", async () => {
    // This URL will fail B but will have an alternative in our mock
    const result = await extractJobDescription({ url: "https://www.linkedin.com/jobs/collections/fail-but-has-alt/", requestId: "test-3" });
    
    expect(result.status).toBe("ok");
    expect(result.text).toBe("LinkedIn Job Text");
    expect(result.strategyPath).toBe("B_fail_C_ok");
  });

  it("should fail and fallback to Strategy A when both B and C fail", async () => {
    const result = await extractJobDescription({ url: "https://www.linkedin.com/jobs/fail-no-alt/", requestId: "test-4" });
    
    expect(result.status).toBe("blocked");
    expect(result.strategyPath).toBe("B_fail_C_fail_A");
  });
});
