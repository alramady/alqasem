import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { useParams, Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Phone, Mail, Globe, Users, Building2, Landmark, Star, ArrowRight, BedDouble, Bath, Maximize, Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";

function formatPrice(price: string | null) {
  if (!price) return null;
  const num = parseFloat(price);
  if (isNaN(num)) return price;
  return num.toLocaleString("ar-SA");
}

export default function AgencyProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { isAr } = useLanguage();
  const { isFavorite, toggleFavorite: toggleFav } = useFavorites();

  const { data, isLoading, error } = trpc.public.getAgencyProfile.useQuery({ slug: slug || "" }, { enabled: !!slug });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f7]" dir={isAr ? "rtl" : "ltr"}>
        <Navbar />
        <div className="pt-32 pb-16 text-center">
          <div className="w-12 h-12 border-4 border-[#c8a45e] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#faf9f7]" dir={isAr ? "rtl" : "ltr"}>
        <Navbar />
        <div className="pt-32 pb-16 text-center">
          <Landmark className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-600">{isAr ? "المكتب غير موجود" : "Office not found"}</h2>
          <Link href="/agencies" className="text-[#c8a45e] mt-4 inline-block hover:underline">
            {isAr ? "العودة للمكاتب العقارية" : "Back to offices"}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { agency, agents, properties, totalProperties } = data;

  return (
    <div className="min-h-screen bg-[#faf9f7]" dir={isAr ? "rtl" : "ltr"}>
      <Navbar />

      {/* Cover & Header */}
      <section className="relative pt-24">
        {/* Cover Image */}
        <div className="h-48 md:h-64 bg-gradient-to-b from-[#0f1b33] to-[#1a2d4d] relative overflow-hidden">
          {agency.coverImage && (
            <img src={agency.coverImage} alt="" className="w-full h-full object-cover opacity-40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1b33]/80 to-transparent" />
        </div>

        {/* Agency Info Card */}
        <div className="container relative -mt-20 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8"
          >
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Logo */}
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl bg-white border-2 border-slate-100 shadow-md overflow-hidden shrink-0 flex items-center justify-center">
                {agency.logo ? (
                  <img src={agency.logo} alt={agency.nameAr} className="w-full h-full object-contain p-2" />
                ) : (
                  <Landmark className="w-12 h-12 text-slate-300" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold text-[#0f1b33]">
                    {isAr ? agency.nameAr : (agency.nameEn || agency.nameAr)}
                  </h1>
                  {agency.isFeatured && (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />{isAr ? "مكتب مميز" : "Featured"}
                    </span>
                  )}
                </div>
                {agency.nameEn && isAr && (
                  <p className="text-slate-400 text-sm mt-1" dir="ltr">{agency.nameEn}</p>
                )}

                {/* Contact Info */}
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-600">
                  {agency.city && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#c8a45e]" />
                      {isAr ? agency.city : (agency.cityEn || agency.city)}
                      {agency.address && ` - ${isAr ? agency.address : (agency.addressEn || agency.address)}`}
                    </span>
                  )}
                  {agency.phone && (
                    <a href={`tel:${agency.phone}`} className="flex items-center gap-1.5 hover:text-[#c8a45e] transition-colors">
                      <Phone className="w-4 h-4 text-[#c8a45e]" />
                      <span dir="ltr">{agency.phone}</span>
                    </a>
                  )}
                  {agency.email && (
                    <a href={`mailto:${agency.email}`} className="flex items-center gap-1.5 hover:text-[#c8a45e] transition-colors">
                      <Mail className="w-4 h-4 text-[#c8a45e]" />
                      {agency.email}
                    </a>
                  )}
                  {agency.website && (
                    <a href={agency.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[#c8a45e] transition-colors">
                      <Globe className="w-4 h-4 text-[#c8a45e]" />
                      {isAr ? "الموقع الإلكتروني" : "Website"}
                    </a>
                  )}
                </div>

                {/* License Info */}
                {agency.licenseNumber && (
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                    <span>{isAr ? "رخصة فال:" : "License:"} {agency.licenseNumber}</span>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-6 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#c8a45e]">{agents.length}</div>
                    <div className="text-xs text-slate-500">{isAr ? "وكيل" : "Agents"}</div>
                  </div>
                  <div className="w-px h-8 bg-slate-200" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#c8a45e]">{totalProperties}</div>
                    <div className="text-xs text-slate-500">{isAr ? "عقار" : "Properties"}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {(agency.descriptionAr || agency.descriptionEn) && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-slate-600 leading-relaxed">
                  {isAr ? agency.descriptionAr : (agency.descriptionEn || agency.descriptionAr)}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Agents Section */}
      {agents.length > 0 && (
        <section className="container py-10">
          <h2 className="text-xl font-bold text-[#0f1b33] mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#c8a45e]" />
            {isAr ? "فريق الوكلاء" : "Our Agents"} ({agents.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {agents.map((agent: any, idx: number) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link href={`/agent/${agent.slug}`}>
                  <div className="bg-white rounded-xl border border-slate-100 hover:shadow-md hover:border-[#c8a45e]/30 transition-all p-5 cursor-pointer text-center group">
                    <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden mx-auto mb-3 group-hover:border-[#c8a45e]/50 transition-colors">
                      {agent.photo ? (
                        <img src={agent.photo} alt={agent.nameAr} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-300">
                          {agent.nameAr?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-[#0f1b33] group-hover:text-[#c8a45e] transition-colors">
                      {isAr ? agent.nameAr : (agent.nameEn || agent.nameAr)}
                    </h3>
                    {agent.titleAr && (
                      <p className="text-sm text-slate-500 mt-0.5">{isAr ? agent.titleAr : (agent.titleEn || agent.titleAr)}</p>
                    )}
                    {agent.phone && (
                      <p className="text-sm text-slate-400 mt-2 flex items-center justify-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        <span dir="ltr">{agent.phone}</span>
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Properties Section */}
      {properties.length > 0 && (
        <section className="container pb-12">
          <h2 className="text-xl font-bold text-[#0f1b33] mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#c8a45e]" />
            {isAr ? "العقارات المعروضة" : "Listed Properties"} ({totalProperties})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((prop: any, idx: number) => {
              const coverImage = Array.isArray(prop.images) && prop.images.length > 0 ? prop.images[0] : null;
              return (
                <motion.div
                  key={prop.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link href={`/properties/${prop.id}`}>
                    <div className="bg-white rounded-xl border border-slate-100 hover:shadow-lg transition-all overflow-hidden group cursor-pointer">
                      {/* Image */}
                      <div className="relative h-48 bg-slate-100 overflow-hidden">
                        {coverImage ? (
                          <img src={coverImage} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="w-12 h-12 text-slate-300" />
                          </div>
                        )}
                        {/* Badges */}
                        <div className="absolute top-3 right-3 flex gap-2">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold text-white ${prop.listingType === "sale" ? "bg-[#c8a45e]" : "bg-emerald-500"}`}>
                            {prop.listingType === "sale" ? (isAr ? "للبيع" : "Sale") : (isAr ? "للإيجار" : "Rent")}
                          </span>
                        </div>
                        {/* Favorite */}
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(prop.id); }}
                          className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <Heart className={`w-4 h-4 ${isFavorite(prop.id) ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
                        </button>
                      </div>
                      {/* Info */}
                      <div className="p-4">
                        <h3 className="font-bold text-[#0f1b33] truncate group-hover:text-[#c8a45e] transition-colors">
                          {isAr ? prop.title : (prop.titleEn || prop.title)}
                        </h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {isAr ? `${prop.district || ""} - ${prop.city || ""}` : `${prop.districtEn || prop.district || ""} - ${prop.cityEn || prop.city || ""}`}
                        </p>
                        {/* Price */}
                        <div className="mt-3">
                          <span className="text-lg font-bold text-[#c8a45e]">{formatPrice(prop.price)}</span>
                          <span className="text-sm text-slate-400 mr-1">{isAr ? "ريال" : "SAR"}</span>
                        </div>
                        {/* Features */}
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-sm text-slate-500">
                          {prop.rooms && (
                            <span className="flex items-center gap-1"><BedDouble className="w-4 h-4" />{prop.rooms}</span>
                          )}
                          {prop.bathrooms && (
                            <span className="flex items-center gap-1"><Bath className="w-4 h-4" />{prop.bathrooms}</span>
                          )}
                          {prop.area && (
                            <span className="flex items-center gap-1"><Maximize className="w-4 h-4" />{prop.area} {isAr ? "م²" : "sqm"}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
