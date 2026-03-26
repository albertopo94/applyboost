import { createAdminClient } from "@/lib/db/supabase-server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const adminClient = createAdminClient();
    
    // Leemos el valor actual
    const { data: currentStats } = await adminClient
      .from('platform_stats')
      .select('page_views')
      .eq('id', 1)
      .single();

    const currentViews = currentStats?.page_views || 0;

    // Incrementamos +1
    const { error } = await adminClient
      .from('platform_stats')
      .update({ page_views: currentViews + 1 })
      .eq('id', 1);

    if (error) {
      // Si falla el update, intentamos upsert
      await adminClient
        .from('platform_stats')
        .upsert({ id: 1, page_views: currentViews + 1 }, { onConflict: 'id' });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error updating stats:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
