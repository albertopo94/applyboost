"use client";

import { 
  RefreshCw,
  LogIn,
  Zap,
  AlertTriangle
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
    downloadingType,
    isAnonymous,
    hasLimitReached,
    hasCL,
    handleLogin,
    handleDownload,
    t
  } = useEditor(data);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/20">
      <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Editor Area */}
          <div className="lg:col-span-8 space-y-6">
            {isAnonymous && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 rounded-2xl p-4 mb-6 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                    <Zap className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                    {t('editor.quota_banner', { count: data.free_uses_remaining ?? 0 })}
                  </p>
                </div>
                <button
                  onClick={handleLogin}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline text-sm ml-4 whitespace-nowrap"
                >
                  {t('editor.login_with_google')}
                </button>
              </motion.div>
            )}

            <PremiumScoreHeader 
              original={data.score_original} 
              optimized={data.score_optimizado} 
            />

            {data.falta_dato_fields && data.falta_dato_fields.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-4 flex gap-4 items-start shadow-sm"
              >
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-amber-900 dark:text-amber-100 leading-none mb-1">
                    {t('editor.missing_fields_title')}
                  </h4>
                  <p className="text-xs text-amber-800/70 dark:text-amber-400/70 font-medium leading-relaxed">
                    {t('editor.missing_fields_desc', { fields: data.falta_dato_fields.join(", ") })}
                  </p>
                </div>
              </motion.div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 p-2">
              <div className="flex items-center gap-4">
                <TabSwitcher 
                  activeTab={activeTab} 
                  onTabChange={setActiveTab} 
                  hasCL={hasCL} 
                />
                
                <div className="flex items-center gap-2 px-2 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  <span className="text-[10px] font-black text-blue-700/60 dark:text-blue-400/60 uppercase tracking-wider">{t('editor.editable')}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 h-7 px-3 rounded-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
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
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl overflow-hidden h-full relative">
              <div className="min-h-[600px] max-h-[900px] overflow-y-auto noscrollbar">
                <HighlightedContent 
                  content={activeTab === "cv" ? cvText : clText}
                  onUpdate={activeTab === "cv" ? setCvText : setClText}
                  keywords={data.keywords}
                  activeTab={activeTab}
                />
              </div>

              {/* Bottom Fade Effect */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-slate-900 to-transparent pointer-events-none z-10" />

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
              downloadingType={downloadingType}
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

