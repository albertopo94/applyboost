import { createAdminClient } from "@/lib/db/supabase-server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * Stats API: Increments page views
 * Optimized: Uses atomic RPC with fallback logic for schema ambiguity.
 */
export async function POST() {
  try {
    const adminClient = createAdminClient();
    
    // Attempt 1: Named parameter based on official migration
    const { error } = await adminClient.rpc('increment_platform_stat', { 
      stat_name: 'page_views' 
    });

    if (error) {
      console.warn("[STATS_VISIT_RETRY] Failed with stat_name, trying generic fallback...");
      // Attempt 2: Generic name property if PostgREST cache is messy
      const { error: error2 } = await adminClient.rpc('increment_platform_stat', { 
        name: 'page_views' 
      });
      if (error2) throw error2;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[STATS_VISIT_ERROR]", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
