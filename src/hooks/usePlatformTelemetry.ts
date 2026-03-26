import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/db/supabase-browser';

export function usePlatformTelemetry() {
  const isSyncing = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    // 1. Existing page view tracking logic
    const trackView = async () => {
      const hasTracked = sessionStorage.getItem('has_tracked_page_view');
      if (!hasTracked) {
        try {
          await supabase.rpc('increment_platform_stat', { stat_name: 'page_views' });
          sessionStorage.setItem('has_tracked_page_view', 'true');
        } catch (error) {
          console.error('Error tracking page view:', error);
        }
      }
    };
    trackView();

    // 2. Auth state change listener for anonymous data merge
    const syncAnonymousData = async (user: any) => {
      if (!user || isSyncing.current) return;

      // Read cookie manually from document.cookie
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return undefined;
      };

      const anonId = getCookie('applyboost_anon_id');
      
      if (anonId) {
        console.log('[Sync] Detecting login with anonymous data. Merging...', { 
          anon_id: anonId, 
          user_id: user.id 
        });
        
        isSyncing.current = true;
        
        try {
          const { error } = await supabase.rpc('merge_anonymous_data', { 
            anon_id: anonId, 
            target_user_id: user.id 
          });
          
          if (error) {
            console.error('[Sync] Error merging anonymous data:', error);
          } else {
            console.log('[Sync] Successfully merged anonymous data.');
            
            // Clear cookie
            document.cookie = 'applyboost_anon_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
            
            // Standard alert to inform user about data sync
            // In a real app we might use a toast, but this is a solid fallback
            console.log('[Sync] Anonymous cookie cleared.');
          }
        } catch (err) {
          console.error('[Sync] Unexpected error during merge:', err);
        } finally {
          isSyncing.current = false;
        }
      }
    };

    // Check immediately on mount if user is already logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
       if (user) syncAnonymousData(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        syncAnonymousData(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
}
