import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const amenitiesList = [
  // Basic
  { nameAr: "مواقف سيارات", nameEn: "Parking", icon: "car", category: "basic", sortOrder: 1 },
  { nameAr: "مصعد", nameEn: "Elevator", icon: "arrow-up", category: "basic", sortOrder: 2 },
  { nameAr: "تكييف مركزي", nameEn: "Central AC", icon: "snowflake", category: "basic", sortOrder: 3 },
  { nameAr: "مطبخ مجهز", nameEn: "Equipped Kitchen", icon: "utensils", category: "basic", sortOrder: 4 },
  { nameAr: "غرفة خادمة", nameEn: "Maid Room", icon: "door-open", category: "basic", sortOrder: 5 },
  { nameAr: "غرفة سائق", nameEn: "Driver Room", icon: "door-open", category: "basic", sortOrder: 6 },
  { nameAr: "غرفة غسيل", nameEn: "Laundry Room", icon: "shirt", category: "basic", sortOrder: 7 },
  { nameAr: "مخزن", nameEn: "Storage Room", icon: "warehouse", category: "basic", sortOrder: 8 },
  { nameAr: "قبو", nameEn: "Basement", icon: "layers", category: "basic", sortOrder: 9 },

  // Comfort
  { nameAr: "مجلس رجال", nameEn: "Men's Majlis", icon: "sofa", category: "comfort", sortOrder: 10 },
  { nameAr: "مجلس نساء", nameEn: "Women's Majlis", icon: "sofa", category: "comfort", sortOrder: 11 },
  { nameAr: "مؤثثة بالكامل", nameEn: "Fully Furnished", icon: "lamp", category: "comfort", sortOrder: 12 },
  { nameAr: "نظام ذكي", nameEn: "Smart Home", icon: "cpu", category: "comfort", sortOrder: 13 },
  { nameAr: "شرفة/بلكونة", nameEn: "Balcony", icon: "sun", category: "comfort", sortOrder: 14 },
  { nameAr: "إطلالة بحرية", nameEn: "Sea View", icon: "waves", category: "comfort", sortOrder: 15 },
  { nameAr: "إطلالة بانورامية", nameEn: "Panoramic View", icon: "mountain", category: "comfort", sortOrder: 16 },

  // Security
  { nameAr: "أمن 24/7", nameEn: "24/7 Security", icon: "shield", category: "security", sortOrder: 17 },
  { nameAr: "كاميرات مراقبة", nameEn: "CCTV", icon: "camera", category: "security", sortOrder: 18 },
  { nameAr: "نظام إنذار", nameEn: "Alarm System", icon: "bell", category: "security", sortOrder: 19 },
  { nameAr: "بوابة إلكترونية", nameEn: "Electronic Gate", icon: "lock", category: "security", sortOrder: 20 },
  { nameAr: "إنتركم", nameEn: "Intercom", icon: "phone", category: "security", sortOrder: 21 },

  // Outdoor
  { nameAr: "مسبح خاص", nameEn: "Private Pool", icon: "droplets", category: "outdoor", sortOrder: 22 },
  { nameAr: "مسبح مشترك", nameEn: "Shared Pool", icon: "droplets", category: "outdoor", sortOrder: 23 },
  { nameAr: "حديقة خاصة", nameEn: "Private Garden", icon: "tree-pine", category: "outdoor", sortOrder: 24 },
  { nameAr: "حديقة مشتركة", nameEn: "Shared Garden", icon: "tree-pine", category: "outdoor", sortOrder: 25 },
  { nameAr: "ملعب أطفال", nameEn: "Playground", icon: "baby", category: "outdoor", sortOrder: 26 },
  { nameAr: "مسار مشي", nameEn: "Walking Track", icon: "footprints", category: "outdoor", sortOrder: 27 },
  { nameAr: "شواء/باربكيو", nameEn: "BBQ Area", icon: "flame", category: "outdoor", sortOrder: 28 },

  // Entertainment
  { nameAr: "نادي صحي/جيم", nameEn: "Gym/Fitness", icon: "dumbbell", category: "entertainment", sortOrder: 29 },
  { nameAr: "ساونا/سبا", nameEn: "Sauna/Spa", icon: "thermometer", category: "entertainment", sortOrder: 30 },
  { nameAr: "غرفة سينما", nameEn: "Cinema Room", icon: "film", category: "entertainment", sortOrder: 31 },
  { nameAr: "صالة ألعاب", nameEn: "Game Room", icon: "gamepad-2", category: "entertainment", sortOrder: 32 },
  { nameAr: "غرفة اجتماعات", nameEn: "Meeting Room", icon: "presentation", category: "entertainment", sortOrder: 33 },

  // Other
  { nameAr: "قريب من المسجد", nameEn: "Near Mosque", icon: "building", category: "other", sortOrder: 34 },
  { nameAr: "قريب من المدارس", nameEn: "Near Schools", icon: "graduation-cap", category: "other", sortOrder: 35 },
  { nameAr: "قريب من المستشفى", nameEn: "Near Hospital", icon: "heart-pulse", category: "other", sortOrder: 36 },
  { nameAr: "قريب من المترو", nameEn: "Near Metro", icon: "train-front", category: "other", sortOrder: 37 },
  { nameAr: "شارع رئيسي", nameEn: "Main Road", icon: "route", category: "other", sortOrder: 38 },
  { nameAr: "واجهة تجارية", nameEn: "Commercial Front", icon: "store", category: "other", sortOrder: 39 },
];

async function seed() {
  const conn = await mysql.createConnection(DATABASE_URL);
  try {
    // Check if amenities already exist
    const [rows] = await conn.execute("SELECT COUNT(*) as cnt FROM amenities");
    if (rows[0].cnt > 0) {
      console.log(`Amenities table already has ${rows[0].cnt} records. Skipping seed.`);
      return;
    }

    for (const a of amenitiesList) {
      await conn.execute(
        "INSERT INTO amenities (nameAr, nameEn, icon, amenityCategory, isActive, sortOrder) VALUES (?, ?, ?, ?, 1, ?)",
        [a.nameAr, a.nameEn, a.icon, a.category, a.sortOrder]
      );
    }
    console.log(`✅ Seeded ${amenitiesList.length} amenities successfully.`);
  } finally {
    await conn.end();
  }
}

seed().catch(e => { console.error(e); process.exit(1); });
