"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/db/supabase-browser";
import { useLanguage } from "@/contexts/LanguageContext";

interface PlatformStats {
  page_views: number;
  cvs_generated: number;
  cvs_downloaded: number;
}

const DEFAULT_STATS: PlatformStats = {
  page_views: 0,
  cvs_generated: 0,
  cvs_downloaded: 0,
};

interface SocialProofTickerProps {
  initialStats?: PlatformStats | null;
}

export default function SocialProofTicker({ initialStats }: SocialProofTickerProps) {
  const [stats, setStats] = useState<PlatformStats>(initialStats || DEFAULT_STATS);
  const [isLoading, setIsLoading] = useState(!initialStats);
  const { t } = useLanguage();

  useEffect(() => {
    // Si no tenemos stats iniciales, intentamos cargarlas (fallback)
    // Aunque con el nuevo flujo esto no debería ocurrir casi nunca
    if (!initialStats) {
      const fetchInitial = async () => {
        const supabase = createClient();
        if (!supabase) return;
        
        try {
          const { data, error } = await supabase
            .from("platform_stats")
            .select("page_views, cvs_generated, cvs_downloaded")
            .eq("id", 1)
            .single();
          
          if (!error && data) {
            setStats(data);
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Error fetching stats:", error);
        }
      };
      fetchInitial();
    }

    const supabase = createClient();
    if (!supabase) return;

    // Suscripción Realtime para actualizar los números en vivo
    const channel = supabase
      .channel('platform_stats_changes')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'platform_stats' 
        },
        (payload) => {
          if (payload.new && (payload.new as any).id === 1) {
            setStats(payload.new as PlatformStats);
          }
        }
      )
      .subscribe();

    // Cleanup: desuscribirse del canal cuando el componente se desmonte
    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialStats]);

  return (
    <div 
      className={`flex items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400 mt-10 mb-2 transition-opacity duration-500 ${
        isLoading ? "opacity-30 animate-pulse" : "opacity-100"
      }`}
    >
      <span>
        {t('stats.views')}: <span className="font-mono">{stats.page_views.toLocaleString()}</span>
      </span>
      <span>•</span>
      <span>
        {t('stats.generated')}: <span className="font-mono">{stats.cvs_generated.toLocaleString()}</span>
      </span>
      <span>•</span>
      <span>
        {t('stats.downloaded')}: <span className="font-mono">{stats.cvs_downloaded.toLocaleString()}</span>
      </span>
    </div>
  );
}
