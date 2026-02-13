import { useState, useEffect } from "react";
import { Menu, X, Phone, Mail, ChevronDown, Globe, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

const DEFAULT_LOGO = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/BEtRgbusNNpRjAtj.png";

export default function Navbar() {
  const { t, lang, toggleLang, isAr } = useLanguage();
  const { settings } = useSiteConfig();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [location] = useLocation();

  // Dynamic values from settings with fallbacks
  const phone = settings.phone || "920001911";
  const email = settings.email || "info@alqasem.com.sa";

  const logoUrl = settings.logo || DEFAULT_LOGO;
  const instagram = settings.instagram || "https://www.instagram.com/alqasem_sa/";
  const twitter = settings.twitter || "https://x.com/alqasem_sa";
  const tiktok = settings.tiktok || "https://www.tiktok.com/@alqasem_sa";

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/about", label: t("nav.about") },
    {
      href: "/properties", label: t("nav.properties"), children: [
        { href: "/properties?type=apartment", label: t("nav.apartments") },
        { href: "/properties?type=villa", label: t("nav.villas") },
        { href: "/properties?type=land", label: t("nav.lands") },
        { href: "/properties?type=commercial", label: t("nav.commercial") },
      ]
    },
    { href: "/projects", label: t("nav.projects") },
    { href: "/services", label: t("nav.services") },
    { href: "/contact", label: t("nav.contact") },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <>
      {/* ===== TOP BAR ===== */}
      <div className={`fixed top-0 left-0 right-0 w-full z-50 bg-[#0a1628]/95 backdrop-blur-sm transition-all duration-300 ${scrolled ? "h-0 overflow-hidden opacity-0" : "h-10 opacity-100"}`}>
        {/* Desktop top bar */}
        <div className="hidden md:flex items-center justify-between w-full h-10 px-4 lg:px-8 text-xs text-white/70">
          <div className="flex items-center gap-4">
            {instagram && (
              <a href={instagram} target="_blank" rel="noopener noreferrer" className="hover:text-[#c8a45e] transition-colors">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            )}
            {twitter && (
              <a href={twitter} target="_blank" rel="noopener noreferrer" className="hover:text-[#c8a45e] transition-colors">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            )}
            {tiktok && (
              <a href={tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-[#c8a45e] transition-colors">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V12.8a8.28 8.28 0 005.58 2.17V11.5a4.84 4.84 0 01-3.77-1.58V6.69z"/></svg>
              </a>
            )}
          </div>
          <div className="flex items-center gap-5">
            <button onClick={toggleLang} className="flex items-center gap-1.5 hover:text-[#c8a45e] transition-colors" title={t("common.language")}>
              <Globe className="w-3 h-3" />
              <span>{t("common.langCode")}</span>
            </button>
            <a href={`mailto:${email}`} className="flex items-center gap-1.5 hover:text-[#c8a45e] transition-colors">
              <Mail className="w-3 h-3" />
              <span>{email}</span>
            </a>
            <a href={`tel:${phone}`} className="flex items-center gap-1.5 hover:text-[#c8a45e] transition-colors">
              <Phone className="w-3 h-3" />
              <span dir="ltr">{phone}</span>
            </a>

          </div>
        </div>

        {/* Mobile top bar - clean, minimal, no overflow */}
        <div className="flex md:hidden items-center justify-between w-full h-10 px-3 text-[11px] text-white/70">
          {/* Left: social icons only */}
          <div className="flex items-center gap-3">
            {instagram && (
              <a href={instagram} target="_blank" rel="noopener noreferrer" className="hover:text-[#c8a45e]">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            )}
            {twitter && (
              <a href={twitter} target="_blank" rel="noopener noreferrer" className="hover:text-[#c8a45e]">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            )}
            {tiktok && (
              <a href={tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-[#c8a45e]">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V12.8a8.28 8.28 0 005.58 2.17V11.5a4.84 4.84 0 01-3.77-1.58V6.69z"/></svg>
              </a>
            )}
            <button onClick={toggleLang} className="flex items-center gap-1 hover:text-[#c8a45e] transition-colors">
              <Globe className="w-3.5 h-3.5" />
              <span className="font-medium">{t("common.langCode")}</span>
            </button>
          </div>
          {/* Right: phone number only */}
          <a href={`tel:${phone}`} className="flex items-center gap-1.5 hover:text-[#c8a45e] transition-colors">
            <Phone className="w-3.5 h-3.5" />
            <span dir="ltr" className="font-medium">{phone}</span>
          </a>
        </div>
      </div>

      {/* ===== MAIN NAVBAR - full width edge to edge ===== */}
      <nav
        className={`fixed left-0 right-0 w-full z-50 transition-all duration-500 ${
          scrolled
            ? "top-0 bg-[#0f1b33]/95 backdrop-blur-md shadow-lg shadow-[#0a1628]/20"
            : "top-10 bg-[#0f1b33]/80 backdrop-blur-sm"
        }`}
      >
        <div className="flex items-center justify-between w-full h-20 px-3 sm:px-4 lg:px-8">
          {/* Logo - left edge */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <img
              src={logoUrl}
              alt={isAr ? "شركة القاسم العقارية" : "Al-Qasim Real Estate"}
              className="h-14 w-auto object-contain group-hover:scale-105 transition-transform"
            />
          </Link>

          {/* Desktop nav links - center */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <div
                key={link.href}
                className="relative"
                onMouseEnter={() => link.children && setActiveDropdown(link.href)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={link.href}
                  className={`px-4 py-2 text-sm transition-colors relative group flex items-center gap-1 ${
                    location === link.href ? "text-[#c8a45e]" : "text-white/80 hover:text-[#c8a45e]"
                  }`}
                >
                  {link.label}
                  {link.children && <ChevronDown className="w-3 h-3" />}
                  <span className={`absolute bottom-0 inset-inline-start-0 h-0.5 bg-[#c8a45e] transition-all duration-300 ${
                    location === link.href ? "w-full" : "w-0 group-hover:w-full"
                  }`} />
                </Link>
                {link.children && activeDropdown === link.href && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute top-full inset-inline-start-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 py-2 min-w-[180px] z-50"
                  >
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-4 py-2.5 text-sm text-[#0f1b33] hover:bg-[#f8f5f0] hover:text-[#c8a45e] transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          {/* Right side: CTA buttons + hamburger - right edge */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language toggle - visible when top bar is hidden (scrolled) */}
            <button
              onClick={toggleLang}
              className={`${scrolled ? "flex" : "hidden"} items-center gap-1.5 text-white/70 hover:text-[#c8a45e] transition-colors text-sm px-2 py-1 border border-white/20 rounded`}
              title={t("common.language")}
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{t("common.langCode")}</span>
            </button>
            <Link
              href="/favorites"
              className="relative text-white/70 hover:text-[#E31E24] transition-colors p-2"
              title={isAr ? "المفضلة" : "Favorites"}
            >
              <Heart className="w-5 h-5" />
            </Link>
            <Link
              href="/add-property"
              className="hidden md:flex items-center gap-2 border border-[#c8a45e]/40 text-[#c8a45e] hover:bg-[#c8a45e] hover:text-[#0f1b33] font-semibold px-4 py-2 rounded-sm transition-all text-sm"
            >
              {t("nav.addProperty")}
            </Link>
            <Link
              href="/request-property"
              className="hidden sm:flex items-center gap-2 bg-[#E31E24] hover:bg-[#c91a1f] text-white font-semibold px-5 py-2.5 rounded-sm transition-all text-sm"
            >
              <Phone className="w-4 h-4" />
              {t("nav.requestProperty")}
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden text-white p-2"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <div className={`h-px transition-all duration-500 ${scrolled ? "bg-[#c8a45e]/30" : "bg-transparent"}`} />
      </nav>

      {/* ===== MOBILE MENU ===== */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-[#0f1b33]/98 backdrop-blur-lg pt-32 px-6"
          >
            <div className="flex flex-col gap-2">
              <button
                onClick={toggleLang}
                className="flex items-center gap-2 text-white/70 hover:text-[#c8a45e] py-3 border-b border-white/10 transition-colors"
              >
                <Globe className="w-5 h-5" />
                <span className="text-lg">{t("common.language")}</span>
              </button>
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: isAr ? 30 : -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link
                    href={link.href}
                    className={`block text-xl py-4 border-b border-white/10 transition-colors ${
                      location === link.href ? "text-[#c8a45e]" : "text-white/90 hover:text-[#c8a45e]"
                    }`}
                  >
                    {link.label}
                  </Link>
                  {link.children && (
                    <div className="ps-6 flex flex-col gap-1 py-2">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="text-base text-white/60 hover:text-[#c8a45e] py-2 transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
              <div className="flex flex-col gap-3 mt-6">
                <Link
                  href="/add-property"
                  className="flex items-center justify-center gap-2 border border-[#c8a45e]/40 text-[#c8a45e] font-semibold px-6 py-4 rounded-sm text-lg"
                >
                  {t("nav.addProperty")}
                </Link>
                <Link
                  href="/request-property"
                  className="flex items-center justify-center gap-2 bg-[#E31E24] text-white font-semibold px-6 py-4 rounded-sm text-lg"
                >
                  <Phone className="w-5 h-5" />
                  {t("nav.requestProperty")}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
