import { pool, db } from "./server/db";
import { users } from "@shared/schema";
import { storage } from "./server/storage";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

async function testDebug() {
  console.log("--- 1. Testing Database Connection ---");
  try {
    const res = await pool.query("SELECT NOW() as time;");
    console.log("✅ DB Connected successfully at:", res.rows[0].time);
  } catch (err: any) {
    console.error("❌ DB Connection Error:", err.message);
  }

  console.log("\n--- 2. Testing user_sessions Table ---");
  try {
    const sessionRes = await pool.query("SELECT COUNT(*) FROM user_sessions;");
    console.log("✅ user_sessions table exists, count:", sessionRes.rows[0].count);
  } catch (err: any) {
    console.error("❌ user_sessions table error:", err.message);
  }

  console.log("\n--- 3. Testing users Table ---");
  try {
    const userList = await db.select().from(users);
    console.log("✅ users table exists, found users:", userList.length);
    userList.forEach(u => console.log(`   - User: ${u.username}, role: ${u.role}, pass length: ${u.password?.length}`));
  } catch (err: any) {
    console.error("❌ users table error:", err.message);
  }

  console.log("\n--- 4. Testing Inspections query ---");
  try {
    const insp = await storage.getInspections();
    console.log("✅ Inspections query returned count:", insp.length);
  } catch (err: any) {
    console.error("❌ Inspections query error:", err.message);
  }

  console.log("\n--- 5. Testing PgSession store initialization ---");
  try {
    const PgSession = connectPgSimple(session);
    const store = new PgSession({
      pool,
      createTableIfMissing: true,
      tableName: "user_sessions",
    });
    console.log("✅ PgSession store initialized");
    
    // Test writing a session
    await new Promise<void>((resolve, reject) => {
      store.set("test-sid-" + Date.now(), { cookie: { maxAge: 86400000 }, isAuthenticated: true, username: "hs" } as any, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log("✅ Session written successfully to PostgreSQL!");
  } catch (err: any) {
    console.error("❌ PgSession write error:", err.message);
  }

  process.exit(0);
}

testDebug().catch((e) => {
  console.error("Global debug error:", e);
  process.exit(1);
});
