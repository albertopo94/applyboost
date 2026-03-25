/**
 * Calculates ATS match score based on deterministic exact and partial keyword matching.
 * SDD §7.2: Calculates original and optimized score. Adds 1.5x weight to critical CV zones.
 */

// Simple helper to remove accents/diacritics and make string lower case
export function normalizeScoreText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Regex for identifying "critical" sections in a parsed CV to apply the 1.5x weight.
 * We look at the first 30% of the CV (Summary) or explicitly named skills sections.
 */
function appearsInCriticalZone(keyword: string, normalizedCv: string): boolean {
  // If the keyword appears in the first 500 characters, we consider it a "summary/title" match
  const topZone = normalizedCv.slice(0, 500);
  if (topZone.includes(keyword)) return true;

  // We try to find a "skills" or "habilidades" block
  const skillsRegex = /(habilidades|skills|tecnologias|competencias)(.*?)(experiencia|educacion|proyectos|$)/is;
  const match = normalizedCv.match(skillsRegex);
  
  if (match) {
    const skillsZone = match[2];
    if (skillsZone.includes(keyword)) return true;
  }

  return false;
}

export function calculateATSScore(cvText: string, targetKeywords: string[]): number {
  if (!targetKeywords || targetKeywords.length === 0) return 0;
  if (!cvText) return 0;

  let totalScoreRaw = 0;
  const normalizedCv = normalizeScoreText(cvText);
  const maxPossibleScore = targetKeywords.length * 1.5; // If all were found in critical zones

  targetKeywords.forEach((rawKeyword) => {
    const keyword = normalizeScoreText(rawKeyword);
    
    // Check if the keyword exists at all (whole word boundary preferred, but substring fallback is ok for tech terms)
    // Using simple includes() for MVP deterministic behavior as specified in SDD
    if (normalizedCv.includes(keyword)) {
      if (appearsInCriticalZone(keyword, normalizedCv)) {
        totalScoreRaw += 1.5;
      } else {
        totalScoreRaw += 1.0;
      }
    }
  });

  // Calculate percentage
  let percentage = (totalScoreRaw / maxPossibleScore) * 100;
  
  // Cap between 0 and 100
  if (percentage > 100) percentage = 100;
  if (percentage < 0) percentage = 0;

  return Math.round(percentage); // Return whole number e.g., 85
}
