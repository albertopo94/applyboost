import { createAdminClient } from "@/lib/db/supabase-server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * Stats API: Increments page views
 * Optimized: Direct table update to avoid RPC schema cache issues (PGRST202).
 */
export async function POST() {
  try {
    const adminClient = createAdminClient();
    
    // 1. Get current value
    const { data: current } = await adminClient
      .from('platform_stats')
      .select('page_views')
      .eq('id', 1)
      .maybeSingle();

    const currentViews = current?.page_views || 0;

    // 2. Atomic-like update
    const { error } = await adminClient
      .from('platform_stats')
      .update({ page_views: currentViews + 1 })
      .eq('id', 1);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[STATS_VISIT_ERROR]", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
