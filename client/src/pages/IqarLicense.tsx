import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { motion } from "framer-motion";
import { Award, Building2, FileCheck, Scale, Shield, Phone, Mail, MapPin, Globe, CheckCircle2, AlertCircle, BookOpen } from "lucide-react";

export default function IqarLicense() {
  const { isAr } = useLanguage();
  const { settings } = useSiteConfig();
  const falNumber = settings.fal_number || "";
  const crNumber = settings.cr_number || "";

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#0f1b33] to-[#1a2b4a] text-white py-20 pt-28">
        <div className="container max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Award className="w-16 h-16 mx-auto mb-6 text-[#c8a45e]" />
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {isAr ? "التراخيص والاعتمادات" : "Licenses & Accreditations"}
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              {isAr
                ? "شركة محمد بن عبد الرحمن القاسم العقارية — مرخصة ومعتمدة من الهيئة العامة للعقار"
                : "Mohammed bin Abdulrahman Al-Qasim Real Estate — Licensed and accredited by the General Authority for Real Estate (REGA)"}
            </p>
          </motion.div>
        </div>
      </section>

      {/* REGA License Card */}
      <section className="py-16">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-[#f8f5f0] to-white rounded-2xl border border-[#c8a45e]/20 overflow-hidden shadow-lg"
          >
            {/* License Header */}
            <div className="bg-[#0f1b33] p-6 md:p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Shield className="w-8 h-8 text-[#c8a45e]" />
                <h2 className="text-2xl font-bold text-white">
                  {isAr ? "ترخيص الهيئة العامة للعقار" : "General Authority for Real Estate License"}
                </h2>
              </div>
              <p className="text-white/60 text-sm">
                {isAr ? "رخصة فال للوساطة والتسويق العقاري" : "Fal License for Real Estate Brokerage & Marketing"}
              </p>
            </div>

            {/* License Details */}
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Info */}
                <div className="space-y-4">
                  <h3 className="font-bold text-[#0f1b33] text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#c8a45e]" />
                    {isAr ? "بيانات المنشأة" : "Company Information"}
                  </h3>

                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      <span className="text-xs text-gray-500 block mb-1">
                        {isAr ? "اسم المنشأة" : "Company Name"}
                      </span>
                      <span className="font-semibold text-[#0f1b33] text-sm">
                        {isAr
                          ? "شركة محمد بن عبد الرحمن القاسم العقارية"
                          : "Mohammed bin Abdulrahman Al-Qasim Real Estate Co."}
                      </span>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      <span className="text-xs text-gray-500 block mb-1">
                        {isAr ? "رقم السجل التجاري" : "Commercial Registration No."}
                      </span>
                      <span className="font-semibold text-[#0f1b33] text-sm" dir="ltr">
                        {crNumber || (isAr ? "يُحدّث من لوحة التحكم" : "Set from admin panel")}
                      </span>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      <span className="text-xs text-gray-500 block mb-1">
                        {isAr ? "رقم رخصة فال" : "Fal License No."}
                      </span>
                      <span className="font-semibold text-[#c8a45e] text-sm" dir="ltr">
                        {falNumber || (isAr ? "يُحدّث من لوحة التحكم" : "Set from admin panel")}
                      </span>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      <span className="text-xs text-gray-500 block mb-1">
                        {isAr ? "نوع الرخصة" : "License Type"}
                      </span>
                      <span className="font-semibold text-[#0f1b33] text-sm">
                        {isAr ? "وساطة وتسويق عقاري" : "Real Estate Brokerage & Marketing"}
                      </span>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      <span className="text-xs text-gray-500 block mb-1">
                        {isAr ? "حالة الرخصة" : "License Status"}
                      </span>
                      <span className="flex items-center gap-1.5 text-green-600 font-semibold text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        {isAr ? "سارية المفعول" : "Active"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* License Scope */}
                <div className="space-y-4">
                  <h3 className="font-bold text-[#0f1b33] text-lg flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-[#c8a45e]" />
                    {isAr ? "نطاق الترخيص" : "License Scope"}
                  </h3>

                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      <span className="text-xs text-gray-500 block mb-1">
                        {isAr ? "المنطقة" : "Region"}
                      </span>
                      <span className="font-semibold text-[#0f1b33] text-sm">
                        {isAr ? "منطقة الرياض" : "Riyadh Region"}
                      </span>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      <span className="text-xs text-gray-500 block mb-1">
                        {isAr ? "الأنشطة المرخصة" : "Licensed Activities"}
                      </span>
                      <div className="space-y-1.5 mt-1">
                        {(isAr ? [
                          "الوساطة العقارية",
                          "التسويق العقاري",
                          "إدارة الأملاك",
                          "التثمين العقاري",
                          "الاستشارات العقارية",
                        ] : [
                          "Real Estate Brokerage",
                          "Real Estate Marketing",
                          "Property Management",
                          "Real Estate Valuation",
                          "Real Estate Consulting",
                        ]).map((activity, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-[#0f1b33]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            {activity}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      <span className="text-xs text-gray-500 block mb-1">
                        {isAr ? "الجهة المانحة" : "Issuing Authority"}
                      </span>
                      <span className="font-semibold text-[#0f1b33] text-sm">
                        {isAr ? "الهيئة العامة للعقار (REGA)" : "General Authority for Real Estate (REGA)"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Regulatory Compliance */}
      <section className="py-12 bg-[#f8f5f0]">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-[#0f1b33] text-center mb-8">
              {isAr ? "الامتثال التنظيمي" : "Regulatory Compliance"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* REGA Compliance */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#c8a45e]/10 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-[#c8a45e]" />
                  </div>
                  <h3 className="font-bold text-[#0f1b33]">
                    {isAr ? "نظام الوساطة العقارية" : "Real Estate Brokerage Law"}
                  </h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {isAr
                    ? "نلتزم بجميع أحكام نظام الوساطة العقارية الصادر بالمرسوم الملكي رقم (م/130) وتاريخ 19/11/1443هـ، بما في ذلك:"
                    : "We comply with all provisions of the Real Estate Brokerage Law issued by Royal Decree No. (M/130) dated 19/11/1443H, including:"}
                </p>
                <ul className="space-y-2">
                  {(isAr ? [
                    "الحصول على ترخيص فال ساري المفعول.",
                    "توثيق جميع عقود الوساطة العقارية.",
                    "الإفصاح عن المعلومات الجوهرية للعقار.",
                    "الالتزام بأخلاقيات المهنة والنزاهة.",
                    "حفظ حقوق جميع أطراف الصفقة العقارية.",
                    "عدم الإعلان عن عقار دون تفويض من المالك.",
                  ] : [
                    "Maintaining a valid Fal license.",
                    "Documenting all real estate brokerage contracts.",
                    "Disclosing material information about properties.",
                    "Adhering to professional ethics and integrity.",
                    "Protecting the rights of all parties in real estate transactions.",
                    "Not advertising properties without owner authorization.",
                  ]).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Ejar Compliance */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#c8a45e]/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-[#c8a45e]" />
                  </div>
                  <h3 className="font-bold text-[#0f1b33]">
                    {isAr ? "منصة إيجار" : "Ejar Platform"}
                  </h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {isAr
                    ? "نلتزم بالتسجيل والعمل عبر منصة إيجار التابعة لوزارة الإسكان، بما يشمل:"
                    : "We are registered and operate through the Ejar platform under the Ministry of Housing, including:"}
                </p>
                <ul className="space-y-2">
                  {(isAr ? [
                    "تسجيل جميع عقود الإيجار عبر منصة إيجار.",
                    "توثيق العقود إلكترونياً لحماية حقوق المؤجر والمستأجر.",
                    "الالتزام بالعقد الموحد المعتمد من وزارة الإسكان.",
                    "تسجيل بيانات الوسيط العقاري في المنصة.",
                    "الامتثال لضوابط الإعلانات العقارية.",
                    "تقديم خدمات إدارة الأملاك وفق معايير إيجار.",
                  ] : [
                    "Registering all rental contracts through the Ejar platform.",
                    "Electronic documentation of contracts to protect landlord and tenant rights.",
                    "Compliance with the unified contract approved by the Ministry of Housing.",
                    "Registering real estate broker data on the platform.",
                    "Compliance with real estate advertising regulations.",
                    "Providing property management services per Ejar standards.",
                  ]).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* E-Commerce Compliance */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#c8a45e]/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-[#c8a45e]" />
                  </div>
                  <h3 className="font-bold text-[#0f1b33]">
                    {isAr ? "نظام التجارة الإلكترونية" : "E-Commerce Law"}
                  </h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {isAr
                    ? "يلتزم الموقع بأحكام نظام التجارة الإلكترونية، بما في ذلك:"
                    : "The website complies with the E-Commerce Law provisions, including:"}
                </p>
                <ul className="space-y-2">
                  {(isAr ? [
                    "الإفصاح عن هوية المنشأة وبيانات التواصل.",
                    "توفير سياسة خصوصية واضحة ومتاحة.",
                    "حماية بيانات المستخدمين الشخصية.",
                    "توفير آلية واضحة لتقديم الشكاوى.",
                    "الشفافية في عرض معلومات العقارات.",
                  ] : [
                    "Disclosing company identity and contact information.",
                    "Providing a clear and accessible privacy policy.",
                    "Protecting users' personal data.",
                    "Providing a clear mechanism for filing complaints.",
                    "Transparency in displaying property information.",
                  ]).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* VAT Compliance */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#c8a45e]/10 flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-[#c8a45e]" />
                  </div>
                  <h3 className="font-bold text-[#0f1b33]">
                    {isAr ? "الالتزامات الضريبية" : "Tax Compliance"}
                  </h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {isAr
                    ? "نلتزم بالأنظمة الضريبية المعمول بها في المملكة:"
                    : "We comply with applicable tax regulations in the Kingdom:"}
                </p>
                <ul className="space-y-2">
                  {(isAr ? [
                    "التسجيل في ضريبة القيمة المضافة (VAT 15%).",
                    "إصدار فواتير ضريبية إلكترونية معتمدة.",
                    "الامتثال لنظام ضريبة التصرفات العقارية (RETT 5%).",
                    "تقديم الإقرارات الضريبية في مواعيدها.",
                    "حفظ السجلات المالية وفق متطلبات هيئة الزكاة والضريبة.",
                  ] : [
                    "Registered for Value Added Tax (VAT 15%).",
                    "Issuing approved electronic tax invoices.",
                    "Compliance with Real Estate Transaction Tax (RETT 5%).",
                    "Filing tax returns on schedule.",
                    "Maintaining financial records per ZATCA requirements.",
                  ]).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Consumer Rights */}
      <section className="py-12">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-[#0f1b33] text-center mb-8">
              {isAr ? "حقوق العملاء" : "Client Rights"}
            </h2>

            <div className="bg-[#f8f5f0] rounded-2xl p-6 md:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(isAr ? [
                  { icon: CheckCircle2, text: "الحق في الحصول على معلومات دقيقة وشفافة عن العقارات المعروضة." },
                  { icon: CheckCircle2, text: "الحق في الاطلاع على رخصة الوسيط العقاري قبل التعامل." },
                  { icon: CheckCircle2, text: "الحق في الحصول على عقد وساطة موثق ومكتوب." },
                  { icon: CheckCircle2, text: "الحق في معرفة عمولة الوساطة مسبقاً وبشكل واضح." },
                  { icon: CheckCircle2, text: "الحق في تقديم شكوى للهيئة العامة للعقار في حال وجود مخالفة." },
                  { icon: CheckCircle2, text: "الحق في حماية بياناتك الشخصية وعدم مشاركتها دون إذن." },
                  { icon: CheckCircle2, text: "الحق في الانسحاب من الصفقة وفق الشروط المتفق عليها." },
                  { icon: CheckCircle2, text: "الحق في الحصول على إيصال بأي مبالغ مدفوعة." },
                ] : [
                  { icon: CheckCircle2, text: "Right to receive accurate and transparent information about listed properties." },
                  { icon: CheckCircle2, text: "Right to verify the real estate broker's license before dealing." },
                  { icon: CheckCircle2, text: "Right to receive a documented and written brokerage contract." },
                  { icon: CheckCircle2, text: "Right to know the brokerage commission in advance and clearly." },
                  { icon: CheckCircle2, text: "Right to file a complaint with REGA in case of violations." },
                  { icon: CheckCircle2, text: "Right to protection of personal data without unauthorized sharing." },
                  { icon: CheckCircle2, text: "Right to withdraw from the transaction per agreed terms." },
                  { icon: CheckCircle2, text: "Right to receive a receipt for any amounts paid." },
                ]).map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-3">
                    <item.icon className="w-5 h-5 text-[#c8a45e] mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-6"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-amber-800 mb-2">
                  {isAr ? "إخلاء مسؤولية" : "Disclaimer"}
                </h3>
                <p className="text-amber-700 text-sm leading-relaxed">
                  {isAr
                    ? "المعلومات المعروضة على هذا الموقع هي لأغراض إعلامية وتسويقية فقط ولا تشكل عرضاً ملزماً أو ضماناً. تخضع جميع الصفقات العقارية للعقود الرسمية الموقعة بين الأطراف. تحتفظ الشركة بحق تعديل الأسعار والمواصفات دون إشعار مسبق. يُنصح بالتحقق من جميع المعلومات بشكل مستقل قبل اتخاذ أي قرار استثماري."
                    : "Information displayed on this website is for informational and marketing purposes only and does not constitute a binding offer or guarantee. All real estate transactions are subject to official contracts signed between the parties. The company reserves the right to modify prices and specifications without prior notice. Independent verification of all information is recommended before making any investment decision."}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Verification & Contact */}
      <section className="py-12">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-[#0f1b33] text-white rounded-2xl p-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold mb-2">
                {isAr ? "التحقق من الترخيص" : "License Verification"}
              </h2>
              <p className="text-white/60 text-sm">
                {isAr
                  ? "يمكنك التحقق من ترخيص الشركة عبر الجهات الرسمية التالية:"
                  : "You can verify the company's license through the following official channels:"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <a
                href="https://rega.gov.sa"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-white/15 rounded-xl p-4 text-center transition-colors"
              >
                <Shield className="w-8 h-8 text-[#c8a45e] mx-auto mb-2" />
                <span className="text-sm font-semibold block">
                  {isAr ? "الهيئة العامة للعقار" : "REGA"}
                </span>
                <span className="text-xs text-white/50">rega.gov.sa</span>
              </a>
              <a
                href="https://ejar.sa"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-white/15 rounded-xl p-4 text-center transition-colors"
              >
                <BookOpen className="w-8 h-8 text-[#c8a45e] mx-auto mb-2" />
                <span className="text-sm font-semibold block">
                  {isAr ? "منصة إيجار" : "Ejar Platform"}
                </span>
                <span className="text-xs text-white/50">ejar.sa</span>
              </a>
              <a
                href="https://mc.gov.sa"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-white/15 rounded-xl p-4 text-center transition-colors"
              >
                <Building2 className="w-8 h-8 text-[#c8a45e] mx-auto mb-2" />
                <span className="text-sm font-semibold block">
                  {isAr ? "وزارة التجارة" : "Ministry of Commerce"}
                </span>
                <span className="text-xs text-white/50">mc.gov.sa</span>
              </a>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-center font-bold mb-4">
                {isAr ? "تواصل معنا" : "Contact Us"}
              </h3>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="tel:920001911" className="flex items-center gap-2 bg-[#c8a45e] text-[#0f1b33] px-6 py-3 rounded-lg font-semibold hover:bg-[#b8944e] transition-colors">
                  <Phone className="w-4 h-4" />
                  <span dir="ltr">920001911</span>
                </a>
                <a href="mailto:info@alqasem.com.sa" className="flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors">
                  <Mail className="w-4 h-4" />
                  info@alqasem.com.sa
                </a>
              </div>
              <p className="text-center text-white/40 text-xs mt-4 flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3" />
                {isAr ? "الرياض، المملكة العربية السعودية" : "Riyadh, Saudi Arabia"}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
