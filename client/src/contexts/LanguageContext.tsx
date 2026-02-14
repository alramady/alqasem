import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "ar" | "en";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string) => string;
  dir: "rtl" | "ltr";
  isAr: boolean;
  isEn: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

// Import translations
import { ar } from "@/i18n/ar";
import { en } from "@/i18n/en";

const translations: Record<Language, Record<string, string>> = { ar, en };

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem("alqasim-lang");
    return (saved === "en" || saved === "ar") ? saved : "ar";
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("alqasim-lang", newLang);
  };

  const toggleLang = () => setLang(lang === "ar" ? "en" : "ar");

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations["ar"]?.[key] || key;
  };

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    // Set dir and lang on the html element
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", lang);
    // Font is now handled entirely by CSS rules in index.css
    // html[dir="rtl"] body and html[dir="ltr"] body
    // No need to set inline styles here
  }, [lang, dir]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, dir, isAr: lang === "ar", isEn: lang === "en" }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
