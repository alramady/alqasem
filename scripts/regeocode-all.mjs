/**
 * Re-geocode ALL properties with improved address format.
 * Uses: "{district}, {city}, المملكة العربية السعودية" for better accuracy.
 * Also validates results against known city coordinate ranges.
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// Known city center coordinates for fallback and validation
const CITY_COORDS = {
  'الرياض': { lat: 24.7136, lng: 46.6753, latMin: 24.4, latMax: 25.1, lngMin: 46.4, lngMax: 47.1 },
  'جدة': { lat: 21.5433, lng: 39.1728, latMin: 21.3, latMax: 21.8, lngMin: 39.0, lngMax: 39.4 },
  'الدمام': { lat: 26.3927, lng: 50.0888, latMin: 26.2, latMax: 26.6, lngMin: 49.9, lngMax: 50.3 },
  'الخبر': { lat: 26.2172, lng: 50.1971, latMin: 26.1, latMax: 26.5, lngMin: 50.0, lngMax: 50.4 },
  'مكة المكرمة': { lat: 21.4225, lng: 39.8262, latMin: 21.3, latMax: 21.5, lngMin: 39.7, lngMax: 40.0 },
  'المدينة المنورة': { lat: 24.4672, lng: 39.6024, latMin: 24.3, latMax: 24.7, lngMin: 39.4, lngMax: 39.8 },
  'الطائف': { lat: 21.2703, lng: 40.4158, latMin: 21.1, latMax: 21.4, lngMin: 40.2, lngMax: 40.6 },
  'أبها': { lat: 18.2164, lng: 42.5053, latMin: 18.0, latMax: 18.4, lngMin: 42.3, lngMax: 42.7 },
  'تبوك': { lat: 28.3838, lng: 36.5550, latMin: 28.2, latMax: 28.6, lngMin: 36.3, lngMax: 36.8 },
  'نجران': { lat: 17.4933, lng: 44.1277, latMin: 17.3, latMax: 17.7, lngMin: 43.9, lngMax: 44.4 },
  'حائل': { lat: 27.5114, lng: 41.7208, latMin: 27.3, latMax: 27.7, lngMin: 41.5, lngMax: 41.9 },
  'القصيم': { lat: 26.3260, lng: 43.9750, latMin: 26.1, latMax: 26.5, lngMin: 43.7, lngMax: 44.2 },
};

// Known district coordinates for common districts (manually verified)
const DISTRICT_COORDS = {
  'الرياض_النرجس': { lat: 24.8343, lng: 46.6792 },
  'الرياض_حي النرجس': { lat: 24.8343, lng: 46.6792 },
  'الرياض_الملقا': { lat: 24.8143, lng: 46.6107 },
  'الرياض_الياسمين': { lat: 24.8245, lng: 46.6470 },
  'الرياض_العليا': { lat: 24.6951, lng: 46.6806 },
  'الرياض_الروضة': { lat: 24.6800, lng: 46.7300 },
  'الرياض_العارض': { lat: 24.8935, lng: 46.6060 },
  'الرياض_السليمانية': { lat: 24.7053, lng: 46.7066 },
  'الرياض_الصحافة': { lat: 24.7995, lng: 46.6438 },
  'الرياض_الورود': { lat: 24.7247, lng: 46.6817 },
  'جدة_الكورنيش': { lat: 21.5433, lng: 39.1728 },
  'جدة_الحمراء': { lat: 21.5292, lng: 39.1611 },
  'الدمام_الفيصلية': { lat: 26.3937, lng: 50.0714 },
  'الخبر_الكورنيش': { lat: 26.2857, lng: 50.2119 },
  'مكة المكرمة_العزيزية': { lat: 21.3891, lng: 39.8583 },
  'المدينة المنورة_العزيزية': { lat: 24.4672, lng: 39.6024 },
};

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL?.replace(/\/+$/, '');
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

async function geocodeAddress(address) {
  const url = new URL(`${FORGE_API_URL}/v1/maps/proxy/maps/api/geocode/json`);
  url.searchParams.append('key', FORGE_API_KEY);
  url.searchParams.append('address', address);
  url.searchParams.append('language', 'ar');
  url.searchParams.append('region', 'sa');
  url.searchParams.append('components', 'country:SA');
  
  const resp = await fetch(url.toString());
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return await resp.json();
}

function isInCity(lat, lng, city) {
  const range = CITY_COORDS[city];
  if (!range) return true; // Can't validate unknown cities
  return lat >= range.latMin && lat <= range.latMax && lng >= range.lngMin && lng <= range.lngMax;
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  const [rows] = await conn.execute(
    'SELECT id, title, city, district, address, latitude, longitude FROM properties ORDER BY id'
  );
  
  console.log(`Total properties: ${rows.length}`);
  
  let updated = 0;
  let failed = 0;
  let usedFallback = 0;
  
  for (const prop of rows) {
    const city = prop.city || 'الرياض';
    const district = prop.district || '';
    const districtKey = `${city}_${district}`;
    
    // Try geocoding with full address
    let lat, lng;
    let source = '';
    
    try {
      // Strategy 1: Use full address if available
      const addressParts = [];
      if (prop.address) addressParts.push(prop.address);
      else {
        if (district) addressParts.push(district);
        addressParts.push(city);
      }
      addressParts.push('المملكة العربية السعودية');
      const fullAddr = addressParts.join(', ');
      
      const result = await geocodeAddress(fullAddr);
      
      if (result.status === 'OK' && result.results?.[0]) {
        const loc = result.results[0].geometry.location;
        
        if (isInCity(loc.lat, loc.lng, city)) {
          lat = loc.lat;
          lng = loc.lng;
          source = 'geocoded';
        } else {
          // Geocoding returned wrong city - try with just district + city
          const simpleAddr = `حي ${district.replace('حي ', '')}, ${city}, المملكة العربية السعودية`;
          const result2 = await geocodeAddress(simpleAddr);
          
          if (result2.status === 'OK' && result2.results?.[0]) {
            const loc2 = result2.results[0].geometry.location;
            if (isInCity(loc2.lat, loc2.lng, city)) {
              lat = loc2.lat;
              lng = loc2.lng;
              source = 'geocoded-retry';
            }
          }
        }
      }
    } catch (e) {
      console.error(`  Geocode API error for #${prop.id}: ${e.message}`);
    }
    
    // Fallback: Use known district coordinates
    if (!lat || !lng) {
      const known = DISTRICT_COORDS[districtKey];
      if (known) {
        lat = known.lat;
        lng = known.lng;
        source = 'known-district';
        usedFallback++;
      } else {
        // Last resort: city center with small random offset
        const cityCoords = CITY_COORDS[city];
        if (cityCoords) {
          const offset = () => (Math.random() - 0.5) * 0.02; // ~1km random offset
          lat = cityCoords.lat + offset();
          lng = cityCoords.lng + offset();
          source = 'city-center-fallback';
          usedFallback++;
        } else {
          console.error(`  FAILED: No coords for #${prop.id} (${city} - ${district})`);
          failed++;
          continue;
        }
      }
    }
    
    // Update the database
    await conn.execute(
      'UPDATE properties SET latitude = ?, longitude = ? WHERE id = ?',
      [String(lat.toFixed(7)), String(lng.toFixed(7)), prop.id]
    );
    updated++;
    
    console.log(`  #${prop.id} ${city}/${district}: ${lat.toFixed(5)}, ${lng.toFixed(5)} [${source}]`);
    
    // Rate limit: 50ms between geocoding requests
    if (source.startsWith('geocoded')) {
      await new Promise(r => setTimeout(r, 50));
    }
  }
  
  console.log(`\nDone! Updated: ${updated}, Failed: ${failed}, Used fallback: ${usedFallback}`);
  await conn.end();
}

main().catch(console.error);
