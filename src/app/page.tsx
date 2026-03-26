import { createClient } from "@/lib/db/supabase-server";
import HomeClient from "@/components/HomeClient";
import { headers } from 'next/headers';

// Aseguramos que el servidor siempre traiga la data fresca
export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function Home() {
  await headers(); // Fuerza dinamismo real
  const supabase = await createClient();
  
  const { data: stats, error } = await supabase.from('platform_stats').select('*').single();
  console.log('[Server] Stats from DB:', stats);
  if (error) console.error('[Server] DB Error:', error);

  // Aseguramos que la fila de stats existe y tiene al menos 1 view
  // Esto salta el error de RPC missing si no se corrieron migraciones
  await supabase.from('platform_stats').upsert({ id: 1, page_views: 1 }, { onConflict: 'id' });

  return <HomeClient initialStats={stats} />;
}
