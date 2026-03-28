export const dynamic = "force-dynamic";
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Supabase Auth Callback — SDD §8.3
 * Handles OAuth exchange and Anonymous-to-User data merge.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  
  // Use public origin to avoid Docker internal ID redirection issues
  const publicOrigin = process.env.NEXT_PUBLIC_SITE_URL || "https://www.45.90.237.160.sslip.io";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    console.log(`[AUTH_CALLBACK] Exchanging code for session...`);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("[AUTH_CALLBACK] Exchange error:", error);
      return NextResponse.redirect(`${publicOrigin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`);
    }

    if (data.user) {
      console.log(`[AUTH_CALLBACK] Login successful for user: ${data.user.id}`);
      // SUCCESSFUL LOGIN — Now trigger the data merge
      const anonymousId = cookieStore.get("applyboost_anon_id")?.value;
      
      if (anonymousId) {
        console.log(`[AUTH_CALLBACK] Attempting merge: anon_id ${anonymousId} -> user_id ${data.user.id}`);
        
        const { error: mergeError } = await supabase.rpc('merge_anonymous_data', {
          anon_id: anonymousId,
          target_user_id: data.user.id
        });

        if (mergeError) {
          console.error("[AUTH_CALLBACK] Merge error (non-blocking):", mergeError);
        } else {
          console.log("[AUTH_CALLBACK] Merge successful");
        }
      }

      console.log(`[AUTH_CALLBACK] Redirecting to ${publicOrigin}${next}`);
      return NextResponse.redirect(`${publicOrigin}${next}`);
    }
  }

  console.warn("[AUTH_CALLBACK] No code found in URL or user not found");
  // return the user to an error page with instructions
  return NextResponse.redirect(`${publicOrigin}/auth/auth-code-error`);
}
