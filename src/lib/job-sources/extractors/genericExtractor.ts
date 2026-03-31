import * as cheerio from "cheerio";
import type { JobExtractResult, JobOrchestratorInput } from "../types";

const MIN_QUALITY_CHARS = 250;

/**
 * Generic Tiered Extractor (Tier 1 -> Tier 2)
 * FOR UNKNOWN DOMAINS: Try fast fetch, then fallback to markdown.new
 */
export async function extractGeneric(input: JobOrchestratorInput): Promise<JobExtractResult> {
  const { url, requestId = "unknown" } = input;
  console.log(`[EXTRACT_GENERIC][${requestId}] TIER 1: Trying fast fetch...`);

  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 ApplyBoost/1.0" } });
    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      $("script, style, nav, footer, header").remove();
      const text = $("body").text().replace(/\s+/g, " ").trim();

      if (text.length > MIN_QUALITY_CHARS) {
        console.log(`[EXTRACT_GENERIC][${requestId}] TIER 1 OK!`);
        return {
          status: "ok",
          text,
          domain: "generic",
          extractor: "generic-cheerio-v3",
          confidence: 0.8,
          strategyPath: "B_ok"
        };
      }
    }
  } catch (err) {}

  console.warn(`[EXTRACT_GENERIC][${requestId}] TIER 1 FAILED. Escalating to TIER 2...`);
  const { extractViaMarkdownNew } = await import("./indeedExtractor"); // Reuse the heavy logic
  return extractViaMarkdownNew(input, "generic-fallback-v3");
}
