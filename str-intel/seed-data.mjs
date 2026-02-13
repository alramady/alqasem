import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

async function seed() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  console.log("Seeding reference data...");

  // 1. Neighborhoods
  const neighborhoodData = [
    { name: "Al Olaya", nameAr: "العليا", slug: "al-olaya", city: "Riyadh", latitude: "24.6900", longitude: "46.6850" },
    { name: "Al Wizarat", nameAr: "الوزارات", slug: "al-wizarat", city: "Riyadh", latitude: "24.6600", longitude: "46.7100" },
    { name: "BLVD City", nameAr: "بوليفارد سيتي", slug: "blvd-city", city: "Riyadh", latitude: "24.7500", longitude: "46.6400" },
    { name: "Al Malqa", nameAr: "الملقا", slug: "al-malqa", city: "Riyadh", latitude: "24.8100", longitude: "46.6300" },
    { name: "Al Nakheel", nameAr: "النخيل", slug: "al-nakheel", city: "Riyadh", latitude: "24.7700", longitude: "46.6500" },
    { name: "Hittin", nameAr: "حطين", slug: "hittin", city: "Riyadh", latitude: "24.7800", longitude: "46.6200" },
    { name: "Al Sulaimaniyah", nameAr: "السليمانية", slug: "al-sulaimaniyah", city: "Riyadh", latitude: "24.7000", longitude: "46.7000" },
    { name: "KAFD", nameAr: "كافد", slug: "kafd", city: "Riyadh", latitude: "24.7700", longitude: "46.6400" },
  ];

  await conn.execute("DELETE FROM neighborhoods");
  for (const n of neighborhoodData) {
    await conn.execute(
      `INSERT INTO neighborhoods (name, nameAr, slug, city, latitude, longitude, isActive) VALUES (?, ?, ?, ?, ?, ?, true)`,
      [n.name, n.nameAr, n.slug, n.city, n.latitude, n.longitude]
    );
  }
  console.log(`  ✓ ${neighborhoodData.length} neighborhoods seeded`);

  // 2. OTA Sources
  const otaData = [
    { name: "Airbnb", slug: "airbnb", baseUrl: "https://www.airbnb.com", config: JSON.stringify({ searchPath: "/s/Riyadh/homes", maxPages: 15, rateLimit: 3000 }) },
    { name: "Booking.com", slug: "booking", baseUrl: "https://www.booking.com", config: JSON.stringify({ searchPath: "/searchresults.html", maxPages: 10, rateLimit: 4000 }) },
    { name: "Agoda", slug: "agoda", baseUrl: "https://www.agoda.com", config: JSON.stringify({ searchPath: "/search", maxPages: 10, rateLimit: 4000 }) },
    { name: "Gathern", slug: "gathern", baseUrl: "https://gathern.co", config: JSON.stringify({ searchPath: "/en/property", maxPages: 10, rateLimit: 2000 }) },
  ];

  await conn.execute("DELETE FROM ota_sources");
  for (const o of otaData) {
    await conn.execute(
      `INSERT INTO ota_sources (name, slug, baseUrl, isActive, scraperConfig) VALUES (?, ?, ?, true, ?)`,
      [o.name, o.slug, o.baseUrl, o.config]
    );
  }
  console.log(`  ✓ ${otaData.length} OTA sources seeded`);

  // 3. Seasonal Patterns
  const seasonData = [
    { seasonType: "peak", name: "Riyadh Season", startDate: "2025-10-15", endDate: "2026-03-15", mult: "1.85", desc: "Annual entertainment mega-event driving highest demand", year: 2025 },
    { seasonType: "event", name: "Saudi F1 Grand Prix", startDate: "2025-12-05", endDate: "2025-12-08", mult: "2.50", desc: "Formula 1 race weekend with Riyadh spillover", year: 2025 },
    { seasonType: "event", name: "Ramadan", startDate: "2026-02-28", endDate: "2026-03-30", mult: "0.70", desc: "Lower tourism demand during holy month", year: 2026 },
    { seasonType: "event", name: "Eid Al-Fitr", startDate: "2026-03-30", endDate: "2026-04-05", mult: "1.60", desc: "Post-Ramadan celebration spike", year: 2026 },
    { seasonType: "high", name: "National Day", startDate: "2025-09-23", endDate: "2025-09-25", mult: "1.45", desc: "Saudi National Day celebrations", year: 2025 },
    { seasonType: "low", name: "Summer Heat", startDate: "2025-06-15", endDate: "2025-09-15", mult: "0.65", desc: "Extreme heat reduces tourism demand", year: 2025 },
    { seasonType: "event", name: "LEAP Tech Conference", startDate: "2026-02-09", endDate: "2026-02-12", mult: "1.75", desc: "Major tech conference driving business travel", year: 2026 },
    { seasonType: "event", name: "Founding Day", startDate: "2026-02-22", endDate: "2026-02-23", mult: "1.30", desc: "Saudi Founding Day holiday", year: 2026 },
  ];

  await conn.execute("DELETE FROM seasonal_patterns");
  for (const s of seasonData) {
    await conn.execute(
      `INSERT INTO seasonal_patterns (seasonType, name, startDate, endDate, avgPriceMultiplier, description, year) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [s.seasonType, s.name, s.startDate, s.endDate, s.mult, s.desc, s.year]
    );
  }
  console.log(`  ✓ ${seasonData.length} seasonal patterns seeded`);

  // Get IDs
  const [nbRows] = await conn.execute("SELECT id, slug FROM neighborhoods");
  const nbMap = {};
  for (const r of nbRows) nbMap[r.slug] = r.id;

  const [otaRows] = await conn.execute("SELECT id, slug FROM ota_sources");
  const otaMap = {};
  for (const r of otaRows) otaMap[r.slug] = r.id;

  // 4. Demo listings
  const hosts = [
    { id: "h_pm_001", name: "Riyadh Luxury Stays", type: "property_manager", sh: true },
    { id: "h_pm_002", name: "KSA Premium Rentals", type: "property_manager", sh: true },
    { id: "h_pm_003", name: "CityView Properties", type: "property_manager", sh: false },
    { id: "h_pm_004", name: "Al Faisal Hospitality", type: "property_manager", sh: true },
    { id: "h_pm_005", name: "Saudi Stay Co", type: "property_manager", sh: false },
    { id: "h_pm_006", name: "Golden Gate Rentals", type: "property_manager", sh: true },
    { id: "h_ind_001", name: "Mohammed A.", type: "individual", sh: true },
    { id: "h_ind_002", name: "Abdullah K.", type: "individual", sh: false },
    { id: "h_ind_003", name: "Fahad S.", type: "individual", sh: false },
    { id: "h_ind_004", name: "Khalid M.", type: "individual", sh: true },
    { id: "h_ind_005", name: "Omar R.", type: "individual", sh: false },
    { id: "h_ind_006", name: "Saad T.", type: "individual", sh: false },
  ];

  const propertyTypes = ["studio", "1br", "2br", "3br", "4br_plus"];
  const bedroomMap = { studio: 0, "1br": 1, "2br": 2, "3br": 3, "4br_plus": 4 };
  const basePrices = { studio: 280, "1br": 420, "2br": 650, "3br": 950, "4br_plus": 1400 };
  const nbMults = {
    "al-olaya": 1.35, "al-wizarat": 0.95, "blvd-city": 1.50, "al-malqa": 1.20,
    "al-nakheel": 1.15, "hittin": 1.25, "al-sulaimaniyah": 1.00, "kafd": 1.55
  };
  const amenSets = [
    ["WiFi", "AC", "Kitchen", "TV", "Washer"],
    ["WiFi", "AC", "Kitchen", "TV", "Washer", "Pool", "Gym", "Parking"],
    ["WiFi", "AC", "Kitchen", "TV", "Washer", "Pool", "Gym", "Parking", "Balcony", "Workspace"],
    ["WiFi", "AC", "Kitchen"],
  ];

  await conn.execute("DELETE FROM price_snapshots");
  await conn.execute("DELETE FROM listings");
  await conn.execute("DELETE FROM competitors");
  await conn.execute("DELETE FROM metrics");

  let listingCount = 0;
  const otaSlugs = ["airbnb", "booking", "gathern", "agoda"];

  for (const nbSlug of Object.keys(nbMults)) {
    const nbId = nbMap[nbSlug];
    const mult = nbMults[nbSlug];
    const count = 18 + Math.floor(Math.random() * 12);

    for (let i = 0; i < count; i++) {
      const pt = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
      const host = hosts[Math.floor(Math.random() * hosts.length)];
      const otaSlug = otaSlugs[Math.floor(Math.random() * 4)];
      const otaId = otaMap[otaSlug];
      const basePrice = basePrices[pt] * mult;
      const nightlyRate = Math.round(basePrice * (0.8 + Math.random() * 0.4));
      const rating = (3.5 + Math.random() * 1.5).toFixed(2);
      const reviewCount = Math.floor(Math.random() * 200);
      const photoCount = 5 + Math.floor(Math.random() * 25);
      const amenities = amenSets[Math.floor(Math.random() * amenSets.length)];
      const externalId = `${otaSlug}_${nbSlug}_${i}`;
      const beds = bedroomMap[pt];
      const title = pt === "studio" ? "Modern Studio" : pt === "4br_plus" ? "Luxury 4BR+ Villa" : `${beds} Bedroom Apartment`;

      const [result] = await conn.execute(
        `INSERT INTO listings (externalId, otaSourceId, neighborhoodId, title, propertyType, hostType, hostName, hostId, bedrooms, bathrooms, maxGuests, latitude, longitude, rating, reviewCount, photoCount, amenities, isSuperhost, instantBook, isActive)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
        [externalId, otaId, nbId, `${title} in ${nbSlug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}`,
         pt, host.type, host.name, host.id, beds, Math.max(1, Math.floor(beds * 0.8)),
         beds * 2 + 2, (24.65 + Math.random() * 0.2).toFixed(7), (46.60 + Math.random() * 0.15).toFixed(7),
         rating, reviewCount, photoCount, JSON.stringify(amenities), host.sh ? 1 : 0, Math.random() > 0.5 ? 1 : 0]
      );
      const lid = result.insertId;
      listingCount++;

      // Price snapshots for last 90 days (every 7 days = 13 snapshots)
      const priceValues = [];
      for (let d = 0; d < 13; d++) {
        const daysAgo = d * 7;
        const seasonMult = daysAgo > 60 ? 0.85 : daysAgo > 30 ? 1.0 : 1.15;
        const snapshotRate = Math.round(nightlyRate * seasonMult * (0.95 + Math.random() * 0.1));
        const availDays = 15 + Math.floor(Math.random() * 10);
        const bookedDays = Math.floor(availDays * (0.4 + Math.random() * 0.4));
        priceValues.push([lid, daysAgo, snapshotRate, Math.round(snapshotRate * 0.15), availDays, bookedDays, 30 - availDays]);
      }
      for (const pv of priceValues) {
        await conn.execute(
          `INSERT INTO price_snapshots (listingId, snapshotDate, nightlyRate, cleaningFee, currency, availableDays, bookedDays, blockedDays)
           VALUES (?, DATE_SUB(NOW(), INTERVAL ? DAY), ?, ?, 'SAR', ?, ?, ?)`,
          pv
        );
      }
    }
  }
  console.log(`  ✓ ${listingCount} demo listings with price history seeded`);

  // 5. Competitors
  const pmHosts = hosts.filter(h => h.type === "property_manager");
  for (const h of pmHosts) {
    const [[{ cnt }]] = await conn.execute("SELECT COUNT(*) as cnt FROM listings WHERE hostId = ?", [h.id]);
    const [[{ avgR }]] = await conn.execute("SELECT AVG(CAST(rating AS DECIMAL(3,2))) as avgR FROM listings WHERE hostId = ?", [h.id]);
    const [[{ avgP }]] = await conn.execute("SELECT AVG(ps.nightlyRate) as avgP FROM listings l JOIN price_snapshots ps ON ps.listingId = l.id WHERE l.hostId = ? AND ps.snapshotDate > DATE_SUB(NOW(), INTERVAL 7 DAY)", [h.id]);

    await conn.execute(
      `INSERT INTO competitors (hostId, hostName, otaSourceId, portfolioSize, avgRating, avgNightlyRate, totalReviews, isSuperhost)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [h.id, h.name, otaMap["airbnb"], cnt, avgR || 4.2, avgP || 600, Math.floor(Math.random() * 500), h.sh ? 1 : 0]
    );
  }
  console.log(`  ✓ ${pmHosts.length} competitors seeded`);

  // 6. Aggregated metrics
  for (const nbSlug of Object.keys(nbMults)) {
    const nbId = nbMap[nbSlug];
    const mult = nbMults[nbSlug];

    for (let d = 0; d < 12; d++) {
      const daysAgo = d * 7;
      const baseAdr = 550 * mult;
      const trend = 1 + (12 - d) * 0.008;
      const adr = Math.round(baseAdr * trend);
      const occ = (55 + Math.random() * 25).toFixed(2);
      const revpar = Math.round(adr * parseFloat(occ) / 100);

      await conn.execute(
        `INSERT INTO metrics (neighborhoodId, propertyType, metricDate, period, adr, adr30, adr60, adr90, occupancyRate, revpar, totalListings, newListings, avgRating, medianPrice, priceP25, priceP75)
         VALUES (?, 'all', DATE_SUB(NOW(), INTERVAL ? DAY), 'weekly', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [nbId, daysAgo, adr, Math.round(adr * 0.98), Math.round(adr * 0.95), Math.round(adr * 0.92),
         occ, revpar, 18 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 5),
         (4.0 + Math.random() * 0.8).toFixed(2), adr, Math.round(adr * 0.75), Math.round(adr * 1.25)]
      );

      for (const pt of propertyTypes) {
        const ptBase = basePrices[pt] * mult;
        const ptAdr = Math.round(ptBase * trend);
        const ptOcc = (50 + Math.random() * 30).toFixed(2);
        await conn.execute(
          `INSERT INTO metrics (neighborhoodId, propertyType, metricDate, period, adr, occupancyRate, revpar, totalListings, avgRating)
           VALUES (?, ?, DATE_SUB(NOW(), INTERVAL ? DAY), 'weekly', ?, ?, ?, ?, ?)`,
          [nbId, pt, daysAgo, ptAdr, ptOcc, Math.round(ptAdr * parseFloat(ptOcc) / 100), 3 + Math.floor(Math.random() * 8), (3.8 + Math.random() * 1.0).toFixed(2)]
        );
      }
    }
  }
  console.log("  ✓ Metrics data seeded");

  // 7. Demo scrape job
  await conn.execute("DELETE FROM scrape_jobs");
  await conn.execute(
    `INSERT INTO scrape_jobs (otaSourceId, status, jobType, listingsFound, listingsUpdated, priceSnapshots, errors, startedAt, completedAt, duration)
     VALUES (?, 'completed', 'full_scan', ?, ?, ?, 0, DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR), 3600)`,
    [otaMap["airbnb"], listingCount, listingCount, listingCount * 13]
  );
  console.log("  ✓ Demo scrape job seeded");

  console.log("\n✅ All reference data seeded successfully!");
  await conn.end();
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
