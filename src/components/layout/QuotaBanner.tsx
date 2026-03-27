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
      className="bg-blue-50/50 border-b border-blue-100/50 px-6 py-1.5 flex items-center justify-center gap-2"
    >
      <UserIcon className="h-2.5 w-2.5 text-blue-800/60" />
      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-800/60">
        {t('editor.quota_banner', { count: remainingUses })}
      </p>
    </motion.div>
  );
}
