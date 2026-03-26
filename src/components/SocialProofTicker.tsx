"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/db/supabase-browser";
import { useLanguage } from "@/contexts/LanguageContext";

interface PlatformStats {
  page_views: number;
  cvs_generated: number;
  cvs_downloaded: number;
}

export default function SocialProofTicker() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    async function fetchStats() {
      try {
        const supabase = createClient();
        if (!supabase) return;
        const { data, error } = await supabase
          .from("platform_stats")
          .select("page_views, cvs_generated, cvs_downloaded")
          .eq("id", 1)
          .single();
        
        if (!error && data) {
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    }
    fetchStats();
  }, []);

  if (!stats) return null;

  return (
    <div className="flex items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400 mt-10 mb-2">
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
