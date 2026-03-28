export const dynamic = "force-dynamic";
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Supabase Auth Callback — Lot AH (Ultra-Fast Edition)
 * Minimal processing to avoid hangs during build/load spikes.
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

    // 1. Just exchange the code for session. Super fast.
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("[AUTH_CALLBACK] Exchange error:", error.message);
      return NextResponse.redirect(`${publicOrigin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`);
    }

    // 2. Redirect IMMEDIATELY. 
    // We remove all DB logic (upsert/merge) from here to prevent hangs.
    // The AuthSync component in the frontend already handles user data sync.
    const finalDestination = new URL(next, publicOrigin).toString();
    console.log(`[AUTH_CALLBACK] Fast-redirecting to: ${finalDestination}`);

    return new NextResponse(
      `<html><head><script>window.location.href = "${finalDestination}";</script></head><body style="background:#0f172a"></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  return NextResponse.redirect(`${publicOrigin}/auth/auth-code-error`);
}
