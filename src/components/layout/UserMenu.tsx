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
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/api/auth/callback",
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) return <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />;

  if (!user) {
    return (
      <button
        onClick={handleLogin}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-blue-100 dark:border-blue-800/30"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{t('editor.login_with_google')}</span>
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
