import pg from "pg";

const connectionString = "postgresql://high_safety_db_user:7knxyr6dGGcf4fEQIXpJH8HEUQqaun9f@dpg-d9f2qdb7uimc73aipemg-a.virginia-postgres.render.com/high_safety_db";

async function createSessionTable() {
  const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  
  try {
    console.log("Connecting to Render PostgreSQL to create session table...");
    
    // Create table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "user_sessions" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      )
      WITH (OIDS=FALSE);
    `);
    console.log("Created user_sessions table.");

    // Add primary key constraint if not exists
    try {
      await pool.query(`
        ALTER TABLE "user_sessions" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
      `);
      console.log("Added primary key constraint.");
    } catch (e) {
      console.log("Primary key constraint might already exist.");
    }

    // Add index if not exists
    try {
      await pool.query(`
        CREATE INDEX "IDX_session_expire" ON "user_sessions" ("expire");
      `);
      console.log("Created IDX_session_expire index.");
    } catch (e) {
      console.log("Index might already exist.");
    }

    console.log("Database session table successfully initialized!");

  } catch (error) {
    console.error("Failed to create session table:", error);
  } finally {
    await pool.end();
  }
}

createSessionTable();
