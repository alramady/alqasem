import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MapView } from "@/components/Map";
import ShareModal from "@/components/ShareModal";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { useState, useRef, useEffect, useMemo } from "react";
import { MapPin, BedDouble, Bath, Maximize, Car, Phone, MessageCircle, Heart, Share2, ChevronLeft, ChevronRight, CheckCircle, Shield, Building2, Navigation, Loader2, Printer, Eye } from "lucide-react";
import VirtualTourEmbed, { isValidVirtualTourUrl } from "@/components/VirtualTourEmbed";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { useFavorites } from "@/hooks/useFavorites";

function formatPrice(p: string | null) {
  if (!p) return "0";
  const n = parseFloat(p);
  return isNaN(n) ? "0" : n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function PropertyDetail({ id }: { id: string }) {
  const { t, isAr, dir } = useLanguage();
  const propertyId = parseInt(id);
  const { data: property, isLoading, error } = trpc.public.getProperty.useQuery(
    { id: propertyId },
    { enabled: !isNaN(propertyId) && propertyId > 0 }
  );

  const [activeImage, setActiveImage] = useState(0);
  const [showShare, setShowShare] = useState(false);
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Persistent favorites via centralized hook
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(propertyId);
  const toggleFav = () => toggleFavorite(propertyId);

  // Agency/Agent info for this property
  const { data: agencyAgent } = trpc.public.getPropertyAgencyAgent.useQuery(
    { propertyId },
    { enabled: !isNaN(propertyId) && propertyId > 0 }
  );

  // Track view
  const trackView = trpc.public.trackPropertyView.useMutation();
  useEffect(() => {
    if (propertyId > 0) trackView.mutate({ propertyId });
  }, [propertyId]);

  // Similar properties
  const { data: similarProps } = trpc.public.getSimilarProperties.useQuery(
    { propertyId, limit: 4 },
    { enabled: !!property }
  );

  const submitInquiry = trpc.public.submitInquiry.useMutation({
    onSuccess: () => {
      setInquirySubmitted(true);
      setInquiryName("");
      setInquiryPhone("");
      setInquiryMessage("");
    },
  });

  const images: string[] = Array.isArray(property?.images) ? (property.images as string[]) : [];
  const features: string[] = Array.isArray(property?.features) ? (property.features as string[]) : [];

  const title = isAr ? (property?.title || "") : (property?.titleEn || property?.title || "");
  const desc = isAr ? (property?.description || "") : (property?.descriptionEn || property?.description || "");
  const city = isAr ? (property?.city || "") : (property?.cityEn || property?.city || "");
  const district = isAr ? (property?.district || "") : (property?.districtEn || property?.district || "");
  const loc = district ? `${city} - ${district}` : city;

  const typeLabels: Record<string, { ar: string; en: string }> = {
    villa: { ar: "فيلا", en: "Villa" }, apartment: { ar: "شقة", en: "Apartment" },
    land: { ar: "أرض", en: "Land" }, commercial: { ar: "تجاري", en: "Commercial" },
    office: { ar: "مكتب", en: "Office" }, building: { ar: "عمارة", en: "Building" },
  };
  const listingLabels: Record<string, { ar: string; en: string }> = {
    sale: { ar: "للبيع", en: "For Sale" }, rent: { ar: "للإيجار", en: "For Rent" },
  };

  const pType = property ? (isAr ? typeLabels[property.type]?.ar : typeLabels[property.type]?.en) || property.type : "";
  const purp = property ? (isAr ? listingLabels[property.listingType]?.ar : listingLabels[property.listingType]?.en) || property.listingType : "";

  const price = property?.price ? formatPrice(property.price) : "0";
  const priceNum = property?.price ? Number(property.price) : 0;
  const area = property?.area ? Number(property.area) : 0;
  const beds = property?.rooms || 0;
  const baths = property?.bathrooms || 0;
  const hasParking = property?.hasParking || false;

  // Compute map center from property coordinates
  // MUST be before any early returns to satisfy Rules of Hooks
  const mapCenter = useMemo(() => {
    const defaultCoords: Record<string, { lat: number; lng: number }> = {
      "الرياض": { lat: 24.7136, lng: 46.6753 },
      "جدة": { lat: 21.4858, lng: 39.1925 },
      "الدمام": { lat: 26.4207, lng: 50.0888 },
      "المدينة المنورة": { lat: 24.4672, lng: 39.6112 },
      "مكة المكرمة": { lat: 21.3891, lng: 39.8579 },
      "الخبر": { lat: 26.2172, lng: 50.1971 },
    };
    if (property?.latitude && property?.longitude) {
      return { lat: parseFloat(property.latitude), lng: parseFloat(property.longitude) };
    }
    return defaultCoords[property?.city || "الرياض"] || { lat: 24.7136, lng: 46.6753 };
  }, [property?.latitude, property?.longitude, property?.city]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f5f0]">
        <Navbar />
        <div className="pt-32 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-[#c8a45e] animate-spin mb-4" />
          <p className="text-[#0f1b33]/60">{t("common.loading")}</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-[#f8f5f0]">
        <Navbar />
        <div className="pt-32 flex flex-col items-center justify-center min-h-[60vh]">
          <Building2 className="w-16 h-16 text-[#0f1b33]/20 mb-4" />
          <h2 className="text-2xl font-bold text-[#0f1b33] mb-2">{isAr ? "العقار غير موجود" : "Property Not Found"}</h2>
          <p className="text-[#0f1b33]/50 mb-6">{isAr ? "عذراً، لم نتمكن من العثور على العقار المطلوب." : "Sorry, we couldn't find the requested property."}</p>
          <Link href="/properties" className="bg-[#c8a45e] text-[#0f1b33] font-semibold px-6 py-3 rounded-lg hover:bg-[#b8944e] transition-colors">
            {isAr ? "العودة للعقارات" : "Back to Properties"}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    const { lat, lng } = mapCenter;

    const marker = new google.maps.marker.AdvancedMarkerElement({ map, position: { lat, lng }, title });
    const iw = new google.maps.InfoWindow({
      content: `<div style="padding:8px;font-family:inherit;direction:${dir};min-width:200px;">
        <h3 style="margin:0 0 6px;font-size:14px;font-weight:700;color:#0f1b33;">${title}</h3>
        <p style="margin:0 0 4px;font-size:12px;color:#666;"><span style="color:#c8a45e;">📍</span> ${loc}</p>
        <p style="margin:0;font-size:16px;font-weight:700;color:#E31E24;">${price} <span style="font-size:11px;color:#999;">${isAr ? "ريال" : "SAR"}</span></p>
      </div>`,
    });
    marker.addListener("click", () => iw.open({ anchor: marker, map }));
    iw.open({ anchor: marker, map });

    const nearby = [
      { nAr: "مسجد", nEn: "Mosque", lat: lat + 0.003, lng: lng + 0.002, icon: "🕌" },
      { nAr: "مدرسة", nEn: "School", lat: lat - 0.002, lng: lng + 0.004, icon: "🏫" },
      { nAr: "سوبرماركت", nEn: "Supermarket", lat: lat + 0.001, lng: lng - 0.003, icon: "🛒" },
      { nAr: "حديقة", nEn: "Park", lat: lat - 0.003, lng: lng - 0.001, icon: "🌳" },
    ];
    nearby.forEach((pl) => {
      const nm = isAr ? pl.nAr : pl.nEn;
      const el = document.createElement("div");
      el.innerHTML = `<span style="font-size:20px;cursor:pointer;" title="${nm}">${pl.icon}</span>`;
      const pm = new google.maps.marker.AdvancedMarkerElement({ map, position: { lat: pl.lat, lng: pl.lng }, title: nm, content: el });
      const piw = new google.maps.InfoWindow({ content: `<div style="padding:4px 8px;font-family:inherit;direction:${dir};"><strong>${pl.icon} ${nm}</strong></div>` });
      pm.addListener("click", () => piw.open({ anchor: pm, map }));
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <Navbar />
      <div className="pt-28 pb-4 bg-white border-b border-gray-100 print:hidden">
        <div className="container">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-[#c8a45e]">{t("nav.home")}</Link>
            <ChevronLeft className="w-3 h-3" />
            <Link href="/properties" className="hover:text-[#c8a45e]">{t("nav.properties")}</Link>
            <ChevronLeft className="w-3 h-3" />
            <span className="text-[#0f1b33]">{title}</span>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="relative aspect-[16/10]">
                {images.length > 0 ? (
                  <img loading="lazy" src={images[activeImage]} alt={title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2 z-10 print:hidden">
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#E31E24] text-white">{purp}</span>
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#c8a45e] text-[#0f1b33]">{pType}</span>
                </div>
                <div className="absolute top-4 left-4 flex gap-2 z-10 print:hidden">
                  <button onClick={toggleFav} className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
                    <Heart className={`w-5 h-5 transition-all duration-300 ${isFav ? "fill-[#E31E24] text-[#E31E24] scale-110" : "text-gray-500 hover:scale-110"}`} />
                  </button>
                  <button onClick={() => setShowShare(true)} className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
                    <Share2 className="w-5 h-5 text-gray-500" />
                  </button>
                  <button onClick={handlePrint} className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
                    <Printer className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                {images.length > 1 && (
                  <>
                    <button onClick={() => setActiveImage(v => v > 0 ? v - 1 : images.length - 1)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center print:hidden">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button onClick={() => setActiveImage(v => v < images.length - 1 ? v + 1 : 0)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center print:hidden">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </>
                )}
                {images.length > 0 && (
                  <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm print:hidden">
                    {activeImage + 1} / {images.length} {isAr ? "صور" : "photos"}
                  </div>
                )}
              </div>
              {/* Thumbnail strip */}
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto print:hidden">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImage(i)} className={`w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${i === activeImage ? "border-[#c8a45e]" : "border-transparent opacity-60 hover:opacity-100"}`}>
                      <img loading="lazy" src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Property Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#0f1b33] mb-2">{title}</h1>
                  <div className="flex items-center gap-1.5 text-gray-500"><MapPin className="w-4 h-4" /><span>{loc}</span></div>
                </div>
                <div className="text-end">
                  <span className="text-3xl font-bold text-[#E31E24]" dir="ltr">{price}</span>
                  <span className="block text-sm text-gray-400">{isAr ? "ريال سعودي" : "SAR"}{property.listingType === "rent" ? (isAr ? "/سنوياً" : "/year") : ""}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-5 border-t border-b border-gray-100">
                {beds > 0 && <div className="flex items-center gap-3 p-3 bg-[#f8f5f0] rounded-lg"><BedDouble className="w-5 h-5 text-[#c8a45e]" /><div><span className="block text-lg font-bold text-[#0f1b33]">{beds}</span><span className="text-xs text-gray-500">{isAr ? "غرف نوم" : "Bedrooms"}</span></div></div>}
                {baths > 0 && <div className="flex items-center gap-3 p-3 bg-[#f8f5f0] rounded-lg"><Bath className="w-5 h-5 text-[#c8a45e]" /><div><span className="block text-lg font-bold text-[#0f1b33]">{baths}</span><span className="text-xs text-gray-500">{isAr ? "دورات مياه" : "Bathrooms"}</span></div></div>}
                {area > 0 && <div className="flex items-center gap-3 p-3 bg-[#f8f5f0] rounded-lg"><Maximize className="w-5 h-5 text-[#c8a45e]" /><div><span className="block text-lg font-bold text-[#0f1b33]">{area}</span><span className="text-xs text-gray-500">{t("properties.area")}</span></div></div>}
                {hasParking && <div className="flex items-center gap-3 p-3 bg-[#f8f5f0] rounded-lg"><Car className="w-5 h-5 text-[#c8a45e]" /><div><span className="block text-lg font-bold text-[#0f1b33]">✓</span><span className="text-xs text-gray-500">{isAr ? "مواقف" : "Parking"}</span></div></div>}
              </div>
              {/* Property ID and view count */}
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                <span>{isAr ? "رقم العقار" : "Property ID"}: #{property.id}</span>
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{property.viewCount || 0} {isAr ? "مشاهدة" : "views"}</span>
              </div>
              {desc && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-[#0f1b33] mb-3">{t("propertyDetail.description")}</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{desc}</p>
                </div>
              )}
            </motion.div>

            {/* Features */}
            {features.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-[#0f1b33] mb-4">{t("propertyDetail.features")}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {features.map((f, i) => <div key={i} className="flex items-center gap-2 p-3 bg-[#f8f5f0] rounded-lg"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /><span className="text-sm text-[#0f1b33]">{String(f)}</span></div>)}
                </div>
              </motion.div>
            )}

            {/* Virtual Tour */}
            {property.virtualTourUrl && property.virtualTourType && isValidVirtualTourUrl(property.virtualTourUrl) && (
              <VirtualTourEmbed
                url={property.virtualTourUrl}
                type={property.virtualTourType as "matterport" | "youtube" | "custom"}
                propertyTitle={title}
              />
            )}

            {/* Map */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl overflow-hidden shadow-sm print:hidden">
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-bold text-[#0f1b33] flex items-center gap-2"><Navigation className="w-5 h-5 text-[#c8a45e]" />{t("propertyDetail.location")}</h3>
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{loc}</p>
              </div>
              <div className="h-[300px]">
                <MapView
                  onMapReady={handleMapReady}
                  initialCenter={mapCenter}
                  initialZoom={15}
                />
              </div>
            </motion.div>

            {/* Similar Properties */}
            {similarProps && similarProps.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="print:hidden">
                <h3 className="text-lg font-bold text-[#0f1b33] mb-4">{t("similar.title")}</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {similarProps.map((sp: any) => {
                    const spImages: string[] = Array.isArray(sp.images) ? sp.images : [];
                    const spTitle = isAr ? (sp.title || "") : (sp.titleEn || sp.title || "");
                    const spCity = isAr ? (sp.city || "") : (sp.cityEn || sp.city || "");
                    const spDistrict = isAr ? (sp.district || "") : (sp.districtEn || sp.district || "");
                    const spLoc = spDistrict ? `${spCity} - ${spDistrict}` : spCity;
                    const spPurp = isAr ? listingLabels[sp.listingType]?.ar : listingLabels[sp.listingType]?.en;
                    return (
                      <Link key={sp.id} href={`/properties/${sp.id}`} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                        <div className="relative aspect-[16/9]">
                          {spImages[0] ? (
                            <img loading="lazy" src={spImages[0] as string} alt={spTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center"><Building2 className="w-8 h-8 text-gray-400" /></div>
                          )}
                          <span className="absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-semibold bg-[#E31E24] text-white">{spPurp}</span>
                        </div>
                        <div className="p-3">
                          <h4 className="font-bold text-sm text-[#0f1b33] line-clamp-1">{spTitle}</h4>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{spLoc}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-bold text-[#E31E24]" dir="ltr">{formatPrice(sp.price)}</span>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                              {sp.rooms > 0 && <span className="flex items-center gap-0.5"><BedDouble className="w-3 h-3" />{sp.rooms}</span>}
                              {sp.area && <span className="flex items-center gap-0.5"><Maximize className="w-3 h-3" />{Number(sp.area)}</span>}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl p-6 shadow-sm sticky top-28 print:static">
              {/* Agency/Agent Card */}
              {agencyAgent?.agency ? (
                <div className="mb-4 pb-4 border-b border-gray-100">
                  <Link href={`/agency/${agencyAgent.agency.slug}`}>
                    <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" dir={isAr ? "rtl" : "ltr"}>
                      <div className="w-14 h-14 rounded-xl border-2 border-slate-100 overflow-hidden flex items-center justify-center bg-white shrink-0">
                        {agencyAgent.agency.logo ? (
                          <img loading="lazy" src={agencyAgent.agency.logo} alt={agencyAgent.agency.nameAr} className="w-full h-full object-contain p-1" />
                        ) : (
                          <Building2 className="w-7 h-7 text-[#c8a45e]" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#0f1b33]">{isAr ? agencyAgent.agency.nameAr : (agencyAgent.agency.nameEn || agencyAgent.agency.nameAr)}</h4>
                        <div className="flex items-center gap-1 text-xs text-green-600"><Shield className="w-3 h-3" /><span>{isAr ? "مكتب معتمد" : "Verified Office"}</span></div>
                      </div>
                    </div>
                  </Link>
                  {agencyAgent?.agent && (
                    <Link href={`/agent/${agencyAgent.agent.slug}`}>
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 cursor-pointer hover:opacity-80 transition-opacity" dir={isAr ? "rtl" : "ltr"}>
                        <div className="w-10 h-10 rounded-full border-2 border-slate-100 overflow-hidden flex items-center justify-center bg-slate-50 shrink-0">
                          {agencyAgent.agent.photo ? (
                            <img loading="lazy" src={agencyAgent.agent.photo} alt={agencyAgent.agent.nameAr} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-slate-300">{agencyAgent.agent.nameAr?.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-[#0f1b33]">{isAr ? agencyAgent.agent.nameAr : (agencyAgent.agent.nameEn || agencyAgent.agent.nameAr)}</p>
                          {agencyAgent.agent.titleAr && <p className="text-xs text-slate-500">{isAr ? agencyAgent.agent.titleAr : (agencyAgent.agent.titleEn || agencyAgent.agent.titleAr)}</p>}
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100" dir={isAr ? "rtl" : "ltr"}>
                  <div className="w-14 h-14 bg-[#0f1b33] rounded-xl flex items-center justify-center"><Building2 className="w-7 h-7 text-[#c8a45e]" /></div>
                  <div>
                    <h4 className="font-bold text-[#0f1b33]">{isAr ? "القاسم العقارية" : "Al-Qasim Real Estate"}</h4>
                    <div className="flex items-center gap-1 text-xs text-green-600"><Shield className="w-3 h-3" /><span>{isAr ? "معلن معتمد" : "Verified Agent"}</span></div>
                  </div>
                </div>
              )}
              <div className="space-y-3 mb-6 print:hidden">
                <a href={agencyAgent?.agent?.phone ? `tel:${agencyAgent.agent.phone}` : (agencyAgent?.agency?.phone ? `tel:${agencyAgent.agency.phone}` : "tel:920001911")} className="w-full flex items-center justify-center gap-2 bg-[#E31E24] hover:bg-[#c91a1f] text-white font-semibold py-3 rounded-lg transition-colors"><Phone className="w-4 h-4" />{t("propertyDetail.callNow")}</a>
                <a href={agencyAgent?.agent?.whatsapp ? `https://wa.me/${agencyAgent.agent.whatsapp}` : "https://wa.me/966500051679"} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"><MessageCircle className="w-4 h-4" />{t("propertyDetail.whatsapp")}</a>
              </div>
              <div className="border-t border-gray-100 pt-5 print:hidden">
                <h4 className="font-bold text-[#0f1b33] mb-3 text-sm">{isAr ? "أرسل استفسارك" : "Send Your Inquiry"}</h4>
                {inquirySubmitted ? (
                  <div className="text-center py-4">
                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                    <p className="text-green-700 font-semibold text-sm">{isAr ? "تم إرسال استفسارك بنجاح!" : "Inquiry sent successfully!"}</p>
                    <button onClick={() => setInquirySubmitted(false)} className="text-[#c8a45e] text-xs mt-2 underline">{isAr ? "إرسال استفسار آخر" : "Send another inquiry"}</button>
                  </div>
                ) : (
                  <form className="space-y-3" onSubmit={(e) => {
                    e.preventDefault();
                    if (!inquiryName.trim() || !inquiryPhone.trim()) return;
                    submitInquiry.mutate({
                      name: inquiryName.trim(),
                      phone: inquiryPhone.trim(),
                      message: inquiryMessage.trim() || `استفسار عن عقار: ${title}`,
                      subject: `استفسار عن عقار #${property.id}`,
                      source: "property_detail",
                    });
                  }}>
                    <input type="text" value={inquiryName} onChange={(e) => setInquiryName(e.target.value)} placeholder={t("contact.name")} required className="w-full px-4 py-2.5 bg-[#f8f5f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" />
                    <input type="tel" value={inquiryPhone} onChange={(e) => setInquiryPhone(e.target.value.replace(/[^0-9+\-\s()]/g, ''))} placeholder={isAr ? "رقم الجوال" : "Phone number"} required className="w-full px-4 py-2.5 bg-[#f8f5f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 text-right placeholder:text-right" dir="rtl" />
                    <textarea value={inquiryMessage} onChange={(e) => setInquiryMessage(e.target.value)} placeholder={isAr ? "رسالتك..." : "Your message..."} rows={3} className="w-full px-4 py-2.5 bg-[#f8f5f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 resize-none" />
                    {submitInquiry.error && <p className="text-red-500 text-xs">{isAr ? "حدث خطأ، حاول مرة أخرى" : "An error occurred, please try again"}</p>}
                    <button type="submit" disabled={submitInquiry.isPending} className="w-full bg-[#c8a45e] hover:bg-[#b8944e] text-[#0f1b33] font-semibold py-3 rounded-lg transition-colors disabled:opacity-60">
                      {submitInquiry.isPending ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "إرسال الاستفسار" : "Send Inquiry")}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>

            {/* Mortgage Calculator - hidden per user request */}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} title={title} url={`/properties/${property.id}`} />

      <Footer />
    </div>
  );
}
