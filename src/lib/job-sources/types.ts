export type JobSourceDomain = "linkedin" | "indeed" | "infojobs" | "generic" | "unknown";

export type JobExtractionStatus = "ok" | "blocked" | "unreadable" | "source_unavailable";

export type JobExtractionStrategyPath = "B_ok" | "B_fail_C_ok" | "B_fail_C_fail_A" | "legacy";

export interface JobExtractResult {
  status: JobExtractionStatus;
  text?: string;
  domain: JobSourceDomain;
  extractor: string;
  confidence: number;
  reason?: string;
  sourceHttpStatus?: number;
  strategyPath: JobExtractionStrategyPath;
}

export interface JobOrchestratorInput {
  url: string;
  requestId?: string;
}
