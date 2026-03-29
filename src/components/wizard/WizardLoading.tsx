"use client";

import { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useLanguage } from "@/contexts/LanguageContext";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface WizardLoadingProps {
  currentStep?: number;
}

export default function WizardLoading({ currentStep = 0 }: WizardLoadingProps) {
  const { t } = useLanguage();
  const spinners = t("spinners") as string[];
  const [claimIndex, setClaimIndex] = useState(0);

  const TOTAL_STEPS = 5;
  const progressPercentage = (currentStep / TOTAL_STEPS) * 100;

  useEffect(() => {
    const interval = setInterval(() => {
      setClaimIndex((prev) => (prev + 1) % spinners.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [spinners.length]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4 animate-in fade-in duration-500">
      <div className="relative flex items-center justify-center w-20 h-20 mb-8">
        <div className="absolute inset-0 rounded-full border-[3px] border-blue-100 dark:border-blue-900/50 border-t-blue-600 dark:border-t-blue-500 animate-spin" />
        <FileText className="w-8 h-8 text-blue-600 dark:text-blue-500 animate-pulse" />
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-50 tracking-tight mb-3">
        {t("wizard.optimizing")}
      </h3>

      {/* Progress Bar and Fraction */}
      <div className="w-full max-w-xs mb-8 space-y-2.5">
        <div className="flex justify-between items-center text-[10px] font-black text-blue-600/80 dark:text-blue-400/80 uppercase tracking-[0.2em] antialiased">
          <span>Proceso en curso</span>
          <span className="bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-100/50 dark:border-blue-800/50">
            {currentStep} de {TOTAL_STEPS} superado
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden border border-gray-100/50 dark:border-slate-800/50">
          <div 
            className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-1000 ease-out rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
      
      <div className="h-6 relative w-full overflow-hidden flex justify-center">
        {spinners.map((claim, idx) => (
          <span
            key={idx}
            className={cn(
              "absolute transition-all duration-700 ease-in-out text-sm font-medium text-gray-500 dark:text-slate-400 text-center w-full",
              idx === claimIndex 
                ? "opacity-100 translate-y-0" 
                : "opacity-0 translate-y-2 pointer-events-none"
            )}
          >
            {claim}
          </span>
        ))}
      </div>
    </div>
  );
}
