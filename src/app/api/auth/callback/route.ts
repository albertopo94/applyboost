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
  
  // Use public origin for absolute URLs if needed, but prefer relative redirects
  const publicOrigin = process.env.NEXT_PUBLIC_SITE_URL || "https://www.45.90.237.160.sslip.io";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
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
      console.log(`[AUTH_CALLBACK] Login successful for: ${data.user.id}`);
      
      const user = data.user;
      const anonymousId = cookieStore.get("applyboost_anon_id")?.value;

      // MISSION CRITICAL: Ensure user exists in public.users table before any merge
      // This fixes race conditions with the database trigger.
      const ensurePublicUser = async () => {
        try {
          await supabase.from('users').upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
          
          if (anonymousId) {
            console.log(`[AUTH_CALLBACK] Triggering data merge for ${user.id}`);
            await supabase.rpc('merge_anonymous_data', {
              anon_id: anonymousId,
              target_user_id: user.id
            });
          }
          console.log(`[AUTH_CALLBACK] Background sync completed for ${user.id}`);
        } catch (err) {
          console.error("[AUTH_CALLBACK] Background sync failed:", err);
        }
      };

      // Execute sync in background - DON'T await it to avoid browser hang
      ensurePublicUser();

      // Absolute redirect to the public domain to ensure browser follows it correctly
      const finalDestination = new URL(next, publicOrigin).toString();
      console.log(`[AUTH_CALLBACK] Immediate redirect to: ${finalDestination}`);
      return NextResponse.redirect(finalDestination);
    }
  }

  return NextResponse.redirect(`${publicOrigin}/auth/auth-code-error`);
}
