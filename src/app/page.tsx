import { createAdminClient } from "@/lib/db/supabase-server";
import HomeClient from "@/components/HomeClient";

// Aseguramos que el servidor siempre traiga la data fresca
export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Usamos el cliente admin para asegurar que la lectura siempre funcione
  const adminClient = createAdminClient();
  
  // Leemos el valor actual con fallback para que no bloquee el build
  let stats = { cvs_generated: 0, page_views: 0 };
  
  try {
    if (adminClient) {
      // Usamos un timeout corto (2s) para evitar que cuelgue el build o la carga
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Stats timeout')), 2000)
      );
      
      const fetchPromise = adminClient
        .from('platform_stats')
        .select('*')
        .eq('id', 1)
        .single();

      const { data } = await Promise.race([fetchPromise, timeout]) as any;
      
      if (data) {
        stats = data;
      }
    }
  } catch (error) {
    console.warn("Could not fetch platform stats (using fallback):", error);
  }

  return <HomeClient initialStats={stats} />;
}
