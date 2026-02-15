import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSection, useSectionVisible } from "@/contexts/SiteConfigContext";
import { useState } from "react";

interface Partner {
  nameAr: string;
  nameEn: string;
  logo?: string;
}

const DEFAULT_PARTNERS: Partner[] = [
  { nameAr: "بنك ساب SABB", nameEn: "SABB Bank" },
  { nameAr: "زهران", nameEn: "Zahran Holding" },
  { nameAr: "عيادات أجيل", nameEn: "Ajeel Clinics" },
  { nameAr: "بنقيث للسفر", nameEn: "Bin Ghaith Travel" },
  { nameAr: "برجرايزر", nameEn: "Burgerizzr" },
  { nameAr: "مجموعة الفيصلية", nameEn: "Al Faisaliah Group" },
  { nameAr: "شركة الراجحي", nameEn: "Al Rajhi Holding" },
  { nameAr: "مجموعة بن لادن", nameEn: "Saudi Binladin Group" },
];

function PartnerCard({ partner, isAr }: { partner: Partner; isAr: boolean }) {
  const [imgError, setImgError] = useState(false);
  const name = isAr ? (partner.nameAr || partner.nameEn) : (partner.nameEn || partner.nameAr);

  return (
    <div className="flex-shrink-0 w-[160px] h-[100px] bg-[#f8f5f0] border border-gray-100 rounded-xl flex items-center justify-center p-4 hover:shadow-md transition-shadow">
      {partner.logo && !imgError ? (
        <img
          src={partner.logo}
          alt={name}
          className="max-w-full max-h-full object-contain"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <span className="text-[#0f1b33]/60 font-semibold text-sm text-center whitespace-nowrap">{name}</span>
      )}
    </div>
  );
}

export default function PartnersSection() {
  const { t, isAr } = useLanguage();
  const partnersSection = useSection("partners");
  const isVisible = useSectionVisible("partners");

  if (!isVisible) return null;

  const content = partnersSection?.content as any;

  // Read partners from DB content or use defaults
  const dbPartners = content?.partners;
  let partners: Partner[];
  if (dbPartners && Array.isArray(dbPartners) && dbPartners.length > 0) {
    partners = dbPartners.map((p: any) =>
      typeof p === "string"
        ? { nameAr: p, nameEn: p }
        : { nameAr: p.nameAr || p.name || "", nameEn: p.nameEn || p.name || "", logo: p.logo || undefined }
    );
  } else {
    partners = DEFAULT_PARTNERS;
  }

  // Section title from DB content (bilingual)
  const sectionBadge = isAr
    ? (content?.badgeAr || partnersSection?.title || t("partners.title"))
    : (content?.badgeEn || t("partners.title"));

  return (
    <section className="py-16 bg-white border-t border-b border-gray-100">
      <div className="container">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-10">
          <span className="text-[#E31E24] font-semibold text-sm mb-2 block tracking-wider">{sectionBadge}</span>
          <h3 className="text-2xl font-bold text-[#0f1b33]">
            {isAr ? "عملاؤنا وشركاؤنا" : "Our Clients & Partners"}
          </h3>
        </motion.div>

        <div className="relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10" />
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="flex animate-marquee gap-8 items-center">
            {[...partners, ...partners].map((partner, i) => (
              <PartnerCard key={`${partner.nameEn}-${i}`} partner={partner} isAr={isAr} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
