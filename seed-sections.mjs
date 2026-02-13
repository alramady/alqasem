import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Update "about" section with full structured content
const aboutContent = JSON.stringify({
  description: "يقوم مبدأ العمل في شركة محمد بن عبد الرحمن القاسم العقارية على السمعة الطيبة والعلاقات الإيجابية مع العملاء من خلال ترسيخ مفهوم الصدق والنزاهة في العمل وتحقيق الوعود والتطلعات أياً كانت.",
  descriptionEn: "The work principle at Mohammed bin Abdulrahman Al-Qasim Real Estate is built on a good reputation and positive relationships with clients through establishing the concept of honesty and integrity in work and fulfilling promises and aspirations.",
  description2: "تتطلع شركة القاسم العقارية إلى أن تكون إحدى أكبر الشركات على المستوى المحلي والإقليمي وذلك بفضل الله ثم بتميزها وإبداعها في الخدمات العقارية.",
  description2En: "Al-Qasim Real Estate aspires to become one of the largest companies at the local and regional level, by the grace of God and through its excellence and creativity in real estate services.",
  highlights: [
    { value: "20+", labelAr: "سنة خبرة", labelEn: "Years Experience" },
    { value: "5+ مليار", valueEn: "5+ Billion", labelAr: "ريال قيمة سوقية", labelEn: "SAR Market Value" },
    { value: "1000+", labelAr: "وحدة مباعة", labelEn: "Units Sold" },
    { value: "16+", labelAr: "مشروع مكتمل", labelEn: "Completed Projects" }
  ],
  values: [
    {
      titleAr: "قصتنا", titleEn: "Our Story",
      textAr: "تفخر الشركة اليوم وبعد مضي ما يزيد عن 25 عاماً من العطاء بتوليها إدارة وتشغيل وتسويق العديد من العقارات التجارية والسكنية والتي تزيد إجمالي قيمتها السوقية عن مليار ريال سعودي.",
      textEn: "The company is proud today, after more than 25 years of dedication, to manage, operate, and market numerous commercial and residential properties with a total market value exceeding one billion Saudi Riyals."
    },
    {
      titleAr: "رسالتنا", titleEn: "Our Mission",
      textAr: "تقديم أرقى الخدمات العقارية بفكر ومنهج علمي من خلال منظومة عمل متكاملة مبنية على أسس وقواعد الاقتصاد الحديث وعن طريق نخبة من المستشارين والخبراء المختصين.",
      textEn: "Providing the finest real estate services with a scientific approach through an integrated work system built on modern economic principles and through an elite group of specialized consultants and experts."
    },
    {
      titleAr: "رؤيتنا", titleEn: "Our Vision",
      textAr: "الإبداع فيما نقدمه من خدمات عقارية، وفق معايير ذات جودة عالية ووضع بصمة متميزة في مشاريعنا لتكون معالم فريدة مرتبطة بنهجنا وأسلوبنا.",
      textEn: "Creativity in the real estate services we provide, according to high-quality standards, and leaving a distinctive mark on our projects to become unique landmarks associated with our approach and style."
    }
  ]
});

await conn.execute(
  'UPDATE homepage_sections SET content = ? WHERE sectionKey = ?',
  [aboutContent, 'about']
);
console.log('✅ Updated about section content');

// Update "services" section with full structured content
const servicesContent = JSON.stringify({
  services: [
    {
      titleAr: "إدارة الأملاك", titleEn: "Property Management",
      descriptionAr: "إدارة شاملة تتضمن الإشراف على صيانة العقار، تحصيل الإيجارات، والتواصل مع المستأجرين لرفع قيمة العقار وتعظيم العوائد.",
      descriptionEn: "Comprehensive management including property maintenance oversight, rent collection, and tenant communication to increase property value and maximize returns.",
      featuresAr: ["تحصيل الإيجارات", "الصيانة الدورية", "التقارير المالية", "إدارة العقود"],
      featuresEn: ["Rent Collection", "Regular Maintenance", "Financial Reports", "Contract Management"],
      color: "from-[#0f1b33] to-[#1a2d4d]"
    },
    {
      titleAr: "التسويق العقاري", titleEn: "Real Estate Marketing",
      descriptionAr: "تسويق العقار عبر القنوات الرقمية والمنصات العقارية وجذب المستأجرين والمشترين المناسبين في أسرع وقت ممكن.",
      descriptionEn: "Marketing properties through digital channels and real estate platforms, attracting suitable tenants and buyers in the shortest time possible.",
      featuresAr: ["تصوير احترافي", "منصات رقمية", "جولات افتراضية", "تقارير الأداء"],
      featuresEn: ["Professional Photography", "Digital Platforms", "Virtual Tours", "Performance Reports"],
      color: "from-[#E31E24] to-[#c91a1f]"
    },
    {
      titleAr: "الاستشارات العقارية", titleEn: "Real Estate Consulting",
      descriptionAr: "فرص استثمارية مدروسة بعناية مع تحليل شامل للعوائد والمخاطر في السوق العقاري السعودي وتقييم احترافي للعقارات.",
      descriptionEn: "Carefully studied investment opportunities with comprehensive analysis of returns and risks in the Saudi real estate market and professional property valuation.",
      featuresAr: ["تقييم العقارات", "دراسات الجدوى", "تحليل السوق", "الاستشارات القانونية"],
      featuresEn: ["Property Valuation", "Feasibility Studies", "Market Analysis", "Legal Consulting"],
      color: "from-[#c8a45e] to-[#a88a3e]"
    }
  ]
});

await conn.execute(
  'UPDATE homepage_sections SET content = ? WHERE sectionKey = ?',
  [servicesContent, 'services']
);
console.log('✅ Updated services section content');

// Update "partners" section with structured content
const partnersContent = JSON.stringify({
  partners: [
    { nameAr: "بنك ساب SABB", nameEn: "SABB Bank" },
    { nameAr: "زهران", nameEn: "Zahran" },
    { nameAr: "عيادات أجيل", nameEn: "Ajeel Clinics" },
    { nameAr: "بنقيث للسفر", nameEn: "Banqeeth Travel" },
    { nameAr: "برجرايزر", nameEn: "Burgerizer" },
    { nameAr: "مجموعة الفيصلية", nameEn: "Al-Faisaliah Group" },
    { nameAr: "شركة الراجحي", nameEn: "Al-Rajhi Co." },
    { nameAr: "مجموعة بن لادن", nameEn: "Bin Laden Group" }
  ]
});

await conn.execute(
  'UPDATE homepage_sections SET content = ? WHERE sectionKey = ?',
  [partnersContent, 'partners']
);
console.log('✅ Updated partners section content');

// Update "contact" section with structured content
const contactContent = JSON.stringify({
  descriptionAr: "سواء كنت تبحث عن عقار للشراء أو الإيجار، أو ترغب في إضافة عقارك أو طلب استشارة عقارية، فريقنا المتخصص جاهز لمساعدتك.",
  descriptionEn: "Whether you're looking to buy or rent a property, list your property, or request real estate consulting, our specialized team is ready to help."
});

await conn.execute(
  'UPDATE homepage_sections SET content = ? WHERE sectionKey = ?',
  [contactContent, 'contact']
);
console.log('✅ Updated contact section content');

// Add videos section if it doesn't exist
const [existingVideos] = await conn.execute(
  "SELECT id FROM homepage_sections WHERE sectionKey = 'videos'"
);
if (existingVideos.length === 0) {
  const videosContent = JSON.stringify({
    videos: [
      { titleAr: "جولة في منصة القاسم العقارية", titleEn: "Tour of Al-Qasim Platform", descAr: "تعرّف على الموقع الرسمي لشركة القاسم العقارية وخدماتها المتكاملة", descEn: "Discover the official website of Al-Qasim Real Estate and its comprehensive services", url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/EIHRzvxFwTzmsmtQ.mp4", thumbnail: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop" },
      { titleAr: "عرض تفصيلي للعقارات", titleEn: "Detailed Property Showcase", descAr: "استعرض تفاصيل العقارات المعروضة للبيع والإيجار بشكل تفاعلي", descEn: "Browse property details for sale and rent interactively", url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/RqfRkvWjgNwlFLMT.mp4", thumbnail: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop" },
      { titleAr: "البحث المتقدم عن العقارات", titleEn: "Advanced Property Search", descAr: "اكتشف كيفية البحث عن العقار المثالي بسهولة وسرعة", descEn: "Discover how to find the perfect property easily and quickly", url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/temOFMgPaIGIFnqT.mp4", thumbnail: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop" },
      { titleAr: "أضف عقارك في المنصة", titleEn: "List Your Property", descAr: "تعرّف على خطوات إدراج عقارك في منصة القاسم العقارية", descEn: "Learn how to list your property on Al-Qasim platform", url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/QigocfeRjiiGvkYX.mp4", thumbnail: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop" },
      { titleAr: "مشاريع القاسم التطويرية", titleEn: "Al-Qasim Development Projects", descAr: "استعرض أحدث المشاريع التطويرية لشركة القاسم العقارية", descEn: "Explore the latest development projects by Al-Qasim Real Estate", url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/RyAnOABFiVshLPbz.mp4", thumbnail: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop" },
      { titleAr: "تفاصيل العقارات والمعاينة", titleEn: "Property Details & Preview", descAr: "كيفية الاطلاع على تفاصيل العقار وحجز موعد للمعاينة", descEn: "How to view property details and book a viewing appointment", url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/EKIPdekfExquxprs.mp4", thumbnail: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=400&h=300&fit=crop" }
    ]
  });
  await conn.execute(
    "INSERT INTO homepage_sections (sectionKey, title, subtitle, content, isVisible, displayOrder) VALUES (?, ?, ?, ?, ?, ?)",
    ['videos', 'جولات مرئية', 'الميديا', videosContent, true, 8]
  );
  console.log('✅ Created videos section');
} else {
  console.log('ℹ️ Videos section already exists');
}

await conn.end();
console.log('✅ All homepage sections updated with structured content');
