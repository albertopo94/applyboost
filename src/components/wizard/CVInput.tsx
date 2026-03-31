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
  isFileDisabled?: boolean;
  isTextDisabled?: boolean;
}

export default function CVInput({ 
  cvFile, 
  cvText, 
  onFileChange, 
  onTextChange,
  isFileDisabled = false,
  isTextDisabled = false
}: CVInputProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFileDisabled) return;
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_SIZE) {
        alert(t("wizard.error_file_too_large") || "El archivo es demasiado grande (máx 5MB)");
        e.target.value = "";
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
          tabIndex={isFileDisabled ? -1 : 0}
          aria-label={t("wizard.upload_cta")}
          aria-disabled={isFileDisabled}
          onClick={() => !isFileDisabled && fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (isFileDisabled) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all duration-300 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
            isFileDisabled 
              ? "border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-slate-900/20 cursor-not-allowed opacity-50"
              : cvFile 
                ? "border-blue-500/50 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-500/10 cursor-pointer hover:shadow-sm" 
                : "border-gray-200 dark:border-white/10 hover:border-blue-400 dark:hover:border-blue-400/50 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 cursor-pointer"
          )}
        >
          <UploadCloud className={cn("w-7 h-7 mb-2 transition-transform duration-300", 
            isFileDisabled ? "text-gray-300 dark:text-slate-700" :
            cvFile ? "text-blue-500 dark:text-blue-400" : "text-gray-400 dark:text-slate-500"
          )} aria-hidden="true" />
          <span className={cn("text-[13px] font-semibold text-center px-4",
            isFileDisabled ? "text-gray-400 dark:text-slate-600" : "text-gray-700 dark:text-slate-300"
          )}>
            {cvFile ? cvFile.name : t("wizard.upload_cta")}
          </span>
          {cvFile && !isFileDisabled && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileChange(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-all outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded-full hover:scale-110 active:scale-95"
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
            disabled={isFileDisabled}
          />
        </div>
        
        <div className={cn("flex items-center gap-4 text-[11px] font-bold uppercase transition-opacity", 
          (isFileDisabled || isTextDisabled) ? "opacity-50" : "text-gray-400 dark:text-slate-500"
        )} aria-hidden="true">
          <div className="flex-1 h-px bg-gray-100 dark:bg-slate-700" />
          <span>{t("wizard.or_paste")}</span>
          <div className="flex-1 h-px bg-gray-100 dark:bg-slate-700" />
        </div>

        <div className="relative">
          <textarea 
            id="cv-text-input"
            placeholder={t("wizard.cv_placeholder")}
            value={cvText}
            onChange={(e) => !isTextDisabled && onTextChange(e.target.value)}
            disabled={isTextDisabled}
            className={cn(
              "w-full h-[100px] resize-none bg-transparent border rounded-xl p-4 pr-10 text-[13px] outline-none transition-all",
              isTextDisabled
                ? "bg-gray-50/30 dark:bg-slate-900/20 border-gray-100 dark:border-white/5 text-gray-400 dark:text-slate-600 cursor-not-allowed opacity-50"
                : "dark:bg-slate-900/40 dark:focus:bg-[#0B0F19] border-gray-200 dark:border-white/10 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-slate-500"
            )}
          />
          {cvText && !isTextDisabled && (
            <button
              onClick={() => onTextChange("")}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-all outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded-full hover:scale-110 active:scale-95"
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
