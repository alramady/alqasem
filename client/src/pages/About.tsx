import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Building2, Target, Eye, Award, Users, Home, TrendingUp, Shield, Loader2 } from "lucide-react";
import { DEFAULT_LOGO } from "@/lib/branding";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSection } from "@/contexts/SiteConfigContext";
import { trpc } from "@/lib/trpc";

export default function About() {
  const { t, isAr } = useLanguage();
  const aboutSection = useSection("about");

  // Fetch the CMS "about" page content from the pages table
  const { data: cmsPage, isLoading } = trpc.public.getPageBySlug.useQuery(
    { slug: "about" },
    { retry: false, staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const content = aboutSection?.content as any;

  // Stats from DB about section or defaults
  const defaultStats = [
    { icon: Building2, value: "25+", labelAr: "سنة من الخبرة", labelEn: "Years Experience" },
    { icon: TrendingUp, value: isAr ? "1 مليار+" : "1B+", labelAr: "ريال قيمة سوقية", labelEn: "SAR Market Value" },
    { icon: Home, value: "1000+", labelAr: "وحدة عقارية", labelEn: "Property Units" },
    { icon: Users, value: "500+", labelAr: "عميل سعيد", labelEn: "Happy Clients" },
  ];
  const STAT_ICONS = [Building2, TrendingUp, Home, Users];
  const dbHighlights = content?.highlights;
  const stats = (dbHighlights && Array.isArray(dbHighlights) && dbHighlights.length > 0)
    ? dbHighlights.map((h: any, i: number) => ({
        icon: STAT_ICONS[i % STAT_ICONS.length],
        value: isAr ? (h.value || h.valueAr || "") : (h.valueEn || h.value || ""),
        labelAr: h.labelAr || h.label || "",
        labelEn: h.labelEn || h.label || "",
      }))
    : defaultStats;

  // Mission/Vision/Values from DB or defaults
  const defaultMvv = [
    {
      icon: Target, titleAr: "رسالتنا", titleEn: "Our Mission", color: "#E31E24",
      textAr: "تقديم أرقى الخدمات العقارية بفكر ومنهج علمي من خلال منظومة عمل متكاملة مبنية على أسس وقواعد الاقتصاد الحديث وعن طريق نخبة من المستشارين والخبراء المختصين في المجال العقاري.",
      textEn: "Delivering premium real estate services through a scientific approach and integrated work system built on modern economic principles, led by elite consultants and real estate experts.",
    },
    {
      icon: Eye, titleAr: "رؤيتنا", titleEn: "Our Vision", color: "#c8a45e",
      textAr: "الإبداع فيما نقدمه من خدمات عقارية، وفق معايير ذات جودة عالية ووضع بصمة متميزة في مشاريعنا لتكون معالم فريدة مرتبطة بنهجنا وأسلوبنا.",
      textEn: "Innovation in our real estate services with high quality standards, creating a distinctive mark in our projects to become unique landmarks associated with our approach and style.",
    },
    {
      icon: Award, titleAr: "قيمنا", titleEn: "Our Values", color: "#0f1b33",
      textAr: "نؤمن بأن النجاح يبنى على الصدق والنزاهة والشفافية مع عملائنا. نسعى دائماً لتحقيق أعلى معايير الجودة والتميز في كل ما نقدمه من خدمات عقارية.",
      textEn: "We believe success is built on honesty, integrity, and transparency with our clients. We always strive to achieve the highest standards of quality and excellence in all our real estate services.",
    },
  ];
  const MVV_ICONS = [Target, Eye, Award];
  const MVV_COLORS = ["#E31E24", "#c8a45e", "#0f1b33"];
  const dbValues = content?.values;
  const mvv = (dbValues && Array.isArray(dbValues) && dbValues.length > 0)
    ? dbValues.map((v: any, i: number) => ({
        icon: MVV_ICONS[i % MVV_ICONS.length],
        titleAr: v.titleAr || v.title || "",
        titleEn: v.titleEn || v.title || "",
        textAr: v.textAr || v.text || "",
        textEn: v.textEn || v.text || "",
        color: MVV_COLORS[i % MVV_COLORS.length],
      }))
    : defaultMvv;

  // Story text from DB about section
  const storyP1 = isAr
    ? (content?.description || "يقوم مبدأ العمل في شركة محمد بن عبد الرحمن القاسم العقارية على السمعة الطيبة والعلاقات الإيجابية مع العملاء من خلال ترسيخ مفهوم الصدق والنزاهة في العمل وتحقيق الوعود والتطلعات أياً كانت.")
    : (content?.descriptionEn || "Mohammed bin Abdulrahman Al-Qasim Real Estate is built on a strong reputation and positive client relationships through establishing the principles of honesty and integrity in business and fulfilling all promises and aspirations.");

  const storyP2 = isAr
    ? (content?.description2 || "تفخر الشركة اليوم وبعد مضي ما يزيد عن 25 عاماً من العطاء بتوليها إدارة وتشغيل وتسويق العديد من العقارات التجارية والسكنية والتي تزيد إجمالي قيمتها السوقية عن مليار ريال سعودي.")
    : (content?.description2En || "Today, after over 25 years of dedication, the company proudly manages, operates, and markets numerous commercial and residential properties with a total market value exceeding one billion Saudi Riyals.");

  const whyUs = [
    { icon: Shield, titleAr: "موثوقية عالية", titleEn: "High Reliability", descAr: "أكثر من 25 عاماً من الثقة والمصداقية", descEn: "Over 25 years of trust and credibility" },
    { icon: Users, titleAr: "فريق متخصص", titleEn: "Expert Team", descAr: "نخبة من المستشارين والخبراء العقاريين", descEn: "Elite consultants and real estate experts" },
    { icon: TrendingUp, titleAr: "عوائد مضمونة", titleEn: "Guaranteed Returns", descAr: "استثمارات عقارية بعوائد مجزية", descEn: "Real estate investments with rewarding returns" },
    { icon: Award, titleAr: "جودة استثنائية", titleEn: "Exceptional Quality", descAr: "معايير عالمية في جميع مشاريعنا", descEn: "International standards in all our projects" },
  ];

  // If CMS page has HTML content, render it in the story section
  const hasCmsContent = cmsPage?.content && cmsPage.content.trim().length > 0;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative pt-32 pb-20 bg-[#0f1b33] overflow-hidden">
        <div className="absolute inset-0 opacity-5"><div className="absolute inset-0 geometric-pattern" /></div>
        <div className="container relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-3xl mx-auto">
            <span className="inline-block text-[#c8a45e] text-sm font-semibold tracking-wider mb-4 border border-[#c8a45e]/30 px-4 py-1.5 rounded-full">
              {isAr ? "تعرف علينا" : "Get to Know Us"}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {cmsPage?.title || (isAr ? "شركة القاسم العقارية" : "Al-Qasim Real Estate")}
            </h1>
            <p className="text-lg text-white/60 leading-relaxed">
              {cmsPage?.seoDescription || (isAr ? "شركة محمد بن عبد الرحمن القاسم العقارية - أكثر من 25 عاماً من التميز في القطاع العقاري" : "Mohammed bin Abdulrahman Al-Qasim Real Estate - Over 25 years of excellence in the real estate sector")}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="bg-[#c8a45e] py-8">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex flex-col items-center text-center">
                <stat.icon className="w-8 h-8 text-[#0f1b33] mb-2" />
                <span className="text-2xl md:text-3xl font-bold text-[#0f1b33]" dir="ltr">{stat.value}</span>
                <span className="text-sm text-[#0f1b33]/70 mt-1">{isAr ? stat.labelAr : stat.labelEn}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: isAr ? 30 : -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-[#E31E24] text-sm font-semibold tracking-wider mb-3 block">{isAr ? "قصتنا" : "Our Story"}</span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0f1b33] mb-6">
                {isAr ? "رحلة تمتد لأكثر من ربع قرن" : "A Journey Spanning Over a Quarter Century"}
              </h2>
              {hasCmsContent ? (
                <div className="cms-content text-gray-600 leading-relaxed text-lg" dangerouslySetInnerHTML={{ __html: cmsPage!.content! }} />
              ) : (
                <div className="space-y-4 text-gray-600 leading-relaxed text-lg">
                  <p>{storyP1}</p>
                  <p>{storyP2}</p>
                </div>
              )}
            </motion.div>
            <motion.div initial={{ opacity: 0, x: isAr ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <img src={content?.image || DEFAULT_LOGO} alt={isAr ? "القاسم العقارية" : "Al-Qasim Real Estate"} className="w-full h-full object-contain bg-[#0f1b33] p-12" />
              </div>
              <div className="absolute -bottom-6 -inset-inline-start-6 w-32 h-32 bg-[#c8a45e]/10 rounded-2xl -z-10" />
              <div className="absolute -top-6 -inset-inline-end-6 w-24 h-24 bg-[#E31E24]/10 rounded-2xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f8f5f0]">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            {mvv.map((item: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: `${item.color}15` }}>
                  <item.icon className="w-7 h-7" style={{ color: item.color }} />
                </div>
                <h3 className="text-xl font-bold text-[#0f1b33] mb-4">{isAr ? item.titleAr : item.titleEn}</h3>
                <p className="text-gray-600 leading-relaxed">{isAr ? item.textAr : item.textEn}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[#E31E24] text-sm font-semibold tracking-wider mb-3 block">{isAr ? "لماذا نحن" : "Why Us"}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0f1b33]">
              {isAr ? "ما يميز القاسم العقارية" : "What Sets Al-Qasim Apart"}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyUs.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center p-6 rounded-xl border border-gray-100 hover:border-[#c8a45e]/30 hover:shadow-md transition-all group">
                <div className="w-16 h-16 bg-[#0f1b33] rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#c8a45e] transition-colors">
                  <item.icon className="w-8 h-8 text-[#c8a45e] group-hover:text-[#0f1b33] transition-colors" />
                </div>
                <h3 className="font-bold text-[#0f1b33] mb-2">{isAr ? item.titleAr : item.titleEn}</h3>
                <p className="text-sm text-gray-500">{isAr ? item.descAr : item.descEn}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#0f1b33]">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {isAr ? "هل تبحث عن عقار مميز؟" : "Looking for a Premium Property?"}
          </h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto">
            {isAr ? "تواصل معنا اليوم ودع فريقنا المتخصص يساعدك في العثور على العقار المثالي" : "Contact us today and let our expert team help you find the perfect property"}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/contact" className="bg-[#E31E24] hover:bg-[#c91a1f] text-white font-semibold px-8 py-3 rounded-sm transition-all">{t("nav.contact")}</a>
            <a href="/properties" className="border border-[#c8a45e]/40 text-[#c8a45e] hover:bg-[#c8a45e] hover:text-[#0f1b33] font-semibold px-8 py-3 rounded-sm transition-all">{t("properties.viewAll")}</a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
