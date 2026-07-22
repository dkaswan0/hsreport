CREATE TABLE "api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"last_used_at" timestamp,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
ALTER TABLE "inspections" ADD COLUMN "main_car_photo" text;--> statement-breakpoint
ALTER TABLE "inspections" ADD COLUMN "rear_left_door_photo" text;--> statement-breakpoint
ALTER TABLE "inspections" ADD COLUMN "rear_right_door_photo" text;--> statement-breakpoint
ALTER TABLE "inspections" ADD COLUMN "front_left_door_photo" text;--> statement-breakpoint
ALTER TABLE "inspections" ADD COLUMN "front_right_door_photo" text;--> statement-breakpoint
ALTER TABLE "inspections" ADD COLUMN "hood_photo" text;--> statement-breakpoint
ALTER TABLE "inspections" ADD COLUMN "trunk_photo" text;--> statement-breakpoint
ALTER TABLE "inspections" ADD COLUMN "rear_left_door_interior_photo" text;--> statement-breakpoint
ALTER TABLE "inspections" ADD COLUMN "rear_right_door_interior_photo" text;--> statement-breakpoint
ALTER TABLE "inspections" ADD COLUMN "front_left_door_interior_photo" text;--> statement-breakpoint
ALTER TABLE "inspections" ADD COLUMN "front_right_door_interior_photo" text;--> statement-breakpoint
ALTER TABLE "inspections" ADD COLUMN "hood_interior_photo" text;--> statement-breakpoint
ALTER TABLE "inspections" ADD COLUMN "trunk_interior_photo" text;--> statement-breakpoint
ALTER TABLE "inspections" ADD COLUMN "obd_codes" jsonb;--> statement-breakpoint
ALTER TABLE "inspections" ADD COLUMN "autel_report_pdf" text;--> statement-breakpoint
ALTER TABLE "inspections" ADD COLUMN "autel_report_name" text;--> statement-breakpoint
ALTER TABLE "inspections" ADD COLUMN "mojaz_record" text;--> statement-breakpoint
ALTER TABLE "inspections" ADD COLUMN "mojaz_analysis" jsonb;--> statement-breakpoint
CREATE INDEX "vin_idx" ON "inspections" USING btree ("vin");--> statement-breakpoint
CREATE INDEX "status_idx" ON "inspections" USING btree ("status");--> statement-breakpoint
CREATE INDEX "share_token_idx" ON "inspections" USING btree ("share_token");