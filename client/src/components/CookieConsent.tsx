import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Cookie, X } from "lucide-react";
import { Link } from "wouter";

const COOKIE_CONSENT_KEY = "alqasem_cookie_consent";

export default function CookieConsent() {
  const { isAr } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Show after a short delay so it doesn't block initial render
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[9999] p-4 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-4xl mx-auto bg-[#0f1b33] text-white rounded-2xl shadow-2xl border border-white/10 p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#c8a45e]/20 flex items-center justify-center shrink-0 mt-0.5">
            <Cookie className="w-5 h-5 text-[#c8a45e]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm mb-1">
              {isAr ? "سياسة ملفات تعريف الارتباط" : "Cookie Policy"}
            </h3>
            <p className="text-white/60 text-xs leading-relaxed">
              {isAr
                ? "نستخدم ملفات تعريف الارتباط الضرورية لتشغيل الموقع وحفظ تفضيلاتك (اللغة، المفضلات). لا نستخدم ملفات تعريف ارتباط تسويقية أو إعلانية. بمتابعة التصفح، فإنك توافق على سياسة الخصوصية الخاصة بنا."
                : "We use essential cookies to operate the site and save your preferences (language, favorites). We do not use marketing or advertising cookies. By continuing to browse, you agree to our privacy policy."}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <button
                onClick={accept}
                className="bg-[#c8a45e] text-[#0f1b33] px-5 py-2 rounded-lg text-xs font-bold hover:bg-[#b8944e] transition-colors"
              >
                {isAr ? "موافق" : "Accept"}
              </button>
              <button
                onClick={decline}
                className="bg-white/10 text-white px-5 py-2 rounded-lg text-xs font-semibold hover:bg-white/20 transition-colors"
              >
                {isAr ? "الضرورية فقط" : "Essential Only"}
              </button>
              <Link
                href="/privacy-policy"
                className="text-[#c8a45e] text-xs hover:underline"
              >
                {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
              </Link>
            </div>
          </div>
          <button
            onClick={decline}
            className="text-white/40 hover:text-white transition-colors shrink-0"
            aria-label={isAr ? "إغلاق" : "Close"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
