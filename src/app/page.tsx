import { createClient, createAdminClient } from "@/lib/db/supabase-server";
import HomeClient from "@/components/HomeClient";
import { headers } from 'next/headers';

// Aseguramos que el servidor siempre traiga la data fresca
export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function Home() {
  await headers(); // Fuerza dinamismo real
  
  // Usamos el cliente admin para asegurar que el incremento siempre funcione sin RLS restrictions
  const adminClient = createAdminClient();
  
  // 1. Leemos el valor actual
  const { data: currentStats } = await adminClient
    .from('platform_stats')
    .select('*')
    .eq('id', 1)
    .single();

  const currentViews = currentStats?.page_views || 0;

  // 2. Incrementamos +1
  const { data: stats } = await adminClient
    .from('platform_stats')
    .update({ page_views: currentViews + 1 })
    .eq('id', 1)
    .select()
    .single();

  // Si por alguna razón falla el update (ej. no existe la fila), 
  // intentamos un upsert como fallback de seguridad
  if (!stats) {
    const { data: upsertedStats } = await adminClient
      .from('platform_stats')
      .upsert({ id: 1, page_views: currentViews + 1 }, { onConflict: 'id' })
      .select()
      .single();
      
    return <HomeClient initialStats={upsertedStats || currentStats} />;
  }

  return <HomeClient initialStats={stats} />;
}
