"use client";

import { ShieldCheck, PenTool } from "lucide-react";

interface ExplanationPanelProps {
  cvExplanation?: string;
  clExplanation?: string;
  showCL?: boolean;
}

/**
 * ExplanationPanel: Muestra las razones técnicas de por qué el CV y la carta funcionan.
 * Orden estricto y simétrico: 
 * - Izquierda: "Perché questo curriculum funziona" (ShieldCheck)
 * - Derecha: "Perché questa lettera funziona" (PenTool)
 */
export function ExplanationPanel({ 
  cvExplanation, 
  clExplanation, 
  showCL 
}: ExplanationPanelProps) {
  if (!cvExplanation && !clExplanation) return null;

  return (
    <div className="mt-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CV Rationale (Always Left Column if present) */}
        {cvExplanation ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-blue-100 dark:border-blue-900/30 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Perché questo curriculum funziona
              </h3>
            </div>
            <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-slate-600 dark:text-slate-400 leading-relaxed">
              {cvExplanation}
            </div>
          </div>
        ) : (
          <div className="hidden md:block" /> /* Spacer to maintain CL on the right */
        )}

        {/* Cover Letter Rationale (Always Right Column) */}
        {showCL && clExplanation && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-100 dark:border-amber-900/30 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <PenTool className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Perché questa lettera funziona
              </h3>
            </div>
            <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-slate-600 dark:text-slate-400 leading-relaxed">
              {clExplanation}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
