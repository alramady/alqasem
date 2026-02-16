import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { useState } from "react";
import { Search, MapPin, Phone, Users, Building2, Landmark, Star, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Agencies() {
  const { isAr } = useLanguage();
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  const { data: agencies = [], isLoading } = trpc.public.getAgencies.useQuery(
    { search: search || undefined, city: cityFilter || undefined }
  );
  const { data: cities = [] } = trpc.public.getPropertyCities.useQuery();

  return (
    <div className="min-h-screen bg-[#faf9f7]" dir={isAr ? "rtl" : "ltr"}>
      <Navbar />

      {/* Hero Banner */}
      <section className="relative pt-32 pb-16 bg-gradient-to-b from-[#0f1b33] to-[#1a2d4d]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNjOGE0NWUiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="container relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-[#c8a45e]/20 text-[#c8a45e] px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Landmark className="w-4 h-4" />
              {isAr ? "المكاتب العقارية" : "Real Estate Offices"}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              {isAr ? "المكاتب العقارية المعتمدة" : "Authorized Real Estate Offices"}
            </h1>
            <p className="text-white/60 max-w-xl mx-auto">
              {isAr ? "تصفح المكاتب العقارية المعتمدة والموثوقة التي تعلن عقاراتها على منصتنا" : "Browse authorized and trusted real estate offices advertising on our platform"}
            </p>
          </motion.div>

          {/* Search & Filter */}
          <div className="mt-8 max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? "ابحث عن مكتب عقاري..." : "Search for an office..."}
                className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg py-3 pr-11 pl-4 focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/50"
              />
            </div>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-white/10 border border-white/20 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/50 min-w-[160px]"
            >
              <option value="" className="text-slate-800">{isAr ? "كل المدن" : "All Cities"}</option>
              {cities.map((c: string) => <option key={c} value={c} className="text-slate-800">{c}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Agencies Grid */}
      <section className="container py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-lg bg-slate-200" />
                  <div className="flex-1">
                    <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-4 bg-slate-100 rounded w-full mb-2" />
                <div className="h-4 bg-slate-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : agencies.length === 0 ? (
          <div className="text-center py-16">
            <Landmark className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-600 mb-2">{isAr ? "لا توجد مكاتب عقارية" : "No offices found"}</h3>
            <p className="text-slate-400">{isAr ? "لم يتم العثور على مكاتب مطابقة لبحثك" : "No offices match your search"}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-slate-500 text-sm">
                {agencies.length} {isAr ? "مكتب عقاري" : "offices"}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agencies.map((agency: any, idx: number) => (
                <motion.div
                  key={agency.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                >
                  <Link href={`/agency/${agency.slug}`}>
                    <div className="bg-white rounded-xl border border-slate-100 hover:shadow-lg hover:border-[#c8a45e]/30 transition-all duration-300 overflow-hidden group cursor-pointer h-full">
                      {/* Cover Image */}
                      {agency.coverImage && (
                        <div className="h-32 overflow-hidden">
                          <img loading="lazy" src={agency.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          {/* Logo */}
                          <div className={`w-16 h-16 rounded-xl bg-slate-50 border-2 border-slate-100 overflow-hidden shrink-0 flex items-center justify-center ${agency.coverImage ? "-mt-10 relative z-10 shadow-md" : ""}`}>
                            {agency.logo ? (
                              <img loading="lazy" src={agency.logo} alt={agency.nameAr} className="w-full h-full object-cover" />
                            ) : (
                              <Landmark className="w-8 h-8 text-slate-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-[#0f1b33] truncate">{isAr ? agency.nameAr : (agency.nameEn || agency.nameAr)}</h3>
                              {agency.isFeatured && <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />}
                            </div>
                            {agency.city && (
                              <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3.5 h-3.5" />{isAr ? agency.city : (agency.cityEn || agency.city)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        {(agency.descriptionAr || agency.descriptionEn) && (
                          <p className="text-sm text-slate-500 mt-3 line-clamp-2">
                            {isAr ? agency.descriptionAr : (agency.descriptionEn || agency.descriptionAr)}
                          </p>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Users className="w-4 h-4 text-[#c8a45e]" />
                            <span className="font-semibold">{agency.agentCount || 0}</span>
                            <span className="text-slate-400">{isAr ? "وكيل" : "agents"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Building2 className="w-4 h-4 text-[#c8a45e]" />
                            <span className="font-semibold">{agency.propertyCount || 0}</span>
                            <span className="text-slate-400">{isAr ? "عقار" : "properties"}</span>
                          </div>
                          {agency.phone && (
                            <div className="flex items-center gap-1.5 text-sm text-slate-600 mr-auto">
                              <Phone className="w-4 h-4 text-slate-400" />
                              <span dir="ltr">{agency.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}
