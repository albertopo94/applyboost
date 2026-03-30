import { parseCV } from "@/lib/parsers/cvParser";
import { GenerationService } from "@/lib/services/generationService";
import { requireAuth } from "@/lib/auth/auth-utils";
import { UsageService } from "@/lib/services/usageService";
import { GenerateResponse } from "@/lib/llm/types";

export interface OptimizeCVRequest {
  cvFile?: File | null;
  cvText?: string | null;
  jobText?: string | null;
  jobUrl?: string | null;
  outputLanguage: "auto" | "es" | "en" | "it";
  anonymousId?: string | null;
  onProgress?: (step: number, message?: string) => Promise<void>;
  requestId?: string;
}

/**
 * OptimizeCVUseCase: Orquestra el flujo completo de optimización.
 * Incluye un timeout global de 100 segundos para evitar la "muerte eterna" del usuario.
 */
export class OptimizeCVUseCase {
  async execute(request: OptimizeCVRequest): Promise<GenerateResponse> {
    const { 
      cvFile, 
      cvText: initialCvText, 
      jobText, 
      jobUrl, 
      outputLanguage, 
      anonymousId: bodyAnonId, 
      onProgress,
      requestId = "UC-" + Math.random().toString(36).substring(7)
    } = request;

    // --- GLOBAL TIMEOUT (180 SECONDS) ---
    const globalTimeoutMs = 180000;
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("GLOBAL_TIMEOUT")), globalTimeoutMs);
    });

    const workPromise = (async (): Promise<GenerateResponse> => {
      let cvText = initialCvText;

      // --- STEP 1: IDENTITY & QUOTA ---
      if (onProgress) await onProgress(1);
      const { user, userId, anonymousId } = await requireAuth({
        allowAnonymous: true,
        anonymousId: bodyAnonId || undefined
      });

      if (!user && anonymousId) {
        const { hasExceeded } = await UsageService.hasExceededLimit(anonymousId, 3);
        if (hasExceeded) throw new Error("QUOTA_EXCEEDED");
      }

      // --- STEP 2: CV PARSING (OCR) ---
      if (onProgress) await onProgress(2);
      let usedKeyIndex: number | undefined = undefined;
      
      if (cvFile && cvFile.size > 0 && !cvText) {
        try {
          const buffer = Buffer.from(await cvFile.arrayBuffer());
          const parseResult = await parseCV(buffer, cvFile.type, requestId);
          cvText = parseResult.text;
          usedKeyIndex = parseResult.usedKeyIndex !== -1 ? parseResult.usedKeyIndex : undefined;
        } catch (err: any) {
          if (err.message === "INVALID_CV_CONTENT") throw new Error("INVALID_CV_CONTENT");
          throw err;
        }
      }

      if (!cvText || cvText.trim().length === 0) throw new Error("CV_CONTENT_MISSING");

      // --- STEP 3: PREPARE PROMPT (Language Detection Merged) ---
      // AHORRAMOS LLAMADA #2: El prompt ahora maneja la detección y la salida.
      if (onProgress) await onProgress(3);
      
      const { buildMasterPrompt } = await import("@/lib/prompt/promptMaestro");
      const prompt = buildMasterPrompt({
        cvText,
        jobDescription: jobText || "",
        outputLanguage: outputLanguage // "auto" will be handled inside the prompt instructions
      });

      // --- STEP 4: LLM GENERATION ---
      if (onProgress) await onProgress(4);
      
      const result = await GenerationService.generateAndStore({
        userId: userId || undefined,
        anonymousId: !userId ? anonymousId : undefined,
        cvText,
        jobText: jobText || "",
        jobUrl: jobUrl || undefined,
        outputLanguage: outputLanguage === "auto" ? "es" : outputLanguage, // Default to es if prompt fails detection
        prompt,
        excludeGeminiIndex: usedKeyIndex,
      });

      // --- STEP 5: FINALIZING ---
      if (onProgress) await onProgress(5);
      
      // Track usage for anonymous users
      let updatedUsage = undefined;
      if (!user && anonymousId) {
        updatedUsage = await UsageService.trackAnonymousUsage(anonymousId);
      }

      return {
        ...result,
        usage_count: updatedUsage,
        free_uses_remaining: updatedUsage !== undefined ? Math.max(0, 3 - updatedUsage) : undefined
      };
    })();

    return Promise.race([workPromise, timeoutPromise]);
  }
}
