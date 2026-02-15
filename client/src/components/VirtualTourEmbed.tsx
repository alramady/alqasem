import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Eye, Maximize2, Minimize2, ExternalLink } from "lucide-react";

interface VirtualTourEmbedProps {
  url: string;
  type: "matterport" | "youtube" | "custom";
  propertyTitle?: string;
}

/**
 * Converts a raw URL to an embeddable iframe src.
 * Handles Matterport, YouTube, and generic 360 URLs.
 */
function getEmbedUrl(url: string, type: string): string {
  if (type === "matterport") {
    // Matterport: ensure it uses the embed-friendly URL
    // Typical: https://my.matterport.com/show/?m=XXXXX
    if (url.includes("/show/")) return url;
    // If someone pastes a share link, try to convert
    const mMatch = url.match(/[?&]m=([a-zA-Z0-9]+)/);
    if (mMatch) return `https://my.matterport.com/show/?m=${mMatch[1]}`;
    return url;
  }

  if (type === "youtube") {
    // Convert various YouTube URL formats to embed format
    // Standard: https://www.youtube.com/watch?v=XXXXX
    // Short: https://youtu.be/XXXXX
    // Already embed: https://www.youtube.com/embed/XXXXX
    if (url.includes("/embed/")) return url;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
    return url;
  }

  // Custom: use as-is
  return url;
}

/**
 * Returns the appropriate iframe sandbox and allow attributes per type.
 */
function getIframeAttrs(type: string) {
  const base = {
    allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; xr-spatial-tracking; fullscreen",
    referrerPolicy: "no-referrer-when-downgrade" as const,
  };

  if (type === "matterport") {
    return {
      ...base,
      allow: "xr-spatial-tracking; gyroscope; accelerometer; fullscreen; vr",
      sandbox: "allow-scripts allow-same-origin allow-popups allow-forms" as string | undefined,
    };
  }

  if (type === "youtube") {
    return {
      ...base,
      sandbox: undefined as string | undefined,
    };
  }

  return {
    ...base,
    sandbox: "allow-scripts allow-same-origin allow-popups" as string | undefined,
  };
}

const typeLabels: Record<string, { ar: string; en: string; icon: string }> = {
  matterport: { ar: "جولة Matterport ثلاثية الأبعاد", en: "Matterport 3D Tour", icon: "🏠" },
  youtube: { ar: "جولة YouTube 360°", en: "YouTube 360° Tour", icon: "🎥" },
  custom: { ar: "جولة افتراضية 360°", en: "360° Virtual Tour", icon: "🌐" },
};

export default function VirtualTourEmbed({ url, type, propertyTitle }: VirtualTourEmbedProps) {
  const { isAr } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const embedUrl = getEmbedUrl(url, type);
  const iframeAttrs = getIframeAttrs(type);
  const label = typeLabels[type] || typeLabels.custom;

  if (hasError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#0f1b33] flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#c8a45e]" />
            {isAr ? label.ar : label.en}
          </h3>
        </div>
        <div className="bg-[#f8f5f0] rounded-xl p-8 text-center">
          <p className="text-gray-500 mb-3">
            {isAr ? "تعذر تحميل الجولة الافتراضية" : "Unable to load virtual tour"}
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#c8a45e] text-[#0f1b33] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#b8944e] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            {isAr ? "فتح في نافذة جديدة" : "Open in New Tab"}
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm print:hidden"
    >
      {/* Header */}
      <div className="p-6 pb-3 flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#0f1b33] flex items-center gap-2">
          <Eye className="w-5 h-5 text-[#c8a45e]" />
          <span>{label.icon}</span>
          {isAr ? label.ar : label.en}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-[#f8f5f0] transition-colors text-gray-500 hover:text-[#0f1b33]"
            title={isExpanded ? (isAr ? "تصغير" : "Minimize") : (isAr ? "تكبير" : "Expand")}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-[#f8f5f0] transition-colors text-gray-500 hover:text-[#0f1b33]"
            title={isAr ? "فتح في نافذة جديدة" : "Open in new tab"}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Embed Container */}
      <div
        className={`relative transition-all duration-500 ease-in-out ${
          isExpanded ? "h-[80vh]" : "h-[400px] md:h-[450px]"
        }`}
      >
        {/* Loading skeleton */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-[#f8f5f0] flex flex-col items-center justify-center z-10">
            <div className="w-12 h-12 border-4 border-[#c8a45e]/30 border-t-[#c8a45e] rounded-full animate-spin mb-4" />
            <p className="text-gray-500 text-sm">
              {isAr ? "جاري تحميل الجولة الافتراضية..." : "Loading virtual tour..."}
            </p>
          </div>
        )}

        <iframe
          src={embedUrl}
          title={propertyTitle ? `${isAr ? "جولة افتراضية" : "Virtual Tour"} - ${propertyTitle}` : (isAr ? "جولة افتراضية 360°" : "360° Virtual Tour")}
          className="w-full h-full border-0"
          allow={iframeAttrs.allow}
          allowFullScreen
          loading="lazy"
          referrerPolicy={iframeAttrs.referrerPolicy}
          {...(iframeAttrs.sandbox ? { sandbox: iframeAttrs.sandbox } : {})}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      </div>

      {/* Footer hint */}
      <div className="px-6 py-3 bg-[#f8f5f0]/50 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">
          {isAr
            ? "استخدم الماوس أو اللمس للتنقل داخل الجولة الافتراضية • اضغط على أيقونة التكبير للعرض الكامل"
            : "Use mouse or touch to navigate the virtual tour • Click expand icon for full view"}
        </p>
      </div>
    </motion.div>
  );
}

// Export helper for URL validation
export function isValidVirtualTourUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Export helper for auto-detecting tour type
export function detectTourType(url: string): "matterport" | "youtube" | "custom" {
  if (url.includes("matterport.com") || url.includes("my.matterport")) return "matterport";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  return "custom";
}
