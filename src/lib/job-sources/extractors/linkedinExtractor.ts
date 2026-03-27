import * as cheerio from "cheerio";
import type { JobExtractResult, JobOrchestratorInput } from "../types";

/**
 * Dedicated LinkedIn extractor (B Strategy)
 */
export async function extractLinkedIn({
  url,
  requestId = "unknown",
}: JobOrchestratorInput): Promise<JobExtractResult> {
  const result: JobExtractResult = {
    status: "source_unavailable",
    domain: "linkedin",
    extractor: "linkedin-v1",
    confidence: 0,
    strategyPath: "B_fail_C_fail_A", // Default until we get something
  };

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
      },
      next: { revalidate: 3600 },
    });

    result.sourceHttpStatus = response.status;

    if (!response.ok) {
      result.status = response.status === 403 ? "blocked" : "unreadable";
      result.reason = `HTTP ${response.status} from source`;
      return result;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove noise
    $("script, style, noscript, svg, img, nav, footer, header").remove();

    const bodyText = $("body").text().trim();
    const cleanText = bodyText.replace(/\s{2,}/g, " ").trim();
    const normalizedText = cleanText.toLowerCase();

    // Check for LinkedIn Cookie/Login Wall
    const hasWallSymptom = normalizedText.includes("linkedin and 3rd parties use essential and non-essential cookies");
    const hasJobSignals = normalizedText.includes("about the job") || normalizedText.includes("acerca del empleo");

    if (hasWallSymptom && !hasJobSignals) {
      result.status = "blocked";
      result.confidence = 0.1;
      result.reason = "LinkedIn cookie/login wall detected (No job signals)";
      return result;
    }

    if (cleanText.length < 200) {
      result.status = "unreadable";
      result.confidence = 0.2;
      result.reason = "Text too short to be a job posting";
      return result;
    }

    // Success!
    result.status = "ok";
    result.text = cleanText;
    result.confidence = hasJobSignals ? 0.95 : 0.7;
    result.strategyPath = "B_ok";
    
    return result;

  } catch (error: any) {
    console.error(`[EXTRACTOR_LINKEDIN][${requestId}] Error:`, error);
    result.status = "unreadable";
    result.reason = error?.message || "Extraction failed";
    return result;
  }
}
