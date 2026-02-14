import { useRef, useCallback, useEffect, useState } from "react";
import { MapView } from "@/components/Map";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, X, BedDouble, Bath, Maximize, ExternalLink } from "lucide-react";
import { Link } from "wouter";

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

export default function PropertyMapView({ properties, className }: PropertyMapViewProps) {
  const { isAr } = useLanguage();
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Filter properties that have lat/lng
  const geoProperties = properties.filter(
    p => p.latitude && p.longitude && parseFloat(p.latitude) !== 0 && parseFloat(p.longitude) !== 0
  );

  // Calculate center from properties or default to Riyadh
  const center = geoProperties.length > 0
    ? {
        lat: geoProperties.reduce((sum, p) => sum + parseFloat(p.latitude!), 0) / geoProperties.length,
        lng: geoProperties.reduce((sum, p) => sum + parseFloat(p.longitude!), 0) / geoProperties.length,
      }
    : { lat: 24.7136, lng: 46.6753 }; // Riyadh

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapReady(true);
  }, []);

  // Add markers when map is ready or properties change
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(m => (m.map = null));
    markersRef.current = [];

    if (geoProperties.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    geoProperties.forEach(property => {
      const lat = parseFloat(property.latitude!);
      const lng = parseFloat(property.longitude!);
      const position = { lat, lng };
      bounds.extend(position);

      // Create custom marker element
      const markerEl = document.createElement("div");
      markerEl.className = "property-marker";
      const priceFormatted = formatPrice(property.price);
      const isRent = property.listingType === "rent";
      
      markerEl.innerHTML = `
        <div style="
          background: ${isRent ? '#2563eb' : '#E31E24'};
          color: white;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.2s;
          font-family: system-ui, -apple-system, sans-serif;
          direction: ltr;
        ">
          ${priceFormatted ? `${priceFormatted} SAR` : typeIcons[property.type] || '🏠'}
        </div>
        <div style="
          width: 0; height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid ${isRent ? '#2563eb' : '#E31E24'};
          margin: 0 auto;
        "></div>
      `;

      markerEl.addEventListener("mouseenter", () => {
        markerEl.style.transform = "scale(1.15)";
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
        title: property.title,
      });

      marker.addListener("click", () => {
        setSelectedProperty(property);
        mapRef.current?.panTo(position);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds
    if (geoProperties.length > 1) {
      mapRef.current.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
    } else if (geoProperties.length === 1) {
      mapRef.current.setCenter(bounds.getCenter());
      mapRef.current.setZoom(15);
    }
  }, [mapReady, geoProperties.length, properties]);

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
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-[#E31E24]"></span>
          {isAr ? "للبيع" : "For Sale"}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-[#2563eb]"></span>
          {isAr ? "للإيجار" : "For Rent"}
        </span>
      </div>

      {/* Selected Property Card */}
      {selectedProperty && (
        <div className="absolute top-3 bg-white rounded-xl shadow-xl w-72 overflow-hidden" style={{ insetInlineEnd: '0.75rem' }}>
          <button
            onClick={() => setSelectedProperty(null)}
            className="absolute top-2 z-10 w-6 h-6 bg-black/40 rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
            style={{ insetInlineEnd: '0.5rem' }}
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>

          {/* Image */}
          {(() => {
            const images = Array.isArray(selectedProperty.images) ? (selectedProperty.images as string[]) : [];
            const cover = images[0];
            return cover ? (
              <img src={cover} alt={selectedProperty.title} className="w-full h-32 object-cover" />
            ) : (
              <div className="w-full h-32 bg-gradient-to-br from-[#0f1b33] to-[#1a2b4a] flex items-center justify-center">
                <span className="text-3xl">{typeIcons[selectedProperty.type] || "🏠"}</span>
              </div>
            );
          })()}

          <div className="p-3">
            <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {isAr ? selectedProperty.city : (selectedProperty.cityEn || selectedProperty.city)}
                {selectedProperty.district && ` - ${isAr ? selectedProperty.district : (selectedProperty.districtEn || selectedProperty.district)}`}
              </span>
            </div>
            <h4 className="font-bold text-[#0f1b33] text-sm line-clamp-2 mb-2">
              {isAr ? selectedProperty.title : (selectedProperty.titleEn || selectedProperty.title)}
            </h4>
            <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
              {selectedProperty.rooms && selectedProperty.rooms > 0 && (
                <span className="flex items-center gap-0.5"><BedDouble className="w-3 h-3" />{selectedProperty.rooms}</span>
              )}
              {selectedProperty.bathrooms && selectedProperty.bathrooms > 0 && (
                <span className="flex items-center gap-0.5"><Bath className="w-3 h-3" />{selectedProperty.bathrooms}</span>
              )}
              {selectedProperty.area && (
                <span className="flex items-center gap-0.5"><Maximize className="w-3 h-3" />{parseFloat(selectedProperty.area).toLocaleString()} م²</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              {formatPrice(selectedProperty.price) ? (
                <span className="text-sm font-bold text-[#E31E24]" dir="ltr">
                  {formatPrice(selectedProperty.price)} SAR
                </span>
              ) : (
                <span className="text-xs text-gray-400">{isAr ? "السعر عند الطلب" : "Price on request"}</span>
              )}
              <Link href={`/properties/${selectedProperty.id}`}
                className="flex items-center gap-1 text-xs text-[#c8a45e] font-medium hover:underline">
                {isAr ? "التفاصيل" : "Details"} <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
