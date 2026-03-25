import { createClient } from "@/lib/db/supabase-server";

export interface PaywallStatus {
  allowed: boolean;
  reason?: "UNAUTHENTICATED" | "NO_CREDITS" | "INTERNAL_ERROR";
}

/**
 * Checks if the user has available credits or an active subscription.
 * 
 * MVP NOTE: Paywall is currently DISABLED to facilitate anonymous conversion.
 * Always returns { allowed: true }.
 */
export async function checkPaywall(userId?: string): Promise<PaywallStatus> {
  // Always allowed during frictionless MVP phase
  return { allowed: true };
}
