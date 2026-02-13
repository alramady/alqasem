import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Building2, Key, BarChart3, Scale, Wrench, FileText, Shield, Phone, MessageCircle, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSection } from "@/contexts/SiteConfigContext";
import { trpc } from "@/lib/trpc";

const SERVICE_ICONS = [Key, Wrench, BarChart3, Scale, Building2, FileText];

export default function Services() {
  const { t, isAr, dir } = useLanguage();
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;
  const servicesSection = useSection("services");

  // Fetch the CMS "services" page content from the pages table
  const { data: cmsPage } = trpc.public.getPageBySlug.useQuery(
    { slug: "services" },
    { retry: false, staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const content = servicesSection?.content as any;

  // Read services from DB or use defaults
  const defaultServices = [
    { icon: Key, titleAr: "التأجير والتحصيل", titleEn: "Leasing & Collection", descAr: "إدارة عمليات التأجير بالكامل من البحث عن المستأجرين المناسبين وتوقيع العقود وتحصيل الإيجارات بانتظام مع متابعة دورية.", descEn: "Complete leasing management from finding suitable tenants, signing contracts, and regular rent collection with periodic follow-up." },
    { icon: Wrench, titleAr: "الصيانة والتشغيل", titleEn: "Maintenance & Operations", descAr: "صيانة شاملة ودورية للعقارات لضمان الحفاظ على قيمتها وجودتها مع فريق فني متخصص متاح على مدار الساعة.", descEn: "Comprehensive and periodic property maintenance to preserve value and quality with a specialized technical team available 24/7." },
    { icon: BarChart3, titleAr: "التقارير المالية", titleEn: "Financial Reports", descAr: "تقارير مالية دورية ومفصلة عن أداء العقارات والإيرادات والمصروفات مع تحليل شامل للعوائد الاستثمارية.", descEn: "Periodic and detailed financial reports on property performance, revenue, and expenses with comprehensive investment return analysis." },
    { icon: Scale, titleAr: "الاستشارات القانونية", titleEn: "Legal Consulting", descAr: "دعم قانوني متكامل في جميع المسائل العقارية من عقود الإيجار والبيع إلى حل النزاعات والتمثيل القانوني.", descEn: "Comprehensive legal support in all real estate matters from lease and sale contracts to dispute resolution and legal representation." },
    { icon: Building2, titleAr: "التسويق العقاري", titleEn: "Real Estate Marketing", descAr: "تسويق احترافي للعقارات عبر قنوات متعددة لضمان الوصول لأكبر شريحة من العملاء المحتملين وتحقيق أفضل الأسعار.", descEn: "Professional property marketing through multiple channels to reach the widest range of potential clients and achieve the best prices." },
    { icon: FileText, titleAr: "التقييم العقاري", titleEn: "Property Valuation", descAr: "تقييم دقيق وموضوعي للعقارات بناءً على معايير السوق الحالية وتحليل المنطقة والمقارنة مع العقارات المماثلة.", descEn: "Accurate and objective property valuation based on current market standards, area analysis, and comparison with similar properties." },
  ];

  const dbServices = content?.services;
  const services = (dbServices && Array.isArray(dbServices) && dbServices.length > 0)
    ? dbServices.map((s: any, i: number) => ({
        icon: SERVICE_ICONS[i % SERVICE_ICONS.length],
        titleAr: s.titleAr || s.title || "",
        titleEn: s.titleEn || s.title || "",
        descAr: s.descriptionAr || s.description || "",
        descEn: s.descriptionEn || s.description || "",
      }))
    : defaultServices;

  const stats = [
    { value: "500+", labelAr: "وحدة عقارية مُدارة", labelEn: "Managed Units" },
    { value: "150+", labelAr: "عميل يثق بنا", labelEn: "Trusted Clients" },
    { value: "99%", labelAr: "نسبة التحصيل", labelEn: "Collection Rate" },
    { value: "24/7", labelAr: "دعم فني متواصل", labelEn: "Technical Support" },
  ];

  const steps = [
    { step: "01", titleAr: "التواصل", titleEn: "Contact", descAr: "تواصل معنا لمناقشة احتياجاتك العقارية", descEn: "Contact us to discuss your real estate needs" },
    { step: "02", titleAr: "التقييم", titleEn: "Assessment", descAr: "نقوم بتقييم شامل لعقارك وتحديد الخطة المناسبة", descEn: "We conduct a comprehensive assessment and determine the right plan" },
    { step: "03", titleAr: "التنفيذ", titleEn: "Execution", descAr: "نبدأ بتنفيذ خطة الإدارة المتفق عليها", descEn: "We begin executing the agreed management plan" },
    { step: "04", titleAr: "المتابعة", titleEn: "Follow-up", descAr: "تقارير دورية ومتابعة مستمرة لأداء عقارك", descEn: "Periodic reports and continuous monitoring of your property" },
  ];

  const faqs = [
    { qAr: "ما هي رسوم إدارة الأملاك؟", qEn: "What are the property management fees?", aAr: "تختلف الرسوم حسب نوع العقار وحجمه والخدمات المطلوبة. تواصل معنا للحصول على عرض سعر مخصص.", aEn: "Fees vary based on property type, size, and required services. Contact us for a customized quote." },
    { qAr: "كم يستغرق تأجير العقار؟", qEn: "How long does it take to lease a property?", aAr: "نسعى لتأجير العقار في أسرع وقت ممكن مع ضمان اختيار المستأجر المناسب. عادة ما يتم التأجير خلال 2-4 أسابيع.", aEn: "We aim to lease the property as quickly as possible while ensuring the right tenant. Usually completed within 2-4 weeks." },
    { qAr: "هل تقدمون خدمات الصيانة الطارئة؟", qEn: "Do you offer emergency maintenance?", aAr: "نعم، نوفر فريق صيانة متاح على مدار الساعة للتعامل مع أي حالات طارئة.", aEn: "Yes, we provide a maintenance team available 24/7 to handle any emergencies." },
    { qAr: "كيف أتابع أداء عقاري؟", qEn: "How can I track my property performance?", aAr: "نوفر تقارير مالية دورية شهرية وربع سنوية مفصلة عن أداء عقارك مع إمكانية الوصول لبوابة إلكترونية.", aEn: "We provide detailed monthly and quarterly financial reports on your property with access to an online portal." },
  ];

  // Page title from CMS page or defaults
  const pageTitle = cmsPage?.title || (isAr ? "نعظّم عوائد عقاراتك ونديرها بأمان تام" : "We Maximize Your Property Returns & Manage Them Safely");
  const pageDesc = cmsPage?.seoDescription || (isAr ? "نقدم حلول إدارة أملاك متكاملة تضمن لك راحة البال وعوائد مستدامة" : "We provide comprehensive property management solutions ensuring peace of mind and sustainable returns");

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative pt-32 pb-20 bg-[#0f1b33] overflow-hidden">
        <div className="absolute inset-0 opacity-5"><div className="absolute inset-0 geometric-pattern" /></div>
        <div className="container relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-3xl mx-auto">
            <span className="inline-block text-[#c8a45e] text-sm font-semibold tracking-wider mb-4 border border-[#c8a45e]/30 px-4 py-1.5 rounded-full">{t("services.badge")}</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">{pageTitle}</h1>
            <p className="text-lg text-white/60 leading-relaxed">{pageDesc}</p>
          </motion.div>
        </div>
      </section>

      <section className="bg-[#c8a45e] py-8">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <span className="text-2xl md:text-3xl font-bold text-[#0f1b33]" dir="ltr">{stat.value}</span>
                <span className="block text-sm text-[#0f1b33]/70 mt-1">{isAr ? stat.labelAr : stat.labelEn}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[#E31E24] text-sm font-semibold tracking-wider mb-3 block">{isAr ? "خدمات إدارة الأملاك" : "Property Management Services"}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0f1b33]">
              {isAr ? "حلول متكاملة لإدارة عقاراتك" : "Comprehensive Solutions for Managing Your Properties"}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-[#c8a45e]/30 hover:shadow-xl transition-all group">
                <div className="w-14 h-14 bg-[#0f1b33] rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#c8a45e] transition-colors">
                  <service.icon className="w-7 h-7 text-[#c8a45e] group-hover:text-[#0f1b33] transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-[#0f1b33] mb-3">{isAr ? service.titleAr : service.titleEn}</h3>
                <p className="text-gray-600 leading-relaxed">{isAr ? service.descAr : service.descEn}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* If CMS page has extra HTML content, render it */}
      {cmsPage?.content && cmsPage.content.trim().length > 0 && (
        <section className="py-16 bg-white">
          <div className="container max-w-4xl">
            <div className="cms-content" dangerouslySetInnerHTML={{ __html: cmsPage.content }} />
          </div>
        </section>
      )}

      <section className="py-20 bg-[#f8f5f0]">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[#E31E24] text-sm font-semibold tracking-wider mb-3 block">{isAr ? "كيف نعمل" : "How We Work"}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0f1b33]">
              {isAr ? "خطوات بسيطة لإدارة عقارك" : "Simple Steps to Manage Your Property"}
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="text-center relative">
                <div className="text-5xl font-bold text-[#c8a45e]/20 mb-4">{item.step}</div>
                <h3 className="text-lg font-bold text-[#0f1b33] mb-2">{isAr ? item.titleAr : item.titleEn}</h3>
                <p className="text-sm text-gray-500">{isAr ? item.descAr : item.descEn}</p>
                {i < 3 && <ArrowIcon className="hidden md:block absolute top-8 -inset-inline-end-4 w-6 h-6 text-[#c8a45e]/30" />}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container max-w-3xl">
          <div className="text-center mb-14">
            <span className="text-[#E31E24] text-sm font-semibold tracking-wider mb-3 block">{isAr ? "أسئلة شائعة" : "FAQ"}</span>
            <h2 className="text-3xl font-bold text-[#0f1b33]">{isAr ? "الأسئلة الأكثر شيوعاً" : "Frequently Asked Questions"}</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((item, i) => (
              <motion.details key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white border border-gray-100 rounded-xl p-6 group cursor-pointer">
                <summary className="flex items-center justify-between font-bold text-[#0f1b33] list-none">
                  {isAr ? item.qAr : item.qEn}
                  <CheckCircle className="w-5 h-5 text-[#c8a45e] shrink-0" />
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed">{isAr ? item.aAr : item.aEn}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#0f1b33]">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {isAr ? "جاهز لإدارة عقارك باحترافية؟" : "Ready to Manage Your Property Professionally?"}
          </h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto">
            {isAr ? "تواصل معنا اليوم واحصل على استشارة مجانية حول أفضل الحلول لإدارة عقارك" : "Contact us today for a free consultation on the best solutions for managing your property"}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/contact" className="bg-[#E31E24] hover:bg-[#c91a1f] text-white font-semibold px-8 py-3 rounded-sm transition-all flex items-center gap-2">
              <Phone className="w-4 h-4" />{t("nav.contact")}
            </a>
            <a href="https://wa.me/966500051679" target="_blank" rel="noopener noreferrer" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-sm transition-all flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />{isAr ? "واتساب" : "WhatsApp"}
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
