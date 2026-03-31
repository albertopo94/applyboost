import { parseCV } from "@/lib/parsers/cvParser";
import { GenerationService } from "@/lib/services/generationService";
import { requireAuth } from "@/lib/auth/auth-utils";
import { UsageService } from "@/lib/services/usageService";
import { GenerateResponse } from "@/lib/llm/types";
import { GeminiKeyManager } from "@/lib/llm/gemini-key-manager";

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
 * Incluye un timeout global de 300 segundos para dar aire a los procesos pesados.
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

    // --- GLOBAL TIMEOUT (300 SECONDS) ---
    const globalTimeoutMs = 300000;
    const startTime = Date.now();
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("GLOBAL_TIMEOUT")), globalTimeoutMs);
    });

    const workPromise = (async (): Promise<GenerateResponse> => {
      let cvText = initialCvText;

      if (onProgress) await onProgress(1);
      const { user, userId, anonymousId } = await requireAuth({
        allowAnonymous: true,
        anonymousId: bodyAnonId || undefined
      });

      if (!user && anonymousId) {
        const hasExceeded = await UsageService.hasExceededLimit(anonymousId, 3);
        if (hasExceeded) throw new Error("QUOTA_EXCEEDED");
      }

      // --- STEP 1.5: IRON WALL (SCRAPING) ---
      // We check the job URL first. If it's a restricted domain, we stop IMMEDIATELY
      // before processing the CV (saving OCR/LLM costs).
      let jobDescription = jobText || "";

      if (jobUrl && jobUrl.trim().length > 0 && !jobDescription) {
        const { extractJobDescription: extractJob } = await import("@/lib/job-sources/orchestrator");
        const scrapResult = await extractJob({ url: jobUrl, requestId });

        console.log(`[USE_CASE][${requestId}] Scraper Result: ${scrapResult.status} for domain ${scrapResult.domain}`);

        if (scrapResult.status === "blocked") {
          // Trigger the Iron Wall error
          throw new Error("JOB_DESCRIPTION_RESTRICTED");
        }

        if (scrapResult.status === "ok" && scrapResult.text) {
          jobDescription = scrapResult.text;
        }
      }

      // --- STEP 2: CV PARSING (OCR) ---
      if (onProgress) await onProgress(2);
      let usedKeyIndex: number | undefined = undefined;
      
      if (cvFile && cvFile.size > 0 && !cvText) {
        // --- CIRCUIT BREAKER CHECK ---
        if (!GeminiKeyManager.isHealthy()) {
          console.error(`[OCR_SERVICE_DOWN][${requestId}] Gemini is unhealthy. Aborting Stage 1.`);
          throw new Error("OCR_SERVICE_DOWN");
        }

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
        jobDescription: jobDescription, // Use the one from scraper or initial
        outputLanguage: outputLanguage // "auto" will be handled inside the prompt instructions
      });

      // --- STEP 4: LLM GENERATION ---
      if (onProgress) await onProgress(4);
      
      // --- INTELLIGENT ROUTING DECISION ---
      const timeElapsed = (Date.now() - startTime) / 1000;
      const remainingTime = (globalTimeoutMs / 1000) - timeElapsed;
      const isUnhealthy = !GeminiKeyManager.isHealthy();
      
      // We force fallback to Groq if:
      // 1. Google is currently marked as UNHEALTHY (Circuit Breaker)
      // 2. We have less than 40s remaining (Time pressure safety)
      const forceFallback = isUnhealthy || remainingTime < 40;

      if (forceFallback) {
        console.warn(`[INTELLIGENT_FALLBACK][${requestId}] Forcing Groq fallback. Reason: ${isUnhealthy ? "UNHEALTHY" : "LOW_TIME (" + remainingTime.toFixed(1) + "s left)"}`);
      }
      
      const result = await GenerationService.generateAndStore({
        userId: userId || undefined,
        anonymousId: !userId ? anonymousId : undefined,
        cvText,
        jobText: jobDescription,
        jobUrl: jobUrl || undefined,
        outputLanguage: outputLanguage === "auto" ? "es" : outputLanguage, // Default to es if prompt fails detection
        prompt,
        excludeGeminiIndex: usedKeyIndex,
        forceFallback, // We need to pass this to the service
      });

      // --- STEP 5: FINALIZING ---
      if (onProgress) await onProgress(5);
      
      return {
        ...result,
      };

    })();

    return Promise.race([workPromise, timeoutPromise]);
  }
}
