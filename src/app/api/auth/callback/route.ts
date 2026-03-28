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

      // Sync user to public table and merge anonymous data
      const ensurePublicUserAndMerge = async () => {
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

      ensurePublicUserAndMerge();

      const finalDestination = new URL(next, publicOrigin).toString();
      console.log(`[AUTH_CALLBACK] Sending JS redirect to: ${finalDestination}`);

      // SUCCESS FIX (Lot AE): Return a small HTML page that performs the redirect via JS.
      // This solves the hang issue in some browsers when redirecting from Google/Supabase.
      return new NextResponse(
        `<html>
          <head>
            <title>Redirecting...</title>
            <script>window.location.href = "${finalDestination}";</script>
          </head>
          <body style="background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
            <div style="text-align: center;">
              <div style="width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid #2563eb; border-radius: 50%; animate: spin 1s linear infinite; margin: 0 auto 20px;"></div>
              <p>Conectando con ApplyBoost...</p>
            </div>
            <style>
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }
  }

  return NextResponse.redirect(`${publicOrigin}/auth/auth-code-error`);
}
