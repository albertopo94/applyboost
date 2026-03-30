import type { AIService, CVDataObject } from "./types";
import { GroqService } from "./groq";
import { CerebrasService } from "./cerebras";
import { GeminiService } from "./gemini";
import { loadPrompt } from "../prompt/loader";

/** Registry of all available provider constructors for this task */
const PROVIDER_REGISTRY: Record<string, () => AIService> = {
  groq: () => new GroqService(),
  cerebras: () => new CerebrasService(),
  gemini: () => new GeminiService(),
};

function getProviderOrder(): string[] {
  const order = process.env.LLM_PROVIDER_ORDER ?? "groq,cerebras,gemini";
  return order
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p in PROVIDER_REGISTRY);
}

function extractJSON(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
}

/**
 * Uses a fast LLM to parse unstructured CV text into a strict CVDataObject.
 * SDD §7.2: LLM Data Extraction for Templating.
 * Optimization: Prompts-as-Data (v2).
 */
export async function parseTextToStructuredCV(text: string): Promise<CVDataObject> {
  const prompt = loadPrompt("structured_cv.md", { cvText: text });

  const providerOrder = getProviderOrder();
  if (providerOrder.length === 0) providerOrder.push("groq");

  for (const providerName of providerOrder) {
    const provider = PROVIDER_REGISTRY[providerName]();
    console.log(`[STRUCTURED_PARSER] Intentando con: ${providerName}`);

    try {
      const rawOutput = await provider.chat(prompt, AbortSignal.timeout(15000));
      const jsonStr = extractJSON(rawOutput);
      const parsed = JSON.parse(jsonStr);

      // Basic structure validation
      const validated: Partial<CVDataObject> = {
        name: parsed.name || "Sin nombre",
        contact: parsed.contact || { email: "", phone: "", location: "", linkedin: "" },
        summary: parsed.summary || "",
        experience: Array.isArray(parsed.experience) ? parsed.experience : [],
        education: Array.isArray(parsed.education) ? parsed.education : [],
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        languages: Array.isArray(parsed.languages) ? parsed.languages : [],
      };

      const hasSignificantContent = 
        validated.experience!.length > 0 || 
        validated.skills!.length > 0 || 
        validated.education!.length > 0;

      if (!hasSignificantContent && text.length > 200) {
        throw new Error("Contenido insuficiente extraído (experiencia y skills vacías)");
      }

      console.log(`[STRUCTURED_PARSER] ✅ Éxito con ${providerName}`);
      return validated as CVDataObject;
    } catch (error: any) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[STRUCTURED_PARSER] ⚠️ Falló ${providerName}: ${msg}`);
      // Continue to the next provider
    }
  }

  console.error("[STRUCTURED_PARSER] ❌ Todos los proveedores fallaron. Usando fallback de texto crudo.");
  
  // Minimal fallback object
  return {
    name: "Candidato",
    contact: { email: "", phone: "", location: "", linkedin: "" },
    summary: text.slice(0, 500),
    experience: [],
    education: [],
    skills: [],
    languages: [],
  };
}
