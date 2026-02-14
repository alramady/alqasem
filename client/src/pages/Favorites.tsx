import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import {
  Heart, MapPin, BedDouble, Bath, Maximize, Trash2, Loader2,
  Building2, Share2, ArrowUpDown, Trash, Search, X
} from "lucide-react";
import { Link, useSearch } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { useFavorites } from "@/hooks/useFavorites";

function formatPrice(price: string | null) {
  if (!price) return null;
  const num = parseFloat(price);
  return isNaN(num) ? null : num.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

type SortMode = "newest" | "price_asc" | "price_desc";

export default function Favorites() {
  const { t, isAr } = useLanguage();
  const { favIds, removeFavorite, clearAll, shareUrl, getAddedTime, count } = useFavorites();
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const search = useSearch();

  // Support shared wishlist links: /favorites?ids=1,2,3
  const sharedIds = useMemo(() => {
    const params = new URLSearchParams(search);
    const idsParam = params.get("ids");
    if (idsParam) {
      return idsParam.split(",").map(Number).filter(n => !isNaN(n) && n > 0);
    }
    return null;
  }, [search]);

  const displayIds = sharedIds || favIds;
  const isSharedView = !!sharedIds;

  const { data: properties, isLoading } = trpc.public.getPropertiesForComparison.useQuery(
    { ids: displayIds },
    { enabled: displayIds.length > 0 }
  );

  // Sort properties
  const sortedProperties = useMemo(() => {
    if (!properties) return [];
    const sorted = [...properties];
    switch (sortMode) {
      case "newest":
        sorted.sort((a, b) => getAddedTime(b.id) - getAddedTime(a.id));
        break;
      case "price_asc":
        sorted.sort((a, b) => (parseFloat(a.price || "0") - parseFloat(b.price || "0")));
        break;
      case "price_desc":
        sorted.sort((a, b) => (parseFloat(b.price || "0") - parseFloat(a.price || "0")));
        break;
    }
    return sorted;
  }, [properties, sortMode, getAddedTime]);

  const typeLabels: Record<string, { ar: string; en: string }> = {
    villa: { ar: "فيلا", en: "Villa" }, apartment: { ar: "شقة", en: "Apartment" },
    land: { ar: "أرض", en: "Land" }, commercial: { ar: "تجاري", en: "Commercial" },
    office: { ar: "مكتب", en: "Office" }, building: { ar: "عمارة", en: "Building" },
  };
  const listingLabels: Record<string, { ar: string; en: string }> = {
    sale: { ar: "للبيع", en: "For Sale" }, rent: { ar: "للإيجار", en: "For Rent" },
  };

  const handleShare = () => {
    const url = shareUrl();
    if (url) {
      navigator.clipboard.writeText(url);
      toast.success(t("favorites.linkCopied"));
    }
  };

  const handleClearAll = () => {
    clearAll();
    setShowClearConfirm(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <Navbar />

      {/* Breadcrumb */}
      <div className="pt-28 pb-4 bg-white border-b border-gray-100">
        <div className="container">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-[#c8a45e]">{t("nav.home")}</Link>
            <span>/</span>
            <span className="text-[#0f1b33]">{t("favorites.title")}</span>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Header with title, count, and actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#E31E24]/10 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-[#E31E24] fill-[#E31E24]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0f1b33]">
                {isSharedView ? (isAr ? "مفضلة مشتركة" : "Shared Wishlist") : t("favorites.title")}
              </h1>
              {displayIds.length > 0 && (
                <p className="text-sm text-gray-500">
                  {displayIds.length} {t("favorites.count")}
                </p>
              )}
            </div>
          </div>

          {/* Actions bar */}
          {displayIds.length > 0 && !isSharedView && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Sort dropdown */}
              <div className="relative">
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2.5 pe-9 text-sm text-[#0f1b33] cursor-pointer hover:border-[#c8a45e] transition-colors focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30"
                >
                  <option value="newest">{t("favorites.sortNewest")}</option>
                  <option value="price_asc">{t("favorites.sortPriceAsc")}</option>
                  <option value="price_desc">{t("favorites.sortPriceDesc")}</option>
                </select>
                <ArrowUpDown className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" style={{ insetInlineEnd: '0.75rem' }} />
              </div>

              {/* Share button */}
              <button
                onClick={handleShare}
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-[#0f1b33] hover:border-[#c8a45e] hover:text-[#c8a45e] transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t("favorites.shareWishlist")}</span>
              </button>

              {/* Clear all button */}
              <div className="relative">
                {showClearConfirm ? (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <span className="text-xs text-red-600 font-medium">{t("favorites.clearConfirm")}</span>
                    <button
                      onClick={handleClearAll}
                      className="bg-[#E31E24] text-white text-xs font-semibold px-3 py-1 rounded hover:bg-red-700 transition-colors"
                    >
                      {t("favorites.clearAll")}
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-red-500 hover:border-red-300 hover:bg-red-50 transition-colors"
                  >
                    <Trash className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("favorites.clearAll")}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <Loader2 className="w-10 h-10 text-[#c8a45e] animate-spin mb-4" />
            <p className="text-[#0f1b33]/60">{t("common.loading")}</p>
          </div>
        ) : displayIds.length === 0 || !sortedProperties || sortedProperties.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Heart className="w-12 h-12 text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-[#0f1b33] mb-3">{t("favorites.empty")}</h2>
            <p className="text-gray-500 mb-8 text-center max-w-md">{t("favorites.emptyDesc")}</p>
            <Link
              href="/properties"
              className="flex items-center gap-2 bg-[#c8a45e] text-[#0f1b33] font-semibold px-8 py-3.5 rounded-lg hover:bg-[#b8944e] transition-colors shadow-lg shadow-[#c8a45e]/20"
            >
              <Search className="w-5 h-5" />
              {t("favorites.browseProperties")}
            </Link>
          </div>
        ) : (
          /* Property grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {sortedProperties.map((p: any, i: number) => {
                const images: string[] = Array.isArray(p.images) ? p.images : [];
                const pType = isAr ? typeLabels[p.type]?.ar : typeLabels[p.type]?.en;
                const purp = isAr ? listingLabels[p.listingType]?.ar : listingLabels[p.listingType]?.en;
                const title = isAr ? (p.title || "") : (p.titleEn || p.title || "");
                const city = isAr ? (p.city || "") : (p.cityEn || p.city || "");
                const district = isAr ? (p.district || "") : (p.districtEn || p.district || "");
                const loc = district ? `${city} - ${district}` : city;
                return (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all group"
                  >
                    <div className="relative aspect-[16/10]">
                      {images[0] ? (
                        <img src={images[0]} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <Building2 className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-3 flex gap-2" style={{ insetInlineEnd: '0.75rem' }}>
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E31E24] text-white">{purp}</span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#c8a45e] text-[#0f1b33]">{pType}</span>
                      </div>
                      {!isSharedView && (
                        <button
                          onClick={() => removeFavorite(p.id)}
                          className="absolute top-3 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center hover:bg-red-50 transition-all group/btn"
                          style={{ insetInlineStart: '0.75rem' }}
                          title={t("favorites.remove")}
                        >
                          <Trash2 className="w-4 h-4 text-red-500 group-hover/btn:scale-110 transition-transform" />
                        </button>
                      )}
                    </div>
                    <Link href={`/properties/${p.id}`} className="block p-4">
                      <h3 className="font-bold text-[#0f1b33] mb-1 line-clamp-1 group-hover:text-[#c8a45e] transition-colors">{title}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />{loc}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        {p.rooms > 0 && <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{p.rooms}</span>}
                        {p.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{p.bathrooms}</span>}
                        {p.area && <span className="flex items-center gap-1"><Maximize className="w-3.5 h-3.5" />{Number(p.area)} {t("properties.area")}</span>}
                      </div>
                      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                        <span className="text-lg font-bold text-[#E31E24]" dir="ltr">{formatPrice(p.price)}</span>
                        <span className="text-xs text-gray-400">{t("properties.sar")}</span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
