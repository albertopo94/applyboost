"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import UserIcon from "lucide-react/dist/esm/icons/user";

interface QuotaBannerProps {
  remainingUses: number;
  isAnonymous: boolean;
}

export function QuotaBanner({ remainingUses, isAnonymous }: QuotaBannerProps) {
  const { t } = useLanguage();

  if (!isAnonymous) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100/50 dark:border-blue-800/20 px-6 py-1.5 flex items-center justify-center gap-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded-full bg-blue-100/80 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <UserIcon className="h-2.5 w-2.5" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-800/60 dark:text-blue-300/60">
          {t('editor.quota_banner', { count: remainingUses })}
        </p>
      </div>
    </motion.div>
  );
}
