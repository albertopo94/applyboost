import { z } from "zod";

// ============================================================
// LLM Service Interface & Shared Types
// Source: SDD §7.2, Stack §🧠
// ============================================================

/**
 * Universal interface that every LLM provider must implement.
 */
export interface AIService {
  readonly name: string;
  chat(prompt: string, signal?: AbortSignal, excludeGeminiIndex?: number): Promise<string>;
}

// ============================================================
// Error Hierarchy — SDD §Design
// Standardized errors for resilience and fallback.
// ============================================================

/**
 * Base class for all LLM-related errors.
 */
export abstract class LLMBaseError extends Error {
  constructor(public readonly provider: string, message: string, public readonly originalError?: any) {
    super(`[${provider.toUpperCase()}] ${message}`);
    this.name = this.constructor.name;
  }
}

/**
 * Thrown when a provider returns HTTP 429 (quota exhausted) or 503 (server overloaded).
 * Trigger for round-robin fallback.
 */
export class LLMRateLimitError extends LLMBaseError {
  constructor(provider: string, message = "Rate limit hit or provider overloaded") {
    super(provider, message);
  }
}

/**
 * Thrown when an LLM provider times out (e.g., 55s limit).
 * Trigger for round-robin fallback.
 */
export class LLMTimeoutError extends LLMBaseError {
  constructor(provider: string, message = "Provider timed out") {
    super(provider, message);
  }
}

/**
 * Thrown when an LLM returns a response that can't be parsed as valid JSON
 * or doesn't match the expected schema after retries.
 */
export class LLMInvalidResponseError extends LLMBaseError {
  constructor(provider: string, message: string, originalError?: any) {
    super(provider, message, originalError);
  }
}

/**
 * Thrown for unhandled or unexpected provider errors (e.g., auth, network failure).
 */
export class LLMProviderError extends LLMBaseError {
  constructor(provider: string, message: string, originalError?: any) {
    super(provider, message, originalError);
  }
}

/**
 * Backward compatibility: Old error name used in orchestrator.
 * TODO: Migrate all references to LLMInvalidResponseError and remove.
 */
export class LLMOutputInvalidError extends LLMInvalidResponseError {
  constructor(message: string) {
    super("unknown", message);
  }
}

// ============================================================
// LLM Output Schema (Zod) — SDD §7.2
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
  raw_text?: string;
}
