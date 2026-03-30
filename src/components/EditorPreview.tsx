"use client";

import { useEditor } from "@/hooks/useEditor";
import { PremiumScoreHeader } from "./editor/PremiumScoreHeader";
import { TabSwitcher } from "./editor/TabSwitcher";
import { AuditSidebar } from "./editor/AuditSidebar";
import { HighlightedContent } from "./editor/HighlightedContent";
import { ExportPanel } from "./editor/ExportPanel";
import { ExplanationPanel } from "./editor/ExplanationPanel";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface DiffItem {
  cambio: string;
  impacto: string;
  tipo?: "style" | "content" | "keyword";
}

interface EditorPreviewProps {
  data: {
    generation_id: string;
    cv_optimizado: string;
    cv_explanation?: string;
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

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = activeTab === "cv" ? cvText : clText;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <TabSwitcher 
                activeTab={activeTab} 
                onTabChange={setActiveTab} 
                hasCL={hasCL} 
              />
              
              {/* Markdown Hint - Moved here for better space utilization */}
              <div className="hidden sm:flex items-center text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-white/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 px-3 py-1.5 rounded-xl shadow-sm">
                {t('editor.markdown_hint')}
              </div>
            </div>

            {/* Main Editor Container */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl overflow-hidden relative group">
              
              {/* FIXED STATUS HEADER - Anchored to the parent, not affected by scroll bounce */}
              <div className="absolute -top-px -left-px -right-px z-30 px-6 py-4 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-b border-gray-100/50 dark:border-slate-800/50 flex items-center justify-between rounded-t-3xl">
                <div className="flex items-center gap-2.5 pointer-events-none select-none">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-3.5 h-3.5 rounded-full bg-blue-500/20 animate-ping" />
                    <div className="relative w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.7)]" />
                  </div>
                  <span className="text-[10px] font-black text-blue-700/70 dark:text-blue-400/70 uppercase tracking-[0.15em] antialiased">
                    {t('editor.editable')}
                  </span>
                </div>
                
                <button
                  onClick={handleCopy}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors group relative"
                  title="Copiar contenido"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-400 group-hover:text-blue-600 dark:text-slate-500 dark:group-hover:text-blue-400" />
                  )}
                </button>
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

            {/* WHY IT WORKS PANEL - Education & Trust Layer */}
            <ExplanationPanel 
              cvExplanation={data.cv_explanation}
              clExplanation={data.cover_letter_explanation}
              showCL={hasCL}
            />
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
