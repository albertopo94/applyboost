import { callLLM } from "@/lib/llm";
import { calculateATSScore } from "@/lib/ats/calculateATSScore";
import { createClient, createAdminClient } from "@/lib/db/supabase-server";

export interface GenerationRequest {
  userId?: string | null;
  anonymousId?: string | null;
  cvText: string;
  jobText: string;
  jobUrl?: string | null;
  outputLanguage: "es" | "en" | "it";
  prompt: string;
  excludeGeminiIndex?: number;
  forceFallback?: boolean;
}

export interface GenerationResult {
  generation_id: string;
  cv_optimizado: string;
  cv_explanation?: string;
  cover_letter?: string;
  cover_letter_explanation?: string | string[];
  diff: string;
  keywords: string[];
  score_original: number;
  score_optimizado: number;
  falta_dato_fields: string[];
}

/**
 * Service to encapsulate CV generation business logic and database persistence.
 */
export class GenerationService {
  /**
   * Orchestrates LLM call and stores results in the database.
   */
  static async generateAndStore(params: GenerationRequest): Promise<GenerationResult> {
    const { 
      userId, 
      anonymousId, 
      cvText, 
      jobText, 
      jobUrl, 
      outputLanguage, 
      prompt, 
      excludeGeminiIndex,
      forceFallback
    } = params;

    // 1. LLM Orchestration
    const llmResult = await callLLM(prompt, excludeGeminiIndex, cvText, forceFallback);

    // 2. Calculations
    const scoreOriginal = calculateATSScore(cvText, llmResult.keywords);
    const scoreOptimizado = calculateATSScore(llmResult.cv_optimizado, llmResult.keywords);
    const hasMissingData = 
      llmResult.cv_optimizado.includes("FALTA_DATO") || 
      (llmResult.cover_letter?.includes("FALTA_DATO") ?? false);
    
    const faltaDatoMsg = hasMissingData ? ["Posible falta de información detectada"] : [];

    // 3. Database Persistence - Use Admin Client to bypass RLS for anonymous/new users
    console.log(`[GenerationService] Step 3: Saving to 'generations' table...`);
    const supabase = createAdminClient();

    const { data: genData, error: dbError } = await supabase
      .from("generations")
      .insert({
        user_id: userId || null,
        anonymous_id: userId ? null : anonymousId,
        cv_text: cvText,
        job_description: jobText,
        job_url: jobUrl,
        output_language: outputLanguage,
        generate_cv: true,
        generate_cover: !!llmResult.cover_letter
      })
      .select('id')
      .single();

    if (dbError) {
      console.error(`[GenerationService] Error in 'generations' insert:`, dbError);
      throw dbError;
    }
    const genId = genData?.id;
    console.log(`[GenerationService] 'generations' success! ID: ${genId}. Now saving to 'cv_versions'...`);

    // NOTE: We don't save cv_explanation to DB yet to avoid breaking current MVP schema
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
        falta_dato_fields: faltaDatoMsg
      });

    if (cvError) {
      console.error(`[GenerationService] Error in 'cv_versions' insert:`, cvError);
      throw cvError;
    }
    console.log(`[GenerationService] 'cv_versions' success!`);

    // 4. Background stats update (Reliable & Atomic)
    // We trigger this without 'await' to not block the main response, 
    // but using RPC ensures the server-side operation is atomic.
    supabase.rpc('increment_platform_stat', { stat_name: 'cvs_generated' })
      .then(({ error }) => {
        if (error) console.error("[STATS_GENERATE_ERROR]", error);
      })
      .catch(e => console.error("[STATS_GENERATE_EXCEPTION]", e));

    return {
      generation_id: genId,
      cv_optimizado: llmResult.cv_optimizado,
      cv_explanation: llmResult.cv_explanation, // FIX: Direct pass to UI
      cover_letter: llmResult.cover_letter,
      cover_letter_explanation: Array.isArray(llmResult.cover_letter_explanation) 
        ? llmResult.cover_letter_explanation.join("\n") 
        : llmResult.cover_letter_explanation,
      diff: llmResult.diff,
      keywords: llmResult.keywords,
      score_original: scoreOriginal,
      score_optimizado: scoreOptimizado,
      falta_dato_fields: faltaDatoMsg
    };
  }
}
