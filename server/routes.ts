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
        // ⚡ الكهرباء (Electrical & Electronics)
        { category: "الكهرباء", faultName: "أعطال البطارية - Battery Failure", severity: "high", description: "ضعف الجهد أو انتهاء العمر الافتراضي أو تمليح الأقطاب" },
        { category: "الكهرباء", faultName: "أعطال الشحن / الدينمو - Alternator Fault", severity: "high", description: "فشل الدينمو في شحن البطارية أو ضجيج من المحامل" },
        { category: "الكهرباء", faultName: "أعطال الحساسات - Sensor Faults (ABS, TPS, O2)", severity: "medium", description: "خلل في قراءات الحساسات يسبب مشاكل في الأداء أو نظام الأمان" },
        { category: "الكهرباء", faultName: "أعطال المصابيح - Lighting Faults", severity: "medium", description: "تعطل الإضاءة الأمامية أو الخلفية أو الداخلية" },
        { category: "الكهرباء", faultName: "النوافذ / الأبواب الكهربائية - Power Window/Door Faults", severity: "low", description: "خلل في محركات النوافذ أو الأقفال المركزية" },
        { category: "الكهرباء", faultName: "شاشة الملاحة / النظام الصوتي - Navigation/Audio System Faults", severity: "low", description: "تعطل الشاشة أو نظام الصوت أو الكاميرا الخلفية" },
        { category: "الكهرباء", faultName: "أعطال كمبيوتر السيارة - ECU Faults", severity: "high", description: "خلل في وحدة التحكم المركزية يؤثر على كامل أنظمة السيارة" },

        // 🛣️ التعليق والتوجيه (Suspension & Steering)
        { category: "التعليق والتوجيه", faultName: "اهتزاز أثناء القيادة - Steering Vibration", severity: "medium", description: "رجة في المقود تدل على مشاكل في الميزانية أو الأذرعة" },
        { category: "التعليق والتوجيه", faultName: "صعوبة التحكم أو التوجيه - Difficult Steering", severity: "high", description: "ثقل في المقود أو نقص زيت الباور أو عطل في المضخة" },
        { category: "التعليق والتوجيه", faultName: "صوت طرق من العجلات - Suspension Knocking", severity: "medium", description: "أصوات غير طبيعية تدل على تلف الجوزات أو الروبلات" },
        { category: "التعليق والتوجيه", faultName: "انحراف السيارة - Vehicle Pulling", severity: "medium", description: "السيارة تسحب جهة اليمين أو اليسار أثناء القيادة المستقيمة" },
        { category: "التعليق والتوجيه", faultName: "ممتص الصدمات تالف - Worn Shock Absorber", severity: "medium", description: "تهريب زيت من المساعد أو فقدان خاصية امتصاص الصدمات" },

        // ❄️ التبريد والتكييف (Cooling & AC)
        { category: "التبريد والتكييف", faultName: "مكيف لا يبرد - AC Not Cooling", severity: "medium", description: "عطل في الكومبريسور أو ضعف أداء المروحة" },
        { category: "التبريد والتكييف", faultName: "مروحة الرادياتير لا تعمل - Radiator Fan Failure", severity: "high", description: "توقف مروحة التبريد مسبباً ارتفاع حرارة المحرك" },
        { category: "التبريد والتكييف", faultName: "تسريب غاز التكييف - AC Gas Leak", severity: "medium", description: "نقص الفريون بسبب وجود تهريب في الأنابيب أو الثلاجة" },
        { category: "التبريد والتكييف", faultName: "تسريب ماء التبريد - Coolant Leak", severity: "high", description: "تهريب سائل التبريد من الراديتر أو الخراطيم أو الطرمبة" },

        // 💨 العادم (Exhaust System)
        { category: "العادم", faultName: "صوت عالي / فرقعة - Loud Exhaust/Popping", severity: "medium", description: "ثقب في الشكمان أو تلف في علبة العادم" },
        { category: "العادم", faultName: "تسريب غازات العادم - Exhaust Gas Leak", severity: "high", description: "خروج الغازات قبل وصولها لنهاية النظام مما قد يدخلها للمقصورة" },
        { category: "العادم", faultName: "مشاكل دبة الرصاص - Catalytic Converter Issues", severity: "medium", description: "انسداد أو تلف دبة البيئة مسبباً كتمة في المحرك" },

        // 🛡️ السلامة (Safety)
        { category: "السلامة", faultName: "أعطال أحزمة الأمان - Seatbelt Faults", severity: "high", description: "عدم قفل أو سحب حزام الأمان بشكل صحيح" },
        { category: "السلامة", faultName: "أعطال الوسائد الهوائية - Airbags System Faults", severity: "high", description: "خلل في نظام الأرباقات أو لمبة التحذير مضاءة" },

        // 🔘 الجنوط (Wheels)
        { category: "الجنوط", faultName: "جنط مضروب - Bent Rim", severity: "high", description: "انبعاج في حافة الجنط يؤدي لتسريب الهواء" },
        { category: "الجنوط", faultName: "جنط ملوي - Buckled Wheel", severity: "high", description: "اعوجاج في دوران الجنط يسبب اهتزاز" },
        { category: "الجنوط", faultName: "جنط مخدوش - Scratched Rim", severity: "low", description: "خدوش سطحية في طلاء الجنط" },
        { category: "الجنوط", faultName: "جنط متآكل (صدأ) - Corroded Wheel", severity: "medium", description: "تأكسد أو صدأ على سطح الجنط" },

        // ⚙️ ناقل الحركة (Transmission)
        { category: "ناقل الحركة", faultName: "صعوبة تغيير السرعات - Hard Shifting", severity: "high", description: "ثقل في التبديلات أو عدم قبول الغيارات" },
        { category: "ناقل الحركة", faultName: "انزلاق القير - Transmission Slipping", severity: "high", description: "ارتفاع دوران المحرك دون زيادة السرعة" },
        { category: "ناقل الحركة", faultName: "صوت طرق عند النقل - Transmission Clunking", severity: "medium", description: "أصوات معدنية عند التبديل بين الغيارات" },
        { category: "ناقل الحركة", faultName: "تأخر الحركة - Delayed Engagement", severity: "medium", description: "تأخر السيارة في الاستجابة بعد وضع الغيار" },
        { category: "ناقل الحركة", faultName: "تسريب زيت القير - Transmission Fluid Leak", severity: "high", description: "وجود بقع زيت أسفل القير" },

        // 🔧 الشاصي (Chassis - Structural)
        { category: "الشاصي", faultName: "تلاعب أو تغيير الشاصي - Chassis Tampering", severity: "high", description: "عدم مطابقة الشاصي للمستندات أو وجود آثار قص وتلحيم" },
        { category: "الشاصي", faultName: "رقم الشاصي غير واضح - VIN Not Readable", severity: "high", description: "الرقم مخدوش أو مطلي أو مقطوع بشكل غير قانوني" },
        { category: "الشاصي", faultName: "صدأ شديد - Severe Chassis Rust", severity: "high", description: "تآكل عميق في هيكل السيارة الأساسي" },
        { category: "الشاصي", faultName: "تلف هيكلي نتيجة حادث - Structural Damage", severity: "high", description: "انحناء أو التواء أو كسر في أجزاء الهيكل الأساسية" },
        { category: "الشاصي", faultName: "عدم اتزان الهيكل - Chassis Misalignment", severity: "high", description: "اختلاف قياسات الشاصي وعلامات إصلاح سابقة" },
        { category: "الشاصي", faultName: "نقاط التثبيت تالفة - Damaged Mount Points", severity: "high", description: "تلف في نقاط تثبيت المحرك أو التعليق أو المقاعد" }
      ];
      await db.insert(faultLibrary).values(faults);
    }
  }
  seedFaultLibrary().catch(console.error);

  return httpServer;
}
