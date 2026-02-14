import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useState } from "react";
import { Building2, Home, Landmark, Store, MapPin, Upload, Phone, CheckCircle, ArrowRight, ArrowLeft, Loader2, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMemo } from "react";

export default function AddProperty() {
  const { t, isAr } = useLanguage();
  const { data: citiesWithDistricts } = trpc.public.getCitiesWithDistricts.useQuery();

  const steps = isAr ? ["نوع العقار", "الموقع", "التفاصيل", "الصور", "التواصل"] : ["Property Type", "Location", "Details", "Photos", "Contact"];

  const propertyTypes = [
    { icon: Home, label: isAr ? "فيلا" : "Villa", value: "villa" },
    { icon: Building2, label: isAr ? "شقة" : "Apartment", value: "apartment" },
    { icon: Landmark, label: isAr ? "أرض" : "Land", value: "land" },
    { icon: Store, label: isAr ? "تجاري" : "Commercial", value: "commercial" },
  ];

  const purposes = [
    { label: isAr ? "للبيع" : "For Sale", value: "sale" },
    { label: isAr ? "للإيجار" : "For Rent", value: "rent" },
  ];

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ type: "", purpose: "", city: "", district: "", area: "", rooms: "", bathrooms: "", price: "", description: "", name: "", phone: "", email: "" });

  const [requestNumber, setRequestNumber] = useState("");
  const submitMutation = trpc.public.submitProperty.useMutation({
    onSuccess: (data) => { toast.success(data.message); setRequestNumber(data.requestNumber || ""); setSubmitted(true); },
    onError: (error) => { toast.error(error.message || (isAr ? "حدث خطأ أثناء الإرسال. حاول مرة أخرى." : "An error occurred. Please try again.")); },
  });

  const next = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error(isAr ? "الاسم ورقم الجوال مطلوبان" : "Name and phone are required"); return; }
    submitMutation.mutate({ type: form.type, purpose: form.purpose, city: form.city, district: form.district || undefined, area: form.area || undefined, rooms: form.rooms || undefined, bathrooms: form.bathrooms || undefined, price: form.price || undefined, description: form.description || undefined, name: form.name, phone: form.phone, email: form.email || undefined });
  };

  const typeLabel = (v: string) => ({ villa: isAr ? "فيلا" : "Villa", apartment: isAr ? "شقة" : "Apartment", land: isAr ? "أرض" : "Land", commercial: isAr ? "تجاري" : "Commercial" }[v] || v);
  const purposeLabel = (v: string) => v === "sale" ? (isAr ? "للبيع" : "For Sale") : (isAr ? "للإيجار" : "For Rent");

  const NextArrow = isAr ? ArrowLeft : ArrowRight;
  const PrevArrow = isAr ? ArrowRight : ArrowLeft;

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f8f5f0]">
        <Navbar />
        <section className="pt-32 pb-20">
          <div className="container max-w-2xl">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-10 h-10 text-green-500" /></div>
              <h2 className="text-2xl font-bold text-[#0f1b33] mb-3">{isAr ? "تم استلام طلبك بنجاح!" : "Your request has been received!"}</h2>
              <p className="text-gray-500 mb-4">{isAr ? "سيقوم فريقنا المتخصص بمراجعة بيانات العقار والتواصل معك في أقرب وقت ممكن." : "Our team will review your property details and contact you as soon as possible."}</p>
              {requestNumber && (
                <div className="inline-block bg-[#c8a45e]/10 border border-[#c8a45e]/30 rounded-lg px-5 py-2.5 mb-6">
                  <span className="text-sm text-gray-500">{isAr ? "رقم الطلب:" : "Request #:"}</span>
                  <span className="font-bold text-[#0f1b33] ms-2 text-lg" dir="ltr">{requestNumber}</span>
                </div>
              )}
              <div className="bg-[#f8f5f0] rounded-xl p-4 mb-6 text-start">
                <h4 className="font-bold text-[#0f1b33] text-sm mb-2">{isAr ? "ملخص الطلب:" : "Request Summary:"}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-500">{isAr ? "نوع العقار:" : "Property Type:"}</span>
                  <span className="font-medium text-[#0f1b33]">{typeLabel(form.type)}</span>
                  <span className="text-gray-500">{isAr ? "الغرض:" : "Purpose:"}</span>
                  <span className="font-medium text-[#0f1b33]">{purposeLabel(form.purpose)}</span>
                  {form.city && <><span className="text-gray-500">{isAr ? "المدينة:" : "City:"}</span><span className="font-medium text-[#0f1b33]">{form.city}</span></>}
                  {form.price && <><span className="text-gray-500">{isAr ? "السعر:" : "Price:"}</span><span className="font-medium text-[#E31E24]">{Number(form.price).toLocaleString()} {isAr ? "ر.س" : "SAR"}</span></>}
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <a href="/" className="px-6 py-2.5 bg-[#0f1b33] text-white rounded-lg font-medium hover:bg-[#1a2a4a] transition-colors">{t("common.backToHome")}</a>
                <button onClick={() => { setSubmitted(false); setRequestNumber(""); setStep(0); setForm({ type: "", purpose: "", city: "", district: "", area: "", rooms: "", bathrooms: "", price: "", description: "", name: "", phone: "", email: "" }); }} className="px-6 py-2.5 bg-[#c8a45e] text-[#0f1b33] rounded-lg font-medium hover:bg-[#b8944e] transition-colors">{isAr ? "إضافة عقار آخر" : "Add Another Property"}</button>
              </div>
            </motion.div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <Navbar />
      <section className="pt-32 pb-20">
        <div className="container max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-[#0f1b33] mb-3">{t("addProperty.title")}</h1>
            <p className="text-gray-500">{isAr ? "أضف عقارك مجاناً وسيقوم فريقنا بالتواصل معك" : "List your property for free and our team will contact you"}</p>
          </motion.div>

          {/* Progress */}
          <div className="flex items-center justify-between mb-10 px-4">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i <= step ? "bg-[#c8a45e] text-[#0f1b33]" : "bg-gray-200 text-gray-400"}`}>
                  {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`hidden md:block text-xs ${i <= step ? "text-[#0f1b33] font-medium" : "text-gray-400"}`}>{s}</span>
                {i < steps.length - 1 && <div className={`w-8 md:w-16 h-0.5 ${i < step ? "bg-[#c8a45e]" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Honeypot anti-spam */}
            <input type="text" name="_hp" tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }} />
            <div className="bg-white rounded-2xl p-8 shadow-sm min-h-[300px]">
              {step === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <h3 className="text-xl font-bold text-[#0f1b33] mb-4">{steps[0]}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {propertyTypes.map(pt => (
                      <button key={pt.value} type="button" onClick={() => setForm({ ...form, type: pt.value })}
                        className={`p-6 rounded-xl border-2 text-center transition-all ${form.type === pt.value ? "border-[#c8a45e] bg-[#c8a45e]/5" : "border-gray-100 hover:border-gray-200"}`}>
                        <pt.icon className={`w-8 h-8 mx-auto mb-2 ${form.type === pt.value ? "text-[#c8a45e]" : "text-gray-400"}`} />
                        <span className={`font-medium ${form.type === pt.value ? "text-[#0f1b33]" : "text-gray-500"}`}>{pt.label}</span>
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{isAr ? "الغرض" : "Purpose"}</label>
                    <div className="flex gap-4">
                      {purposes.map(p => (
                        <button key={p.value} type="button" onClick={() => setForm({ ...form, purpose: p.value })}
                          className={`flex-1 py-3 rounded-lg border-2 font-medium transition-all ${form.purpose === p.value ? "border-[#E31E24] bg-[#E31E24]/5 text-[#E31E24]" : "border-gray-100 text-gray-500 hover:border-gray-200"}`}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <h3 className="text-xl font-bold text-[#0f1b33] mb-4">{steps[1]}</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{isAr ? "المدينة *" : "City *"}</label>
                    <select value={form.city} onChange={e => setForm({ ...form, city: e.target.value, district: "" })} className="w-full px-4 py-3 bg-[#f8f5f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30">
                      <option value="">{isAr ? "اختر المدينة" : "Select City"}</option>
                      {citiesWithDistricts?.map(c => (
                        <option key={c.id} value={c.nameAr}>{isAr ? c.nameAr : c.nameEn}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{isAr ? "الحي" : "District"}</label>
                    <select value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} disabled={!form.city}
                      className="w-full px-4 py-3 bg-[#f8f5f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 disabled:opacity-50 disabled:cursor-not-allowed">
                      <option value="">{isAr ? "اختر الحي" : "Select District"}</option>
                      {citiesWithDistricts?.find(c => c.nameAr === form.city)?.districts.map(d => (
                        <option key={d.id} value={d.nameAr}>{isAr ? d.nameAr : d.nameEn}</option>
                      ))}
                    </select>
                  </div>
                  <div className="bg-[#f8f5f0] rounded-xl p-8 flex items-center justify-center text-gray-400">
                    <MapPin className="w-6 h-6 me-2" /><span>{isAr ? "سيتم تحديد الموقع على الخريطة لاحقاً" : "Location will be pinned on map later"}</span>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <h3 className="text-xl font-bold text-[#0f1b33] mb-4">{steps[2]}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">{isAr ? "المساحة (م²)" : "Area (sqm)"}</label><input type="number" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} className="w-full px-4 py-3 bg-[#f8f5f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" placeholder="200" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">{isAr ? "السعر (ر.س)" : "Price (SAR)"}</label><input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full px-4 py-3 bg-[#f8f5f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" placeholder="1,000,000" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">{isAr ? "عدد الغرف" : "Rooms"}</label><input type="number" value={form.rooms} onChange={e => setForm({ ...form, rooms: e.target.value })} className="w-full px-4 py-3 bg-[#f8f5f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" placeholder="4" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">{isAr ? "دورات المياه" : "Bathrooms"}</label><input type="number" value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: e.target.value })} className="w-full px-4 py-3 bg-[#f8f5f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" placeholder="3" /></div>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">{isAr ? "وصف العقار" : "Description"}</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} className="w-full px-4 py-3 bg-[#f8f5f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 resize-none" placeholder={isAr ? "اكتب وصفاً تفصيلياً للعقار..." : "Write a detailed description..."} /></div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <h3 className="text-xl font-bold text-[#0f1b33] mb-4">{steps[3]}</h3>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center hover:border-[#c8a45e] transition-colors cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">{isAr ? "اسحب الصور هنا أو انقر للتحميل" : "Drag photos here or click to upload"}</p>
                    <p className="text-xs text-gray-400">{isAr ? "حتى 20 صورة - JPG, PNG - الحد الأقصى 5MB لكل صورة" : "Up to 20 images - JPG, PNG - Max 5MB each"}</p>
                  </div>
                  <p className="text-xs text-gray-400">{isAr ? "* يمكنك تخطي هذه الخطوة وإضافة الصور لاحقاً عبر فريقنا" : "* You can skip this step and add photos later through our team"}</p>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <h3 className="text-xl font-bold text-[#0f1b33] mb-4">{steps[4]}</h3>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">{isAr ? "الاسم الكامل *" : "Full Name *"}</label><input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 bg-[#f8f5f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" placeholder={isAr ? "أدخل اسمك" : "Enter your name"} disabled={submitMutation.isPending} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">{isAr ? "رقم الجوال *" : "Phone *"}</label><input type="tel" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 bg-[#f8f5f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" placeholder="05XXXXXXXX" dir="ltr" disabled={submitMutation.isPending} /><p className="text-xs text-gray-400 mt-1" dir="ltr">{isAr ? "مثال: 0512345678 أو +966512345678" : "e.g. 0512345678 or +966512345678"}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">{isAr ? "البريد الإلكتروني (اختياري)" : "Email (optional)"}</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 bg-[#f8f5f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" placeholder="example@email.com" dir="ltr" disabled={submitMutation.isPending} /></div>
                  <p className="text-xs text-gray-400 flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" />{isAr ? "معلوماتك محمية ولن يتم مشاركتها مع أي طرف ثالث" : "Your information is protected and will not be shared"}</p>
                </motion.div>
              )}
            </div>

            <div className="flex items-center justify-between mt-6">
              {step > 0 ? (
                <button type="button" onClick={prev} disabled={submitMutation.isPending} className="flex items-center gap-2 text-gray-500 hover:text-[#0f1b33] font-medium transition-colors disabled:opacity-50">
                  <PrevArrow className="w-4 h-4" />{isAr ? "السابق" : "Previous"}
                </button>
              ) : <div />}
              {step < steps.length - 1 ? (
                <button type="button" onClick={next} className="flex items-center gap-2 bg-[#c8a45e] hover:bg-[#b8944e] text-[#0f1b33] font-semibold px-8 py-3 rounded-lg transition-colors">
                  {isAr ? "التالي" : "Next"}<NextArrow className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" disabled={submitMutation.isPending} className="flex items-center gap-2 bg-[#E31E24] hover:bg-[#c91a1f] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-lg transition-colors">
                  {submitMutation.isPending ? (<><Loader2 className="w-4 h-4 animate-spin" />{isAr ? "جاري الإرسال..." : "Sending..."}</>) : (<><Send className="w-4 h-4" />{isAr ? "إرسال الطلب" : "Submit"}</>)}
                </button>
              )}
            </div>
          </form>
        </div>
      </section>
      <Footer />
    </div>
  );
}
