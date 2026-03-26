import { createClient, createAdminClient } from "@/lib/db/supabase-server";
import HomeClient from "@/components/HomeClient";
import { headers } from 'next/headers';

// Aseguramos que el servidor siempre traiga la data fresca
export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function Home() {
  await headers(); // Fuerza dinamismo real
  
  // Usamos el cliente admin para asegurar que la lectura siempre funcione
  const adminClient = createAdminClient();
  
  // Leemos el valor actual con fallback para que no bloquee el build
  let stats = { cvs_generated: 0, page_views: 0 };
  
  try {
    const { data } = await adminClient
      .from('platform_stats')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (data) {
      stats = data;
    }
  } catch (error) {
    console.error("Error fetching platform stats:", error);
  }

  return <HomeClient initialStats={stats} />;
}
