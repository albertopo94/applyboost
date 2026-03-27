import * as cheerio from "cheerio";
import type { JobExtractResult, JobOrchestratorInput } from "../types";

/**
 * Generic extractor (B Strategy Fallback)
 * Reuses stable logic from legacy parser but returns standardized result.
 */
export async function extractGeneric({
  url,
  requestId = "unknown",
}: JobOrchestratorInput): Promise<JobExtractResult> {
  const result: JobExtractResult = {
    status: "source_unavailable",
    domain: "generic",
    extractor: "generic-v1",
    confidence: 0,
    strategyPath: "B_fail_C_fail_A",
  };

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 3600 },
    });

    result.sourceHttpStatus = response.status;

    if (!response.ok) {
      result.status = response.status === 403 ? "blocked" : "unreadable";
      result.reason = `HTTP ${response.status} from generic source`;
      return result;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Common noise removal
    $("script, style, noscript, svg, img, nav, footer, header, .nav, .footer, .header, #header, #footer").remove();

    const bodyText = $("body").text().trim();
    const cleanText = bodyText.replace(/\s{2,}/g, " ").trim();

    if (cleanText.length < 150) {
      result.status = "unreadable";
      result.confidence = 0.1;
      result.reason = "Generic extraction returned too little text";
      return result;
    }

    // Generic success
    result.status = "ok";
    result.text = cleanText;
    result.confidence = 0.6; // Generic is usually less confident than specialist
    result.strategyPath = "B_ok";
    
    return result;

  } catch (error: any) {
    console.error(`[EXTRACTOR_GENERIC][${requestId}] Error:`, error);
    result.status = "unreadable";
    result.reason = error?.message || "Generic extraction failed";
    return result;
  }
}
