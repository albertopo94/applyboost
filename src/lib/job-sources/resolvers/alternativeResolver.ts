import type { JobOrchestratorInput } from "../types";

/**
 * Resolves alternative URLs when the primary one fails (C Strategy)
 */
export async function resolveAlternativeUrl({
  url,
  requestId = "unknown"
}: JobOrchestratorInput): Promise<string | null> {
  try {
    const urlObj = new URL(url);

    // LinkedIn Strategy: Convert private/session URLs to public ones
    // Common case 1: /jobs/collections/recommended/?currentJobId=4381999449
    // Common case 2: /jobs/view/4381999449/?...
    if (urlObj.hostname.includes("linkedin.com")) {
      const currentJobId = urlObj.searchParams.get("currentJobId");
      
      // If we have currentJobId, we can reconstruct the public /view/ URL
      if (currentJobId && /^\d+$/.test(currentJobId)) {
        const altUrl = `https://www.linkedin.com/jobs/view/${currentJobId}/`;
        console.log(`[RESOLVER_C][${requestId}] LinkedIn URL transformation: from private to public /view/${currentJobId}/`);
        return altUrl;
      }

      // If we are already on /jobs/view/ we check if we can clean it or if there's another variant
      if (urlObj.pathname.includes("/jobs/view/")) {
        // For now, if we are already in /view/ and it failed, we don't have a better one yet.
        return null;
      }
    }

    // Indeed Strategy: Try mobile version (/m/) which sometimes has fewer protections
    if (urlObj.hostname.includes("indeed.com")) {
      // If already on mobile, don't retry same
      if (urlObj.pathname.startsWith("/m/")) return null;

      // Transform /viewjob?jk=ID to /m/viewjob?jk=ID
      if (urlObj.pathname.includes("/viewjob")) {
        const altUrl = url.replace("indeed.com/viewjob", "indeed.com/m/viewjob");
        console.log(`[RESOLVER_C][${requestId}] Indeed URL transformation: from desktop to mobile (/m/)`);
        return altUrl;
      }
    }

    return null;
  } catch (error) {
    console.error(`[RESOLVER_C][${requestId}] Error resolving alternative:`, error);
    return null;
  }
}
