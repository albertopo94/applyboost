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

  // --- THE IRON WALL (Fail-Fast: LinkedIn, InfoJobs) ---
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

  // --- OPTIMIZED ROUTES (Indeed Direct) ---
  if (domain === "indeed") {
    const { extractIndeed } = await import("./extractors/indeedExtractor");
    return extractIndeed({ url, requestId });
  }

  // --- GENERIC CASCADE (Tier 1 -> Tier 2 Fallback) ---
  const { extractGeneric } = await import("./extractors/genericExtractor");
  return extractGeneric({ url, requestId });
}
