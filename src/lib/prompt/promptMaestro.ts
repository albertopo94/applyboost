import { loadPrompt } from "./loader";

/**
 * Build the master prompt for the LLM orchestration.
 * SDD §7.2: Injects rules, languages, and raw inputs.
 * Optimization: Prompts-as-Data (v2).
 */
export interface MasterPromptOptions {
  cvText: string;
  jobDescription: string;
  coverReference?: string;
  userPreferences?: string;
  outputLanguage: "es" | "en" | "it" | "auto";
}

export function buildMasterPrompt(options: MasterPromptOptions): string {
  const {
    cvText,
    jobDescription,
    coverReference,
    userPreferences,
    outputLanguage,
  } = options;

  const targetLanguage = outputLanguage === "auto" 
    ? "el idioma de la oferta laboral (JOB_DESCRIPTION)" 
    : outputLanguage;

  // Prepare extra sections for the prompt
  let extraSections = "";
  if (coverReference) {
    extraSections += `\n<COVER_REFERENCE_OLD>\n${coverReference}\n</COVER_REFERENCE_OLD>\n`;
  }
  if (userPreferences) {
    extraSections += `\n<USER_PREFERENCES>\n${userPreferences}\n</USER_PREFERENCES>\n`;
  }

  // Load and interpolate the prompt
  return loadPrompt("master_cv.md", {
    targetLanguage,
    cvText,
    jobDescription,
    extraSections
  });
}
