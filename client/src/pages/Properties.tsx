import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Search, MapPin, BedDouble, Bath, Maximize, Heart, Scale,
  SlidersHorizontal, Grid3X3, List, ChevronDown, X,
  ChevronLeft, ChevronRight, Loader2, ArrowUpDown, Map as MapIcon
} from "lucide-react";
import { lazy, Suspense } from "react";
const PropertyMapView = lazy(() => import("@/components/PropertyMapView"));
import { Link, useSearch } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { useFavorites } from "@/hooks/useFavorites";

type PropertyType = "villa" | "apartment" | "land" | "commercial" | "office" | "building";
type ListingType = "sale" | "rent";
type SortOption = "newest" | "oldest" | "price_asc" | "price_desc" | "area_asc" | "area_desc";

const typeIcons: Record<string, string> = {
  villa: "🏠", apartment: "🏢", land: "🏗️", commercial: "🏪", office: "🏛️", building: "🏘️",
};

function formatPrice(price: string | null) {
  if (!price) return null;
  const num = parseFloat(price);
  if (isNaN(num)) return null;
  return num.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function getStatusBadge(status: string, listingType: string, isAr: boolean) {
  if (status === "sold") return { label: isAr ? "مباع" : "Sold", color: "bg-gray-500 text-white" };
  if (status === "rented") return { label: isAr ? "مؤجر" : "Rented", color: "bg-gray-500 text-white" };
  if (listingType === "rent") return { label: isAr ? "للإيجار" : "For Rent", color: "bg-blue-500 text-white" };
  return { label: isAr ? "للبيع" : "For Sale", color: "bg-[#E31E24] text-white" };
}

export default function Properties() {
  const { t, isAr } = useLanguage();

  const searchParams = useSearch();
  const urlParams = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
  const urlType = urlParams.get("type") as PropertyType | null;
  const urlListing = urlParams.get("listing") as ListingType | null;
  const urlCity = urlParams.get("city");
  const urlQuery = urlParams.get("q");

  const [query, setQuery] = useState(urlQuery || "");
  const [debouncedQuery, setDebouncedQuery] = useState(urlQuery || "");
  const [selectedType, setSelectedType] = useState<PropertyType | undefined>(urlType || undefined);
  const [selectedListing, setSelectedListing] = useState<ListingType | undefined>(urlListing || undefined);
  const [selectedCity, setSelectedCity] = useState<string | undefined>(urlCity || undefined);
  const [selectedDistrict, setSelectedDistrict] = useState<string | undefined>(undefined);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minArea, setMinArea] = useState<string>("");
  const [maxArea, setMaxArea] = useState<string>("");
  const [minRooms, setMinRooms] = useState<string>("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { favIds: favorites, toggleFavorite, isFavorite } = useFavorites();
  const [compareIds, setCompareIds] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem("alqasim_compare") || "[]"); } catch { return []; }
  });

  // Sync URL params with filter state when navigating from external links
  useEffect(() => {
    if (urlType) setSelectedType(urlType);
    if (urlListing) setSelectedListing(urlListing);
    if (urlCity) setSelectedCity(urlCity);
    if (urlQuery) { setQuery(urlQuery); setDebouncedQuery(urlQuery); }
  }, [searchParams]);

  const handleSearchChange = useCallback((value: string) => {
    setQuery(value);
    const timer = setTimeout(() => {
      setDebouncedQuery(value);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const searchInput = useMemo(() => ({
    query: debouncedQuery || undefined,
    type: selectedType,
    listingType: selectedListing,
    city: selectedCity,
    district: selectedDistrict,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    minArea: minArea ? Number(minArea) : undefined,
    maxArea: maxArea ? Number(maxArea) : undefined,
    minRooms: minRooms ? Number(minRooms) : undefined,
    sort,
    page,
    limit: 12,
  }), [debouncedQuery, selectedType, selectedListing, selectedCity, selectedDistrict, minPrice, maxPrice, minArea, maxArea, minRooms, sort, page]);

  const { data, isLoading, isFetching } = trpc.public.searchProperties.useQuery(searchInput);
  const { data: citiesWithDistricts } = trpc.public.getCitiesWithDistricts.useQuery();

  // Get districts for the selected city
  const availableDistricts = useMemo(() => {
    if (!selectedCity || !citiesWithDistricts) return [];
    const city = citiesWithDistricts.find(c => c.nameAr === selectedCity);
    return city?.districts || [];
  }, [selectedCity, citiesWithDistricts]);

  const hasActiveFilters = selectedType || selectedListing || selectedCity || selectedDistrict || minPrice || maxPrice || minArea || maxArea || minRooms || debouncedQuery;

  const clearFilters = () => {
    setQuery(""); setDebouncedQuery(""); setSelectedType(undefined); setSelectedListing(undefined);
    setSelectedCity(undefined); setSelectedDistrict(undefined); setMinPrice(""); setMaxPrice(""); setMinArea(""); setMaxArea("");
    setMinRooms(""); setSort("newest"); setPage(1);
  };

  const toggleFav = (id: number, e: React.MouseEvent) => {
    toggleFavorite(id, e);
  };

  const toggleCompare = (id: number, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setCompareIds(prev => {
      if (prev.includes(id)) {
        const updated = prev.filter(f => f !== id);
        localStorage.setItem("alqasim_compare", JSON.stringify(updated));
        return updated;
      }
      if (prev.length >= 4) {
        toast.error(isAr ? "يمكنك مقارنة 4 عقارات كحد أقصى" : "You can compare up to 4 properties");
        return prev;
      }
      const updated = [...prev, id];
      localStorage.setItem("alqasim_compare", JSON.stringify(updated));
      return updated;
    });
  };

  const propertyTypes: { value: PropertyType; label: string }[] = [
    { value: "villa", label: t("filter.villa") },
    { value: "apartment", label: t("filter.apartment") },
    { value: "land", label: t("filter.land") },
    { value: "commercial", label: t("filter.commercial") },
    { value: "office", label: t("filter.office") },
    { value: "building", label: t("filter.building") },
  ];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: t("filter.newest") },
    { value: "oldest", label: t("filter.oldest") },
    { value: "price_asc", label: t("filter.priceAsc") },
    { value: "price_desc", label: t("filter.priceDesc") },
    { value: "area_asc", label: t("filter.areaAsc") },
    { value: "area_desc", label: t("filter.areaDesc") },
  ];

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <Navbar />

      {/* Hero with Search */}
      <section className="relative pt-32 pb-16 bg-[#0f1b33]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1b33] to-[#162544]" />
        <div className="container relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {isAr ? "ابحث عن عقارك المثالي" : "Find Your Perfect Property"}
            </h1>
            <p className="text-lg text-white/60 mb-8">
              {isAr ? "تصفح مجموعتنا المتميزة من العقارات السكنية والتجارية" : "Browse our premium collection of residential and commercial properties"}
            </p>

            {/* Main Search Bar */}
            <div className="bg-white rounded-2xl p-2 shadow-2xl max-w-2xl mx-auto">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" style={{ insetInlineStart: '1rem' }} />
                  <input
                    type="text"
                    placeholder={t("filter.searchPlaceholder")}
                    value={query}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full py-3.5 bg-gray-50 rounded-xl text-[#0f1b33] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 text-base"
                    style={{ paddingInlineStart: '3rem', paddingInlineEnd: '2.5rem' }}
                  />
                  {query && (
                    <button onClick={() => { setQuery(""); setDebouncedQuery(""); setPage(1); }}
                      className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                      style={{ insetInlineEnd: '0.75rem' }}>
                      <X className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                  )}
                </div>
                <button className="bg-[#E31E24] hover:bg-[#c91a1f] text-white px-6 py-3.5 rounded-xl font-semibold transition-colors flex items-center gap-2 shrink-0">
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">{isAr ? "بحث" : "Search"}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="py-4 bg-white border-b border-gray-100 sticky top-[80px] z-30 shadow-sm">
        <div className="container">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter */}
              <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                <button onClick={() => { setSelectedType(undefined); setPage(1); }}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${!selectedType ? "bg-[#0f1b33] text-white shadow-sm" : "text-gray-600 hover:text-[#0f1b33]"}`}>
                  {t("filter.allTypes")}
                </button>
                {propertyTypes.map(pt => (
                  <button key={pt.value} onClick={() => { setSelectedType(pt.value); setPage(1); }}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${selectedType === pt.value ? "bg-[#0f1b33] text-white shadow-sm" : "text-gray-600 hover:text-[#0f1b33]"}`}>
                    <span className="hidden sm:inline">{typeIcons[pt.value]} </span>{pt.label}
                  </button>
                ))}
              </div>

              {/* Listing Type */}
              <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                <button onClick={() => { setSelectedListing(undefined); setPage(1); }}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${!selectedListing ? "bg-[#E31E24] text-white shadow-sm" : "text-gray-600 hover:text-[#0f1b33]"}`}>
                  {t("filter.allPurposes")}
                </button>
                <button onClick={() => { setSelectedListing("sale"); setPage(1); }}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${selectedListing === "sale" ? "bg-[#E31E24] text-white shadow-sm" : "text-gray-600 hover:text-[#0f1b33]"}`}>
                  {t("filter.forSale")}
                </button>
                <button onClick={() => { setSelectedListing("rent"); setPage(1); }}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${selectedListing === "rent" ? "bg-[#E31E24] text-white shadow-sm" : "text-gray-600 hover:text-[#0f1b33]"}`}>
                  {t("filter.forRent")}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-[#0f1b33] bg-gray-50 rounded-lg border border-gray-200 transition-colors">
                <SlidersHorizontal className="w-4 h-4" />
                {t("filter.advancedFilters")}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
              </button>

              {/* Sort */}
              <div className="relative">
                <select value={sort} onChange={(e) => { setSort(e.target.value as SortOption); setPage(1); }}
                  className="appearance-none bg-gray-50 border border-gray-200 rounded-lg py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 cursor-pointer"
                  style={{ paddingInlineStart: '0.75rem', paddingInlineEnd: '2rem' }}>
                  {sortOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ArrowUpDown className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" style={{ insetInlineEnd: '0.5rem' }} />
              </div>

              <span className="text-sm text-gray-500 whitespace-nowrap">
                {isFetching ? <Loader2 className="w-4 h-4 animate-spin inline" /> : data?.total || 0} {t("filter.results")}
              </span>

              <div className="hidden sm:flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded ${viewMode === "grid" ? "bg-[#0f1b33] text-white" : "text-gray-400"}`}><Grid3X3 className="w-4 h-4" /></button>
                <button onClick={() => setViewMode("list")} className={`p-1.5 rounded ${viewMode === "list" ? "bg-[#0f1b33] text-white" : "text-gray-400"}`}><List className="w-4 h-4" /></button>
                <button onClick={() => setViewMode("map")} className={`p-1.5 rounded ${viewMode === "map" ? "bg-[#0f1b33] text-white" : "text-gray-400"}`}><MapIcon className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 pt-4 mt-4 border-t border-gray-100">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">{isAr ? "المدينة" : "City"}</label>
                    <select value={selectedCity || ""} onChange={(e) => { setSelectedCity(e.target.value || undefined); setSelectedDistrict(undefined); setPage(1); }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30">
                      <option value="">{t("filter.allCities")}</option>
                      {citiesWithDistricts?.map(city => <option key={city.id} value={city.nameAr}>{isAr ? city.nameAr : city.nameEn}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">{isAr ? "الحي" : "District"}</label>
                    <select value={selectedDistrict || ""} onChange={(e) => { setSelectedDistrict(e.target.value || undefined); setPage(1); }}
                      disabled={!selectedCity}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 disabled:opacity-50 disabled:cursor-not-allowed">
                      <option value="">{isAr ? "جميع الأحياء" : "All Districts"}</option>
                      {availableDistricts.map(d => <option key={d.id} value={d.nameAr}>{isAr ? d.nameAr : d.nameEn}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">{t("filter.minPrice")}</label>
                    <input type="number" placeholder="0" value={minPrice}
                      onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">{t("filter.maxPrice")}</label>
                    <input type="number" placeholder={isAr ? "بدون حد" : "No limit"} value={maxPrice}
                      onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">{t("filter.minArea")}</label>
                    <input type="number" placeholder="0" value={minArea}
                      onChange={(e) => { setMinArea(e.target.value); setPage(1); }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">{t("filter.maxArea")}</label>
                    <input type="number" placeholder={isAr ? "بدون حد" : "No limit"} value={maxArea}
                      onChange={(e) => { setMaxArea(e.target.value); setPage(1); }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">{t("filter.roomsRange")}</label>
                    <select value={minRooms} onChange={(e) => { setMinRooms(e.target.value); setPage(1); }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30">
                      <option value="">{t("filter.allPurposes")}</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                        <option key={n} value={n}>{n}+ {t("properties.rooms")}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {hasActiveFilters && (
                  <div className="flex justify-end pt-3">
                    <button onClick={clearFilters}
                      className="flex items-center gap-1.5 text-sm text-[#E31E24] hover:text-[#c91a1f] font-medium transition-colors">
                      <X className="w-3.5 h-3.5" />{t("filter.clearAll")}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Property Grid */}
      <section className="py-10">
        <div className="container">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-[#c8a45e] animate-spin mb-4" />
              <p className="text-gray-500">{t("common.loading")}</p>
            </div>
          ) : !data?.items.length ? (
            <div className="text-center py-20">
              <SlidersHorizontal className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">{t("common.noResults")}</h3>
              <p className="text-gray-400 mb-6">{isAr ? "حاول تغيير معايير البحث" : "Try changing your search criteria"}</p>
              {hasActiveFilters && (
                <button onClick={clearFilters}
                  className="bg-[#0f1b33] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1a2b4a] transition-colors">
                  {t("filter.clearAll")}
                </button>
              )}
            </div>
          ) : viewMode === "map" ? (
            <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 text-[#c8a45e] animate-spin" /></div>}>
              <PropertyMapView properties={data.items as any} className="mb-8" />
            </Suspense>
          ) : (
            <>
              <div className={viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                {data.items.map((property, i) => {
                  const images = Array.isArray(property.images) ? (property.images as string[]) : [];
                  const coverImage = images[0] || null;
                  const badge = getStatusBadge(property.status, property.listingType, isAr);
                  const priceFormatted = formatPrice(property.price);

                  return (
                    <motion.div key={property.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                      <Link href={`/properties/${property.id}`}>
                        <div className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all group cursor-pointer ${viewMode === "list" ? "flex" : ""}`}>
                          {/* Image */}
                          <div className={`relative overflow-hidden ${viewMode === "list" ? "w-64 md:w-72 shrink-0" : "aspect-[4/3]"}`}>
                            {coverImage ? (
                              <img src={coverImage} alt={property.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[#0f1b33] to-[#1a2b4a] flex items-center justify-center">
                                <span className="text-4xl">{typeIcons[property.type] || "🏠"}</span>
                              </div>
                            )}
                            <div className="absolute top-3 flex gap-2" style={{ insetInlineStart: '0.75rem' }}>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>{badge.label}</span>
                            </div>
                            <div className="absolute top-3 flex flex-col gap-1.5" style={{ insetInlineEnd: '0.75rem' }}>
                              <button onClick={(e) => toggleFav(property.id, e)}
                                className="w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
                                <Heart className={`w-4 h-4 transition-all duration-300 ${isFavorite(property.id) ? "fill-[#E31E24] text-[#E31E24] scale-110" : "text-gray-500 hover:scale-110"}`} />
                              </button>
                              <button onClick={(e) => toggleCompare(property.id, e)}
                                className={`w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors ${compareIds.includes(property.id) ? "bg-[#c8a45e] text-[#0f1b33]" : "bg-white/80 hover:bg-white text-gray-500"}`}>
                                <Scale className="w-4 h-4" />
                              </button>
                            </div>
                            {images.length > 1 && (
                              <div className="absolute bottom-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm" style={{ insetInlineEnd: '0.5rem' }}>
                                {images.length} {isAr ? "صور" : "photos"}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-5 flex-1">
                            <div className="flex items-center gap-1.5 text-gray-400 text-sm mb-2">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">
                                {(() => {
                                  const city = isAr ? property.city : ((property as any).cityEn || property.city);
                                  const district = isAr ? property.district : ((property as any).districtEn || property.district);
                                  const sep = isAr ? " - " : " - ";
                                  return district ? `${city}${sep}${district}` : city;
                                })()}
                              </span>
                            </div>
                            <h3 className="font-bold text-[#0f1b33] text-lg mb-2 line-clamp-2 group-hover:text-[#c8a45e] transition-colors">
                              {isAr ? property.title : ((property as any).titleEn || property.title)}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                              {property.rooms && property.rooms > 0 && (
                                <span className="flex items-center gap-1"><BedDouble className="w-4 h-4" />{property.rooms}</span>
                              )}
                              {property.bathrooms && property.bathrooms > 0 && (
                                <span className="flex items-center gap-1"><Bath className="w-4 h-4" />{property.bathrooms}</span>
                              )}
                              {property.area && (
                                <span className="flex items-center gap-1"><Maximize className="w-4 h-4" />{parseFloat(property.area).toLocaleString()} {t("filter.sqm")}</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                              {priceFormatted ? (
                                <span className="text-xl font-bold text-[#E31E24]" dir="ltr">
                                  {priceFormatted} <span className="text-sm font-normal">{t("filter.sar")}</span>
                                  {property.listingType === "rent" && <span className="text-xs font-normal text-gray-400">/{isAr ? "سنوياً" : "yr"}</span>}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">{isAr ? "السعر عند الطلب" : "Price on request"}</span>
                              )}
                              <span className="text-xs text-[#c8a45e] font-medium bg-[#c8a45e]/10 px-2 py-1 rounded">
                                {t(`filter.${property.type}`)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors">
                    {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    {t("filter.previous")}
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(data.totalPages, 7) }, (_, i) => {
                      let pageNum: number;
                      if (data.totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (page <= 4) {
                        pageNum = i + 1;
                      } else if (page >= data.totalPages - 3) {
                        pageNum = data.totalPages - 6 + i;
                      } else {
                        pageNum = page - 3 + i;
                      }
                      return (
                        <button key={pageNum} onClick={() => setPage(pageNum)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${page === pageNum ? "bg-[#0f1b33] text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}>
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors">
                    {t("filter.next")}
                    {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Floating Compare Bar */}
      <AnimatePresence>
        {compareIds.length > 0 && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f1b33] text-white py-3 px-4 shadow-2xl print:hidden">
            <div className="container flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Scale className="w-5 h-5 text-[#c8a45e]" />
                <span className="text-sm font-medium">{isAr ? `${compareIds.length} عقارات محددة للمقارنة` : `${compareIds.length} properties selected`}</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => { setCompareIds([]); localStorage.setItem("alqasim_compare", "[]"); }} className="text-xs text-white/60 hover:text-white transition-colors">{isAr ? "مسح الكل" : "Clear All"}</button>
                <Link href="/compare" className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${compareIds.length >= 2 ? "bg-[#c8a45e] text-[#0f1b33] hover:bg-[#b8944e]" : "bg-white/10 text-white/40 cursor-not-allowed"}`}>
                  {isAr ? "مقارنة الآن" : "Compare Now"}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Footer />
    </div>
  );
}
