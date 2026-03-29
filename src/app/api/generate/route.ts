export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { parseCV } from "@/lib/parsers/cvParser";
import { scrapeJobUrl, normalizeJobDescription } from "@/lib/parsers/jobParser";
import { extractJobDescription } from "@/lib/job-sources/orchestrator";
import { buildMasterPrompt } from "@/lib/prompt/promptMaestro";
import { requireAuth } from "@/lib/auth/auth-utils";
import { UsageService } from "@/lib/services/usageService";
import { GenerationService } from "@/lib/services/generationService";

// Feature Flags
const ENABLE_JOB_SOURCE_ORCHESTRATOR = process.env.ENABLE_JOB_SOURCE_ORCHESTRATOR === "true";

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  console.log(`[API_GENERATE][${requestId}] INCOMING REQUEST: Checking FormData & Identity...`);

  try {
    const formData = await req.formData();
    const bodyAnonId = formData.get("anonymous_id") as string | null;

    // 1. Resolve Identity (Allow Anonymous for MVP)
    const { user, userId, anonymousId } = await requireAuth({
      allowAnonymous: true,
      anonymousId: bodyAnonId || undefined
    });
    console.log(`[API_GENERATE][${requestId}] Identity resolved for ${user ? `user ${userId}` : `anonymous ${anonymousId}`}.`);

    // 1.1 Quota Check for Anonymous Users (Limit: 3)
    if (!user && anonymousId) {
      console.log(`[API_GENERATE][${requestId}] Checking anonymous usage for ID: ${anonymousId} (2s timeout)...`);
      
      const timeoutPromise = new Promise<{ hasExceeded: boolean }>((resolve) =>
        setTimeout(() => resolve({ hasExceeded: false }), 2000) // Fail-safe: allow if DB is slow
      );

      try {
        const { hasExceeded } = await Promise.race([
          UsageService.hasExceededLimit(anonymousId, 3),
          timeoutPromise
        ]);

        if (hasExceeded) {
          console.warn(`[API_GENERATE][${requestId}] LIMIT_REACHED for anonymous ID: ${anonymousId}. Blocking request.`);
          return NextResponse.json(
            { error: "LIMIT_REACHED" },
            { status: 401 }
          );
        }
      } catch (err) {
        console.error(`[API_GENERATE][${requestId}] Error checking usage:`, err);
        // Fail-safe: continue if check fails
      }
    }

    // Check for required environment variables
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey || serviceRoleKey === "your-service-role-key-here") {
      console.error(`[API_GENERATE][${requestId}] SUPABASE_SERVICE_ROLE_KEY is missing.`);
      return NextResponse.json(
        { error: { code: "ENV_ERROR", message: "Falta configurar SUPABASE_SERVICE_ROLE_KEY", request_id: requestId } },
        { status: 500 }
      );
    }

    const cvFile = formData.get("cvFile") as File | null;
    let cvText = formData.get("cvText") as string | null;
    let usedKeyIndex: number | undefined = undefined;
    const jobUrl = formData.get("jobUrl") as string | null;
    const jobTextFromForm = formData.get("jobText") as string | null;
    let jobText = jobTextFromForm;
    const outputLanguageRaw = (formData.get("outputLanguage") as string) || "auto";

    // 2. Parsing del CV (soporta Drop file o texto pegado)
    if (cvFile && cvFile.size > 0 && !cvText) {
      const buffer = Buffer.from(await cvFile.arrayBuffer());
      const parseResult = await parseCV(buffer, cvFile.type, requestId);
      cvText = parseResult.text;
      usedKeyIndex = parseResult.usedKeyIndex !== -1 ? parseResult.usedKeyIndex : undefined;
    } else if (!cvText || cvText.trim().length === 0) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Falta proporcionar tu CV", request_id: requestId } },
        { status: 400 }
      );
    }

    // PODA: Limitar el tamaño del CV
    if (cvText.length > 30000) {
      console.warn(`[API_GENERATE] CV text too long (${cvText.length}), truncating.`);
      cvText = cvText.slice(0, 30000) + "... [Texto truncado]";
    }

    // 3. Parsing de la Oferta Laboral
    if (jobText && jobText.trim().length > 0) {
      jobText = normalizeJobDescription(jobText);
    } else if (jobUrl && jobUrl.trim().length > 0) {
      try {
        const normalizedJobUrl = jobUrl.trim();

        if (ENABLE_JOB_SOURCE_ORCHESTRATOR) {
          const extraction = await extractJobDescription({ url: normalizedJobUrl, requestId });
          
          console.log(`[API_GENERATE][${requestId}] Orchestrator result: status=${extraction.status} domain=${extraction.domain} path=${extraction.strategyPath} extractor=${extraction.extractor} confidence=${extraction.confidence}`);

          if (extraction.status === "ok" && extraction.text) {
            jobText = extraction.text;
          } else {
            // If orchestrator fails (blocked, unreadable, etc.), we map to legacy errors
            // so the frontend shows the correct "Manual Fallback (A)" message.
            if (extraction.status === "blocked") throw new Error("SCRAPER_BLOCKED");
            throw new Error(`JOB_URL_UNREADABLE: ${extraction.reason || "Orchestrator failed"}`);
          }
        } else {
          // Legacy Path
          jobText = await scrapeJobUrl(normalizedJobUrl);
        }

        const preview = jobText.slice(0, 180).replace(/\s+/g, " ");
        console.log(
          `[SCRAPER_AUDIT] URL=${normalizedJobUrl} extracted_length=${jobText.length} preview="${preview}${jobText.length > 180 ? "..." : ""}"`
        );
      } catch (err: any) {
        if (err.message === "SCRAPER_BLOCKED") {
          console.warn(`[API_GENERATE][${requestId}] SCRAPER_BLOCKED for URL=${jobUrl ?? "N/A"}`);
          return NextResponse.json(
            { error: { code: "SCRAPER_BLOCKED", message: "No pudimos leer los detalles del empleo. Por favor, pega la descripción manualmente.", request_id: requestId } },
            { status: 403 }
          );
        }
        if (typeof err?.message === "string" && err.message.startsWith("JOB_URL_UNREADABLE")) {
          console.warn(`[API_GENERATE][${requestId}] JOB_URL_UNREADABLE for URL=${jobUrl ?? "N/A"} reason="${err.message}"`);
          return NextResponse.json(
            { error: { code: "JOB_URL_UNREADABLE", message: "No pudimos leer los detalles del empleo. Por favor, pega la descripción manualmente.", request_id: requestId } },
            { status: 422 }
          );
        }
        throw err;
      }
    } else {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Falta proporcionar la oferta laboral", request_id: requestId } },
        { status: 400 }
      );
    }

    // PODA: Limitar el tamaño de la oferta laboral
    if (jobText && jobText.length > 20000) {
      jobText = jobText.slice(0, 20000) + "... [Texto truncado]";
    }

    // 4. Generation Orchestration
    const outputLanguage = (outputLanguageRaw === "auto" ? "es" : outputLanguageRaw) as "es" | "en" | "it";
    const prompt = buildMasterPrompt({
      cvText: cvText,
      jobDescription: jobText,
      outputLanguage: outputLanguageRaw as "es" | "en" | "it" | "auto"
    });

    console.log(`[API_GENERATE][${requestId}] Generating for ${user ? `user ${userId}` : `anonymous ${anonymousId}`}...`);
    
    const genResult = await GenerationService.generateAndStore({
      userId,
      anonymousId,
      cvText,
      jobText,
      jobUrl,
      outputLanguage,
      prompt,
      excludeGeminiIndex: usedKeyIndex
    });

    // 5. Usage Tracking (Anonymous only)
    let usageCount = 0;
    if (!user && anonymousId) {
      usageCount = await UsageService.trackAnonymousUsage(anonymousId);
    }

    // 6. Respuesta Final
    return NextResponse.json({
      ...genResult,
      usage_count: usageCount,
      is_anonymous: !user
    });

  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const msg = error?.message || "Error desconocido durante la generación";
    console.error(`[API_GENERATE][${requestId}] Error:`, error);
    return NextResponse.json(
      { error: { code: "GENERATE_ERROR", message: msg, request_id: requestId } },
      { status: 500 }
    );
  }
}
