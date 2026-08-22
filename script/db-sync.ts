import pg from "pg";

async function syncDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log("==> No DATABASE_URL found, skipping db-sync gracefully.");
    process.exit(0);
  }

  const isLocal = dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1");
  const pool = new pg.Pool({
    connectionString: dbUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  console.log("==> High Safety Auto DB Sync starting...");
  try {
    const res = await pool.query("SELECT NOW() as current_time;");
    console.log("==> Connected to PostgreSQL database at:", res.rows[0].current_time);

    // Create all tables safely with IF NOT EXISTS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "user_sessions" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("sid")
      );
      CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire" ON "user_sessions" ("expire");

      CREATE TABLE IF NOT EXISTS "users" (
        "id" serial PRIMARY KEY,
        "username" text NOT NULL UNIQUE,
        "password" text NOT NULL,
        "role" text DEFAULT 'admin' NOT NULL,
        "created_at" timestamp DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "inspections" (
        "id" serial PRIMARY KEY,
        "vin" text NOT NULL,
        "vin_photo" text,
        "make" text NOT NULL,
        "model" text NOT NULL,
        "year" integer NOT NULL,
        "color" text,
        "odometer" integer,
        "odometer_photo" text,
        "customer_name" text,
        "customer_phone" text,
        "inspection_type" text DEFAULT 'فحص شامل',
        "customer_signature" text,
        "status" text DEFAULT 'draft' NOT NULL,
        "notes" text,
        "share_token" text UNIQUE,
        "main_car_photo" text,
        "rear_left_door_photo" text,
        "rear_right_door_photo" text,
        "front_left_door_photo" text,
        "front_right_door_photo" text,
        "hood_photo" text,
        "trunk_photo" text,
        "rear_left_door_interior_photo" text,
        "rear_right_door_interior_photo" text,
        "front_left_door_interior_photo" text,
        "front_right_door_interior_photo" text,
        "hood_interior_photo" text,
        "trunk_interior_photo" text,
        "obd_codes" jsonb,
        "autel_report_pdf" text,
        "autel_report_name" text,
        "mojaz_record" jsonb,
        "mojaz_analysis" jsonb,
        "vehicle_photos_meta" jsonb,
        "vehicle_photos_audit" jsonb,
        "video_url" text,
        "media_gallery" jsonb,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "inspection_items" (
        "id" serial PRIMARY KEY,
        "inspection_id" integer NOT NULL,
        "category" text NOT NULL,
        "fault_name" text NOT NULL,
        "status" text DEFAULT 'fail' NOT NULL,
        "severity" text DEFAULT 'medium',
        "notes" text,
        "image_url" text,
        "created_at" timestamp DEFAULT now()
      );

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

      CREATE TABLE IF NOT EXISTS "api_keys" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "key_hash" text NOT NULL UNIQUE,
        "key_prefix" text NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "last_used_at" timestamp,
        "is_active" boolean DEFAULT true NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "fault_library" (
        "id" serial PRIMARY KEY,
        "category" text NOT NULL,
        "fault_name" text NOT NULL,
        "description" text,
        "severity" text DEFAULT 'medium',
        "is_common" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now()
      );
    `);

    console.log("==> High Safety Auto DB Sync completed successfully! 🎉");
    await pool.end();
    process.exit(0);
  } catch (err: any) {
    console.warn("==> DB Sync Notice:", err.message);
    // Exit with 0 so Render deployment is never blocked
    process.exit(0);
  }
}

syncDatabase();
