import { z } from "zod";
import { GroqService } from "./groq";
import { CerebrasService } from "./cerebras";
import { GeminiService } from "./gemini";
import { OpenRouterService } from "./openrouter";
import type { CVDataObject, AIService } from "./types";
import { LLMRateLimitError } from "./types";

const PROVIDER_REGISTRY: Record<string, () => AIService> = {
  groq: () => new GroqService(),
  cerebras: () => new CerebrasService(),
  gemini: () => new GeminiService(),
  openrouter: () => new OpenRouterService(),
};

function getProviderOrder(): string[] {
  const order = process.env.LLM_PROVIDER_ORDER ?? "gemini,groq,cerebras,openrouter";
  return order
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p in PROVIDER_REGISTRY);
}

const StructuredCVSchema = z.object({
  name: z.string(),
  contact: z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedin: z.string().optional(),
  }),
  summary: z.string().optional(),
  experience: z.array(z.object({
    company: z.string(),
    role: z.string(),
    dates: z.string(),
    bullets: z.array(z.string()),
  })),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    dates: z.string(),
  })),
  skills: z.array(z.string()),
  languages: z.array(z.string()).optional(),
});

function extractJSON(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1).replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
  }
  return text.trim();
}

/**
 * Uses a fast LLM to parse unstructured CV text into a strict CVDataObject.
 * SDD §7.2: LLM Data Extraction for Templating.
 */
export async function parseTextToStructuredCV(text: string): Promise<CVDataObject> {
  const prompt = `
Eres un experto en extracción de datos estructurados.
Tu tarea es leer el siguiente texto (un CV) y mapearlo EXACTAMENTE al formato JSON solicitado.
No inventes información. Si un dato no existe, déjalo vacío o no lo incluyas.

### REGLAS CRÍTICAS
1. CAMPOS DE TEXTO: "name", "summary", "company", "role", "dates", "institution" y "degree" DEBEN ser strings. NO devuelvas objetos JSON dentro de estos campos.
2. ARRAYS: "bullets", "skills" y "languages" DEBEN ser arrays de strings.
3. SI FALTA INFORMACIÓN: Usa "" o un array vacío []. No inventes datos.

TEXTO DEL CV:
${text.slice(0, 8000)}

OUTPUT ESPERADO (JSON Puro):
{
  "name": "Nombre Completo",
  "contact": { "email": "", "phone": "", "location": "", "linkedin": "" },
  "summary": "Resumen profesional si existe",
  "experience": [
    { "company": "Empresa", "role": "Puesto", "dates": "Fechas", "bullets": ["logro 1", "logro 2"] }
  ],
  "education": [
    { "institution": "Universidad", "degree": "Título", "dates": "Fechas" }
  ],
  "skills": ["skill 1", "skill 2"],
  "languages": ["idioma 1", "idioma 2"]
}
`;

  const providerOrder = getProviderOrder();
  if (providerOrder.length === 0) providerOrder.push("groq");

  for (const providerName of providerOrder) {
    const provider = PROVIDER_REGISTRY[providerName]();
    console.log(`[STRUCTURED_PARSER] Intentando con: ${providerName}`);
    
    try {
      const rawOutput = await provider.chat(prompt, AbortSignal.timeout(15000));
      const jsonStr = extractJSON(rawOutput);
      const parsed = JSON.parse(jsonStr);
      
      const validated = StructuredCVSchema.parse(parsed);

      // Validación de "calidad" mínima
      const hasSignificantContent = 
        (validated.experience.length > 0 && validated.experience[0].company !== "") || 
        (validated.skills.length > 0);

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
  return {
    name: "Currículum Vitae",
    contact: {},
    summary: text,
    experience: [],
    education: [],
    skills: []
  };
}
