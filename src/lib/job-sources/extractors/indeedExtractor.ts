import * as cheerio from "cheerio";
import type { JobExtractResult, JobOrchestratorInput } from "../types";

/**
 * Dedicated Indeed extractor (B Strategy)
 */
export async function extractIndeed({
  url,
  requestId = "unknown",
}: JobOrchestratorInput): Promise<JobExtractResult> {
  const result: JobExtractResult = {
    status: "source_unavailable",
    domain: "indeed",
    extractor: "indeed-v1",
    confidence: 0,
    strategyPath: "B_fail_C_fail_A",
  };

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; SM-G960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.181 Mobile Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
      },
      next: { revalidate: 3600 },
    });

    result.sourceHttpStatus = response.status;

    if (!response.ok) {
      result.status = response.status === 403 ? "blocked" : "unreadable";
      result.reason = `HTTP ${response.status} from Indeed`;
      return result;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Indeed-specific noise removal
    $("script, style, noscript, svg, img, nav, footer, header").remove();

    // Indeed Description Selectors (Priority Order)
    const descriptionSelectors = [
      "#jobDescriptionText",
      ".jobsearch-jobDescriptionText",
      ".vjs-content",
      "body" // Fallback
    ];

    let cleanText = "";
    for (const selector of descriptionSelectors) {
      const el = $(selector);
      if (el.length > 0) {
        cleanText = el.text().trim().replace(/\s{2,}/g, " ");
        if (cleanText.length > 200) break; // Found a good one
      }
    }

    if (cleanText.length < 200) {
      result.status = "unreadable";
      result.confidence = 0.1;
      result.reason = "Indeed extraction returned too little text or dominated by noise";
      return result;
    }

    // Success signals
    const hasJobSignals = cleanText.toLowerCase().includes("job") || cleanText.toLowerCase().includes("apply") || cleanText.toLowerCase().includes("description");

    result.status = "ok";
    result.text = cleanText;
    result.confidence = hasJobSignals ? 0.9 : 0.6;
    result.strategyPath = "B_ok";
    
    return result;

  } catch (error: any) {
    console.error(`[EXTRACTOR_INDEED][${requestId}] Error:`, error);
    result.status = "unreadable";
    result.reason = error?.message || "Indeed extraction failed";
    return result;
  }
}
