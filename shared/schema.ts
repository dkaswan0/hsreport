import { pgTable, text, serial, integer, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("examiner"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inspections = pgTable("inspections", {
  id: serial("id").primaryKey(),
  vin: text("vin").notNull(),
  vinPhoto: text("vin_photo"), // Photo URL of VIN plate
  make: text("make"),
  model: text("model"),
  year: integer("year"),
  color: text("color"),
  odometer: integer("odometer"),
  odometerPhoto: text("odometer_photo"), // Photo URL of odometer
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  inspectionType: text("inspection_type"), // فحص شامل، ميكانيكا+كومبيوتر، الأجزاء الأساسية، فحوصات متنوعة
  customerSignature: text("customer_signature"), // Base64 signature image
  status: text("status").default("draft"), // draft, completed
  notes: text("notes"),
  shareToken: text("share_token"), // Unique token for public sharing
  // Car section photos for interactive report
  mainCarPhoto: text("main_car_photo"), // Main professional car photo for PDF
  // Exterior photos (outside the section)
  rearLeftDoorPhoto: text("rear_left_door_photo"), // صورة خارجية الباب الخلفي يسار
  rearRightDoorPhoto: text("rear_right_door_photo"), // صورة خارجية الباب الخلفي يمين
  frontLeftDoorPhoto: text("front_left_door_photo"), // صورة خارجية الباب الأمامي يسار
  frontRightDoorPhoto: text("front_right_door_photo"), // صورة خارجية الباب الأمامي يمين
  hoodPhoto: text("hood_photo"), // صورة خارجية الكبوت
  trunkPhoto: text("trunk_photo"), // صورة خارجية الشنطة
  // Interior photos (inside the section)
  rearLeftDoorInteriorPhoto: text("rear_left_door_interior_photo"), // صورة داخلية الباب الخلفي يسار
  rearRightDoorInteriorPhoto: text("rear_right_door_interior_photo"), // صورة داخلية الباب الخلفي يمين
  frontLeftDoorInteriorPhoto: text("front_left_door_interior_photo"), // صورة داخلية الباب الأمامي يسار
  frontRightDoorInteriorPhoto: text("front_right_door_interior_photo"), // صورة داخلية الباب الأمامي يمين
  hoodInteriorPhoto: text("hood_interior_photo"), // صورة داخلية حجرة المحرك
  trunkInteriorPhoto: text("trunk_interior_photo"), // صورة داخلية الشنطة والشاصي
  obdCodes: jsonb("obd_codes").$type<any[]>(), // Array of OBD fault codes: [{code, nameEn, nameAr, diagnosis, causes, solutions}]
  autelReportPdf: text("autel_report_pdf"), // Base64 encoded Autel PDF report
  autelReportName: text("autel_report_name"), // Original filename of Autel report
  paintReadings: jsonb("paint_readings").$type<Record<string, number>>(), // Record<string, number> mapping panel names to thickness in microns
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  vinIndex: index("vin_idx").on(table.vin),
  statusIndex: index("status_idx").on(table.status),
  shareTokenIndex: index("share_token_idx").on(table.shareToken)
}));

export const inspectionItems = pgTable("inspection_items", {
  id: serial("id").primaryKey(),
  inspectionId: integer("inspection_id").notNull(),
  category: text("category").notNull(), // Engine, Transmission, Body, etc.
  faultName: text("fault_name").notNull(),
  status: text("status").notNull(), // pass, fail, warning
  description: text("description"),
  severity: text("severity"), // low, medium, high
  imageUrl: text("image_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const faultLibrary = pgTable("fault_library", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  faultName: text("fault_name").notNull(),
  description: text("description"),
  severity: text("severity"),
});

// === RELATIONS ===

export const inspectionsRelations = relations(inspections, ({ many }) => ({
  items: many(inspectionItems),
}));

export const inspectionItemsRelations = relations(inspectionItems, ({ one }) => ({
  inspection: one(inspections, {
    fields: [inspectionItems.inspectionId],
    references: [inspections.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertInspectionSchema = createInsertSchema(inspections).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInspectionItemSchema = createInsertSchema(inspectionItems).omit({ id: true, createdAt: true });
export const insertFaultLibrarySchema = createInsertSchema(faultLibrary).omit({ id: true });

// === EXPLICIT TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = z.infer<typeof insertInspectionSchema>;

export type InspectionItem = typeof inspectionItems.$inferSelect;
export type InsertInspectionItem = z.infer<typeof insertInspectionItemSchema>;

export type FaultLibrary = typeof faultLibrary.$inferSelect;
export type InsertFaultLibrary = z.infer<typeof insertFaultLibrarySchema>;

// Request Types
export type CreateInspectionRequest = InsertInspection;
export type UpdateInspectionRequest = Partial<InsertInspection>;
export type CreateInspectionItemRequest = InsertInspectionItem;
export type UpdateInspectionItemRequest = Partial<InsertInspectionItem>;

// Response Types
export type InspectionResponse = Inspection & { items?: InspectionItem[] };
export type FaultLibraryResponse = FaultLibrary;

// === API KEYS ===

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull().unique(),
  keyPrefix: text("key_prefix").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({ id: true, createdAt: true, lastUsedAt: true });

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

// Export Chat Models
export * from "./models/chat";
