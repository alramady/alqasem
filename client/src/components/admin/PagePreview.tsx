import { useState } from "react";
import { Monitor, Smartphone, Tablet, ExternalLink, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PagePreviewProps {
  title: string;
  slug: string;
  content: string;
  seoDescription?: string;
  status?: string;
}

const VIEWPORT_SIZES = {
  desktop: { width: "100%", label: "سطح المكتب", icon: Monitor },
  tablet: { width: "768px", label: "جهاز لوحي", icon: Tablet },
  mobile: { width: "375px", label: "جوال", icon: Smartphone },
} as const;

type ViewportKey = keyof typeof VIEWPORT_SIZES;

export default function PagePreview({ title, slug, content, seoDescription, status }: PagePreviewProps) {
  const [viewport, setViewport] = useState<ViewportKey>("desktop");

  const currentViewport = VIEWPORT_SIZES[viewport];

  return (
    <div className="flex flex-col h-full">
      {/* Preview Toolbar */}
      <div className="flex items-center justify-between bg-slate-800 rounded-t-xl px-4 py-2.5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          {/* Traffic light dots */}
          <div className="flex items-center gap-1.5 ml-3">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          {/* URL bar */}
          <div className="bg-slate-700/60 rounded-lg px-3 py-1.5 flex items-center gap-2 min-w-[200px]">
            <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xs text-slate-300 font-mono truncate" dir="ltr">
              alqasim.manus.space/page/{slug || "new-page"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Viewport toggles */}
          {(Object.entries(VIEWPORT_SIZES) as [ViewportKey, typeof VIEWPORT_SIZES[ViewportKey]][]).map(([key, { label, icon: Icon }]) => (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${viewport === key ? "bg-slate-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}
              onClick={() => setViewport(key)}
              title={label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
          <div className="w-px h-5 bg-slate-600 mx-1" />
          <Badge className="text-[10px] bg-slate-700 text-slate-300 border-0">
            {currentViewport.label}
          </Badge>
        </div>
      </div>

      {/* Preview Frame */}
      <div className="flex-1 bg-slate-100 rounded-b-xl overflow-hidden flex justify-center">
        <div
          className="bg-white h-full overflow-y-auto transition-all duration-300 shadow-lg"
          style={{
            width: currentViewport.width,
            maxWidth: "100%",
          }}
        >
          {/* Simulated Navbar */}
          <div className="bg-[#0f1b33] px-4 py-3 flex items-center justify-between" dir="rtl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg" />
              <span className="text-white/80 text-xs font-bold">شركة القاسم العقارية</span>
            </div>
            <div className="flex items-center gap-3">
              {["الرئيسية", "من نحن", "العقارات", "المشاريع"].map((item) => (
                <span key={item} className="text-white/40 text-[10px] hidden md:block">{item}</span>
              ))}
            </div>
          </div>

          {/* Hero Banner */}
          <section className="relative pt-12 pb-8 bg-[#0f1b33] overflow-hidden" dir="rtl">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(200,164,94,0.1) 10px, rgba(200,164,94,0.1) 20px)" }} />
            </div>
            <div className="relative z-10 px-6 text-center max-w-2xl mx-auto">
              <h1 className="text-xl md:text-2xl font-bold text-white mb-2">
                {title || "عنوان الصفحة"}
              </h1>
              {seoDescription && (
                <p className="text-sm text-white/60 leading-relaxed">
                  {seoDescription}
                </p>
              )}
              {/* Breadcrumb */}
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-white/40">
                <span className="hover:text-[#c8a45e] cursor-pointer">الرئيسية</span>
                <ArrowLeft className="w-3 h-3" />
                <span className="text-[#c8a45e]">{title || "عنوان الصفحة"}</span>
              </div>
            </div>
          </section>

          {/* Page Content */}
          <section className="py-8 md:py-12 px-6" dir="rtl">
            <div className="max-w-3xl mx-auto">
              {content ? (
                <div
                  className="cms-content prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <p className="text-slate-400 text-sm">لا يوجد محتوى بعد</p>
                  <p className="text-slate-300 text-xs mt-1">أضف محتوى في تبويب "المحتوى" لمشاهدة المعاينة</p>
                </div>
              )}
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-8 bg-[#f8f5f0] px-6" dir="rtl">
            <div className="text-center">
              <h2 className="text-lg font-bold text-[#0f1b33] mb-2">هل لديك استفسار؟</h2>
              <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto">نسعد بتواصلكم معنا ونحن جاهزون لخدمتكم</p>
              <div className="flex flex-wrap justify-center gap-3">
                <span className="bg-[#E31E24] text-white text-xs font-semibold px-5 py-2 rounded-sm cursor-default">تواصل معنا</span>
                <span className="border border-[#c8a45e]/40 text-[#c8a45e] text-xs font-semibold px-5 py-2 rounded-sm cursor-default">تصفح العقارات</span>
              </div>
            </div>
          </section>

          {/* Simulated Footer */}
          <div className="bg-[#0a1628] px-6 py-6" dir="rtl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white/10 rounded" />
                <span className="text-white/30 text-[10px]">شركة القاسم العقارية</span>
              </div>
              <span className="text-white/20 text-[10px]">© جميع الحقوق محفوظة 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-200 rounded-b-xl text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span>
            {status === "published" ? "✅ منشور" : status === "archived" ? "📦 مؤرشف" : "📝 مسودة"}
          </span>
          <span>•</span>
          <span>{content ? `${content.length} حرف` : "بدون محتوى"}</span>
        </div>
        <span className="font-mono text-[10px]" dir="ltr">/page/{slug || "..."}</span>
      </div>
    </div>
  );
}
