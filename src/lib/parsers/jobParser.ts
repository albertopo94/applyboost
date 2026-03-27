import * as cheerio from "cheerio";

const WALL_PATTERNS = [
  "linkedin and 3rd parties use essential and non-essential cookies",
  "use essential and non-essential cookies",
  "accept cookies",
  "cookie policy",
  "privacy policy",
  "terms of use",
  "sign in",
  "join now",
  "log in",
  "consent",
  "accept all",
  "reject all",
  "captcha",
  "enable javascript",
];

const JOB_SIGNAL_PATTERNS = [
  "job description",
  "about the role",
  "responsibilities",
  "requirements",
  "qualifications",
  "skills",
  "experience",
  "what we offer",
  "salary",
  "location",
  "full-time",
  "part-time",
  "apply",
  "main responsibilities",
  "essential requirements",
  "acerca del empleo",
  "requisitos",
  "responsabilidades",
  "descrizione del ruolo",
  "requisiti",
];

function countMatches(text: string, patterns: string[]): number {
  return patterns.reduce((count, pattern) => (text.includes(pattern) ? count + 1 : count), 0);
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function looksLikeWallOrCookieContent(url: string, cleanText: string): boolean {
  const normalized = cleanText.toLowerCase();
  const wallHits = countMatches(normalized, WALL_PATTERNS);
  const jobHits = countMatches(normalized, JOB_SIGNAL_PATTERNS);
  const hostname = getHostname(url);
  const isLinkedIn = hostname.includes("linkedin.com");

  // LinkedIn walls tend to have repeated cookie/login text with very low job semantics.
  const linkedInWallLikely = isLinkedIn && wallHits >= 2 && jobHits < 3;

  // Generic consent/login pages across sites.
  const genericWallLikely = wallHits >= 4 && jobHits <= 1 && cleanText.length < 1800;

  return linkedInWallLikely || genericWallLikely;
}

/**
 * Scrapes a job description from a public URL.
 * SDD §7.1: Uses Cheerio to extract text from <body>.
 * Falls back to manual paste if < 100 chars.
 */
export async function scrapeJobUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": "https://www.google.com/",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "cross-site",
      },
      // 10 second timeout max to prevent hanging requests
      signal: AbortSignal.timeout(10000), 
    });

    if (response.status === 403) {
      throw new Error("SCRAPER_BLOCKED");
    }

    if (!response.ok) {
      throw new Error(`JOB_URL_UNREADABLE: Sub-request failed with status ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove noise tags to get cleaner text
    $("script, style, noscript, svg, img, nav, footer, header").remove();

    const bodyText = $("body").text().trim();
    
    // Normalize enormous blocks of whitespaces
    const cleanText = bodyText.replace(/\s{2,}/g, " ").trim();

    if (cleanText.length < 100) {
      throw new Error("JOB_URL_UNREADABLE: Extracted text is too short (likely a login wall).");
    }
    if (looksLikeWallOrCookieContent(url, cleanText)) {
      throw new Error("JOB_URL_UNREADABLE: Extracted content appears to be a login/cookie wall, not a job posting.");
    }

    return cleanText;
  } catch (error) {
    if (error instanceof Error && (error.message.includes("JOB_URL_UNREADABLE") || error.message === "SCRAPER_BLOCKED")) {
      throw error;
    }
    throw new Error("JOB_URL_UNREADABLE: Failed to scrape URL due to network or timeout issues.");
  }
}

/**
 * Normalizes input text.
 * Trims and collapses multiple tabs/newlines into single lines to save LLM tokens.
 */
export function normalizeJobDescription(text: string): string {
  const clean = text.replace(/\s{2,}/g, " ").trim();
  if (clean.length < 50) {
    throw new Error("JOB_TEXT_TOO_SHORT: Job description must have at least 50 characters.");
  }
  return clean;
}
