import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for Server Components / Route Handlers.
 * Reads the JWT from httpOnly cookies managed by @supabase/ssr.
 * Uses the ANON key — RLS is enforced at the DB level.
 * 
 * Includes a try-catch for cookies() to handle build-time environments.
 */
export async function createClient() {
  try {
    const cookieStore = await cookies();

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(
            cookiesToSet: {
              name: string;
              value: string;
              options: CookieOptions;
            }[],
          ) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            } catch {
              // Server Component — can't set cookies.
              // Middleware refresh handles this case.
            }
          },
        },
      },
    );
  } catch (error) {
    // If we're during build (static generation) cookies() might throw.
    // Return null to avoid hanging Next.js build.
    return null as any;
  }
}

/**
 * Admin client using SERVICE_ROLE_KEY — bypasses RLS.
 * ONLY for trusted server operations (e.g., delete cascade, webhook handlers).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null as any;
  }

  return createServerClient(
    url,
    serviceKey,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    },
  );
}
