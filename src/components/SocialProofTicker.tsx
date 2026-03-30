"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/db/supabase-browser";
import { useLanguage } from "@/contexts/LanguageContext";
import { Linkedin } from "lucide-react";

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
    <div className="flex flex-col items-center justify-center gap-4 mt-10 mb-6 transition-opacity duration-500">
      <div 
        className={`flex items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400 ${
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

      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
        <span>Siendo construido por</span>
        <a 
          href="https://www.linkedin.com/in/alberto-perez-ojeda" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:underline decoration-blue-500 underline-offset-4"
        >
          <Linkedin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
          <span className="font-semibold">Albert</span>
        </a>
      </div>
    </div>
  );
}
