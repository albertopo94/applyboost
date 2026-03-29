"use client";

import { useState, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import WizardLoading from "./wizard/WizardLoading";
import WizardHero from "./wizard/WizardHero";
import CVInput from "./wizard/CVInput";
import JobInput from "./wizard/JobInput";

interface WizardProps {
  onComplete: (data: any) => void;
}

export default function Wizard({ onComplete }: WizardProps) {
  const { t } = useLanguage();

  // --- Global State ---
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [jobText, setJobText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");
  
  const jobTextRef = useRef<HTMLTextAreaElement>(null);

  // --- Handlers ---
  const handleCvFileChange = (file: File | null) => {
    setCvFile(file);
    if (file) setCvText(""); 
  };

  const handleCvTextChange = (text: string) => {
    setCvText(text);
    if (text.trim()) setCvFile(null);
  };

  const handleSubmit = async () => {
    setError("");
    
    // Local Validation
    if (!cvFile && !cvText.trim()) {
      setError(t("wizard.error_cv"));
      return;
    }
    if (!jobUrl.trim() && !jobText.trim()) {
      setError(t("wizard.error_job"));
      return;
    }

    setIsUploading(true);
    setCurrentStep(0);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 seconds timeout

    try {
      const formData = new FormData();
      if (cvFile) formData.append("cvFile", cvFile);
      if (cvText.trim()) formData.append("cvText", cvText);
      if (jobUrl.trim()) formData.append("jobUrl", jobUrl);
      if (jobText.trim()) formData.append("jobText", jobText);

      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      // Handle Streaming Response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done && reader) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(l => l.trim());

        for (const line of lines) {
          try {
            const message = JSON.parse(line);
            
            if (message.type === "progress") {
              setCurrentStep(message.step);
            } else if (message.type === "final") {
              clearTimeout(timeoutId);
              onComplete(message.data);
              return;
            } else if (message.type === "error") {
              clearTimeout(timeoutId);
              if (message.error?.code === "LIMIT_REACHED" || message.status === 401) {
                setError("Has alcanzado el límite de 3 generaciones gratuitas. ¡Loguéate con Google para guardar tus documentos y seguir!");
              } else if (message.error?.code === "INVALID_CV_CONTENT") {
                setError(t("wizard.error_invalid_cv") || "El archivo no parece ser un CV válido.");
              } else if (message.error?.code === "SCRAPER_BLOCKED") {
                setError(t("wizard.error_scraper_blocked") || message.error.message);
                setTimeout(() => jobTextRef.current?.focus(), 100);
              } else {
                setError(message.error?.message || "Error en la generación");
              }
              setIsUploading(false);
              return;
            }
          } catch (e) {
            console.warn("Error parsing stream chunk:", e);
          }
        }
      }
    } catch (err: any) {
      setError(err.name === "AbortError" ? "La solicitud tardó demasiado." : err.message);
      setIsUploading(false);
    }
  };

  if (isUploading) {
    return <WizardLoading currentStep={currentStep} />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-5xl mx-auto">
      <WizardHero />

      {/* Form Area */}
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-200 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] p-6 md:p-8 flex flex-col gap-8">
        
        <CVInput 
          cvFile={cvFile}
          cvText={cvText}
          onFileChange={handleCvFileChange}
          onTextChange={handleCvTextChange}
        />

        <JobInput 
          jobUrl={jobUrl}
          jobText={jobText}
          onUrlChange={setJobUrl}
          onTextChange={setJobText}
          jobTextRef={jobTextRef}
        />

        {/* Errors Area */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/50 rounded-lg text-sm font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Final CTA Area */}
        <div className="pt-2">
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold tracking-tight py-3.5 px-6 rounded-xl shadow-sm dark:shadow-[inset_0_1px_rgba(255,255,255,0.15)] flex items-center justify-center transition-all active:scale-[0.98]"
          >
            {t("hero.cta")}
          </button>
          <p className="mt-5 text-center text-[11px] text-gray-500 dark:text-slate-400 font-medium">
            {t("wizard.language_hint")}
          </p>        </div>
      </div>
    </div>
  );
}
