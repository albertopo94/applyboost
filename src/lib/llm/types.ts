import { z } from "zod";

// ============================================================
// LLM Service Interface & Shared Types
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
// ============================================================

export abstract class LLMBaseError extends Error {
  constructor(public readonly provider: string, message: string, public readonly originalError?: any) {
    super(`[${provider.toUpperCase()}] ${message}`);
    this.name = this.constructor.name;
  }
}

export class LLMRateLimitError extends LLMBaseError {
  constructor(provider: string, message = "Rate limit hit or provider overloaded") {
    super(provider, message);
  }
}

export class LLMTimeoutError extends LLMBaseError {
  constructor(provider: string, message = "Provider timed out") {
    super(provider, message);
  }
}

export class LLMInvalidResponseError extends LLMBaseError {
  constructor(provider: string, message: string, originalError?: any) {
    super(provider, message, originalError);
  }
}

export class LLMProviderError extends LLMBaseError {
  constructor(provider: string, message: string, originalError?: any) {
    super(provider, message, originalError);
  }
}

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
  cv_explanation: z.string().optional(),
  cover_letter: z.string().min(10).max(5000).optional(),
  cover_letter_explanation: z.string().optional(),
  diff: z.array(DiffItemSchema).min(1),
  keywords: z.array(z.string()).min(3).max(30),
  /**
   * New: Suggestions for the user. 
   * Used to keep the CV clean of "Consider adding" comments.
   */
  falta_dato_fields: z.array(z.string()).default([]),
});

export type LLMOutput = z.infer<typeof LLMOutputSchema>;
export type DiffItem = z.infer<typeof DiffItemSchema>;

// ============================================================
// Generate Response — returned to the frontend
// ============================================================

export interface GenerateResponse {
  generation_id: string;
  cv_optimizado: string;
  cv_explanation?: string;
  cover_letter?: string;
  cover_letter_explanation?: string;
  diff: DiffItem[];
  keywords: string[];
  score_original: number;
  score_optimizado: number;
  falta_dato_fields: string[];
}

// ============================================================
// API Error Response — standardized format
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
