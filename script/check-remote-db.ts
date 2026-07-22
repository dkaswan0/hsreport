import pg from "pg";

const connectionString = "postgresql://high_safety_db_user:7knxyr6dGGcf4fEQIXpJH8HEUQqaun9f@dpg-d9f2qdb7uimc73aipemg-a.virginia-postgres.render.com/high_safety_db";

async function checkDb() {
  const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  
  try {
    console.log("Connecting to Render PostgreSQL database...");
    
    // Check tables list
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public'
    `);
    console.log("Tables in database:", tablesRes.rows.map(r => r.table_name));

    // Check users
    const usersRes = await pool.query("SELECT id, username FROM users");
    console.log("Users in database:", usersRes.rows);

    // Check sessions
    const sessionsRes = await pool.query("SELECT COUNT(*) FROM user_sessions");
    console.log("Total sessions:", sessionsRes.rows[0].count);

    // Check inspections
    const inspectionsRes = await pool.query("SELECT id, vin, status FROM inspections");
    console.log("Inspections in database:", inspectionsRes.rows);

  } catch (error) {
    console.error("DB check failed:", error);
  } finally {
    await pool.end();
  }
}

checkDb();
