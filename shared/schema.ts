import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
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
  make: text("make"),
  model: text("model"),
  year: integer("year"),
  color: text("color"),
  odometer: integer("odometer"),
  odometerPhoto: text("odometer_photo"), // Photo URL of odometer
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  status: text("status").default("draft"), // draft, completed
  notes: text("notes"),
  shareToken: text("share_token"), // Unique token for public sharing
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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

// Export Chat Models
export * from "./models/chat";
