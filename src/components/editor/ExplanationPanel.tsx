"use client";

import { ShieldCheck, PenTool } from "lucide-react";

interface ExplanationPanelProps {
  cvExplanation?: string;
  clExplanation?: string;
  showCL?: boolean;
  t: (key: string) => string;
}

/**
 * ExplanationPanel: Muestra las razones técnicas de por qué el CV y la carta funcionan.
 * Localizado según el idioma de la página.
 */
export function ExplanationPanel({ 
  cvExplanation, 
  clExplanation, 
  showCL,
  t
}: ExplanationPanelProps) {
  if (!cvExplanation && !clExplanation) return null;

  return (
    <div className="mt-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CV Rationale (Left Column) */}
        {cvExplanation ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-blue-100 dark:border-white/5 p-6 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl transition-colors group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40">
                <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {t('editor.explanation_cv')}
              </h3>
            </div>
            <div className="h-[160px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
              <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-slate-600 dark:text-slate-400 leading-relaxed">
                {cvExplanation}
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:block" />
        )}

        {/* Cover Letter Rationale (Right Column) */}
        {showCL && clExplanation && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-100 dark:border-white/5 p-6 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl transition-colors group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40">
                <PenTool className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {t('editor.explanation_cl')}
              </h3>
            </div>
            <div className="h-[160px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
              <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-slate-600 dark:text-slate-400 leading-relaxed">
                {clExplanation}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
