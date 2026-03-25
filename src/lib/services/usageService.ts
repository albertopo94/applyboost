import { createAdminClient } from "@/lib/db/supabase-server";

/**
 * Service to manage anonymous usage and identity tracking.
 * Encapsulates operations that require administrative privileges (service role).
 */
export class UsageService {
  /**
   * Tracks and increments usage for an anonymous session.
   * Returns the updated count.
   */
  static async trackAnonymousUsage(anonymousId: string): Promise<number> {
    const adminClient = createAdminClient();
    
    const { data: usage } = await adminClient
      .from("anonymous_usage")
      .select("count")
      .eq("anonymous_id", anonymousId)
      .maybeSingle();
    
    const newCount = (usage?.count || 0) + 1;
    
    const { error } = await adminClient
      .from("anonymous_usage")
      .upsert({ 
        anonymous_id: anonymousId, 
        count: newCount, 
        last_used_at: new Date().toISOString() 
      }, { onConflict: 'anonymous_id' });

    if (error) {
      console.error("[UsageService] Error updating anonymous usage:", error);
      // We don't throw here to avoid blocking the user if just tracking fails
    }

    return newCount;
  }

  /**
   * Checks if an anonymous user has exceeded their free limit.
   */
  static async hasExceededLimit(anonymousId: string, limit: number = 3): Promise<boolean> {
    const adminClient = createAdminClient();
    const { data: usage } = await adminClient
      .from("anonymous_usage")
      .select("count")
      .eq("anonymous_id", anonymousId)
      .maybeSingle();
    
    return (usage?.count || 0) >= limit;
  }
}
