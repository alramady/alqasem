import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MapPin, Maximize2, BedDouble, Bath, Heart, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";

// Fallback static data in case DB is empty
const FALLBACK_PROPERTIES = [
  { id: 1, title: "فيلا فاخرة في حي النرجس", city: "الرياض", district: "حي النرجس", price: "2500000", area: "450", rooms: 5, bathrooms: 4, listingType: "sale" as const, type: "villa" as const, status: "active" as const, images: ["https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/qXIMngGkcLIVmdaP.jpg"] },
  { id: 2, title: "شقة مميزة في حي العليا", city: "الرياض", district: "حي العليا", price: "85000", area: "180", rooms: 3, bathrooms: 2, listingType: "rent" as const, type: "apartment" as const, status: "active" as const, images: ["https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/ptgCmDcKnyVHSoqU.jpg"] },
  { id: 3, title: "أرض تجارية على طريق الملك فهد", city: "الرياض", district: "طريق الملك فهد", price: "5000000", area: "1200", rooms: 0, bathrooms: 0, listingType: "sale" as const, type: "land" as const, status: "active" as const, images: ["https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/BBVeQyOZYomlTQuI.jpg"] },
  { id: 4, title: "شقة عائلية في حي الملقا", city: "الرياض", district: "حي الملقا", price: "950000", area: "220", rooms: 4, bathrooms: 3, listingType: "sale" as const, type: "apartment" as const, status: "active" as const, images: ["https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/CHQoruDhKekEivwJ.jpg"] },
  { id: 5, title: "فيلا دوبلكس في حي الياسمين", city: "الرياض", district: "حي الياسمين", price: "3200000", area: "550", rooms: 6, bathrooms: 5, listingType: "sale" as const, type: "villa" as const, status: "active" as const, images: ["https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/VWKuUyYmzCBCHeyo.jpg"] },
  { id: 6, title: "معرض تجاري على شارع التحلية", city: "الرياض", district: "شارع التحلية", price: "120000", area: "300", rooms: 0, bathrooms: 2, listingType: "rent" as const, type: "commercial" as const, status: "active" as const, images: ["https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/wslRAHeqMDXBMtxF.jpg"] },
];

const TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  all: { ar: "الكل", en: "All" },
  villa: { ar: "فلل", en: "Villas" },
  apartment: { ar: "شقق", en: "Apartments" },
  land: { ar: "أراضي", en: "Lands" },
  commercial: { ar: "تجاري", en: "Commercial" },
  office: { ar: "مكاتب", en: "Offices" },
  building: { ar: "عمارات", en: "Buildings" },
};

function formatPrice(price: string | number | null): string {
  if (!price) return "0";
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num)) return "0";
  return num.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function getBadge(listingType: string, isAr: boolean): { label: string; color: string } {
  if (listingType === "rent") return { label: isAr ? "للإيجار" : "For Rent", color: "bg-blue-500" };
  return { label: isAr ? "للبيع" : "For Sale", color: "bg-[#E31E24]" };
}

export default function PropertiesSection() {
  const { t, isAr } = useLanguage();
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const { data, isLoading } = trpc.public.searchProperties.useQuery(
    { limit: 12 },
    { staleTime: 2 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const properties = data?.items && data.items.length > 0 ? data.items : FALLBACK_PROPERTIES;

  // Build filter list from available types
  const filterKeys = useMemo(() => {
    const types = new Set(properties.map((p: any) => p.type));
    return ["all", ...Array.from(types)];
  }, [properties]);

  const [activeFilter, setActiveFilter] = useState("all");
  const [favorites, setFavorites] = useState<number[]>([]);

  const filtered = activeFilter === "all"
    ? properties.slice(0, 6)
    : properties.filter((p: any) => p.type === activeFilter).slice(0, 6);

  const toggleFav = (id: number) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  return (
    <section id="properties" className="py-20 bg-[#f8f5f0]">
      <div className="container">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-6">
          <div>
            <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-[#E31E24] font-semibold text-sm mb-2 block tracking-wider">
              {t("properties.badge")}
            </motion.span>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl lg:text-4xl font-bold text-[#0f1b33]">
              {t("properties.title")}
            </motion.h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            {filterKeys.map((key) => {
              const label = TYPE_LABELS[key] || { ar: key, en: key };
              return (
                <button key={key} onClick={() => setActiveFilter(key)} className={`px-5 py-2 text-sm rounded-lg transition-all ${activeFilter === key ? "bg-[#0f1b33] text-white font-semibold" : "bg-white text-gray-500 hover:text-[#0f1b33] border border-gray-200"}`}>
                  {isAr ? label.ar : label.en}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#c8a45e]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((property: any, i: number) => {
              const badge = getBadge(property.listingType, isAr);
              const imageUrl = Array.isArray(property.images) && property.images.length > 0
                ? property.images[0]
                : "https://placehold.co/600x400/0f1b33/c8a45e?text=No+Image";

              return (
                <motion.div key={property.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <Link href={`/properties/${property.id}`}>
                    <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img src={imageUrl} alt={property.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute top-3" style={{ insetInlineStart: '0.75rem' }}>
                          <span className={`${badge.color} text-white text-xs px-3 py-1.5 rounded-full font-semibold`}>
                            {badge.label}
                          </span>
                        </div>
                        <button onClick={(e) => { e.preventDefault(); toggleFav(property.id); }} className="absolute top-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors" style={{ insetInlineEnd: '0.75rem' }}>
                          <Heart className={`w-4 h-4 ${favorites.includes(property.id) ? "fill-[#E31E24] text-[#E31E24]" : "text-gray-500"}`} />
                        </button>
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-1.5 text-gray-400 text-sm mb-2">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {(() => {
                            const city = isAr ? property.city : (property.cityEn || property.city);
                            const district = isAr ? property.district : (property.districtEn || property.district);
                            const sep = isAr ? "، " : ", ";
                            return district ? `${district}${sep}${city}` : city;
                          })()}
                        </div>
                        <h3 className="font-bold text-[#0f1b33] text-lg mb-3 group-hover:text-[#c8a45e] transition-colors">
                          {isAr ? property.title : (property.titleEn || property.title)}
                        </h3>
                        {((property.rooms && property.rooms > 0) || (property.area && parseFloat(String(property.area)) > 0)) && (
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                            {property.rooms > 0 && <span className="flex items-center gap-1"><BedDouble className="w-4 h-4" />{property.rooms}</span>}
                            {property.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="w-4 h-4" />{property.bathrooms}</span>}
                            {property.area && <span className="flex items-center gap-1"><Maximize2 className="w-4 h-4" />{parseFloat(String(property.area)).toLocaleString()} {t("properties.area")}</span>}
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <span className="text-xl font-bold text-[#E31E24]" dir="ltr">
                            {formatPrice(property.price)} <span className="text-sm font-normal">{isAr ? "ر.س" : "SAR"}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && !isLoading && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">{isAr ? "لا توجد عقارات في هذا التصنيف حالياً" : "No properties in this category yet"}</p>
          </div>
        )}

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mt-12">
          <Link href="/properties">
            <span className="inline-flex items-center gap-2 bg-[#0f1b33] hover:bg-[#1a2d4d] text-white font-semibold px-8 py-3.5 rounded-lg transition-all group cursor-pointer">
              {t("properties.viewAll")}
              <ArrowIcon className="w-4 h-4 icon-directional transition-transform" />
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
