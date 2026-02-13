import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

async function seedAdmin() {
  const conn = await mysql.createConnection(DATABASE_URL);
  try {
    // Check if any admin user exists
    const [rows] = await conn.execute("SELECT id FROM users WHERE role = 'admin' AND username IS NOT NULL LIMIT 1");
    if (rows.length > 0) {
      console.log("Admin user already exists, skipping seed.");
      return;
    }

    // Hash password with 12 salt rounds
    const passwordHash = await bcrypt.hash("15001500", 12);

    await conn.execute(
      `INSERT INTO users (username, passwordHash, name, displayName, email, mobile, role, isActive, loginMethod, lastSignedIn)
       VALUES (?, ?, ?, ?, ?, ?, 'admin', true, 'local', NOW())
       ON DUPLICATE KEY UPDATE passwordHash = VALUES(passwordHash)`,
      ["Hobart", passwordHash, "Khalid Abdullah", "Admin", "hobarti@protonmail.com", "+966504466528"]
    );

    console.log("Root admin user seeded successfully:");
    console.log("  Username: Hobart");
    console.log("  Password: 15001500");
    console.log("  Role: admin");
  } finally {
    await conn.end();
  }
}

seedAdmin().catch(e => { console.error(e); process.exit(1); });
