import * as cheerio from "cheerio";
import type { JobExtractResult, JobOrchestratorInput } from "../types";

/**
 * Dedicated InfoJobs extractor (B Strategy)
 */
export async function extractInfoJobs({
  url,
  requestId = "unknown",
}: JobOrchestratorInput): Promise<JobExtractResult> {
  const result: JobExtractResult = {
    status: "source_unavailable",
    domain: "infojobs",
    extractor: "infojobs-v1",
    confidence: 0,
    strategyPath: "B_fail_C_fail_A",
  };

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      },
      next: { revalidate: 3600 },
    });

    result.sourceHttpStatus = response.status;

    if (!response.ok) {
      result.status = response.status === 403 ? "blocked" : "unreadable";
      result.reason = `HTTP ${response.status} from InfoJobs`;
      return result;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 1. Check for InfoJobs "Watson" / Browser Check wall
    const bodyText = $("body").text().trim();
    const normalizedBody = bodyText.toLowerCase();
    
    if (normalizedBody.includes("querido watson") || normalizedBody.includes("javascript esté habilitado")) {
      result.status = "blocked";
      result.confidence = 0.05;
      result.reason = "InfoJobs browser check / JS wall detected (Watson)";
      return result;
    }

    // 2. InfoJobs-specific noise removal
    $("script, style, noscript, svg, img, nav, footer, header").remove();

    // 3. InfoJobs Description Selectors
    const descriptionSelectors = [
      "#description",
      ".offer-description",
      "[itemprop='description']",
      "main" // Fallback
    ];

    let cleanText = "";
    for (const selector of descriptionSelectors) {
      const el = $(selector);
      if (el.length > 0) {
        cleanText = el.text().trim().replace(/\s{2,}/g, " ");
        if (cleanText.length > 200) break;
      }
    }

    if (cleanText.length < 200) {
      result.status = "unreadable";
      result.confidence = 0.1;
      result.reason = "InfoJobs extraction returned too little text";
      return result;
    }

    // 4. Success signals
    const hasInfoJobsSignals = normalizedBody.includes("inscrito") || normalizedBody.includes("vacantes") || normalizedBody.includes("salario");

    result.status = "ok";
    result.text = cleanText;
    result.confidence = hasInfoJobsSignals ? 0.95 : 0.7;
    result.strategyPath = "B_ok";
    
    return result;

  } catch (error: any) {
    console.error(`[EXTRACTOR_INFOJOBS][${requestId}] Error:`, error);
    result.status = "unreadable";
    result.reason = error?.message || "InfoJobs extraction failed";
    return result;
  }
}
