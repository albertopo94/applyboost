import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const PremiumScoreHeader = ({ original, optimized }: { original: number; optimized: number }) => {
  const { t } = useLanguage();
  const improvement = optimized - original;

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 md:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl">
      <div className="flex items-center gap-4">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative h-14 w-14 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center border-2 border-blue-100 dark:border-blue-800/50">
            <span className="text-xl font-bold text-blue-700 dark:text-blue-400">{optimized}%</span>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {t('editor.score_title')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-2">
            {t('editor.score_subtitle')} 
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              +{improvement}%
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
        <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{t('editor.original')}</p>
          <p className="text-sm font-bold text-gray-600 dark:text-slate-300">{original}%</p>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-300" />
        <div className="px-3 py-1.5 rounded-lg bg-blue-600 shadow-lg shadow-blue-500/20 border border-blue-500">
          <p className="text-[10px] uppercase tracking-wider text-blue-100 font-bold">{t('editor.optimized')}</p>
          <p className="text-sm font-bold text-white">{optimized}%</p>
        </div>
      </div>
    </div>
  );
};
