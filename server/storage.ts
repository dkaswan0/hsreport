import { db } from "./db";
import {
  inspections, inspectionItems, faultLibrary,
  type Inspection, type InsertInspection, type UpdateInspectionRequest,
  type InspectionItem, type InsertInspectionItem, type UpdateInspectionItemRequest,
  type FaultLibrary, type InsertFaultLibrary
} from "@shared/schema";
import { eq, ilike, desc, inArray } from "drizzle-orm";

export interface IStorage {
  // Inspections
  getInspections(search?: string, status?: string): Promise<Inspection[]>;
  getInspection(id: number): Promise<Inspection | undefined>;
  getInspectionWithItems(id: number): Promise<Inspection & { items: InspectionItem[] } | undefined>;
  getInspectionByToken(token: string): Promise<Inspection & { items: InspectionItem[] } | undefined>;
  generateShareToken(id: number): Promise<string>;
  createInspection(inspection: InsertInspection): Promise<Inspection>;
  updateInspection(id: number, updates: UpdateInspectionRequest): Promise<Inspection>;
  deleteInspection(id: number): Promise<void>;
  deleteMultipleInspections(ids: number[]): Promise<number>;

  // Inspection Items
  createInspectionItem(item: InsertInspectionItem): Promise<InspectionItem>;
  updateInspectionItem(id: number, updates: UpdateInspectionItemRequest): Promise<InspectionItem>;
  deleteInspectionItem(id: number): Promise<void>;

  // Fault Library
  getFaultLibrary(search?: string): Promise<FaultLibrary[]>;
  createFault(fault: InsertFaultLibrary): Promise<FaultLibrary>;
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
    const [inspection] = await db.select().from(inspections).where(eq(inspections.shareToken, token));
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
}

export const storage = new DatabaseStorage();
