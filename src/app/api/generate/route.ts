import { NextResponse, type NextRequest } from "next/server";
import { parseCV } from "@/lib/parsers/cvParser";
import { GenerationService } from "@/lib/services/generationService";
import { requireAuth } from "@/lib/auth/auth-utils";
import { UsageService } from "@/lib/services/usageService";

export const maxDuration = 120; // Ensure enough time for the stream

/**
 * API: /api/generate (Streaming Version)
 * 
 * Orchestrates the full CV optimization flow and sends real-time progress events.
 * 1/5: Auth & Quota
 * 2/5: CV Parsing (OCR)
 * 3/5: Language & Context Analysis
 * 4/5: LLM Generation
 * 5/5: Persistence & Stats
 */
export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[API_GENERATE][${requestId}] INCOMING REQUEST: Starting Stream...`);

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendProgress = async (step: number, message?: string) => {
    const data = JSON.stringify({ type: "progress", step, message });
    await writer.write(encoder.encode(data + "\n"));
  };

  const sendFinal = async (data: any) => {
    const payload = JSON.stringify({ type: "final", data });
    await writer.write(encoder.encode(payload + "\n"));
    await writer.close();
  };

  const sendError = async (error: any, status = 500) => {
    const payload = JSON.stringify({ type: "error", error, status });
    await writer.write(encoder.encode(payload + "\n"));
    try { await writer.close(); } catch (e) {}
  };

  // Execute the heavy lifting in the background but piped to the stream
  (async () => {
    try {
      const formData = await request.formData();
      const cvFile = formData.get("cvFile") as File | null;
      let cvText = formData.get("cvText") as string | null;
      const jobUrl = formData.get("jobUrl") as string | null;
      const jobTextFromForm = formData.get("jobText") as string | null;
      const outputLanguage = (formData.get("outputLanguage") as any) || "auto";
      const bodyAnonId = formData.get("anonymousId") as string | null;

      // --- STEP 1: IDENTITY & QUOTA ---
      await sendProgress(1);
      const { user, userId, anonymousId } = await requireAuth({
        allowAnonymous: true,
        anonymousId: bodyAnonId || undefined
      });

      if (!user && anonymousId) {
        const timeoutPromise = new Promise<{ hasExceeded: boolean }>((resolve) =>
          setTimeout(() => resolve({ hasExceeded: false }), 2000)
        );
        const { hasExceeded } = await Promise.race([
          UsageService.hasExceededLimit(anonymousId, 3),
          timeoutPromise
        ]);
        if (hasExceeded) {
          return sendError({ code: "LIMIT_REACHED", message: "Quota exceeded" }, 401);
        }
      }

      // --- STEP 2: CV PARSING (OCR) ---
      await sendProgress(2);
      let usedKeyIndex: number | undefined = undefined;
      if (cvFile && cvFile.size > 0 && !cvText) {
        try {
          const buffer = Buffer.from(await cvFile.arrayBuffer());
          const parseResult = await parseCV(buffer, cvFile.type, requestId);
          cvText = parseResult.text;
          usedKeyIndex = parseResult.usedKeyIndex !== -1 ? parseResult.usedKeyIndex : undefined;
        } catch (err: any) {
          if (err.message === "INVALID_CV_CONTENT") {
            return sendError({ code: "INVALID_CV_CONTENT", message: err.message }, 422);
          }
          throw err;
        }
      }

      if (!cvText || cvText.trim().length === 0) {
        return sendError({ code: "BAD_REQUEST", message: "Falta proporcionar tu CV" }, 400);
      }

      // --- STEP 3 & 4: ANALYSIS & GENERATION ---
      await sendProgress(3);
      
      const { buildMasterPrompt } = await import("@/lib/prompt/promptMaestro");
      const prompt = buildMasterPrompt({
        cvText,
        jobDescription: jobTextFromForm || "",
        outputLanguage
      });

      const result = await GenerationService.generateAndStore({
        userId: userId || undefined,
        anonymousId: !userId ? anonymousId : undefined,
        cvText,
        jobText: jobTextFromForm || "",
        jobUrl: jobUrl || undefined,
        outputLanguage,
        prompt,
        excludeGeminiIndex: usedKeyIndex,
      });

      await sendProgress(4);

      // --- STEP 5: FINALIZING ---
      await sendProgress(5);
      await sendFinal(result);

    } catch (error: any) {
      console.error(`[API_GENERATE][${requestId}] Stream Error:`, error);
      await sendError({ 
        code: error.code || "INTERNAL_ERROR", 
        message: error.message, 
        request_id: requestId 
      });
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
