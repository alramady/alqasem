import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Heart, MapPin, BedDouble, Bath, Maximize, Trash2, Loader2, Building2 } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

function formatPrice(price: string | null) {
  if (!price) return null;
  const num = parseFloat(price);
  return isNaN(num) ? null : num.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function Favorites() {
  const { t, isAr } = useLanguage();
  const [favIds, setFavIds] = useState<number[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("alqasim_favorites");
    if (stored) {
      try { setFavIds(JSON.parse(stored)); } catch { setFavIds([]); }
    }
  }, []);

  const { data: properties, isLoading } = trpc.public.getPropertiesForComparison.useQuery(
    { ids: favIds },
    { enabled: favIds.length > 0 }
  );

  const removeFav = (id: number) => {
    const updated = favIds.filter(f => f !== id);
    setFavIds(updated);
    localStorage.setItem("alqasim_favorites", JSON.stringify(updated));
    toast.success(t("favorites.removed"));
  };

  const typeLabels: Record<string, { ar: string; en: string }> = {
    villa: { ar: "فيلا", en: "Villa" }, apartment: { ar: "شقة", en: "Apartment" },
    land: { ar: "أرض", en: "Land" }, commercial: { ar: "تجاري", en: "Commercial" },
    office: { ar: "مكتب", en: "Office" }, building: { ar: "عمارة", en: "Building" },
  };
  const listingLabels: Record<string, { ar: string; en: string }> = {
    sale: { ar: "للبيع", en: "For Sale" }, rent: { ar: "للإيجار", en: "For Rent" },
  };

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <Navbar />
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
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-7 h-7 text-[#E31E24] fill-[#E31E24]" />
          <h1 className="text-2xl font-bold text-[#0f1b33]">{t("favorites.title")}</h1>
          {favIds.length > 0 && (
            <span className="bg-[#E31E24] text-white text-xs font-bold px-2.5 py-1 rounded-full">{favIds.length}</span>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <Loader2 className="w-10 h-10 text-[#c8a45e] animate-spin mb-4" />
            <p className="text-[#0f1b33]/60">{t("common.loading")}</p>
          </div>
        ) : favIds.length === 0 || !properties || properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <Heart className="w-16 h-16 text-gray-200 mb-4" />
            <h2 className="text-xl font-bold text-[#0f1b33] mb-2">{t("favorites.empty")}</h2>
            <p className="text-gray-500 mb-6">{t("favorites.emptyDesc")}</p>
            <Link href="/properties" className="bg-[#c8a45e] text-[#0f1b33] font-semibold px-6 py-3 rounded-lg hover:bg-[#b8944e] transition-colors">
              {t("properties.viewAll")}
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p: any, i: number) => {
              const images: string[] = Array.isArray(p.images) ? p.images : [];
              const pType = isAr ? typeLabels[p.type]?.ar : typeLabels[p.type]?.en;
              const purp = isAr ? listingLabels[p.listingType]?.ar : listingLabels[p.listingType]?.en;
              const title = isAr ? (p.title || "") : (p.titleEn || p.title || "");
              const city = isAr ? (p.city || "") : (p.cityEn || p.city || "");
              const district = isAr ? (p.district || "") : (p.districtEn || p.district || "");
              const loc = district ? `${city} - ${district}` : city;
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all group">
                  <div className="relative aspect-[16/10]">
                    {images[0] ? (
                      <img src={images[0]} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center"><Building2 className="w-12 h-12 text-gray-400" /></div>
                    )}
                    <div className="absolute top-3 right-3 flex gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E31E24] text-white">{purp}</span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#c8a45e] text-[#0f1b33]">{pType}</span>
                    </div>
                    <button onClick={() => removeFav(p.id)} className="absolute top-3 left-3 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors" title={t("favorites.remove")}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                  <Link href={`/properties/${p.id}`} className="block p-4">
                    <h3 className="font-bold text-[#0f1b33] mb-1 line-clamp-1">{title}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mb-3"><MapPin className="w-3.5 h-3.5" />{loc}</p>
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
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
