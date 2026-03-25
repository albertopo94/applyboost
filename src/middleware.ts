import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/dashboard", "/editor", "/settings", "/account"];
const PROTECTED_API_ROUTES = ["/api/generate", "/api/cv", "/api/export"];
const PUBLIC_ROUTES = ["/", "/login", "/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Prepare request headers & check anonymous identity
  const requestHeaders = new Headers(request.headers);
  let anonymousId = request.cookies.get("applyboost_anon_id")?.value;
  if (!anonymousId) {
    anonymousId = crypto.randomUUID();
    // No set header here yet, we'll do it later in response
  }
  // Inject into request headers for the next handler
  requestHeaders.set("x-applyboost-anon-id", anonymousId);

  // 2. Prepare initial response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Ensure the anonymous cookie is persisted in the response if newly generated
  if (!request.cookies.get("applyboost_anon_id")) {
    supabaseResponse.cookies.set("applyboost_anon_id", anonymousId, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });
  }

  /**
   * Helper to ensure all cookies (session refresh, anonymous ID, etc.)
   * are carried over to any new response object (redirects, JSON errors).
   * This is critical for Next.js 15 stability.
   */
  const withCookies = (res: NextResponse) => {
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
      res.cookies.set(name, value, options);
    });
    return res;
  };
  // 3. Initialize Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  try {
    // 4. Get user session
    // This will refresh the session if it's expired or missing
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

    // Special logic for /api/generate (allow anonymous within limits)
    if (pathname === "/api/generate" && !user) {
      try {
        // Handle missing key gracefully
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
          console.warn("SUPABASE_SERVICE_ROLE_KEY is missing. Bypassing usage check.");
          return supabaseResponse;
        }

        const adminClient = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
              { status: 403 }
            )
          );
        }

        return supabaseResponse;
      } catch (adminError) {
        console.error("Middleware adminClient crash:", adminError);
        // On error, we prefer continuing (graceful degradation)
        return supabaseResponse;
      }
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
    // If everything fails, return the base response to avoid 500
    return supabaseResponse;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - Public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
