"use client";

import { useState, useEffect } from "react";
import { 
  Download, 
  AlertCircle, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  Zap, 
  ArrowRight,
  Layout,
  MessageSquare,
  ChevronRight,
  Cloud,
  Check,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useLanguage } from "@/contexts/LanguageContext";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

type Tab = "cv" | "cl";

interface DiffItem {
  cambio: string;
  impacto: string;
  tipo?: "style" | "content" | "keyword";
}

interface EditorPreviewProps {
  data: {
    generation_id: string;
    cv_optimizado: string;
    cover_letter: string;
    cover_letter_explanation?: string;
    score_original: number;
    score_optimizado: number;
    diff: DiffItem[];
    keywords: string[];
    falta_dato_fields?: string[];
  };
}

// --- Sub-components ---

const PremiumScoreHeader = ({ original, optimized }: { original: number; optimized: number }) => {
  const { t } = useLanguage();
  const improvement = optimized - original;
  
  return (
    <div className="flex items-center justify-between bg-white dark:bg-slate-900/40 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 mb-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
          <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h4 className="text-[13px] font-bold text-gray-900 dark:text-slate-100 leading-none">{t("editor.ats_score")}</h4>
          <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-1">{t("editor.ats_subtitle")}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider leading-none mb-1">{t("editor.original")}</span>
          <span className="text-sm font-bold text-gray-400">{original}%</span>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 dark:text-slate-700" />
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black text-blue-600 dark:text-blue-400 leading-none">{optimized}%</span>
            {improvement > 0 && (
              <span className="text-[10px] font-bold bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                +{improvement}%
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase text-gray-900 dark:text-slate-100 tracking-wider mt-1">{t("editor.optimized")}</span>
        </div>
      </div>
    </div>
  );
};

const TabSwitcher = ({ activeTab, onTabChange, hasCL }: { activeTab: Tab; onTabChange: (tab: Tab) => void; hasCL: boolean }) => {
  const { t } = useLanguage();
  
  return (
    <div className="inline-flex p-1 bg-gray-100 dark:bg-slate-900/80 rounded-xl mb-4 self-start relative border border-gray-200/50 dark:border-slate-800">
      <button
        onClick={() => onTabChange("cv")}
        className={cn(
          "relative z-10 px-4 py-1.5 text-xs font-bold transition-colors rounded-lg",
          activeTab === "cv" ? "text-blue-600 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
        )}
      >
        {activeTab === "cv" && (
          <motion.div 
            layoutId="activeTab" 
            className="absolute inset-0 bg-white dark:bg-blue-600 rounded-lg shadow-sm"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10">{t("editor.tabs.cv")}</span>
      </button>
      
      <button
        onClick={() => hasCL && onTabChange("cl")}
        disabled={!hasCL}
        className={cn(
          "relative z-10 px-4 py-1.5 text-xs font-bold transition-colors rounded-lg",
          activeTab === "cl" ? "text-blue-600 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200",
          !hasCL && "opacity-40 cursor-not-allowed"
        )}
      >
        {activeTab === "cl" && (
          <motion.div 
            layoutId="activeTab" 
            className="absolute inset-0 bg-white dark:bg-blue-600 rounded-lg shadow-sm"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10">{t("editor.tabs.cover_letter")}</span>
      </button>
    </div>
  );
};

const AuditSidebar = ({ diff, explanation }: { diff: DiffItem[]; explanation?: string }) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex flex-col gap-6">
      {/* Explanation Section */}
      {explanation && (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-200 dark:border-slate-700/50 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">
            <Sparkles className="w-4 h-4" />
            <h4 className="text-sm font-bold uppercase tracking-wider">{t("editor.sidebar.explanation")}</h4>
          </div>
          <p className="text-[13px] text-gray-600 dark:text-slate-300 leading-relaxed font-medium">
            {explanation}
          </p>
        </div>
      )}

      {/* Audit Trail Section */}
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-200 dark:border-slate-700/50 p-5 shadow-sm overflow-hidden relative">
        <div className="flex items-center gap-2 mb-6 text-gray-900 dark:text-slate-100">
          <Layout className="w-4 h-4 text-gray-400" />
          <h4 className="text-sm font-bold uppercase tracking-wider">{t("editor.sidebar.changes")}</h4>
        </div>

        <div className="relative pl-6 border-l border-gray-100 dark:border-slate-700 space-y-8">
          {diff.map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              {/* Timeline dot */}
              <div className="absolute -left-[29px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-500 border-2 border-white dark:border-slate-800 ring-4 ring-blue-50 dark:ring-blue-500/10" />
              
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-bold text-gray-900 dark:text-slate-100 leading-snug">
                  {item.cambio}
                </span>
                <span className="text-[12px] font-medium text-gray-500 dark:text-slate-400 leading-relaxed">
                  {item.impacto}
                </span>
                {item.tipo && (
                  <span className="mt-1 self-start text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-gray-50 dark:bg-slate-700/50 text-gray-400 dark:text-slate-500 border border-gray-100 dark:border-slate-700/50">
                    {item.tipo}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---

export default function EditorPreview({ data }: EditorPreviewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("cv");
  const [cvText, setCvText] = useState(data.cv_optimizado);
  const [clText, setClText] = useState(data.cover_letter || "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [templateMode, setTemplateMode] = useState<"simple" | "modern">("modern");
  const [isDownloading, setIsDownloading] = useState(false);
  const { t } = useLanguage();

  const hasCL = !!data.cover_letter;

  useEffect(() => {
    if (!hasCL && activeTab === "cl") {
      setActiveTab("cv");
      console.warn("Cover letter data missing. Defaulting to CV tab.");
    }
  }, [hasCL, activeTab]);

  // Auto-save debounce logic
  useEffect(() => {
    // Only save if text has changed from initial data
    const isCvChanged = cvText !== data.cv_optimizado;
    const isClChanged = clText !== (data.cover_letter || "");

    if (!isCvChanged && !isClChanged) {
      return;
    }

    setSaveStatus("saving");
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch("/api/cv/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            generation_id: data.generation_id,
            cv_text: cvText,
            cl_text: clText,
          }),
        });

        if (!res.ok) throw new Error("Save failed");
        
        setSaveStatus("saved");
        // Reset to idle after 3 seconds
        const resetTimeout = setTimeout(() => setSaveStatus("idle"), 3000);
        return () => clearTimeout(resetTimeout);
      } catch (err) {
        console.error("Auto-save error:", err);
        setSaveStatus("error");
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [cvText, clText, data.generation_id, data.cv_optimizado, data.cover_letter]);

  useEffect(() => {
    const disableCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };
    document.addEventListener("copy", disableCopy);
    return () => document.removeEventListener("copy", disableCopy);
  }, []);

  const handleDownload = async (type: Tab) => {
    setIsDownloading(true);
    
    try {
      const text = type === "cv" ? cvText : clText;
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          filename: type === "cv" ? "CV_Optimizado.pdf" : "Carta_Presentacion.pdf",
          type: type,
          templateMode: templateMode
        }),
      });

      // Si el backend devuelve 402, el usuario no tiene créditos: activar flujo de Stripe
      if (res.status === 402) {
        console.log("[EDITOR] User has no credits, triggering Stripe checkout...");
        const stripeRes = await fetch("/api/stripe/checkout", {
          method: "POST",
          body: JSON.stringify({ 
            priceId: "YOUR_PRICE_ID", // TODO: Configurar via env o config global
            type: type 
          }),
          headers: { "Content-Type": "application/json" }
        });
        
        const json = await stripeRes.json();
        if (json.url) {
          window.location.href = json.url;
          return;
        }
        throw new Error("Stripe checkout failed");
      }

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!res.ok) throw new Error("Export failed");

      // Success: Descargar el BLOB
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = type === "cv" ? "CV_Optimizado.pdf" : "Carta_Presentacion.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Download error:", err);
      alert(t("editor.export_error") || "Error al exportar el documento.");
    } finally {
      setIsDownloading(false);
    }
  };

  const HighlightedContent = ({ content, onUpdate }: { content: string, onUpdate: (val: string) => void }) => {
    let highlighted = content;
    if (activeTab === "cv") {
      data.keywords?.forEach((kw: string) => {
        const regex = new RegExp(`(${kw})`, "gi");
        highlighted = highlighted.replace(regex, `<span class="bg-blue-50 dark:bg-blue-500/20 font-medium text-blue-900 dark:text-blue-200 border-b border-blue-200 dark:border-blue-500/40">$1</span>`);
      });
    }

    return (
      <div 
        className="text-[14px] md:text-[15px] text-gray-800 dark:text-slate-300 leading-[1.8] whitespace-pre-wrap outline-none p-6 md:p-10 font-sans min-h-[500px]"
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onUpdate(e.currentTarget.innerText)}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto">
      
      {/* Columna Izquierda: Editor */}
      <div className="lg:col-span-8 flex flex-col">
        
        <PremiumScoreHeader 
          original={data.score_original} 
          optimized={data.score_optimizado} 
        />

        <div className="flex items-center justify-between gap-4">
          <TabSwitcher 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            hasCL={hasCL} 
          />
          
          <div className="flex items-center gap-2 mb-4 px-3 py-1 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
              {t("editor.editable")}
            </span>
          </div>
        </div>

        {/* Missing fields alert */}
        {data.falta_dato_fields && data.falta_dato_fields.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5 flex gap-4 text-sm shadow-sm mb-6">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-500" />
            <div>
              <p className="font-bold text-amber-900 dark:text-amber-400">{t("editor.missing_data")}</p>
              <p className="mt-1 font-medium text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                {t("editor.missing_desc")}
              </p>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700/50 rounded-2xl overflow-hidden flex flex-col shadow-[0_4px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_30px_rgb(0,0,0,0.2)]">
           <div className="bg-gray-50/50 dark:bg-slate-900/50 px-6 py-4 border-b border-gray-200 dark:border-slate-700/50 flex items-center justify-between">
             <div className="flex items-center gap-2.5 text-sm font-bold text-gray-900 dark:text-slate-100 tracking-tight">
                <FileText className="w-4 h-4 text-gray-400"/>
                {activeTab === "cv" ? t("editor.tabs.cv") : t("editor.tabs.cover_letter")}
             </div>
             
             <div className="flex items-center gap-4">
                {/* Save Status Indicator */}
                <AnimatePresence mode="wait">
                  {saveStatus !== "idle" && (
                    <motion.div 
                      key={saveStatus}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider",
                        saveStatus === "saving" && "text-blue-500 bg-blue-50/50 dark:bg-blue-500/10",
                        saveStatus === "saved" && "text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-500/10",
                        saveStatus === "error" && "text-red-500 bg-red-50/50 dark:bg-red-500/10"
                      )}
                    >
                      {saveStatus === "saving" && <RefreshCw className="w-3 h-3 animate-spin" />}
                      {saveStatus === "saved" && <Check className="w-3 h-3" />}
                      {saveStatus === "error" && <AlertCircle className="w-3 h-3" />}
                      <span>{t(`editor.${saveStatus}`)}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 bg-gray-100 dark:bg-slate-700 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Expert" className="w-full h-full object-cover grayscale opacity-80" />
                    </div>
                  ))}
                </div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Reviewed by AI</span>
             </div>
           </div>
           
           <div className="min-h-[600px] max-h-[900px] overflow-y-auto noscrollbar bg-white dark:bg-slate-800/50 relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <HighlightedContent 
                    content={activeTab === "cv" ? cvText : clText} 
                    onUpdate={activeTab === "cv" ? setCvText : setClText} 
                  />
                </motion.div>
              </AnimatePresence>
           </div>
        </div>
      </div>

      {/* Columna Derecha: Sidebar */}
      <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-6">
        
        {/* Export Panel */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-200 dark:border-slate-700/50 p-6 flex flex-col gap-5 shadow-sm">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-slate-50 tracking-tight">{t("editor.export_title")}</h3>
            <p className="text-[13px] font-medium text-gray-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              {t("editor.export_subtitle")}
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            {activeTab === "cv" && (
              <div className="mb-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5">
                  Estilo Visual
                </label>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-slate-900/50 p-1.5 rounded-xl border border-gray-100 dark:border-slate-700/50">
                  <button
                    onClick={() => setTemplateMode("simple")}
                    className={cn(
                      "px-3 py-2 rounded-lg text-xs font-semibold transition-all",
                      templateMode === "simple" 
                        ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-sm border border-gray-200 dark:border-slate-700" 
                        : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/50"
                    )}
                  >
                    Ejecutivo
                  </button>
                  <button
                    onClick={() => setTemplateMode("modern")}
                    className={cn(
                      "px-3 py-2 rounded-lg text-xs font-semibold transition-all",
                      templateMode === "modern" 
                        ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-sm border border-gray-200 dark:border-slate-700" 
                        : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/50"
                    )}
                  >
                    Moderno (2 Col)
                  </button>
                </div>
              </div>
            )}

            <button 
              onClick={() => handleDownload("cv")}
              disabled={isDownloading}
              className="group w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed active:scale-[0.98] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-between transition-all shadow-md dark:shadow-[inset_0_1px_rgba(255,255,255,0.15)] text-sm"
            >
              <div className="flex items-center gap-2">
                {isDownloading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isDownloading ? "Generando..." : t("editor.actions.download_cv")}
              </div>
              <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>
            
            {hasCL && (
              <button 
                onClick={() => handleDownload("cl")}
                disabled={isDownloading}
                className="group w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/80 hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/50 active:scale-[0.98] text-gray-800 dark:text-slate-200 font-bold py-3.5 px-4 rounded-xl flex items-center justify-between transition-all shadow-sm text-sm"
              >
                <div className="flex items-center gap-2">
                  {isDownloading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                  ) : (
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                  )}
                  {isDownloading ? "Generando..." : t("editor.actions.download_cl")}
                </div>
                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-gray-400">
            <div className="w-1 h-1 rounded-full bg-green-500" />
            <span>{t("editor.export_trust")}</span>
          </div>
        </div>

        {/* Audit Sidebar */}
        <AuditSidebar 
          diff={data.diff} 
          explanation={data.cover_letter_explanation} 
        />

      </div>
    </div>
  );
}
