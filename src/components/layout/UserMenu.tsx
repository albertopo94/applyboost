"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/db/supabase-browser";
import LogIn from "lucide-react/dist/esm/icons/log-in";
import UserIcon from "lucide-react/dist/esm/icons/user";
import Info from "lucide-react/dist/esm/icons/info";
import X from "lucide-react/dist/esm/icons/x";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

export function UserMenu() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const supabase = createClient();
  const { t } = useLanguage();

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

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [supabase]);

  const handleGoogleLogin = async () => {
    if (!supabase || isRedirecting) return;
    setIsRedirecting(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/api/auth/callback",
        },
      });
    } catch (err) {
      console.error("Login error:", err);
      setIsRedirecting(false);
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) return <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />;

  // LOGGED IN STATE: Show Avatar with Dropdown potential
  if (user) {
    return (
      <div className="flex items-center gap-3">
        <button 
          onClick={handleLogout}
          title="Cerrar sesión"
          className="group relative flex items-center gap-2 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border-2 border-transparent hover:border-blue-500/30"
        >
          {user.user_metadata?.avatar_url ? (
            <img 
              src={user.user_metadata.avatar_url} 
              alt={user.user_metadata.full_name || "User"} 
              className="w-8 h-8 rounded-full object-cover shadow-sm"
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

  // LOGGED OUT STATE: Show "Serious" Auth Flow Trigger
  const loginText = t('editor.login_with_google');

  return (
    <>
      <button
        onClick={() => setShowAuthModal(true)}
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

      {/* AUTH MODAL: The "Serious" Consent Interface */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm overflow-y-auto pt-4 pb-4">
            <div className="min-h-full flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 my-auto"
              >
              {/* Header */}
              <div className="px-6 pt-8 pb-4 text-center">
                <div className="mx-auto w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                  <UserIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                  {user ? 'Acceder a tu cuenta' : 'Únete a ApplyBoost'}
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Para guardar tus optimizaciones y acceder a funciones premium, necesitas identificarte.
                </p>
              </div>

              {/* Data Disclosure: The "Serious" Part */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Info className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Información que compartiremos:
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      Al continuar con Google, permites que ApplyBoost acceda a tu nombre, dirección de correo electrónico y foto de perfil para gestionar tu identidad y documentos de forma segura.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 pt-4 pb-8 space-y-3">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isRedirecting}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-white text-slate-900 rounded-xl font-bold border border-slate-200 dark:border-slate-200 hover:bg-slate-50 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isRedirecting ? (
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-3.3 3.28-8.19 3.28-13.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
                      </svg>
                      Continuar con Google
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setShowAuthModal(false)}
                  className="w-full py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  Quizás más tarde
                </button>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
