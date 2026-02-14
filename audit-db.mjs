import { db } from './server/db.ts';
import { properties, projects, pages, inquiries, users, siteSettings, homepageSections, media, cities, districts, activityLogs, userSessions, notifications } from './drizzle/schema.ts';
import { sql, eq } from 'drizzle-orm';

async function main() {
  const tables = [
    ['properties', properties],
    ['projects', projects],
    ['pages', pages],
    ['inquiries', inquiries],
    ['users', users],
    ['siteSettings', siteSettings],
    ['homepageSections', homepageSections],
    ['media', media],
    ['cities', cities],
    ['districts', districts],
    ['activityLogs', activityLogs],
    ['userSessions', userSessions],
    ['notifications', notifications],
  ];
  
  const counts = {};
  for (const [name, table] of tables) {
    const result = await db.select({ c: sql`count(*)` }).from(table);
    counts[name] = result[0].c;
  }
  console.log('=== DATABASE TABLE COUNTS ===');
  console.log(JSON.stringify(counts, null, 2));
  
  // Check password hashing
  const allUsers = await db.select({ id: users.id, username: users.username, role: users.role, password: users.password }).from(users);
  console.log('\n=== USERS (password hashing check) ===');
  for (const u of allUsers) {
    const isHashed = u.password?.startsWith('$2') || false;
    console.log(`  ${u.username} (${u.role}): password ${isHashed ? '✅ HASHED (bcrypt)' : '❌ NOT HASHED'}`);
  }
  
  // Check a sample property has real data
  const sampleProp = await db.select().from(properties).limit(1);
  if (sampleProp.length > 0) {
    console.log('\n=== SAMPLE PROPERTY ===');
    console.log(`  Title: ${sampleProp[0].title}`);
    console.log(`  Price: ${sampleProp[0].price}`);
    console.log(`  City: ${sampleProp[0].city}`);
    console.log(`  Status: ${sampleProp[0].status}`);
    console.log(`  Images: ${sampleProp[0].images ? JSON.parse(sampleProp[0].images).length : 0}`);
  }
  
  // Check DB is remote (not localhost)
  const dbUrl = process.env.DATABASE_URL || '';
  const isRemote = !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1');
  console.log(`\n=== DATABASE CONNECTION ===`);
  console.log(`  Remote (production): ${isRemote ? '✅ YES' : '❌ NO (localhost)'}`);
  console.log(`  URL pattern: ${dbUrl.replace(/:[^:@]+@/, ':***@').substring(0, 80)}...`);
  
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
