import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, Send, MessageCircle, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteConfig, useSection, useSectionVisible } from "@/contexts/SiteConfigContext";

const CONTACT_BG = "https://private-us-east-1.manuscdn.com/sessionFile/W9WfnwDA3fn2WAkBwinsES/sandbox/Hm9AYHv39MJR6DI7A3PrrF-img-5_1770673184000_na1fn_Y29udGFjdC1zZWN0aW9u.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvVzlXZm53REEzZm4yV0FrQndpbnNFUy9zYW5kYm94L0htOUFZSHYzOU1KUjZESTdBM1ByckYtaW1nLTVfMTc3MDY3MzE4NDAwMF9uYTFmbl9ZMjl1ZEdGamRDMXpaV04wYVc5dS5qcGc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=Kt00G5AiqIiLzEk1hkW3xD3s~6nN7ewVCnjp0Upxs2TkMgMjK9vO~rLp47AQNvQSNX3AsgSXGOyYv7XEnb6oCNf60hYCbU-15qNOTPIM9W-xOBCyUxP4VZXMP-WhFlNjgljFYAE9vtsWzYwq7ulvghkZDe3iFcDnYtIYZJmd59MpI-rtQ36N9GSIZFOCsYNRrMtk8ap3Q1NsddiFlmszF6yLB7mImbzJgCseWD5e8jJNTIIrXWX5YY1affkMuoZ9q1DwjiccbRjM1ZyQTRHbvHRDzEph9xxWC~FrDeZQA8LhY49uS7PAsvoKTmxfCZNiWzbFdVbVF5Q1krSVdCQUkw__";

export default function ContactSection() {
  const { t, isAr } = useLanguage();
  const { settings } = useSiteConfig();
  const contactSection = useSection("contact");
  const isVisible = useSectionVisible("contact");
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  if (!isVisible) return null;

  const contactContent = contactSection?.content as any;

  const phone = settings.phone || "920001911";
  const mobile = settings.mobile || "0500051679";
  const email = settings.email || "info@alqasem.com.sa";
  const address = isAr
    ? (settings.address || "شارع الإمام عبد العزيز بن محمد بن سعود - حي أم سليم، الرياض")
    : (settings.addressEn || "Imam Abdulaziz bin Mohammed St. - Umm Saleem, Riyadh");
  const workingHours = isAr
    ? (settings.working_hours || "الأحد - الخميس: 9 ص - 6 م")
    : (settings.working_hours_en || "Sunday - Thursday: 9 AM - 6 PM");

  const contactInfo = [
    { icon: Phone, label: isAr ? "الرقم الموحد" : "Unified Number", value: phone, href: `tel:${phone}` },
    { icon: Phone, label: isAr ? "الجوال" : "Mobile", value: mobile, href: `tel:${mobile}` },
    { icon: Mail, label: isAr ? "البريد الإلكتروني" : "Email", value: email, href: `mailto:${email}` },
    { icon: MapPin, label: isAr ? "المقر الرئيسي" : "Head Office", value: address, href: "#" },
    { icon: Clock, label: isAr ? "ساعات العمل" : "Working Hours", value: workingHours, href: "#" },
  ];

  const submitMutation = trpc.public.submitInquiry.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setSubmitted(true);
      setFormData({ name: "", phone: "", email: "", message: "" });
      setTimeout(() => setSubmitted(false), 5000);
    },
    onError: (error) => {
      toast.error(error.message || (isAr ? "حدث خطأ أثناء الإرسال. حاول مرة أخرى." : "An error occurred. Please try again."));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.message) {
      toast.error(isAr ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields");
      return;
    }
    submitMutation.mutate({
      name: formData.name,
      phone: formData.phone,
      email: formData.email || undefined,
      message: formData.message,
      source: "homepage_contact",
    });
  };

  return (
    <section id="contact" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0">
        <img src={CONTACT_BG} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#0f1b33]/90" />
      </div>

      <div className="relative container">
        <div className="text-center mb-14">
          <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-[#E31E24] font-semibold text-sm mb-3 block tracking-wider">
            {t("contact.title")}
          </motion.span>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl lg:text-4xl font-bold text-white mb-4">
            {t("contact.badge")}
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <motion.div initial={{ opacity: 0, x: isAr ? 30 : -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:col-span-2 space-y-4">
            <p className="text-white/70 leading-relaxed mb-6">
              {isAr
                ? (contactContent?.descriptionAr || "سواء كنت تبحث عن عقار للشراء أو الإيجار، أو ترغب في إضافة عقارك أو طلب استشارة عقارية، فريقنا المتخصص جاهز لمساعدتك.")
                : (contactContent?.descriptionEn || "Whether you're looking to buy or rent a property, list your property, or request real estate consulting, our specialized team is ready to help.")}
            </p>

            {contactInfo.map((item, i) => (
              <motion.a key={item.label} href={item.href} initial={{ opacity: 0, x: isAr ? 20 : -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:border-[#c8a45e]/30 transition-all group">
                <div className="w-11 h-11 bg-[#c8a45e]/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#c8a45e]/30 transition-colors">
                  <item.icon className="w-5 h-5 text-[#c8a45e]" />
                </div>
                <div>
                  <div className="text-sm text-white/50 mb-1">{item.label}</div>
                  <div className="text-white font-medium text-sm">{item.value}</div>
                </div>
              </motion.a>
            ))}

            <a href="https://wa.me/966500051679" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-xl transition-all mt-4">
              <MessageCircle className="w-5 h-5" />
              {isAr ? "تواصل عبر واتساب" : "Chat on WhatsApp"}
            </a>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: isAr ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="lg:col-span-3">
            {submitted ? (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{t("contact.success")}</h3>
                <p className="text-white/60">{t("contact.successDesc")}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white mb-6">
                  {isAr ? "أرسل لنا رسالتك" : "Send Us a Message"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm text-white/60 mb-1.5 block">{t("contact.name")} *</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white/10 border border-white/15 text-white placeholder:text-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#c8a45e] transition-colors" placeholder={isAr ? "أدخل اسمك" : "Enter your name"} required disabled={submitMutation.isPending} />
                  </div>
                  <div>
                    <label className="text-sm text-white/60 mb-1.5 block">{t("contact.email")}</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-white/10 border border-white/15 text-white placeholder:text-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#c8a45e] transition-colors" placeholder="example@email.com" dir="ltr" disabled={submitMutation.isPending} />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-sm text-white/60 mb-1.5 block">{t("contact.phone")} *</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-white/10 border border-white/15 text-white placeholder:text-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#c8a45e] transition-colors" placeholder="+966 5x xxx xxxx" dir="ltr" required disabled={submitMutation.isPending} />
                </div>
                <div className="mb-6">
                  <label className="text-sm text-white/60 mb-1.5 block">{t("contact.message")} *</label>
                  <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} rows={5} className="w-full bg-white/10 border border-white/15 text-white placeholder:text-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#c8a45e] transition-colors resize-none" placeholder={isAr ? "اكتب تفاصيل طلبك هنا..." : "Write your message here..."} required disabled={submitMutation.isPending} />
                </div>
                <button type="submit" disabled={submitMutation.isPending} className="w-full flex items-center justify-center gap-2 bg-[#E31E24] hover:bg-[#c91a1f] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all group">
                  {submitMutation.isPending ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> {t("contact.sending")}</>
                  ) : (
                    <><Send className="w-5 h-5 icon-directional transition-transform" /> {t("contact.send")}</>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
