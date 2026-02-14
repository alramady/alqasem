import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, FileText, Mail, Phone } from "lucide-react";

export default function PrivacyPolicy() {
  const { isAr } = useLanguage();

  const sections = isAr ? [
    {
      icon: FileText,
      title: "مقدمة",
      content: "تلتزم شركة محمد بن عبد الرحمن القاسم العقارية (\"القاسم العقارية\") بحماية خصوصية مستخدمي موقعها الإلكتروني. توضح هذه السياسة كيفية جمع واستخدام وحماية بياناتك الشخصية وفقاً لنظام حماية البيانات الشخصية في المملكة العربية السعودية.",
    },
    {
      icon: Eye,
      title: "البيانات التي نجمعها",
      content: `نجمع البيانات التالية عند استخدامك للموقع:
• الاسم الكامل ورقم الجوال والبريد الإلكتروني عند تعبئة نماذج التواصل أو طلب العقارات.
• بيانات التصفح (عنوان IP، نوع المتصفح، الصفحات المزارة) لأغراض تحسين الأداء والتحليل.
• بيانات الموقع الجغرافي عند استخدام خرائط Google لعرض مواقع العقارات (بموافقتك).
• بيانات الاشتراك في النشرة البريدية (البريد الإلكتروني والاسم).
• ملفات تعريف الارتباط (Cookies) لتحسين تجربة التصفح وتذكّر تفضيلاتك (اللغة، المفضلة).`,
    },
    {
      icon: Lock,
      title: "كيف نستخدم بياناتك",
      content: `نستخدم بياناتك للأغراض التالية فقط:
• الرد على استفساراتك وطلباتك العقارية.
• إرسال تحديثات عن العقارات والمشاريع التي تهمك (بموافقتك).
• تحسين خدماتنا وتجربة المستخدم على الموقع.
• الامتثال للمتطلبات القانونية والتنظيمية.
• إرسال النشرة البريدية (في حال اشتراكك).
لا نبيع أو نشارك بياناتك مع أطراف ثالثة لأغراض تسويقية دون موافقتك الصريحة.`,
    },
    {
      icon: Shield,
      title: "حماية البيانات",
      content: `نتخذ إجراءات أمنية صارمة لحماية بياناتك:
• تشفير البيانات أثناء النقل باستخدام بروتوكول SSL/TLS.
• تشفير كلمات المرور باستخدام خوارزمية bcrypt.
• حماية من هجمات SQL Injection وXSS وCSRF.
• تقييد الوصول إلى البيانات للموظفين المخولين فقط.
• مراجعة دورية لإجراءات الأمان.`,
    },
    {
      title: "خرائط Google والخدمات الخارجية",
      icon: Eye,
      content: "يستخدم الموقع خرائط Google لعرض مواقع العقارات. عند استخدام الخرائط، تخضع لسياسة خصوصية Google. كما نستخدم خدمة تحليلات لفهم كيفية استخدام الموقع (بدون جمع بيانات شخصية محددة). لا نستخدم ملفات تعريف ارتباط إعلانية من أطراف ثالثة.",
    },
    {
      title: "حقوقك",
      icon: FileText,
      content: `لديك الحقوق التالية وفقاً لنظام حماية البيانات الشخصية:
• الحق في الوصول إلى بياناتك الشخصية المحفوظة لدينا.
• الحق في تصحيح أو تحديث بياناتك.
• الحق في حذف بياناتك (ما لم تكن مطلوبة قانونياً).
• الحق في سحب موافقتك على معالجة البيانات.
• الحق في تقديم شكوى للجهة المختصة.
لممارسة أي من هذه الحقوق، تواصل معنا عبر البريد الإلكتروني أو الهاتف.`,
    },
    {
      title: "الاحتفاظ بالبيانات",
      icon: Lock,
      content: "نحتفظ ببياناتك الشخصية طالما كانت ضرورية للأغراض التي جُمعت من أجلها، أو حسب ما يقتضيه القانون. بيانات الاستفسارات تُحفظ لمدة سنتين. بيانات النشرة البريدية تُحفظ حتى إلغاء الاشتراك.",
    },
    {
      title: "تحديث السياسة",
      icon: FileText,
      content: "قد نقوم بتحديث هذه السياسة من وقت لآخر. سيتم نشر أي تغييرات على هذه الصفحة مع تاريخ آخر تحديث. ننصحك بمراجعة هذه السياسة بشكل دوري.",
    },
  ] : [
    {
      icon: FileText,
      title: "Introduction",
      content: "Mohammed bin Abdulrahman Al-Qasim Real Estate Company (\"Al-Qasim Real Estate\") is committed to protecting the privacy of its website users. This policy explains how we collect, use, and protect your personal data in accordance with the Saudi Personal Data Protection Law (PDPL).",
    },
    {
      icon: Eye,
      title: "Data We Collect",
      content: `We collect the following data when you use our website:
• Full name, phone number, and email when filling out contact or property request forms.
• Browsing data (IP address, browser type, pages visited) for performance improvement and analytics.
• Geolocation data when using Google Maps to view property locations (with your consent).
• Newsletter subscription data (email and name).
• Cookies to improve browsing experience and remember your preferences (language, favorites).`,
    },
    {
      icon: Lock,
      title: "How We Use Your Data",
      content: `We use your data for the following purposes only:
• Responding to your inquiries and property requests.
• Sending updates about properties and projects that interest you (with your consent).
• Improving our services and user experience on the website.
• Complying with legal and regulatory requirements.
• Sending newsletters (if you have subscribed).
We do not sell or share your data with third parties for marketing purposes without your explicit consent.`,
    },
    {
      icon: Shield,
      title: "Data Protection",
      content: `We implement strict security measures to protect your data:
• Data encryption during transmission using SSL/TLS protocol.
• Password encryption using bcrypt algorithm.
• Protection against SQL Injection, XSS, and CSRF attacks.
• Data access restricted to authorized personnel only.
• Regular security audits and reviews.`,
    },
    {
      title: "Google Maps & External Services",
      icon: Eye,
      content: "The website uses Google Maps to display property locations. When using maps, you are subject to Google's privacy policy. We also use analytics services to understand website usage (without collecting specific personal data). We do not use third-party advertising cookies.",
    },
    {
      title: "Your Rights",
      icon: FileText,
      content: `You have the following rights under the Personal Data Protection Law:
• Right to access your personal data stored with us.
• Right to correct or update your data.
• Right to delete your data (unless legally required).
• Right to withdraw consent for data processing.
• Right to file a complaint with the relevant authority.
To exercise any of these rights, contact us via email or phone.`,
    },
    {
      title: "Data Retention",
      icon: Lock,
      content: "We retain your personal data for as long as necessary for the purposes for which it was collected, or as required by law. Inquiry data is kept for two years. Newsletter data is kept until unsubscription.",
    },
    {
      title: "Policy Updates",
      icon: FileText,
      content: "We may update this policy from time to time. Any changes will be posted on this page with the date of the last update. We recommend reviewing this policy periodically.",
    },
  ];

  const contactInfo = {
    email: "info@alqasimrealestate.com",
    phone: "+966 11 XXX XXXX",
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#0f1b33] to-[#1a2b4a] text-white py-20 pt-28">
        <div className="container max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Shield className="w-16 h-16 mx-auto mb-6 text-[#c8a45e]" />
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
            </h1>
            <p className="text-white/70 text-lg">
              {isAr
                ? "نلتزم بحماية بياناتك الشخصية وفقاً لنظام حماية البيانات الشخصية في المملكة العربية السعودية"
                : "We are committed to protecting your personal data in accordance with Saudi Arabia's Personal Data Protection Law"}
            </p>
            <p className="text-white/50 text-sm mt-4">
              {isAr ? "آخر تحديث: فبراير 2026" : "Last updated: February 2026"}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container max-w-4xl">
          <div className="space-y-8">
            {sections.map((section, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#f8f5f0] rounded-2xl p-6 md:p-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#c8a45e]/10 flex items-center justify-center shrink-0">
                    <section.icon className="w-5 h-5 text-[#c8a45e]" />
                  </div>
                  <h2 className="text-xl font-bold text-[#0f1b33]">{section.title}</h2>
                </div>
                <div className="text-gray-700 leading-relaxed whitespace-pre-line text-sm md:text-base">
                  {section.content}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact for Privacy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 bg-[#0f1b33] text-white rounded-2xl p-8 text-center"
          >
            <h2 className="text-xl font-bold mb-4">
              {isAr ? "للتواصل بخصوص الخصوصية" : "Privacy Contact"}
            </h2>
            <p className="text-white/70 mb-6">
              {isAr
                ? "لأي استفسارات تتعلق بخصوصية بياناتك، تواصل معنا:"
                : "For any inquiries regarding your data privacy, contact us:"}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-2 bg-[#c8a45e] text-[#0f1b33] px-6 py-3 rounded-lg font-semibold hover:bg-[#b8944e] transition-colors">
                <Mail className="w-4 h-4" />
                {contactInfo.email}
              </a>
              <a href={`tel:${contactInfo.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors">
                <Phone className="w-4 h-4" />
                <span dir="ltr">{contactInfo.phone}</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
