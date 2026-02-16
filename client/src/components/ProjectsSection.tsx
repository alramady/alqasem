import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, ArrowLeft, ArrowRight, CheckCircle2, Building, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";

const PROJECTS_BG = "https://private-us-east-1.manuscdn.com/sessionFile/W9WfnwDA3fn2WAkBwinsES/sandbox/Hm9AYHv39MJR6DI7A3PrrF-img-2_1770673182000_na1fn_cHJvamVjdHMtc2VjdGlvbi1iZw.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvVzlXZm53REEzZm4yV0FrQndpbnNFUy9zYW5kYm94L0htOUFZSHYzOU1KUjZESTdBM1ByckYtaW1nLTJfMTc3MDY3MzE4MjAwMF9uYTFmbl9jSEp2YW1WamRITXRjMlZqZEdsdmJpMWlady5qcGc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=KeAWprQguF9cPfTPJBaaTXWy0Vdzcn7AXQh7RFUuq2upcSlnmpbUtogAcQaHxHghfqxwuOE8NV4idHEpgQlW0HQbasc5cm0l6BrT35i9FgEYPb0f3qVNavHEg0uN70KT8RotzKioHue4xEAyJlsSy5um7KoDTYOl0dNy6W~AURvWJHq4nsUZEyFgxIfiKgkGX3~YRk-LD846jwKaMIqdTDwbRqbeg9XjkbjUPtT1VEHmGLr9nNcFPaC136ZvMDh3hSIOXaMqJfPPKJyDJoSGAaaxtIZsEgHC4aqg2AXIKWWDnZd6-QopI6x0Jqb28mQEDQJskfT~34~TSS4S4tQuww__";

// Fallback static data when DB is empty
const FALLBACK_PROJECTS = [
  {
    id: 1,
    title: 'مشروع "نكفيك"',
    subtitle: "شقق فاخرة للبيع",
    location: "حي عليشة",
    status: "completed" as const,
    totalUnits: 30, soldUnits: 30,
    description: "حققنا نجاحاً استثنائياً! تم بيع 30 شقة خلال فترة قياسية تبرز جودة وكفاءة خدماتنا التسويقية.",
    features: ["صالة رياضية", "كوفي كورنر", "صالة ألعاب أطفال", "مواقف خاصة"],
    images: ["https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/hzlsiNkGjPMHTBnl.jpeg"],
    isFeatured: true,
  },
  {
    id: 2,
    title: "مشروع سند 1",
    subtitle: "شقق تمليك فاخرة",
    location: "حي أم سليم",
    status: "completed" as const,
    totalUnits: 20, soldUnits: 18,
    description: "للنجاح الكبير والإقبال الذي لاقاه المشروع، تم بيع معظم الوحدات مع تبقي شقتين فقط.",
    features: ["شقق تمليك", "موقع مميز", "تشطيبات فاخرة"],
    images: ["https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/zfxMRnHsEkyRNdng.jpg"],
    isFeatured: true,
  },
  {
    id: 3,
    title: "مشروع سند 2",
    subtitle: "شقق تمليك فاخرة",
    location: "حي أم سليم",
    status: "completed" as const,
    totalUnits: 25, soldUnits: 25,
    description: "للنجاح الكبير والإقبال الذي لاقاه مشروع سند الأول، تم إطلاق المرحلة الثانية وبيعها بالكامل.",
    features: ["شقق تمليك", "موقع مميز", "تشطيبات فاخرة"],
    images: ["https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/HUQXMGSdzHlHRIOK.jpg"],
    isFeatured: true,
  },
];

function getStatusBadge(project: any, isAr: boolean): { label: string; color: string } {
  if (project.soldUnits && project.totalUnits && project.soldUnits >= project.totalUnits) {
    return { label: isAr ? "تم البيع بالكامل" : "Fully Sold", color: "bg-emerald-500" };
  }
  if (project.status === "completed") {
    const remaining = (project.totalUnits || 0) - (project.soldUnits || 0);
    if (remaining > 0) {
      return { label: isAr ? `متبقي ${remaining} وحدات` : `${remaining} units remaining`, color: "bg-amber-500" };
    }
    return { label: isAr ? "مكتمل" : "Completed", color: "bg-emerald-500" };
  }
  if (project.status === "upcoming") return { label: isAr ? "قريباً" : "Coming Soon", color: "bg-blue-500" };
  return { label: isAr ? "متاح" : "Available", color: "bg-[#c8a45e]" };
}

export default function ProjectsSection() {
  const { t, isAr } = useLanguage();
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const { data, isLoading } = trpc.public.listActiveProjects.useQuery(undefined, {
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const allProjects = data && data.length > 0 ? data : FALLBACK_PROJECTS;

  // Split into featured (with images) and past (without images or non-featured)
  const featuredProjects = allProjects
    .filter((p: any) => p.isFeatured || (Array.isArray(p.images) && p.images.length > 0))
    .slice(0, 3);

  const pastProjects = allProjects
    .filter((p: any) => !featuredProjects.some((fp: any) => fp.id === p.id))
    .slice(0, 10);

  const [showAll, setShowAll] = useState(false);
  const visiblePast = showAll ? pastProjects : pastProjects.slice(0, 5);

  return (
    <section id="projects" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0">
        <img loading="lazy" src={PROJECTS_BG} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#0f1b33]/92" />
      </div>

      <div className="relative container">
        <div className="text-center mb-14">
          <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-[#E31E24] font-semibold text-sm mb-3 block tracking-wider">
            {t("projects.badge")}
          </motion.span>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl lg:text-4xl font-bold text-white mb-4">
            {t("projects.title")}
          </motion.h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#c8a45e]" />
          </div>
        ) : (
          <>
            {/* Featured projects with images */}
            {featuredProjects.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredProjects.map((project: any, i: number) => {
                  const badge = getStatusBadge(project, isAr);
                  const imageUrl = Array.isArray(project.images) && project.images.length > 0
                    ? project.images[0]
                    : "https://placehold.co/600x400/0f1b33/c8a45e?text=No+Image";
                  const features = Array.isArray(project.features) ? project.features : [];

                  return (
                    <motion.div key={project.id} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                      <Link href={`/projects/${project.id}`}>
                        <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-[#c8a45e]/30 transition-all duration-500 cursor-pointer h-full">
                          <div className="relative h-52 overflow-hidden">
                            <img loading="lazy" src={imageUrl} alt={isAr ? project.title : (project.titleEn || project.title)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1b33]/80 to-transparent" />
                            <div className="absolute top-4" style={{ insetInlineStart: '1rem' }}>
                              <span className={`${badge.color} text-white text-xs px-3 py-1 rounded-lg font-medium`}>{badge.label}</span>
                            </div>
                            <div className="absolute bottom-4 flex items-center gap-1 text-white/80 text-sm" style={{ insetInlineStart: '1rem' }}>
                              <MapPin className="w-3.5 h-3.5 text-[#c8a45e] shrink-0" />
                              {isAr ? project.location : (project.locationEn || project.location)}
                            </div>
                          </div>
                          <div className="p-6">
                            <h3 className="text-xl font-bold text-white mb-1">{isAr ? project.title : (project.titleEn || project.title)}</h3>
                            {(project.subtitle || project.subtitleEn) && <p className="text-[#c8a45e] text-sm mb-3">{isAr ? project.subtitle : (project.subtitleEn || project.subtitle)}</p>}
                            {(project.description || project.descriptionEn) && (
                              <p className="text-white/50 text-sm leading-relaxed mb-4 line-clamp-3">{isAr ? project.description : (project.descriptionEn || project.description)}</p>
                            )}
                            {features.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {features.slice(0, 4).map((f: string) => (
                                  <span key={f} className="flex items-center gap-1 text-xs text-white/60 bg-white/5 px-2 py-1 rounded-lg">
                                    <CheckCircle2 className="w-3 h-3 text-[#c8a45e] shrink-0" />{f}
                                  </span>
                                ))}
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

            {/* Past / non-featured projects */}
            {pastProjects.length > 0 && (
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-16">
                <h3 className="text-xl font-bold text-white text-center mb-8">
                  {isAr ? "مشاريع سابقة ومُدارة" : "Previous & Managed Projects"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {visiblePast.map((project: any, i: number) => (
                    <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                      <Link href={`/projects/${project.id}`}>
                        <div className="group p-5 bg-white/5 border border-white/10 rounded-xl hover:border-[#c8a45e]/30 transition-all cursor-pointer h-[180px] flex flex-col justify-between">
                          <div>
                            <Building className="w-6 h-6 text-[#c8a45e] mb-3" />
                            <h4 className="text-sm font-bold text-white mb-1 line-clamp-2">{isAr ? project.title : (project.titleEn || project.title)}</h4>
                            {(project.subtitle || project.subtitleEn) && <p className="text-xs text-[#c8a45e]/70 mb-2 line-clamp-2">{isAr ? project.subtitle : (project.subtitleEn || project.subtitle)}</p>}
                          </div>
                          {project.location && (
                            <div className="flex items-center gap-1 text-xs text-white/40 mt-auto">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="line-clamp-1">{isAr ? project.location : (project.locationEn || project.location)}</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {!showAll && pastProjects.length > 5 && (
                  <div className="text-center mt-8">
                    <button onClick={() => setShowAll(true)} className="inline-flex items-center gap-2 border border-[#c8a45e]/30 text-[#c8a45e] hover:bg-[#c8a45e] hover:text-[#0f1b33] font-semibold px-6 py-3 rounded-xl transition-all text-sm">
                      {isAr ? `عرض جميع المشاريع (${pastProjects.length})` : `View All Projects (${pastProjects.length})`}
                      <ArrowIcon className="w-4 h-4 icon-directional" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}

        <div className="text-center mt-12">
          <Link href="/projects">
            <span className="inline-flex items-center gap-2 bg-[#E31E24] hover:bg-[#c91a1f] text-white font-semibold px-8 py-3 rounded-xl transition-all cursor-pointer group">
              {t("projects.viewAll")}
              <ArrowIcon className="w-4 h-4 icon-directional transition-transform" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
