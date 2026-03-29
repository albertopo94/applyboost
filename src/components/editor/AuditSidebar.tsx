import { AlertCircle, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface DiffItem {
  cambio: string;
  impacto: string;
  tipo?: "style" | "content" | "keyword";
}

export const AuditSidebar = ({ diff, explanation }: { diff: DiffItem[]; explanation?: string }) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-slate-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          {t('editor.audit_title')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          {t('editor.audit_subtitle')}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {explanation && (
          <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
            <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed italic">
              "{explanation}"
            </p>
          </div>
        )}

        <div className="space-y-4">
          {diff.map((item, idx) => (
            <div 
              key={idx}
              className="group p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 h-5 w-5 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <ChevronRight className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                    {item.cambio}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {item.impacto}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
