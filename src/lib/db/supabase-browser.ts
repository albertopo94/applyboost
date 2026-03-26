import { createBrowserClient } from "@supabase/ssr";

let client: any = null;

/**
 * Supabase client for browser / React components.
 * Uses the ANON key — all queries go through RLS.
 * 
 * Includes a safety check for 'window' to prevent errors during 
 * Next.js pre-rendering or build time.
 */
export function createClient() {
  // Return null if we're not in the browser
  if (typeof window === "undefined") {
    return null;
  }

  // Use singleton pattern
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn("Supabase browser client: environment variables are missing.");
    return null;
  }

  try {
    client = createBrowserClient(url, anonKey);
    return client;
  } catch (error) {
    console.error("Supabase browser client: failed to initialize", error);
    return null;
  }
}
