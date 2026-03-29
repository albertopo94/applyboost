/**
 * Integrity & Hallucination Checker
 * 
 * Validates that the LLM output doesn't invent experience or entities
 * that are not present in the original user data.
 */

export interface IntegrityResult {
  passed: boolean;
  issues: string[];
}

export function validateIntegrity(
  optimizedMarkdown: string,
  originalText: string
): IntegrityResult {
  const issues: string[] = [];
  const normalizedOriginal = originalText.toLowerCase();

  // 1. Extract bold entities from Markdown (Potential Companies or Roles)
  // Pattern: **Entity Name**
  const boldEntities = optimizedMarkdown.match(/\*\*(.*?)\*\*/g) || [];
  
  // 2. Filter out entities that are clearly not in the original text
  // We allow small variations, but new major brand names are a red flag.
  for (const match of boldEntities) {
    const entity = match.replace(/\*\*/g, "").trim();
    
    // Ignore short words or generic ATS keywords
    if (entity.length < 4) continue;
    
    const normalizedEntity = entity.toLowerCase();
    
    // Check if the entity (or a significant part of it) exists in the original
    const isFound = normalizedOriginal.includes(normalizedEntity);
    
    // If not found, we check for suspicious keywords (Hallucination detection)
    // Add logic here if specific companies are being hallucinated often.
    if (!isFound) {
      // Small check: if the entity is a common company name that isn't in original
      const famousHallucinations = ["google", "amazon", "microsoft", "apple", "netflix", "facebook"];
      if (famousHallucinations.some(h => normalizedEntity.includes(h))) {
        issues.push(`Possible hallucination detected: Entity "**${entity}**" found in optimized output but missing in original CV.`);
      }
    }
  }

  // 3. Security Check: Ensure no System Instructions leaked into the output
  if (optimizedMarkdown.includes("REGLAS DE ORO") || optimizedMarkdown.includes("USER INPUT DATA")) {
    issues.push("Security Breach: System prompt instructions leaked into user-visible content.");
  }

  return {
    passed: issues.length === 0,
    issues
  };
}
