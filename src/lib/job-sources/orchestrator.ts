import { scrapeJobUrl } from "@/lib/parsers/jobParser";
import { classifyJobSourceDomain } from "@/lib/job-sources/domainClassifier";
import type { JobExtractResult, JobOrchestratorInput } from "@/lib/job-sources/types";

/**
 * Lote A skeleton:
 * - Mantiene extracción legacy internamente.
 * - Expone contrato unificado para activar B->C->A en lotes siguientes.
 */
export async function extractJobDescriptionOrchestrated(input: JobOrchestratorInput): Promise<JobExtractResult> {
  const domain = classifyJobSourceDomain(input.url);

  try {
    const text = await scrapeJobUrl(input.url);
    return {
      status: "ok",
      text,
      domain,
      extractor: "legacy-skeleton",
      confidence: 0.5,
      strategyPath: "legacy",
    };
  } catch (error: any) {
    if (error?.message === "SCRAPER_BLOCKED") {
      return {
        status: "blocked",
        domain,
        extractor: "legacy-skeleton",
        confidence: 0,
        reason: error.message,
        strategyPath: "legacy",
      };
    }

    if (typeof error?.message === "string" && error.message.startsWith("JOB_URL_UNREADABLE")) {
      return {
        status: "unreadable",
        domain,
        extractor: "legacy-skeleton",
        confidence: 0,
        reason: error.message,
        strategyPath: "legacy",
      };
    }

    return {
      status: "source_unavailable",
      domain,
      extractor: "legacy-skeleton",
      confidence: 0,
      reason: error?.message || "Unknown extraction failure",
      strategyPath: "legacy",
    };
  }
}
