import { classifyJobSourceDomain } from "./domainClassifier";
import type { JobExtractResult, JobOrchestratorInput } from "./types";

/**
 * Orchestrates job description extraction using B->C->A strategy:
 * B: Dedicated domain extractors (LinkedIn, Indeed, etc.)
 * C: Automatic alternative URL resolution
 * A: Manual fallback (handled by caller when B and C fail)
 */
export async function extractJobDescription({
  url,
  requestId = "unknown",
}: JobOrchestratorInput): Promise<JobExtractResult> {
  const domain = classifyJobSourceDomain(url);

  console.log(`[ORCHESTRATOR][${requestId}] Extracting from ${domain}: ${url}`);

  // PROBE #3: Skeleton implementation. 
  // Intentional "source_unavailable" to keep using legacy path via Feature Flag.
  // B and C logic will be added in Lot B.
  return {
    status: "source_unavailable",
    domain,
    extractor: "none",
    confidence: 0,
    reason: "Orchestrator skeleton active. B/C extractors not yet implemented (Probe #3).",
    strategyPath: "B_fail_C_fail_A",
  };
}
