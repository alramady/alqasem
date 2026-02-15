import { motion } from "framer-motion";
import { Building2, Megaphone, Scale, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSection, useSectionVisible } from "@/contexts/SiteConfigContext";

const SERVICE_ICONS = [Building2, Megaphone, Scale];
const SERVICE_COLORS = [
  "from-[#0f1b33] to-[#1a2d4d]",
  "from-[#E31E24] to-[#c91a1f]",
  "from-[#c8a45e] to-[#a88a3e]",
];

// Default fallback data
const DEFAULT_SERVICES_AR = [
  {
    title: "إدارة الأملاك",
    description: "إدارة شاملة تتضمن الإشراف على صيانة العقار، تحصيل الإيجارات، والتواصل مع المستأجرين لرفع قيمة العقار وتعظيم العوائد.",
    features: ["تحصيل الإيجارات", "الصيانة الدورية", "التقارير المالية", "إدارة العقود"],
  },
  {
    title: "التسويق العقاري",
    description: "تسويق العقار عبر القنوات الرقمية والمنصات العقارية وجذب المستأجرين والمشترين المناسبين في أسرع وقت ممكن.",
    features: ["تصوير احترافي", "منصات رقمية", "جولات افتراضية", "تقارير الأداء"],
  },
  {
    title: "الاستشارات العقارية",
    description: "فرص استثمارية مدروسة بعناية مع تحليل شامل للعوائد والمخاطر في السوق العقاري السعودي وتقييم احترافي للعقارات.",
    features: ["تقييم العقارات", "دراسات الجدوى", "تحليل السوق", "الاستشارات القانونية"],
  },
];

const DEFAULT_SERVICES_EN = [
  {
    title: "Property Management",
    description: "Comprehensive management including property maintenance oversight, rent collection, and tenant communication to increase property value and maximize returns.",
    features: ["Rent Collection", "Regular Maintenance", "Financial Reports", "Contract Management"],
  },
  {
    title: "Real Estate Marketing",
    description: "Marketing properties through digital channels and real estate platforms, attracting suitable tenants and buyers in the shortest time possible.",
    features: ["Professional Photography", "Digital Platforms", "Virtual Tours", "Performance Reports"],
  },
  {
    title: "Real Estate Consulting",
    description: "Carefully studied investment opportunities with comprehensive analysis of returns and risks in the Saudi real estate market and professional property valuation.",
    features: ["Property Valuation", "Feasibility Studies", "Market Analysis", "Legal Consulting"],
  },
];

export default function ServicesSection() {
  const { t, lang, isAr } = useLanguage();
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;
  const servicesSection = useSection("services");
  const isVisible = useSectionVisible("services");

  if (!isVisible) return null;

  const content = servicesSection?.content as any;

  // Read services from DB content or use defaults
  const dbServices = content?.services;
  const defaultServices = isAr ? DEFAULT_SERVICES_AR : DEFAULT_SERVICES_EN;

  const mainServices = (dbServices && Array.isArray(dbServices) && dbServices.length > 0)
    ? dbServices.map((s: any, i: number) => ({
        icon: SERVICE_ICONS[i % SERVICE_ICONS.length],
        title: isAr ? (s.titleAr || s.title || "") : (s.titleEn || s.title || ""),
        description: isAr ? (s.descriptionAr || s.description || "") : (s.descriptionEn || s.description || ""),
        features: isAr ? (s.featuresAr || s.features || []) : (s.featuresEn || s.features || []),
        href: "/services",
        color: s.color || SERVICE_COLORS[i % SERVICE_COLORS.length],
      }))
    : defaultServices.map((s, i) => ({
        icon: SERVICE_ICONS[i],
        title: s.title,
        description: s.description,
        features: s.features,
        href: "/services",
        color: SERVICE_COLORS[i],
      }));

  // Section badge/title/subtitle — fully bilingual from DB with i18n fallback
  // DB content can store: badgeAr, badgeEn, titleAr, titleEn, subtitleAr, subtitleEn
  const sectionBadge = isAr
    ? (content?.badgeAr || servicesSection?.title || t("services.badge"))
    : (content?.badgeEn || t("services.badge"));

  const sectionTitle = isAr
    ? (content?.titleAr || t("services.title"))
    : (content?.titleEn || t("services.title"));

  const sectionSubtitle = isAr
    ? (content?.subtitleAr || servicesSection?.subtitle || t("services.subtitle"))
    : (content?.subtitleEn || t("services.subtitle"));

  return (
    <section id="services" className="py-20 bg-white">
      <div className="container">
        <div className="text-center mb-14">
          <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-[#E31E24] font-semibold text-sm mb-2 block tracking-wider">
            {sectionBadge}
          </motion.span>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-3xl lg:text-4xl font-bold text-[#0f1b33] mb-4">
            {sectionTitle}
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="text-gray-500 max-w-2xl mx-auto">
            {sectionSubtitle}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mainServices.map((service: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
              className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 flex flex-col h-full">
              <div className={`h-1.5 bg-gradient-to-l ${service.color}`} />
              <div className="p-8 flex flex-col flex-1">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#0f1b33] mb-3">{service.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">{service.description}</p>
                <div className="grid grid-cols-2 gap-2 mb-6 mt-auto">
                  {(service.features || []).map((f: string) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#c8a45e] shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <Link href={service.href}>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#0f1b33] hover:text-[#c8a45e] transition-colors cursor-pointer group/link">
                    {isAr ? "المزيد من التفاصيل" : "More Details"}
                    <ArrowIcon className="w-4 h-4 icon-directional transition-transform" />
                  </span>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
