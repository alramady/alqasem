import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, FileText, Mail, Phone, Database, Trash2, UserCheck, Scale, Clock, Globe, AlertTriangle } from "lucide-react";

export default function PrivacyPolicy() {
  const { isAr } = useLanguage();

  const sectionsAr = [
    {
      icon: FileText,
      title: "١. مقدمة وإطار قانوني",
      content: `تلتزم شركة محمد بن عبد الرحمن القاسم العقارية ("القاسم العقارية"، السجل التجاري رقم: 1010XXXXXX) بحماية خصوصية مستخدمي موقعها الإلكتروني وتطبيقاتها الرقمية.

تم إعداد هذه السياسة وفقاً لـ:
• نظام حماية البيانات الشخصية الصادر بالمرسوم الملكي رقم (م/19) وتاريخ 9/2/1443هـ (الموافق 16 سبتمبر 2021م).
• اللائحة التنفيذية لنظام حماية البيانات الشخصية.
• نظام التجارة الإلكترونية الصادر بالمرسوم الملكي رقم (م/126) وتاريخ 7/11/1440هـ.
• أنظمة الهيئة العامة للعقار (إيجار) والأنظمة العقارية ذات الصلة.

يُعتبر استخدامك للموقع موافقة صريحة على شروط هذه السياسة. في حال عدم موافقتك، يرجى التوقف عن استخدام الموقع.`,
    },
    {
      icon: Eye,
      title: "٢. الغرض من جمع البيانات الشخصية (المادة ١٢ - البند ١)",
      content: `نجمع بياناتك الشخصية للأغراض المحددة التالية فقط:
• تقديم خدمات الوساطة العقارية والتسويق العقاري.
• معالجة طلبات البيع والشراء والإيجار.
• الرد على استفساراتك وطلباتك عبر نماذج التواصل.
• إرسال إشعارات عن العقارات والمشاريع المطابقة لتفضيلاتك (بموافقتك المسبقة).
• إرسال النشرة البريدية (في حال اشتراكك الطوعي).
• تحسين جودة الخدمات وتجربة المستخدم.
• الامتثال للمتطلبات القانونية والتنظيمية في المملكة العربية السعودية.
• إعداد التقارير والإحصاءات الداخلية (بشكل مجهول الهوية).

لا نستخدم بياناتك لأي غرض آخر غير المذكور أعلاه دون الحصول على موافقتك المسبقة.`,
    },
    {
      icon: Database,
      title: "٣. محتوى البيانات الشخصية المجمعة (المادة ١٢ - البند ٢)",
      content: `نجمع الأنواع التالية من البيانات الشخصية:

بيانات التعريف الشخصية:
• الاسم الكامل (ثلاثي أو رباعي).
• رقم الجوال (بصيغة 05XXXXXXXX).
• البريد الإلكتروني.
• المدينة والحي (عند تقديم طلب عقاري).

بيانات الحساب (للمستخدمين المسجلين):
• اسم المستخدم وكلمة المرور (مشفرة بخوارزمية bcrypt).
• صورة الملف الشخصي (اختيارية).
• سجل المفضلات والمقارنات.

بيانات التصفح والاستخدام:
• عنوان بروتوكول الإنترنت (IP Address).
• نوع المتصفح ونظام التشغيل.
• الصفحات المزارة ومدة الزيارة.
• ملفات تعريف الارتباط (Cookies) لتفضيلات اللغة والمفضلات.

بيانات الموقع الجغرافي:
• بيانات الموقع عند استخدام خرائط Google (بموافقتك الصريحة فقط).

لا نجمع بيانات حساسة مثل: الهوية الوطنية، البيانات المالية أو البنكية، البيانات الصحية، أو المعتقدات الدينية.`,
    },
    {
      icon: Globe,
      title: "٤. طريقة جمع البيانات الشخصية (المادة ١٢ - البند ٣)",
      content: `نجمع بياناتك من خلال الوسائل التالية:

الجمع المباشر (بمعرفتك وموافقتك):
• نماذج التواصل والاستفسارات على الموقع.
• نموذج "أضف عقارك" لإدراج العقارات.
• نموذج "اطلب عقارك" لطلب عقار محدد.
• نموذج الاشتراك في النشرة البريدية.
• إنشاء حساب مستخدم على المنصة.
• التواصل عبر البريد الإلكتروني أو الهاتف.

الجمع التلقائي (أثناء التصفح):
• ملفات تعريف الارتباط (Cookies) الضرورية لعمل الموقع.
• بيانات التصفح والتحليلات (بشكل مجهول الهوية).
• بيانات الجهاز والمتصفح لأغراض الأمان.

لا نجمع بيانات من أطراف ثالثة أو وسائل التواصل الاجتماعي دون علمك.`,
    },
    {
      icon: Lock,
      title: "٥. وسيلة حفظ البيانات الشخصية (المادة ١٢ - البند ٤)",
      content: `نحفظ بياناتك الشخصية باستخدام الوسائل التالية:

التخزين الآمن:
• قواعد بيانات مشفرة مستضافة على خوادم آمنة (Railway Cloud Infrastructure).
• تخزين الملفات والصور على خدمة Amazon S3 مع تشفير AES-256.
• كلمات المرور مشفرة بخوارزمية bcrypt (لا تُخزن كنص صريح أبداً).

إجراءات الحماية التقنية:
• تشفير البيانات أثناء النقل باستخدام بروتوكول SSL/TLS (HTTPS).
• حماية من هجمات حقن SQL (SQL Injection).
• حماية من هجمات البرمجة عبر المواقع (XSS) باستخدام DOMPurify.
• حماية من هجمات تزوير الطلبات (CSRF) بنظام رموز CSRF.
• تحديد معدل الطلبات (Rate Limiting) لمنع الإساءة.
• المصادقة الثنائية (2FA/TOTP) لحسابات الإدارة.
• جلسات آمنة مع JWT وانتهاء صلاحية تلقائي.

إجراءات الحماية الإدارية:
• تقييد الوصول إلى البيانات للموظفين المخولين فقط (نظام صلاحيات متعدد المستويات).
• سجل مراجعة (Audit Log) لجميع العمليات على البيانات.
• مراجعة أمنية دورية للأنظمة والإجراءات.

لا يتم نقل البيانات خارج المملكة العربية السعودية إلا وفقاً للضوابط المنصوص عليها في نظام حماية البيانات الشخصية.`,
    },
    {
      icon: Shield,
      title: "٦. كيفية معالجة البيانات الشخصية (المادة ١٢ - البند ٥)",
      content: `تتم معالجة بياناتك الشخصية وفق الآليات التالية:

أساس المعالجة القانوني:
• الموافقة الصريحة: لإرسال النشرة البريدية والإشعارات التسويقية.
• تنفيذ العقد: لمعالجة طلبات البيع والشراء والإيجار.
• المصلحة المشروعة: لتحسين الخدمات وضمان أمان الموقع.
• الالتزام القانوني: للامتثال للأنظمة السعودية.

عمليات المعالجة:
• تسجيل الاستفسارات وتوجيهها للقسم المختص.
• مطابقة طلبات العملاء مع العقارات المتاحة.
• إرسال إشعارات البريد الإلكتروني (استفسارات، تحديثات، نشرة بريدية).
• إعداد تقارير إحصائية مجهولة الهوية.
• تتبع عدد مشاهدات العقارات (بشكل مجمّع).

لا نقوم بـ:
• اتخاذ قرارات آلية تؤثر عليك دون تدخل بشري.
• بيع أو تأجير بياناتك لأطراف ثالثة.
• استخدام بياناتك لأغراض التنميط أو الإعلانات المستهدفة من أطراف ثالثة.`,
    },
    {
      icon: Trash2,
      title: "٧. كيفية إتلاف البيانات الشخصية (المادة ١٢ - البند ٦)",
      content: `نلتزم بإتلاف بياناتك الشخصية وفق الضوابط التالية:

فترات الاحتفاظ:
• بيانات الاستفسارات: سنتان (2) من تاريخ الاستفسار.
• بيانات الحسابات: حتى طلب الحذف أو بعد سنة من آخر نشاط.
• بيانات النشرة البريدية: حتى إلغاء الاشتراك.
• سجلات التصفح والتحليلات: ستة (6) أشهر.
• سجلات المراجعة الأمنية: سنة واحدة (1).
• بيانات رموز OTP: تُحذف فوراً بعد الاستخدام أو انتهاء الصلاحية.

طريقة الإتلاف:
• الحذف الآمن من قواعد البيانات مع الكتابة فوق البيانات.
• حذف الملفات من خوادم التخزين السحابي.
• تسجيل عملية الإتلاف في سجل المراجعة.

يمكنك طلب إتلاف بياناتك في أي وقت عبر التواصل معنا (ما لم يكن الاحتفاظ بها مطلوباً قانونياً).`,
    },
    {
      icon: UserCheck,
      title: "٨. حقوق صاحب البيانات الشخصية (المادة ١٢ - البند ٧)",
      content: `يكفل لك نظام حماية البيانات الشخصية الحقوق التالية:

• حق الإعلام: الحق في معرفة الأساس النظامي لجمع بياناتك والغرض منه.
• حق الوصول: الحق في الاطلاع على بياناتك الشخصية المحفوظة لدينا والحصول على نسخة منها.
• حق التصحيح: الحق في طلب تصحيح أو تحديث أو إكمال بياناتك الشخصية.
• حق الحذف: الحق في طلب إتلاف بياناتك الشخصية (ما لم يكن الاحتفاظ بها مطلوباً نظاماً).
• حق سحب الموافقة: الحق في سحب موافقتك على معالجة بياناتك في أي وقت.
• حق الاعتراض: الحق في الاعتراض على معالجة بياناتك في حالات محددة.
• حق نقل البيانات: الحق في طلب نقل بياناتك إلى جهة أخرى بصيغة مقروءة آلياً.
• حق تقديم الشكوى: الحق في تقديم شكوى إلى الجهة المختصة (الهيئة السعودية للبيانات والذكاء الاصطناعي - سدايا).`,
    },
    {
      icon: Scale,
      title: "٩. كيفية ممارسة الحقوق (المادة ١٢ - البند ٨)",
      content: `لممارسة أي من حقوقك المذكورة أعلاه:

طرق التواصل:
• البريد الإلكتروني: privacy@alqasem.com.sa أو info@alqasem.com.sa
• الهاتف: 920001911
• نموذج التواصل على الموقع: alqasem.com.sa/contact
• زيارة المقر الرئيسي: الرياض، المملكة العربية السعودية.

إجراءات الاستجابة:
• سنتحقق من هويتك قبل معالجة طلبك.
• سنرد على طلبك خلال ثلاثين (30) يوماً كحد أقصى من تاريخ استلامه.
• في حال رفض الطلب، سنوضح الأسباب النظامية للرفض.
• يحق لك التظلم لدى الجهة المختصة في حال عدم رضاك عن الرد.

للشكاوى المتعلقة بحماية البيانات الشخصية:
الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا)
الموقع: sdaia.gov.sa`,
    },
    {
      icon: Globe,
      title: "١٠. خدمات الأطراف الثالثة",
      content: `يستخدم الموقع الخدمات التالية من أطراف ثالثة:

• خرائط Google: لعرض مواقع العقارات على الخريطة. تخضع لسياسة خصوصية Google (policies.google.com/privacy).
• خدمة التحليلات: لفهم أنماط استخدام الموقع بشكل مجمّع ومجهول الهوية.
• خدمة البريد الإلكتروني (SMTP): لإرسال الإشعارات ورسائل إعادة تعيين كلمة المرور.
• خدمة التخزين السحابي (Amazon S3): لتخزين صور العقارات والمشاريع.

لا نشارك بياناتك الشخصية مع هذه الخدمات إلا بالقدر الضروري لتشغيل الموقع. ننصحك بمراجعة سياسات الخصوصية الخاصة بكل خدمة.

لا نستخدم:
• ملفات تعريف ارتباط إعلانية من أطراف ثالثة.
• أدوات تتبع عبر المواقع (Cross-site tracking).
• خدمات إعادة الاستهداف الإعلاني (Retargeting).`,
    },
    {
      icon: AlertTriangle,
      title: "١١. ملفات تعريف الارتباط (Cookies)",
      content: `يستخدم الموقع ملفات تعريف الارتباط التالية:

ملفات ضرورية (لا يمكن تعطيلها):
• ملف الجلسة (Session Cookie): للحفاظ على تسجيل الدخول.
• ملف CSRF Token: لحماية النماذج من التزوير.

ملفات وظيفية (يمكن تعطيلها):
• تفضيل اللغة (العربية/الإنجليزية).
• قائمة المفضلات (localStorage).
• تفضيلات المقارنة (localStorage).

لا نستخدم ملفات تعريف ارتباط تسويقية أو إعلانية. يمكنك التحكم في ملفات تعريف الارتباط من إعدادات متصفحك.`,
    },
    {
      icon: Clock,
      title: "١٢. تحديث السياسة",
      content: `قد نقوم بتحديث هذه السياسة من وقت لآخر لتعكس التغييرات في ممارساتنا أو المتطلبات القانونية.

• سيتم نشر أي تغييرات على هذه الصفحة مع تاريخ آخر تحديث.
• في حال إجراء تغييرات جوهرية، سنخطرك عبر البريد الإلكتروني (إذا كنت مسجلاً) أو عبر إشعار بارز على الموقع.
• استمرارك في استخدام الموقع بعد نشر التحديثات يعني موافقتك على السياسة المحدّثة.

ننصحك بمراجعة هذه السياسة بشكل دوري.

تاريخ السريان: فبراير 2026
آخر تحديث: فبراير 2026
الإصدار: 2.0`,
    },
  ];

  const sectionsEn = [
    {
      icon: FileText,
      title: "1. Introduction & Legal Framework",
      content: `Mohammed bin Abdulrahman Al-Qasim Real Estate Company ("Al-Qasim Real Estate", CR No: 1010XXXXXX) is committed to protecting the privacy of its website users and digital applications.

This policy has been prepared in accordance with:
• The Personal Data Protection Law (PDPL) issued by Royal Decree No. (M/19) dated 9/2/1443H (September 16, 2021).
• The Executive Regulations of the Personal Data Protection Law.
• The E-Commerce Law issued by Royal Decree No. (M/126) dated 7/11/1440H.
• The General Authority for Real Estate (Ejar) regulations and related real estate laws.

Your use of the website constitutes explicit consent to the terms of this policy. If you do not agree, please discontinue use of the website.`,
    },
    {
      icon: Eye,
      title: "2. Purpose of Collecting Personal Data (Article 12 - Clause 1)",
      content: `We collect your personal data for the following specific purposes only:
• Providing real estate brokerage and marketing services.
• Processing sale, purchase, and rental requests.
• Responding to your inquiries and requests through contact forms.
• Sending notifications about properties and projects matching your preferences (with your prior consent).
• Sending newsletters (if you voluntarily subscribe).
• Improving service quality and user experience.
• Complying with legal and regulatory requirements in Saudi Arabia.
• Preparing internal reports and statistics (in anonymized form).

We do not use your data for any purpose other than those mentioned above without obtaining your prior consent.`,
    },
    {
      icon: Database,
      title: "3. Content of Personal Data Collected (Article 12 - Clause 2)",
      content: `We collect the following types of personal data:

Personal Identification Data:
• Full name (three or four parts).
• Mobile number (in 05XXXXXXXX format).
• Email address.
• City and district (when submitting a property request).

Account Data (for registered users):
• Username and password (encrypted with bcrypt algorithm).
• Profile picture (optional).
• Favorites and comparison history.

Browsing and Usage Data:
• Internet Protocol address (IP Address).
• Browser type and operating system.
• Pages visited and visit duration.
• Cookies for language preferences and favorites.

Geolocation Data:
• Location data when using Google Maps (with your explicit consent only).

We do not collect sensitive data such as: national ID, financial or banking data, health data, or religious beliefs.`,
    },
    {
      icon: Globe,
      title: "4. Method of Collecting Personal Data (Article 12 - Clause 3)",
      content: `We collect your data through the following means:

Direct Collection (with your knowledge and consent):
• Contact and inquiry forms on the website.
• "Add Your Property" form for property listing.
• "Request a Property" form for specific property requests.
• Newsletter subscription form.
• User account registration on the platform.
• Communication via email or phone.

Automatic Collection (during browsing):
• Essential cookies required for website functionality.
• Browsing data and analytics (in anonymized form).
• Device and browser data for security purposes.

We do not collect data from third parties or social media without your knowledge.`,
    },
    {
      icon: Lock,
      title: "5. Means of Storing Personal Data (Article 12 - Clause 4)",
      content: `We store your personal data using the following means:

Secure Storage:
• Encrypted databases hosted on secure servers (Railway Cloud Infrastructure).
• File and image storage on Amazon S3 with AES-256 encryption.
• Passwords encrypted with bcrypt algorithm (never stored as plain text).

Technical Protection Measures:
• Data encryption during transmission using SSL/TLS protocol (HTTPS).
• Protection against SQL Injection attacks.
• Protection against Cross-Site Scripting (XSS) using DOMPurify.
• Protection against Cross-Site Request Forgery (CSRF) with CSRF token system.
• Rate Limiting to prevent abuse.
• Two-Factor Authentication (2FA/TOTP) for administrative accounts.
• Secure sessions with JWT and automatic expiration.

Administrative Protection Measures:
• Data access restricted to authorized personnel only (multi-level permission system).
• Audit Log for all data operations.
• Regular security audits of systems and procedures.

Data is not transferred outside Saudi Arabia except in accordance with the controls stipulated in the Personal Data Protection Law.`,
    },
    {
      icon: Shield,
      title: "6. How Personal Data is Processed (Article 12 - Clause 5)",
      content: `Your personal data is processed according to the following mechanisms:

Legal Basis for Processing:
• Explicit Consent: for sending newsletters and marketing notifications.
• Contract Performance: for processing sale, purchase, and rental requests.
• Legitimate Interest: for improving services and ensuring website security.
• Legal Obligation: for compliance with Saudi regulations.

Processing Operations:
• Recording inquiries and routing them to the relevant department.
• Matching customer requests with available properties.
• Sending email notifications (inquiries, updates, newsletters).
• Preparing anonymized statistical reports.
• Tracking property view counts (in aggregate form).

We do not:
• Make automated decisions affecting you without human intervention.
• Sell or rent your data to third parties.
• Use your data for profiling or targeted advertising by third parties.`,
    },
    {
      icon: Trash2,
      title: "7. How Personal Data is Destroyed (Article 12 - Clause 6)",
      content: `We commit to destroying your personal data according to the following controls:

Retention Periods:
• Inquiry data: two (2) years from the date of inquiry.
• Account data: until deletion request or one year after last activity.
• Newsletter data: until unsubscription.
• Browsing and analytics logs: six (6) months.
• Security audit logs: one (1) year.
• OTP code data: deleted immediately after use or expiration.

Destruction Method:
• Secure deletion from databases with data overwriting.
• File deletion from cloud storage servers.
• Recording the destruction process in the audit log.

You may request destruction of your data at any time by contacting us (unless retention is legally required).`,
    },
    {
      icon: UserCheck,
      title: "8. Rights of the Personal Data Owner (Article 12 - Clause 7)",
      content: `The Personal Data Protection Law guarantees you the following rights:

• Right to Information: The right to know the legal basis for collecting your data and its purpose.
• Right of Access: The right to view your personal data stored with us and obtain a copy.
• Right to Rectification: The right to request correction, update, or completion of your personal data.
• Right to Erasure: The right to request destruction of your personal data (unless retention is legally required).
• Right to Withdraw Consent: The right to withdraw your consent to data processing at any time.
• Right to Object: The right to object to processing of your data in specific cases.
• Right to Data Portability: The right to request transfer of your data to another entity in machine-readable format.
• Right to Complain: The right to file a complaint with the competent authority (Saudi Data & AI Authority - SDAIA).`,
    },
    {
      icon: Scale,
      title: "9. How to Exercise Rights (Article 12 - Clause 8)",
      content: `To exercise any of the above rights:

Contact Methods:
• Email: privacy@alqasem.com.sa or info@alqasem.com.sa
• Phone: 920001911
• Website contact form: alqasem.com.sa/contact
• Visit headquarters: Riyadh, Saudi Arabia.

Response Procedures:
• We will verify your identity before processing your request.
• We will respond to your request within thirty (30) days maximum from the date of receipt.
• If the request is rejected, we will explain the legal reasons for rejection.
• You have the right to appeal to the competent authority if you are not satisfied with the response.

For complaints related to personal data protection:
Saudi Data & AI Authority (SDAIA)
Website: sdaia.gov.sa`,
    },
    {
      icon: Globe,
      title: "10. Third-Party Services",
      content: `The website uses the following third-party services:

• Google Maps: to display property locations on the map. Subject to Google's privacy policy (policies.google.com/privacy).
• Analytics Service: to understand website usage patterns in aggregate and anonymized form.
• Email Service (SMTP): to send notifications and password reset messages.
• Cloud Storage (Amazon S3): to store property and project images.

We do not share your personal data with these services except to the extent necessary for website operation. We recommend reviewing the privacy policies of each service.

We do not use:
• Third-party advertising cookies.
• Cross-site tracking tools.
• Retargeting advertising services.`,
    },
    {
      icon: AlertTriangle,
      title: "11. Cookies",
      content: `The website uses the following cookies:

Essential Cookies (cannot be disabled):
• Session Cookie: to maintain login state.
• CSRF Token: to protect forms from forgery.

Functional Cookies (can be disabled):
• Language preference (Arabic/English).
• Favorites list (localStorage).
• Comparison preferences (localStorage).

We do not use marketing or advertising cookies. You can control cookies through your browser settings.`,
    },
    {
      icon: Clock,
      title: "12. Policy Updates",
      content: `We may update this policy from time to time to reflect changes in our practices or legal requirements.

• Any changes will be posted on this page with the date of the last update.
• In case of material changes, we will notify you via email (if registered) or through a prominent notice on the website.
• Your continued use of the website after posting updates constitutes your consent to the updated policy.

We recommend reviewing this policy periodically.

Effective Date: February 2026
Last Updated: February 2026
Version: 2.0`,
    },
  ];

  const sections = isAr ? sectionsAr : sectionsEn;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#0f1b33] to-[#1a2b4a] text-white py-20 pt-28">
        <div className="container max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Shield className="w-16 h-16 mx-auto mb-6 text-[#c8a45e]" />
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {isAr ? "سياسة الخصوصية وحماية البيانات الشخصية" : "Privacy Policy & Personal Data Protection"}
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              {isAr
                ? "وفقاً لنظام حماية البيانات الشخصية الصادر بالمرسوم الملكي رقم (م/19) وتاريخ 9/2/1443هـ"
                : "In accordance with the Personal Data Protection Law issued by Royal Decree No. (M/19) dated 9/2/1443H"}
            </p>
            <div className="flex items-center justify-center gap-4 mt-6">
              <span className="bg-[#c8a45e]/20 text-[#c8a45e] px-4 py-1.5 rounded-full text-sm font-medium">
                {isAr ? "الإصدار 2.0" : "Version 2.0"}
              </span>
              <span className="bg-white/10 text-white/60 px-4 py-1.5 rounded-full text-sm">
                {isAr ? "آخر تحديث: فبراير 2026" : "Last Updated: February 2026"}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PDPL Compliance Banner */}
      <section className="bg-[#f8f5f0] border-b border-[#c8a45e]/20">
        <div className="container max-w-4xl py-6">
          <div className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-[#0f1b33] text-sm">
                {isAr ? "متوافقة مع نظام حماية البيانات الشخصية السعودي (PDPL)" : "Compliant with Saudi Personal Data Protection Law (PDPL)"}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                {isAr
                  ? "تغطي هذه السياسة جميع البنود الثمانية للمادة ١٢ من نظام حماية البيانات الشخصية"
                  : "This policy covers all eight clauses of Article 12 of the Personal Data Protection Law"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="py-8 bg-[#f8f5f0]">
        <div className="container max-w-4xl">
          <details className="bg-white rounded-xl p-6 shadow-sm">
            <summary className="font-bold text-[#0f1b33] cursor-pointer text-lg">
              {isAr ? "فهرس المحتويات" : "Table of Contents"}
            </summary>
            <nav className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sections.map((section, i) => (
                <a
                  key={i}
                  href={`#section-${i}`}
                  className="text-sm text-gray-600 hover:text-[#c8a45e] transition-colors py-1"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </details>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container max-w-4xl">
          <div className="space-y-6">
            {sections.map((section, i) => (
              <motion.div
                key={i}
                id={`section-${i}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                className="bg-[#f8f5f0] rounded-2xl p-6 md:p-8 scroll-mt-24"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#c8a45e]/10 flex items-center justify-center shrink-0">
                    <section.icon className="w-5 h-5 text-[#c8a45e]" />
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-[#0f1b33]">{section.title}</h2>
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
            <h2 className="text-xl font-bold mb-2">
              {isAr ? "مسؤول حماية البيانات الشخصية" : "Data Protection Officer"}
            </h2>
            <p className="text-white/70 mb-6">
              {isAr
                ? "لأي استفسارات تتعلق بخصوصية بياناتك أو لممارسة حقوقك، تواصل معنا:"
                : "For any inquiries regarding your data privacy or to exercise your rights, contact us:"}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="mailto:info@alqasem.com.sa" className="flex items-center gap-2 bg-[#c8a45e] text-[#0f1b33] px-6 py-3 rounded-lg font-semibold hover:bg-[#b8944e] transition-colors">
                <Mail className="w-4 h-4" />
                info@alqasem.com.sa
              </a>
              <a href="tel:920001911" className="flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors">
                <Phone className="w-4 h-4" />
                <span dir="ltr">920001911</span>
              </a>
            </div>
            <p className="text-white/40 text-xs mt-6">
              {isAr
                ? "شركة محمد بن عبد الرحمن القاسم العقارية — الرياض، المملكة العربية السعودية"
                : "Mohammed bin Abdulrahman Al-Qasim Real Estate Company — Riyadh, Saudi Arabia"}
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
