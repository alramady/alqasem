import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { useParams, Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Phone, Mail, Users, Building2, Landmark, UserCheck, BedDouble, Bath, Maximize, Heart, MessageCircle } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

function formatPrice(price: string | null) {
  if (!price) return null;
  const num = parseFloat(price);
  if (isNaN(num)) return price;
  return num.toLocaleString("ar-SA");
}

export default function AgentProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { isAr } = useLanguage();
  const { isFavorite, toggleFavorite: toggleFav } = useFavorites();

  const { data, isLoading, error } = trpc.public.getAgentProfile.useQuery({ slug: slug || "" }, { enabled: !!slug });

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
          <UserCheck className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-600">{isAr ? "الوكيل غير موجود" : "Agent not found"}</h2>
          <Link href="/agencies" className="text-[#c8a45e] mt-4 inline-block hover:underline">
            {isAr ? "العودة للمكاتب العقارية" : "Back to offices"}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { agent, agency, properties, totalProperties } = data;

  return (
    <div className="min-h-screen bg-[#faf9f7]" dir={isAr ? "rtl" : "ltr"}>
      <Navbar />

      {/* Header */}
      <section className="relative pt-24">
        <div className="h-40 md:h-52 bg-gradient-to-b from-[#0f1b33] to-[#1a2d4d]" />

        <div className="container relative -mt-16 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8"
          >
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Photo */}
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-[#0f1b33] to-[#1a3a5c] border-4 border-white shadow-lg overflow-hidden shrink-0 mx-auto md:mx-0">
                {agent.photo ? (
                  <img loading="lazy" src={agent.photo} alt={agent.nameAr} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white/80">
                    {agent.nameAr?.charAt(0)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-start">
                <h1 className="text-2xl md:text-3xl font-bold text-[#0f1b33]">
                  {isAr ? agent.nameAr : (agent.nameEn || agent.nameAr)}
                </h1>
                {agent.titleAr && (
                  <p className="text-slate-500 mt-1">{isAr ? agent.titleAr : (agent.titleEn || agent.titleAr)}</p>
                )}

                {/* Agency Link */}
                {agency && (
                  <Link href={`/agency/${agency.slug}`}>
                    <div className="inline-flex items-center gap-2 mt-3 bg-slate-50 hover:bg-slate-100 transition-colors rounded-lg px-4 py-2 cursor-pointer">
                      {agency.logo ? (
                        <img loading="lazy" src={agency.logo} alt="" className="w-8 h-8 rounded-md object-contain" />
                      ) : (
                        <Landmark className="w-5 h-5 text-slate-400" />
                      )}
                      <div>
                        <p className="text-sm font-bold text-[#0f1b33]">{isAr ? agency.nameAr : (agency.nameEn || agency.nameAr)}</p>
                        {agency.city && <p className="text-xs text-slate-400">{isAr ? agency.city : (agency.cityEn || agency.city)}</p>}
                      </div>
                    </div>
                  </Link>
                )}

                {/* Contact Buttons */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                  {agent.phone && (
                    <a href={`tel:${agent.phone}`} className="inline-flex items-center gap-2 bg-[#0f1b33] text-white px-5 py-2.5 rounded-lg hover:bg-[#1a2d4d] transition-colors text-sm font-medium">
                      <Phone className="w-4 h-4" />{isAr ? "اتصل الآن" : "Call Now"}
                    </a>
                  )}
                  {agent.whatsapp && (
                    <a href={`https://wa.me/${agent.whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium">
                      <MessageCircle className="w-4 h-4" />{isAr ? "واتساب" : "WhatsApp"}
                    </a>
                  )}
                  {agent.email && (
                    <a href={`mailto:${agent.email}`} className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-5 py-2.5 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
                      <Mail className="w-4 h-4" />{isAr ? "بريد إلكتروني" : "Email"}
                    </a>
                  )}
                </div>

                {/* License */}

              </div>

              {/* Stats */}
              <div className="bg-slate-50 rounded-xl p-5 shrink-0 text-center min-w-[140px]">
                <div className="text-3xl font-bold text-[#c8a45e]">{totalProperties}</div>
                <div className="text-sm text-slate-500 mt-1">{isAr ? "عقار معروض" : "Properties"}</div>
              </div>
            </div>

            {/* Bio */}
            {(agent.bioAr || agent.bioEn) && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="font-bold text-[#0f1b33] mb-2">{isAr ? "نبذة" : "About"}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {isAr ? agent.bioAr : (agent.bioEn || agent.bioAr)}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Properties Section */}
      {properties.length > 0 && (
        <section className="container py-10">
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
                      <div className="relative h-48 bg-slate-100 overflow-hidden">
                        {coverImage ? (
                          <img loading="lazy" src={coverImage} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="w-12 h-12 text-slate-300" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3 flex gap-2">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold text-white ${prop.listingType === "sale" ? "bg-[#c8a45e]" : "bg-emerald-500"}`}>
                            {prop.listingType === "sale" ? (isAr ? "للبيع" : "Sale") : (isAr ? "للإيجار" : "Rent")}
                          </span>
                        </div>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(prop.id); }}
                          className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <Heart className={`w-4 h-4 ${isFavorite(prop.id) ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
                        </button>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-[#0f1b33] truncate group-hover:text-[#c8a45e] transition-colors">
                          {isAr ? prop.title : (prop.titleEn || prop.title)}
                        </h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {isAr ? `${prop.district || ""} - ${prop.city || ""}` : `${prop.districtEn || prop.district || ""} - ${prop.cityEn || prop.city || ""}`}
                        </p>
                        <div className="mt-3">
                          <span className="text-lg font-bold text-[#c8a45e]">{formatPrice(prop.price)}</span>
                          <span className="text-sm text-slate-400 mr-1">{isAr ? "ريال" : "SAR"}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-sm text-slate-500">
                          {prop.rooms && <span className="flex items-center gap-1"><BedDouble className="w-4 h-4" />{prop.rooms}</span>}
                          {prop.bathrooms && <span className="flex items-center gap-1"><Bath className="w-4 h-4" />{prop.bathrooms}</span>}
                          {prop.area && <span className="flex items-center gap-1"><Maximize className="w-4 h-4" />{prop.area} {isAr ? "م²" : "sqm"}</span>}
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
