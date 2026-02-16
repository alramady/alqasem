import { useRef, useCallback, useEffect, useState } from "react";
import { MapView } from "@/components/Map";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, X, BedDouble, Bath, Maximize, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";

interface Property {
  id: number;
  title: string;
  titleEn?: string | null;
  type: string;
  listingType: string;
  status: string;
  price: string | null;
  area: string | null;
  rooms: number | null;
  bathrooms: number | null;
  city: string | null;
  cityEn?: string | null;
  district: string | null;
  districtEn?: string | null;
  latitude: string | null;
  longitude: string | null;
  images: unknown;
}

interface PropertyMapViewProps {
  properties: Property[];
  className?: string;
}

const typeIcons: Record<string, string> = {
  villa: "🏠", apartment: "🏢", land: "🏗️", commercial: "🏪", office: "🏛️", building: "🏘️",
};

function formatPrice(price: string | null) {
  if (!price) return null;
  const num = parseFloat(price);
  if (isNaN(num)) return null;
  return num.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

// Group properties by proximity (within ~100m)
function groupByLocation(properties: Property[]): Property[][] {
  const groups: Property[][] = [];
  const used = new Set<number>();

  properties.forEach((p, i) => {
    if (used.has(i)) return;
    const lat = parseFloat(p.latitude!);
    const lng = parseFloat(p.longitude!);
    const group: Property[] = [p];
    used.add(i);

    properties.forEach((q, j) => {
      if (used.has(j)) return;
      const lat2 = parseFloat(q.latitude!);
      const lng2 = parseFloat(q.longitude!);
      // ~0.001 degree ≈ 111m
      if (Math.abs(lat - lat2) < 0.001 && Math.abs(lng - lng2) < 0.001) {
        group.push(q);
        used.add(j);
      }
    });

    groups.push(group);
  });

  return groups;
}

export default function PropertyMapView({ properties, className }: PropertyMapViewProps) {
  const { isAr } = useLanguage();
  const [, navigate] = useLocation();
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Property[] | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mapReady, setMapReady] = useState(false);

  const geoProperties = properties.filter(
    p => p.latitude && p.longitude && parseFloat(p.latitude) !== 0 && parseFloat(p.longitude) !== 0
  );

  const center = geoProperties.length > 0
    ? {
        lat: geoProperties.reduce((sum, p) => sum + parseFloat(p.latitude!), 0) / geoProperties.length,
        lng: geoProperties.reduce((sum, p) => sum + parseFloat(p.longitude!), 0) / geoProperties.length,
      }
    : { lat: 24.7136, lng: 46.6753 };

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapReady(true);
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    markersRef.current.forEach(m => (m.map = null));
    markersRef.current = [];

    if (geoProperties.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    const groups = groupByLocation(geoProperties);

    groups.forEach(group => {
      const first = group[0];
      const lat = parseFloat(first.latitude!);
      const lng = parseFloat(first.longitude!);
      const position = { lat, lng };
      bounds.extend(position);

      const isCluster = group.length > 1;
      const hasRent = group.some(p => p.listingType === "rent");
      const hasSale = group.some(p => p.listingType !== "rent");
      const dotColor = isCluster ? "#c8a45e" : (hasRent ? "#2563eb" : "#E31E24");
      const dotSize = isCluster ? 28 : 16;

      const markerEl = document.createElement("div");
      markerEl.style.cursor = "pointer";
      markerEl.style.transition = "transform 0.2s";

      if (isCluster) {
        markerEl.innerHTML = `
          <div style="
            width: ${dotSize}px;
            height: ${dotSize}px;
            border-radius: 50%;
            background: ${dotColor};
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 11px;
            font-weight: 800;
            font-family: system-ui, sans-serif;
          ">${group.length}</div>
        `;
      } else {
        markerEl.innerHTML = `
          <div style="
            width: ${dotSize}px;
            height: ${dotSize}px;
            border-radius: 50%;
            background: ${dotColor};
            border: 2.5px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          "></div>
        `;
      }

      markerEl.addEventListener("mouseenter", () => {
        markerEl.style.transform = "scale(1.3)";
        markerEl.style.zIndex = "999";
      });
      markerEl.addEventListener("mouseleave", () => {
        markerEl.style.transform = "scale(1)";
        markerEl.style.zIndex = "auto";
      });

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current!,
        position,
        content: markerEl,
        title: isCluster
          ? `${group.length} ${isAr ? "عقارات" : "properties"}`
          : (isAr ? first.title : (first.titleEn || first.title)),
      });

      marker.addListener("click", () => {
        if (group.length === 1) {
          // Single property — navigate directly
          navigate(`/properties/${first.id}`);
        } else {
          // Multiple properties — show group panel
          setSelectedGroup(group);
          setSelectedIndex(0);
          mapRef.current?.panTo(position);
        }
      });

      markersRef.current.push(marker);
    });

    if (geoProperties.length > 1) {
      mapRef.current.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
    } else if (geoProperties.length === 1) {
      mapRef.current.setCenter(bounds.getCenter());
      mapRef.current.setZoom(15);
    }
  }, [mapReady, geoProperties.length, properties, isAr, navigate]);

  const selectedProperty = selectedGroup?.[selectedIndex] || null;

  if (geoProperties.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-xl flex flex-col items-center justify-center py-16 ${className || ""}`}>
        <MapPin className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-gray-400 text-sm">
          {isAr ? "لا توجد عقارات بإحداثيات جغرافية لعرضها على الخريطة" : "No properties with coordinates to display on map"}
        </p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl overflow-hidden ${className || ""}`}>
      <MapView
        className="w-full h-[500px] md:h-[600px]"
        initialCenter={center}
        initialZoom={geoProperties.length > 1 ? 6 : 15}
        onMapReady={handleMapReady}
      />

      {/* Property count badge */}
      <div className="absolute top-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-md text-sm font-medium text-[#0f1b33]" style={{ insetInlineStart: '0.75rem' }}>
        <MapPin className="w-4 h-4 inline-block text-[#E31E24]" style={{ marginInlineEnd: '0.25rem' }} />
        {geoProperties.length} {isAr ? "عقار على الخريطة" : "properties on map"}
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md flex items-center gap-3 text-xs" style={{ insetInlineStart: '0.75rem' }}>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#E31E24] border border-white shadow-sm"></span>
          {isAr ? "للبيع" : "For Sale"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#2563eb] border border-white shadow-sm"></span>
          {isAr ? "للإيجار" : "For Rent"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-[#c8a45e] border border-white shadow-sm text-white text-[8px] font-bold flex items-center justify-center">+</span>
          {isAr ? "مجموعة" : "Cluster"}
        </span>
      </div>

      {/* Selected Cluster Property List */}
      {selectedGroup && selectedGroup.length > 0 && (
        <div className="absolute top-3 bg-white rounded-xl shadow-xl w-80 overflow-hidden" style={{ insetInlineEnd: '0.75rem' }}>
          {/* Header */}
          <div className="bg-[#0f1b33] text-white px-3 py-2.5 flex items-center justify-between">
            <span className="font-semibold text-sm">
              {isAr
                ? `${selectedGroup.length} عقارات في هذا الموقع`
                : `${selectedGroup.length} properties at this location`}
            </span>
            <button
              onClick={() => { setSelectedGroup(null); setSelectedIndex(0); }}
              className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scrollable property list */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100">
            {selectedGroup.map((prop) => {
              const images = Array.isArray(prop.images) ? (prop.images as string[]) : [];
              const cover = images[0];
              const isRent = prop.listingType === "rent";
              return (
                <Link
                  key={prop.id}
                  href={`/properties/${prop.id}`}
                  className="flex gap-3 p-3 hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-200">
                    {cover ? (
                      <img loading="lazy" src={cover} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#0f1b33] to-[#1a2b4a] flex items-center justify-center">
                        <span className="text-lg">{typeIcons[prop.type] || "🏠"}</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-[#0f1b33] truncate group-hover:text-[#c8a45e] transition-colors">
                      {isAr ? prop.title : (prop.titleEn || prop.title)}
                    </h4>

                    {/* Specs row */}
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                      {prop.rooms && prop.rooms > 0 && (
                        <span className="flex items-center gap-0.5"><BedDouble className="w-2.5 h-2.5" />{prop.rooms}</span>
                      )}
                      {prop.bathrooms && prop.bathrooms > 0 && (
                        <span className="flex items-center gap-0.5"><Bath className="w-2.5 h-2.5" />{prop.bathrooms}</span>
                      )}
                      {prop.area && (
                        <span className="flex items-center gap-0.5"><Maximize className="w-2.5 h-2.5" />{parseFloat(prop.area).toLocaleString()} م²</span>
                      )}
                    </div>

                    {/* Price + type badge */}
                    <div className="flex items-center gap-2 mt-1">
                      {formatPrice(prop.price) ? (
                        <span className="text-xs font-bold text-[#E31E24]" dir="ltr">
                          {formatPrice(prop.price)} SAR
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">{isAr ? "عند الطلب" : "On request"}</span>
                      )}
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                        isRent ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {isRent ? (isAr ? "إيجار" : "Rent") : (isAr ? "بيع" : "Sale")}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-3.5 h-3.5 text-[#c8a45e]" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
