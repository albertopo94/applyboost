import { createClient } from "@/lib/db/supabase-server";
import { type User } from "@supabase/supabase-js";

/**
 * Ensures the user is authenticated.
 * Returns the User object or throws a 401 error.
 * 
 * Usage in API Routes:
 * try {
 *   const user = await requireAuth();
 *   // ...
 * } catch (error) {
 *   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 * }
 */
export async function requireAuth(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return user;
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
