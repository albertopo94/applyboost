import { describe, it, expect, mock } from "bun:test";
import { OptimizeCVUseCase } from "@/lib/use-cases/OptimizeCVUseCase";
import { GenerateResponse } from "@/lib/llm/types";

// Mock dependencies to focus only on the Use Case logic
mock.module("@/lib/auth/auth-utils", () => ({
  requireAuth: mock(() => Promise.resolve({ user: { id: "test-user" }, userId: "test-user" }))
}));

mock.module("@/lib/services/usageService", () => ({
  UsageService: {
    hasExceededLimit: mock(() => Promise.resolve({ hasExceeded: false }))
  }
}));

mock.module("@/lib/services/generationService", () => ({
  GenerationService: {
    generateAndStore: mock(() => Promise.resolve({ 
      generation_id: "test-gen",
      cv_optimizado: "CV Optimizado Test Content",
      diff: [],
      keywords: ["test"]
    }))
  }
}));

describe("OptimizeCVUseCase", () => {
  it("should execute the full optimization flow and report progress", async () => {
    const useCase = new OptimizeCVUseCase();
    const progressCalls: number[] = [];
    
    const onProgress = async (step: number) => {
      progressCalls.push(step);
    };

    const result = await useCase.execute({
      cvText: "Raw CV Content",
      jobText: "Job Description",
      outputLanguage: "es",
      onProgress
    });

    expect(result.generation_id).toBe("test-gen");
    expect(progressCalls).toContain(1);
    expect(progressCalls).toContain(5);
  });
});
