"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export default function WizardHero() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col space-y-6 text-center lg:text-left">
      <h1 className="text-4xl md:text-5xl lg:text-[54px] font-extrabold text-gray-900 dark:text-slate-50 tracking-tight leading-[1.15]">
        {t("hero.title_1")}<br />
        <span className="text-blue-600 dark:text-blue-500">{t("hero.title_2")}</span>
      </h1>
      <p className="text-lg md:text-xl text-gray-500 dark:text-slate-400 leading-relaxed font-medium max-w-xl mx-auto lg:mx-0">
        {t("hero.subtitle")}
      </p>

      <div className="pt-6 hidden lg:flex flex-col gap-4 text-[15px] font-medium text-gray-600 dark:text-slate-400">
         <div className="flex items-center gap-3">
           <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm">1</div>
           {t("hero.step1")}
         </div>
         <div className="flex items-center gap-3">
           <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm">2</div>
           {t("hero.step2")}
         </div>
         <div className="flex items-center gap-3">
           <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm">3</div>
           {t("hero.step3")}
         </div>
      </div>
    </div>
  );
}
