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

  // Generate share link for an inspection
  app.post("/api/inspections/:id/share", async (req, res) => {
    try {
      const token = await storage.generateShareToken(Number(req.params.id));
      res.json({ token, shareUrl: `/view/${token}` });
    } catch (error: any) {
      if (error?.message === 'Inspection not found') {
        return res.status(404).json({ message: "Inspection not found" });
      }
      res.status(500).json({ message: "Failed to generate share link" });
    }
  });

  // Get inspection by share token (public endpoint)
  app.get("/api/public/report/:token", async (req, res) => {
    const inspection = await storage.getInspectionByToken(req.params.token);
    if (!inspection) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.json(inspection);
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

  // === VIN Decoder using FREE NHTSA VPIC API ===
  app.get(api.vin.decode.path, async (req, res) => {
    const { vin } = req.params;

    // Validate VIN format (must be 17 characters)
    if (!vin || vin.length !== 17) {
      return res.status(400).json({
        error: true,
        message: "رقم الشاصي يجب أن يكون 17 حرف - VIN must be 17 characters",
        make: "",
        model: "",
        year: 2024,
        color: ""
      });
    }

    try {
      // Use FREE NHTSA VPIC API - no API key required!
      const nhtsaUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${vin}?format=json`;
      const response = await fetch(nhtsaUrl);
      
      if (!response.ok) {
        console.error("NHTSA API HTTP error:", response.status);
        return res.status(500).json({
          error: true,
          message: "فشل الاتصال بخادم NHTSA - NHTSA server error",
          make: "",
          model: "",
          year: 2024,
          color: ""
        });
      }

      const data = await response.json();

      if (!data.Results || data.Results.length === 0) {
        return res.status(400).json({
          error: true,
          message: "رقم الشاصي غير صالح - Invalid VIN",
          make: "",
          model: "",
          year: 2024,
          color: ""
        });
      }

      const result = data.Results[0];

      // Check for critical errors in NHTSA response (ErrorCode > 0 and no Make found)
      if (result.ErrorCode && result.ErrorCode !== "0" && !result.Make) {
        console.log("NHTSA Error:", result.ErrorCode, result.ErrorText);
        return res.status(400).json({
          error: true,
          message: result.ErrorText || "رقم الشاصي غير صالح - Invalid VIN",
          make: "",
          model: "",
          year: 2024,
          color: ""
        });
      }

      // Extract vehicle specs from NHTSA response
      const specs = {
        year: result.ModelYear || "",
        make: result.Make || "",
        model: result.Model || "",
        trim: result.Trim || result.Series || "",
        style: result.BodyClass || "",
        type: result.VehicleType || "",
        made_in: result.PlantCountry || "",
        made_in_city: result.PlantCity || "",
        doors: result.Doors || "",
        fuel_type: result.FuelTypePrimary || "",
        engine: `${result.DisplacementL || ""}L ${result.EngineCylinders || ""} cyl ${result.EngineModel || ""}`.trim(),
        engine_size: result.DisplacementL || "",
        engine_cylinders: result.EngineCylinders || "",
        transmission: result.TransmissionStyle || "",
        drivetrain: result.DriveType || "",
        gross_vehicle_weight_rating: result.GVWR || "",
        manufacturer: result.Manufacturer || "",
        plant_company_name: result.PlantCompanyName || "",
        // Safety features
        abs: result.ABS || "",
        air_bag_front: result.AirBagLocFront || "",
        air_bag_side: result.AirBagLocSide || "",
        // Additional specs
        steering_type: result.SteeringLocation || "",
        wheelbase: result.WheelBaseShort || "",
        wheels: result.Wheels || "",
        windows: result.Windows || "",
        seat_belts: result.SeatBeltsAll || "",
        // Electric vehicle info
        battery_type: result.BatteryType || "",
        battery_kwh: result.BatteryKWh || "",
        charger_level: result.ChargerLevel || "",
        ev_drive_unit: result.EVDriveUnit || "",
      };

      // Fetch recalls from NHTSA (also FREE!)
      let recalls: any[] = [];
      try {
        const recallsUrl = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(result.Make)}&model=${encodeURIComponent(result.Model)}&modelYear=${result.ModelYear}`;
        const recallsResponse = await fetch(recallsUrl);
        const recallsData = await recallsResponse.json();
        if (recallsData.results && recallsData.results.length > 0) {
          recalls = recallsData.results.slice(0, 10).map((r: any) => ({
            component: r.Component,
            summary: r.Summary,
            consequence: r.Consequence,
            remedy: r.Remedy,
            manufacturer: r.Manufacturer,
            reportReceivedDate: r.ReportReceivedDate
          }));
        }
      } catch (e) {
        console.log("Recalls fetch failed (optional):", e);
      }

      // Create Arabic summary for display
      const summaryParts: string[] = [];
      
      if (specs.year && specs.make && specs.model) {
        summaryParts.push(`${specs.year} ${specs.make} ${specs.model}`);
      }
      if (specs.trim) {
        summaryParts.push(`الفئة: ${specs.trim}`);
      }
      if (specs.engine && specs.engine.trim()) {
        summaryParts.push(`المحرك: ${specs.engine}`);
      }
      if (specs.transmission) {
        summaryParts.push(`ناقل الحركة: ${specs.transmission}`);
      }
      if (specs.drivetrain) {
        const driveTypeAr = specs.drivetrain.includes('4') || specs.drivetrain.includes('AWD') ? 'دفع رباعي' 
          : specs.drivetrain.includes('Front') || specs.drivetrain.includes('FWD') ? 'دفع أمامي' 
          : specs.drivetrain.includes('Rear') || specs.drivetrain.includes('RWD') ? 'دفع خلفي' 
          : specs.drivetrain;
        summaryParts.push(`نظام الدفع: ${driveTypeAr}`);
      }
      if (specs.fuel_type) {
        const fuelTypeAr = specs.fuel_type.includes('Gasoline') ? 'بنزين' 
          : specs.fuel_type.includes('Diesel') ? 'ديزل'
          : specs.fuel_type.includes('Electric') ? 'كهربائي'
          : specs.fuel_type.includes('Hybrid') ? 'هجين'
          : specs.fuel_type;
        summaryParts.push(`الوقود: ${fuelTypeAr}`);
      }
      if (specs.made_in) {
        summaryParts.push(`بلد الصنع: ${specs.made_in}`);
      }
      if (specs.style) {
        summaryParts.push(`نوع الهيكل: ${specs.style}`);
      }
      if (recalls && recalls.length > 0) {
        summaryParts.push(`تنبيه: يوجد ${recalls.length} استدعاءات أمان`);
      }

      const arabicSummary = summaryParts.join(' | ');

      // Store specs as JSON with Arabic summary included
      const notesData = {
        ...specs,
        arabicSummary,
        recalls: recalls
      };

      return res.json({
        make: specs.make || "",
        model: specs.model || "",
        year: parseInt(specs.year) || 2024,
        color: "", // NHTSA doesn't provide color
        odometer: 0,
        notes: JSON.stringify(notesData),
        arabicSummary: arabicSummary,
        specs: notesData
      });
    } catch (error) {
      console.error("NHTSA API Error:", error);
      res.status(500).json({
        error: true,
        message: "فشل الاتصال بخادم NHTSA - Connection to NHTSA failed",
        make: "",
        model: "",
        year: 2024,
        color: ""
      });
    }
  });

  // Helper for seeding fault library - uses upsert to add new faults without deleting existing
  async function seedFaultLibrary() {
    const { faultLibrary } = await import("@shared/schema");
    const { db } = await import("./db");
    const { eq, and } = await import("drizzle-orm");
    
    // Get all existing faults
    const existingFaults = await db.select().from(faultLibrary);
    const existingSet = new Set(existingFaults.map(f => `${f.category}||${f.faultName}`));
    
    // Define all faults (will only insert new ones)
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
        { category: "الشاصي", faultName: "تلف هيكلي نتيجة حادث - Structural Damage", severity: "high", description: "انحناء أو التواء في الشاصي" },

        // 🚘 الدعامية الأمامية (Front Bumper)
        // حالة الدعامية / Condition
        { category: "الدعامية الأمامية", faultName: "مبدلة (تم تغييرها) - Replaced", severity: "medium", description: "الدعامية الأمامية تم استبدالها بقطعة غير أصلية" },
        { category: "الدعامية الأمامية", faultName: "مصبوغة (طلاء جديد) - Repainted", severity: "low", description: "الدعامية الأمامية تم إعادة صبغها" },
        { category: "الدعامية الأمامية", faultName: "محولة (تم تعديلها) - Modified", severity: "medium", description: "الدعامية الأمامية تم تعديلها عن الأصلي" },
        { category: "الدعامية الأمامية", faultName: "مضاف لها أجزاء أو تزويد - Added Parts", severity: "low", description: "تم إضافة قطع أو إكسسوارات على الدعامية" },
        
        // أضرار وإصلاحات / Damages & Repairs
        { category: "الدعامية الأمامية", faultName: "كسر - Broken", severity: "high", description: "الدعامية الأمامية مكسورة" },
        { category: "الدعامية الأمامية", faultName: "ضربة - Impact Damage", severity: "high", description: "الدعامية ضربتها حادث أو صدم" },
        { category: "الدعامية الأمامية", faultName: "خدوش - Scratches", severity: "low", description: "خدوش بسيطة أو سطحية على الدعامية" },
        { category: "الدعامية الأمامية", faultName: "تصليح وتلحيم - Repaired & Welded", severity: "medium", description: "الدعامية تم تصليحها ولحامها" },
        { category: "الدعامية الأمامية", faultName: "الصبغ حالة سيئة - Poor Paint Condition", severity: "medium", description: "الطلاء متعب أو سيئ الجودة" },
        
        // التركيب والثبات / Installation & Fit
        { category: "الدعامية الأمامية", faultName: "نقص كليبات - Missing Clips", severity: "low", description: "قطع تثبيت ناقصة" },
        { category: "الدعامية الأمامية", faultName: "نقص براغي - Missing Screws", severity: "low", description: "البراغي غير مكتملة" },
        { category: "الدعامية الأمامية", faultName: "تثبيت سيء - Poor Installation", severity: "medium", description: "التركيب غير مضبوط" },
        { category: "الدعامية الأمامية", faultName: "اختلاف في الميزانية - Misalignment", severity: "medium", description: "التركيب غير متناسق مع باقي السيارة" },
        
        // نيكل كروم / Chrome Parts
        { category: "الدعامية الأمامية", faultName: "نيكل كروم حالة سيئة - Chrome Poor Condition", severity: "low", description: "الكروم فيه خدوش أو صدأ" },
        { category: "الدعامية الأمامية", faultName: "نيكل كروم كسر - Chrome Broken", severity: "medium", description: "كروم الدعامية مكسور" },
        { category: "الدعامية الأمامية", faultName: "نيكل كروم لا يوجد - Chrome Missing", severity: "medium", description: "الكروم غير موجود أصلاً" },
        
        // ملاحظات إضافية / Notes
        { category: "الدعامية الأمامية", faultName: "يوجد عليها جلاد - Stickers/Decals Present", severity: "low", description: "يوجد ملصقات أو إضافات خارجية على الدعامية" }
      ];
      
      // Filter out faults that already exist
      const newFaults = faults.filter(f => !existingSet.has(`${f.category}||${f.faultName}`));
      
      if (newFaults.length > 0) {
        await db.insert(faultLibrary).values(newFaults);
        console.log(`Seeded ${newFaults.length} new faults to library`);
      } else {
        console.log("Fault library already up to date");
      }
  }
  seedFaultLibrary().catch(console.error);

  return httpServer;
}
