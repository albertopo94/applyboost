import { describe, it, expect, beforeEach, mock, spyOn } from "bun:test";
import { OptimizeCVUseCase } from "@/lib/use-cases/OptimizeCVUseCase";
import { GeminiKeyManager } from "@/lib/llm/gemini-key-manager";
import { GenerationService } from "@/lib/services/generationService";

// Mocking dependencies
mock.module("@/lib/auth/auth-utils", () => ({
  requireAuth: () => Promise.resolve({ user: { id: "test-user" }, userId: "test-user", anonymousId: null })
}));

mock.module("@/lib/parsers/cvParser", () => ({
  parseCV: () => Promise.resolve({ text: "Extracted CV Text", usedKeyIndex: 0 })
}));

describe("OptimizeCVUseCase Resilience", () => {
  let useCase: OptimizeCVUseCase;

  beforeEach(() => {
    useCase = new OptimizeCVUseCase();
    GeminiKeyManager.resetHealth();
    
    // Mock GenerationService.generateAndStore to just return success
    spyOn(GenerationService, "generateAndStore").mockImplementation(async (params) => {
      return {
        generation_id: "test-gen-id",
        cv_optimizado: "Optimized Text",
        diff: "",
        keywords: [],
        score_original: 0,
        score_optimizado: 0,
        falta_dato_fields: []
      } as any;
    });
  });

  it("should fail-fast Stage 1 (OCR) if service is unhealthy", async () => {
    // Force unhealthy state
    GeminiKeyManager.reportFailure();
    GeminiKeyManager.reportFailure();
    expect(GeminiKeyManager.isHealthy()).toBe(false);

    const request = {
      cvFile: new File(["dummy"], "cv.pdf", { type: "application/pdf" }),
      outputLanguage: "es" as const,
    };

    try {
      await useCase.execute(request);
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error.message).toBe("OCR_SERVICE_DOWN");
    }
  });

  it("should force Groq in Stage 2 if service is unhealthy", async () => {
    // Force unhealthy state
    GeminiKeyManager.reportFailure();
    GeminiKeyManager.reportFailure();
    
    const request = {
      cvText: "Existing CV Text", // Skip Stage 1
      outputLanguage: "es" as const,
    };

    await useCase.execute(request);

    // Verify GenerationService was called with forceFallback: true
    const call = (GenerationService.generateAndStore as any).mock.calls[0][0];
    expect(call.forceFallback).toBe(true);
  });

  it("should force Groq in Stage 2 if remaining time is low (< 40s)", async () => {
    // We simulate time passing by mocking Date.now()
    const realDateNow = Date.now;
    const startTime = realDateNow();
    let callCount = 0;
    
    // First call (startTime) -> returns 0
    // Second call (Step 4 check) -> returns startTime + 265,000ms (so only 35s left)
    global.Date.now = () => {
      if (callCount === 0) {
        callCount++;
        return startTime;
      }
      return startTime + 265000; 
    };

    const request = {
      cvText: "Existing CV Text",
      outputLanguage: "es" as const,
    };

    try {
      await useCase.execute(request);
      
      const call = (GenerationService.generateAndStore as any).mock.calls[0][0];
      expect(call.forceFallback).toBe(true);
    } finally {
      global.Date.now = realDateNow; // Restore
    }
  });
});
