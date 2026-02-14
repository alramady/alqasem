import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MapView } from "@/components/Map";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, Navigation, Building2, Loader2, CheckCircle } from "lucide-react";
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSection } from "@/contexts/SiteConfigContext";

export default function Contact() {
  const { t, isAr, dir } = useLanguage();
  const contactSection = useSection("contact");

  // Fetch the CMS "contact" page content from the pages table
  const { data: cmsPage } = trpc.public.getPageBySlug.useQuery(
    { slug: "contact" },
    { retry: false, staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const content = contactSection?.content as any;

  // Read contact info from DB section content or use defaults
  const phone = content?.phone || "920001911";
  const whatsapp = content?.whatsapp || "+966 50 005 1679";
  const whatsappLink = content?.whatsappLink || "https://wa.me/966500051679";
  const email = content?.email || "info@alqasem.com.sa";
  const workingHoursAr = content?.workingHoursAr || "الأحد - الخميس: 9 ص - 6 م";
  const workingHoursEn = content?.workingHoursEn || "Sun - Thu: 9 AM - 6 PM";

  // Read branches from DB or use defaults
  const defaultBranches = [
    {
      nameAr: "المقر الرئيسي", nameEn: "Head Office",
      addressAr: "الرياض، حي الورود، طريق العليا العام", addressEn: "Riyadh, Al-Wurud, Olaya Main Road",
      phone: phone,
      hoursAr: "الأحد - الخميس: 9:00 ص - 6:00 م", hoursEn: "Sun - Thu: 9:00 AM - 6:00 PM",
      lat: 24.6978, lng: 46.6850,
    },
    {
      nameAr: "فرع شرق الرياض", nameEn: "East Riyadh Branch",
      addressAr: "الرياض، حي الروابي، طريق الشيخ جابر", addressEn: "Riyadh, Al-Rawabi, Sheikh Jaber Road",
      phone: phone,
      hoursAr: "الأحد - الخميس: 9:00 ص - 6:00 م", hoursEn: "Sun - Thu: 9:00 AM - 6:00 PM",
      lat: 24.6620, lng: 46.7590,
    },
    {
      nameAr: "فرع شمال الرياض", nameEn: "North Riyadh Branch",
      addressAr: "الرياض، حي النرجس، طريق الملك سلمان", addressEn: "Riyadh, Al-Narjis, King Salman Road",
      phone: phone,
      hoursAr: "الأحد - الخميس: 9:00 ص - 6:00 م", hoursEn: "Sun - Thu: 9:00 AM - 6:00 PM",
      lat: 24.8414, lng: 46.6527,
    },
  ];

  const dbBranches = content?.branches;
  const branches = (dbBranches && Array.isArray(dbBranches) && dbBranches.length > 0)
    ? dbBranches.map((b: any) => ({
        nameAr: b.nameAr || b.name || "",
        nameEn: b.nameEn || b.name || "",
        addressAr: b.addressAr || b.address || "",
        addressEn: b.addressEn || b.address || "",
        phone: b.phone || phone,
        hoursAr: b.hoursAr || workingHoursAr,
        hoursEn: b.hoursEn || workingHoursEn,
        lat: b.lat || 24.6978,
        lng: b.lng || 46.6850,
      }))
    : defaultBranches;

  const [formData, setFormData] = useState({ name: "", phone: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [activeBranch, setActiveBranch] = useState(0);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const infoWindowsRef = useRef<google.maps.InfoWindow[]>([]);

  const [requestNumber, setRequestNumber] = useState("");
  const submitMutation = trpc.public.submitInquiry.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setRequestNumber(data.requestNumber || "");
      setSubmitted(true);
      setFormData({ name: "", phone: "", email: "", subject: "", message: "" });
    },
    onError: (error) => {
      toast.error(error.message || (isAr ? "حدث خطأ أثناء الإرسال. حاول مرة أخرى." : "An error occurred. Please try again."));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate({
      name: formData.name,
      phone: formData.phone,
      email: formData.email || undefined,
      subject: formData.subject || undefined,
      message: formData.message,
      source: "contact_page",
    });
  };

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    const bounds = new google.maps.LatLngBounds();
    const fontName = isAr ? "Cairo" : "Inter";

    branches.forEach((branch: any, index: number) => {
      const position = { lat: branch.lat, lng: branch.lng };
      bounds.extend(position);
      const bName = isAr ? branch.nameAr : branch.nameEn;

      const markerContent = document.createElement("div");
      markerContent.innerHTML = `<div style="background: ${index === 0 ? '#E31E24' : '#0f1b33'}; color: white; padding: 8px 14px; border-radius: 12px; font-family: '${fontName}', sans-serif; font-size: 12px; font-weight: 700; box-shadow: 0 4px 12px rgba(0,0,0,0.25); cursor: pointer; white-space: nowrap; display: flex; align-items: center; gap: 6px;"><span style="font-size: 14px;">📍</span>${bName}</div>`;

      const marker = new google.maps.marker.AdvancedMarkerElement({ map, position, title: bName, content: markerContent });
      const bAddr = isAr ? branch.addressAr : branch.addressEn;
      const bHours = isAr ? branch.hoursAr : branch.hoursEn;
      const directionsLabel = isAr ? "الاتجاهات" : "Directions";

      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="padding: 12px; font-family: '${fontName}', sans-serif; direction: ${dir}; min-width: 240px;"><h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 700; color: #0f1b33;">🏢 ${bName}</h3><div style="margin: 0 0 6px 0; font-size: 12px; color: #666; display: flex; align-items: flex-start; gap: 6px;"><span style="color: #c8a45e; flex-shrink: 0;">📍</span><span>${bAddr}</span></div><div style="margin: 0 0 6px 0; font-size: 12px; color: #666; display: flex; align-items: center; gap: 6px;"><span style="color: #c8a45e; flex-shrink: 0;">📞</span><a href="tel:${branch.phone}" style="color: #E31E24; text-decoration: none; font-weight: 600;">${branch.phone}</a></div><div style="margin: 0 0 10px 0; font-size: 12px; color: #666; display: flex; align-items: center; gap: 6px;"><span style="color: #c8a45e; flex-shrink: 0;">🕐</span><span>${bHours}</span></div><a href="https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #E31E24; color: white; padding: 6px 16px; border-radius: 8px; font-size: 12px; text-decoration: none; font-weight: 600;">🧭 ${directionsLabel}</a></div>`,
      });

      marker.addListener("click", () => {
        infoWindowsRef.current.forEach(iw => iw.close());
        infoWindow.open({ anchor: marker, map });
        map.panTo(position);
        map.setZoom(15);
        setActiveBranch(index);
      });

      markersRef.current.push(marker);
      infoWindowsRef.current.push(infoWindow);
    });

    map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
    if (infoWindowsRef.current[0] && markersRef.current[0]) {
      infoWindowsRef.current[0].open({ anchor: markersRef.current[0], map });
    }
  };

  const focusBranch = (index: number) => {
    setActiveBranch(index);
    if (mapRef.current && markersRef.current[index]) {
      const branch = branches[index];
      mapRef.current.panTo({ lat: branch.lat, lng: branch.lng });
      mapRef.current.setZoom(15);
      infoWindowsRef.current.forEach(iw => iw.close());
      if (infoWindowsRef.current[index]) {
        infoWindowsRef.current[index].open({ anchor: markersRef.current[index], map: mapRef.current });
      }
    }
  };

  const contactCards = [
    { icon: Phone, titleAr: "اتصل بنا", titleEn: "Call Us", value: phone, href: `tel:${phone}`, color: "#E31E24" },
    { icon: MessageCircle, titleAr: "واتساب", titleEn: "WhatsApp", value: whatsapp, href: whatsappLink, color: "#25D366" },
    { icon: Mail, titleAr: "البريد الإلكتروني", titleEn: "Email", value: email, href: `mailto:${email}`, color: "#c8a45e" },
    { icon: Clock, titleAr: "ساعات العمل", titleEn: "Working Hours", valueAr: workingHoursAr, valueEn: workingHoursEn, href: "#", color: "#0f1b33" },
  ];

  const subjectOptions = [
    { valueAr: "شراء عقار", valueEn: "Buy Property" },
    { valueAr: "إيجار عقار", valueEn: "Rent Property" },
    { valueAr: "إدارة أملاك", valueEn: "Property Management" },
    { valueAr: "استشارة عقارية", valueEn: "Real Estate Consulting" },
    { valueAr: "أخرى", valueEn: "Other" },
  ];

  const slideInStart = isAr ? 30 : -30;
  const slideInEnd = isAr ? -30 : 30;

  // Page title/desc from CMS or defaults
  const heroTitle = cmsPage?.title || (isAr ? "نسعد بتواصلكم" : "We'd Love to Hear from You");
  const heroDesc = cmsPage?.seoDescription || (isAr ? "فريقنا المتخصص جاهز لمساعدتك في جميع استفساراتك العقارية" : "Our expert team is ready to help with all your real estate inquiries");

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 bg-[#0f1b33]">
        <div className="container relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto">
            <span className="inline-block text-[#c8a45e] text-sm font-semibold tracking-wider mb-4 border border-[#c8a45e]/30 px-4 py-1.5 rounded-full">{t("contact.badge")}</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">{heroTitle}</h1>
            <p className="text-lg text-white/60">{heroDesc}</p>
          </motion.div>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-10 -mt-10 relative z-20">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-4">
            {contactCards.map((item, i) => (
              <motion.a key={i} href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white rounded-xl p-5 shadow-lg hover:shadow-xl transition-all text-center group">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: `${item.color}15` }}>
                  <item.icon className="w-6 h-6" style={{ color: item.color }} />
                </div>
                <h3 className="font-bold text-[#0f1b33] text-sm mb-1">{isAr ? item.titleAr : item.titleEn}</h3>
                <p className="text-gray-500 text-xs" dir={item.titleEn === "WhatsApp" ? "ltr" : undefined}>
                  {"valueAr" in item ? (isAr ? item.valueAr : item.valueEn) : item.value}
                </p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-12 bg-[#f8f5f0]">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#0f1b33] mb-3">{isAr ? "فروعنا على الخريطة" : "Our Branches on the Map"}</h2>
            <p className="text-gray-500">{isAr ? "اختر الفرع الأقرب إليك للحصول على أفضل خدمة" : "Choose the nearest branch for the best service"}</p>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-3">
              {branches.map((branch: any, i: number) => (
                <motion.button key={i} initial={{ opacity: 0, x: slideInStart }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} onClick={() => focusBranch(i)}
                  className={`w-full text-start rounded-xl p-4 transition-all ${activeBranch === i ? "bg-[#0f1b33] text-white shadow-lg" : "bg-white text-[#0f1b33] hover:shadow-md"}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${activeBranch === i ? "bg-[#c8a45e]" : "bg-[#f8f5f0]"}`}>
                      <Building2 className={`w-5 h-5 ${activeBranch === i ? "text-[#0f1b33]" : "text-[#c8a45e]"}`} />
                    </div>
                    <h3 className="font-bold text-sm">{isAr ? branch.nameAr : branch.nameEn}</h3>
                  </div>
                  <div className={`space-y-1.5 text-xs ${activeBranch === i ? "text-white/70" : "text-gray-500"}`}>
                    <div className="flex items-start gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>{isAr ? branch.addressAr : branch.addressEn}</span></div>
                    <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 shrink-0" /><span dir="ltr">{branch.phone}</span></div>
                    <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 shrink-0" /><span>{isAr ? branch.hoursAr : branch.hoursEn}</span></div>
                  </div>
                  {activeBranch === i && (
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 bg-[#E31E24] text-white text-xs font-semibold py-2 rounded-lg hover:bg-[#c91a1f] transition-colors">
                      <Navigation className="w-3 h-3" />{isAr ? "الاتجاهات" : "Directions"}
                    </a>
                  )}
                </motion.button>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="lg:col-span-3 bg-white rounded-2xl overflow-hidden shadow-lg">
              <MapView className="h-[400px] w-full" onMapReady={handleMapReady} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CMS Page Extra Content */}
      {cmsPage?.content && cmsPage.content.trim().length > 0 && (
        <section className="py-16 bg-white">
          <div className="container max-w-4xl">
            <div className="cms-content" dangerouslySetInnerHTML={{ __html: cmsPage.content }} />
          </div>
        </section>
      )}

      {/* Contact Form */}
      <section className="py-16">
        <div className="container">
          <div className="grid lg:grid-cols-5 gap-12">
            <motion.div initial={{ opacity: 0, x: slideInStart }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:col-span-3">
              <h2 className="text-2xl font-bold text-[#0f1b33] mb-6">{isAr ? "أرسل رسالتك" : "Send Your Message"}</h2>

              {submitted ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-green-800 mb-2">{t("contact.success")}</h3>
                  <p className="text-green-600 mb-3">{t("contact.successDesc")}</p>
                  {requestNumber && (
                    <div className="inline-block bg-white border border-green-300 rounded-lg px-4 py-2 mb-4">
                      <span className="text-sm text-gray-500">{isAr ? "رقم الطلب:" : "Request #:"}</span>
                      <span className="font-bold text-[#0f1b33] ms-2" dir="ltr">{requestNumber}</span>
                    </div>
                  )}
                  <div className="mt-4">
                    <button onClick={() => { setSubmitted(false); setRequestNumber(""); }} className="px-6 py-2.5 bg-[#c8a45e] text-[#0f1b33] rounded-lg font-medium hover:bg-[#b8944e] transition-colors">
                      {isAr ? "إرسال رسالة أخرى" : "Send Another Message"}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Honeypot anti-spam - hidden from users */}
                  <input type="text" name="_hp" tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }} />
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("contact.name")} *</label>
                      <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-[#f8f5f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" placeholder={isAr ? "أدخل اسمك" : "Enter your name"} disabled={submitMutation.isPending} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("contact.phone")} *</label>
                      <input type="tel" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 bg-[#f8f5f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" placeholder="05XXXXXXXX" dir="ltr" disabled={submitMutation.isPending} />
                      <p className="text-xs text-gray-400 mt-1" dir="ltr">{isAr ? "مثال: 0512345678 أو +966512345678" : "e.g. 0512345678 or +966512345678"}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("contact.email")}</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 bg-[#f8f5f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" placeholder="example@email.com" dir="ltr" disabled={submitMutation.isPending} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{isAr ? "الموضوع" : "Subject"}</label>
                    <select value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className="w-full px-4 py-3 bg-[#f8f5f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" disabled={submitMutation.isPending}>
                      <option value="">{isAr ? "اختر الموضوع" : "Select Subject"}</option>
                      {subjectOptions.map((opt, i) => (
                        <option key={i} value={isAr ? opt.valueAr : opt.valueEn}>{isAr ? opt.valueAr : opt.valueEn}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("contact.message")} *</label>
                    <textarea required value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} rows={5} className="w-full px-4 py-3 bg-[#f8f5f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 resize-none" placeholder={isAr ? "اكتب رسالتك هنا..." : "Write your message here..."} disabled={submitMutation.isPending} />
                  </div>
                  <button type="submit" disabled={submitMutation.isPending} className="w-full bg-[#E31E24] hover:bg-[#c91a1f] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                    {submitMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> {t("contact.sending")}</>
                    ) : (
                      <><Send className="w-4 h-4" /> {t("contact.send")}</>
                    )}
                  </button>
                </form>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, x: slideInEnd }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-[#0f1b33] mb-6">{isAr ? "معلومات التواصل" : "Contact Information"}</h2>
              <div className="space-y-4">
                {contactCards.map((item, i) => (
                  <a key={i} href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} className="block bg-[#f8f5f0] rounded-xl p-5 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                        <item.icon className="w-5 h-5" style={{ color: item.color }} />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#0f1b33] text-sm">{isAr ? item.titleAr : item.titleEn}</h4>
                        <span className="text-sm font-semibold" style={{ color: item.color }} dir={item.titleEn === "WhatsApp" ? "ltr" : undefined}>
                          {"valueAr" in item ? (isAr ? item.valueAr : item.valueEn) : item.value}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
