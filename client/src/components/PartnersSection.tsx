import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSection, useSectionVisible } from "@/contexts/SiteConfigContext";

const DEFAULT_PARTNERS_AR = ["بنك ساب SABB", "زهران", "عيادات أجيل", "بنقيث للسفر", "برجرايزر", "مجموعة الفيصلية", "شركة الراجحي", "مجموعة بن لادن"];
const DEFAULT_PARTNERS_EN = ["SABB Bank", "Zahran", "Ajeel Clinics", "Banqeeth Travel", "Burgerizer", "Al-Faisaliah Group", "Al-Rajhi Co.", "Bin Laden Group"];

export default function PartnersSection() {
  const { t, isAr } = useLanguage();
  const partnersSection = useSection("partners");
  const isVisible = useSectionVisible("partners");

  if (!isVisible) return null;

  const content = partnersSection?.content as any;

  // Read partners from DB content or use defaults
  const dbPartners = content?.partners;
  let partners: string[];

  if (dbPartners && Array.isArray(dbPartners) && dbPartners.length > 0) {
    partners = dbPartners.map((p: any) =>
      typeof p === "string" ? p : (isAr ? (p.nameAr || p.name || "") : (p.nameEn || p.name || ""))
    );
  } else {
    partners = isAr ? DEFAULT_PARTNERS_AR : DEFAULT_PARTNERS_EN;
  }

  // Section title from DB
  const sectionTitle = isAr ? (partnersSection?.title || "شركاؤنا") : "Our Partners";

  return (
    <section className="py-16 bg-white border-t border-b border-gray-100">
      <div className="container">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-10">
          <span className="text-[#E31E24] font-semibold text-sm mb-2 block tracking-wider">{t("partners.title")}</span>
          <h3 className="text-2xl font-bold text-[#0f1b33]">
            {isAr ? "عملاؤنا وشركاؤنا" : "Our Clients & Partners"}
          </h3>
        </motion.div>

        <div className="relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10" />
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="flex animate-marquee gap-8 items-center">
            {[...partners, ...partners].map((partner, i) => (
              <div key={`${partner}-${i}`} className="flex-shrink-0 px-8 py-4 bg-[#f8f5f0] border border-gray-100 rounded-xl">
                <span className="text-[#0f1b33]/60 font-semibold text-sm whitespace-nowrap">{partner}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
