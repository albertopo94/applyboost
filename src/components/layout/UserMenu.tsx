"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/db/supabase-browser";
import LogIn from "lucide-react/dist/esm/icons/log-in";
import UserIcon from "lucide-react/dist/esm/icons/user";
import { useLanguage } from "@/contexts/LanguageContext";

export function UserMenu() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { t } = useLanguage();

  useEffect(() => {
    // Build Guard: In SSR/Build environment, just stop loading and return
    if (typeof window === "undefined" || !supabase) {
      setLoading(false);
      return;
    }

    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (err) {
        console.error("Auth error:", err);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogin = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/api/auth/callback",
      },
    });
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.reload();
  };

  // While loading, return a simple pulse. During build, this will be bypassed quickly.
  if (loading) return <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />;

  if (!user) {
    const loginText = t('editor.login_with_google');
    
    return (
      <button
        onClick={handleLogin}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors border border-slate-200 dark:border-slate-800/50"
      >
        <LogIn className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        <span className="hidden sm:inline">
          {loginText.split('Google').map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className="inline-flex">
                  <span style={{ color: '#4285F4' }}>G</span>
                  <span style={{ color: '#EA4335' }}>o</span>
                  <span style={{ color: '#FBBC05' }}>o</span>
                  <span style={{ color: '#4285F4' }}>g</span>
                  <span style={{ color: '#34A853' }}>l</span>
                  <span style={{ color: '#EA4335' }}>e</span>
                </span>
              )}
            </span>
          ))}
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button 
        onClick={handleLogout}
        className="group relative flex items-center gap-2 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        {user.user_metadata?.avatar_url ? (
          <img 
            src={user.user_metadata.avatar_url} 
            alt={user.user_metadata.full_name || "User"} 
            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
            <UserIcon className="w-4 h-4" />
          </div>
        )}
      </button>
    </div>
  );
}
