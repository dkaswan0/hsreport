CREATE TABLE "fault_library" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"fault_name" text NOT NULL,
	"description" text,
	"severity" text
);
--> statement-breakpoint
CREATE TABLE "inspection_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"inspection_id" integer NOT NULL,
	"category" text NOT NULL,
	"fault_name" text NOT NULL,
	"status" text NOT NULL,
	"description" text,
	"severity" text,
	"image_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inspections" (
	"id" serial PRIMARY KEY NOT NULL,
	"vin" text NOT NULL,
	"vin_photo" text,
	"make" text,
	"model" text,
	"year" integer,
	"color" text,
	"odometer" integer,
	"odometer_photo" text,
	"customer_name" text,
	"customer_phone" text,
	"inspection_type" text,
	"customer_signature" text,
	"status" text DEFAULT 'draft',
	"notes" text,
	"share_token" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'examiner',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;