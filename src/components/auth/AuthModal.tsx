"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import UserIcon from "lucide-react/dist/esm/icons/user";
import Info from "lucide-react/dist/esm/icons/info";
import X from "lucide-react/dist/esm/icons/x";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isRedirecting: boolean;
  user?: any;
}

export function AuthModal({ isOpen, onClose, onConfirm, isRedirecting, user }: AuthModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header / Brand */}
            <div className="px-8 pt-10 pb-6 text-center">
              <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6 rotate-3 shadow-inner">
                <UserIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 -rotate-3" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {user ? 'Acceder de nuevo' : 'Únete a ApplyBoost'}
              </h3>
              <p className="mt-3 text-[15px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Guarda tus optimizaciones y accede a tu historial profesional en un solo lugar.
              </p>
            </div>

            {/* Data Disclosure / Trust Card */}
            <div className="mx-6 p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50 mb-2">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl shrink-0">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200">
                    Transparencia de datos
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal font-medium">
                    Al continuar, permites que ApplyBoost acceda a tu nombre, email y foto de perfil para gestionar tu identidad de forma segura.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-8 pt-4 space-y-4">
              <button
                onClick={onConfirm}
                disabled={isRedirecting}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm shadow-xl shadow-blue-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {isRedirecting ? (
                  <div className="w-5 h-5 border-3 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-3.3 3.28-8.19 3.28-13.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
                    </svg>
                    Continuar con Google
                  </>
                )}
              </button>
              
              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center px-4">
                Sin tarjetas de crédito. Sin configuraciones complejas.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
