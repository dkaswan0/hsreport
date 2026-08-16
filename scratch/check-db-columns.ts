import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function checkColumns() {
  console.log("Checking columns in inspections table...");
  const res = await db.execute(sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'inspections' 
    ORDER BY column_name;
  `);
  console.log("Existing columns:", res.rows.map((r: any) => `${r.column_name} (${r.data_type})`));
  process.exit(0);
}

checkColumns().catch((err) => {
  console.error("Column check error:", err);
  process.exit(1);
});
