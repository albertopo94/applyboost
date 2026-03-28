import { createClient } from "@/lib/db/supabase-server";
import { type User } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";

/**
 * Resolves the current identity from both user session and anonymous cookies.
 */
export async function getIdentity(anonymousIdOverride?: string): Promise<{ user: User | null; userId?: string; anonymousId: string }> {
  const headerStore = await headers();
  const userIdFromHeader = headerStore.get("x-user-id");
  const userEmailFromHeader = headerStore.get("x-user-email");
  
  // 1. Try to resolve from headers first (injected by middleware)
  if (userIdFromHeader) {
    const cookieStore = await cookies();
    const anonymousIdFromCookie = cookieStore.get("applyboost_anon_id")?.value || "";
    const anonymousIdFromHeader = headerStore.get("x-applyboost-anon-id") || "";
    const anonymousId = anonymousIdOverride || anonymousIdFromHeader || anonymousIdFromCookie;

    return {
      user: { id: userIdFromHeader, email: userEmailFromHeader } as User,
      userId: userIdFromHeader,
      anonymousId,
    };
  }

  // 2. Fallback to direct Supabase call if headers are missing
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const anonymousIdFromCookie = cookieStore.get("applyboost_anon_id")?.value || "";
  const anonymousIdFromHeader = headerStore.get("x-applyboost-anon-id") || "";
  
  const anonymousId = anonymousIdOverride || anonymousIdFromHeader || anonymousIdFromCookie;

  return {
    user,
    userId: user?.id,
    anonymousId,
  };
}

/**
 * Ensures the user is authenticated.
 * Returns the identity object if allowAnonymous is true, or the User object if false.
 * Throws a 401 error if neither is true.
 */
export async function requireAuth(options?: { allowAnonymous?: false }): Promise<User>;
export async function requireAuth(options: { allowAnonymous: true; anonymousId?: string }): Promise<{ user: User | null; userId?: string; anonymousId: string }>;
export async function requireAuth(options: { allowAnonymous?: boolean; anonymousId?: string } = {}): Promise<any> {
  const allowAnonymous = options.allowAnonymous ?? false;
  const identity = await getIdentity(options.anonymousId);
  const { user, anonymousId } = identity;

  if (!user && (!allowAnonymous || !anonymousId)) {
    throw new Error("Unauthorized");
  }

  return allowAnonymous ? identity : user;
}

/**
 * Ensures the authenticated user owns the generation resource.
 * Returns true or throws a 403 error.
 */
export async function requireOwnership(generationId: string): Promise<boolean> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("generations")
    .select("user_id")
    .eq("id", generationId)
    .single();

  if (error || !data) {
    throw new Error("Forbidden: Resource not found");
  }

  if (data.user_id !== user.id) {
    throw new Error("Forbidden: Ownership verification failed");
  }

  return true;
}
