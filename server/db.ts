import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import * as chatSchema from "@shared/models/chat";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema: { ...schema, ...chatSchema } });

pool.query(`
  CREATE TABLE IF NOT EXISTS "user_sessions" (
    "sid" varchar NOT NULL COLLATE "default",
    "sess" json NOT NULL,
    "expire" timestamp(6) NOT NULL,
    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("sid")
  );
  CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire" ON "user_sessions" ("expire");
`).catch(err => console.error("Session table init warning:", err?.message || err));

