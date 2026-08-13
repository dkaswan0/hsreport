import { VehiclePhotoSlotMeta, VehiclePhotoAuditEntry } from "@shared/schema";
import { db } from "./db";
import {
  inspections, inspectionItems, faultLibrary, apiKeys,
  inspectionSections, inspectionCategories,
  type Inspection, type InsertInspection, type UpdateInspectionRequest,
  type InspectionItem, type InsertInspectionItem, type UpdateInspectionItemRequest,
  type FaultLibrary, type InsertFaultLibrary,
  type ApiKey,
  type InspectionSection, type InsertInspectionSection,
  type InspectionCategory, type InsertInspectionCategory,
} from "@shared/schema";
import { eq, ilike, desc, asc, inArray } from "drizzle-orm";

export interface IStorage {
  // Inspections
  getInspections(search?: string, status?: string): Promise<Inspection[]>;
  getInspection(id: number): Promise<Inspection | undefined>;
  getInspectionWithItems(id: number): Promise<Inspection & { items: InspectionItem[] } | undefined>;
  getInspectionByToken(token: string): Promise<Inspection & { items: InspectionItem[] } | undefined>;
  generateShareToken(id: number): Promise<string>;
  createInspection(inspection: InsertInspection): Promise<Inspection>;
  updateInspection(id: number, updates: UpdateInspectionRequest): Promise<Inspection>;
  updateInspectionPhotoMeta(
    id: number,
    slotKey: string,
    metaUpdates: Partial<VehiclePhotoSlotMeta>,
    auditEntry?: VehiclePhotoAuditEntry
  ): Promise<Inspection>;
  deleteInspection(id: number): Promise<void>;
  deleteMultipleInspections(ids: number[]): Promise<number>;

  // Inspection Items
  createInspectionItem(item: InsertInspectionItem): Promise<InspectionItem>;
  updateInspectionItem(id: number, updates: UpdateInspectionItemRequest): Promise<InspectionItem>;
  deleteInspectionItem(id: number): Promise<void>;

  // Fault Library
  getFaultLibrary(search?: string): Promise<FaultLibrary[]>;
  createFault(fault: InsertFaultLibrary): Promise<FaultLibrary>;
  deleteFault(id: number): Promise<boolean>;

  // API Keys
  getApiKeys(): Promise<ApiKey[]>;
  createApiKey(name: string, keyHash: string, keyPrefix: string): Promise<ApiKey>;
  getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined>;
  touchApiKey(id: number): Promise<void>;
  revokeApiKey(id: number): Promise<boolean>;

  // Dynamic Inspection Sections
  getInspectionSections(): Promise<InspectionSection[]>;
  createInspectionSection(section: InsertInspectionSection): Promise<InspectionSection>;
  updateInspectionSection(id: string, updates: Partial<InsertInspectionSection>): Promise<InspectionSection>;
  deleteInspectionSection(id: string): Promise<boolean>;
  reorderInspectionSections(ids: string[]): Promise<boolean>;

  // Dynamic Inspection Categories
  getInspectionCategories(sectionId?: string): Promise<InspectionCategory[]>;
  createInspectionCategory(category: InsertInspectionCategory): Promise<InspectionCategory>;
  updateInspectionCategory(id: string, updates: Partial<InsertInspectionCategory>): Promise<InspectionCategory>;
  deleteInspectionCategory(id: string): Promise<boolean>;
  reorderInspectionCategories(ids: string[]): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Inspections
  async getInspections(search?: string, status?: string): Promise<Inspection[]> {
    let query = db.select().from(inspections).orderBy(desc(inspections.createdAt));
    
    if (search) {
      // Simple search by VIN or Customer Name
      // Note: In a real app, use more complex filtering
    }
    
    return await query;
  }

  async getInspection(id: number): Promise<Inspection | undefined> {
    const [inspection] = await db.select().from(inspections).where(eq(inspections.id, id));
    return inspection;
  }

  async getInspectionWithItems(id: number): Promise<Inspection & { items: InspectionItem[] } | undefined> {
    const inspection = await this.getInspection(id);
    if (!inspection) return undefined;

    const items = await db.select().from(inspectionItems).where(eq(inspectionItems.inspectionId, id));
    return { ...inspection, items };
  }

  async getInspectionByToken(token: string): Promise<Inspection & { items: InspectionItem[] } | undefined> {
    const cleanToken = (token || "").trim();
    if (!cleanToken) return undefined;

    let inspection: Inspection | undefined = undefined;

    // 1. Check by shareToken first
    const [byToken] = await db.select().from(inspections).where(eq(inspections.shareToken, cleanToken));
    inspection = byToken;

    // 2. Fallback: check by numeric ID if parameter is a number
    if (!inspection) {
      const numId = Number(cleanToken);
      if (!isNaN(numId) && numId > 0) {
        const [byId] = await db.select().from(inspections).where(eq(inspections.id, numId));
        inspection = byId;
      }
    }

    // 3. Fallback: check by VIN
    if (!inspection) {
      const [byVin] = await db.select().from(inspections).where(eq(inspections.vin, cleanToken));
      inspection = byVin;
    }

    if (!inspection) return undefined;

    const items = await db.select().from(inspectionItems).where(eq(inspectionItems.inspectionId, inspection.id));
    return { ...inspection, items };
  }

  async generateShareToken(id: number): Promise<string> {
    // Check if inspection exists
    const existing = await this.getInspection(id);
    if (!existing) {
      throw new Error('Inspection not found');
    }
    
    // Return existing token if already generated
    if (existing.shareToken) {
      return existing.shareToken;
    }
    
    // Generate cryptographically secure token using crypto.randomUUID
    const token = crypto.randomUUID().replace(/-/g, '');
    
    await db.update(inspections)
      .set({ shareToken: token, updatedAt: new Date() })
      .where(eq(inspections.id, id));
    
    return token;
  }

  async createInspection(inspection: InsertInspection): Promise<Inspection> {
    const [newInspection] = await db.insert(inspections).values(inspection).returning();
    return newInspection;
  }

  async updateInspection(id: number, updates: UpdateInspectionRequest): Promise<Inspection> {
    const [updated] = await db.update(inspections)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(inspections.id, id))
      .returning();
    return updated;
  }
  async updateInspectionPhotoMeta(
    id: number,
    slotKey: string,
    metaUpdates: Partial<VehiclePhotoSlotMeta>,
    auditEntry?: VehiclePhotoAuditEntry
  ): Promise<Inspection> {
    const existing = await this.getInspection(id);
    if (!existing) {
      throw new Error(`Inspection #${id} not found`);
    }

    const currentMetaMap = (existing.vehiclePhotosMeta as Record<string, VehiclePhotoSlotMeta>) || {};
    const existingSlotMeta = currentMetaMap[slotKey] || {
      originalUrl: (existing as any)[slotKey] || '',
      activeMode: 'original',
      processingStatus: 'idle',
    };

    const updatedSlotMeta: VehiclePhotoSlotMeta = {
      ...existingSlotMeta,
      ...metaUpdates,
    };

    const newMetaMap = {
      ...currentMetaMap,
      [slotKey]: updatedSlotMeta,
    };

    // Determine the active display image for the root slot column
    const activePhotoUrl = updatedSlotMeta.activeMode === 'processed' && updatedSlotMeta.processedUrl
      ? updatedSlotMeta.processedUrl
      : updatedSlotMeta.originalUrl;

    const currentAuditList = (existing.vehiclePhotosAudit as VehiclePhotoAuditEntry[]) || [];
    const newAuditList = auditEntry ? [auditEntry, ...currentAuditList.slice(0, 49)] : currentAuditList;

    const updates: any = {
      vehiclePhotosMeta: newMetaMap,
      vehiclePhotosAudit: newAuditList,
      updatedAt: new Date(),
    };

    if (activePhotoUrl) {
      updates[slotKey] = activePhotoUrl;
    }

    const [updated] = await db.update(inspections)
      .set(updates)
      .where(eq(inspections.id, id))
      .returning();

    return updated;
  }


  async deleteInspection(id: number): Promise<void> {
    await db.delete(inspectionItems).where(eq(inspectionItems.inspectionId, id));
    await db.delete(inspections).where(eq(inspections.id, id));
  }

  async deleteMultipleInspections(ids: number[]): Promise<number> {
    if (ids.length === 0) return 0;
    return await db.transaction(async (tx) => {
      await tx.delete(inspectionItems).where(inArray(inspectionItems.inspectionId, ids));
      const result = await tx.delete(inspections).where(inArray(inspections.id, ids)).returning();
      return result.length;
    });
  }

  // Inspection Items
  async createInspectionItem(item: InsertInspectionItem): Promise<InspectionItem> {
    const [newItem] = await db.insert(inspectionItems).values({
      ...item,
      imageUrl: item.imageUrl // Explicitly ensure imageUrl is mapped
    }).returning();
    return newItem;
  }

  async updateInspectionItem(id: number, updates: UpdateInspectionItemRequest): Promise<InspectionItem> {
    const [updated] = await db.update(inspectionItems)
      .set(updates)
      .where(eq(inspectionItems.id, id))
      .returning();
    return updated;
  }

  async deleteInspectionItem(id: number): Promise<void> {
    await db.delete(inspectionItems).where(eq(inspectionItems.id, id));
  }

  // Fault Library
  async getFaultLibrary(search?: string): Promise<FaultLibrary[]> {
    if (search) {
      return await db.select().from(faultLibrary).where(ilike(faultLibrary.faultName, `%${search}%`));
    }
    return await db.select().from(faultLibrary);
  }

  async createFault(fault: InsertFaultLibrary): Promise<FaultLibrary> {
    const [newFault] = await db.insert(faultLibrary).values(fault).returning();
    return newFault;
  }

  async deleteFault(id: number): Promise<boolean> {
    const result = await db.delete(faultLibrary).where(eq(faultLibrary.id, id)).returning();
    return result.length > 0;
  }

  // API Keys
  async getApiKeys(): Promise<ApiKey[]> {
    return await db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
  }

  async createApiKey(name: string, keyHash: string, keyPrefix: string): Promise<ApiKey> {
    const [key] = await db.insert(apiKeys).values({ name, keyHash, keyPrefix, isActive: true }).returning();
    return key;
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined> {
    const [key] = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash));
    return key;
  }

  async touchApiKey(id: number): Promise<void> {
    await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, id));
  }

  async revokeApiKey(id: number): Promise<boolean> {
    const result = await db.delete(apiKeys).where(eq(apiKeys.id, id)).returning();
    return result.length > 0;
  }

  // === Dynamic Inspection Sections & Categories ===

  private async ensureDefaultSectionsAndCategories(): Promise<void> {
    try {
      const existingSections = await db.select().from(inspectionSections);
      if (existingSections.length === 0) {
        const DEFAULT_SECTIONS: InsertInspectionSection[] = [
          { id: "mechanic", label: "الميكانيكا", labelEn: "MECHANIC", icon: "wrench", sortOrder: 1, isDefault: true, isActive: true },
          { id: "transmission", label: "ناقل الحركة", labelEn: "TRANSMISSION", icon: "gear", sortOrder: 2, isDefault: true, isActive: true },
          { id: "body", label: "الهيكل الخارجي", labelEn: "BODY", icon: "car", sortOrder: 3, isDefault: true, isActive: true },
          { id: "chassis", label: "الشاصي", labelEn: "CHASSIS", icon: "shield", sortOrder: 4, isDefault: true, isActive: true },
          { id: "electric", label: "الكهرباء والإلكترونيات", labelEn: "ELECTRIC", icon: "lightning", sortOrder: 5, isDefault: true, isActive: true },
          { id: "interior", label: "الداخلية والسلامة والملحقات", labelEn: "INTERIOR & SAFETY", icon: "chair", sortOrder: 6, isDefault: true, isActive: true },
        ];

        for (const sec of DEFAULT_SECTIONS) {
          await db.insert(inspectionSections).values(sec).onConflictDoNothing();
        }

        const DEFAULT_CATEGORIES: InsertInspectionCategory[] = [
          // 1. الميكانيكا
          { id: "engine", sectionId: "mechanic", label: "المحرك", labelEn: "Engine", sortOrder: 1, isDefault: true, isActive: true },
          { id: "suspension_system", sectionId: "mechanic", label: "نظام التعليق", labelEn: "Suspension System", sortOrder: 2, isDefault: true, isActive: true },
          { id: "steering_system", sectionId: "mechanic", label: "نظام التوجيه", labelEn: "Steering System", sortOrder: 3, isDefault: true, isActive: true },
          { id: "brake_system", sectionId: "mechanic", label: "نظام الفرامل", labelEn: "Brake System", sortOrder: 4, isDefault: true, isActive: true },
          { id: "fuel_exhaust", sectionId: "mechanic", label: "نظام الوقود والعادم", labelEn: "Fuel & Exhaust System", sortOrder: 5, isDefault: true, isActive: true },
          { id: "ac_cooling", sectionId: "mechanic", label: "نظام التكييف والتبريد", labelEn: "AC & Cooling System", sortOrder: 6, isDefault: true, isActive: true },

          // 2. ناقل الحركة
          { id: "transmission_main", sectionId: "transmission", label: "ناقل الحركة", labelEn: "Transmission", sortOrder: 1, isDefault: true, isActive: true },
          { id: "transmission_performance", sectionId: "transmission", label: "أداء واستجابة القير", labelEn: "Transmission Performance", sortOrder: 2, isDefault: true, isActive: true },
          { id: "transmission_shifting", sectionId: "transmission", label: "التبديل والتعشيق", labelEn: "Gear Shifting", sortOrder: 3, isDefault: true, isActive: true },
          { id: "transmission_sounds_leaks", sectionId: "transmission", label: "التسريبات والأصوات", labelEn: "Leaks & Sounds", sortOrder: 4, isDefault: true, isActive: true },

          // 3. الهيكل الخارجي
          { id: "doors", sectionId: "body", label: "الأبواب", labelEn: "Doors", sortOrder: 1, isDefault: true, isActive: true },
          { id: "hood", sectionId: "body", label: "غطاء المحرك", labelEn: "Hood", sortOrder: 2, isDefault: true, isActive: true },
          { id: "trunk", sectionId: "body", label: "صندوق الأمتعة", labelEn: "Trunk", sortOrder: 3, isDefault: true, isActive: true },
          { id: "fenders", sectionId: "body", label: "الرفارف", labelEn: "Fenders", sortOrder: 4, isDefault: true, isActive: true },
          { id: "quarter_panels", sectionId: "body", label: "الألواح الجانبية", labelEn: "Quarter Panels", sortOrder: 5, isDefault: true, isActive: true },
          { id: "roof_pillars", sectionId: "body", label: "السقف والقوائم", labelEn: "Roof & Pillars", sortOrder: 6, isDefault: true, isActive: true },
          { id: "bumpers", sectionId: "body", label: "الصدامات", labelEn: "Bumpers", sortOrder: 7, isDefault: true, isActive: true },

          // 4. الشاصي
          { id: "chassis_frame", sectionId: "chassis", label: "الشاصي والإطار", labelEn: "Chassis & Frame", sortOrder: 1, isDefault: true, isActive: true },
          { id: "chassis_alignment", sectionId: "chassis", label: "استقامة الشاصي", labelEn: "Chassis Alignment", sortOrder: 2, isDefault: true, isActive: true },
          { id: "chassis_welding", sectionId: "chassis", label: "القص واللحام", labelEn: "Cutting & Welding", sortOrder: 3, isDefault: true, isActive: true },
          { id: "chassis_modifications", sectionId: "chassis", label: "التعديل", labelEn: "Modifications", sortOrder: 4, isDefault: true, isActive: true },
          { id: "chassis_accident", sectionId: "chassis", label: "آثار الحوادث والصدمات", labelEn: "Accident Damage", sortOrder: 5, isDefault: true, isActive: true },

          // 5. الكهرباء والإلكترونيات
          { id: "battery", sectionId: "electric", label: "البطارية", labelEn: "Battery", sortOrder: 1, isDefault: true, isActive: true },
          { id: "charging_system", sectionId: "electric", label: "نظام الشحن", labelEn: "Charging System", sortOrder: 2, isDefault: true, isActive: true },
          { id: "wire_harness", sectionId: "electric", label: "الأسلاك والضفيرة", labelEn: "Wire Harness", sortOrder: 3, isDefault: true, isActive: true },
          { id: "lighting", sectionId: "electric", label: "الإضاءة", labelEn: "Lighting", sortOrder: 4, isDefault: true, isActive: true },
          { id: "mirror_controls", sectionId: "electric", label: "المرايا الكهربائية", labelEn: "Mirror Controls", sortOrder: 5, isDefault: true, isActive: true },
          { id: "sensors", sectionId: "electric", label: "الحساسات", labelEn: "Sensors", sortOrder: 6, isDefault: true, isActive: true },
          { id: "electronic_modules", sectionId: "electric", label: "الوحدات الإلكترونية", labelEn: "Electronic Control Units", sortOrder: 7, isDefault: true, isActive: true },

          // 6. الداخلية والسلامة والملحقات
          { id: "interior_cabin", sectionId: "interior", label: "المقصورة الداخلية", labelEn: "Interior Cabin", sortOrder: 1, isDefault: true, isActive: true },
          { id: "seats_upholstery", sectionId: "interior", label: "المقاعد والفرش", labelEn: "Seats & Upholstery", sortOrder: 2, isDefault: true, isActive: true },
          { id: "seatbelts", sectionId: "interior", label: "أحزمة الأمان", labelEn: "Seatbelts", sortOrder: 3, isDefault: true, isActive: true },
          { id: "airbags", sectionId: "interior", label: "الوسائد الهوائية", labelEn: "Airbags", sortOrder: 4, isDefault: true, isActive: true },
          { id: "tires_rims", sectionId: "interior", label: "الإطارات والجنوط", labelEn: "Tires & Rims", sortOrder: 5, isDefault: true, isActive: true },
          { id: "windows_glass", sectionId: "interior", label: "الزجاج والنوافذ", labelEn: "Windows & Glass", sortOrder: 6, isDefault: true, isActive: true },
          { id: "mirrors", sectionId: "interior", label: "المرايا", labelEn: "Mirrors", sortOrder: 7, isDefault: true, isActive: true },
        ];

        for (const cat of DEFAULT_CATEGORIES) {
          await db.insert(inspectionCategories).values(cat).onConflictDoNothing();
        }
      }
    } catch (e) {
      console.error("Default sections seeding error:", e);
    }
  }

  async getInspectionSections(): Promise<InspectionSection[]> {
    await this.ensureDefaultSectionsAndCategories();
    return await db.select().from(inspectionSections).orderBy(asc(inspectionSections.sortOrder), asc(inspectionSections.createdAt));
  }

  async createInspectionSection(section: InsertInspectionSection): Promise<InspectionSection> {
    const cleanLabel = section.label.trim();
    // Check duplicate label
    const existing = await db.select().from(inspectionSections).where(ilike(inspectionSections.label, cleanLabel));
    if (existing.length > 0) {
      throw new Error(`يوجد قسم آخر بنفس الاسم: "${cleanLabel}"`);
    }

    // Auto calculate sortOrder if not provided
    let sortOrder = section.sortOrder;
    if (sortOrder === undefined || sortOrder === 0) {
      const all = await db.select().from(inspectionSections);
      sortOrder = all.length + 1;
    }

    const id = section.id || `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const [newSection] = await db.insert(inspectionSections).values({
      ...section,
      id,
      label: cleanLabel,
      sortOrder,
    }).returning();

    return newSection;
  }

  async updateInspectionSection(id: string, updates: Partial<InsertInspectionSection>): Promise<InspectionSection> {
    if (updates.label) {
      const cleanLabel = updates.label.trim();
      const existing = await db.select().from(inspectionSections).where(ilike(inspectionSections.label, cleanLabel));
      if (existing.some(s => s.id !== id)) {
        throw new Error(`يوجد قسم آخر بنفس الاسم: "${cleanLabel}"`);
      }
      updates.label = cleanLabel;
    }

    const [updated] = await db.update(inspectionSections)
      .set(updates)
      .where(eq(inspectionSections.id, id))
      .returning();

    return updated;
  }

  async deleteInspectionSection(id: string): Promise<boolean> {
    // Delete categories under this section first
    await db.delete(inspectionCategories).where(eq(inspectionCategories.sectionId, id));
    const result = await db.delete(inspectionSections).where(eq(inspectionSections.id, id)).returning();
    return result.length > 0;
  }

  async reorderInspectionSections(ids: string[]): Promise<boolean> {
    if (!ids || ids.length === 0) return true;
    for (let index = 0; index < ids.length; index++) {
      await db.update(inspectionSections)
        .set({ sortOrder: index + 1 })
        .where(eq(inspectionSections.id, ids[index]));
    }
    return true;
  }

  async getInspectionCategories(sectionId?: string): Promise<InspectionCategory[]> {
    await this.ensureDefaultSectionsAndCategories();
    if (sectionId) {
      return await db.select()
        .from(inspectionCategories)
        .where(eq(inspectionCategories.sectionId, sectionId))
        .orderBy(asc(inspectionCategories.sortOrder), asc(inspectionCategories.createdAt));
    }
    return await db.select()
      .from(inspectionCategories)
      .orderBy(asc(inspectionCategories.sortOrder), asc(inspectionCategories.createdAt));
  }

  async createInspectionCategory(category: InsertInspectionCategory): Promise<InspectionCategory> {
    const cleanLabel = category.label.trim();
    // Check duplicate in same section
    const existing = await db.select().from(inspectionCategories)
      .where(eq(inspectionCategories.sectionId, category.sectionId));
    
    if (existing.some(c => c.label.trim().toLowerCase() === cleanLabel.toLowerCase())) {
      throw new Error(`توجد فئة أخرى بنفس الاسم داخل هذا القسم: "${cleanLabel}"`);
    }

    let sortOrder = category.sortOrder;
    if (sortOrder === undefined || sortOrder === 0) {
      sortOrder = existing.length + 1;
    }

    const id = category.id || `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const [newCat] = await db.insert(inspectionCategories).values({
      ...category,
      id,
      label: cleanLabel,
      sortOrder,
    }).returning();

    return newCat;
  }

  async updateInspectionCategory(id: string, updates: Partial<InsertInspectionCategory>): Promise<InspectionCategory> {
    if (updates.label) {
      const cleanLabel = updates.label.trim();
      const [current] = await db.select().from(inspectionCategories).where(eq(inspectionCategories.id, id));
      if (current) {
        const secId = updates.sectionId || current.sectionId;
        const existing = await db.select().from(inspectionCategories).where(eq(inspectionCategories.sectionId, secId));
        if (existing.some(c => c.id !== id && c.label.trim().toLowerCase() === cleanLabel.toLowerCase())) {
          throw new Error(`توجد فئة أخرى بنفس الاسم داخل هذا القسم: "${cleanLabel}"`);
        }
      }
      updates.label = cleanLabel;
    }

    const [updated] = await db.update(inspectionCategories)
      .set(updates)
      .where(eq(inspectionCategories.id, id))
      .returning();

    return updated;
  }

  async deleteInspectionCategory(id: string): Promise<boolean> {
    const result = await db.delete(inspectionCategories).where(eq(inspectionCategories.id, id)).returning();
    return result.length > 0;
  }

  async reorderInspectionCategories(ids: string[]): Promise<boolean> {
    if (!ids || ids.length === 0) return true;
    for (let index = 0; index < ids.length; index++) {
      await db.update(inspectionCategories)
        .set({ sortOrder: index + 1 })
        .where(eq(inspectionCategories.id, ids[index]));
    }
    return true;
  }
}


export const storage = new DatabaseStorage();
