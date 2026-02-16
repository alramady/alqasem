import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, ChevronDown, Building2, Home, Landmark, Store, BedDouble, Bath } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteConfig, useSection } from "@/contexts/SiteConfigContext";
import { trpc } from "@/lib/trpc";

const DEFAULT_HERO_IMG = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/tcOWiOdepqYboEov.webp";

export default function HeroSection() {
  const { t, lang, isAr } = useLanguage();
  const { settings } = useSiteConfig();
  const heroSection = useSection("hero");
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [city, setCity] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");

  const { data: citiesWithDistricts } = trpc.public.getCitiesWithDistricts.useQuery();
  const { data: liveStats } = trpc.public.getHomepageStats.useQuery(undefined, {
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  // Dynamic hero image from settings or CMS
  const heroImg = settings.hero_image || (heroSection?.content as any)?.image || DEFAULT_HERO_IMG;

  // Dynamic stats: use live DB counts for properties/projects, CMS for other stats
  const cmsStats = (heroSection?.content as any)?.stats;
  const stats = (() => {
    // Build dynamic stats with live DB data
    const dynamicStats = [
      {
        value: `+${liveStats?.totalProperties || 17}`,
        label: isAr ? "عقار متاح" : "Available Properties",
        suffix: "",
      },
      {
        value: "+1200",
        label: isAr ? "عميل سعيد" : "Happy Clients",
        suffix: "",
      },
      {
        value: `+${liveStats?.totalProjects || 6}`,
        label: isAr ? "مشروع منجز" : "Completed Projects",
        suffix: "",
      },
      {
        value: "+25",
        label: isAr ? "سنة خبرة" : "Years Experience",
        suffix: "",
      },
    ];
    // If CMS has custom stats, merge dynamic counts into matching labels
    if (cmsStats && Array.isArray(cmsStats) && cmsStats.length > 0) {
      return cmsStats.map((s: any) => {
        const label = s.label || "";
        // Replace property count with live data
        if (label.includes("عقار") || label.toLowerCase().includes("propert")) {
          return { value: `+${liveStats?.totalProperties || 17}`, label: isAr ? (s.label_ar || s.label || "") : (s.label_en || s.label || ""), suffix: "" };
        }
        // Replace project count with live data
        if (label.includes("مشروع") || label.toLowerCase().includes("project")) {
          return { value: `+${liveStats?.totalProjects || 6}`, label: isAr ? (s.label_ar || s.label || "") : (s.label_en || s.label || ""), suffix: "" };
        }
        return {
          value: s.value || "",
          label: isAr ? (s.label_ar || s.label || "") : (s.label_en || s.label || ""),
          suffix: isAr ? (s.suffix_ar || s.suffix || "") : (s.suffix_en || s.suffix || ""),
        };
      });
    }
    return dynamicStats;
  })();

  const searchTabs = [t("hero.buy"), t("hero.rent"), t("hero.newProjects")];

  const propertyTypeOptions = [
    { label: t("hero.allTypes"), value: "all" },
    { label: isAr ? "شقة" : "Apartment", value: "apartment" },
    { label: isAr ? "فيلا" : "Villa", value: "villa" },
    { label: isAr ? "أرض" : "Land", value: "land" },
    { label: isAr ? "تجاري" : "Commercial", value: "commercial" },
  ];

  const quickCategories = [
    { icon: Home, label: t("nav.villas"), href: "/properties?type=villa" },
    { icon: Building2, label: t("nav.apartments"), href: "/properties?type=apartment" },
    { icon: Landmark, label: t("nav.lands"), href: "/properties?type=land" },
    { icon: Store, label: t("nav.commercial"), href: "/properties?type=commercial" },
  ];

  // Build search URL with filters
  const getSearchUrl = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (propertyType !== "all") params.set("type", propertyType);
    if (city !== "all") params.set("city", city);
    const listingType = activeTab === 0 ? "sale" : activeTab === 1 ? "rent" : "";
    if (listingType) params.set("listing", listingType);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (bedrooms) params.set("rooms", bedrooms);
    if (bathrooms) params.set("bathrooms", bathrooms);
    if (activeTab === 2) return "/projects";
    const qs = params.toString();
    return `/properties${qs ? `?${qs}` : ""}`;
  };

  return (
    <section id="hero" className="relative min-h-[90vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroImg} alt={isAr ? "القاسم العقارية" : "Al-Qasim Real Estate"} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1b33]/80 via-[#0f1b33]/60 to-[#0f1b33]/90" />
      </div>

      <div className="relative container pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-[#c8a45e]/15 border border-[#c8a45e]/30 text-[#c8a45e] px-5 py-2 rounded-full text-sm mb-6">
            <span className="w-2 h-2 bg-[#c8a45e] rounded-full animate-pulse" />
            {t("hero.badge")}
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
            {t("hero.title1")}{" "}
            <span className="text-[#c8a45e]">{t("hero.title2")}</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto mb-10">
            {t("hero.subtitle")}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
            <div className="flex border-b border-gray-100">
              {searchTabs.map((tab, i) => (
                <button key={tab} onClick={() => setActiveTab(i)}
                  className={`flex-1 py-3.5 text-sm font-semibold transition-all relative ${activeTab === i ? "text-[#E31E24]" : "text-gray-400 hover:text-gray-600"}`}>
                  {tab}
                  {activeTab === i && <motion.div layoutId="activeTab" className="absolute bottom-0 inset-inline-0 h-0.5 bg-[#E31E24]" />}
                </button>
              ))}
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3">
                <div className="relative">
                  <Search className="absolute inset-inline-start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder={t("hero.search")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full ps-10 pe-4 py-3 bg-[#f8f5f0] rounded-lg text-[#0f1b33] text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" />
                </div>

                <div className="relative">
                  <Building2 className="absolute inset-inline-start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full ps-10 pe-8 py-3 bg-[#f8f5f0] rounded-lg text-[#0f1b33] text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30">
                    {propertyTypeOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <ChevronDown className="absolute inset-inline-end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>

                <div className="relative">
                  <MapPin className="absolute inset-inline-start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select value={city} onChange={(e) => setCity(e.target.value)}
                    className="w-full ps-10 pe-8 py-3 bg-[#f8f5f0] rounded-lg text-[#0f1b33] text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30">
                    <option value="all">{t("hero.allCities")}</option>
                    {citiesWithDistricts?.map(c => (
                      <option key={c.id} value={c.nameAr}>{isAr ? c.nameAr : c.nameEn}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute inset-inline-end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>

                <Link href={getSearchUrl()}>
                  <button className="w-full flex items-center justify-center gap-2 bg-[#E31E24] hover:bg-[#c91a1f] text-white font-semibold py-3 px-8 rounded-lg transition-all">
                    <Search className="w-4 h-4" />{t("hero.searchBtn")}
                  </button>
                </Link>
              </div>

              {/* Price Range, Bedrooms, Bathrooms Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                {/* Price Range */}
                <div className="flex gap-2 col-span-2">
                  <div className="relative flex-1">
                    <input type="number" placeholder={isAr ? "أقل سعر" : "Min Price"} value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full ps-3 pe-12 py-2.5 bg-[#f8f5f0] rounded-lg text-[#0f1b33] text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    <span className="absolute inset-inline-end-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{isAr ? "ر.س" : "SAR"}</span>
                  </div>
                  <div className="relative flex-1">
                    <input type="number" placeholder={isAr ? "أعلى سعر" : "Max Price"} value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full ps-3 pe-12 py-2.5 bg-[#f8f5f0] rounded-lg text-[#0f1b33] text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    <span className="absolute inset-inline-end-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{isAr ? "ر.س" : "SAR"}</span>
                  </div>
                </div>

                {/* Bedrooms */}
                <div className="relative">
                  <BedDouble className="absolute inset-inline-start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full ps-10 pe-8 py-2.5 bg-[#f8f5f0] rounded-lg text-[#0f1b33] text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30">
                    <option value="">{isAr ? "الغرف" : "Bedrooms"}</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                      <option key={n} value={n}>{n}+ {isAr ? "غرف" : "Rooms"}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute inset-inline-end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>

                {/* Bathrooms */}
                <div className="relative">
                  <Bath className="absolute inset-inline-start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select value={bathrooms} onChange={(e) => setBathrooms(e.target.value)}
                    className="w-full ps-10 pe-8 py-2.5 bg-[#f8f5f0] rounded-lg text-[#0f1b33] text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30">
                    <option value="">{isAr ? "دورات المياه" : "Bathrooms"}</option>
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n}+ {isAr ? "حمامات" : "Baths"}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute inset-inline-end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400">{t("hero.browse")}</span>
                {quickCategories.map((cat) => (
                  <Link key={cat.label} href={cat.href}>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f8f5f0] hover:bg-[#c8a45e]/10 rounded-full text-xs text-gray-600 hover:text-[#0f1b33] transition-all cursor-pointer">
                      <cat.icon className="w-3 h-3" />{cat.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {stats.map((stat: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.1 }}
              className="text-center bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="text-2xl lg:text-3xl font-bold text-[#c8a45e]">{stat.value}</div>
              <div className="text-sm text-white/70">{stat.label}</div>
              {stat.suffix && <div className="text-xs text-white/40">{stat.suffix}</div>}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
