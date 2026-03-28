export const dynamic = "force-dynamic";
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Supabase Auth Callback — Lot AH (Ultra-Fast & Robust Edition)
 * Optimized for Traefik/Bun/Next.js 15 stability.
 * Ensures cookies (session + guest identity) are correctly injected into the redirect response.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const publicOrigin = process.env.NEXT_PUBLIC_SITE_URL || "https://www.45.90.237.160.sslip.io";

  if (!code) {
    return NextResponse.redirect(`${publicOrigin}/auth/auth-code-error`);
  }

  const cookieStore = await cookies();
  
  // 1. Prepare the redirect response object first
  // Using a 307 (Temporary Redirect) ensures the browser and Traefik handle the handover immediately.
  const finalDestination = new URL(next, publicOrigin).toString();
  const response = NextResponse.redirect(finalDestination);

  // 2. Initialize Supabase client, syncing cookies directly with the RESPONSE object
  // In Next.js 15, headers/cookies set via cookieStore after creating a NextResponse 
  // are NOT automatically merged. We must set them on the response object manually.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 3. Exchange the code for session (this triggers setAll behind the scenes)
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  
  if (error) {
    console.error("[AUTH_CALLBACK] Exchange error:", error.message);
    return NextResponse.redirect(`${publicOrigin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`);
  }

  // 4. PRESERVE GUEST IDENTITY (Crucial for Anonymous-to-User flow)
  // We ensure the 'applyboost_anon_id' cookie is carried over to the final response
  // so the AuthSync component can perform the data merge on the client side.
  const anonId = cookieStore.get("applyboost_anon_id")?.value;
  if (anonId) {
    response.cookies.set("applyboost_anon_id", anonId, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });
  }

  console.log(`[AUTH_CALLBACK] Redirecting to: ${finalDestination}`);
  
  // This response now contains:
  // - HTTP 307 Status (clean redirect)
  // - Supabase session cookies (sb-*)
  // - Guest identity cookie (applyboost_anon_id)
  return response;
}
