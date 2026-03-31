import type { JobSourceDomain } from "./types";

const LINKEDIN_HOSTS = ["linkedin.com", "www.linkedin.com"];
const INDEED_HOSTS = ["indeed.com", "www.indeed.com", "it.indeed.com"];
const INFOJOBS_HOSTS = ["infojobs.net", "www.infojobs.net", "infojobs.it", "www.infojobs.it"];
const TECNOEMPLEO_HOSTS = ["tecnoempleo.com", "www.tecnoempleo.com"];

/**
 * Classifies a URL hostname into a known JobSourceDomain.
 * Necessary for our Fail-Fast routing logic.
 */
export function classifyJobSourceDomain(url: string): JobSourceDomain {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    if (LINKEDIN_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`))) return "linkedin";
    if (INDEED_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`))) return "indeed";
    if (INFOJOBS_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`))) return "infojobs";
    if (TECNOEMPLEO_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`))) return "tecnoempleo";

    return "generic";
  } catch {
    return "unknown";
  }
}
