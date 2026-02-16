import { motion } from "framer-motion";
import { Award, Users, Building, TrendingUp, Eye, Target, BookOpen, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSection, useSectionVisible } from "@/contexts/SiteConfigContext";

const ABOUT_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/W9WfnwDA3fn2WAkBwinsES/sandbox/Hm9AYHv39MJR6DI7A3PrrF-img-3_1770673201000_na1fn_YWJvdXQtc2VjdGlvbg.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvVzlXZm53REEzZm4yV0FrQndpbnNFUy9zYW5kYm94L0htOUFZSHYzOU1KUjZESTdBM1ByckYtaW1nLTNfMTc3MDY3MzIwMTAwMF9uYTFmbl9ZV0p2ZFhRdGMyVmpkR2x2YmcuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=lX0wVbd62gABxHXfn68B9eoFRCDXjq-ae0oS02imhiXxe0T-a57VJA6u0wpeZGTUk~4CvQAmivgRgjZ6RxOEEClbAUWkUOWnnd9Xb3dyXgpZT5I2ibAh9ycgaEgZCaVAyPogTDTO4iqc0Mhrbv4UhDrskp6PVgrCV8hWN0TNekWUrHrFEjNZJx3TeY4Ll6kyR-LZ~JEdOGL4uj9VHaViuh1jAcpawE0oC9LBpBWaWavK1W2jo8ZdaVaQBbtpzfNfyfoHdCHw42A3AKa3JWCWBWMCGUL5Y5~8ikl9xHONANzgkzuqHUXEXDvI-7RyfdAjGPY7IbcXBQOPrjGjZKrtGw__";

const ICON_MAP: Record<string, any> = { Award, Users, Building, TrendingUp, Eye, Target, BookOpen };

// Default fallback data (used when DB content is empty)
const DEFAULT_HIGHLIGHTS_AR = [
  { value: "20+", label: "سنة خبرة" },
  { value: "5+ مليار", label: "ريال قيمة سوقية" },
  { value: "1000+", label: "وحدة مباعة" },
  { value: "16+", label: "مشروع مكتمل" },
];
const DEFAULT_HIGHLIGHTS_EN = [
  { value: "20+", label: "Years Experience" },
  { value: "5+ Billion", label: "SAR Market Value" },
  { value: "1000+", label: "Units Sold" },
  { value: "16+", label: "Completed Projects" },
];

const DEFAULT_VALUES_AR = [
  { title: "قصتنا", text: "تفخر الشركة اليوم وبعد مضي ما يزيد عن 25 عاماً من العطاء بتوليها إدارة وتشغيل وتسويق العديد من العقارات التجارية والسكنية والتي تزيد إجمالي قيمتها السوقية عن مليار ريال سعودي." },
  { title: "رسالتنا", text: "تقديم أرقى الخدمات العقارية بفكر ومنهج علمي من خلال منظومة عمل متكاملة مبنية على أسس وقواعد الاقتصاد الحديث وعن طريق نخبة من المستشارين والخبراء المختصين." },
  { title: "رؤيتنا", text: "الإبداع فيما نقدمه من خدمات عقارية، وفق معايير ذات جودة عالية ووضع بصمة متميزة في مشاريعنا لتكون معالم فريدة مرتبطة بنهجنا وأسلوبنا." },
];
const DEFAULT_VALUES_EN = [
  { title: "Our Story", text: "The company is proud today, after more than 25 years of dedication, to manage, operate, and market numerous commercial and residential properties with a total market value exceeding one billion Saudi Riyals." },
  { title: "Our Mission", text: "Providing the finest real estate services with a scientific approach through an integrated work system built on modern economic principles and through an elite group of specialized consultants and experts." },
  { title: "Our Vision", text: "Creativity in the real estate services we provide, according to high-quality standards, and leaving a distinctive mark on our projects to become unique landmarks associated with our approach and style." },
];

const VALUE_ICONS = [BookOpen, Target, Eye];

export default function AboutSection() {
  const { t, lang, isAr } = useLanguage();
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;
  const aboutSection = useSection("about");
  const isVisible = useSectionVisible("about");

  if (!isVisible) return null;

  const content = aboutSection?.content as any;

  // Read from DB content or fall back to defaults
  const description = (isAr ? content?.description : content?.descriptionEn) || (isAr
    ? "يقوم مبدأ العمل في شركة محمد بن عبد الرحمن القاسم العقارية على السمعة الطيبة والعلاقات الإيجابية مع العملاء من خلال ترسيخ مفهوم الصدق والنزاهة في العمل وتحقيق الوعود والتطلعات أياً كانت."
    : "The work principle at Mohammed bin Abdulrahman Al-Qasim Real Estate is built on a good reputation and positive relationships with clients through establishing the concept of honesty and integrity in work and fulfilling promises and aspirations.");

  const description2 = (isAr ? content?.description2 : content?.description2En) || (isAr
    ? "تتطلع شركة القاسم العقارية إلى أن تكون إحدى أكبر الشركات على المستوى المحلي والإقليمي وذلك بفضل الله ثم بتميزها وإبداعها في الخدمات العقارية."
    : "Al-Qasim Real Estate aspires to become one of the largest companies at the local and regional level, by the grace of God and through its excellence and creativity in real estate services.");

  // Highlights from DB
  const highlightIcons = [Award, Building, Users, TrendingUp];
  const dbHighlights = content?.highlights;
  const highlights = (dbHighlights && Array.isArray(dbHighlights) && dbHighlights.length > 0)
    ? dbHighlights.map((h: any, i: number) => ({
        icon: highlightIcons[i % highlightIcons.length],
        value: isAr ? (h.value || h.valueAr || "") : (h.valueEn || h.value || ""),
        label: isAr ? (h.labelAr || h.label || "") : (h.labelEn || h.label || ""),
      }))
    : (isAr ? DEFAULT_HIGHLIGHTS_AR : DEFAULT_HIGHLIGHTS_EN).map((h, i) => ({
        icon: highlightIcons[i],
        value: h.value,
        label: h.label,
      }));

  // Values (story, mission, vision) from DB
  const dbValues = content?.values;
  const values = (dbValues && Array.isArray(dbValues) && dbValues.length > 0)
    ? dbValues.map((v: any, i: number) => ({
        icon: VALUE_ICONS[i % VALUE_ICONS.length],
        title: isAr ? (v.titleAr || v.title || "") : (v.titleEn || v.title || ""),
        text: isAr ? (v.textAr || v.text || "") : (v.textEn || v.text || ""),
      }))
    : (isAr ? DEFAULT_VALUES_AR : DEFAULT_VALUES_EN).map((v, i) => ({
        icon: VALUE_ICONS[i],
        title: v.title,
        text: v.text,
      }));

  // Section title from DB
  const sectionTitle = isAr ? (aboutSection?.title || "من نحن") : "About Us";

  return (
    <section id="about" className="py-20 bg-white overflow-hidden">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: isAr ? 50 : -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="relative">
            <div className="relative rounded-2xl overflow-hidden">
              <img loading="lazy" src={(content?.image) || ABOUT_IMG} alt={isAr ? "شركة القاسم العقارية" : "Al-Qasim Real Estate"} className="w-full h-[480px] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1b33]/40 to-transparent" />
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
              className="absolute -bottom-6 inset-inline-end-6 bg-[#0f1b33] text-white p-6 rounded-xl shadow-2xl" style={{ insetInlineEnd: '1.5rem' }}>
              <div className="text-3xl font-bold text-[#c8a45e] mb-1">{highlights[0]?.value || "20+"}</div>
              <div className="text-sm text-white/70">{isAr ? "عاماً من التميز والعطاء" : "Years of Excellence"}</div>
            </motion.div>
            <div className="absolute -top-3 w-24 h-24 border-2 border-[#c8a45e]/30 rounded-xl -z-10" style={{ insetInlineStart: '-0.75rem' }} />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: isAr ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}>
            <span className="text-[#E31E24] font-semibold text-sm mb-3 block tracking-wider">{isAr ? "نبذة عن الشركة" : "About the Company"}</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0f1b33] mb-6 leading-tight">
              {isAr ? "شركة محمد بن عبد الرحمن" : "Mohammed bin Abdulrahman"}
              <span className="block text-[#c8a45e] text-2xl lg:text-3xl mt-2">{isAr ? "القاسم العقارية" : "Al-Qasim Real Estate"}</span>
            </h2>
            <p className="text-gray-500 leading-relaxed mb-4">{description}</p>
            <p className="text-gray-500 leading-relaxed mb-8">{description2}</p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {highlights.map((item: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.1 }}
                  className="p-4 bg-[#f8f5f0] rounded-xl">
                  <item.icon className="w-5 h-5 text-[#c8a45e] mb-2" />
                  <div className="text-xl font-bold text-[#0f1b33]">{item.value}</div>
                  <div className="text-xs text-gray-400">{item.label}</div>
                </motion.div>
              ))}
            </div>
            <Link href="/about">
              <span className="inline-flex items-center gap-2 bg-[#0f1b33] hover:bg-[#1a2d4d] text-white font-semibold px-6 py-3 rounded-lg transition-all cursor-pointer group">
                {t("about.learnMore")}
                <ArrowIcon className="w-4 h-4 icon-directional transition-transform" />
              </span>
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
          {values.map((item: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
              className="p-8 bg-[#f8f5f0] rounded-2xl group hover:bg-[#0f1b33] transition-all duration-500">
              <div className="w-12 h-12 bg-[#c8a45e]/20 group-hover:bg-[#c8a45e]/30 rounded-xl flex items-center justify-center mb-5 transition-colors">
                <item.icon className="w-6 h-6 text-[#c8a45e]" />
              </div>
              <h3 className="text-xl font-bold text-[#0f1b33] group-hover:text-[#c8a45e] mb-3 transition-colors">{item.title}</h3>
              <p className="text-gray-500 group-hover:text-white/70 leading-relaxed text-sm transition-colors">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
