import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

const citiesData = [
  {
    nameAr: "الرياض", nameEn: "Riyadh", sortOrder: 1,
    districts: [
      { nameAr: "حي النرجس", nameEn: "Al Narjis", sortOrder: 1 },
      { nameAr: "حي الياسمين", nameEn: "Al Yasmin", sortOrder: 2 },
      { nameAr: "حي الملقا", nameEn: "Al Malqa", sortOrder: 3 },
      { nameAr: "حي العليا", nameEn: "Al Olaya", sortOrder: 4 },
      { nameAr: "حي السليمانية", nameEn: "Al Sulaimaniyah", sortOrder: 5 },
      { nameAr: "حي الورود", nameEn: "Al Wurud", sortOrder: 6 },
      { nameAr: "حي الربوة", nameEn: "Al Rabwah", sortOrder: 7 },
      { nameAr: "حي الروضة", nameEn: "Al Rawdah", sortOrder: 8 },
      { nameAr: "حي المروج", nameEn: "Al Muruj", sortOrder: 9 },
      { nameAr: "حي الصحافة", nameEn: "Al Sahafah", sortOrder: 10 },
      { nameAr: "حي الغدير", nameEn: "Al Ghadir", sortOrder: 11 },
      { nameAr: "حي النخيل", nameEn: "Al Nakheel", sortOrder: 12 },
      { nameAr: "حي العقيق", nameEn: "Al Aqiq", sortOrder: 13 },
      { nameAr: "حي حطين", nameEn: "Hittin", sortOrder: 14 },
      { nameAr: "حي الرمال", nameEn: "Al Rimal", sortOrder: 15 },
      { nameAr: "حي القيروان", nameEn: "Al Qairawan", sortOrder: 16 },
      { nameAr: "حي الملك فهد", nameEn: "King Fahd", sortOrder: 17 },
      { nameAr: "حي الملك عبدالله", nameEn: "King Abdullah", sortOrder: 18 },
      { nameAr: "حي السفارات", nameEn: "Diplomatic Quarter", sortOrder: 19 },
      { nameAr: "حي الشفا", nameEn: "Al Shifa", sortOrder: 20 },
      { nameAr: "حي لبن", nameEn: "Laban", sortOrder: 21 },
      { nameAr: "حي طويق", nameEn: "Tuwaiq", sortOrder: 22 },
      { nameAr: "حي الدار البيضاء", nameEn: "Al Dar Al Baida", sortOrder: 23 },
      { nameAr: "حي المهدية", nameEn: "Al Mahdiyah", sortOrder: 24 },
      { nameAr: "حي العارض", nameEn: "Al Arid", sortOrder: 25 },
    ]
  },
  {
    nameAr: "جدة", nameEn: "Jeddah", sortOrder: 2,
    districts: [
      { nameAr: "حي الحمراء", nameEn: "Al Hamra", sortOrder: 1 },
      { nameAr: "حي الروضة", nameEn: "Al Rawdah", sortOrder: 2 },
      { nameAr: "حي الشاطئ", nameEn: "Al Shati", sortOrder: 3 },
      { nameAr: "حي الزهراء", nameEn: "Al Zahra", sortOrder: 4 },
      { nameAr: "حي النعيم", nameEn: "Al Naeem", sortOrder: 5 },
      { nameAr: "حي المرجان", nameEn: "Al Murjan", sortOrder: 6 },
      { nameAr: "حي الفيحاء", nameEn: "Al Fayha", sortOrder: 7 },
      { nameAr: "حي أبحر الشمالية", nameEn: "Abhur North", sortOrder: 8 },
      { nameAr: "حي أبحر الجنوبية", nameEn: "Abhur South", sortOrder: 9 },
      { nameAr: "حي الصفا", nameEn: "Al Safa", sortOrder: 10 },
      { nameAr: "حي المحمدية", nameEn: "Al Muhammadiyah", sortOrder: 11 },
      { nameAr: "حي السلامة", nameEn: "Al Salamah", sortOrder: 12 },
      { nameAr: "حي الأندلس", nameEn: "Al Andalus", sortOrder: 13 },
      { nameAr: "حي البساتين", nameEn: "Al Basateen", sortOrder: 14 },
      { nameAr: "حي الخالدية", nameEn: "Al Khalidiyah", sortOrder: 15 },
    ]
  },
  {
    nameAr: "مكة المكرمة", nameEn: "Makkah", sortOrder: 3,
    districts: [
      { nameAr: "حي العزيزية", nameEn: "Al Aziziyah", sortOrder: 1 },
      { nameAr: "حي الشوقية", nameEn: "Al Shawqiyah", sortOrder: 2 },
      { nameAr: "حي الرصيفة", nameEn: "Al Rusayfah", sortOrder: 3 },
      { nameAr: "حي النوارية", nameEn: "Al Nawariyah", sortOrder: 4 },
      { nameAr: "حي الكعكية", nameEn: "Al Kakiyah", sortOrder: 5 },
      { nameAr: "حي العوالي", nameEn: "Al Awali", sortOrder: 6 },
      { nameAr: "حي بطحاء قريش", nameEn: "Batha Quraysh", sortOrder: 7 },
      { nameAr: "حي الحمراء", nameEn: "Al Hamra", sortOrder: 8 },
      { nameAr: "حي الزاهر", nameEn: "Al Zahir", sortOrder: 9 },
      { nameAr: "حي التنعيم", nameEn: "Al Taneem", sortOrder: 10 },
    ]
  },
  {
    nameAr: "المدينة المنورة", nameEn: "Madinah", sortOrder: 4,
    districts: [
      { nameAr: "حي العزيزية", nameEn: "Al Aziziyah", sortOrder: 1 },
      { nameAr: "حي الحرة الشرقية", nameEn: "Al Harra East", sortOrder: 2 },
      { nameAr: "حي الحرة الغربية", nameEn: "Al Harra West", sortOrder: 3 },
      { nameAr: "حي قباء", nameEn: "Quba", sortOrder: 4 },
      { nameAr: "حي العريض", nameEn: "Al Arid", sortOrder: 5 },
      { nameAr: "حي الدفاع", nameEn: "Al Difa", sortOrder: 6 },
      { nameAr: "حي الملك فهد", nameEn: "King Fahd", sortOrder: 7 },
      { nameAr: "حي السلام", nameEn: "Al Salam", sortOrder: 8 },
      { nameAr: "حي الشرائع", nameEn: "Al Sharai", sortOrder: 9 },
      { nameAr: "حي المبعوث", nameEn: "Al Mabuth", sortOrder: 10 },
    ]
  },
  {
    nameAr: "الدمام", nameEn: "Dammam", sortOrder: 5,
    districts: [
      { nameAr: "حي الشاطئ", nameEn: "Al Shati", sortOrder: 1 },
      { nameAr: "حي الفيصلية", nameEn: "Al Faisaliyah", sortOrder: 2 },
      { nameAr: "حي المزروعية", nameEn: "Al Mazruiyah", sortOrder: 3 },
      { nameAr: "حي الجلوية", nameEn: "Al Jalawiyah", sortOrder: 4 },
      { nameAr: "حي الأنوار", nameEn: "Al Anwar", sortOrder: 5 },
      { nameAr: "حي النور", nameEn: "Al Noor", sortOrder: 6 },
      { nameAr: "حي الحمراء", nameEn: "Al Hamra", sortOrder: 7 },
      { nameAr: "حي البديع", nameEn: "Al Badi", sortOrder: 8 },
      { nameAr: "حي الريان", nameEn: "Al Rayyan", sortOrder: 9 },
      { nameAr: "حي الفردوس", nameEn: "Al Firdaws", sortOrder: 10 },
    ]
  },
  {
    nameAr: "الخبر", nameEn: "Khobar", sortOrder: 6,
    districts: [
      { nameAr: "حي الكورنيش", nameEn: "Corniche", sortOrder: 1 },
      { nameAr: "حي العقربية", nameEn: "Al Aqrabiyah", sortOrder: 2 },
      { nameAr: "حي الحزام الذهبي", nameEn: "Golden Belt", sortOrder: 3 },
      { nameAr: "حي اليرموك", nameEn: "Al Yarmouk", sortOrder: 4 },
      { nameAr: "حي الروابي", nameEn: "Al Rawabi", sortOrder: 5 },
      { nameAr: "حي التحلية", nameEn: "Al Tahliyah", sortOrder: 6 },
      { nameAr: "حي الخزامى", nameEn: "Al Khuzama", sortOrder: 7 },
      { nameAr: "حي البندرية", nameEn: "Al Bandariyah", sortOrder: 8 },
    ]
  },
  {
    nameAr: "الظهران", nameEn: "Dhahran", sortOrder: 7,
    districts: [
      { nameAr: "حي الدوحة الشمالية", nameEn: "Doha North", sortOrder: 1 },
      { nameAr: "حي الدوحة الجنوبية", nameEn: "Doha South", sortOrder: 2 },
      { nameAr: "حي الجامعة", nameEn: "University", sortOrder: 3 },
      { nameAr: "حي النور", nameEn: "Al Noor", sortOrder: 4 },
      { nameAr: "حي الحزام الأخضر", nameEn: "Green Belt", sortOrder: 5 },
    ]
  },
  {
    nameAr: "الطائف", nameEn: "Taif", sortOrder: 8,
    districts: [
      { nameAr: "حي الشهداء", nameEn: "Al Shuhada", sortOrder: 1 },
      { nameAr: "حي الحلقة الشرقية", nameEn: "Al Halqa East", sortOrder: 2 },
      { nameAr: "حي الحلقة الغربية", nameEn: "Al Halqa West", sortOrder: 3 },
      { nameAr: "حي الشرقية", nameEn: "Al Sharqiyah", sortOrder: 4 },
      { nameAr: "حي الفيصلية", nameEn: "Al Faisaliyah", sortOrder: 5 },
      { nameAr: "حي القمرية", nameEn: "Al Qamariyah", sortOrder: 6 },
      { nameAr: "حي الحوية", nameEn: "Al Huwaya", sortOrder: 7 },
    ]
  },
  {
    nameAr: "تبوك", nameEn: "Tabuk", sortOrder: 9,
    districts: [
      { nameAr: "حي المروج", nameEn: "Al Muruj", sortOrder: 1 },
      { nameAr: "حي الفيصلية", nameEn: "Al Faisaliyah", sortOrder: 2 },
      { nameAr: "حي المصيف", nameEn: "Al Masif", sortOrder: 3 },
      { nameAr: "حي السليمانية", nameEn: "Al Sulaimaniyah", sortOrder: 4 },
      { nameAr: "حي الربوة", nameEn: "Al Rabwah", sortOrder: 5 },
    ]
  },
  {
    nameAr: "بريدة", nameEn: "Buraydah", sortOrder: 10,
    districts: [
      { nameAr: "حي الصفراء", nameEn: "Al Safra", sortOrder: 1 },
      { nameAr: "حي الخليج", nameEn: "Al Khalij", sortOrder: 2 },
      { nameAr: "حي النهضة", nameEn: "Al Nahdah", sortOrder: 3 },
      { nameAr: "حي الفايزية", nameEn: "Al Fayziyah", sortOrder: 4 },
      { nameAr: "حي الإسكان", nameEn: "Al Iskan", sortOrder: 5 },
    ]
  },
  {
    nameAr: "حائل", nameEn: "Hail", sortOrder: 11,
    districts: [
      { nameAr: "حي المحطة", nameEn: "Al Mahatta", sortOrder: 1 },
      { nameAr: "حي الخزامى", nameEn: "Al Khuzama", sortOrder: 2 },
      { nameAr: "حي النقرة", nameEn: "Al Nuqra", sortOrder: 3 },
      { nameAr: "حي الوسيطاء", nameEn: "Al Wusayta", sortOrder: 4 },
    ]
  },
  {
    nameAr: "أبها", nameEn: "Abha", sortOrder: 12,
    districts: [
      { nameAr: "حي المنسك", nameEn: "Al Mansak", sortOrder: 1 },
      { nameAr: "حي الخالدية", nameEn: "Al Khalidiyah", sortOrder: 2 },
      { nameAr: "حي الموظفين", nameEn: "Al Muwazzafin", sortOrder: 3 },
      { nameAr: "حي المفتاحة", nameEn: "Al Miftaha", sortOrder: 4 },
      { nameAr: "حي الربوة", nameEn: "Al Rabwah", sortOrder: 5 },
    ]
  },
  {
    nameAr: "خميس مشيط", nameEn: "Khamis Mushait", sortOrder: 13,
    districts: [
      { nameAr: "حي الراقي", nameEn: "Al Raqi", sortOrder: 1 },
      { nameAr: "حي أم سرار", nameEn: "Umm Sarar", sortOrder: 2 },
      { nameAr: "حي الموسى", nameEn: "Al Musa", sortOrder: 3 },
      { nameAr: "حي الضيافة", nameEn: "Al Diyafah", sortOrder: 4 },
    ]
  },
  {
    nameAr: "جازان", nameEn: "Jazan", sortOrder: 14,
    districts: [
      { nameAr: "حي الشاطئ", nameEn: "Al Shati", sortOrder: 1 },
      { nameAr: "حي المنطقة الصناعية", nameEn: "Industrial Area", sortOrder: 2 },
      { nameAr: "حي الروضة", nameEn: "Al Rawdah", sortOrder: 3 },
      { nameAr: "حي السويس", nameEn: "Al Suways", sortOrder: 4 },
    ]
  },
  {
    nameAr: "نجران", nameEn: "Najran", sortOrder: 15,
    districts: [
      { nameAr: "حي الفهد", nameEn: "Al Fahd", sortOrder: 1 },
      { nameAr: "حي الفيصلية", nameEn: "Al Faisaliyah", sortOrder: 2 },
      { nameAr: "حي المخيم", nameEn: "Al Mukhayyam", sortOrder: 3 },
      { nameAr: "حي شرورة", nameEn: "Sharurah", sortOrder: 4 },
    ]
  },
  {
    nameAr: "الجبيل", nameEn: "Jubail", sortOrder: 16,
    districts: [
      { nameAr: "حي الفناتير", nameEn: "Al Fanatir", sortOrder: 1 },
      { nameAr: "حي الحويلات", nameEn: "Al Huwaylat", sortOrder: 2 },
      { nameAr: "حي الدفي", nameEn: "Al Dafi", sortOrder: 3 },
      { nameAr: "حي المرجان", nameEn: "Al Murjan", sortOrder: 4 },
    ]
  },
  {
    nameAr: "ينبع", nameEn: "Yanbu", sortOrder: 17,
    districts: [
      { nameAr: "حي الشاطئ", nameEn: "Al Shati", sortOrder: 1 },
      { nameAr: "حي الصناعية", nameEn: "Industrial", sortOrder: 2 },
      { nameAr: "حي السويق", nameEn: "Al Suwaiq", sortOrder: 3 },
      { nameAr: "حي الرابية", nameEn: "Al Rabiyah", sortOrder: 4 },
    ]
  },
  {
    nameAr: "الأحساء", nameEn: "Al Ahsa", sortOrder: 18,
    districts: [
      { nameAr: "حي المبرز", nameEn: "Al Mubarraz", sortOrder: 1 },
      { nameAr: "حي الهفوف", nameEn: "Al Hofuf", sortOrder: 2 },
      { nameAr: "حي المنيزلة", nameEn: "Al Munayzilah", sortOrder: 3 },
      { nameAr: "حي العيون", nameEn: "Al Uyun", sortOrder: 4 },
      { nameAr: "حي الحليلة", nameEn: "Al Hulaylah", sortOrder: 5 },
    ]
  },
  {
    nameAr: "القطيف", nameEn: "Qatif", sortOrder: 19,
    districts: [
      { nameAr: "حي الخويلدية", nameEn: "Al Khuwaylidiyah", sortOrder: 1 },
      { nameAr: "حي الجش", nameEn: "Al Jish", sortOrder: 2 },
      { nameAr: "حي سيهات", nameEn: "Saihat", sortOrder: 3 },
      { nameAr: "حي تاروت", nameEn: "Tarut", sortOrder: 4 },
    ]
  },
  {
    nameAr: "الباحة", nameEn: "Al Baha", sortOrder: 20,
    districts: [
      { nameAr: "حي الزبيدي", nameEn: "Al Zubaydi", sortOrder: 1 },
      { nameAr: "حي الحزام", nameEn: "Al Hizam", sortOrder: 2 },
      { nameAr: "حي الخالدية", nameEn: "Al Khalidiyah", sortOrder: 3 },
    ]
  },
];

console.log("🏙️ Seeding Saudi cities and districts...\n");

let totalCities = 0;
let totalDistricts = 0;

for (const city of citiesData) {
  // Insert city
  const [cityResult] = await connection.execute(
    "INSERT INTO cities (nameAr, nameEn, isActive, sortOrder) VALUES (?, ?, 1, ?)",
    [city.nameAr, city.nameEn, city.sortOrder]
  );
  const cityId = cityResult.insertId;
  totalCities++;
  console.log(`✅ ${city.nameAr} (${city.nameEn}) - ID: ${cityId}`);

  // Insert districts
  for (const district of city.districts) {
    await connection.execute(
      "INSERT INTO districts (cityId, nameAr, nameEn, isActive, sortOrder) VALUES (?, ?, ?, 1, ?)",
      [cityId, district.nameAr, district.nameEn, district.sortOrder]
    );
    totalDistricts++;
  }
  console.log(`   └── ${city.districts.length} districts added`);
}

console.log(`\n🎉 Done! Seeded ${totalCities} cities with ${totalDistricts} districts.`);

await connection.end();
process.exit(0);
