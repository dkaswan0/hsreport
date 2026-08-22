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

const isLocal = process.env.DATABASE_URL.includes("localhost") || process.env.DATABASE_URL.includes("127.0.0.1");

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
export const db = drizzle(pool, { schema: { ...schema, ...chatSchema } });

pool.query(`
  CREATE TABLE IF NOT EXISTS "user_sessions" (
    "sid" varchar NOT NULL COLLATE "default",
    "sess" json NOT NULL,
    "expire" timestamp(6) NOT NULL,
    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("sid")
  );
  CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire" ON "user_sessions" ("expire");

  CREATE TABLE IF NOT EXISTS "inspection_sections" (
    "id" text PRIMARY KEY,
    "label" text NOT NULL,
    "label_en" text,
    "icon" text,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS "inspection_categories" (
    "id" text PRIMARY KEY,
    "section_id" text NOT NULL,
    "label" text NOT NULL,
    "label_en" text,
    "icon" text,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS "uploaded_media_blobs" (
    "id" text PRIMARY KEY,
    "filename" text NOT NULL,
    "mime_type" text NOT NULL,
    "byte_size" integer NOT NULL,
    "data_base64" text NOT NULL,
    "created_at" timestamp DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS "IDX_uploaded_media_blobs_created" ON "uploaded_media_blobs" ("created_at");

  ALTER TABLE "inspections" ADD COLUMN IF NOT EXISTS "vehicle_photos_meta" jsonb;
  ALTER TABLE "inspections" ADD COLUMN IF NOT EXISTS "vehicle_photos_audit" jsonb;
  ALTER TABLE "inspections" ADD COLUMN IF NOT EXISTS "video_url" text;
  ALTER TABLE "inspections" ADD COLUMN IF NOT EXISTS "media_gallery" jsonb;

  ALTER TABLE "inspection_items" ADD COLUMN IF NOT EXISTS "description" text;
  ALTER TABLE "inspection_items" ADD COLUMN IF NOT EXISTS "notes" text;
  ALTER TABLE "inspection_items" ADD COLUMN IF NOT EXISTS "image_url" text;
  ALTER TABLE "inspection_items" ADD COLUMN IF NOT EXISTS "severity" text DEFAULT 'medium';
`).catch(err => console.error("Database tables init warning:", err?.message || err));

