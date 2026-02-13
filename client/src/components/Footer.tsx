import { Phone, Mail, MapPin, ArrowUp } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { trpc } from "@/lib/trpc";

const DEFAULT_LOGO = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/BEtRgbusNNpRjAtj.png";

// Map known CMS slugs to existing static routes
const STATIC_ROUTE_MAP: Record<string, string> = {
  "about": "/about",
  "services": "/services",
  "properties": "/properties",
  "projects": "/projects",
  "contact": "/contact",
  "property-management": "/services",
  "add-property": "/add-property",
  "request-property": "/request-property",
};

function FooterCMSPages({ isAr }: { isAr: boolean }) {
  const { data: cmsPages } = trpc.public.listPublishedPages.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Filter to only show pages that are NOT already in the main nav (about, services, properties, projects, contact)
  const mainNavSlugs = ["about", "services", "properties", "projects", "contact", "add-property", "request-property"];
  const extraPages = (cmsPages || []).filter(p => !mainNavSlugs.includes(p.slug));

  if (extraPages.length === 0) return null;

  return (
    <>
      {extraPages.map((page) => {
        const href = STATIC_ROUTE_MAP[page.slug] || `/page/${page.slug}`;
        const displayTitle = isAr ? page.title : (page.titleEn || page.title);
        return (
          <Link
            key={page.id}
            href={href}
            className="block text-white/50 hover:text-[#c8a45e] text-sm transition-colors"
          >
            {displayTitle}
          </Link>
        );
      })}
    </>
  );
}

export default function Footer() {
  const { t, isAr } = useLanguage();
  const { settings } = useSiteConfig();
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // Dynamic values from settings with fallbacks
  const phone = settings.phone || "920001911";
  const email = settings.email || "info@alqasem.com.sa";
  const address = isAr
    ? (settings.address || "الرياض - المملكة العربية السعودية")
    : (settings.addressEn || "Riyadh - Saudi Arabia");
  const logoUrl = settings.logo || DEFAULT_LOGO;
  const whatsapp = settings.whatsapp || "+966504466528";
  const instagram = settings.instagram || "https://www.instagram.com/alqasem_sa/";
  const twitter = settings.twitter || "https://x.com/alqasem_sa";
  const tiktok = settings.tiktok || "https://www.tiktok.com/@alqasem_sa";
  const snapchat = settings.snapchat || "";
  const linkedin = settings.linkedin || "";

  return (
    <footer className="bg-[#0a1628] pt-16 pb-8">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Column */}
          <div>
            <img src={logoUrl} alt={isAr ? "شركة القاسم العقارية" : "Al-Qasim Real Estate"} className="h-12 w-auto object-contain mb-5" />
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              {isAr
                ? "يقوم مبدأ العمل في شركة محمد بن عبد الرحمن القاسم العقارية على السمعة الطيبة والعلاقات الإيجابية مع العملاء."
                : "Mohammed bin Abdulrahman Al-Qasim Real Estate is built on a strong reputation and positive client relationships."}
            </p>
            <div className="space-y-3">
              <a href={`tel:${phone}`} className="flex items-center gap-2 text-white/50 hover:text-[#c8a45e] text-sm transition-colors">
                <Phone className="w-4 h-4 text-[#c8a45e] shrink-0" />
                <span dir="ltr">{phone}</span>
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-2 text-white/50 hover:text-[#c8a45e] text-sm transition-colors">
                <Mail className="w-4 h-4 text-[#c8a45e] shrink-0" />
                {email}
              </a>
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <MapPin className="w-4 h-4 text-[#c8a45e] shrink-0" />
                {address}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-5">
              {instagram && (
                <a href={instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#c8a45e]/20 transition-all">
                  <svg className="w-4 h-4 text-white/70" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              )}
              {twitter && (
                <a href={twitter} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#c8a45e]/20 transition-all">
                  <svg className="w-4 h-4 text-white/70" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              )}
              {tiktok && (
                <a href={tiktok} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#c8a45e]/20 transition-all">
                  <svg className="w-4 h-4 text-white/70" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V12.8a8.28 8.28 0 005.58 2.17V11.5a4.84 4.84 0 01-3.77-1.58V6.69z"/></svg>
                </a>
              )}
              {snapchat && (
                <a href={snapchat} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#c8a45e]/20 transition-all">
                  <svg className="w-4 h-4 text-white/70" fill="currentColor" viewBox="0 0 24 24"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.959-.289.105-.06.21-.09.3-.09.12 0 .24.03.33.09.36.21.54.54.54.87 0 .6-.6 1.05-1.35 1.35-.15.06-.33.12-.51.18-.12.03-.24.06-.36.09-.21.06-.39.12-.54.21-.18.12-.33.3-.42.54-.06.18-.09.39-.09.6 0 .03.003.06.006.09.003.03.006.06.006.09.21.36.66.66 1.08.87.42.21.87.39 1.29.51.15.03.3.06.42.12.6.21 1.02.6 1.02 1.08 0 .12-.03.24-.09.36-.15.33-.51.6-1.05.78-.27.09-.57.15-.87.18-.15.015-.3.03-.45.06-.15.03-.3.09-.39.18-.12.12-.18.3-.21.48-.03.12-.03.24-.03.36 0 .12.015.24.03.36.015.09.03.18.03.27 0 .12-.03.24-.09.33-.09.12-.21.21-.36.27-.15.06-.33.09-.51.09-.12 0-.27-.015-.42-.045-.3-.06-.6-.18-.87-.3-.36-.15-.75-.3-1.2-.42-.3-.09-.6-.12-.9-.12-.21 0-.42.015-.63.06-.6.12-1.08.45-1.56.78-.48.33-.96.72-1.62.72s-1.14-.39-1.62-.72c-.48-.33-.96-.66-1.56-.78-.21-.045-.42-.06-.63-.06-.3 0-.6.03-.9.12-.45.12-.84.27-1.2.42-.27.12-.57.24-.87.3-.15.03-.3.045-.42.045-.18 0-.36-.03-.51-.09-.15-.06-.27-.15-.36-.27-.06-.09-.09-.21-.09-.33 0-.09.015-.18.03-.27.015-.12.03-.24.03-.36 0-.12 0-.24-.03-.36-.03-.18-.09-.36-.21-.48-.09-.09-.24-.15-.39-.18-.15-.03-.3-.045-.45-.06-.3-.03-.6-.09-.87-.18-.54-.18-.9-.45-1.05-.78-.06-.12-.09-.24-.09-.36 0-.48.42-.87 1.02-1.08.12-.06.27-.09.42-.12.42-.12.87-.3 1.29-.51.42-.21.87-.51 1.08-.87.003-.03.006-.06.006-.09.003-.03.006-.06.006-.09 0-.21-.03-.42-.09-.6-.09-.24-.24-.42-.42-.54-.15-.09-.33-.15-.54-.21-.12-.03-.24-.06-.36-.09-.18-.06-.36-.12-.51-.18-.75-.3-1.35-.75-1.35-1.35 0-.33.18-.66.54-.87.09-.06.21-.09.33-.09.09 0 .195.03.3.09.3.17.66.273.96.29.198 0 .326-.046.401-.091-.008-.165-.018-.33-.03-.51l-.003-.06c-.104-1.628-.23-3.654.3-4.847C7.86 1.069 11.216.793 12.206.793z"/></svg>
                </a>
              )}
              {linkedin && (
                <a href={linkedin} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#c8a45e]/20 transition-all">
                  <svg className="w-4 h-4 text-white/70" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              )}
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-white font-bold mb-5 text-sm">
              {isAr ? "الشركة" : "Company"}
            </h4>
            <div className="space-y-3">
              <Link href="/about" className="block text-white/50 hover:text-[#c8a45e] text-sm transition-colors">{t("nav.about")}</Link>
              <Link href="/services" className="block text-white/50 hover:text-[#c8a45e] text-sm transition-colors">{t("nav.services")}</Link>
              <Link href="/projects" className="block text-white/50 hover:text-[#c8a45e] text-sm transition-colors">{t("nav.projects")}</Link>
              <Link href="/contact" className="block text-white/50 hover:text-[#c8a45e] text-sm transition-colors">{t("nav.contact")}</Link>
            </div>
          </div>

          {/* Properties Links */}
          <div>
            <h4 className="text-white font-bold mb-5 text-sm">
              {t("nav.properties")}
            </h4>
            <div className="space-y-3">
              <Link href="/properties" className="block text-white/50 hover:text-[#c8a45e] text-sm transition-colors">{isAr ? "جميع العقارات" : "All Properties"}</Link>
              <Link href="/properties?type=apartment" className="block text-white/50 hover:text-[#c8a45e] text-sm transition-colors">{isAr ? "شقق" : "Apartments"}</Link>
              <Link href="/properties?type=villa" className="block text-white/50 hover:text-[#c8a45e] text-sm transition-colors">{isAr ? "فلل" : "Villas"}</Link>
              <Link href="/properties?type=land" className="block text-white/50 hover:text-[#c8a45e] text-sm transition-colors">{isAr ? "أراضي" : "Lands"}</Link>
              <Link href="/add-property" className="block text-white/50 hover:text-[#c8a45e] text-sm transition-colors">{t("nav.addProperty")}</Link>
              <Link href="/request-property" className="block text-white/50 hover:text-[#c8a45e] text-sm transition-colors">{t("nav.requestProperty")}</Link>
            </div>
          </div>

          {/* Useful Links + Dynamic CMS Pages */}
          <div>
            <h4 className="text-white font-bold mb-5 text-sm">
              {isAr ? "روابط مفيدة" : "Useful Links"}
            </h4>
            <div className="space-y-3">
              <FooterCMSPages isAr={isAr} />
              {whatsapp && (
                <a href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/50 hover:text-green-400 text-sm transition-colors">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  {isAr ? "واتساب" : "WhatsApp"}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="h-px bg-white/10 mb-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-sm">
            {isAr
              ? "© جميع الحقوق محفوظة – شركة القاسم العقارية 2026."
              : "© All Rights Reserved – Al-Qasim Real Estate 2026."}
          </p>
          <button onClick={scrollToTop} className="w-10 h-10 bg-[#c8a45e]/20 hover:bg-[#c8a45e] text-[#c8a45e] hover:text-[#0f1b33] rounded-lg flex items-center justify-center transition-all">
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
