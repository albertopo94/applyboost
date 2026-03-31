import { createAdminClient } from "@/lib/db/supabase-server";
import { requireAuth } from "@/lib/auth/auth-utils";
import HomeClient from "@/components/HomeClient";

// Aseguramos que el servidor siempre traiga la data fresca
export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Blindaje total para el build de Dokploy
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return <HomeClient 
      initialStats={{ cvs_generated: 0, page_views: 0, cvs_downloaded: 0 }} 
      initialAuthStatus={true} 
      initialQuotaUsage={0} 
      remainingUses={3} 
    />;
  }

  const adminClient = createAdminClient();
  
  // 1. Promesa de Estadísticas (Resiliente y con mayor timeout)
  const statsPromise = (async () => {
    try {
      if (!adminClient) return { cvs_generated: 0, page_views: 0, cvs_downloaded: 0 };
      
      // Aumentamos a 5 segundos por latencia en el VPS
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Stats timeout')), 5000)
      );
      
      // Usamos maybeSingle para evitar errores si la fila no existe
      const fetchPromise = adminClient
        .from('platform_stats')
        .select('page_views, cvs_generated, cvs_downloaded')
        .eq('id', 1)
        .maybeSingle();

      const result = await Promise.race([fetchPromise, timeout]) as any;
      const data = result?.data;

      return data || { cvs_generated: 0, page_views: 0, cvs_downloaded: 0 };
    } catch (e) {
      console.warn("[HOME_STATS_FETCH_WARNING] Fallback to zeros:", e instanceof Error ? e.message : e);
      return { cvs_generated: 0, page_views: 0, cvs_downloaded: 0 };
    }
  })();

  // 2. Promesa de Autenticación y Cuotas
  const quotaPromise = (async () => {
    try {
      const { user, userId, anonymousId } = await requireAuth({ allowAnonymous: true });
      let isAnonymous = true;
      let usageCount = 0;
      const limit = 3;

      if (user && userId) {
        isAnonymous = false;
        // Audit: Registered users should also have their usage tracked in 'generations'
        const { count, error } = await adminClient
          .from("generations")
          .select("*", { count: 'exact', head: true })
          .eq("user_id", userId);
        
        usageCount = count || 0;
        return { is_anonymous: isAnonymous, usage_count: usageCount, remaining_uses: 999 }; // Unlimited for registered? Or set real limit.
      }

      if (anonymousId && adminClient) {
        const { data: usage } = await adminClient
          .from("anonymous_usage")
          .select("count")
          .eq("anonymous_id", anonymousId)
          .maybeSingle();
        usageCount = usage?.count || 0;
      }
      return { is_anonymous: isAnonymous, usage_count: usageCount, remaining_uses: Math.max(0, limit - usageCount) };
    } catch (error) {
       console.error("Error SSR quota fetching:", error);
       return { is_anonymous: true, usage_count: 0, remaining_uses: 3 };
    }
  })();

  const [stats, quota] = await Promise.all([statsPromise, quotaPromise]);

  return (
    <HomeClient 
      initialStats={stats} 
      initialAuthStatus={quota.is_anonymous}
      initialQuotaUsage={quota.usage_count}
      remainingUses={quota.remaining_uses}
    />
  );
}
