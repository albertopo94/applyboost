"use client";

import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { useLanguage } from "@/contexts/LanguageContext";
import { Logo } from "@/components/layout/Logo";

interface HeaderProps {
  step: "WIZARD" | "RESULT";
  setStep: (step: "WIZARD" | "RESULT") => void;
  onOpenAuth: () => void;
}

export function Header({ step, setStep, onOpenAuth }: HeaderProps) {
  const { t } = useLanguage();

  return (
    <header className="px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900/60 relative z-20 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <Logo />
        <span className="font-bold text-gray-900 dark:text-slate-50 tracking-tight text-lg">{t('header.title')}</span>
      </div>
      
      <div className="flex items-center gap-4">
        {step === "RESULT" && (
          <button 
            onClick={() => setStep("WIZARD")}
            className="text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-50 transition-colors flex items-center gap-1"
          >
            ← <span className="hidden sm:inline">{t('header.new_optimization')}</span>
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border-r border-gray-100 dark:border-slate-800 pr-3 mr-1">
            <LanguageSelector />
            <ThemeToggle />
          </div>
          <UserMenu onOpenAuth={onOpenAuth} />
        </div>
      </div>
    </header>
  );
}
