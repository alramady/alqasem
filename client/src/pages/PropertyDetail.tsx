import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MapView } from "@/components/Map";
import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { MapPin, BedDouble, Bath, Maximize, Car, Phone, MessageCircle, Heart, Share2, ChevronLeft, ChevronRight, CheckCircle, Shield, Building2, Navigation } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

const propertyData: Record<string, {
  titleAr: string; titleEn: string; price: string; locationAr: string; locationEn: string;
  beds: number; baths: number; area: number; parking: number;
  descAr: string; descEn: string; featAr: string[]; featEn: string[];
  images: string[]; typeAr: string; typeEn: string; purpAr: string; purpEn: string;
  lat: number; lng: number;
}> = {
  "1": {
    titleAr: "فيلا فاخرة في حي النرجس", titleEn: "Luxury Villa in Al-Narjis",
    price: "2,500,000", locationAr: "حي النرجس، شمال الرياض", locationEn: "Al-Narjis, North Riyadh",
    beds: 5, baths: 4, area: 450, parking: 2,
    descAr: "فيلا فاخرة بتصميم عصري في أرقى أحياء شمال الرياض. تتميز بمساحات واسعة وتشطيبات عالية الجودة مع حديقة خاصة ومسبح.",
    descEn: "A luxury villa with modern design in one of the finest neighborhoods of North Riyadh. Features spacious areas and high-quality finishes with a private garden and pool.",
    featAr: ["تكييف مركزي", "مسبح خاص", "حديقة خاصة", "غرفة خادمة", "مصعد", "مطبخ مجهز", "نظام أمني", "موقف سيارات مزدوج"],
    featEn: ["Central AC", "Private Pool", "Private Garden", "Maid's Room", "Elevator", "Equipped Kitchen", "Security System", "Double Parking"],
    images: ["https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/qXIMngGkcLIVmdaP.jpg"],
    typeAr: "فيلا", typeEn: "Villa", purpAr: "للبيع", purpEn: "For Sale",
    lat: 24.8414, lng: 46.6527,
  },
  "2": {
    titleAr: "شقة مميزة في حي العليا", titleEn: "Premium Apartment in Al-Olaya",
    price: "85,000", locationAr: "حي العليا، وسط الرياض", locationEn: "Al-Olaya, Central Riyadh",
    beds: 3, baths: 2, area: 180, parking: 1,
    descAr: "شقة مميزة بموقع استراتيجي في قلب حي العليا. قريبة من جميع الخدمات والمرافق الحيوية.",
    descEn: "A premium apartment in a strategic location in the heart of Al-Olaya. Close to all services and vital facilities.",
    featAr: ["تكييف مركزي", "مطبخ مجهز", "شرفة", "حارس أمن", "مواقف سيارات"],
    featEn: ["Central AC", "Equipped Kitchen", "Balcony", "Security Guard", "Parking"],
    images: ["https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/ptgCmDcKnyVHSoqU.jpg"],
    typeAr: "شقة", typeEn: "Apartment", purpAr: "للإيجار", purpEn: "For Rent",
    lat: 24.6907, lng: 46.6853,
  },
  "3": {
    titleAr: "أرض تجارية على طريق الملك فهد", titleEn: "Commercial Land on King Fahd Road",
    price: "5,000,000", locationAr: "طريق الملك فهد، الرياض", locationEn: "King Fahd Road, Riyadh",
    beds: 0, baths: 0, area: 1200, parking: 0,
    descAr: "أرض تجارية بموقع استثنائي على طريق الملك فهد. مناسبة لبناء مجمع تجاري أو برج مكاتب.",
    descEn: "Commercial land in an exceptional location on King Fahd Road. Suitable for building a commercial complex or office tower.",
    featAr: ["واجهة تجارية", "موقع استراتيجي", "قريبة من المترو", "مخطط معتمد"],
    featEn: ["Commercial Frontage", "Strategic Location", "Near Metro", "Approved Plan"],
    images: ["https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/BBVeQyOZYomlTQuI.jpg"],
    typeAr: "أرض", typeEn: "Land", purpAr: "للبيع", purpEn: "For Sale",
    lat: 24.7136, lng: 46.6753,
  },
};

export default function PropertyDetail({ id }: { id: string }) {
  const { t, isAr, dir } = useLanguage();
  const p = propertyData[id] || propertyData["1"];
  const [activeImage, setActiveImage] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  const title = isAr ? p.titleAr : p.titleEn;
  const loc = isAr ? p.locationAr : p.locationEn;
  const desc = isAr ? p.descAr : p.descEn;
  const feats = isAr ? p.featAr : p.featEn;
  const pType = isAr ? p.typeAr : p.typeEn;
  const purp = isAr ? p.purpAr : p.purpEn;

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    const marker = new google.maps.marker.AdvancedMarkerElement({ map, position: { lat: p.lat, lng: p.lng }, title });
    const iw = new google.maps.InfoWindow({
      content: `<div style="padding:8px;font-family:inherit;direction:${dir};min-width:200px;">
        <h3 style="margin:0 0 6px;font-size:14px;font-weight:700;color:#0f1b33;">${title}</h3>
        <p style="margin:0 0 4px;font-size:12px;color:#666;"><span style="color:#c8a45e;">📍</span> ${loc}</p>
        <p style="margin:0;font-size:16px;font-weight:700;color:#E31E24;">${p.price} <span style="font-size:11px;color:#999;">${isAr?"ريال":"SAR"}</span></p>
      </div>`,
    });
    marker.addListener("click", () => iw.open({ anchor: marker, map }));
    iw.open({ anchor: marker, map });

    const nearby = [
      { nAr: "مسجد", nEn: "Mosque", lat: p.lat + 0.003, lng: p.lng + 0.002, icon: "🕌" },
      { nAr: "مدرسة", nEn: "School", lat: p.lat - 0.002, lng: p.lng + 0.004, icon: "🏫" },
      { nAr: "سوبرماركت", nEn: "Supermarket", lat: p.lat + 0.001, lng: p.lng - 0.003, icon: "🛒" },
      { nAr: "حديقة", nEn: "Park", lat: p.lat - 0.003, lng: p.lng - 0.001, icon: "🌳" },
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
      <div className="pt-28 pb-4 bg-white border-b border-gray-100">
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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="relative aspect-[16/10]">
                <img src={p.images[activeImage]} alt={title} className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#E31E24] text-white">{purp}</span>
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#c8a45e] text-[#0f1b33]">{pType}</span>
                </div>
                <div className="absolute top-4 left-4 flex gap-2 z-10">
                  <button onClick={() => setIsFav(!isFav)} className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
                    <Heart className={`w-5 h-5 ${isFav ? "fill-[#E31E24] text-[#E31E24]" : "text-gray-500"}`} />
                  </button>
                  <button className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
                    <Share2 className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                {p.images.length > 1 && (
                  <>
                    <button onClick={() => setActiveImage(v => v > 0 ? v - 1 : p.images.length - 1)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button onClick={() => setActiveImage(v => v < p.images.length - 1 ? v + 1 : 0)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </>
                )}
                <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                  {activeImage + 1} / {p.images.length} {isAr ? "صور" : "photos"}
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#0f1b33] mb-2">{title}</h1>
                  <div className="flex items-center gap-1.5 text-gray-500"><MapPin className="w-4 h-4" /><span>{loc}</span></div>
                </div>
                <div className="text-end">
                  <span className="text-3xl font-bold text-[#E31E24]" dir="ltr">{p.price}</span>
                  <span className="block text-sm text-gray-400">{isAr ? "ريال سعودي" : "SAR"}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-5 border-t border-b border-gray-100">
                {p.beds > 0 && <div className="flex items-center gap-3 p-3 bg-[#f8f5f0] rounded-lg"><BedDouble className="w-5 h-5 text-[#c8a45e]" /><div><span className="block text-lg font-bold text-[#0f1b33]">{p.beds}</span><span className="text-xs text-gray-500">{isAr?"غرف نوم":"Bedrooms"}</span></div></div>}
                {p.baths > 0 && <div className="flex items-center gap-3 p-3 bg-[#f8f5f0] rounded-lg"><Bath className="w-5 h-5 text-[#c8a45e]" /><div><span className="block text-lg font-bold text-[#0f1b33]">{p.baths}</span><span className="text-xs text-gray-500">{isAr?"دورات مياه":"Bathrooms"}</span></div></div>}
                <div className="flex items-center gap-3 p-3 bg-[#f8f5f0] rounded-lg"><Maximize className="w-5 h-5 text-[#c8a45e]" /><div><span className="block text-lg font-bold text-[#0f1b33]">{p.area}</span><span className="text-xs text-gray-500">{t("properties.area")}</span></div></div>
                {p.parking > 0 && <div className="flex items-center gap-3 p-3 bg-[#f8f5f0] rounded-lg"><Car className="w-5 h-5 text-[#c8a45e]" /><div><span className="block text-lg font-bold text-[#0f1b33]">{p.parking}</span><span className="text-xs text-gray-500">{isAr?"مواقف":"Parking"}</span></div></div>}
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-bold text-[#0f1b33] mb-3">{t("propertyDetail.description")}</h3>
                <p className="text-gray-600 leading-relaxed">{desc}</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#0f1b33] mb-4">{t("propertyDetail.features")}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {feats.map((f, i) => <div key={i} className="flex items-center gap-2 p-3 bg-[#f8f5f0] rounded-lg"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /><span className="text-sm text-[#0f1b33]">{f}</span></div>)}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-bold text-[#0f1b33] flex items-center gap-2"><Navigation className="w-5 h-5 text-[#c8a45e]" />{t("propertyDetail.location")}</h3>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[#E31E24] hover:text-[#c91a1f] font-medium flex items-center gap-1"><Navigation className="w-3.5 h-3.5" />{isAr?"الاتجاهات":"Directions"}</a>
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{loc}</p>
              </div>
              <MapView className="h-[400px] rounded-b-2xl" initialCenter={{ lat: p.lat, lng: p.lng }} initialZoom={15} onMapReady={handleMapReady} />
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl p-6 shadow-sm sticky top-28">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-14 h-14 bg-[#0f1b33] rounded-xl flex items-center justify-center"><Building2 className="w-7 h-7 text-[#c8a45e]" /></div>
                <div>
                  <h4 className="font-bold text-[#0f1b33]">{isAr?"القاسم العقارية":"Al-Qasim Real Estate"}</h4>
                  <div className="flex items-center gap-1 text-xs text-green-600"><Shield className="w-3 h-3" /><span>{isAr?"معلن معتمد":"Verified Agent"}</span></div>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <a href="tel:920001911" className="w-full flex items-center justify-center gap-2 bg-[#E31E24] hover:bg-[#c91a1f] text-white font-semibold py-3 rounded-lg transition-colors"><Phone className="w-4 h-4" />{t("propertyDetail.callNow")}</a>
                <a href="https://wa.me/966500051679" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"><MessageCircle className="w-4 h-4" />{t("propertyDetail.whatsapp")}</a>
              </div>
              <div className="border-t border-gray-100 pt-5">
                <h4 className="font-bold text-[#0f1b33] mb-3 text-sm">{isAr?"أرسل استفسارك":"Send Your Inquiry"}</h4>
                <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                  <input type="text" placeholder={t("contact.name")} className="w-full px-4 py-2.5 bg-[#f8f5f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" />
                  <input type="tel" placeholder={t("contact.phone")} className="w-full px-4 py-2.5 bg-[#f8f5f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" dir="ltr" />
                  <textarea placeholder={isAr?"رسالتك...":"Your message..."} rows={3} className="w-full px-4 py-2.5 bg-[#f8f5f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 resize-none" />
                  <button type="submit" className="w-full bg-[#c8a45e] hover:bg-[#b8944e] text-[#0f1b33] font-semibold py-3 rounded-lg transition-colors">{isAr?"إرسال الاستفسار":"Send Inquiry"}</button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
