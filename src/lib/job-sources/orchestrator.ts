import { classifyJobSourceDomain } from "./domainClassifier";
import type { JobExtractResult, JobOrchestratorInput } from "./types";

/**
 * Orchestrates job description extraction — THE IRON WALL (v3)
 * 
 * Performance: Aborts restricted domains in 0.1ms without HTTP calls.
 */
export async function extractJobDescription({
  url,
  requestId = "unknown",
}: JobOrchestratorInput): Promise<JobExtractResult> {
  const domain = classifyJobSourceDomain(url);

  // --- THE IRON WALL (Fail-Fast) ---
  // Any domain that doesn't share content freely is blocked here.
  if (domain === "linkedin" || domain === "infojobs") {
    console.warn(`[ORCHESTRATOR][${requestId}] Iron Wall Block: Restricted domain '${domain}'. url: ${url}`);
    return {
      status: "blocked",
      domain,
      extractor: `${domain}-fail-fast-v3`,
      confidence: 0,
      reason: "manual_input_required: This platform restricts automated access. Please copy-paste the description manually.",
      strategyPath: "B_fail_fast",
    };
  }

  // Temporary stub for everything else until we re-add extractors
  console.log(`[ORCHESTRATOR][${requestId}] Passing to Generic (Legacy)...`);
  return {
    status: "source_unavailable",
    domain: "generic",
    extractor: "stub",
    confidence: 0,
    strategyPath: "legacy"
  };
}
