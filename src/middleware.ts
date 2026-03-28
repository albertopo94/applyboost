import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/dashboard", "/editor", "/settings", "/account"];
const PROTECTED_API_ROUTES = ["/api/generate", "/api/cv", "/api/export"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = crypto.randomUUID().slice(0, 8);
  
  if (pathname === "/api/generate") {
    console.log(`[MIDDLEWARE][${requestId}] Start processing /api/generate`);
  }

  // Skip heavy logic during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next();

  try {
    // 0. Skip middleware for auth callback
    if (pathname === "/api/auth/callback") {
      return NextResponse.next();
    }

    if (pathname === "/api/generate") console.log(`[MIDDLEWARE][${requestId}] Checking session...`);

    // ... (resto del código igual hasta la llamada a getUser) ...
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      },
    );

    // 4. Get user session (refreshes if needed) with 4s timeout
    const authPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise<any>((_, reject) =>
      setTimeout(() => reject(new Error("DB_AUTH_TIMEOUT")), 4000)
    );

    if (pathname === "/api/generate") console.log(`[MIDDLEWARE][${requestId}] Requesting session from Supabase (4s timeout)...`);

    const { data: { user } } = await Promise.race([
      authPromise,
      timeoutPromise
    ]);

    if (pathname === "/api/generate") {
      console.log(`[MIDDLEWARE][${requestId}] Session resolved. User: ${user ? user.id : 'anonymous'}`);
    }

    // INJECT: Pass user info to request headers for the next handler
    if (user) {
      requestHeaders.set("x-user-id", user.id);
      if (user.email) requestHeaders.set("x-user-email", user.email);
    }

    // Re-create supabaseResponse with the updated headers
    supabaseResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
      pathname.startsWith(route)
    );
    const isProtectedApiRoute = PROTECTED_API_ROUTES.some((route) =>
      pathname.startsWith(route)
    );

    // Special logic for /api/generate and /api/export (allow anonymous)
    if ((pathname === "/api/generate" || pathname.startsWith("/api/export")) && !user) {
      // For generate, check limits. For export, we allow it (handled downstream)
      if (pathname === "/api/generate") {
        // Handle missing service role key gracefully
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
          return supabaseResponse;
        }

        const adminClient = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          {
            cookies: {
              getAll() { return []; },
              setAll() {},
            },
          }
        );

        // Use a 2-second timeout for the database query
        const timeoutPromise = new Promise<{ data: any, error: any }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: { message: "TIMEOUT" } }), 2000)
        );

        const { data: usage, error: usageError } = await Promise.race([
          adminClient
            .from("anonymous_usage")
            .select("count")
            .eq("anonymous_id", anonymousId)
            .single(),
          timeoutPromise
        ]);

        if (!usageError && usage && usage.count >= 3) {
          return withCookies(
            NextResponse.json(
              { error: "LIMIT_REACHED" },
              { status: 401 }
            )
          );
        }
      }

      return supabaseResponse;
    }

    if (!user) {
      // Redirect UI routes to login
      if (isProtectedRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("next", pathname);
        return withCookies(NextResponse.redirect(url));
      }

      // Return 401 for other protected API routes
      if (isProtectedApiRoute) {
        return withCookies(
          NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
          )
        );
      }
    }

    return supabaseResponse;
  } catch (error) {
    console.error("Critical middleware error:", error);
    // Fallback to the base response to avoid 500
    return supabaseResponse;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
