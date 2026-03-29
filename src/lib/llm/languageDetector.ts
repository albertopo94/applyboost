import { loadPrompt } from "../prompt/loader";
import { GroqService } from "./groq";
import { GeminiService } from "./gemini";

/**
 * Detects the language of one or more texts using a fast LLM call.
 * Returns the ISO 639-1 code (es, en, it).
 */
export async function detectTextsLanguages(texts: { cv: string; job: string }): Promise<{ cv: string; job: string }> {
  const prompt = loadPrompt("language_detection.md", {
    cvText: texts.cv.slice(0, 1000),
    jobText: texts.job.slice(0, 1000)
  });

  // Usar un proveedor rápido para esta tarea sencilla
  const provider = new GroqService();
  
  try {
    const rawOutput = await provider.chat(prompt, AbortSignal.timeout(5000));
    const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { cv: "es", job: "es" }; // Fallback
  } catch (error) {
    console.warn("[detectTextsLanguages] Falló detección automática, usando español por defecto.");
    return { cv: "es", job: "es" };
  }
}
