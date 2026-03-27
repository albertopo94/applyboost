"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import UserIcon from "lucide-react/dist/esm/icons/user";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";

interface QuotaBannerProps {
  remainingUses: number;
  isAnonymous: boolean;
}

export function QuotaBanner({ remainingUses, isAnonymous }: QuotaBannerProps) {
  const { t } = useLanguage();

  if (!isAnonymous) return null;

  const isOutOfQuota = remainingUses === 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${
        isOutOfQuota 
          ? "bg-amber-50/80 border-amber-100/80" 
          : "bg-blue-50/50 border-blue-100/50"
      } border-b px-6 py-1.5 flex items-center justify-center gap-4 transition-colors duration-500`}
    >
      <div className="flex items-center gap-3">
        <div className={`${
          isOutOfQuota 
            ? "bg-amber-100/80 text-amber-600" 
            : "bg-blue-100/80 text-blue-600"
        } w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-500`}>
          {isOutOfQuota ? (
            <AlertCircle className="h-2.5 w-2.5 animate-pulse" />
          ) : (
            <UserIcon className="h-2.5 w-2.5" />
          )}
        </div>
        <p className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-500 ${
          isOutOfQuota ? "text-amber-900/80" : "text-blue-800/60"
        }`}>
          {t('editor.quota_banner', { count: remainingUses })}
        </p>
      </div>
    </motion.div>
  );
}
