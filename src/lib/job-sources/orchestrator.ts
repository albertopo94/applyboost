import { classifyJobSourceDomain } from "./domainClassifier";
import { extractLinkedIn } from "./extractors/linkedinExtractor";
import { extractGeneric } from "./extractors/genericExtractor";
import { resolveAlternativeUrl } from "./resolvers/alternativeResolver";
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
  const input = { url, requestId };

  console.log(`[ORCHESTRATOR][${requestId}] Strategy B: Extracting from ${domain}: ${url}`);

  // 1. STRATEGY B: Try dedicated domain extractor
  let result: JobExtractResult;
  if (domain === "linkedin") {
    result = await extractLinkedIn(input);
  } else {
    // InfoJobs, Indeed, and Unknown currently use Generic B
    result = await extractGeneric(input);
  }

  // 2. STRATEGY C: If B failed (blocked or unreadable), try alternative URL
  if (result.status !== "ok") {
    console.warn(`[ORCHESTRATOR][${requestId}] Strategy B failed (${result.status}). Trying Strategy C...`);
    
    const altUrl = await resolveAlternativeUrl(input);
    if (altUrl && altUrl !== url) {
      console.log(`[ORCHESTRATOR][${requestId}] Strategy C: Retrying with alt URL: ${altUrl}`);
      const altResult = domain === "linkedin" 
        ? await extractLinkedIn({ ...input, url: altUrl }) 
        : await extractGeneric({ ...input, url: altUrl });

      if (altResult.status === "ok") {
        console.log(`[ORCHESTRATOR][${requestId}] Strategy C succeeded!`);
        return {
          ...altResult,
          strategyPath: "B_fail_C_ok",
        };
      }
      
      console.warn(`[ORCHESTRATOR][${requestId}] Strategy C also failed.`);
    } else {
      console.log(`[ORCHESTRATOR][${requestId}] Strategy C: No alternative URL found.`);
    }
  } else {
    // Strategy B worked
    return result;
  }

  // 3. STRATEGY A (Fallback Manual): Handled by the route/UI when this returns fail status
  console.error(`[ORCHESTRATOR][${requestId}] All automated strategies (B+C) failed for ${url}`);
  
  return {
    ...result,
    strategyPath: "B_fail_C_fail_A",
  };
}
