"use client";

import { useRef } from "react";
import { UploadCloud } from "lucide-react";
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
      onFileChange(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-bold tracking-tight text-gray-900 dark:text-slate-50">
        {t("wizard.step1_title")}
      </label>
      <div className="space-y-3">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors",
            cvFile 
              ? "border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-500/10" 
              : "border-gray-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-gray-50/50 dark:hover:bg-slate-700/30"
          )}
        >
          <UploadCloud className={cn("w-7 h-7 mb-2", cvFile ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-slate-500")} />
          <span className="text-[13px] font-semibold text-gray-700 dark:text-slate-300">
            {cvFile ? cvFile.name : t("wizard.upload_cta")}
          </span>
          <input 
            ref={fileInputRef} 
            type="file" 
            accept=".pdf,.doc,.docx" 
            className="hidden" 
            onChange={handleFileChange} 
          />
        </div>
        
        <div className="flex items-center gap-4 text-[11px] font-bold uppercase text-gray-400 dark:text-slate-500">
          <div className="flex-1 h-px bg-gray-100 dark:bg-slate-700" />
          <span>{t("wizard.or_paste")}</span>
          <div className="flex-1 h-px bg-gray-100 dark:bg-slate-700" />
        </div>

        <textarea 
          placeholder={t("wizard.cv_placeholder")}
          value={cvText}
          onChange={(e) => onTextChange(e.target.value)}
          className="w-full h-[100px] resize-none bg-transparent dark:bg-slate-900/40 dark:focus:bg-slate-900 border border-gray-200 dark:border-slate-700/80 rounded-xl p-4 text-[13px] text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
        />
      </div>
    </div>
  );
}
