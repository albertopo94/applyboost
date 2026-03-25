"use client";

import { Link as LinkIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface JobInputProps {
  jobUrl: string;
  jobText: string;
  onUrlChange: (url: string) => void;
  onTextChange: (text: string) => void;
  jobTextRef?: React.RefObject<HTMLTextAreaElement>;
}

export default function JobInput({ jobUrl, jobText, onUrlChange, onTextChange, jobTextRef }: JobInputProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <label className="block text-sm font-bold tracking-tight text-gray-900 dark:text-slate-50">
        {t("wizard.step2_title")}
      </label>
      <div className="space-y-3">
        <div className="relative">
          <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
          <input 
            type="url"
            placeholder={t("wizard.url_placeholder")}
            value={jobUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            className="w-full bg-transparent dark:bg-slate-900/40 dark:focus:bg-slate-900 border border-gray-200 dark:border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-[13px] text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
          />
        </div>
        
        <div className="flex items-center gap-4 text-[11px] font-bold uppercase text-gray-400 dark:text-slate-500">
          <div className="flex-1 h-px bg-gray-100 dark:bg-slate-700" />
          <span>{t("wizard.or_description")}</span>
          <div className="flex-1 h-px bg-gray-100 dark:bg-slate-700" />
        </div>

        <textarea 
          ref={jobTextRef}
          placeholder={t("wizard.job_placeholder")}
          value={jobText}
          onChange={(e) => onTextChange(e.target.value)}
          className="w-full h-[100px] resize-none bg-transparent dark:bg-slate-900/40 dark:focus:bg-slate-900 border border-gray-200 dark:border-slate-700/80 rounded-xl p-4 text-[13px] text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
        />
      </div>
    </div>
  );
}
