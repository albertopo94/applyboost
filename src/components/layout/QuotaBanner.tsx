"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import UserIcon from "lucide-react/dist/esm/icons/user";

interface QuotaBannerProps {
  remainingUses: number;
  isAnonymous: boolean;
  onLogin: () => void;
}

export function QuotaBanner({ remainingUses, isAnonymous, onLogin }: QuotaBannerProps) {
  const { t } = useLanguage();

  if (!isAnonymous) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100/50 dark:border-blue-800/20 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-blue-100/80 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <UserIcon className="h-3 w-3" />
        </div>
        <p className="text-[11px] font-medium text-blue-800/80 dark:text-blue-300/80">
          {t('editor.quota_banner', { count: remainingUses })}
        </p>
      </div>
      <button
        onClick={onLogin}
        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline px-2 py-0.5"
      >
        {t('editor.login_with_google')}
      </button>
    </motion.div>
  );
}
