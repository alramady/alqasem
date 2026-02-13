import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import crypto from "crypto";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL is required"); process.exit(1); }

const db = drizzle(DATABASE_URL);

async function seedAdmin() {
  console.log("🔐 Seeding root admin account...");
  
  // Use ADMIN_PASSWORD env var, or generate a random secure password
  let adminPassword = process.env.ADMIN_PASSWORD;
  let wasGenerated = false;
  if (!adminPassword) {
    adminPassword = crypto.randomBytes(16).toString("base64url").slice(0, 20);
    wasGenerated = true;
  }
  
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  
  await db.execute(sql`
    INSERT INTO users (openId, username, passwordHash, displayName, name, fullName, email, phone, role, userStatus, loginMethod)
    VALUES ('root-admin-001', 'admin', ${passwordHash}, 'خالد عبدالله', 'Khalid Abdullah', 'خالد عبدالله القاسم', 'admin@alqasem.com.sa', '0500051679', 'admin', 'active', 'local')
    ON DUPLICATE KEY UPDATE passwordHash = ${passwordHash}, role = 'admin', userStatus = 'active'
  `);
  
  if (wasGenerated) {
    console.log(`  ✅ Root admin account seeded (username: admin)`);
    console.log(`  🔑 Generated password: ${adminPassword}`);
    console.log(`  ⚠️  Save this password securely! It will not be shown again.`);
    console.log(`  💡 Tip: Set ADMIN_PASSWORD env var before running this script to use a custom password.`);
  } else {
    console.log(`  ✅ Root admin account seeded (username: admin, password from ADMIN_PASSWORD env var)`);
  }
  
  // Also seed permissions for all roles
  console.log("🔑 Seeding permissions...");
  const modules = ['dashboard', 'properties', 'projects', 'inquiries', 'pages', 'media', 'settings', 'users', 'reports', 'audit_log', 'notifications', 'messages', 'guides', 'permissions', 'partners'];
  
  for (const mod of modules) {
    // Admin gets full access
    await db.execute(sql`
      INSERT INTO permissions (permRole, module, canView, canCreate, canEdit, canDelete, canExport)
      VALUES ('admin', ${mod}, true, true, true, true, true)
      ON DUPLICATE KEY UPDATE canView=true, canCreate=true, canEdit=true, canDelete=true, canExport=true
    `);
    // Manager gets view, create, edit, export
    await db.execute(sql`
      INSERT INTO permissions (permRole, module, canView, canCreate, canEdit, canDelete, canExport)
      VALUES ('manager', ${mod}, true, true, true, false, true)
      ON DUPLICATE KEY UPDATE canView=true, canCreate=true, canEdit=true, canDelete=false, canExport=true
    `);
    // Staff gets view only
    await db.execute(sql`
      INSERT INTO permissions (permRole, module, canView, canCreate, canEdit, canDelete, canExport)
      VALUES ('staff', ${mod}, true, false, false, false, false)
      ON DUPLICATE KEY UPDATE canView=true, canCreate=false, canEdit=false, canDelete=false, canExport=false
    `);
  }
  
  console.log("  ✅ Permissions seeded for admin, manager, staff roles");
  console.log("\n🎉 Admin setup complete!");
  process.exit(0);
}

seedAdmin().catch(e => { console.error(e); process.exit(1); });
