"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, FileText, Link as LinkIcon, AlertCircle } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useLanguage } from "@/contexts/LanguageContext";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface WizardProps {
  onComplete: (data: any) => void;
}

export default function Wizard({ onComplete }: WizardProps) {
  const { t } = useLanguage();
  const spinners = t("spinners") as string[];

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [jobText, setJobText] = useState("");
  
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [claimIndex, setClaimIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jobTextRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isUploading) {
      const interval = setInterval(() => {
        setClaimIndex((prev) => (prev + 1) % spinners.length);
      }, 3000);
      return () => clearInterval(interval);
    } else {
      setClaimIndex(0);
    }
  }, [isUploading, spinners.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCvFile(e.target.files[0]);
      setCvText(""); // Limpiar texto si sube archivo
    }
  };

  const handleSubmit = async () => {
    setError("");
    
    // Validación UI local
    if (!cvFile && !cvText.trim()) {
      setError(t("wizard.error_cv"));
      return;
    }
    if (!jobUrl.trim() && !jobText.trim()) {
      setError(t("wizard.error_job"));
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      if (cvFile) formData.append("cvFile", cvFile);
      if (cvText.trim()) formData.append("cvText", cvText);
      if (jobUrl.trim()) formData.append("jobUrl", jobUrl);
      if (jobText.trim()) formData.append("jobText", jobText);

      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle Limit Reached for Anonymous users
        if (data?.error === "LIMIT_REACHED" || res.status === 401) {
          setError("Has alcanzado el límite de 3 generaciones gratuitas. ¡Loguéate con Google para guardar tus documentos y seguir!");
          setIsUploading(false);
          return;
        }

        if (data?.error?.code === "SCRAPER_BLOCKED") {
          setError(t("wizard.error_scraper_blocked") || data.error.message);
          setIsUploading(false);
          // Wait for UI to finish state transition before focus
          setTimeout(() => jobTextRef.current?.focus(), 100);
          return;
        }
        throw new Error(data?.error?.message || "Error desconocido");
      }

      onComplete(data);
    } catch (err: any) {
      setError(err.message);
      setIsUploading(false); // Only stop on error, onComplete will unmount naturally
    }
  };

  if (isUploading) {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-5xl mx-auto">
      {/* Hero Content Left */}
      <div className="flex flex-col space-y-6 text-center lg:text-left">
        <h1 className="text-4xl md:text-5xl lg:text-[54px] font-extrabold text-gray-900 dark:text-slate-50 tracking-tight leading-[1.15]">
          {t("hero.title_1")}<br />
          <span className="text-blue-600 dark:text-blue-500">{t("hero.title_2")}</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 dark:text-slate-400 leading-relaxed font-medium max-w-xl mx-auto lg:mx-0">
          {t("hero.subtitle")}
        </p>

        <div className="pt-6 hidden lg:flex flex-col gap-4 text-[15px] font-medium text-gray-600 dark:text-slate-400">
           <div className="flex items-center gap-3">
             <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm">1</div>
             {t("hero.step1")}
           </div>
           <div className="flex items-center gap-3">
             <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm">2</div>
             {t("hero.step2")}
           </div>
           <div className="flex items-center gap-3">
             <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm">3</div>
             {t("hero.step3")}
           </div>
        </div>
      </div>

      {/* Form Right */}
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-200 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] p-6 md:p-8 flex flex-col gap-8">
        
        {/* Step 1: CV Input */}
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
              onChange={(e) => {
                setCvText(e.target.value);
                setCvFile(null);
              }}
              className="w-full h-[100px] resize-none bg-transparent dark:bg-slate-900/40 dark:focus:bg-slate-900 border border-gray-200 dark:border-slate-700/80 rounded-xl p-4 text-[13px] text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Step 2: Job Input */}
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
                onChange={(e) => setJobUrl(e.target.value)}
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
              onChange={(e) => setJobText(e.target.value)}
              className="w-full h-[100px] resize-none bg-transparent dark:bg-slate-900/40 dark:focus:bg-slate-900 border border-gray-200 dark:border-slate-700/80 rounded-xl p-4 text-[13px] text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Errors */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/50 rounded-lg text-sm font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Action Area */}
        <div className="pt-2 flex flex-col gap-3">
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold tracking-tight py-3.5 px-6 rounded-xl shadow-sm dark:shadow-[inset_0_1px_rgba(255,255,255,0.15)] flex items-center justify-center transition-all active:scale-[0.98]"
          >
            {t("hero.cta")}
          </button>
          <p className="text-center text-[11px] text-gray-500 dark:text-slate-500 font-medium">
            {t("hero.trust")}
          </p>
        </div>

      </div>
    </div>
  );
}
