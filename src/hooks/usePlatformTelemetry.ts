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
    const syncAnonymousData = async (user: any) => {\n      if (!user || isSyncing.current) return;\n\n      // Read cookie manually from document.cookie\n      const getCookie = (name: string) => {\n        const value = `; ${document.cookie}`;\n        const parts = value.split(`; ${name}=`);\n        if (parts.length === 2) return parts.pop()?.split(';').shift();\n      };\n\n      const anonId = getCookie('applyboost_anon_id');\n      \n      if (anonId) {\n        console.log('[Sync] Detecting login with anonymous data. Merging...', { \n          anon_id: anonId, \n          user_id: user.id \n        });\n        \n        isSyncing.current = true;\n        \n        try {\n          const { error } = await supabase.rpc('merge_anonymous_data', { \n            anon_id: anonId, \n            target_user_id: user.id \n          });\n          \n          if (error) {\n            console.error('[Sync] Error merging anonymous data:', error);\n          } else {\n            console.log('[Sync] Successfully merged anonymous data.');\n            \n            // Clear cookie\n            document.cookie = 'applyboost_anon_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';\n            \n            // Standard alert to inform user about data sync\n            alert(\"¡Tus documentos anónimos han sido vinculados a tu cuenta!\");\n            console.log('[Sync] Anonymous cookie cleared.');\n          }\n        } catch (err) {\n          console.error('[Sync] Unexpected error during merge:', err);\n        } finally {\n          isSyncing.current = false;\n        }\n      }\n    };\n\n    // Check immediately on mount if user is already logged in\n    supabase.auth.getUser().then(({ data: { user } }) => {\n       if (user) syncAnonymousData(user);\n    });\n\n    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {\n      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {\n        syncAnonymousData(session.user);\n      }\n    });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
}
