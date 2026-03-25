import { NextResponse } from "next/server";
import { parseCV } from "@/lib/parsers/cvParser";
import { scrapeJobUrl, normalizeJobDescription } from "@/lib/parsers/jobParser";
import { buildMasterPrompt } from "@/lib/prompt/promptMaestro";
import { callLLM } from "@/lib/llm";
import { calculateATSScore } from "@/lib/ats/calculateATSScore";
import { createClient, createAdminClient } from "@/lib/db/supabase-server";
import { requireAuth } from "@/lib/auth/auth-utils";

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
      console.error("[API_GENERATE] SUPABASE_SERVICE_ROLE_KEY is missing or using placeholder.");
      return NextResponse.json(
        { 
          error: { 
            code: "ENV_ERROR", 
            message: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor", 
            request_id: Date.now().toString() 
          } 
        },
        { status: 500 }
      );
    }

    const cvFile = formData.get("cvFile") as File | null;
    let cvText = formData.get("cvText") as string | null;
    const jobUrl = formData.get("jobUrl") as string | null;
    const jobTextFromForm = formData.get("jobText") as string | null;
    let jobText = jobTextFromForm;
    
    // Determinar idioma de salida inteligente
    const outputLanguage = (formData.get("outputLanguage") as string) || "auto";

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
            { 
              error: { 
                code: "SCRAPER_BLOCKED", 
                message: "No pudimos leer los detalles del empleo desde este enlace. Por favor, pega la descripción manualmente.", 
                request_id: Date.now().toString() 
              } 
            },
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

    // 4. Orquestación del LLM
    const prompt = buildMasterPrompt({
      cvText: cvText,
      jobDescription: jobText,
      outputLanguage: outputLanguage as "es" | "en" | "it" | "auto"
    });

    console.log(`[API_GENERATE] Generating for ${user ? `user ${userId}` : `anonymous ${anonymousId}`}...`);
    const llmResult = await callLLM(prompt);

    // 5. Cálculos Deterministas
    const scoreOriginal = calculateATSScore(cvText, llmResult.keywords);
    const scoreOptimizado = calculateATSScore(llmResult.cv_optimizado, llmResult.keywords);
    const hasMissingData = llmResult.cv_optimizado.includes("FALTA_DATO") || (llmResult.cover_letter?.includes("FALTA_DATO") ?? false);

    // 6. DB Persistence (Supabase)
    const supabase = await createClient();
    
    const { data: genData, error: dbError } = await supabase
      .from("generations")
      .insert({
        user_id: userId || null,
        anonymous_id: user ? null : anonymousId,
        cv_text: cvText,
        job_description: jobText,
        job_url: jobUrl,
        output_language: (outputLanguage === "auto" ? "es" : outputLanguage) as "es" | "en" | "it",
        generate_cv: true,
        generate_cover: !!llmResult.cover_letter
      })
      .select('id')
      .single();

    if (dbError) throw dbError;
    const genId = genData?.id;

    const { error: cvError } = await supabase
      .from("cv_versions")
      .insert({
        generation_id: genId,
        cv_optimizado: llmResult.cv_optimizado,
        cover_letter: llmResult.cover_letter,
        cover_letter_explanation: Array.isArray(llmResult.cover_letter_explanation) 
          ? llmResult.cover_letter_explanation.join("\n") 
          : llmResult.cover_letter_explanation,
        diff: llmResult.diff,
        keywords: llmResult.keywords,
        score_original: scoreOriginal,
        score_optimizado: scoreOptimizado,
        falta_dato_fields: hasMissingData ? ["Posible falta de información detectada"] : []
      });

    if (cvError) throw cvError;

    await supabase.from("generation_logs").insert({
      generation_id: genId,
      regenerations: 0,
      manual_edits: false,
      falta_dato_fields: hasMissingData ? ["Posible falta de información detectada"] : []
    });

    await supabase.rpc('increment_platform_stat', { stat_name: 'cvs_generated' });

    // 6.2 Increment anonymous usage if applicable (admin bypass)
    let newCount = 0;
    if (!user && anonymousId) {
      const adminClient = createAdminClient();
      const { data: usage } = await adminClient
        .from("anonymous_usage")
        .select("count")
        .eq("anonymous_id", anonymousId)
        .single();
      
      newCount = (usage?.count || 0) + 1;
      
      await adminClient
        .from("anonymous_usage")
        .upsert({ 
          anonymous_id: anonymousId, 
          count: newCount, 
          last_used_at: new Date().toISOString() 
        }, { onConflict: 'anonymous_id' });
    }

    // 7. Respuesta Final
    return NextResponse.json({
      generation_id: genId,
      cv_optimizado: llmResult.cv_optimizado,
      cover_letter: llmResult.cover_letter,
      cover_letter_explanation: llmResult.cover_letter_explanation,
      diff: llmResult.diff,
      keywords: llmResult.keywords,
      score_original: scoreOriginal,
      score_optimizado: scoreOptimizado,
      falta_dato_fields: hasMissingData ? ["Posible falta de información detectada"] : [],
      usage_count: !user ? newCount : 0,
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
