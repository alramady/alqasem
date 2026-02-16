// Geocode all properties that don't have coordinates
// Usage: node scripts/geocode-properties.mjs

import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!DATABASE_URL || !FORGE_API_URL || !FORGE_API_KEY) {
  console.error("Missing env vars: DATABASE_URL, BUILT_IN_FORGE_API_URL, BUILT_IN_FORGE_API_KEY");
  process.exit(1);
}

async function geocode(address) {
  const url = new URL(`${FORGE_API_URL}/v1/maps/proxy/maps/api/geocode/json`);
  url.searchParams.append("key", FORGE_API_KEY);
  url.searchParams.append("address", address);
  url.searchParams.append("language", "ar");
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.status === "OK" && data.results?.[0]) {
    return data.results[0].geometry.location;
  }
  return null;
}

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  const [rows] = await conn.execute(
    "SELECT id, city, district, address FROM properties WHERE deletedAt IS NULL AND (latitude IS NULL OR longitude IS NULL)"
  );
  console.log(`Found ${rows.length} properties to geocode`);
  let updated = 0;
  for (const prop of rows) {
    const addr = `${prop.district || ""} ${prop.city || ""} السعودية`.trim();
    try {
      const loc = await geocode(addr);
      if (loc) {
        await conn.execute(
          "UPDATE properties SET latitude = ?, longitude = ? WHERE id = ?",
          [String(loc.lat), String(loc.lng), prop.id]
        );
        console.log(`✓ Property ${prop.id}: ${addr} → ${loc.lat}, ${loc.lng}`);
        updated++;
      } else {
        console.log(`✗ Property ${prop.id}: ${addr} → no results`);
      }
    } catch (e) {
      console.error(`✗ Property ${prop.id}: ${addr} → error: ${e.message}`);
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`\nDone: ${updated}/${rows.length} properties geocoded`);
  await conn.end();
}

main().catch(console.error);
