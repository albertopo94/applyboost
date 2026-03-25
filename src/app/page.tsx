"use client";

import { useState } from "react";
import Wizard from "@/components/Wizard";
import EditorPreview from "@/components/EditorPreview";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePlatformTelemetry } from "@/hooks/usePlatformTelemetry";
import SocialProofTicker from "@/components/SocialProofTicker";

export default function Home() {
  const [step, setStep] = useState<"WIZARD" | "RESULT">("WIZARD");
  const [generationData, setGenerationData] = useState<any>(null);
  const { t } = useLanguage();
  
  usePlatformTelemetry();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 antialiased selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900/40 dark:selection:text-blue-100">
      <div className="w-full max-w-6xl bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800">
        
        {/* Header simple e institucional */}
        <header className="px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900/60 relative z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm dark:shadow-[inset_0_1px_rgba(255,255,255,0.1)]">
              <span className="text-white font-bold tracking-tighter text-sm">AB</span>
            </div>
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
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 sm:p-10 md:p-14">
          {step === "WIZARD" ? (
            <Wizard onComplete={(data: any) => {
              setGenerationData(data);
              setStep("RESULT");
            }} />
          ) : (
             <EditorPreview data={generationData} />
          )}
          <SocialProofTicker />
        </div>
      </div>
    </main>
  );
}
