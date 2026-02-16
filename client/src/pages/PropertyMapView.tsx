import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { MapView } from "@/components/Map";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { MapPin, Home, BedDouble, Bath, Maximize2, ChevronLeft, ChevronRight, List, X, Filter, Search } from "lucide-react";

// Group properties by proximity (~100m)
function groupByLocation(properties: any[]): any[][] {
  const groups: any[][] = [];
  const used = new Set<number>();

  properties.forEach((p, i) => {
    if (used.has(i)) return;
    const lat = parseFloat(p.latitude);
    const lng = parseFloat(p.longitude);
    if (isNaN(lat) || isNaN(lng)) return;
    const group: any[] = [p];
    used.add(i);

    properties.forEach((q, j) => {
      if (used.has(j)) return;
      const lat2 = parseFloat(q.latitude);
      const lng2 = parseFloat(q.longitude);
      if (isNaN(lat2) || isNaN(lng2)) return;
      if (Math.abs(lat - lat2) < 0.001 && Math.abs(lng - lng2) < 0.001) {
        group.push(q);
        used.add(j);
      }
    });

    groups.push(group);
  });

  return groups;
}

export default function PropertyMapView() {
  const { t, isAr } = useLanguage();
  const [, navigate] = useLocation();
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any[] | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyType, setPropertyType] = useState("");

  const { data: propertiesData } = trpc.public.searchProperties.useQuery({
    page: 1,
    limit: 50,
  });

  const properties = useMemo(() => {
    if (!propertiesData?.items) return [];
    return propertiesData.items.filter((p: any) => p.latitude && p.longitude);
  }, [propertiesData]);

  const filteredProperties = useMemo(() => {
    let result = properties;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p: any) =>
        (p.title || "").toLowerCase().includes(q) ||
        (p.titleEn || "").toLowerCase().includes(q) ||
        (p.district || "").toLowerCase().includes(q) ||
        (p.districtEn || "").toLowerCase().includes(q)
      );
    }
    if (propertyType) {
      result = result.filter((p: any) => p.propertyType === propertyType);
    }
    return result;
  }, [properties, searchQuery, propertyType]);

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Update markers when filtered properties change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !filteredProperties.length) return;

    // Clear old markers
    markersRef.current.forEach(m => m.map = null);
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    const groups = groupByLocation(filteredProperties);

    groups.forEach(group => {
      const first = group[0];
      const lat = parseFloat(first.latitude);
      const lng = parseFloat(first.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const position = { lat, lng };
      bounds.extend(position);

      const isCluster = group.length > 1;
      const isRent = first.listingType === "rent";
      const dotColor = isCluster ? "#c8a45e" : (isRent ? "#2563eb" : "#E31E24");
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
        map,
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
          map.panTo(position);
          map.setZoom(Math.max(map.getZoom() || 14, 14));
        }
      });

      markersRef.current.push(marker);
    });

    if (markersRef.current.length > 0) {
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: sidebarOpen ? 420 : 50 });
    }
  }, [filteredProperties, isAr, sidebarOpen, navigate]);

  const propertyTypes = useMemo(() => {
    const types = new Set(properties.map((p: any) => p.propertyType).filter(Boolean));
    return Array.from(types);
  }, [properties]);

  const typeLabels: Record<string, { ar: string; en: string }> = {
    apartment: { ar: "شقة", en: "Apartment" },
    villa: { ar: "فيلا", en: "Villa" },
    land: { ar: "أرض", en: "Land" },
    commercial: { ar: "تجاري", en: "Commercial" },
    office: { ar: "مكتب", en: "Office" },
    building: { ar: "عمارة", en: "Building" },
    duplex: { ar: "دوبلكس", en: "Duplex" },
    townhouse: { ar: "تاون هاوس", en: "Townhouse" },
    farm: { ar: "مزرعة", en: "Farm" },
    warehouse: { ar: "مستودع", en: "Warehouse" },
  };

  const selectedProperty = selectedGroup?.[selectedIndex] || null;

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        titleAr="خريطة العقارات"
        titleEn="Property Map"
        descriptionAr="استعرض العقارات على الخريطة التفاعلية"
        descriptionEn="Browse properties on the interactive map"
      />
      <Navbar />

      <div className="pt-20 h-screen flex flex-col">
        {/* Top bar */}
        <div className="bg-white border-b px-4 py-2 flex items-center gap-3 z-10">
          <Link href="/properties" className="flex items-center gap-1 text-sm text-gray-600 hover:text-[#0f1b33]">
            <List className="w-4 h-4" />
            {isAr ? "عرض القائمة" : "List View"}
          </Link>
          <div className="h-5 w-px bg-gray-300" />
          <MapPin className="w-4 h-4 text-[#d4a853]" />
          <span className="text-sm font-semibold text-[#0f1b33]">
            {isAr ? `${filteredProperties.length} عقار على الخريطة` : `${filteredProperties.length} properties on map`}
          </span>
          <div className="flex-1" />

          {/* Legend inline */}
          <div className="hidden md:flex items-center gap-3 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#E31E24] border border-white shadow-sm"></span>
              {isAr ? "بيع" : "Sale"}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#2563eb] border border-white shadow-sm"></span>
              {isAr ? "إيجار" : "Rent"}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-full bg-[#c8a45e] border border-white shadow-sm text-white text-[8px] font-bold flex items-center justify-center">+</span>
              {isAr ? "مجموعة" : "Cluster"}
            </span>
          </div>

          <div className="h-5 w-px bg-gray-300 hidden md:block" />

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-sm text-gray-600 hover:text-[#0f1b33] flex items-center gap-1"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
            {sidebarOpen ? (isAr ? "إخفاء" : "Hide") : (isAr ? "إظهار" : "Show")}
          </button>
        </div>

        <div className="flex-1 flex relative overflow-hidden">
          {/* Sidebar */}
          <div className={`absolute top-0 bottom-0 z-20 bg-white shadow-xl transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : (isAr ? "translate-x-full" : "-translate-x-full")
          }`} style={{ width: "380px", [isAr ? "right" : "left"]: 0 }}>
            <div className="p-3 border-b space-y-2">
              <div className="relative">
                <Search className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" style={{ [isAr ? "right" : "left"]: "0.75rem" }} />
                <input
                  type="text"
                  placeholder={isAr ? "ابحث بالاسم أو الحي..." : "Search by name or district..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border rounded-lg py-2 text-sm bg-gray-50"
                  style={{ [isAr ? "paddingRight" : "paddingLeft"]: "2.5rem", [isAr ? "paddingLeft" : "paddingRight"]: "0.75rem" }}
                  dir={isAr ? "rtl" : "ltr"}
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setPropertyType("")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    !propertyType ? "bg-[#0f1b33] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {isAr ? "الكل" : "All"}
                </button>
                {propertyTypes.map((type) => {
                  const t2 = type as string;
                  return (
                    <button
                      key={t2}
                      onClick={() => setPropertyType(t2 === propertyType ? "" : t2)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        propertyType === t2 ? "bg-[#0f1b33] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {isAr ? typeLabels[t2]?.ar || t2 : typeLabels[t2]?.en || t2}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="overflow-y-auto" style={{ height: "calc(100% - 110px)" }}>
              {filteredProperties.map((property: any) => (
                <Link
                  key={property.id}
                  href={`/properties/${property.id}`}
                  className={`block p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedProperty?.id === property.id ? "bg-blue-50 border-l-4 border-l-[#d4a853]" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="w-24 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-200">
                      {property.mainImage ? (
                        <img src={property.mainImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-[#0f1b33] truncate">
                        {isAr ? property.title : (property.titleEn || property.title)}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 inline" /> {isAr ? property.district : (property.districtEn || property.district)}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        {property.bedrooms && <span className="flex items-center gap-0.5"><BedDouble className="w-3 h-3" />{property.bedrooms}</span>}
                        {property.bathrooms && <span className="flex items-center gap-0.5"><Bath className="w-3 h-3" />{property.bathrooms}</span>}
                        {property.area && <span className="flex items-center gap-0.5"><Maximize2 className="w-3 h-3" />{property.area}m²</span>}
                      </div>
                      <div className="mt-1">
                        <span className="text-sm font-bold text-[#d4a853]">
                          {new Intl.NumberFormat("ar-SA").format(property.price || 0)} {isAr ? "ر.س" : "SAR"}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${isAr ? "mr-2" : "ml-2"} ${
                          property.listingType === "rent" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {property.listingType === "rent" ? (isAr ? "إيجار" : "Rent") : (isAr ? "بيع" : "Sale")}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {filteredProperties.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{isAr ? "لا توجد عقارات بإحداثيات" : "No properties with coordinates"}</p>
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="flex-1">
            <MapView
              initialCenter={{ lat: 24.7136, lng: 46.6753 }}
              initialZoom={11}
              onMapReady={handleMapReady}
            />
          </div>

          {/* Selected cluster popup */}
          {selectedGroup && selectedProperty && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-white rounded-xl shadow-2xl w-[360px] max-w-[90vw] overflow-hidden">
              <button
                onClick={() => { setSelectedGroup(null); setSelectedIndex(0); }}
                className="absolute top-2 z-10 w-6 h-6 bg-black/40 rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
                style={{ insetInlineEnd: '0.5rem' }}
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>

              {/* Cluster pagination header */}
              {selectedGroup.length > 1 && (
                <div className="bg-[#0f1b33] text-white px-3 py-2 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setSelectedIndex(i => (i - 1 + selectedGroup.length) % selectedGroup.length)}
                    className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-medium">
                    {isAr
                      ? `عقار ${selectedIndex + 1} من ${selectedGroup.length}`
                      : `Property ${selectedIndex + 1} of ${selectedGroup.length}`}
                  </span>
                  <button
                    onClick={() => setSelectedIndex(i => (i + 1) % selectedGroup.length)}
                    className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="p-4">
                <div className="flex gap-3">
                  <div className="w-24 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-200">
                    {selectedProperty.mainImage ? (
                      <img src={selectedProperty.mainImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#0f1b33] truncate">
                      {isAr ? selectedProperty.title : (selectedProperty.titleEn || selectedProperty.title)}
                    </h3>
                    <p className="text-lg font-bold text-[#d4a853] mt-1">
                      {new Intl.NumberFormat("ar-SA").format(selectedProperty.price || 0)} {isAr ? "ر.س" : "SAR"}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/properties/${selectedProperty.id}`}
                  className="block mt-3 text-center bg-[#0f1b33] text-white text-sm font-semibold py-2 rounded-lg hover:bg-[#1a2b4a] transition-colors"
                >
                  {isAr ? "عرض التفاصيل" : "View Details"}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
