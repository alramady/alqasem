import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, FileText, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";

interface CMSPageProps {
  slug: string;
}

export default function CMSPage({ slug }: CMSPageProps) {
  const { isAr } = useLanguage();
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const { data: page, isLoading, error } = trpc.public.getPageBySlug.useQuery(
    { slug },
    { retry: false }
  );

  // Update document title when page loads
  useEffect(() => {
    if (page) {
      const title = page.seoTitle || page.title;
      document.title = `${title} | ${isAr ? "القاسم العقارية" : "Al-Qasim Real Estate"}`;
    }
    return () => {
      document.title = isAr
        ? "شركة محمد بن عبد الرحمن القاسم العقارية"
        : "Al-Qasem Real Estate";
    };
  }, [page, isAr]);

  // Update meta description
  useEffect(() => {
    if (page?.seoDescription) {
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
      }
      meta.content = page.seoDescription;
    }
  }, [page]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-32 pb-20 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-[#c8a45e] animate-spin" />
            <p className="text-gray-500">{isAr ? "جاري تحميل الصفحة..." : "Loading page..."}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-32 pb-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#0f1b33] mb-2">
              {isAr ? "الصفحة غير موجودة" : "Page Not Found"}
            </h2>
            <p className="text-gray-500 mb-6">
              {isAr
                ? "عذراً، الصفحة التي تبحث عنها غير متوفرة أو تم حذفها."
                : "Sorry, the page you're looking for is not available or has been removed."}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#0f1b33] text-white px-6 py-3 rounded-sm hover:bg-[#1a2b4a] transition-colors"
            >
              {isAr ? "العودة للرئيسية" : "Back to Home"}
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative pt-32 pb-16 bg-[#0f1b33] overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 geometric-pattern" />
        </div>
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              {isAr ? page.title : ((page as any).titleEn || page.title)}
            </h1>
            {page.seoDescription && (
              <p className="text-lg text-white/60 leading-relaxed">
                {page.seoDescription}
              </p>
            )}
          </motion.div>

          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 mt-8 text-sm text-white/40"
          >
            <Link href="/" className="hover:text-[#c8a45e] transition-colors">
              {isAr ? "الرئيسية" : "Home"}
            </Link>
            <ArrowIcon className="w-3 h-3" />
            <span className="text-[#c8a45e]">{isAr ? page.title : ((page as any).titleEn || page.title)}</span>
          </motion.div>
        </div>
      </section>

      {/* Page Content */}
      <section className="py-16 md:py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <div
              className="cms-content prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: (isAr ? page.content : ((page as any).contentEn || page.content)) || "" }}
            />
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#f8f5f0]">
        <div className="container text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0f1b33] mb-4">
            {isAr ? "هل لديك استفسار؟" : "Have a Question?"}
          </h2>
          <p className="text-gray-500 mb-8 max-w-xl mx-auto">
            {isAr
              ? "نسعد بتواصلكم معنا ونحن جاهزون لخدمتكم"
              : "We're happy to hear from you and ready to serve you"}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="bg-[#E31E24] hover:bg-[#c91a1f] text-white font-semibold px-8 py-3 rounded-sm transition-all"
            >
              {isAr ? "تواصل معنا" : "Contact Us"}
            </Link>
            <Link
              href="/properties"
              className="border border-[#c8a45e]/40 text-[#c8a45e] hover:bg-[#c8a45e] hover:text-[#0f1b33] font-semibold px-8 py-3 rounded-sm transition-all"
            >
              {isAr ? "تصفح العقارات" : "Browse Properties"}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
