import { motion } from "framer-motion";
import { FileText, MessageSquare } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

type Tab = "cv" | "cl";

export const TabSwitcher = ({ activeTab, onTabChange, hasCL }: { activeTab: Tab; onTabChange: (tab: Tab) => void; hasCL: boolean }) => {
  const { t } = useLanguage();

  return (
    <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-xl w-fit">
      <button
        onClick={() => onTabChange("cv")}
        className={cn(
          "relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg",
          activeTab === "cv" ? "text-blue-700 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
        )}
      >
        {activeTab === "cv" && (
          <motion.div layoutId="activeTab" className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm" />
        )}
        <span className="relative z-10 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {t('editor.tabs.cv')}
        </span>
      </button>

      {hasCL && (
        <button
          onClick={() => onTabChange("cl")}
          className={cn(
            "relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg",
            activeTab === "cl" ? "text-blue-700 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          {activeTab === "cl" && (
            <motion.div layoutId="activeTab" className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm" />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {t('editor.tabs.cover_letter')}
          </span>
        </button>
      )}
    </div>
  );
};
