import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/db/supabase-browser';
import { toast } from 'sonner';
import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

export function usePlatformTelemetry() {
  const isSyncing = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    // 1. Existing page view tracking logic
    const trackView = async () => {
      console.log('[Telemetry] Initializing trackView...');
      const hasTracked = sessionStorage.getItem('has_tracked_page_view');
      if (!hasTracked) {
        console.log('[Telemetry] Calling RPC increment_platform_stat...');
        const { data, error } = await supabase.rpc('increment_platform_stat', { stat_name: 'page_views' });
        console.log('[Telemetry] RPC Finished. Error:', error, 'Data:', data);
        if (error) {
          console.error('[Telemetry] RPC Error tracking page view:', error);
        } else {
          sessionStorage.setItem('has_tracked_page_view', 'true');
        }
      }
    };
    trackView();

    // 2. Auth state change listener for anonymous data merge
    const syncAnonymousData = async (user: User | null) => {
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
        isSyncing.current = true;
        
        try {
          const { error } = await supabase.rpc('merge_anonymous_data', { 
            anon_id: anonId, 
            target_user_id: user.id 
          });
          
          if (error) {
            console.error('[Sync] Error merging anonymous data:', error);
            toast.error("Error al sincronizar tus datos");
          } else {
            // Clear cookie
            document.cookie = 'applyboost_anon_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
            toast.success("Tus borradores previos se han sincronizado correctamente");
          }
        } catch (err) {
          console.error('[Sync] Unexpected error during merge:', err);
          toast.error("Error inesperado en la sincronización");
        } finally {
          isSyncing.current = false;
        }
      }
    };

    // Check immediately on mount if user is already logged in
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: User | null } }) => {
       if (user) syncAnonymousData(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        syncAnonymousData(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
}
