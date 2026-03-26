"use client";

import { Download, MessageSquare, ChevronRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportPanelProps {
  templateMode: "simple" | "modern";
  setTemplateMode: (mode: "simple" | "modern") => void;
  handleDownload: (type?: "cv" | "cl") => Promise<void>;
  downloadingType: "cv" | "cl" | null;
  hasCL: boolean;
}

export function ExportPanel({
  templateMode,
  setTemplateMode,
  handleDownload,
  downloadingType,
  hasCL
}: ExportPanelProps) {
  const isDownloading = downloadingType !== null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl overflow-hidden p-6 space-y-6">
      <div>
        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">Panel de Exportación</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Configura y descarga tu contenido optimizado.</p>
      </div>

      {/* Template Selection */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
          Estilo del Template
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setTemplateMode("simple")}
            className={cn(
              "px-4 py-3 rounded-2xl text-sm font-bold transition-all border-2",
              templateMode === "simple"
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-600 dark:text-blue-400 shadow-sm"
                : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-500 hover:border-gray-200 dark:hover:border-slate-600"
            )}
          >
            Ejecutivo
          </button>
          <button
            onClick={() => setTemplateMode("modern")}
            className={cn(
              "px-4 py-3 rounded-2xl text-sm font-bold transition-all border-2",
              templateMode === "modern"
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-600 dark:text-blue-400 shadow-sm"
                : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-500 hover:border-gray-200 dark:hover:border-slate-600"
            )}
          >
            Moderno
          </button>
        </div>
      </div>

      {/* Download Buttons */}
      <div className="space-y-3 pt-2">
        <button
          onClick={() => handleDownload("cv")}
          disabled={isDownloading}
          className="w-full flex items-center justify-between p-4 bg-blue-600 text-white rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 group shadow-lg shadow-blue-600/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
              {downloadingType === "cv" ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            </div>
            <div className="text-left">
              <div className="text-sm font-black">Descargar CV</div>
              <div className="text-[10px] opacity-60 font-bold uppercase tracking-tight">PDF Optimizado</div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>

        {hasCL && (
          <button
            onClick={() => handleDownload("cl")}
            disabled={isDownloading}
            className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                {downloadingType === "cl" ? <RefreshCw className="h-5 w-5 animate-spin" /> : <MessageSquare className="h-5 w-5" />}
              </div>
              <div className="text-left">
                <div className="text-sm font-black">Descargar Carta</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">PDF de Presentación</div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>
        )}
      </div>
    </div>
  );
}
