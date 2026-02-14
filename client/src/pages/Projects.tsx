import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { useState, useMemo, useCallback } from "react";
import {
  MapPin, Building2, ArrowLeft, ArrowRight, CheckCircle,
  Loader2, Home, Layers, Star, Search, X,
  ChevronLeft, ChevronRight, ArrowUpDown, Grid3X3, List
} from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

type ProjectStatus = "active" | "completed" | "upcoming";
type SortOption = "newest" | "oldest" | "units_asc" | "units_desc";

const managedProjects = [
  { ar: "مجمع الرونق السكني", en: "Al-Rawnaq Residential" },
  { ar: "عمارة شارع الخزان", en: "Al-Khazan St. Building" },
  { ar: "عمارات المربع", en: "Al-Murabba Buildings" },
  { ar: "مجمع فيرندا", en: "Veranda Complex" },
  { ar: "مشروع الكرخ", en: "Al-Karkh Project" },
  { ar: "مجمع الياسمين السكني", en: "Al-Yasmin Residential" },
  { ar: "مجمع أسفار بلازا", en: "Asfar Plaza" },
  { ar: "مجمع أيون الفندق", en: "Ayon Hotel Complex" },
  { ar: "برج دورمان", en: "Dorman Tower" },
  { ar: "عمارات السليمانية", en: "Al-Sulaimaniyah Buildings" },
];

const statusConfig: Record<string, { labelAr: string; labelEn: string; color: string; bg: string }> = {
  active: { labelAr: "جاري التنفيذ", labelEn: "In Progress", color: "text-white", bg: "bg-emerald-500" },
  completed: { labelAr: "مكتمل", labelEn: "Completed", color: "text-white", bg: "bg-blue-500" },
  upcoming: { labelAr: "قريباً", labelEn: "Upcoming", color: "text-[#0f1b33]", bg: "bg-[#c8a45e]" },
};

export default function Projects() {
  const { t, isAr } = useLanguage();
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | undefined>(undefined);
  const [sort, setSort] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"featured" | "grid">("featured");

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
    status: selectedStatus,
    sort,
    page,
    limit: 12,
  }), [debouncedQuery, selectedStatus, sort, page]);

  const { data, isLoading, isFetching } = trpc.public.searchProjects.useQuery(searchInput);

  const hasActiveFilters = selectedStatus || debouncedQuery;

  const clearFilters = () => {
    setQuery(""); setDebouncedQuery(""); setSelectedStatus(undefined); setSort("newest"); setPage(1);
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: t("filter.newest") },
    { value: "oldest", label: t("filter.oldest") },
    { value: "units_desc", label: t("filter.unitsDesc") },
    { value: "units_asc", label: t("filter.unitsAsc") },
  ];

  const statusFilters: { value: ProjectStatus | undefined; label: string }[] = [
    { value: undefined, label: t("filter.allStatuses") },
    { value: "active", label: t("filter.inProgress") },
    { value: "completed", label: t("filter.completed") },
    { value: "upcoming", label: t("filter.upcoming") },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 bg-[#0f1b33] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1b33] to-[#162544]" />
        <div className="container relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto">
            <span className="inline-block text-[#c8a45e] text-sm font-semibold tracking-wider mb-4 border border-[#c8a45e]/30 px-4 py-1.5 rounded-full">
              {t("projects.badge")}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {isAr ? "مشاريع عقارية بمعايير استثنائية" : "Real Estate Projects with Exceptional Standards"}
            </h1>
            <p className="text-lg text-white/60 mb-8">
              {isAr ? "نفخر بتقديم مشاريع عقارية متميزة تجمع بين الفخامة والجودة والموقع الاستراتيجي" : "We take pride in delivering distinguished real estate projects combining luxury, quality, and strategic locations"}
            </p>

            {/* Search Bar */}
            <div className="bg-white rounded-2xl p-2 shadow-2xl max-w-2xl mx-auto">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" style={{ insetInlineStart: '1rem' }} />
                  <input
                    type="text"
                    placeholder={t("filter.searchProjectPlaceholder")}
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
            <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
              {statusFilters.map(sf => (
                <button key={sf.label} onClick={() => { setSelectedStatus(sf.value); setPage(1); }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${selectedStatus === sf.value ? "bg-[#0f1b33] text-white shadow-sm" : "text-gray-600 hover:text-[#0f1b33]"}`}>
                  {sf.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
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
                <button onClick={() => setViewMode("featured")} className={`p-1.5 rounded ${viewMode === "featured" ? "bg-[#0f1b33] text-white" : "text-gray-400"}`}><List className="w-4 h-4" /></button>
                <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded ${viewMode === "grid" ? "bg-[#0f1b33] text-white" : "text-gray-400"}`}><Grid3X3 className="w-4 h-4" /></button>
              </div>

              {hasActiveFilters && (
                <button onClick={clearFilters}
                  className="flex items-center gap-1.5 text-sm text-[#E31E24] hover:text-[#c91a1f] font-medium transition-colors">
                  <X className="w-3.5 h-3.5" />{t("filter.clearAll")}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="py-16">
        <div className="container">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-[#c8a45e] animate-spin mb-4" />
              <p className="text-gray-500">{t("common.loading")}</p>
            </div>
          ) : !data?.items.length ? (
            <div className="text-center py-20">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">{t("common.noResults")}</h3>
              <p className="text-gray-400 mb-6">{isAr ? "حاول تغيير معايير البحث" : "Try changing your search criteria"}</p>
              {hasActiveFilters && (
                <button onClick={clearFilters}
                  className="bg-[#0f1b33] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1a2b4a] transition-colors">
                  {t("filter.clearAll")}
                </button>
              )}
            </div>
          ) : viewMode === "featured" ? (
            <div className="space-y-12">
              {data.items.map((project, i) => {
                const images = Array.isArray(project.images) ? (project.images as string[]) : [];
                const coverImage = images[0] || null;
                const statusInfo = statusConfig[project.status] || statusConfig.active;
                const totalUnits = project.totalUnits || 0;
                const soldUnits = project.soldUnits || 0;

                return (
                  <motion.div key={project.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    className={`grid lg:grid-cols-2 gap-8 items-center ${i % 2 === 1 ? "lg:grid-flow-dense" : ""}`}>
                    <Link href={`/projects/${project.id}`} className={`relative rounded-2xl overflow-hidden group cursor-pointer ${i % 2 === 1 ? "lg:col-start-2" : ""}`}>
                      <div className="aspect-[16/10]">
                        {coverImage ? (
                          <img src={coverImage} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#0f1b33] to-[#1a2b4a] flex items-center justify-center"><Building2 className="w-16 h-16 text-[#c8a45e]/30" /></div>
                        )}
                      </div>
                      <div className="absolute top-4 flex gap-2" style={{ insetInlineStart: '1rem' }}>
                        <span className={`${statusInfo.bg} ${statusInfo.color} px-4 py-1.5 rounded-full text-sm font-semibold`}>
                          {isAr ? statusInfo.labelAr : statusInfo.labelEn}
                        </span>
                        {project.isFeatured && (
                          <span className="bg-[#c8a45e] text-[#0f1b33] px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1">
                            <Star className="w-3 h-3" />{isAr ? "مميز" : "Featured"}
                          </span>
                        )}
                      </div>
                      {images.length > 1 && (
                        <div className="absolute bottom-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm" style={{ insetInlineEnd: '0.75rem' }}>
                          {images.length} {isAr ? "صور" : "photos"}
                        </div>
                      )}
                    </Link>
                    <div className="space-y-4">
                      {(project.subtitle || project.subtitleEn) && <span className="text-[#c8a45e] text-sm font-semibold">{isAr ? project.subtitle : (project.subtitleEn || project.subtitle)}</span>}
                      <Link href={`/projects/${project.id}`}>
                        <h3 className="text-3xl font-bold text-[#0f1b33] hover:text-[#c8a45e] transition-colors cursor-pointer">
                          {isAr ? project.title : (project.titleEn || project.title)}
                        </h3>
                      </Link>
                      {(project.description || project.descriptionEn) && <p className="text-gray-600 leading-relaxed text-lg line-clamp-3">{isAr ? project.description : (project.descriptionEn || project.description)}</p>}
                      <div className="flex flex-wrap gap-4 text-sm">
                        {(project.location || project.locationEn) && <span className="flex items-center gap-2 text-gray-500"><MapPin className="w-4 h-4 text-[#c8a45e]" />{isAr ? project.location : (project.locationEn || project.location)}</span>}
                        {totalUnits > 0 && <span className="flex items-center gap-2 text-gray-500"><Home className="w-4 h-4 text-[#c8a45e]" />{totalUnits} {isAr ? "وحدة" : "units"}</span>}
                        {totalUnits > 0 && soldUnits > 0 && <span className="flex items-center gap-2 text-gray-500"><Layers className="w-4 h-4 text-[#c8a45e]" />{totalUnits - soldUnits} {isAr ? "متاحة" : "available"}</span>}
                      </div>
                      {totalUnits > 0 && soldUnits > 0 && (
                        <div className="pt-1">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>{isAr ? "نسبة المبيعات" : "Sales Progress"}</span>
                            <span className="font-semibold text-[#c8a45e]">{Math.round((soldUnits / totalUnits) * 100)}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-l from-[#c8a45e] to-[#dbb96e] rounded-full transition-all duration-700" style={{ width: `${Math.round((soldUnits / totalUnits) * 100)}%` }} />
                          </div>
                        </div>
                      )}
                      <div className="flex gap-3 pt-2">
                        <Link href={`/projects/${project.id}`} className="bg-[#E31E24] hover:bg-[#c91a1f] text-white font-semibold px-6 py-3 rounded-sm transition-all flex items-center gap-2">
                          {t("projects.details")}<ArrowIcon className="w-4 h-4" />
                        </Link>
                        <a href="tel:920001911" className="border border-[#0f1b33]/20 text-[#0f1b33] hover:bg-[#0f1b33] hover:text-white font-semibold px-6 py-3 rounded-sm transition-all">
                          {t("projectDetail.callNow")}
                        </a>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.items.map((project, i) => {
                const images = Array.isArray(project.images) ? (project.images as string[]) : [];
                const coverImage = images[0] || null;
                const statusInfo = statusConfig[project.status] || statusConfig.active;
                const totalUnits = project.totalUnits || 0;
                const soldUnits = project.soldUnits || 0;

                return (
                  <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Link href={`/projects/${project.id}`}>
                      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all group cursor-pointer border border-gray-100">
                        <div className="relative aspect-[16/10] overflow-hidden">
                          {coverImage ? (
                            <img src={coverImage} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#0f1b33] to-[#1a2b4a] flex items-center justify-center"><Building2 className="w-12 h-12 text-[#c8a45e]/30" /></div>
                          )}
                          <div className="absolute top-3 flex gap-2" style={{ insetInlineStart: '0.75rem' }}>
                            <span className={`${statusInfo.bg} ${statusInfo.color} px-3 py-1 rounded-full text-xs font-semibold`}>
                              {isAr ? statusInfo.labelAr : statusInfo.labelEn}
                            </span>
                            {project.isFeatured && (
                              <span className="bg-[#c8a45e] text-[#0f1b33] px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                <Star className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="p-5">
                          {(project.subtitle || project.subtitleEn) && <span className="text-[#c8a45e] text-xs font-semibold block mb-1">{isAr ? project.subtitle : (project.subtitleEn || project.subtitle)}</span>}
                          <h3 className="font-bold text-[#0f1b33] text-lg mb-2 line-clamp-2 group-hover:text-[#c8a45e] transition-colors">
                            {isAr ? project.title : (project.titleEn || project.title)}
                          </h3>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
                            {(project.location || project.locationEn) && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#c8a45e]" />{isAr ? project.location : (project.locationEn || project.location)}</span>}
                            {totalUnits > 0 && <span className="flex items-center gap-1"><Home className="w-3.5 h-3.5 text-[#c8a45e]" />{totalUnits} {isAr ? "وحدة" : "units"}</span>}
                          </div>
                          {totalUnits > 0 && soldUnits > 0 && (
                            <div className="pt-2 border-t border-gray-100">
                              <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>{isAr ? "المبيعات" : "Sales"}</span>
                                <span className="font-semibold text-[#c8a45e]">{Math.round((soldUnits / totalUnits) * 100)}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-l from-[#c8a45e] to-[#dbb96e] rounded-full" style={{ width: `${Math.round((soldUnits / totalUnits) * 100)}%` }} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
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
        </div>
      </section>

      {/* Managed Projects */}
      <section className="py-20 bg-[#f8f5f0]">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[#E31E24] text-sm font-semibold tracking-wider mb-3 block">{isAr ? "سجل حافل" : "Proven Track Record"}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0f1b33]">
              {isAr ? "مشاريع نديرها ونفخر بها" : "Projects We Manage with Pride"}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {managedProjects.map((proj, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm">
                <CheckCircle className="w-5 h-5 text-[#c8a45e] shrink-0" />
                <span className="font-medium text-[#0f1b33]">{isAr ? proj.ar : proj.en}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
