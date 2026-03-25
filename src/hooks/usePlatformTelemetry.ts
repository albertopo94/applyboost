import { useEffect } from 'react';
import { createClient } from '@/lib/db/supabase-browser';

export function usePlatformTelemetry() {
  useEffect(() => {
    const trackView = async () => {
      const hasTracked = sessionStorage.getItem('has_tracked_page_view');
      if (!hasTracked) {
        try {
          const supabase = createClient();
          await supabase.rpc('increment_platform_stat', { stat_name: 'page_views' });
          sessionStorage.setItem('has_tracked_page_view', 'true');
        } catch (error) {
          console.error('Error tracking page view:', error);
        }
      }
    };
    
    trackView();
  }, []);
}
