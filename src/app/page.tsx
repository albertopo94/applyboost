import { createClient } from "@/lib/db/supabase-server";
import HomeClient from "@/components/HomeClient";
import { headers } from 'next/headers';

// Aseguramos que el servidor siempre traiga la data fresca
export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function Home() {
  await headers(); // Fuerza dinamismo real
  const supabase = await createClient();
  
  let initialStats = null;
  
  if (supabase) {
    try {
      const { data } = await supabase
        .from("platform_stats")
        .select("page_views, cvs_generated, cvs_downloaded")
        .eq("id", 1)
        .single();
      
      initialStats = data;
    } catch (error) {
      console.error("Error fetching initial stats:", error);
    }
  }

  return <HomeClient initialStats={initialStats} />;
}
