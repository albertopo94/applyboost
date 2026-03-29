import fs from "fs";
import path from "path";

/**
 * Prompt Loader Utility
 * 
 * Separates LLM instructions (Prompts) from application logic (TS).
 * This optimizes build RAM usage by preventing Webpack from serializing large strings.
 * 
 * Placeholders should follow the {{variableName}} format.
 */
export function loadPrompt(filename: string, variables: Record<string, string | number | undefined | null> = {}): string {
  // 1. Resolve path relative to the project root (critical for standalone mode)
  const filePath = path.join(process.cwd(), "src/lib/prompts", filename);

  if (!fs.existsSync(filePath)) {
    console.error(`[PROMPT_LOADER] Error: File not found at ${filePath}`);
    console.log(`[PROMPT_LOADER] Current working directory: ${process.cwd()}`);
    throw new Error(`Prompt file not found: ${filePath}`);
  }

  // 2. Read template
  let template = fs.readFileSync(filePath, "utf-8");

  // 3. Simple interpolation: replace {{key}} with value
  for (const [key, value] of Object.entries(variables)) {
    const safeValue = value !== undefined && value !== null ? String(value) : "";
    // Use a global regex to replace all occurrences
    const regex = new RegExp(`{{${key}}}`, "g");
    template = template.replace(regex, safeValue);
  }

  return template;
}
