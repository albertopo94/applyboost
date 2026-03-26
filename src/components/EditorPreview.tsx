"use client";

import { 
  RefreshCw,
  LogIn,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEditor } from "@/hooks/useEditor";
import { cn } from "@/lib/utils";
import { PremiumScoreHeader } from "./editor/PremiumScoreHeader";
import { TabSwitcher } from "./editor/TabSwitcher";
import { AuditSidebar } from "./editor/AuditSidebar";
import { HighlightedContent } from "./editor/HighlightedContent";
import { ExportPanel } from "./editor/ExportPanel";

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
    free_uses_remaining?: number;
  };
}

export default function EditorPreview({ data }: EditorPreviewProps) {
  const {
    activeTab,
    setActiveTab,
    cvText,
    setCvText,
    clText,
    setClText,
    saveStatus,
    templateMode,
    setTemplateMode,
    isDownloading,
    isAnonymous,
    hasLimitReached,
    hasCL,
    handleLogin,
    handleDownload,
    t
  } = useEditor(data);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/20">
      <main className="max-w-[1600px] mx-auto p-4 sm:p-6 md:p-8">
        <PremiumScoreHeader 
          original={data.score_original} 
          optimized={data.score_optimizado} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-8">
          
          {/* Editor Area */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 dark:bg-slate-900/50 p-2 rounded-2xl border border-gray-100 dark:border-slate-800">
              <TabSwitcher 
                activeTab={activeTab} 
                onTabChange={setActiveTab} 
                hasCL={hasCL} 
              />
              
              <div className="flex items-center gap-3 px-2">
                <div className="flex items-center gap-2 h-7 px-3 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    saveStatus === "saving" ? "bg-amber-400 animate-pulse" : 
                    saveStatus === "saved" ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"
                  )} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {saveStatus === "saving" ? t('editor.status_saving') : 
                     saveStatus === "saved" ? t('editor.status_saved') : t('editor.status_idle')}
                  </span>
                </div>

                {isAnonymous && (
                  <button
                    onClick={handleLogin}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Login</span>
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl overflow-hidden h-full relative">
              <HighlightedContent 
                content={activeTab === "cv" ? cvText : clText}
                onUpdate={activeTab === "cv" ? setCvText : setClText}
                keywords={data.keywords}
                activeTab={activeTab}
              />

              {/* Limit Overlay */}
              <AnimatePresence>
                {hasLimitReached && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md z-40 flex items-center justify-center p-6"
                  >
                    <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 p-8 text-center">
                      <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Zap className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                        {t('editor.limit_title')}
                      </h3>
                      <p className="text-gray-500 dark:text-slate-400 mb-8 font-medium">
                        {t('editor.limit_subtitle')}
                      </p>
                      <button
                        onClick={handleLogin}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3"
                      >
                        <LogIn className="h-5 w-5" />
                        {t('editor.login_to_continue')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 lg:sticky lg:top-8 space-y-6">
            <ExportPanel 
              templateMode={templateMode}
              setTemplateMode={setTemplateMode}
              handleDownload={handleDownload}
              isDownloading={isDownloading}
              hasCL={hasCL}
            />
            
            <AuditSidebar 
              diff={data.diff} 
              explanation={data.cover_letter_explanation} 
            />
          </div>
        </div>
      </main>
    </div>
  );
}

