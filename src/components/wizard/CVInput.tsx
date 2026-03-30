"use client";

import { useRef } from "react";
import { UploadCloud, XCircle } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useLanguage } from "@/contexts/LanguageContext";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface CVInputProps {
  cvFile: File | null;
  cvText: string;
  onFileChange: (file: File | null) => void;
  onTextChange: (text: string) => void;
}

export default function CVInput({ cvFile, cvText, onFileChange, onTextChange }: CVInputProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validation: 5MB limit for VPS safety (768MB RAM)
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_SIZE) {
        alert(t("wizard.error_file_too_large") || "El archivo es demasiado grande (máx 5MB)");
        e.target.value = ""; // Reset input
        return;
      }
      
      onFileChange(file);
    }
  };

  return (
    <div className="space-y-4">
      <label htmlFor="cv-text-input" className="block text-sm font-bold tracking-tight text-gray-900 dark:text-slate-50 cursor-pointer">
        {t("wizard.step1_title")}
      </label>
      <div className="space-y-3">
        <div 
          role="button"
          tabIndex={0}
          aria-label={t("wizard.upload_cta")}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
            cvFile 
              ? "border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-500/10" 
              : "border-gray-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-gray-50/50 dark:hover:bg-slate-700/30"
          )}
        >
          <UploadCloud className={cn("w-7 h-7 mb-2", cvFile ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-slate-500")} aria-hidden="true" />
          <span className="text-[13px] font-semibold text-gray-700 dark:text-slate-300 text-center px-4">
            {cvFile ? cvFile.name : t("wizard.upload_cta")}
          </span>
          {cvFile && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Avoid triggering parent onClick
                onFileChange(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-full"
              title="Clear file"
              aria-label="Remove uploaded CV file"
            >
              <XCircle className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
          <input 
            ref={fileInputRef} 
            type="file" 
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" 
            className="hidden" 
            onChange={handleFileChange} 
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>
        
        <div className="flex items-center gap-4 text-[11px] font-bold uppercase text-gray-400 dark:text-slate-500" aria-hidden="true">
          <div className="flex-1 h-px bg-gray-100 dark:bg-slate-700" />
          <span>{t("wizard.or_paste")}</span>
          <div className="flex-1 h-px bg-gray-100 dark:bg-slate-700" />
        </div>

        <div className="relative">
          <textarea 
            id="cv-text-input"
            placeholder={t("wizard.cv_placeholder")}
            value={cvText}
            onChange={(e) => onTextChange(e.target.value)}
            className="w-full h-[100px] resize-none bg-transparent dark:bg-slate-900/40 dark:focus:bg-slate-900 border border-gray-200 dark:border-slate-700/80 rounded-xl p-4 pr-10 text-[13px] text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
          />
          {cvText && (
            <button
              onClick={() => onTextChange("")}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-full"
              title="Clear text"
              aria-label="Clear inserted CV text"
            >
              <XCircle className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
