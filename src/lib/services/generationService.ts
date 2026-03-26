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
}

export interface GenerationResult {
  generation_id: string;
  cv_optimizado: string;
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
    const { userId, anonymousId, cvText, jobText, jobUrl, outputLanguage, prompt } = params;

    // 1. LLM Orchestration
    const llmResult = await callLLM(prompt);

    // 2. Calculations
    const scoreOriginal = calculateATSScore(cvText, llmResult.keywords);
    const scoreOptimizado = calculateATSScore(llmResult.cv_optimizado, llmResult.keywords);
    const hasMissingData = 
      llmResult.cv_optimizado.includes("FALTA_DATO") || 
      (llmResult.cover_letter?.includes("FALTA_DATO") ?? false);
    
    const faltaDatoMsg = hasMissingData ? ["Posible falta de información detectada"] : [];

    // 3. Database Persistence
    const supabase = await createClient();
    
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
        falta_dato_fields: faltaDatoMsg
      });

    if (cvError) throw cvError;

    // Logging & Stats
    await supabase.from("generation_logs").insert({
      generation_id: genId,
      regenerations: 0,
      manual_edits: false,
      falta_dato_fields: faltaDatoMsg
    });

    const adminClient = createAdminClient();
    const { data: currentStats } = await adminClient.from('platform_stats').select('cvs_generated').eq('id', 1).single();
    const nextValue = (currentStats?.cvs_generated || 0) + 1;
    await adminClient.from('platform_stats').update({ cvs_generated: nextValue }).eq('id', 1);

    return {
      generation_id: genId,
      cv_optimizado: llmResult.cv_optimizado,
      cover_letter: llmResult.cover_letter,
      cover_letter_explanation: llmResult.cover_letter_explanation,
      diff: llmResult.diff,
      keywords: llmResult.keywords,
      score_original: scoreOriginal,
      score_optimizado: scoreOptimizado,
      falta_dato_fields: faltaDatoMsg
    };
  }
}
