import { z } from "zod";

// ============================================================
// LLM Service Interface & Shared Types
// Source: SDD §7.2, Stack §🧠
// ============================================================

/**
 * Universal interface that every LLM provider must implement.
 * Pattern: each provider is a service with a name and a chat method.
 * Adding a new provider = implement this interface + add to .env LLM_PROVIDER_ORDER.
 */
export interface AIService {
  /** Provider display name (e.g. "groq", "cerebras", "gemini") */
  readonly name: string;

  /**
   * Send a single prompt and get a text response.
   * Must throw LLMRateLimitError on 429 so the orchestrator can fallback.
   * Accepts an optional AbortSignal for timeouts.
   * excludeGeminiIndex: skips a specific Gemini key index (useful after OCR).
   */
  chat(prompt: string, signal?: AbortSignal, excludeGeminiIndex?: number): Promise<string>;
}

/**
 * Thrown when a provider returns HTTP 429 (quota exhausted).
 * The round-robin orchestrator catches this and tries the next provider.
 */
export class LLMRateLimitError extends Error {
  constructor(provider: string) {
    super(`Rate limit hit on provider: ${provider}`);
    this.name = "LLMRateLimitError";
  }
}

/**
 * Thrown when an LLM returns a response that can't be parsed as valid JSON
 * or doesn't match the expected schema after retries.
 */
export class LLMOutputInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMOutputInvalidError";
  }
}

// ============================================================
// LLM Output Schema (Zod) — SDD §7.2
// Validates the JSON returned by the LLM before using it.
// ============================================================

export const DiffItemSchema = z.object({
  cambio: z.string(),
  motivo: z.string(),
  impacto: z.string(),
});

export const LLMOutputSchema = z.object({
  cv_optimizado: z.string().min(10),
  cover_letter: z.string().min(10).max(5000).optional(),
  cover_letter_explanation: z.union([z.string(), z.array(z.string())]).optional(),
  diff: z.array(DiffItemSchema).min(1),
  keywords: z.array(z.string()).min(3).max(30),
});

export type LLMOutput = z.infer<typeof LLMOutputSchema>;
export type DiffItem = z.infer<typeof DiffItemSchema>;

// ============================================================
// Generate Response — returned to the frontend
// Source: SDD §8.1
// ============================================================

export interface GenerateResponse {
  generation_id: string;
  cv_optimizado: string;
  cover_letter?: string;
  cover_letter_explanation?: string;
  diff: DiffItem[];
  keywords: string[];
  score_original: number;
  score_optimizado: number;
  falta_dato_fields: string[];
}

// ============================================================
// API Error Response — standardized format (SDD §11.1)
// ============================================================

export interface APIErrorResponse {
  error: {
    code: string;
    message: string;
    request_id: string;
  };
}

// ============================================================
// CV Data Object — structured CV for the Document Engine
// Source: SDD §10 DTOs
// ============================================================

export interface CVDataObject {
  name: string;
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
  };
  summary?: string;
  experience: {
    company: string;
    role: string;
    dates: string;
    bullets: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    dates: string;
  }[];
  skills: string[];
  languages?: string[];
  projects?: {
    name: string;
    description: string;
    url?: string;
  }[];
  raw_text?: string; // For sections the parser can't infer
}
