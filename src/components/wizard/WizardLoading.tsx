"use client";

import { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useLanguage } from "@/contexts/LanguageContext";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function WizardLoading() {
  const { t } = useLanguage();
  const spinners = t("spinners") as string[];
  const [claimIndex, setClaimIndex] = useState(0);

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
