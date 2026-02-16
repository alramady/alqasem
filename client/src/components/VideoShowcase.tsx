import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Play, ChevronLeft, ChevronRight, X, Volume2, VolumeX } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSection, useSectionVisible } from "@/contexts/SiteConfigContext";

interface VideoItem {
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  url: string;
  thumbnail: string;
}

const DEFAULT_VIDEOS: VideoItem[] = [
  { titleAr: "جولة في منصة القاسم العقارية", titleEn: "Tour of Al-Qasim Platform", descAr: "تعرّف على الموقع الرسمي لشركة القاسم العقارية وخدماتها المتكاملة", descEn: "Discover the official website of Al-Qasim Real Estate and its comprehensive services", url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/EIHRzvxFwTzmsmtQ.mp4", thumbnail: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop" },
  { titleAr: "عرض تفصيلي للعقارات", titleEn: "Detailed Property Showcase", descAr: "استعرض تفاصيل العقارات المعروضة للبيع والإيجار بشكل تفاعلي", descEn: "Browse property details for sale and rent interactively", url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/RqfRkvWjgNwlFLMT.mp4", thumbnail: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop" },
  { titleAr: "البحث المتقدم عن العقارات", titleEn: "Advanced Property Search", descAr: "اكتشف كيفية البحث عن العقار المثالي بسهولة وسرعة", descEn: "Discover how to find the perfect property easily and quickly", url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/temOFMgPaIGIFnqT.mp4", thumbnail: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop" },
  { titleAr: "أضف عقارك في المنصة", titleEn: "List Your Property", descAr: "تعرّف على خطوات إدراج عقارك في منصة القاسم العقارية", descEn: "Learn how to list your property on Al-Qasim platform", url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/QigocfeRjiiGvkYX.mp4", thumbnail: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop" },
  { titleAr: "مشاريع القاسم التطويرية", titleEn: "Al-Qasim Development Projects", descAr: "استعرض أحدث المشاريع التطويرية لشركة القاسم العقارية", descEn: "Explore the latest development projects by Al-Qasim Real Estate", url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/RyAnOABFiVshLPbz.mp4", thumbnail: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop" },
  { titleAr: "تفاصيل العقارات والمعاينة", titleEn: "Property Details & Preview", descAr: "كيفية الاطلاع على تفاصيل العقار وحجز موعد للمعاينة", descEn: "How to view property details and book a viewing appointment", url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/EKIPdekfExquxprs.mp4", thumbnail: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=400&h=300&fit=crop" },
];

export default function VideoShowcase() {
  const { isAr } = useLanguage();
  const videosSection = useSection("videos");
  const isVisible = useSectionVisible("videos");
  const [activeVideo, setActiveVideo] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!isVisible) return null;

  const content = videosSection?.content as any;

  // Read videos from DB content or use defaults
  const dbVideos = content?.videos;
  const videos: VideoItem[] = (dbVideos && Array.isArray(dbVideos) && dbVideos.length > 0)
    ? dbVideos
    : DEFAULT_VIDEOS;

  // Section title from DB
  const sectionTitle = isAr ? (videosSection?.title || "جولات مرئية") : "Video Tours";
  const sectionBadge = isAr ? (videosSection?.subtitle || "الميديا") : "Media";

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const isRtl = document.documentElement.dir === "rtl";
      const amount = isRtl ? (direction === "left" ? 400 : -400) : (direction === "left" ? -400 : 400);
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  const openVideo = (id: number) => { setActiveVideo(id); setIsMuted(true); };
  const closeVideo = () => { setActiveVideo(null); if (videoRef.current) videoRef.current.pause(); };
  const activeVid = activeVideo !== null ? videos[activeVideo] : null;

  return (
    <>
      <section id="videos" className="py-20 bg-[#f8f5f0]">
        <div className="container">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-6">
            <div>
              <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-[#E31E24] font-semibold text-sm mb-2 block tracking-wider">
                {sectionBadge}
              </motion.span>
              <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl lg:text-4xl font-bold text-[#0f1b33]">
                {sectionTitle}
              </motion.h2>
            </div>
            <div className="flex gap-3">
              <button onClick={() => scroll("left")} className="w-11 h-11 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-[#0f1b33] hover:text-[#c8a45e] hover:border-[#0f1b33] transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => scroll("right")} className="w-11 h-11 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-[#0f1b33] hover:text-[#c8a45e] hover:border-[#0f1b33] transition-all">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex gap-6 overflow-x-auto pb-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {videos.map((video, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex-shrink-0 w-80 group cursor-pointer" onClick={() => openVideo(i)}>
                <div className="relative h-48 rounded-2xl overflow-hidden mb-4">
                  <img loading="lazy" src={video.thumbnail} alt={isAr ? video.titleAr : video.titleEn} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-[#0f1b33]/40 group-hover:bg-[#0f1b33]/60 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 bg-[#E31E24] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Play className="w-6 h-6 text-white" fill="white" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 bg-[#0f1b33]/80 text-white text-xs px-2 py-1 rounded-lg" style={{ insetInlineEnd: '0.75rem' }}>{i + 1}/{videos.length}</div>
                </div>
                <h3 className="text-base font-bold text-[#0f1b33] mb-1">{isAr ? video.titleAr : video.titleEn}</h3>
                <p className="text-sm text-gray-500">{isAr ? video.descAr : video.descEn}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {activeVid && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-[#0f1b33]/95 backdrop-blur-lg flex items-center justify-center p-4" onClick={closeVideo}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeVideo} className="absolute -top-12 text-white/60 hover:text-white flex items-center gap-2 transition-colors" style={{ insetInlineEnd: 0 }}>
              <X className="w-5 h-5" /><span className="text-sm">{isAr ? "إغلاق" : "Close"}</span>
            </button>
            <div className="absolute -top-12 text-white" style={{ insetInlineStart: 0 }}>
              <span className="text-lg font-bold">{isAr ? activeVid.titleAr : activeVid.titleEn}</span>
            </div>
            <div className="relative bg-black rounded-2xl overflow-hidden aspect-video">
              <video ref={videoRef} src={activeVid.url} autoPlay muted={isMuted} controls className="w-full h-full" />
            </div>
            <button onClick={() => setIsMuted(!isMuted)} className="absolute bottom-4 bg-[#0f1b33]/80 text-white p-2 rounded-full hover:bg-[#c8a45e] hover:text-[#0f1b33] transition-all" style={{ insetInlineStart: '1rem' }}>
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
