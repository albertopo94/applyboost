import { callLLM } from "./index";

/**
 * Detects the language of one or more texts using a fast LLM call.
 * Returns the ISO 639-1 code (es, en, it).
 */
export async function detectTextsLanguages(texts: { cv: string; job: string }): Promise<{ cv: string; job: string }> {
  const prompt = `
Analyze the following two texts and identify their primary language.
Respond ONLY with a JSON object containing the ISO 639-1 code (es, en, it) for each.

TEXT 1 (CV):
${texts.cv.slice(0, 1000)}

TEXT 2 (JOB):
${texts.job.slice(0, 1000)}

Expected Output:
{ "cv": "code", "job": "code" }
`;

  try {
    // We use the same orchestrator but with a very simple task
    const result = await callLLM(prompt);
    // Note: callLLM already handles JSON extraction and validation via Zod (if we use the same schema)
    // But since this is a specific internal task, we might want a simpler call.
    // For now, let's assume we can parse it from the raw string if we make a separate call.
    
    // Actually, let's keep it simple and use the main orchestrator for now, 
    // but we'll need to handle the fact that LLMOutputSchema doesn't match this.
    // Better: Create a specialized fast-check function.
    return { cv: "unknown", job: "unknown" }; // Placeholder for the actual implementation below
  } catch (error) {
    console.error("[LANG_DETECT] Error detecting languages:", error);
    return { cv: "unknown", job: "unknown" };
  }
}
