import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/dashboard", "/editor", "/settings", "/account"];
const PROTECTED_API_ROUTES = ["/api/generate", "/api/cv", "/api/export"];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next();

  try {
    const { pathname } = request.nextUrl;

    // 1. Prepare initial fallback response and headers
    const requestHeaders = new Headers(request.headers);
    supabaseResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    /**
     * Helper to ensure all cookies (session refresh, anonymous ID, etc.)
     * are carried over to any new response object (redirects, JSON errors).
     * This is critical for Next.js 15 stability.
     */
    const withCookies = (res: NextResponse) => {
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        res.cookies.set(cookie.name, cookie.value);
      });
      return res;
    };

    // 2. Anonymous identity handling
    let anonymousId = request.cookies.get("applyboost_anon_id")?.value;
    if (!anonymousId) {
      anonymousId = crypto.randomUUID();
    }
    
    // Inject into request headers for the next handler
    requestHeaders.set("x-applyboost-anon-id", anonymousId);
    
    // Re-create supabaseResponse with the updated headers
    supabaseResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Ensure the anonymous cookie is persisted in the response
    supabaseResponse.cookies.set("applyboost_anon_id", anonymousId, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });

    // 3. Initialize Supabase client
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return supabaseResponse;
    }

    // 3. Initialize Supabase client
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      console.warn("Supabase environment variables missing in middleware.");
      return supabaseResponse;
    }

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

    // 4. Get user session (refreshes if needed)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 5. Access Control Logic
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

        const { data: usage, error: usageError } = await adminClient
          .from("anonymous_usage")
          .select("count")
          .eq("anonymous_id", anonymousId)
          .single();

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
