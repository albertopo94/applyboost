"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/db/supabase-browser";
import LogIn from "lucide-react/dist/esm/icons/log-in";
import UserIcon from "lucide-react/dist/esm/icons/user";
import LogOut from "lucide-react/dist/esm/icons/log-out";
import { useLanguage } from "@/contexts/LanguageContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { motion, AnimatePresence } from "framer-motion";

interface UserMenuProps {
  onOpenAuth: () => void;
}

export function UserMenu({ onOpenAuth }: UserMenuProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const supabase = createClient();
  const { t } = useLanguage();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

    // Handle clicks outside to close menu
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.ref?.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    // Need a more robust way for "click outside" in React
    document.addEventListener("mousedown", (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
      document.removeEventListener("mousedown", () => {});
    };
  }, [supabase]);

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) return <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />;

  // LOGGED IN STATE: Show Avatar + Dropdown
  if (user) {
    const fullName = user.user_metadata?.full_name || "Usuario";
    const email = user.email || "";
    const avatarUrl = user.user_metadata?.avatar_url;

    return (
      <div className="relative" ref={menuRef}>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`flex items-center gap-2 p-0.5 rounded-full transition-all border-2 ${
            isMenuOpen ? 'border-blue-500 shadow-md scale-105' : 'border-transparent hover:border-blue-500/30'
          }`}
        >
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={fullName} 
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
              <UserIcon className="w-4 h-4" />
            </div>
          )}
        </button>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-[110]"
            >
              {/* User Info Header */}
              <div className="px-5 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{fullName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{email}</p>
              </div>

              {/* Menu Actions */}
              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors group"
                >
                  <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  Cerrar sesión
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // LOGGED OUT STATE
  const loginText = t('editor.login_with_google');

  return (
    <button
      onClick={onOpenAuth}
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
