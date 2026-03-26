export const dynamic = "force-dynamic";
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Supabase Auth Callback — SDD §8.3
 * Handles OAuth exchange and Anonymous-to-User data merge.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect address
  const next = searchParams.get("next") ?? "/editor";

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

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // SUCCESSFUL LOGIN — Now trigger the data merge
      const anonymousId = cookieStore.get("applyboost_anon_id")?.value;
      
      if (anonymousId) {
        console.log(`[AUTH_CALLBACK] Merging data for anon_id: ${anonymousId} -> user_id: ${data.user.id}`);
        
        // Use the admin client (service role) to bypass RLS for merging if necessary,
        // or just the current user if the RLS policy allows it.
        // Given the migration schema, the service_role is safer for the merge RPC.
        const { error: mergeError } = await supabase.rpc('merge_anonymous_data', {
          anon_id: anonymousId,
          target_user_id: data.user.id
        });

        if (mergeError) {
          console.error("[AUTH_CALLBACK] Merge error:", mergeError);
        } else {
          // Cleanup anonymous tracking cookie (optional but cleaner)
          // We can keep it if we want to track the session history, but the DB record is gone.
          // supabaseResponse.cookies.delete("applyboost_anon_id"); // Middleware/NextResponse needed for this
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
