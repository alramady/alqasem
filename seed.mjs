/**
 * Database Seed Script for Al-Qasim Real Estate
 * Seeds: properties, projects, inquiries, settings, CMS sections, media
 */
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

// ============ CDN Image URLs ============
const IMG = {
  villa1: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/ouzOpPOroBexOmNw.jpg",
  villa2: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/tDrFOsROgOBiqrwC.jpg",
  apt1: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/gdbFJKuVqobfDWNa.jpg",
  apt2: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/KiatjuywEkEwYvBC.jpg",
  land1: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/YwCrykKOTKYOlltW.jpg",
  commercial1: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/VBLRZOtasmhmcMDR.jpg",
  office1: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/cdHgdunEoqHqhHSl.jpg",
  building1: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/iFaIzJSQQIeJEdtW.jpg",
  compound1: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/eugkDiWzbpQDlVnh.jpg",
  compound2: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/HANCUMHLBQQflvEM.jpg",
  compound3: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/HSikGCXPVgTDRJdw.webp",
  seafront1: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/WxlAvlsqzDFTQEaq.jpg",
  luxury1: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/frhPKxSQRyQkmdrD.jpg",
  dev1: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/aEePeAlkRaNzSoCz.jpg",
  dev2: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/JmXXEJwpEfIRMswT.jpg",
  interior1: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/tSVQCEBepcvJXOEB.jpg",
  interior2: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/DrwDDaXKSEEesZnh.jpg",
  penthouse1: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/mcHcSkduplJMdNOz.jpg",
  villaExt1: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/pgWVEwXSCRaVzTpf.jpg",
  villaExt2: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/zvyZWjZcNCnaBkCn.jpg",
  mega1: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/pAjzsqnLocuHVldE.webp",
};

async function seed() {
  console.log("🌱 Starting database seed...\n");

  try {
    // ============ 1. SEED PROPERTIES ============
    console.log("📦 Seeding properties...");
    
    const propertiesData = [
      // VILLAS
      ["فيلا فاخرة في حي النرجس", "فيلا فاخرة بتصميم عصري في حي النرجس شمال الرياض. تتميز بمساحات واسعة وتشطيبات راقية مع حديقة خاصة ومسبح. تصميم معماري فريد يجمع بين الأصالة والحداثة مع مواد بناء عالية الجودة.", "villa", "sale", "active", "3500000.00", "450.00", 6, 5, 1, "الرياض", "النرجس", "حي النرجس، شمال الرياض", JSON.stringify(["مسبح خاص","حديقة","مجلس رجال","مجلس نساء","مصعد"]), JSON.stringify([IMG.villaExt1, IMG.interior1, IMG.interior2])],
      ["فيلا عصرية في حي الملقا", "فيلا عصرية بتصميم مودرن في أرقى أحياء شمال الرياض. تتميز بواجهة حجرية فاخرة ومدخل رخامي مهيب. تشطيبات سوبر ديلوكس مع أنظمة ذكية للإضاءة والتكييف.", "villa", "sale", "active", "5200000.00", "600.00", 7, 6, 1, "الرياض", "الملقا", "حي الملقا، شمال الرياض", JSON.stringify(["مسبح","حديقة كبيرة","نظام ذكي","مصعد","قبو","غرفة سينما"]), JSON.stringify([IMG.villaExt2, IMG.villa1, IMG.interior1])],
      ["فيلا دوبلكس في حي الياسمين", "فيلا دوبلكس مميزة في حي الياسمين بالرياض. مساحة مريحة وتصميم عملي يناسب العائلات. قريبة من المدارس والمراكز التجارية.", "villa", "sale", "active", "2100000.00", "350.00", 5, 4, 1, "الرياض", "الياسمين", "حي الياسمين، شمال الرياض", JSON.stringify(["مواقف سيارات","حديقة","مجلس","مطبخ مجهز"]), JSON.stringify([IMG.villa2, IMG.villaExt1, IMG.interior2])],
      ["فيلا للإيجار في حي العليا", "فيلا فسيحة للإيجار في موقع مميز بحي العليا وسط الرياض. قريبة من الخدمات والمطاعم والمراكز التجارية. مناسبة للعائلات.", "villa", "rent", "active", "120000.00", "400.00", 5, 4, 1, "الرياض", "العليا", "حي العليا، وسط الرياض", JSON.stringify(["مدخلين","حديقة أمامية","حديقة خلفية","مواقف"]), JSON.stringify([IMG.villaExt2, IMG.villa1])],
      // APARTMENTS
      ["شقة فاخرة في برج المملكة", "شقة فاخرة بإطلالة بانورامية مذهلة في أحد أرقى الأبراج بالرياض. تشطيبات فندقية مع أرضيات رخامية وأسقف عالية.", "apartment", "sale", "active", "1800000.00", "180.00", 3, 3, 1, "الرياض", "العليا", "طريق الملك فهد، حي العليا", JSON.stringify(["إطلالة بانورامية","كونسيرج","أمن 24/7","نادي صحي","مسبح مشترك"]), JSON.stringify([IMG.apt1, IMG.interior1, IMG.penthouse1])],
      ["شقة مفروشة للإيجار في حي الروضة", "شقة مفروشة بالكامل للإيجار الشهري أو السنوي في حي الروضة. أثاث حديث وأجهزة كهربائية جديدة.", "apartment", "rent", "active", "48000.00", "120.00", 2, 2, 1, "الرياض", "الروضة", "حي الروضة، شرق الرياض", JSON.stringify(["مفروشة بالكامل","أجهزة كهربائية","قريبة من المترو","أمن"]), JSON.stringify([IMG.apt2, IMG.interior2])],
      ["شقة بحرية في جدة - الكورنيش", "شقة فاخرة بإطلالة مباشرة على البحر الأحمر في كورنيش جدة. تصميم عصري مع شرفة واسعة تطل على البحر.", "apartment", "sale", "active", "2200000.00", "200.00", 3, 3, 1, "جدة", "الكورنيش", "كورنيش جدة", JSON.stringify(["إطلالة بحرية","شرفة واسعة","نادي صحي","مسبح"]), JSON.stringify([IMG.seafront1, IMG.luxury1, IMG.apt1])],
      ["شقة استوديو للإيجار في الدمام", "شقة استوديو مؤثثة بالكامل في موقع مركزي بالدمام. مناسبة للموظفين والطلاب.", "apartment", "rent", "active", "24000.00", "55.00", 1, 1, 0, "الدمام", "الفيصلية", "حي الفيصلية، الدمام", JSON.stringify(["مؤثثة","مطبخ مجهز","قريبة من الجامعات"]), JSON.stringify([IMG.apt2, IMG.interior2])],
      // LAND
      ["أرض سكنية في حي العارض", "أرض سكنية بموقع استراتيجي في حي العارض شمال الرياض. مناسبة لبناء فيلا أو عمارة سكنية. جاهزة للبناء مع توفر جميع الخدمات.", "land", "sale", "active", "850000.00", "625.00", null, null, 0, "الرياض", "العارض", "حي العارض، شمال الرياض", JSON.stringify(["جميع الخدمات متوفرة","شارعين","قريبة من طريق الملك سلمان"]), JSON.stringify([IMG.land1])],
      ["أرض تجارية على طريق الملك فهد", "أرض تجارية بموقع حيوي على طريق الملك فهد الرئيسي. مساحة كبيرة مناسبة لمشروع تجاري.", "land", "sale", "active", "12000000.00", "2500.00", null, null, 0, "الرياض", "السليمانية", "طريق الملك فهد، حي السليمانية", JSON.stringify(["واجهة تجارية","طريق رئيسي","مساحة كبيرة","تصريح تجاري"]), JSON.stringify([IMG.land1, IMG.commercial1])],
      ["أرض سكنية في مكة المكرمة", "أرض سكنية في موقع مميز بمكة المكرمة. قريبة من الحرم المكي الشريف. فرصة استثمارية ممتازة.", "land", "sale", "active", "4500000.00", "800.00", null, null, 0, "مكة المكرمة", "العزيزية", "حي العزيزية، مكة المكرمة", JSON.stringify(["قريبة من الحرم","فرصة استثمارية","جميع الخدمات"]), JSON.stringify([IMG.land1])],
      // COMMERCIAL
      ["معرض تجاري في حي الصحافة", "معرض تجاري بمساحة واسعة على شارع رئيسي في حي الصحافة. مناسب لمعرض سيارات أو أثاث.", "commercial", "rent", "active", "180000.00", "500.00", null, 2, 1, "الرياض", "الصحافة", "حي الصحافة، شمال الرياض", JSON.stringify(["واجهة زجاجية","تكييف مركزي","مواقف أمامية","شارع رئيسي"]), JSON.stringify([IMG.commercial1, IMG.building1])],
      ["محل تجاري في مجمع تجاري بجدة", "محل تجاري في مجمع تجاري حديث بجدة. موقع مميز بحركة مرور عالية.", "commercial", "rent", "active", "95000.00", "150.00", null, 1, 1, "جدة", "الحمراء", "حي الحمراء، جدة", JSON.stringify(["حركة مرور عالية","مجمع تجاري","مواقف مشتركة"]), JSON.stringify([IMG.commercial1, IMG.office1])],
      // OFFICES
      ["مكتب إداري في برج الفيصلية", "مكتب إداري فاخر في أحد أبرز أبراج الرياض. تشطيب كامل مع أرضيات رخامية وأسقف معلقة.", "office", "rent", "active", "250000.00", "300.00", null, 3, 1, "الرياض", "العليا", "برج الفيصلية، حي العليا", JSON.stringify(["برج مكتبي","استقبال","غرف اجتماعات","أمن 24/7"]), JSON.stringify([IMG.office1, IMG.building1])],
      ["مكتب للإيجار في الخبر", "مكتب إداري بتشطيب حديث في مبنى تجاري بالخبر. مناسب لشركة صغيرة أو متوسطة.", "office", "rent", "active", "75000.00", "120.00", null, 2, 1, "الخبر", "الكورنيش", "حي الكورنيش، الخبر", JSON.stringify(["تشطيب حديث","غرفة اجتماعات","موقع مركزي"]), JSON.stringify([IMG.office1])],
      // BUILDINGS
      ["عمارة سكنية في حي الورود", "عمارة سكنية مكونة من 12 شقة في حي الورود بالرياض. دخل إيجاري ممتاز ومستقر. فرصة استثمارية مميزة.", "building", "sale", "active", "8500000.00", "1200.00", null, null, 1, "الرياض", "الورود", "حي الورود، الرياض", JSON.stringify(["12 شقة","دخل إيجاري مستقر","بناء حديث","مصعد"]), JSON.stringify([IMG.building1, IMG.apt1])],
      ["عمارة تجارية سكنية في المدينة المنورة", "عمارة تجارية سكنية في موقع حيوي بالمدينة المنورة. قريبة من المسجد النبوي الشريف.", "building", "sale", "active", "15000000.00", "2000.00", null, null, 1, "المدينة المنورة", "العزيزية", "حي العزيزية، المدينة المنورة", JSON.stringify(["محلات تجارية","شقق سكنية","قريبة من الحرم","مصعد"]), JSON.stringify([IMG.building1, IMG.commercial1])],
    ];

    for (const p of propertiesData) {
      await db.execute(sql`INSERT INTO properties (title, description, propertyType, listingType, propertyStatus, price, area, rooms, bathrooms, hasParking, city, district, address, features, images)
        VALUES (${p[0]}, ${p[1]}, ${p[2]}, ${p[3]}, ${p[4]}, ${p[5]}, ${p[6]}, ${p[7]}, ${p[8]}, ${p[9]}, ${p[10]}, ${p[11]}, ${p[12]}, ${p[13]}, ${p[14]})`);
    }
    console.log(`  ✅ ${propertiesData.length} properties seeded`);

    // ============ 2. SEED PROJECTS ============
    console.log("🏗️  Seeding projects...");
    
    const projectsData = [
      ["مجمع القاسم السكني", "مشروع سكني متكامل في شمال الرياض", "مجمع سكني فاخر يضم فلل وشقق بتصاميم عصرية في حي النرجس شمال الرياض. يتميز المشروع بمساحات خضراء واسعة، مسابح مشتركة، نادي صحي، ومنطقة ألعاب للأطفال.", "حي النرجس، شمال الرياض", "active", 120, 85, JSON.stringify(["مسابح مشتركة","نادي صحي","حدائق","أمن 24/7","مواقف تحت الأرض"]), JSON.stringify([IMG.compound1, IMG.compound2, IMG.compound3, IMG.villaExt1]), "24.8200", "46.6250", 1, 1],
      ["أبراج القاسم التجارية", "مشروع أبراج مكتبية في قلب الرياض", "مشروع أبراج تجارية ومكتبية في موقع استراتيجي على طريق الملك فهد. يتكون من برجين بارتفاع 30 طابقاً يضمان مكاتب إدارية فاخرة ومعارض تجارية ومطاعم.", "طريق الملك فهد، الرياض", "active", 200, 140, JSON.stringify(["مكاتب فاخرة","معارض تجارية","مطاعم","مواقف ذكية"]), JSON.stringify([IMG.dev1, IMG.building1, IMG.office1]), "24.7100", "46.6750", 2, 1],
      ["واحة الياسمين", "مجمع فلل فاخرة في حي الياسمين", "مشروع فلل فاخرة بتصاميم معمارية متنوعة في حي الياسمين. كل فيلا بمسبح خاص وحديقة. المشروع يضم حديقة مركزية كبيرة ومسجد ونادي اجتماعي.", "حي الياسمين، الرياض", "active", 60, 45, JSON.stringify(["فلل متنوعة التصاميم","مسابح خاصة","حديقة مركزية","مسجد","نادي اجتماعي"]), JSON.stringify([IMG.compound3, IMG.villaExt1, IMG.villaExt2, IMG.villa2]), "24.8350", "46.6400", 3, 1],
      ["منتجع القاسم البحري", "مشروع سكني سياحي على ساحل جدة", "مشروع سكني سياحي فاخر على ساحل البحر الأحمر في جدة. يضم شقق وبنتهاوس بإطلالات بحرية مباشرة. يتميز بشاطئ خاص، مارينا لليخوت، ومطاعم على الواجهة البحرية.", "كورنيش جدة، جدة", "upcoming", 180, 30, JSON.stringify(["إطلالة بحرية","شاطئ خاص","مارينا","مطاعم","نادي صحي"]), JSON.stringify([IMG.seafront1, IMG.luxury1, IMG.dev2]), "21.5400", "39.1700", 4, 0],
      ["حي القاسم المتكامل", "مشروع حي سكني متكامل الخدمات", "مشروع حي سكني متكامل يضم فلل وشقق ومرافق تجارية وتعليمية وصحية. تم الانتهاء من البنية التحتية وجاري تسليم الوحدات.", "شمال الرياض", "completed", 500, 500, JSON.stringify(["مدارس","مراكز صحية","مراكز تجارية","حدائق عامة","مساجد"]), JSON.stringify([IMG.compound2, IMG.compound1, IMG.mega1]), "24.8500", "46.7000", 5, 0],
      ["بوابة المستقبل", "مشروع مكاتب ذكية في الرياض", "مشروع مكاتب ذكية بتقنيات حديثة ومساحات عمل مرنة. يستهدف الشركات الناشئة والتقنية. تصميم مستدام حاصل على شهادة LEED.", "حي الغدير، الرياض", "upcoming", 150, 20, JSON.stringify(["مساحات عمل مرنة","تقنيات ذكية","كافيتريا","قاعات اجتماعات"]), JSON.stringify([IMG.dev1, IMG.mega1, IMG.office1]), "24.7800", "46.7200", 6, 0],
    ];

    for (const p of projectsData) {
      await db.execute(sql`INSERT INTO projects (title, subtitle, description, location, projectStatus, totalUnits, soldUnits, features, images, latitude, longitude, displayOrder, isFeatured)
        VALUES (${p[0]}, ${p[1]}, ${p[2]}, ${p[3]}, ${p[4]}, ${p[5]}, ${p[6]}, ${p[7]}, ${p[8]}, ${p[9]}, ${p[10]}, ${p[11]}, ${p[12]})`);
    }
    console.log(`  ✅ ${projectsData.length} projects seeded`);

    // ============ 3. SEED INQUIRIES ============
    console.log("📩 Seeding inquiries...");
    
    const inquiriesData = [
      ["محمد العتيبي", "m.otaibi@gmail.com", "0551234567", "buy", "أرغب في شراء فيلا في شمال الرياض بميزانية 3-4 مليون ريال. أفضل حي النرجس أو الملقا.", "new", "contact_form"],
      ["فاطمة الشمري", "fatima.sh@hotmail.com", "0509876543", "rent", "أبحث عن شقة مفروشة للإيجار في الرياض، يفضل حي الروضة أو النزهة. ميزانيتي 4000-5000 ريال شهرياً.", "in_progress", "contact_form"],
      ["عبدالله القحطاني", "abdullah.q@yahoo.com", "0567891234", "sell", "أريد بيع أرض سكنية في حي العارض، مساحة 500 متر مربع. أرغب في تقييم العقار.", "new", "add_property_form"],
      ["نورة السبيعي", "noura.s@gmail.com", "0543216789", "buy", "مهتمة بشراء شقة في مشروع القاسم السكني. أرجو التواصل لمعرفة الأسعار.", "completed", "contact_form"],
      ["خالد المطيري", "khalid.m@outlook.com", "0578901234", "general", "أرغب في الاستفسار عن خدمات إدارة الأملاك. لدي عمارة سكنية وأبحث عن شركة لإدارتها.", "new", "homepage_contact"],
      ["سارة الدوسري", "sara.d@gmail.com", "0534567890", "buy", "أبحث عن فيلا دوبلكس في حي الياسمين أو النرجس. الميزانية مفتوحة.", "new", "request_property_form"],
      ["أحمد الحربي", "ahmed.h@company.sa", "0512345678", "rent", "شركتنا تبحث عن مكتب إداري في الرياض على طريق الملك فهد. المساحة المطلوبة 200-400 متر.", "in_progress", "contact_form"],
      ["ريم العنزي", "reem.a@gmail.com", "0598765432", "management", "أملك 3 شقق في حي الورود وأبحث عن شركة لإدارتها وتأجيرها. ما هي رسوم الإدارة؟", "new", "contact_form"],
    ];

    for (const i of inquiriesData) {
      await db.execute(sql`INSERT INTO inquiries (name, email, phone, inquiryType, message, inquiryStatus, source)
        VALUES (${i[0]}, ${i[1]}, ${i[2]}, ${i[3]}, ${i[4]}, ${i[5]}, ${i[6]})`);
    }
    console.log(`  ✅ ${inquiriesData.length} inquiries seeded`);

    // ============ 4. SEED SETTINGS ============
    console.log("⚙️  Seeding settings...");
    
    const settingsData = [
      ["company_name", "القاسم العقارية", "general"],
      ["company_name_en", "Al-Qasim Real Estate", "general"],
      ["phone", "920001911", "contact"],
      ["mobile", "0500051679", "contact"],
      ["email", "info@alqasem.com.sa", "contact"],
      ["address", "شارع الإمام عبد العزيز بن محمد بن سعود - حي أم سليم، الرياض", "contact"],
      ["address_en", "Imam Abdulaziz bin Mohammed St. - Umm Saleem, Riyadh", "contact"],
      ["working_hours", "الأحد - الخميس: 9 ص - 6 م", "contact"],
      ["working_hours_en", "Sunday - Thursday: 9 AM - 6 PM", "contact"],
      ["whatsapp", "+966504466528", "social"],
      ["instagram", "https://www.instagram.com/alqasem_sa/", "social"],
      ["twitter", "https://x.com/alqasem_sa", "social"],
      ["tiktok", "https://www.tiktok.com/@alqasem_sa", "social"],
      ["snapchat", "https://www.snapchat.com/add/alqasem_sa", "social"],
      ["linkedin", "https://www.linkedin.com/company/alqasem-sa", "social"],
      ["hero_image", IMG.compound1, "cms"],
      ["about_image", IMG.villaExt1, "cms"],
    ];

    for (const s of settingsData) {
      await db.execute(sql`INSERT INTO settings (settingKey, settingValue, groupName)
        VALUES (${s[0]}, ${s[1]}, ${s[2]})
        ON DUPLICATE KEY UPDATE settingValue = VALUES(settingValue), groupName = VALUES(groupName)`);
    }
    console.log(`  ✅ ${settingsData.length} settings seeded`);

    // ============ 5. SEED HOMEPAGE SECTIONS ============
    console.log("📄 Seeding homepage sections...");
    
    const heroContent = JSON.stringify({
      image: IMG.compound1,
      stats: [
        { label: "عقار متاح", value: "500+" },
        { label: "عميل سعيد", value: "1200+" },
        { label: "مشروع منجز", value: "50+" },
        { label: "سنة خبرة", value: "25+" },
      ],
    });

    const aboutContent = JSON.stringify({
      text: "شركة القاسم العقارية من الشركات الرائدة في مجال التطوير والتسويق العقاري في المملكة العربية السعودية.",
      image: IMG.villaExt1,
    });

    const servicesContent = JSON.stringify({
      items: [
        { title: "بيع وشراء العقارات", icon: "building" },
        { title: "تأجير العقارات", icon: "key" },
        { title: "إدارة الأملاك", icon: "settings" },
        { title: "التقييم العقاري", icon: "chart" },
        { title: "الاستشارات العقارية", icon: "users" },
        { title: "التسويق العقاري", icon: "megaphone" },
      ],
    });

    const sectionsData = [
      ["hero", "القاسم العقارية", "شريكك الموثوق في عالم العقارات", heroContent, 1, 1],
      ["about", "من نحن", "شركة القاسم العقارية", aboutContent, 1, 2],
      ["services", "خدماتنا", "نقدم لكم أفضل الخدمات العقارية", servicesContent, 1, 3],
      ["properties", "أحدث العقارات", "تصفح أحدث العقارات المتاحة", "{}", 1, 4],
      ["projects", "مشاريعنا", "مشاريع عقارية متميزة", "{}", 1, 5],
      ["partners", "شركاؤنا", "نفخر بشراكتنا مع أفضل الجهات", "{}", 1, 6],
      ["contact", "تواصل معنا", "نسعد بخدمتكم", "{}", 1, 7],
    ];

    for (const s of sectionsData) {
      await db.execute(sql`INSERT INTO homepage_sections (sectionKey, title, subtitle, content, isVisible, displayOrder)
        VALUES (${s[0]}, ${s[1]}, ${s[2]}, ${s[3]}, ${s[4]}, ${s[5]})
        ON DUPLICATE KEY UPDATE title = VALUES(title), subtitle = VALUES(subtitle), content = VALUES(content), isVisible = VALUES(isVisible), displayOrder = VALUES(displayOrder)`);
    }
    console.log(`  ✅ ${sectionsData.length} homepage sections seeded`);

    // ============ 6. SEED MEDIA LIBRARY ============
    console.log("🖼️  Seeding media library...");
    
    const mediaData = [
      ["villa-narjis.jpg", IMG.villaExt1, "image", "image/jpeg", "properties", "فيلا حي النرجس"],
      ["villa-malqa.jpg", IMG.villaExt2, "image", "image/jpeg", "properties", "فيلا حي الملقا"],
      ["apartment-luxury.jpg", IMG.apt1, "image", "image/jpeg", "properties", "شقة فاخرة"],
      ["apartment-furnished.jpg", IMG.apt2, "image", "image/jpeg", "properties", "شقة مفروشة"],
      ["land-residential.jpg", IMG.land1, "image", "image/jpeg", "properties", "أرض سكنية"],
      ["commercial-showroom.jpg", IMG.commercial1, "image", "image/jpeg", "properties", "معرض تجاري"],
      ["office-tower.jpg", IMG.office1, "image", "image/jpeg", "properties", "مكتب إداري"],
      ["building-residential.jpg", IMG.building1, "image", "image/jpeg", "properties", "عمارة سكنية"],
      ["compound-aerial.jpg", IMG.compound1, "image", "image/jpeg", "projects", "مجمع سكني - منظر جوي"],
      ["compound-pool.jpg", IMG.compound2, "image", "image/jpeg", "projects", "مجمع سكني - مسبح"],
      ["compound-villas.webp", IMG.compound3, "image", "image/webp", "projects", "مجمع فلل"],
      ["seafront-jeddah.jpg", IMG.seafront1, "image", "image/jpeg", "projects", "مشروع بحري جدة"],
      ["interior-luxury.jpg", IMG.interior1, "image", "image/jpeg", "interiors", "تصميم داخلي فاخر"],
      ["interior-modern.jpg", IMG.interior2, "image", "image/jpeg", "interiors", "تصميم داخلي عصري"],
      ["development-towers.jpg", IMG.dev1, "image", "image/jpeg", "projects", "أبراج تجارية"],
    ];

    for (const m of mediaData) {
      await db.execute(sql`INSERT INTO media (filename, filePath, fileType, mimeType, folder, altText)
        VALUES (${m[0]}, ${m[1]}, ${m[2]}, ${m[3]}, ${m[4]}, ${m[5]})`);
    }
    console.log(`  ✅ ${mediaData.length} media entries seeded`);

    // ============ SUMMARY ============
    console.log("\n🎉 Database seeding completed successfully!");
    console.log(`   - ${propertiesData.length} properties`);
    console.log(`   - ${projectsData.length} projects`);
    console.log(`   - ${inquiriesData.length} inquiries`);
    console.log(`   - ${settingsData.length} settings`);
    console.log(`   - ${sectionsData.length} homepage sections`);
    console.log(`   - ${mediaData.length} media entries`);

  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
