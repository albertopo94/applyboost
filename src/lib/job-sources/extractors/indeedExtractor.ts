import type { JobExtractResult, JobOrchestratorInput } from "../types";

/**
 * Indeed Extractor (TIER 2 DIRECT)
 * Already known to be a heavy SPA, so we skip Cheerio and go straight to markdown.new
 */
export async function extractIndeed(input: JobOrchestratorInput): Promise<JobExtractResult> {
  return extractViaMarkdownNew(input, "indeed-direct-v3");
}

/**
 * Shared logic for cloud browser rendering via Markdown.new
 */
export async function extractViaMarkdownNew(
  input: JobOrchestratorInput, 
  extractorName: string = "markdown-v3"
): Promise<JobExtractResult> {
  const { url, requestId = "unknown" } = input;
  console.log(`[EXTRACT_MARKDOWN][${requestId}] TIER 2 (DIRECT/FALLBACK) via markdown.new for ${url}`);

  try {
    // We use "method": "browser" to force Tier 3 (headless browser) rendering in markdown.new.
    // This is required for heavy SPA sites like Indeed that fail with Tier 1 or Tier 2.
    const response = await fetch("https://markdown.new/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url, method: "browser" })
    });


    const remaining = response.headers.get("x-rate-limit-remaining");
    console.log(`[EXTRACT_MARKDOWN][${requestId}] API Rate Limit Remaining: ${remaining}`);

    if (response.ok) {
      const data = await response.json();
      const content = data.content || "";

      if (content.length > 250) {
        console.log(`[EXTRACT_MARKDOWN][${requestId}] SUCCESS! (${content.length} chars)`);
        return {
          status: "ok",
          text: content,
          domain: "generic",
          extractor: extractorName,
          confidence: 0.95,
          strategyPath: "B_fail_C_ok"
        };
      }
    }
    
    console.warn(`[EXTRACT_MARKDOWN][${requestId}] FAILED Content quality.`);
    return {
      status: "unreadable",
      domain: "generic",
      extractor: extractorName,
      confidence: 0.1,
      strategyPath: "B_fail_C_fail_A"
    };

  } catch (err) {
    console.error(`[EXTRACT_MARKDOWN][${requestId}] FATAL ERROR: ${err}`);
    return {
      status: "source_unavailable",
      domain: "generic",
      extractor: extractorName,
      confidence: 0,
      strategyPath: "B_fail_C_fail_A"
    };
  }
}
