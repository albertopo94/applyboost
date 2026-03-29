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
 * OptimizeCVUseCase: Orquestra el flujo completo de optimización de CV.
 * Siguiendo el Single Responsibility Principle (SRP), este Caso de Uso
 * es el dueño de la lógica de negocio, desacoplado de la infraestructura HTTP.
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

    let cvText = initialCvText;

    // --- STEP 1: IDENTITY & QUOTA ---
    if (onProgress) await onProgress(1);
    const { user, userId, anonymousId } = await requireAuth({
      allowAnonymous: true,
      anonymousId: bodyAnonId || undefined
    });

    if (!user && anonymousId) {
      const { hasExceeded } = await UsageService.hasExceededLimit(anonymousId, 3);
      if (hasExceeded) {
        throw new Error("QUOTA_EXCEEDED");
      }
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
        if (err.message === "INVALID_CV_CONTENT") {
          throw new Error("INVALID_CV_CONTENT");
        }
        throw err;
      }
    }

    if (!cvText || cvText.trim().length === 0) {
      throw new Error("CV_CONTENT_MISSING");
    }

    // --- STEP 3: ANALYSIS & PROMPT BUILDING ---
    if (onProgress) await onProgress(3);
    
    let finalLanguage: "es" | "en" | "it" = "es";
    if (outputLanguage === "auto") {
      const { detectTextsLanguages } = await import("@/lib/llm/languageDetector");
      const detected = await detectTextsLanguages({ cv: cvText, job: jobText || "" });
      finalLanguage = (detected.job as any) || "es";
    } else {
      finalLanguage = outputLanguage as any;
    }

    const { buildMasterPrompt } = await import("@/lib/prompt/promptMaestro");
    const prompt = buildMasterPrompt({
      cvText,
      jobDescription: jobText || "",
      outputLanguage: finalLanguage
    });

    // --- STEP 4: LLM GENERATION ---
    if (onProgress) await onProgress(4);
    
    const result = await GenerationService.generateAndStore({
      userId: userId || undefined,
      anonymousId: !userId ? anonymousId : undefined,
      cvText,
      jobText: jobText || "",
      jobUrl: jobUrl || undefined,
      outputLanguage: finalLanguage,
      prompt,
      excludeGeminiIndex: usedKeyIndex,
    });

    // --- STEP 5: FINALIZING ---
    if (onProgress) await onProgress(5);
    
    return result;
  }
}
