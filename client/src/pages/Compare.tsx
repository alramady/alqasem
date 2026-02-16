import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Scale, X, Loader2, Building2, MapPin, BedDouble, Bath, Maximize, Car, CheckCircle, XCircle } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

function formatPrice(price: string | null) {
  if (!price) return "—";
  const num = parseFloat(price);
  return isNaN(num) ? "—" : num.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function Compare() {
  const { t, isAr } = useLanguage();
  const [compareIds, setCompareIds] = useState<number[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("alqasim_compare");
    if (stored) {
      try { setCompareIds(JSON.parse(stored)); } catch { setCompareIds([]); }
    }
  }, []);

  const { data: properties, isLoading } = trpc.public.getPropertiesForComparison.useQuery(
    { ids: compareIds },
    { enabled: compareIds.length > 0 }
  );

  const removeFromCompare = (id: number) => {
    const updated = compareIds.filter(f => f !== id);
    setCompareIds(updated);
    localStorage.setItem("alqasim_compare", JSON.stringify(updated));
  };

  const typeLabels: Record<string, { ar: string; en: string }> = {
    villa: { ar: "فيلا", en: "Villa" }, apartment: { ar: "شقة", en: "Apartment" },
    land: { ar: "أرض", en: "Land" }, commercial: { ar: "تجاري", en: "Commercial" },
    office: { ar: "مكتب", en: "Office" }, building: { ar: "عمارة", en: "Building" },
  };
  const listingLabels: Record<string, { ar: string; en: string }> = {
    sale: { ar: "للبيع", en: "For Sale" }, rent: { ar: "للإيجار", en: "For Rent" },
  };

  const rows = [
    { key: "image", label: "" },
    { key: "price", label: t("compare.price") },
    { key: "type", label: t("compare.type") },
    { key: "listing", label: t("compare.listing") },
    { key: "location", label: t("compare.location") },
    { key: "area", label: t("compare.area") },
    { key: "rooms", label: t("compare.rooms") },
    { key: "bathrooms", label: t("compare.bathrooms") },
    { key: "parking", label: isAr ? "مواقف سيارات" : "Parking" },
    { key: "features", label: isAr ? "المميزات" : "Features" },
  ];

  const getCellValue = (p: any, key: string) => {
    const title = isAr ? (p.title || "") : (p.titleEn || p.title || "");
    const city = isAr ? (p.city || "") : (p.cityEn || p.city || "");
    const district = isAr ? (p.district || "") : (p.districtEn || p.district || "");
    switch (key) {
      case "price": return <span className="text-lg font-bold text-[#E31E24]" dir="ltr">{formatPrice(p.price)} <span className="text-xs text-gray-400">{t("properties.sar")}</span></span>;
      case "type": return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#c8a45e]/10 text-[#c8a45e]">{isAr ? typeLabels[p.type]?.ar : typeLabels[p.type]?.en}</span>;
      case "listing": return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E31E24]/10 text-[#E31E24]">{isAr ? listingLabels[p.listingType]?.ar : listingLabels[p.listingType]?.en}</span>;
      case "location": return <span className="flex items-center gap-1 text-sm"><MapPin className="w-3.5 h-3.5 text-gray-400" />{district ? `${city} - ${district}` : city}</span>;
      case "area": return <span className="flex items-center gap-1"><Maximize className="w-4 h-4 text-[#c8a45e]" />{p.area ? `${Number(p.area)} ${t("properties.area")}` : "—"}</span>;
      case "rooms": return <span className="flex items-center gap-1"><BedDouble className="w-4 h-4 text-[#c8a45e]" />{p.rooms || "—"}</span>;
      case "bathrooms": return <span className="flex items-center gap-1"><Bath className="w-4 h-4 text-[#c8a45e]" />{p.bathrooms || "—"}</span>;
      case "parking": return p.hasParking ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-gray-300" />;
      case "features": {
        const features: string[] = Array.isArray(p.features) ? p.features : [];
        return features.length > 0 ? <div className="flex flex-wrap gap-1">{features.slice(0, 4).map((f: string, i: number) => <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{f}</span>)}{features.length > 4 && <span className="text-xs text-gray-400">+{features.length - 4}</span>}</div> : <span className="text-gray-300">—</span>;
      }
      case "image": return (
        <div className="relative">
          <Link href={`/properties/${p.id}`}>
            <div className="aspect-[4/3] rounded-lg overflow-hidden mb-2">
              {Array.isArray(p.images) && p.images[0] ? (
                <img loading="lazy" src={p.images[0] as string} alt={title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center"><Building2 className="w-8 h-8 text-gray-400" /></div>
              )}
            </div>
            <h3 className="font-bold text-sm text-[#0f1b33] line-clamp-2">{title}</h3>
          </Link>
          <button onClick={() => removeFromCompare(p.id)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      );
      default: return "—";
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <Navbar />
      <div className="pt-28 pb-4 bg-white border-b border-gray-100">
        <div className="container">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-[#c8a45e]">{t("nav.home")}</Link>
            <span>/</span>
            <span className="text-[#0f1b33]">{t("compare.title")}</span>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="flex items-center gap-3 mb-8">
          <Scale className="w-7 h-7 text-[#c8a45e]" />
          <h1 className="text-2xl font-bold text-[#0f1b33]">{t("compare.title")}</h1>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <Loader2 className="w-10 h-10 text-[#c8a45e] animate-spin mb-4" />
          </div>
        ) : !properties || properties.length < 2 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <Scale className="w-16 h-16 text-gray-200 mb-4" />
            <h2 className="text-xl font-bold text-[#0f1b33] mb-2">{t("compare.empty")}</h2>
            <p className="text-gray-500 mb-6">{t("compare.max")}</p>
            <Link href="/properties" className="bg-[#c8a45e] text-[#0f1b33] font-semibold px-6 py-3 rounded-lg hover:bg-[#b8944e] transition-colors">
              {t("properties.viewAll")}
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr>
                  <th className="w-[120px] p-4 text-right text-sm font-semibold text-gray-500 border-b border-gray-100"></th>
                  {properties.map((p: any) => (
                    <th key={p.id} className="p-4 border-b border-gray-100 min-w-[200px]"></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key} className={row.key === "image" ? "" : "border-t border-gray-50"}>
                    <td className="p-4 text-sm font-semibold text-gray-600 bg-gray-50/50 whitespace-nowrap">{row.label}</td>
                    {properties.map((p: any) => (
                      <td key={p.id} className="p-4 text-center">{getCellValue(p, row.key)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
