import { db } from "./db";
import {
  inspections, inspectionItems, faultLibrary, apiKeys,
  type Inspection, type InsertInspection, type UpdateInspectionRequest,
  type InspectionItem, type InsertInspectionItem, type UpdateInspectionItemRequest,
  type FaultLibrary, type InsertFaultLibrary,
  type ApiKey,
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
  deleteFault(id: number): Promise<boolean>;

  // API Keys
  getApiKeys(): Promise<ApiKey[]>;
  createApiKey(name: string, keyHash: string, keyPrefix: string): Promise<ApiKey>;
  getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined>;
  touchApiKey(id: number): Promise<void>;
  revokeApiKey(id: number): Promise<boolean>;
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
}

export const storage = new DatabaseStorage();
