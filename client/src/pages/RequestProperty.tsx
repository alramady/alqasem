import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useState } from "react";
import { Search, Home, Building2, Landmark, Store, CheckCircle, ArrowRight, ArrowLeft, Loader2, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function RequestProperty() {
  const { t, isAr } = useLanguage();
  const { data: citiesWithDistricts } = trpc.public.getCitiesWithDistricts.useQuery();

  const steps = isAr
    ? ["نوع العقار", "الموقع والمواصفات", "الميزانية", "بيانات التواصل"]
    : ["Property Type", "Location & Specs", "Budget", "Contact Info"];

  const propertyTypes = [
    { icon: Home, label: isAr ? "فيلا" : "Villa", value: "villa" },
    { icon: Building2, label: isAr ? "شقة" : "Apartment", value: "apartment" },
    { icon: Landmark, label: isAr ? "أرض" : "Land", value: "land" },
    { icon: Store, label: isAr ? "تجاري" : "Commercial", value: "commercial" },
  ];

  const featuresAr = ["مسبح", "حديقة", "مصعد", "تكييف مركزي", "غرفة خادمة", "غرفة سائق", "مجلس", "مطبخ مجهز", "شرفة", "موقف مزدوج"];
  const featuresEn = ["Pool", "Garden", "Elevator", "Central AC", "Maid Room", "Driver Room", "Majlis", "Equipped Kitchen", "Balcony", "Double Parking"];
  const features = isAr ? featuresAr : featuresEn;

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    type: "", purpose: "buy", city: "", district: "", minArea: "", maxArea: "",
    rooms: "", minBudget: "", maxBudget: "", features: [] as string[],
    name: "", phone: "", email: "", notes: "",
  });

  const [requestNumber, setRequestNumber] = useState("");
  const submitMutation = trpc.public.submitInquiry.useMutation({
    onSuccess: (data) => { toast.success(data.message); setRequestNumber(data.requestNumber || ""); setSubmitted(true); },
    onError: (error) => { toast.error(error.message || (isAr ? "حدث خطأ أثناء الإرسال." : "An error occurred.")); },
  });

  const next = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));
  const toggleFeature = (f: string) => setForm(prev => ({ ...prev, features: prev.features.includes(f) ? prev.features.filter(x => x !== f) : [...prev.features, f] }));

  const typeLabel = (v: string) => ({ villa: isAr ? "فيلا" : "Villa", apartment: isAr ? "شقة" : "Apartment", land: isAr ? "أرض" : "Land", commercial: isAr ? "تجاري" : "Commercial" }[v] || v);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error(isAr ? "الاسم ورقم الجوال مطلوبان" : "Name and phone are required"); return; }
    const message = [
      `${isAr ? "طلب عقار" : "Property Request"}: ${typeLabel(form.type)}`,
      `${isAr ? "الغرض" : "Purpose"}: ${form.purpose === "buy" ? (isAr ? "شراء" : "Buy") : (isAr ? "إيجار" : "Rent")}`,
      form.city ? `${isAr ? "المدينة" : "City"}: ${form.city}` : "",
      form.district ? `${isAr ? "الحي" : "District"}: ${form.district}` : "",
      form.rooms ? `${isAr ? "الغرف" : "Rooms"}: ${form.rooms}` : "",
      form.minArea || form.maxArea ? `${isAr ? "المساحة" : "Area"}: ${form.minArea || "?"} - ${form.maxArea || "?"} ${isAr ? "م²" : "sqm"}` : "",
      form.minBudget || form.maxBudget ? `${isAr ? "الميزانية" : "Budget"}: ${form.minBudget || "?"} - ${form.maxBudget || "?"} ${isAr ? "ر.س" : "SAR"}` : "",
      form.features.length > 0 ? `${isAr ? "المميزات" : "Features"}: ${form.features.join(", ")}` : "",
      form.notes ? `${isAr ? "ملاحظات" : "Notes"}: ${form.notes}` : "",
    ].filter(Boolean).join("\n");

    submitMutation.mutate({ name: form.name, email: form.email || undefined, phone: form.phone, subject: `${isAr ? "طلب عقار" : "Property Request"} - ${typeLabel(form.type)}`, message, source: "request_property" });
  };

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
              <p className="text-gray-500 mb-4">{isAr ? "سيتواصل معك مستشارنا العقاري خلال 24 ساعة لمساعدتك في إيجاد العقار المناسب." : "Our real estate consultant will contact you within 24 hours to help find the right property."}</p>
              {requestNumber && (
                <div className="inline-block bg-[#E31E24]/10 border border-[#E31E24]/30 rounded-lg px-5 py-2.5 mb-6">
                  <span className="text-sm text-gray-500">{isAr ? "رقم الطلب:" : "Request #:"}</span>
                  <span className="font-bold text-[#0f1b33] ms-2 text-lg" dir="ltr">{requestNumber}</span>
                </div>
              )}
              <div className="bg-[#f8f5f0] rounded-xl p-4 mb-6 text-start">
                <h4 className="font-bold text-[#0f1b33] text-sm mb-2">{isAr ? "ملخص الطلب:" : "Request Summary:"}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-500">{isAr ? "نوع العقار:" : "Type:"}</span><span className="font-medium text-[#0f1b33]">{typeLabel(form.type)}</span>
                  <span className="text-gray-500">{isAr ? "الغرض:" : "Purpose:"}</span><span className="font-medium text-[#0f1b33]">{form.purpose === "buy" ? (isAr ? "شراء" : "Buy") : (isAr ? "إيجار" : "Rent")}</span>
                  {form.city && <><span className="text-gray-500">{isAr ? "المدينة:" : "City:"}</span><span className="font-medium text-[#0f1b33]">{form.city}</span></>}
                  {(form.minBudget || form.maxBudget) && <><span className="text-gray-500">{isAr ? "الميزانية:" : "Budget:"}</span><span className="font-medium text-[#E31E24]">{form.minBudget || "?"} - {form.maxBudget || "?"} {isAr ? "ر.س" : "SAR"}</span></>}
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <a href="/" className="px-6 py-2.5 bg-[#0f1b33] text-white rounded-lg font-medium hover:bg-[#1a2a4a] transition-colors">{t("common.backToHome")}</a>
                <button onClick={() => { setSubmitted(false); setRequestNumber(""); setStep(0); setForm({ type: "", purpose: "buy", city: "", district: "", minArea: "", maxArea: "", rooms: "", minBudget: "", maxBudget: "", features: [], name: "", phone: "", email: "", notes: "" }); }} className="px-6 py-2.5 bg-[#E31E24] text-white rounded-lg font-medium hover:bg-[#c91a1f] transition-colors">{isAr ? "طلب عقار آخر" : "Request Another"}</button>
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
            <div className="w-16 h-16 bg-[#E31E24]/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><Search className="w-8 h-8 text-[#E31E24]" /></div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#0f1b33] mb-3">{t("requestProperty.title")}</h1>
            <p className="text-gray-500">{isAr ? "أخبرنا بمواصفات العقار المطلوب وسنبحث لك عن أفضل الخيارات" : "Tell us your requirements and we'll find the best options for you"}</p>
          </motion.div>

          {/* Progress */}
          <div className="flex items-center justify-between mb-10 px-4">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i <= step ? "bg-[#E31E24] text-white" : "bg-gray-200 text-gray-400"}`}>
                  {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`hidden md:block text-xs ${i <= step ? "text-[#0f1b33] font-medium" : "text-gray-400"}`}>{s}</span>
                {i < steps.length - 1 && <div className={`w-8 md:w-16 h-0.5 ${i < step ? "bg-[#E31E24]" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Honeypot anti-spam */}
            <input type="text" name="_hp" tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }} />
            <div className="bg-white rounded-2xl p-8 shadow-sm min-h-[300px]">
              {step === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <h3 className="text-xl font-bold text-[#0f1b33]">{isAr ? "ما نوع العقار المطلوب؟" : "What type of property?"}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {propertyTypes.map(pt => (
                      <button key={pt.value} type="button" onClick={() => setForm({ ...form, type: pt.value })}
                        className={`p-6 rounded-xl border-2 text-center transition-all ${form.type === pt.value ? "border-[#E31E24] bg-[#E31E24]/5" : "border-gray-100 hover:border-gray-200"}`}>
                        <pt.icon className={`w-8 h-8 mx-auto mb-2 ${form.type === pt.value ? "text-[#E31E24]" : "text-gray-400"}`} />
                        <span className={`font-medium ${form.type === pt.value ? "text-[#0f1b33]" : "text-gray-500"}`}>{pt.label}</span>
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{isAr ? "الغرض" : "Purpose"}</label>
                    <div className="flex gap-4">
                      {[{ l: isAr ? "شراء" : "Buy", v: "buy" }, { l: isAr ? "إيجار" : "Rent", v: "rent" }].map(p => (
                        <button key={p.v} type="button" onClick={() => setForm({ ...form, purpose: p.v })}
                          className={`flex-1 py-3 rounded-lg border-2 font-medium transition-all ${form.purpose === p.v ? "border-[#E31E24] bg-[#E31E24]/5 text-[#E31E24]" : "border-gray-100 text-gray-500"}`}>
                          {p.l}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <h3 className="text-xl font-bold text-[#0f1b33]">{steps[1]}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">{isAr ? "المدينة" : "City"}</label>
                      <select value={form.city} onChange={e => setForm({ ...form, city: e.target.value, district: "" })} className="w-full px-4 py-3 bg-[#f8f5f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30">
                        <option value="">{isAr ? "اختر المدينة" : "Select City"}</option>
                        {citiesWithDistricts?.map(c => (
                          <option key={c.id} value={c.nameAr}>{isAr ? c.nameAr : c.nameEn}</option>
                        ))}
                      </select>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">{isAr ? "الحي المفضل" : "Preferred District"}</label>
                      <select value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} disabled={!form.city}
                        className="w-full px-4 py-3 bg-[#f8f5f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 disabled:opacity-50 disabled:cursor-not-allowed">
                        <option value="">{isAr ? "اختر الحي" : "Select District"}</option>
                        {citiesWithDistricts?.find(c => c.nameAr === form.city)?.districts.map(d => (
                          <option key={d.id} value={d.nameAr}>{isAr ? d.nameAr : d.nameEn}</option>
                        ))}
                      </select>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">{isAr ? "المساحة من (م²)" : "Min Area (sqm)"}</label><input type="number" value={form.minArea} onChange={e => setForm({ ...form, minArea: e.target.value })} className="w-full px-4 py-3 bg-[#f8f5f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" placeholder="150" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">{isAr ? "المساحة إلى (م²)" : "Max Area (sqm)"}</label><input type="number" value={form.maxArea} onChange={e => setForm({ ...form, maxArea: e.target.value })} className="w-full px-4 py-3 bg-[#f8f5f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" placeholder="500" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">{isAr ? "عدد الغرف" : "Rooms"}</label><input type="number" value={form.rooms} onChange={e => setForm({ ...form, rooms: e.target.value })} className="w-full px-4 py-3 bg-[#f8f5f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" placeholder="4" /></div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{isAr ? "المميزات المطلوبة" : "Desired Features"}</label>
                    <div className="flex flex-wrap gap-2">
                      {features.map(f => (
                        <button key={f} type="button" onClick={() => toggleFeature(f)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-all ${form.features.includes(f) ? "bg-[#E31E24] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <h3 className="text-xl font-bold text-[#0f1b33]">{steps[2]}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">{isAr ? "الحد الأدنى (ر.س)" : "Min Budget (SAR)"}</label><input type="number" value={form.minBudget} onChange={e => setForm({ ...form, minBudget: e.target.value })} className="w-full px-4 py-3 bg-[#f8f5f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" placeholder="500,000" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">{isAr ? "الحد الأقصى (ر.س)" : "Max Budget (SAR)"}</label><input type="number" value={form.maxBudget} onChange={e => setForm({ ...form, maxBudget: e.target.value })} className="w-full px-4 py-3 bg-[#f8f5f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" placeholder="2,000,000" /></div>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">{isAr ? "ملاحظات إضافية" : "Additional Notes"}</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={4} className="w-full px-4 py-3 bg-[#f8f5f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 resize-none" placeholder={isAr ? "أي متطلبات أو ملاحظات إضافية..." : "Any additional requirements or notes..."} /></div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <h3 className="text-xl font-bold text-[#0f1b33]">{steps[3]}</h3>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">{isAr ? "الاسم الكامل *" : "Full Name *"}</label><input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 bg-[#f8f5f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" placeholder={isAr ? "أدخل اسمك" : "Enter your name"} disabled={submitMutation.isPending} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">{isAr ? "رقم الجوال *" : "Phone *"}</label><input type="tel" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 bg-[#f8f5f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" placeholder="05XXXXXXXX" dir="ltr" disabled={submitMutation.isPending} /><p className="text-xs text-gray-400 mt-1" dir="ltr">{isAr ? "مثال: 0512345678 أو +966512345678" : "e.g. 0512345678 or +966512345678"}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">{isAr ? "البريد الإلكتروني (اختياري)" : "Email (optional)"}</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 bg-[#f8f5f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" placeholder="example@email.com" dir="ltr" disabled={submitMutation.isPending} /></div>
                  <p className="text-xs text-gray-400 flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" />{isAr ? "سيتواصل معك مستشارنا العقاري خلال 24 ساعة" : "Our consultant will contact you within 24 hours"}</p>
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
                <button type="button" onClick={next} className="flex items-center gap-2 bg-[#E31E24] hover:bg-[#c91a1f] text-white font-semibold px-8 py-3 rounded-lg transition-colors">
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
