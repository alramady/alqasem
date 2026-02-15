import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { MapView } from "@/components/Map";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { MapPin, Home, BedDouble, Bath, Maximize2, ChevronLeft, ChevronRight, List, X, Filter, Search } from "lucide-react";

export default function PropertyMapView() {
  const { t, isAr } = useLanguage();
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
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

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `${(price / 1000).toFixed(0)}K`;
    return price.toString();
  };

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

    filteredProperties.forEach((property: any) => {
      const lat = parseFloat(property.latitude);
      const lng = parseFloat(property.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const position = { lat, lng };
      bounds.extend(position);

      const priceLabel = document.createElement("div");
      priceLabel.className = "property-marker";
      priceLabel.innerHTML = `
        <div style="
          background: ${property.listingType === 'rent' ? '#059669' : '#0f1b33'};
          color: white;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.15s;
          border: 2px solid white;
        ">${formatPrice(property.price || 0)} ${isAr ? 'ر.س' : 'SAR'}</div>
      `;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position,
        content: priceLabel,
        title: isAr ? property.title : (property.titleEn || property.title),
      });

      marker.addListener("click", () => {
        setSelectedProperty(property);
        map.panTo(position);
        map.setZoom(Math.max(map.getZoom() || 14, 14));
      });

      markersRef.current.push(marker);
    });

    if (markersRef.current.length > 0) {
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: sidebarOpen ? 420 : 50 });
    }
  }, [filteredProperties, isAr, sidebarOpen]);

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
                <div
                  key={property.id}
                  onClick={() => {
                    setSelectedProperty(property);
                    const lat = parseFloat(property.latitude);
                    const lng = parseFloat(property.longitude);
                    if (mapRef.current && !isNaN(lat) && !isNaN(lng)) {
                      mapRef.current.panTo({ lat, lng });
                      mapRef.current.setZoom(15);
                    }
                  }}
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
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
                </div>
              ))}
              {filteredProperties.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
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

          {/* Selected property popup */}
          {selectedProperty && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-white rounded-xl shadow-2xl p-4 w-[360px] max-w-[90vw]">
              <button
                onClick={() => setSelectedProperty(null)}
                className="absolute top-2 right-2 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
              >
                <X className="w-3 h-3" />
              </button>
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
          )}
        </div>
      </div>
    </div>
  );
}
