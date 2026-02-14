import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

async function run() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  // Get all active properties
  const [props] = await conn.query('SELECT id, title, propertyType FROM properties WHERE deletedAt IS NULL AND propertyStatus = "active" ORDER BY id');
  console.log(`Found ${props.length} active properties`);
  
  // Get all amenities
  const [amenitiesList] = await conn.query('SELECT id, nameEn FROM amenities ORDER BY id');
  console.log(`Found ${amenitiesList.length} amenities`);
  
  // Build amenity lookup by English name
  const amenityMap = {};
  amenitiesList.forEach(a => { amenityMap[a.nameEn] = a.id; });
  
  // Define base amenity assignments by property type
  const typeAmenities = {
    villa: [
      'Parking', 'Central AC', 'Equipped Kitchen', 'Maid Room', 'Driver Room',
      'Laundry Room', 'Storage Room', "Men's Majlis", "Women's Majlis",
      '24/7 Security', 'CCTV', 'Electronic Gate', 'Intercom',
      'Private Garden', 'BBQ Area',
      'Near Mosque', 'Near Schools'
    ],
    apartment: [
      'Parking', 'Elevator', 'Central AC', 'Equipped Kitchen',
      'Laundry Room', 'Balcony',
      '24/7 Security', 'CCTV', 'Intercom',
      'Near Mosque', 'Near Schools', 'Near Metro'
    ],
    land: [
      'Main Road', 'Near Mosque', 'Near Schools'
    ],
    commercial: [
      'Parking', 'Elevator', 'Central AC',
      '24/7 Security', 'CCTV', 'Alarm System', 'Electronic Gate',
      'Meeting Room',
      'Main Road', 'Commercial Front'
    ],
    office: [
      'Parking', 'Elevator', 'Central AC',
      '24/7 Security', 'CCTV', 'Intercom',
      'Meeting Room',
      'Near Metro', 'Main Road'
    ],
    building: [
      'Parking', 'Elevator', 'Central AC',
      '24/7 Security', 'CCTV', 'Electronic Gate', 'Intercom',
      'Near Mosque', 'Near Schools', 'Main Road'
    ]
  };
  
  // Extra amenities to randomly add for variety (rotate per property index)
  const extraAmenities = {
    villa: [
      ['Private Pool', 'Sauna/Spa', 'Gym/Fitness', 'Smart Home', 'Basement', 'Cinema Room', 'Panoramic View'],
      ['Shared Pool', 'Playground', 'Walking Track', 'Game Room', 'Fully Furnished'],
      ['Private Pool', 'Smart Home', 'Panoramic View', 'Gym/Fitness'],
    ],
    apartment: [
      ['Shared Pool', 'Shared Garden', 'Gym/Fitness', 'Playground'],
      ['Smart Home', 'Sea View', 'Panoramic View', 'Fully Furnished'],
      ['Shared Pool', 'Sauna/Spa', 'Game Room'],
    ],
    commercial: [
      ['Smart Home', 'Gym/Fitness'],
      ['Sauna/Spa'],
    ],
    office: [
      ['Smart Home', 'Game Room'],
      ['Gym/Fitness'],
    ],
    building: [
      ['Shared Pool', 'Shared Garden', 'Gym/Fitness', 'Playground'],
      ['Smart Home'],
    ],
    land: [
      ['Near Hospital', 'Near Metro'],
      ['Commercial Front'],
    ]
  };
  
  // Clear existing property_amenities
  await conn.query('DELETE FROM property_amenities');
  console.log('Cleared existing property_amenities');
  
  let totalInserted = 0;
  
  for (let i = 0; i < props.length; i++) {
    const prop = props[i];
    const type = prop.propertyType || 'villa';
    
    // Get base amenities for this type
    const baseNames = typeAmenities[type] || typeAmenities.villa;
    
    // Pick extra amenities based on property index for variety
    const extras = extraAmenities[type] || [];
    const extraSet = extras.length > 0 ? extras[i % extras.length] : [];
    
    // Combine and deduplicate
    const allNames = [...new Set([...baseNames, ...extraSet])];
    
    // Resolve to IDs
    const amenityIds = allNames
      .map(name => amenityMap[name])
      .filter(id => id !== undefined);
    
    if (amenityIds.length > 0) {
      const values = amenityIds.map(aid => `(${prop.id}, ${aid})`).join(',');
      await conn.query(`INSERT INTO property_amenities (propertyId, amenityId) VALUES ${values}`);
      totalInserted += amenityIds.length;
      console.log(`  Property ${prop.id} "${prop.title}" (${type}): ${amenityIds.length} amenities`);
    }
  }
  
  console.log(`\nDone! Inserted ${totalInserted} property-amenity associations`);
  
  // Verify
  const [count] = await conn.query('SELECT COUNT(*) as cnt FROM property_amenities');
  console.log(`Total records in property_amenities: ${count[0].cnt}`);
  
  await conn.end();
}

run().catch(e => { console.error(e); process.exit(1); });
