import * as cheerio from "cheerio";
import type { JobExtractResult, JobOrchestratorInput } from "../types";

const MIN_QUALITY_CHARS = 250;

/**
 * Generic Tiered Extractor (Tier 1 Quality -> Tier 2 Resilience)
 * 
 * STRATEGY: 
 * Tier 1: markdown.new (High quality Markdown, JS rendering)
 * Tier 2: Local Cheerio (Resilient fallback, no limits)
 */
export async function extractGeneric(input: JobOrchestratorInput): Promise<JobExtractResult> {
  const { url, requestId = "unknown" } = input;
  
  // --- TIER 1: QUALITY FIRST (markdown.new) ---
  console.log(`[EXTRACT_GENERIC][${requestId}] TIER 1: Trying high-quality extraction (markdown.new)...`);
  try {
    const { extractViaMarkdownNew } = await import("./indeedExtractor");
    const result = await extractViaMarkdownNew(input, "generic-t1-markdown");
    
    if (result.status === "ok") {
      console.log(`[EXTRACT_GENERIC][${requestId}] TIER 1 SUCCESS!`);
      return result;
    }
  } catch (err) {
    console.error(`[EXTRACT_GENERIC][${requestId}] TIER 1 FATAL ERROR: ${err}`);
  }

  // --- TIER 2: RESILIENCE FALLBACK (Local Cheerio) ---
  console.log(`[EXTRACT_GENERIC][${requestId}] TIER 1 FAILED. Escalating to TIER 2 (Local Cheerio)...`);
  
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 ApplyBoost/1.0" } });
    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      $("script, style, nav, footer, header").remove();
      const text = $("body").text().replace(/\s+/g, " ").trim();

      if (text.length > MIN_QUALITY_CHARS) {
        console.log(`[EXTRACT_GENERIC][${requestId}] TIER 2 OK!`);
        return {
          status: "ok",
          text,
          domain: "generic",
          extractor: "generic-t2-cheerio",
          confidence: 0.8,
          strategyPath: "B_fail_C_ok"
        };
      }
    }
  } catch (err) {
    console.error(`[EXTRACT_GENERIC][${requestId}] TIER 2 FATAL ERROR: ${err}`);
  }

  console.warn(`[EXTRACT_GENERIC][${requestId}] ALL TIERS FAILED.`);
  return {
    status: "unreadable",
    domain: "generic",
    extractor: "generic-total-failure",
    confidence: 0,
    strategyPath: "B_fail_C_fail_A"
  };
}
