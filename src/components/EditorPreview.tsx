"use client";

import { useEditor } from "@/hooks/useEditor";
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
    usage_count?: number;
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
            
            <PremiumScoreHeader 
              original={data.score_original} 
              optimized={data.score_optimizado} 
            />

            <TabSwitcher 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              hasCL={hasCL} 
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-2 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  <span className="text-[10px] font-black text-blue-700/60 dark:text-blue-400/60 uppercase tracking-wider">{t('editor.editable')}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
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
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
            <ExportPanel 
              templateMode={templateMode}
              setTemplateMode={setTemplateMode}
              onDownload={handleDownload}
              isDownloading={!!downloadingType}
              downloadingType={downloadingType}
              hasCL={hasCL}
              isAnonymous={isAnonymous}
              hasLimitReached={hasLimitReached}
              onLogin={handleLogin}
            />
            
            <AuditSidebar 
              explanation={data.cover_letter_explanation}
              diff={data.diff}
              activeTab={activeTab}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
