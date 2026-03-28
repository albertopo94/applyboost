import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/auth-utils";
import { UsageService } from "@/lib/services/usageService";
import { createAdminClient } from "@/lib/db/supabase-server";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/quota
 * Fetches the current usage count for the identified user (anonymous or registered).
 */
export async function GET(req: Request) {
  try {
    const { user, userId, anonymousId } = await requireAuth({ allowAnonymous: true });

    let usageCount = 0;
    let limit = 3; // Default free limit

    if (user && userId) {
      // For registered users, we might check a different table or logic in the future.
      // For now, let's keep it simple or return 0 if they are premium.
      const adminClient = createAdminClient();
      const { data: userData } = await adminClient
        .from("users")
        .select("exports_available")
        .eq("id", userId)
        .maybeSingle();
      
      return NextResponse.json({
        is_anonymous: false,
        usage_count: 0, // Registered users currently don't use the anonymous counter
        exports_available: userData?.exports_available ?? 0
      });
    }

    if (anonymousId) {
      const adminClient = createAdminClient();
      const { data: usage } = await adminClient
        .from("anonymous_usage")
        .select("count")
        .eq("anonymous_id", anonymousId)
        .maybeSingle();
      
      usageCount = usage?.count || 0;
    }

    return NextResponse.json({
      is_anonymous: true,
      usage_count: usageCount,
      remaining_uses: Math.max(0, limit - usageCount)
    });

  } catch (error) {
    console.error("[API_QUOTA] Error fetching quota:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
