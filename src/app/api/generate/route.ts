import { NextResponse, type NextRequest } from "next/server";
import { OptimizeCVUseCase } from "@/lib/use-cases/OptimizeCVUseCase";

export const maxDuration = 120; // Ensure enough time for the stream

/**
 * API: /api/generate (Streaming Version)
 * 
 * Controlador de infraestructura para el flujo de optimización.
 * Delega toda la lógica de negocio al OptimizeCVUseCase.
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

  // Execute the use case in the background piped to the stream
  (async () => {
    try {
      const formData = await request.formData();
      const cvFile = formData.get("cvFile") as File | null;
      const cvText = formData.get("cvText") as string | null;
      const jobUrl = formData.get("jobUrl") as string | null;
      const jobText = formData.get("jobText") as string | null;
      const outputLanguage = (formData.get("outputLanguage") as any) || "auto";
      const anonymousId = formData.get("anonymousId") as string | null;

      const useCase = new OptimizeCVUseCase();
      
      const result = await useCase.execute({
        cvFile,
        cvText,
        jobText,
        jobUrl,
        outputLanguage,
        anonymousId,
        requestId,
        onProgress: sendProgress
      });

      await sendFinal(result);

    } catch (error: any) {
      console.error(`[API_GENERATE][${requestId}] Use Case Error:`, error);
      
      // Map domain errors to HTTP responses
      const errorMap: Record<string, { code: string; status: number }> = {
        "QUOTA_EXCEEDED": { code: "LIMIT_REACHED", status: 401 },
        "CV_CONTENT_MISSING": { code: "BAD_REQUEST", status: 400 },
        "INVALID_CV_CONTENT": { code: "INVALID_CV_CONTENT", status: 422 },
      };

      const mapped = errorMap[error.message] || { code: "INTERNAL_ERROR", status: 500 };

      await sendError({ 
        code: mapped.code, 
        message: error.message, 
        request_id: requestId 
      }, mapped.status);
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
