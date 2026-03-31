import { createAdminClient } from "@/lib/db/supabase-server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * Stats API: Increments page views
 * Optimized: Uses atomic RPC to prevent race conditions and improve performance.
 */
export async function POST() {
  try {
    const adminClient = createAdminClient();
    
    // ATOMIC UPDATE: Call the stored procedure in Supabase
    // This is faster and avoids read-then-write race conditions.
    const { error } = await adminClient.rpc('increment_platform_stat', { 
      stat_name: 'page_views' 
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[STATS_VISIT_ERROR]", err);
    // Silent fail for stats to not break user experience
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
