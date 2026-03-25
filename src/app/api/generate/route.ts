import { NextResponse } from "next/server";
import { parseCV } from "@/lib/parsers/cvParser";
import { scrapeJobUrl, normalizeJobDescription } from "@/lib/parsers/jobParser";
import { buildMasterPrompt } from "@/lib/prompt/promptMaestro";
import { requireAuth } from "@/lib/auth/auth-utils";
import { UsageService } from "@/lib/services/usageService";
import { GenerationService } from "@/lib/services/generationService";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const bodyAnonId = formData.get("anonymous_id") as string | null;

    // 1. Resolve Identity (Allow Anonymous for MVP)
    const { user, userId, anonymousId } = await requireAuth({ 
      allowAnonymous: true, 
      anonymousId: bodyAnonId || undefined 
    });
    
    // Check for required environment variables
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey || serviceRoleKey === "your-service-role-key-here") {
      console.error("[API_GENERATE] SUPABASE_SERVICE_ROLE_KEY is missing.");
      return NextResponse.json(
        { error: { code: "ENV_ERROR", message: "Falta configurar SUPABASE_SERVICE_ROLE_KEY", request_id: Date.now().toString() } },
        { status: 500 }
      );
    }

    const cvFile = formData.get("cvFile") as File | null;
    let cvText = formData.get("cvText") as string | null;
    const jobUrl = formData.get("jobUrl") as string | null;
    const jobTextFromForm = formData.get("jobText") as string | null;
    let jobText = jobTextFromForm;
    const outputLanguageRaw = (formData.get("outputLanguage") as string) || "auto";

    // 2. Parsing del CV (soporta Drop file o texto pegado)
    if (cvFile && cvFile.size > 0 && !cvText) {
      const buffer = Buffer.from(await cvFile.arrayBuffer());
      cvText = await parseCV(buffer, cvFile.type);
    } else if (!cvText || cvText.trim().length === 0) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Falta proporcionar tu CV", request_id: Date.now().toString() } },
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
        jobText = await scrapeJobUrl(jobUrl);
      } catch (err: any) {
        if (err.message === "SCRAPER_BLOCKED") {
          return NextResponse.json(
            { error: { code: "SCRAPER_BLOCKED", message: "No pudimos leer los detalles del empleo. Por favor, pega la descripción manualmente.", request_id: Date.now().toString() } },
            { status: 403 }
          );
        }
        throw err;
      }
    } else {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Falta proporcionar la oferta laboral", request_id: Date.now().toString() } },
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

    console.log(`[API_GENERATE] Generating for ${user ? `user ${userId}` : `anonymous ${anonymousId}`}...`);
    
    const genResult = await GenerationService.generateAndStore({
      userId,
      anonymousId,
      cvText,
      jobText,
      jobUrl,
      outputLanguage,
      prompt
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
    console.error("[API_GENERATE] Error:", error);
    return NextResponse.json(
      { error: { code: "GENERATE_ERROR", message: msg, request_id: Date.now().toString() } },
      { status: 500 }
    );
  }
}
