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
        model: "gpt-4o",
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

  // AI Photo Analysis - Identify car part and suggest faults
  app.post("/api/analyze-photo", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ error: "No image provided" });
      }

      const imageUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are an expert automotive inspector for a UAE vehicle inspection center. Analyze the car part in this image and identify:
1. Which car part is shown (door, hood, bumper, tire, engine bay, etc.)
2. The corresponding inspection category in Arabic
3. List of common faults for this specific part

Respond ONLY in valid JSON format:
{
  "detectedPart": "English name of part",
  "detectedPartArabic": "Arabic name",
  "category": "One of: المكينة, البودي, الكوتش, الفرامل, الكهرباء, الجنوط, التعليق والتوجيه, التبريد والتكييف, العادم, السلامة, ناقل الحركة, الشاصي",
  "suggestedFaults": [
    {"faultName": "Arabic - English", "severity": "high/medium/low", "description": "Arabic description"}
  ]
}`
              },
              {
                type: "image_url",
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        max_tokens: 1000
      });

      const content = response.choices[0].message.content || "{}";
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const result = JSON.parse(jsonMatch ? jsonMatch[0] : "{}");
      res.json(result);
    } catch (error) {
      console.error("Photo Analysis Error:", error);
      res.status(500).json({ 
        error: "Failed to analyze image",
        detectedPart: "Unknown",
        detectedPartArabic: "غير محدد",
        category: "البودي",
        suggestedFaults: []
      });
    }
  });

  app.get(api.faultLibrary.list.path, async (req, res) => {
    const list = await storage.getFaultLibrary(req.query.search as string);
    res.json(list);
  });

  // === VIN Decoder ===
  app.get(api.vin.decode.path, async (req, res) => {
    const { vin } = req.params;
    const apiKey = process.env.CARSXE_API_KEY;

    if (!apiKey) {
      return res.json({
        make: "Toyota",
        model: "Camry",
        year: 2022,
        color: "White"
      });
    }

    try {
      // 1. Fetch Specs
      const specsPromise = fetch(`https://api.carsxe.com/specs?key=${apiKey}&vin=${vin}`).then(r => r.json());
      // 2. Fetch Market Value
      const marketPromise = fetch(`https://api.carsxe.com/marketvalue?key=${apiKey}&vin=${vin}`).then(r => r.json());
      // 3. Fetch History/Recalls (Combined if possible or separate)
      const recallsPromise = fetch(`https://api.carsxe.com/recalls?key=${apiKey}&vin=${vin}`).then(r => r.json());
      
      const [specsData, marketData, recallsData] = await Promise.all([specsPromise, marketPromise, recallsPromise]);

      const specs = specsData.success ? specsData.attributes : {};
      const market = marketData.success ? marketData.market_value : null;

      return res.json({
        make: specs.make || "Unknown",
        model: specs.model || "Unknown",
        year: parseInt(specs.year) || 2024,
        color: specs.exterior_color || "أبيض",
        odometer: specs.mileage || 0,
        notes: JSON.stringify(specs),
        specs: {
          ...specs,
          msrp: market?.retail || specs.msrp,
          market_value: market,
          recalls: recallsData.success ? recallsData.recalls : []
        }
      });
    } catch (error) {
      console.error("CarsXE API Error:", error);
      res.json({
        make: "Toyota",
        model: "Camry",
        year: 2024,
        color: "Silver",
        vin: vin
      });
    }
  });

  // Helper for seeding fault library
  async function seedFaultLibrary() {
    const { faultLibrary } = await import("@shared/schema");
    const { db } = await import("./db");
    const existing = await db.select().from(faultLibrary).limit(1);
    if (existing.length === 0) {
      const faults = [
        // ⚙️ المكينة (Engine)
        { category: "المكينة", faultName: "مكينة تسخن زيادة - Engine Overheating", severity: "high", description: "ارتفاع غير طبيعي في درجة حرارة المحرك" },
        { category: "المكينة", faultName: "مكينة تسرب زيت - Oil Leak", severity: "high", description: "وجود تهريب زيت من الجوانات أو الكرتير" },
        { category: "المكينة", faultName: "مكينة تسرب ماي راديتر - Coolant Leak", severity: "high", description: "تهريب سائل التبريد من الراديتر أو الخراطيم" },
        { category: "المكينة", faultName: "مكينة صوت طرق - Knocking Sound", severity: "high", description: "أصوات معدنية داخلية" },
        { category: "المكينة", faultName: "مكينة دخان - Engine Smoke (White/Blue/Black)", severity: "high", description: "انبعاث أدخنة ملونة من العادم" },
        { category: "المكينة", faultName: "مكينة تفتفة - Misfiring", severity: "medium", description: "عدم انتظام احتراق المحرك" },
        { category: "المكينة", faultName: "مكينة كراسي تالفة - Worn Engine Mounts", severity: "medium", description: "تلف قواعد تثبيت المحرك" },
        { category: "المكينة", faultName: "مكينة اهتزاز - Engine Vibration", severity: "medium", description: "رجة غير طبيعية أثناء التشغيل" },

        // 🚗 البودي (Body & Paint)
        { category: "البودي", faultName: "خدش سطحي - Surface Scratch", severity: "low", description: "خدش بسيط في الدهان" },
        { category: "البودي", faultName: "خدش عميق - Deep Scratch", severity: "medium", description: "خدش يصل لطبقة الأساس" },
        { category: "البودي", faultName: "طعجة خفيفة - Minor Dent", severity: "low", description: "انبعاج بسيط" },
        { category: "البودي", faultName: "طعجة شديدة - Major Dent", severity: "high", description: "انبعاج كبير يتطلب سمكرة" },
        { category: "البودي", faultName: "صبغ غير أصلي - Non-Original Paint", severity: "medium", description: "إعادة صبغ القطعة" },
        { category: "البودي", faultName: "صدأ - Rust", severity: "high", description: "تآكل معدني" },

        // 🛞 الكوتش (Tires)
        { category: "الكوتش", faultName: "كوتش بالي - Worn Tire", severity: "high", description: "تآكل سطح الإطار" },
        { category: "الكوتش", faultName: "كوتش منفوخ - Tire Bulge", severity: "high", description: "انتفاخ جانبي" },
        { category: "الكوتش", faultName: "كوتش متشقق - Cracked Tire", severity: "high", description: "تشققات جافة" },

        // 🛑 الفرامل (Brakes)
        { category: "الفرامل", faultName: "صوت صرير - Brake Squeal", severity: "medium", description: "تلف السفايف" },
        { category: "الفرامل", faultName: "اهتزاز عند الكبح - Brake Judder", severity: "medium", description: "اعوجاج الهوبات" },

        // ⚡ الكهرباء (Electrical & Electronics)
        { category: "الكهرباء", faultName: "أعطال البطارية - Battery Failure", severity: "high", description: "ضعف الجهد أو تمليح الأقطاب" },
        { category: "الكهرباء", faultName: "أعطال الشحن / الدينمو - Alternator Fault", severity: "high", description: "فشل الدينمو في شحن البطارية" },
        { category: "الكهرباء", faultName: "أعطال الحساسات - Sensor Faults", severity: "medium", description: "خلل في قراءات الحساسات" },
        { category: "الكهرباء", faultName: "أعطال كمبيوتر السيارة - ECU Faults", severity: "high", description: "خلل في وحدة التحكم المركزية" },

        // 🛣️ التعليق والتوجيه (Suspension & Steering)
        { category: "التعليق والتوجيه", faultName: "اهتزاز أثناء القيادة - Steering Vibration", severity: "medium", description: "رجة في المقود" },
        { category: "التعليق والتوجيه", faultName: "صعوبة التحكم أو التوجيه - Difficult Steering", severity: "high", description: "ثقل في المقود" },
        { category: "التعليق والتوجيه", faultName: "ممتص الصدمات تالف - Worn Shock Absorber", severity: "medium", description: "تهريب زيت من المساعد" },

        // ❄️ التبريد والتكييف (Cooling & AC)
        { category: "التبريد والتكييف", faultName: "مكيف لا يبرد - AC Not Cooling", severity: "medium", description: "عطل في الكومبريسور" },
        { category: "التبريد والتكييف", faultName: "تسريب ماء التبريد - Coolant Leak", severity: "high", description: "تهريب سائل التبريد" },

        // 💨 العادم (Exhaust System)
        { category: "العادم", faultName: "صوت عالي / فرقعة - Loud Exhaust", severity: "medium", description: "ثقب في الشكمان" },
        { category: "العادم", faultName: "مشاكل دبة الرصاص - Catalytic Converter Issues", severity: "medium", description: "انسداد دبة البيئة" },

        // 🛡️ السلامة (Safety)
        { category: "السلامة", faultName: "أعطال أحزمة الأمان - Seatbelt Faults", severity: "high", description: "عدم قفل الحزام" },
        { category: "السلامة", faultName: "أعطال الوسائد الهوائية - Airbags Faults", severity: "high", description: "خلل في نظام الأرباقات" },

        // 🔘 الجنوط (Wheels)
        { category: "الجنوط", faultName: "جنط مضروب - Bent Rim", severity: "high", description: "انبعاج في الحافة" },
        { category: "الجنوط", faultName: "جنط ملوي - Buckled Wheel", severity: "high", description: "اعوجاج في دوران الجنط" },

        // ⚙️ ناقل الحركة (Transmission)
        { category: "ناقل الحركة", faultName: "صعوبة تغيير السرعات - Hard Shifting", severity: "high", description: "ثقل في التبديلات" },
        { category: "ناقل الحركة", faultName: "انزلاق القير - Transmission Slipping", severity: "high", description: "ارتفاع دوران المحرك دون سرعة" },

        // 🔧 الشاصي (Chassis)
        { category: "الشاصي", faultName: "تلاعب أو تغيير الشاصي - Chassis Tampering", severity: "high", description: "آثار قص وتلحيم" },
        { category: "الشاصي", faultName: "رقم الشاصي غير واضح - VIN Not Readable", severity: "high", description: "الرقم مخدوش أو مطلي" },
        { category: "الشاصي", faultName: "تلف هيكلي نتيجة حادث - Structural Damage", severity: "high", description: "انحناء أو التواء في الشاصي" }
      ];
      await db.insert(faultLibrary).values(faults);
    }
  }
  seedFaultLibrary().catch(console.error);

  return httpServer;
}
