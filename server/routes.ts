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
        // الهيكل والدهان (Body & Paint)
        { category: "البودي", faultName: "خدش سطحي - Surface Scratch", severity: "low", description: "خدش بسيط في الطبقة الخارجية للدهان" },
        { category: "البودي", faultName: "خدش عميق - Deep Scratch", severity: "medium", description: "خدش يصل إلى طبقة الأساس أو المعدن" },
        { category: "البودي", faultName: "طعجة خفيفة - Minor Dent", severity: "low", description: "انبعاج بسيط لا يؤثر على سلامة الهيكل" },
        { category: "البودي", faultName: "طعجة شديدة - Major Dent", severity: "high", description: "انبعاج كبير يتطلب إصلاحاً سمكرياً" },
        { category: "البودي", faultName: "كسر - Fracture/Break", severity: "high", description: "كسر في القطع البلاستيكية أو المعدنية" },
        { category: "البودي", faultName: "شق - Crack", severity: "medium", description: "وجود شق في الصدام أو أجزاء الفيبر" },
        { category: "البودي", faultName: "صبغ غير أصلي - Non-Original Paint", severity: "medium", description: "إعادة صبغ القطعة في ورشة غير الوكالة" },
        { category: "البودي", faultName: "فرق لون - Color Mismatch", severity: "low", description: "عدم تطابق درجة اللون بين القطع المجاورة" },
        { category: "البودي", faultName: "صدأ - Rust", severity: "high", description: "بدء تآكل المعدن بسبب الرطوبة" },
        { category: "البودي", faultName: "عدم اتزان الهيكل - Frame Misalignment", severity: "high", description: "انحراف في أبعاد الهيكل ناتج عن حادث" },

        // الإطارات (Tires)
        { category: "الكوتش", faultName: "كوتش بالي (تآكل) - Worn Tire", severity: "high", description: "انتهاء العمر الافتراضي لسطح الإطار" },
        { category: "الكوتش", faultName: "كوتش مفلت (مثقوب) - Punctured Tire", severity: "medium", description: "وجود ثقب أو مسمار في الإطار" },
        { category: "الكوتش", faultName: "كوتش متشقق - Cracked Tire", severity: "high", description: "تشققات جافة في جدار الإطار" },
        { category: "الكوتش", faultName: "كوتش منفوخ (تورم) - Tire Bulge", severity: "high", description: "وجود انتفاخ جانبي يشكل خطراً" },
        { category: "الكوتش", faultName: "كوتش تآكل غير متساوي - Uneven Wear", severity: "medium", description: "تآكل من جهة واحدة بسبب الميزانية" },
        { category: "الكوتش", faultName: "كوتش أملس (بدون نقشة) - Bald Tire", severity: "high", description: "مسح كامل لنقشة الإطار" },

        // المكينة (Engine)
        { category: "المكينة", faultName: "مكينة تسخن زيادة - Engine Overheating", severity: "high", description: "ارتفاع غير طبيعي في درجة حرارة المحرك" },
        { category: "المكينة", faultName: "مكينة تسرب زيت - Oil Leak", severity: "high", description: "وجود تهريب زيت من الجوانات أو الكرتير" },
        { category: "المكينة", faultName: "مكينة تسرب ماي راديتر - Coolant Leak", severity: "high", description: "تهريب سائل التبريد من الراديتر أو الخراطيم" },
        { category: "المكينة", faultName: "مكينة صوت طرق - Knocking Sound", severity: "high", description: "أصوات داخلية معدنية تدل على تلف الكرنك أو السبيكة" },
        { category: "المكينة", faultName: "مكينة دخان أبيض/أزرق/أسود - Smoke Output", severity: "high", description: "انبعاث أدخنة تدل على حرق زيت أو وقود زائد" },
        { category: "المكينة", faultName: "مكينة تفتفة - Misfiring", severity: "medium", description: "عدم انتظام احتراق المحرك" },
        { category: "المكينة", faultName: "مكينة كراسي تالفة - Worn Engine Mounts", severity: "medium", description: "تلف قواعد تثبيت المحرك مسبباً اهتزاز" },

        // الفرامل (Brakes)
        { category: "الفرامل", faultName: "صوت صرير الفرامل - Brake Squeal", severity: "medium", description: "تلف سفايف الفرامل أو اتساخ الهوبات" },
        { category: "الفرامل", faultName: "اهتزاز عند الكبح - Brake Judder", severity: "medium", description: "اعوجاج في هوبات الفرامل (الديسكات)" },
        { category: "الفرامل", faultName: "ضعف الفرامل - Weak Braking", severity: "high", description: "نقص في ضغط الزيت أو تلف المستر" },
        
        // الجنوط (Wheels)
        { category: "الجنوط", faultName: "جنط مضروب - Bent Rim", severity: "high", description: "انبعاج في حافة الجنط يؤدي لتسريب الهواء" },
        { category: "الجنوط", faultName: "جنط ملوي - Buckled Wheel", severity: "high", description: "اعوجاج في دوران الجنط يسبب اهتزاز" },
        { category: "الجنوط", faultName: "جنط مخدوش - Scratched Rim", severity: "low", description: "خدوش سطحية في طلاء الجنط" },

        // الكهرباء (Electric)
        { category: "الكهرباء", faultName: "عطل البطارية - Battery Failure", severity: "high", description: "ضعف الجهد أو انتهاء العمر الافتراضي" },
        { category: "الكهرباء", faultName: "عطل الدينمو - Alternator Fault", severity: "high", description: "عدم شحن البطارية أثناء عمل المحرك" },
        { category: "الكهرباء", faultName: "حساس خربان - Sensor Fault", severity: "medium", description: "خلل في قراءة أحد الحساسات (ABS, O2, etc)" },

        // السلامة (Safety)
        { category: "السلامة", faultName: "أعطال الأرباقات - Airbag System Fault", severity: "high", description: "خلل في نظام الوسائد الهوائية" },
        { category: "السلامة", faultName: "أحزمة الأمان - Seatbelt Fault", severity: "high", description: "عدم قفل أو سحب حزام الأمان بشكل صحيح" }
      ];
      await db.insert(faultLibrary).values(faults);
    }
  }
  seedFaultLibrary().catch(console.error);

  return httpServer;
}
