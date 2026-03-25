import { createClient } from "@/lib/db/supabase-server";

export interface PaywallStatus {
  allowed: boolean;
  reason?: "UNAUTHENTICATED" | "NO_CREDITS" | "INTERNAL_ERROR";
}

/**
 * Checks if the user has available credits or an active subscription.
 * Assumes the user is already authenticated.
 * 
 * Logic:
 * - Allowed if subscription_active = true
 * - Allowed if exports_available > 0
 * - Otherwise denied with "NO_CREDITS"
 */
export async function checkPaywall(userId: string): Promise<PaywallStatus> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_exports")
    .select("exports_available, subscription_active")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    console.error("[PAYWALL] Error fetching user_exports for user:", userId, error);
    return { allowed: false, reason: "INTERNAL_ERROR" };
  }

  // Allowed if they have at least 1 credit OR an active subscription
  if (data.subscription_active || data.exports_available > 0) {
    return { allowed: true };
  }

  return { allowed: false, reason: "NO_CREDITS" };
}
