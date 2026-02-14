import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL is required"); process.exit(1); }

const db = drizzle(DATABASE_URL);

async function seedAdmin() {
  console.log("🔐 Seeding root admin account...");
  
  // Root admin credentials
  const adminPassword = process.env.ADMIN_PASSWORD || "15001500";
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  
  await db.execute(sql`
    INSERT INTO users (openId, username, passwordHash, displayName, name, fullName, email, phone, role, userStatus, loginMethod)
    VALUES ('root-admin-001', 'Hobart', ${passwordHash}, 'Admin', 'Khalid Abdullah', 'خالد عبدالله', 'hobarti@protonmail.com', '+966504466528', 'admin', 'active', 'local')
    ON DUPLICATE KEY UPDATE 
      username = 'Hobart',
      passwordHash = ${passwordHash}, 
      displayName = 'Admin',
      name = 'Khalid Abdullah',
      fullName = 'خالد عبدالله',
      email = 'hobarti@protonmail.com',
      phone = '+966504466528',
      role = 'admin', 
      userStatus = 'active'
  `);
  
  console.log(`  ✅ Root admin account seeded`);
  console.log(`     Name: Khalid Abdullah`);
  console.log(`     User ID: Hobart`);
  console.log(`     Email: hobarti@protonmail.com`);
  console.log(`     Mobile: +966504466528`);
  console.log(`     Display Name: Admin`);
  console.log(`     Role: admin`);
  
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
