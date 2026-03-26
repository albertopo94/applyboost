"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import it from "@/dictionaries/it.json";

const dictionaries = { en, es, it };
export type Language = keyof typeof dictionaries;

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, options?: any) => any;
  dict: typeof es;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("app_lang") as Language;
    if (stored && dictionaries[stored]) {
      setLanguageState(stored);
    } else {
      const userLang = navigator.language.split("-")[0] as Language;
      setLanguageState(userLang in dictionaries ? userLang : "en");
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app_lang", lang);
  };

  const dict = dictionaries[language];

  const t = (path: string, options?: any): any => {
    let val = path.split(".").reduce((obj: any, key) => (obj && obj[key] !== undefined ? obj[key] : undefined), dict);
    if (val === undefined) return path;

    if (typeof val === 'string' && options) {
      Object.keys(options).forEach(key => {
        val = val.replace(`{${key}}`, options[key]);
      });
    }
    return val;
  };

  if (!mounted) {
    // Para evitar hydration mismatches en el Server Render, usamos el fallback
    return (
      <LanguageContext.Provider value={{ language: "en", setLanguage, t: (p, opt) => { 
        let val = p.split(".").reduce((obj: any, key) => (obj && obj[key] !== undefined ? obj[key] : undefined), en); 
        if (val === undefined) return p;
        if (typeof val === 'string' && opt) {
          Object.keys(opt).forEach(key => { val = val.replace(`{${key}}`, opt[key]); });
        }
        return val;
      }, dict: en }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dict }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
