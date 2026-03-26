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

  // Intento de incremento desde el servidor para validar permisos de service_role
  if (stats && stats.page_views === 0) {
    console.log('[Server] page_views is 0, forcing increment from server...');
    await supabase.rpc('increment_platform_stat', { stat_name: 'page_views' });
  }

  return <HomeClient initialStats={stats} />;
}
