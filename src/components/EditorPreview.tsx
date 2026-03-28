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
  // Build Guard: Protect against null data during static generation
  if (!data) return null;

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
              onTabChange={setActiveTab} 
              hasCL={hasCL} 
            />

            {/* Main Editor Container */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl overflow-hidden relative group h-full">
              
              {/* FIXED STATUS HEADER - Anchored to the parent, not affected by scroll bounce */}
              <div className="absolute top-0 left-0 right-0 z-30 w-full px-6 py-4 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-b border-gray-100/50 dark:border-slate-800/50 flex items-center justify-between pointer-events-none select-none rounded-t-3xl">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-3.5 h-3.5 rounded-full bg-blue-500/20 animate-ping" />
                    <div className="relative w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.7)]" />
                  </div>
                  <span className="text-[10px] font-black text-blue-700/70 dark:text-blue-400/70 uppercase tracking-[0.15em] antialiased">
                    {t('editor.editable')}
                  </span>
                </div>
                
                {/* Subtle decorative element for mobile hint */}
                <div className="w-10 h-1 rounded-full bg-slate-200/40 dark:bg-slate-800/40 sm:hidden" />
              </div>

              {/* Scrollable Area */}
              <div className="min-h-[600px] max-h-[900px] overflow-y-auto noscrollbar relative pt-12">
                <HighlightedContent 
                  content={activeTab === "cv" ? cvText : clText}
                  onUpdate={activeTab === "cv" ? setCvText : setClText}
                  keywords={data.keywords}
                  activeTab={activeTab}
                />
              </div>
              
              {/* Bottom Gradient Fade to indicate scrollable content */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-slate-900 to-transparent pointer-events-none z-10" />
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
            <ExportPanel 
              templateMode={templateMode}
              setTemplateMode={setTemplateMode}
              handleDownload={handleDownload}
              downloadingType={downloadingType}
              hasCL={hasCL}
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
