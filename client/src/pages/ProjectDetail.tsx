import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MapView } from "@/components/Map";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  MapPin, Building2, Phone, MessageCircle, ChevronLeft, ChevronRight,
  CheckCircle, Shield, Layers, Home, CalendarDays, TrendingUp,
  Play, X, Maximize2, Grid3X3, Star, ArrowRight, Users, Loader2, Navigation,
} from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

function ImageLightbox({
  images, activeIndex, onClose, onNext, onPrev, dir,
}: {
  images: string[]; activeIndex: number; onClose: () => void; onNext: () => void; onPrev: () => void; dir: "rtl" | "ltr";
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") dir === "rtl" ? onPrev() : onNext();
      if (e.key === "ArrowLeft") dir === "rtl" ? onNext() : onPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onNext, onPrev, dir]);

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-4 left-4 z-50 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">{activeIndex + 1} / {images.length}</div>
        {images.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute inset-inline-start-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
              <ChevronLeft className="w-6 h-6 rtl:rotate-180" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute inset-inline-end-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
              <ChevronRight className="w-6 h-6 rtl:rotate-180" />
            </button>
          </>
        )}
        <motion.img key={activeIndex} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} src={images[activeIndex]} alt="" className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
      </motion.div>
    </AnimatePresence>
  );
}

export default function ProjectDetail({ id }: { id: string }) {
  const { t, lang, dir } = useLanguage();
  const isAr = lang === "ar";


  const projectId = parseInt(id);
  const { data: project, isLoading, error } = trpc.public.getProject.useQuery(
    { id: projectId },
    { enabled: !isNaN(projectId) && projectId > 0 }
  );

  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  const images: string[] = Array.isArray(project?.images) ? (project.images as string[]) : [];
  const features: string[] = Array.isArray(project?.features) ? (project.features as string[]) : [];

  const nextImage = useCallback(() => {
    if (images.length > 1) setActiveImage((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    if (images.length > 1) setActiveImage((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const totalUnits = project?.totalUnits || 0;
  const soldUnits = project?.soldUnits || 0;
  const progressPercent = totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0;

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0` : url;
  };

  const statusLabels: Record<string, { labelAr: string; labelEn: string; color: string; bg: string }> = {
    active: { labelAr: "جاري التنفيذ", labelEn: "In Progress", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    completed: { labelAr: "مكتمل", labelEn: "Completed", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
    upcoming: { labelAr: "قريباً", labelEn: "Upcoming", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  };
  const statusInfo = statusLabels[project?.status || "active"] || statusLabels.active;
  const statusLabel = isAr ? statusInfo.labelAr : statusInfo.labelEn;

  const hasCoords = project?.latitude && project?.longitude;
  const lat = hasCoords ? parseFloat(String(project.latitude)) : 0;
  const lng = hasCoords ? parseFloat(String(project.longitude)) : 0;

  const handleMapReady = (map: google.maps.Map) => {
    if (!hasCoords) return;
    mapRef.current = map;
    const projTitle = isAr ? (project?.title || "") : (project?.titleEn || project?.title || "");
    const projLoc = isAr ? (project?.location || "") : (project?.locationEn || project?.location || "");
    const marker = new google.maps.marker.AdvancedMarkerElement({ map, position: { lat, lng }, title: projTitle });
    const iw = new google.maps.InfoWindow({
      content: `<div style="padding:8px;font-family:inherit;direction:${dir};min-width:200px;">
        <h3 style="margin:0 0 6px;font-size:14px;font-weight:700;color:#0f1b33;">${projTitle}</h3>
        <p style="margin:0;font-size:12px;color:#666;"><span style="color:#c8a45e;">📍</span> ${projLoc}</p>
      </div>`,
    });
    marker.addListener("click", () => iw.open({ anchor: marker, map }));
    iw.open({ anchor: marker, map });
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

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#f8f5f0]">
        <Navbar />
        <div className="pt-32 flex flex-col items-center justify-center min-h-[60vh]">
          <Building2 className="w-16 h-16 text-[#0f1b33]/20 mb-4" />
          <h2 className="text-2xl font-bold text-[#0f1b33] mb-2">{t("projectDetail.notFound")}</h2>
          <p className="text-[#0f1b33]/50 mb-6">{isAr ? "عذراً، لم نتمكن من العثور على المشروع المطلوب." : "Sorry, we couldn't find the requested project."}</p>
          <Link href="/projects" className="bg-[#c8a45e] text-[#0f1b33] font-semibold px-6 py-3 rounded-lg hover:bg-[#b8944e] transition-colors">
            {t("projectDetail.back")}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <Navbar />

      {/* Breadcrumb */}
      <div className="pt-28 pb-4 bg-white border-b border-gray-100">
        <div className="container">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-[#c8a45e] transition-colors">{t("nav.home")}</Link>
            <ChevronLeft className="w-3 h-3" />
            <Link href="/projects" className="hover:text-[#c8a45e] transition-colors">{t("nav.projects")}</Link>
            <ChevronLeft className="w-3 h-3" />
            <span className="text-[#0f1b33] font-medium">{isAr ? project.title : (project.titleEn || project.title)}</span>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Image Gallery */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              {images.length > 0 ? (
                <>
                  <div className="relative aspect-[16/10] group">
                    <img src={images[activeImage]} alt={project.title} className="w-full h-full object-cover cursor-pointer" onClick={() => setLightboxOpen(true)} />
                    <div className="absolute top-4 inset-inline-start-4 flex gap-2">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${statusInfo.bg} ${statusInfo.color}`}>{statusLabel}</span>
                      {project.isFeatured && (
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#c8a45e] text-[#0f1b33] flex items-center gap-1">
                          <Star className="w-3 h-3" />{isAr ? "مميز" : "Featured"}
                        </span>
                      )}
                    </div>
                    <button onClick={() => setLightboxOpen(true)} className="absolute top-4 inset-inline-end-4 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors opacity-0 group-hover:opacity-100">
                      <Maximize2 className="w-5 h-5 text-gray-600" />
                    </button>
                    {images.length > 1 && (
                      <>
                        <button onClick={prevImage} className="absolute inset-inline-start-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors opacity-0 group-hover:opacity-100">
                          <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
                        </button>
                        <button onClick={nextImage} className="absolute inset-inline-end-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors opacity-0 group-hover:opacity-100">
                          <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                        </button>
                      </>
                    )}
                    <div className="absolute bottom-4 inset-inline-start-4 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5">
                      <Grid3X3 className="w-3 h-3" />{activeImage + 1} / {images.length}
                    </div>
                    {project.videoUrl && (
                      <button onClick={() => setShowVideo(true)} className="absolute bottom-4 inset-inline-end-4 bg-[#E31E24] text-white text-xs px-4 py-2 rounded-full flex items-center gap-1.5 hover:bg-[#c91a1f] transition-colors">
                        <Play className="w-3.5 h-3.5 fill-current" />{isAr ? "مشاهدة الفيديو" : "Watch Video"}
                      </button>
                    )}
                  </div>
                  {images.length > 1 && (
                    <div className="p-3 flex gap-2 overflow-x-auto">
                      {images.map((img, i) => (
                        <button key={i} onClick={() => setActiveImage(i)} className={`shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === activeImage ? "border-[#c8a45e] ring-2 ring-[#c8a45e]/30" : "border-transparent opacity-60 hover:opacity-100"}`}>
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-[16/10] bg-gradient-to-br from-[#0f1b33] to-[#1a2b4a] flex flex-col items-center justify-center">
                  <Building2 className="w-16 h-16 text-[#c8a45e]/40 mb-3" />
                  <p className="text-white/40 text-sm">{isAr ? "لا توجد صور للمشروع" : "No project images"}</p>
                </div>
              )}
            </motion.div>

            {/* Project Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-[#0f1b33] mb-2">{isAr ? project.title : (project.titleEn || project.title)}</h1>
                {(project.subtitle || project.subtitleEn) && <p className="text-[#c8a45e] font-medium mb-2">{isAr ? project.subtitle : (project.subtitleEn || project.subtitle)}</p>}
                {(project.location || project.locationEn) && <div className="flex items-center gap-1.5 text-gray-500"><MapPin className="w-4 h-4" /><span>{isAr ? project.location : (project.locationEn || project.location)}</span></div>}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-5 border-t border-b border-gray-100">
                {totalUnits > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-[#f8f5f0] rounded-lg">
                    <Home className="w-5 h-5 text-[#c8a45e]" />
                    <div><span className="block text-lg font-bold text-[#0f1b33]">{totalUnits}</span><span className="text-xs text-gray-500">{t("projectDetail.totalUnits")}</span></div>
                  </div>
                )}
                {soldUnits > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-[#f8f5f0] rounded-lg">
                    <Users className="w-5 h-5 text-[#c8a45e]" />
                    <div><span className="block text-lg font-bold text-[#0f1b33]">{soldUnits}</span><span className="text-xs text-gray-500">{t("projectDetail.soldUnits")}</span></div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 bg-[#f8f5f0] rounded-lg">
                  <CalendarDays className="w-5 h-5 text-[#c8a45e]" />
                  <div>
                    <span className="block text-sm font-bold text-[#0f1b33]">
                      {new Date(project.createdAt).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "long" })}
                    </span>
                    <span className="text-xs text-gray-500">{isAr ? "تاريخ الإطلاق" : "Launch Date"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#f8f5f0] rounded-lg">
                  <Layers className="w-5 h-5 text-[#c8a45e]" />
                  <div><span className={`block text-sm font-bold ${statusInfo.color}`}>{statusLabel}</span><span className="text-xs text-gray-500">{isAr ? "حالة المشروع" : "Project Status"}</span></div>
                </div>
              </div>

              {/* Sales Progress */}
              {totalUnits > 0 && (
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-[#0f1b33] flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-[#c8a45e]" />{t("projectDetail.progress")}
                    </span>
                    <span className="text-sm font-bold text-[#c8a45e]">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                      className={`h-full rounded-full ${progressPercent >= 80 ? "bg-gradient-to-l from-[#E31E24] to-[#ff4444]" : progressPercent >= 50 ? "bg-gradient-to-l from-[#c8a45e] to-[#dbb96e]" : "bg-gradient-to-l from-emerald-500 to-emerald-400"}`} />
                  </div>
                  <div className="flex justify-between mt-1.5 text-xs text-gray-400">
                    <span>{soldUnits} {isAr ? "مباعة" : "sold"}</span>
                    <span>{totalUnits - soldUnits} {isAr ? "متاحة" : "available"}</span>
                  </div>
                </div>
              )}

              {/* Description */}
              {(project.description || project.descriptionEn) && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-[#0f1b33] mb-3">{t("projectDetail.description")}</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{isAr ? project.description : (project.descriptionEn || project.description)}</p>
                </div>
              )}
            </motion.div>

            {/* Features */}
            {features.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-[#0f1b33] mb-4">{t("projectDetail.features")}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {features.map((feature, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }} className="flex items-center gap-2 p-3 bg-[#f8f5f0] rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /><span className="text-sm text-[#0f1b33]">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Google Map */}
            {hasCoords && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-bold text-[#0f1b33] flex items-center gap-2">
                      <Navigation className="w-5 h-5 text-[#c8a45e]" />{t("projectDetail.map")}
                    </h3>
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[#E31E24] hover:text-[#c91a1f] font-medium flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5" />{isAr ? "الاتجاهات" : "Directions"}
                    </a>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{isAr ? project.location : (project.locationEn || project.location)}</p>
                </div>
                <MapView className="h-[400px] rounded-b-2xl" initialCenter={{ lat, lng }} initialZoom={15} onMapReady={handleMapReady} />
              </motion.div>
            )}

            {/* Video Section */}
            {project.videoUrl && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 pb-4">
                  <h3 className="text-lg font-bold text-[#0f1b33] flex items-center gap-2">
                    <Play className="w-5 h-5 text-[#E31E24]" />{t("projectDetail.video")}
                  </h3>
                </div>
                {showVideo ? (
                  <div className="aspect-video">
                    <iframe src={getYouTubeEmbedUrl(project.videoUrl)} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-[#0f1b33] to-[#1a2b4a] flex items-center justify-center cursor-pointer group relative" onClick={() => setShowVideo(true)}>
                    {images.length > 0 && <img src={images[0]} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
                    <div className="relative z-10 flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-[#E31E24] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                        <Play className="w-7 h-7 text-white fill-current" />
                      </div>
                      <span className="text-white/80 text-sm font-medium">{isAr ? "اضغط لمشاهدة الفيديو" : "Click to watch video"}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl p-6 shadow-sm sticky top-28">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-14 h-14 bg-[#0f1b33] rounded-xl flex items-center justify-center"><Building2 className="w-7 h-7 text-[#c8a45e]" /></div>
                <div>
                  <h4 className="font-bold text-[#0f1b33]">{isAr ? "القاسم العقارية" : "Al-Qasim Real Estate"}</h4>
                  <div className="flex items-center gap-1 text-xs text-green-600"><Shield className="w-3 h-3" /><span>{isAr ? "مطور معتمد" : "Verified Developer"}</span></div>
                </div>
              </div>

              <div className="mb-5 p-4 bg-[#f8f5f0] rounded-xl">
                <h5 className="text-sm font-semibold text-[#0f1b33] mb-3">{isAr ? "ملخص المشروع" : "Project Summary"}</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">{isAr ? "الحالة" : "Status"}</span><span className={`font-medium ${statusInfo.color}`}>{statusLabel}</span></div>
                  {(project.location || project.locationEn) && <div className="flex justify-between"><span className="text-gray-500">{isAr ? "الموقع" : "Location"}</span><span className="font-medium text-[#0f1b33]">{isAr ? project.location : (project.locationEn || project.location)}</span></div>}
                  {totalUnits > 0 && <div className="flex justify-between"><span className="text-gray-500">{t("projectDetail.totalUnits")}</span><span className="font-medium text-[#0f1b33]">{totalUnits} {isAr ? "وحدة" : "units"}</span></div>}
                  {totalUnits > 0 && <div className="flex justify-between"><span className="text-gray-500">{t("projectDetail.availableUnits")}</span><span className="font-medium text-emerald-600">{totalUnits - soldUnits} {isAr ? "وحدة" : "units"}</span></div>}
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <a href="tel:920001911" className="w-full flex items-center justify-center gap-2 bg-[#E31E24] hover:bg-[#c91a1f] text-white font-semibold py-3 rounded-lg transition-colors">
                  <Phone className="w-4 h-4" />{t("projectDetail.callNow")}
                </a>
                <a href="https://wa.me/966500051679" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors">
                  <MessageCircle className="w-4 h-4" />{t("projectDetail.whatsapp")}
                </a>
              </div>

              <Link href="/request-property" className="w-full flex items-center justify-center gap-2 bg-[#c8a45e] hover:bg-[#b8944e] text-[#0f1b33] font-semibold py-3 rounded-lg transition-colors">
                {isAr ? "أطلب وحدتك الآن" : "Request Your Unit Now"}<ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && images.length > 0 && (
        <ImageLightbox images={images} activeIndex={activeImage} onClose={() => setLightboxOpen(false)} onNext={nextImage} onPrev={prevImage} dir={dir} />
      )}

      {/* Video Modal */}
      {showVideo && project.videoUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setShowVideo(false)}>
          <button onClick={() => setShowVideo(false)} className="absolute top-4 left-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="w-full max-w-4xl aspect-video" onClick={(e) => e.stopPropagation()}>
            <iframe src={getYouTubeEmbedUrl(project.videoUrl)} className="w-full h-full rounded-xl" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
