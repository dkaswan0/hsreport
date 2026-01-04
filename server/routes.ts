import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes, openai } from "./replit_integrations/image"; // Import openai client

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register Replit AI integration routes
  registerChatRoutes(app);
  registerImageRoutes(app);

  // === Inspections ===
  app.get(api.inspections.list.path, async (req, res) => {
    const list = await storage.getInspections(
      req.query.search as string,
      req.query.status as string
    );
    res.json(list);
  });

  app.get(api.inspections.get.path, async (req, res) => {
    const inspection = await storage.getInspectionWithItems(Number(req.params.id));
    if (!inspection) {
      return res.status(404).json({ message: "Inspection not found" });
    }
    res.json(inspection);
  });

  app.post(api.inspections.create.path, async (req, res) => {
    try {
      const input = api.inspections.create.input.parse(req.body);
      const inspection = await storage.createInspection(input);
      res.status(201).json(inspection);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.inspections.update.path, async (req, res) => {
    const updated = await storage.updateInspection(Number(req.params.id), req.body);
    res.json(updated);
  });

  app.delete(api.inspections.delete.path, async (req, res) => {
    await storage.deleteInspection(Number(req.params.id));
    res.status(204).end();
  });

  // === Inspection Items ===
  app.post(api.inspectionItems.create.path, async (req, res) => {
    try {
      // Manually add inspectionId from params since it was omitted in schema
      const itemData = { ...req.body, inspectionId: Number(req.params.id) };
      const item = await storage.createInspectionItem(itemData);
      res.status(201).json(item);
    } catch (err) {
      res.status(400).json({ message: "Invalid item data" });
    }
  });

  app.put(api.inspectionItems.update.path, async (req, res) => {
    const updated = await storage.updateInspectionItem(Number(req.params.id), req.body);
    res.json(updated);
  });

  app.delete(api.inspectionItems.delete.path, async (req, res) => {
    await storage.deleteInspectionItem(Number(req.params.id));
    res.status(204).end();
  });

  // === Smart Features (AI) ===
  app.post(api.faultLibrary.suggest.path, async (req, res) => {
    try {
      const { query } = req.body;
      
      // Use OpenAI to generate fault details
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          {
            role: "system",
            content: "You are an expert automotive mechanic. Provide a structured JSON response for a car fault including: faultName, description (technical but clear), severity (low/medium/high), and solution (steps to fix). Respond in JSON format only."
          },
          {
            role: "user",
            content: `Analyze this car fault: ${query}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      res.json({
        faultName: result.faultName || query,
        description: result.description || "Detailed analysis not available.",
        severity: result.severity || "medium",
        solution: result.solution || "Consult a specialist."
      });
    } catch (error) {
      console.error("AI Error:", error);
      // Fallback
      res.json({
        faultName: req.body.query,
        description: "AI service unavailable. Please check manually.",
        severity: "medium",
        solution: "Manual inspection required."
      });
    }
  });

  app.get(api.faultLibrary.list.path, async (req, res) => {
    const list = await storage.getFaultLibrary(req.query.search as string);
    res.json(list);
  });

  // === VIN Decoder ===
  app.get(api.vin.decode.path, async (req, res) => {
    // Mock VIN decode for MVP
    const { vin } = req.params;
    res.json({
      make: "Toyota",
      model: "Camry",
      year: 2022,
      color: "White"
    });
  });

  // Helper for seeding fault library
  async function seedFaultLibrary() {
    const { faultLibrary } = await import("@shared/schema");
    const { db } = await import("./db");
    const existing = await db.select().from(faultLibrary).limit(1);
    if (existing.length === 0) {
      const faults = [
        // Engine (المكينة)
        { category: "المكينة", faultName: "تهريب زيت المحرك", severity: "high", description: "وجود آثار زيت أسفل المحرك" },
        { category: "المكينة", faultName: "صوت طقطقة في المحرك", severity: "high", description: "أصوات غير طبيعية عند التشغيل" },
        { category: "المكينة", faultName: "ضعف عزم المحرك", severity: "medium", description: "تسارع السيارة بطيء جداً" },
        { category: "المكينة", faultName: "ارتفاع حرارة المحرك", severity: "high", description: "مؤشر الحرارة يتجاوز المعدل الطبيعي" },
        // Chassis (الشاصي)
        { category: "الشاصي", faultName: "ضربة في مقدمة الشاصي", severity: "high", description: "وجود اعوجاج أو تلحيم في المقدمة" },
        { category: "الشاصي", faultName: "صدأ وتآكل في الشاصي", severity: "medium", description: "تآكل ناتج عن الرطوبة أو الأملاح" },
        { category: "الشاصي", faultName: "تعديل في هيكل الشاصي", severity: "high", description: "آثار سحب أو تعديل يدوي" },
        // Body (البودي)
        { category: "البودي", faultName: "رش تجميلي", severity: "low", description: "صبغ خارجي بدون معجون" },
        { category: "البودي", faultName: "حوادث متفرقة", severity: "medium", description: "وجود معجون في مناطق مختلفة" },
        { category: "البودي", faultName: "تبديل قطع خارجية", severity: "medium", description: "تبديل الرفرف أو الباب بقطعة تجارية" },
        // Airbags (الأرباقات)
        { category: "الأرباقات", faultName: "خروج الأرباق", severity: "high", description: "الأرباق مفتوح أو تم إعادة حشوه" },
        { category: "الأرباقات", faultName: "لمبة الأرباق مضاءة", severity: "high", description: "وجود عطل في نظام الوسائد الهوائية" }
      ];
      await db.insert(faultLibrary).values(faults);
    }
  }
  seedFaultLibrary().catch(console.error);

  return httpServer;
}
