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

      // Use gpt-4o for accurate fault detection
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `أنت خبير فحص سيارات محترف. مهمتك تحديد الأعطال بدقة من الصور.
اذكر العطل بشكل مباشر وواضح مثل: "الزيت ناقص"، "البطارية ضعيفة"، "الفرامل متآكلة"، "تسريب زيت"، "شمعات احتراق تالفة".
لا تستخدم عبارات عامة مثل "قد يسبب" أو "ربما يؤدي". اذكر المشكلة الفعلية المرئية في الصورة.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `حلل هذه الصورة وحدد العطل الموجود بدقة.

مثال على إجابة صحيحة:
- إذا رأيت مستوى زيت منخفض: "الزيت ناقص - يحتاج تعبئة"
- إذا رأيت تآكل: "الفرامل متآكلة - تحتاج تبديل"
- إذا رأيت تسريب: "تسريب زيت من المحرك"
- إذا رأيت صدأ: "صدأ في الهيكل السفلي"

أجب بـ JSON فقط:
{"detectedPart":"Engine Oil","detectedPartArabic":"زيت المحرك","category":"المحرك","suggestedFaults":[{"faultName":"العطل المحدد بالضبط","severity":"high/medium/low","description":"وصف دقيق للمشكلة المرئية"}]}`
              },
              {
                type: "image_url",
                image_url: { url: imageUrl, detail: "high" }
              }
            ]
          }
        ],
        max_tokens: 800
      });

      const content = response.choices[0].message.content || "{}";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const result = JSON.parse(jsonMatch ? jsonMatch[0] : "{}");
      res.json(result);
    } catch (error: any) {
      console.error("Photo Analysis Error:", error?.message || error);
      // Return fallback without error status to prevent UI error message
      res.json({ 
        detectedPart: "Car Part",
        detectedPartArabic: "جزء السيارة",
        category: "البودي",
        suggestedFaults: []
      });
    }
  });

  app.get(api.faultLibrary.list.path, async (req, res) => {
    const list = await storage.getFaultLibrary(req.query.search as string);
    res.json(list);
  });

  // Force reseed fault library endpoint
  app.post("/api/fault-library/reseed", async (req, res) => {
    try {
      const { faultLibrary } = await import("@shared/schema");
      const { db } = await import("./db");
      const { sql } = await import("drizzle-orm");
      
      // Delete all existing faults
      await db.execute(sql`DELETE FROM fault_library`);
      console.log("Cleared fault library for reseed...");
      
      // Now call seed which will insert since we cleared
      await seedFaultLibrary();
      
      // Get new count
      const newFaults = await db.select().from(faultLibrary);
      res.json({ success: true, count: newFaults.length, message: `تم إعادة تحميل ${newFaults.length} عطل` });
    } catch (error: any) {
      console.error("Reseed error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
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

  // Seed fault library with complete organized structure
  async function seedFaultLibrary() {
    const { faultLibrary } = await import("@shared/schema");
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    
    const existingFaults = await db.select().from(faultLibrary);
    // If we have less than 1000 faults, clear and reseed with the complete library
    if (existingFaults.length >= 1000) {
      console.log(`Fault library has ${existingFaults.length} faults`);
      return;
    }
    
    // Clear old incomplete fault library
    if (existingFaults.length > 0) {
      console.log(`Clearing ${existingFaults.length} old faults and reseeding with complete library...`);
      await db.execute(sql`DELETE FROM fault_library`);
    }
    
    const faults = [
      // ═══════════════════════════════════════════════════════════════
      // الدعامية الأمامية - Front Bumper
      // ═══════════════════════════════════════════════════════════════
      // حالة الدعامية
      { category: "الدعامية الأمامية", faultName: "مبدلة - Replaced", severity: "medium", description: "الدعامية تم استبدالها" },
      { category: "الدعامية الأمامية", faultName: "مصبوغة - Repainted", severity: "low", description: "الدعامية تم إعادة صبغها" },
      { category: "الدعامية الأمامية", faultName: "محولة - Modified", severity: "medium", description: "الدعامية تم تعديلها" },
      { category: "الدعامية الأمامية", faultName: "تزويد - Added Parts", severity: "low", description: "تم إضافة قطع على الدعامية" },
      // أضرار وإصلاحات
      { category: "الدعامية الأمامية", faultName: "كسر - Broken", severity: "high", description: "الدعامية مكسورة" },
      { category: "الدعامية الأمامية", faultName: "خدوش - Scratches", severity: "low", description: "خدوش على الدعامية" },
      { category: "الدعامية الأمامية", faultName: "ضربة - Impact Damage", severity: "high", description: "ضربة في الدعامية" },
      { category: "الدعامية الأمامية", faultName: "تصليح و تلحيم - Repaired & Welded", severity: "medium", description: "الدعامية تم تصليحها ولحامها" },
      { category: "الدعامية الأمامية", faultName: "الصبغ حالة سيئة - Poor Paint", severity: "medium", description: "الطلاء حالته سيئة" },
      // تركيب وثبات
      { category: "الدعامية الأمامية", faultName: "نقص كليبات - Missing Clips", severity: "low", description: "كليبات التثبيت ناقصة" },
      { category: "الدعامية الأمامية", faultName: "نقص براغي - Missing Screws", severity: "low", description: "براغي التثبيت ناقصة" },
      { category: "الدعامية الأمامية", faultName: "تثبيت سيء - Poor Installation", severity: "medium", description: "التركيب غير مضبوط" },
      { category: "الدعامية الأمامية", faultName: "اختلاف في الميزانية - Misalignment", severity: "medium", description: "الدعامية غير متوازنة" },
      // نيكل كروم
      { category: "الدعامية الأمامية", faultName: "نيكل كروم حالة سيئة - Chrome Poor Condition", severity: "low", description: "الكروم حالته سيئة" },
      { category: "الدعامية الأمامية", faultName: "نيكل كروم كسر - Chrome Broken", severity: "medium", description: "الكروم مكسور" },
      { category: "الدعامية الأمامية", faultName: "نيكل كروم لا يوجد - Chrome Missing", severity: "medium", description: "الكروم غير موجود" },
      // ملاحظات إضافية
      { category: "الدعامية الأمامية", faultName: "يوجد عليها جلاد - Stickers Present", severity: "low", description: "يوجد ملصقات على الدعامية" },

      // ═══════════════════════════════════════════════════════════════
      // الدعامية الخلفية - Rear Bumper (same structure as front)
      // ═══════════════════════════════════════════════════════════════
      { category: "الدعامية الخلفية", faultName: "مبدلة - Replaced", severity: "medium", description: "الدعامية تم استبدالها" },
      { category: "الدعامية الخلفية", faultName: "مصبوغة - Repainted", severity: "low", description: "الدعامية تم إعادة صبغها" },
      { category: "الدعامية الخلفية", faultName: "محولة - Modified", severity: "medium", description: "الدعامية تم تعديلها" },
      { category: "الدعامية الخلفية", faultName: "تزويد - Added Parts", severity: "low", description: "تم إضافة قطع على الدعامية" },
      { category: "الدعامية الخلفية", faultName: "كسر - Broken", severity: "high", description: "الدعامية مكسورة" },
      { category: "الدعامية الخلفية", faultName: "خدوش - Scratches", severity: "low", description: "خدوش على الدعامية" },
      { category: "الدعامية الخلفية", faultName: "ضربة - Impact Damage", severity: "high", description: "ضربة في الدعامية" },
      { category: "الدعامية الخلفية", faultName: "تصليح و تلحيم - Repaired & Welded", severity: "medium", description: "الدعامية تم تصليحها ولحامها" },
      { category: "الدعامية الخلفية", faultName: "الصبغ حالة سيئة - Poor Paint", severity: "medium", description: "الطلاء حالته سيئة" },
      { category: "الدعامية الخلفية", faultName: "نقص كليبات - Missing Clips", severity: "low", description: "كليبات التثبيت ناقصة" },
      { category: "الدعامية الخلفية", faultName: "نقص براغي - Missing Screws", severity: "low", description: "براغي التثبيت ناقصة" },
      { category: "الدعامية الخلفية", faultName: "تثبيت سيء - Poor Installation", severity: "medium", description: "التركيب غير مضبوط" },
      { category: "الدعامية الخلفية", faultName: "اختلاف في الميزانية - Misalignment", severity: "medium", description: "الدعامية غير متوازنة" },
      { category: "الدعامية الخلفية", faultName: "نيكل كروم حالة سيئة - Chrome Poor Condition", severity: "low", description: "الكروم حالته سيئة" },
      { category: "الدعامية الخلفية", faultName: "نيكل كروم كسر - Chrome Broken", severity: "medium", description: "الكروم مكسور" },
      { category: "الدعامية الخلفية", faultName: "نيكل كروم لا يوجد - Chrome Missing", severity: "medium", description: "الكروم غير موجود" },
      { category: "الدعامية الخلفية", faultName: "يوجد عليها جلاد - Stickers Present", severity: "low", description: "يوجد ملصقات على الدعامية" },

      // ═══════════════════════════════════════════════════════════════
      // جسر الدعامية الأمامية - Front Bumper Frame
      // ═══════════════════════════════════════════════════════════════
      { category: "جسر الدعامية الأمامية", faultName: "مبدل - Replaced", severity: "high", description: "الجسر تم استبداله" },
      { category: "جسر الدعامية الأمامية", faultName: "كسر - Broken", severity: "high", description: "الجسر مكسور" },
      { category: "جسر الدعامية الأمامية", faultName: "ضربة - Impact Damage", severity: "high", description: "ضربة في الجسر" },
      { category: "جسر الدعامية الأمامية", faultName: "استعدال و تصليح - Straightened & Repaired", severity: "medium", description: "الجسر تم استعداله وتصليحه" },
      { category: "جسر الدعامية الأمامية", faultName: "قطع و لحام - Cut & Welded", severity: "high", description: "الجسر تم قطعه ولحامه" },
      { category: "جسر الدعامية الأمامية", faultName: "صدا - Rust", severity: "medium", description: "صدأ على الجسر" },
      { category: "جسر الدعامية الأمامية", faultName: "صدا و تاكل - Rust & Corrosion", severity: "high", description: "صدأ وتآكل شديد" },
      { category: "جسر الدعامية الأمامية", faultName: "فك في البراغي - Loose Screws", severity: "low", description: "البراغي غير مثبتة جيداً" },
      { category: "جسر الدعامية الأمامية", faultName: "نقص براغي - Missing Screws", severity: "low", description: "براغي ناقصة" },
      { category: "جسر الدعامية الأمامية", faultName: "سحب و تسخين - Pulled & Heated", severity: "medium", description: "تم سحب وتسخين الجسر" },
      { category: "جسر الدعامية الأمامية", faultName: "تثبيت سيئ - Poor Installation", severity: "medium", description: "التثبيت غير مضبوط" },

      // ═══════════════════════════════════════════════════════════════
      // جسر الدعامية الخلفية - Rear Bumper Frame (same as front)
      // ═══════════════════════════════════════════════════════════════
      { category: "جسر الدعامية الخلفية", faultName: "مبدل - Replaced", severity: "high", description: "الجسر تم استبداله" },
      { category: "جسر الدعامية الخلفية", faultName: "كسر - Broken", severity: "high", description: "الجسر مكسور" },
      { category: "جسر الدعامية الخلفية", faultName: "ضربة - Impact Damage", severity: "high", description: "ضربة في الجسر" },
      { category: "جسر الدعامية الخلفية", faultName: "استعدال و تصليح - Straightened & Repaired", severity: "medium", description: "الجسر تم استعداله وتصليحه" },
      { category: "جسر الدعامية الخلفية", faultName: "قطع و لحام - Cut & Welded", severity: "high", description: "الجسر تم قطعه ولحامه" },
      { category: "جسر الدعامية الخلفية", faultName: "صدا - Rust", severity: "medium", description: "صدأ على الجسر" },
      { category: "جسر الدعامية الخلفية", faultName: "صدا و تاكل - Rust & Corrosion", severity: "high", description: "صدأ وتآكل شديد" },
      { category: "جسر الدعامية الخلفية", faultName: "فك في البراغي - Loose Screws", severity: "low", description: "البراغي غير مثبتة جيداً" },
      { category: "جسر الدعامية الخلفية", faultName: "نقص براغي - Missing Screws", severity: "low", description: "براغي ناقصة" },
      { category: "جسر الدعامية الخلفية", faultName: "سحب و تسخين - Pulled & Heated", severity: "medium", description: "تم سحب وتسخين الجسر" },
      { category: "جسر الدعامية الخلفية", faultName: "تثبيت سيئ - Poor Installation", severity: "medium", description: "التثبيت غير مضبوط" },

      // ═══════════════════════════════════════════════════════════════
      // البونيت - Hood
      // ═══════════════════════════════════════════════════════════════
      // حالة البونيت
      { category: "البونيت", faultName: "مبدل - Replaced", severity: "medium", description: "البونيت تم استبداله" },
      { category: "البونيت", faultName: "مصبوغ لكر تجميلي - Clear Coat Repaint", severity: "low", description: "صبغ لكر تجميلي" },
      { category: "البونيت", faultName: "مرشوش صبغ - Spray Painted", severity: "low", description: "مرشوش صبغ" },
      { category: "البونيت", faultName: "مصبوغ معجون - Painted with Filler", severity: "medium", description: "مصبوغ مع معجون" },
      { category: "البونيت", faultName: "مصبوغ معجون بعض الأجزاء - Partial Filler", severity: "medium", description: "بعض الأجزاء مصبوغة بمعجون" },
      { category: "البونيت", faultName: "ملمع بولش - Polished", severity: "low", description: "تم تلميع البونيت" },
      { category: "البونيت", faultName: "ضربة - Impact Damage", severity: "high", description: "ضربة في البونيت" },
      { category: "البونيت", faultName: "ضربة و استعدال - Impact & Straightened", severity: "medium", description: "ضربة تم استعدالها" },
      { category: "البونيت", faultName: "الصبغ حالة سيئة - Poor Paint", severity: "medium", description: "الصبغ حالته سيئة" },
      // تركيب وثبات
      { category: "البونيت", faultName: "فك في البراغي - Loose Screws", severity: "low", description: "براغي غير مثبتة" },
      { category: "البونيت", faultName: "نقص براغي - Missing Screws", severity: "low", description: "براغي ناقصة" },
      { category: "البونيت", faultName: "كفر البونيت حالة سيئة - Cover Poor Condition", severity: "low", description: "غطاء البونيت حالته سيئة" },
      { category: "البونيت", faultName: "كفر البونيت لا يوجد - Cover Missing", severity: "low", description: "غطاء البونيت غير موجود" },
      { category: "البونيت", faultName: "كفر البونيت نقص كليبات - Cover Missing Clips", severity: "low", description: "كليبات الغطاء ناقصة" },
      { category: "البونيت", faultName: "ربلة البونيت حالة سيئة - Seal Poor Condition", severity: "low", description: "ربلة البونيت حالتها سيئة" },
      { category: "البونيت", faultName: "ربلة البونيت قطع - Seal Cut", severity: "low", description: "ربلة البونيت مقطوعة" },
      { category: "البونيت", faultName: "ربلة البونيت لا توجد - Seal Missing", severity: "low", description: "ربلة البونيت غير موجودة" },
      { category: "البونيت", faultName: "لوك البونيت حالة سيئة - Lock Poor Condition", severity: "medium", description: "قفل البونيت حالته سيئة" },
      { category: "البونيت", faultName: "لوك البونيت كسر - Lock Broken", severity: "medium", description: "قفل البونيت مكسور" },
      { category: "البونيت", faultName: "لوك البونيت تثبيت سيئ - Lock Poor Installation", severity: "medium", description: "قفل البونيت تثبيته سيئ" },
      // أضرار إضافية
      { category: "البونيت", faultName: "جانبين البونيت حالة سيئة - Sides Poor Condition", severity: "medium", description: "جانبي البونيت حالتهم سيئة" },
      { category: "البونيت", faultName: "يوجد جلاد على البونيت - Stickers Present", severity: "low", description: "ملصقات على البونيت" },
      { category: "البونيت", faultName: "البونيت معدل - Modified", severity: "medium", description: "البونيت تم تعديله" },
      { category: "البونيت", faultName: "خلل في فتح و قفل البونيت - Open/Close Malfunction", severity: "medium", description: "مشكلة في فتح وقفل البونيت" },

      // ═══════════════════════════════════════════════════════════════
      // صدر السيارة الأمامي - Front Frame
      // ═══════════════════════════════════════════════════════════════
      { category: "صدر السيارة الأمامي", faultName: "ضربة في صدر السيارة - Frame Impact", severity: "high", description: "ضربة في صدر السيارة" },
      { category: "صدر السيارة الأمامي", faultName: "تصليح في صدر السيارة - Frame Repaired", severity: "medium", description: "تم تصليح الصدر" },
      { category: "صدر السيارة الأمامي", faultName: "تصليح و تلحيم في صدر السيارة - Welded Repair", severity: "high", description: "تم تلحيم الصدر" },
      { category: "صدر السيارة الأمامي", faultName: "صدر السيارة مبدل - Frame Replaced", severity: "high", description: "الصدر تم استبداله" },
      { category: "صدر السيارة الأمامي", faultName: "صدر السيارة مصبوغ - Frame Repainted", severity: "medium", description: "الصدر تم صبغه" },
      { category: "صدر السيارة الأمامي", faultName: "صدا - Rust", severity: "medium", description: "صدأ على الصدر" },
      { category: "صدر السيارة الأمامي", faultName: "صدا و تاكل - Rust & Corrosion", severity: "high", description: "صدأ وتآكل شديد" },

      // ═══════════════════════════════════════════════════════════════
      // صدر السيارة الخلفي - Rear Frame
      // ═══════════════════════════════════════════════════════════════
      { category: "صدر السيارة الخلفي", faultName: "ضربة في صدر السيارة - Frame Impact", severity: "high", description: "ضربة في صدر السيارة" },
      { category: "صدر السيارة الخلفي", faultName: "تصليح في صدر السيارة - Frame Repaired", severity: "medium", description: "تم تصليح الصدر" },
      { category: "صدر السيارة الخلفي", faultName: "تصليح و تلحيم في صدر السيارة - Welded Repair", severity: "high", description: "تم تلحيم الصدر" },
      { category: "صدر السيارة الخلفي", faultName: "صدر السيارة مبدل - Frame Replaced", severity: "high", description: "الصدر تم استبداله" },
      { category: "صدر السيارة الخلفي", faultName: "صدر السيارة مصبوغ - Frame Repainted", severity: "medium", description: "الصدر تم صبغه" },
      { category: "صدر السيارة الخلفي", faultName: "صدا - Rust", severity: "medium", description: "صدأ على الصدر" },
      { category: "صدر السيارة الخلفي", faultName: "صدا و تاكل - Rust & Corrosion", severity: "high", description: "صدأ وتآكل شديد" },

      // ═══════════════════════════════════════════════════════════════
      // المدقار الأمامي يمين - Front Right Fender
      // ═══════════════════════════════════════════════════════════════
      { category: "المدقار الأمامي يمين", faultName: "المدقار مبدل - Replaced", severity: "medium", description: "المدقار تم استبداله" },
      { category: "المدقار الأمامي يمين", faultName: "مصبوغ لكر تجميلي - Clear Coat Repaint", severity: "low", description: "صبغ لكر تجميلي" },
      { category: "المدقار الأمامي يمين", faultName: "مصبوغ معجون - Painted with Filler", severity: "medium", description: "مصبوغ مع معجون" },
      { category: "المدقار الأمامي يمين", faultName: "مصبوغ معجون بعض الأجزاء - Partial Filler", severity: "medium", description: "بعض الأجزاء مصبوغة بمعجون" },
      { category: "المدقار الأمامي يمين", faultName: "ملمع بولش - Polished", severity: "low", description: "تم تلميعه" },
      { category: "المدقار الأمامي يمين", faultName: "صبغ حالة سيئة - Poor Paint", severity: "medium", description: "الصبغ حالته سيئة" },
      { category: "المدقار الأمامي يمين", faultName: "يوجد جلاد - Stickers Present", severity: "low", description: "ملصقات على المدقار" },
      { category: "المدقار الأمامي يمين", faultName: "تصليح و تلحيم من الداخل - Internal Weld Repair", severity: "medium", description: "تصليح وتلحيم من الداخل" },
      { category: "المدقار الأمامي يمين", faultName: "تصليح من الداخل - Internal Repair", severity: "medium", description: "تصليح من الداخل" },
      { category: "المدقار الأمامي يمين", faultName: "صدا - Rust", severity: "medium", description: "صدأ" },
      { category: "المدقار الأمامي يمين", faultName: "صدا و تاكل - Rust & Corrosion", severity: "high", description: "صدأ وتآكل" },
      { category: "المدقار الأمامي يمين", faultName: "فك في البراغي - Loose Screws", severity: "low", description: "براغي غير مثبتة" },
      { category: "المدقار الأمامي يمين", faultName: "نقص براغي - Missing Screws", severity: "low", description: "براغي ناقصة" },
      { category: "المدقار الأمامي يمين", faultName: "خدوش - Scratches", severity: "low", description: "خدوش" },
      { category: "المدقار الأمامي يمين", faultName: "نقور - Chips", severity: "low", description: "نقور" },
      { category: "المدقار الأمامي يمين", faultName: "ضربة - Impact Damage", severity: "high", description: "ضربة" },
      { category: "المدقار الأمامي يمين", faultName: "سحب على البارد - Cold Pull", severity: "medium", description: "سحب على البارد" },
      { category: "المدقار الأمامي يمين", faultName: "شحفات - Scratches/Scuffs", severity: "low", description: "شحفات" },
      { category: "المدقار الأمامي يمين", faultName: "اختلاف في الميزانية - Misalignment", severity: "medium", description: "اختلاف في الميزانية" },

      // ═══════════════════════════════════════════════════════════════
      // المدقار الأمامي يسار - Front Left Fender
      // ═══════════════════════════════════════════════════════════════
      { category: "المدقار الأمامي يسار", faultName: "المدقار مبدل - Replaced", severity: "medium", description: "المدقار تم استبداله" },
      { category: "المدقار الأمامي يسار", faultName: "مصبوغ لكر تجميلي - Clear Coat Repaint", severity: "low", description: "صبغ لكر تجميلي" },
      { category: "المدقار الأمامي يسار", faultName: "مصبوغ معجون - Painted with Filler", severity: "medium", description: "مصبوغ مع معجون" },
      { category: "المدقار الأمامي يسار", faultName: "مصبوغ معجون بعض الأجزاء - Partial Filler", severity: "medium", description: "بعض الأجزاء مصبوغة بمعجون" },
      { category: "المدقار الأمامي يسار", faultName: "ملمع بولش - Polished", severity: "low", description: "تم تلميعه" },
      { category: "المدقار الأمامي يسار", faultName: "صبغ حالة سيئة - Poor Paint", severity: "medium", description: "الصبغ حالته سيئة" },
      { category: "المدقار الأمامي يسار", faultName: "يوجد جلاد - Stickers Present", severity: "low", description: "ملصقات على المدقار" },
      { category: "المدقار الأمامي يسار", faultName: "تصليح و تلحيم من الداخل - Internal Weld Repair", severity: "medium", description: "تصليح وتلحيم من الداخل" },
      { category: "المدقار الأمامي يسار", faultName: "تصليح من الداخل - Internal Repair", severity: "medium", description: "تصليح من الداخل" },
      { category: "المدقار الأمامي يسار", faultName: "صدا - Rust", severity: "medium", description: "صدأ" },
      { category: "المدقار الأمامي يسار", faultName: "صدا و تاكل - Rust & Corrosion", severity: "high", description: "صدأ وتآكل" },
      { category: "المدقار الأمامي يسار", faultName: "فك في البراغي - Loose Screws", severity: "low", description: "براغي غير مثبتة" },
      { category: "المدقار الأمامي يسار", faultName: "نقص براغي - Missing Screws", severity: "low", description: "براغي ناقصة" },
      { category: "المدقار الأمامي يسار", faultName: "خدوش - Scratches", severity: "low", description: "خدوش" },
      { category: "المدقار الأمامي يسار", faultName: "نقور - Chips", severity: "low", description: "نقور" },
      { category: "المدقار الأمامي يسار", faultName: "ضربة - Impact Damage", severity: "high", description: "ضربة" },
      { category: "المدقار الأمامي يسار", faultName: "سحب على البارد - Cold Pull", severity: "medium", description: "سحب على البارد" },
      { category: "المدقار الأمامي يسار", faultName: "شحفات - Scratches/Scuffs", severity: "low", description: "شحفات" },
      { category: "المدقار الأمامي يسار", faultName: "اختلاف في الميزانية - Misalignment", severity: "medium", description: "اختلاف في الميزانية" },

      // ═══════════════════════════════════════════════════════════════
      // المدقار الخلفي يمين - Rear Right Fender
      // ═══════════════════════════════════════════════════════════════
      { category: "المدقار الخلفي يمين", faultName: "المدقار مبدل - Replaced", severity: "medium", description: "المدقار تم استبداله" },
      { category: "المدقار الخلفي يمين", faultName: "مصبوغ لكر تجميلي - Clear Coat Repaint", severity: "low", description: "صبغ لكر تجميلي" },
      { category: "المدقار الخلفي يمين", faultName: "مصبوغ معجون - Painted with Filler", severity: "medium", description: "مصبوغ مع معجون" },
      { category: "المدقار الخلفي يمين", faultName: "مصبوغ معجون بعض الأجزاء - Partial Filler", severity: "medium", description: "بعض الأجزاء مصبوغة بمعجون" },
      { category: "المدقار الخلفي يمين", faultName: "ملمع بولش - Polished", severity: "low", description: "تم تلميعه" },
      { category: "المدقار الخلفي يمين", faultName: "صبغ حالة سيئة - Poor Paint", severity: "medium", description: "الصبغ حالته سيئة" },
      { category: "المدقار الخلفي يمين", faultName: "يوجد جلاد - Stickers Present", severity: "low", description: "ملصقات على المدقار" },
      { category: "المدقار الخلفي يمين", faultName: "تصليح و تلحيم من الداخل - Internal Weld Repair", severity: "medium", description: "تصليح وتلحيم من الداخل" },
      { category: "المدقار الخلفي يمين", faultName: "تصليح من الداخل - Internal Repair", severity: "medium", description: "تصليح من الداخل" },
      { category: "المدقار الخلفي يمين", faultName: "صدا - Rust", severity: "medium", description: "صدأ" },
      { category: "المدقار الخلفي يمين", faultName: "صدا و تاكل - Rust & Corrosion", severity: "high", description: "صدأ وتآكل" },
      { category: "المدقار الخلفي يمين", faultName: "فك في البراغي - Loose Screws", severity: "low", description: "براغي غير مثبتة" },
      { category: "المدقار الخلفي يمين", faultName: "نقص براغي - Missing Screws", severity: "low", description: "براغي ناقصة" },
      { category: "المدقار الخلفي يمين", faultName: "خدوش - Scratches", severity: "low", description: "خدوش" },
      { category: "المدقار الخلفي يمين", faultName: "نقور - Chips", severity: "low", description: "نقور" },
      { category: "المدقار الخلفي يمين", faultName: "ضربة - Impact Damage", severity: "high", description: "ضربة" },
      { category: "المدقار الخلفي يمين", faultName: "سحب على البارد - Cold Pull", severity: "medium", description: "سحب على البارد" },
      { category: "المدقار الخلفي يمين", faultName: "شحفات - Scratches/Scuffs", severity: "low", description: "شحفات" },
      { category: "المدقار الخلفي يمين", faultName: "اختلاف في الميزانية - Misalignment", severity: "medium", description: "اختلاف في الميزانية" },

      // ═══════════════════════════════════════════════════════════════
      // المدقار الخلفي يسار - Rear Left Fender
      // ═══════════════════════════════════════════════════════════════
      { category: "المدقار الخلفي يسار", faultName: "المدقار مبدل - Replaced", severity: "medium", description: "المدقار تم استبداله" },
      { category: "المدقار الخلفي يسار", faultName: "مصبوغ لكر تجميلي - Clear Coat Repaint", severity: "low", description: "صبغ لكر تجميلي" },
      { category: "المدقار الخلفي يسار", faultName: "مصبوغ معجون - Painted with Filler", severity: "medium", description: "مصبوغ مع معجون" },
      { category: "المدقار الخلفي يسار", faultName: "مصبوغ معجون بعض الأجزاء - Partial Filler", severity: "medium", description: "بعض الأجزاء مصبوغة بمعجون" },
      { category: "المدقار الخلفي يسار", faultName: "ملمع بولش - Polished", severity: "low", description: "تم تلميعه" },
      { category: "المدقار الخلفي يسار", faultName: "صبغ حالة سيئة - Poor Paint", severity: "medium", description: "الصبغ حالته سيئة" },
      { category: "المدقار الخلفي يسار", faultName: "يوجد جلاد - Stickers Present", severity: "low", description: "ملصقات على المدقار" },
      { category: "المدقار الخلفي يسار", faultName: "تصليح و تلحيم من الداخل - Internal Weld Repair", severity: "medium", description: "تصليح وتلحيم من الداخل" },
      { category: "المدقار الخلفي يسار", faultName: "تصليح من الداخل - Internal Repair", severity: "medium", description: "تصليح من الداخل" },
      { category: "المدقار الخلفي يسار", faultName: "صدا - Rust", severity: "medium", description: "صدأ" },
      { category: "المدقار الخلفي يسار", faultName: "صدا و تاكل - Rust & Corrosion", severity: "high", description: "صدأ وتآكل" },
      { category: "المدقار الخلفي يسار", faultName: "فك في البراغي - Loose Screws", severity: "low", description: "براغي غير مثبتة" },
      { category: "المدقار الخلفي يسار", faultName: "نقص براغي - Missing Screws", severity: "low", description: "براغي ناقصة" },
      { category: "المدقار الخلفي يسار", faultName: "خدوش - Scratches", severity: "low", description: "خدوش" },
      { category: "المدقار الخلفي يسار", faultName: "نقور - Chips", severity: "low", description: "نقور" },
      { category: "المدقار الخلفي يسار", faultName: "ضربة - Impact Damage", severity: "high", description: "ضربة" },
      { category: "المدقار الخلفي يسار", faultName: "سحب على البارد - Cold Pull", severity: "medium", description: "سحب على البارد" },
      { category: "المدقار الخلفي يسار", faultName: "شحفات - Scratches/Scuffs", severity: "low", description: "شحفات" },
      { category: "المدقار الخلفي يسار", faultName: "اختلاف في الميزانية - Misalignment", severity: "medium", description: "اختلاف في الميزانية" },

      // ═══════════════════════════════════════════════════════════════
      // الباب الأمامي يمين - Front Right Door
      // ═══════════════════════════════════════════════════════════════
      { category: "الباب الأمامي يمين", faultName: "الباب مبدل - Replaced", severity: "medium", description: "الباب تم استبداله" },
      { category: "الباب الأمامي يمين", faultName: "مصبوغ لكر تجميلي - Clear Coat Repaint", severity: "low", description: "صبغ لكر تجميلي" },
      { category: "الباب الأمامي يمين", faultName: "مصبوغ معجون - Painted with Filler", severity: "medium", description: "مصبوغ مع معجون" },
      { category: "الباب الأمامي يمين", faultName: "مصبوغ معجون بعض الأجزاء - Partial Filler", severity: "medium", description: "بعض الأجزاء مصبوغة بمعجون" },
      { category: "الباب الأمامي يمين", faultName: "مرشوش صبغ - Spray Painted", severity: "low", description: "مرشوش صبغ" },
      { category: "الباب الأمامي يمين", faultName: "ملمع بولش - Polished", severity: "low", description: "تم تلميعه" },
      { category: "الباب الأمامي يمين", faultName: "يوجد جلاد - Stickers Present", severity: "low", description: "ملصقات" },
      { category: "الباب الأمامي يمين", faultName: "خدوش - Scratches", severity: "low", description: "خدوش" },
      { category: "الباب الأمامي يمين", faultName: "نقور - Chips", severity: "low", description: "نقور" },
      { category: "الباب الأمامي يمين", faultName: "ضربة - Impact Damage", severity: "high", description: "ضربة" },
      { category: "الباب الأمامي يمين", faultName: "اختلاف في الميزانية - Misalignment", severity: "medium", description: "اختلاف في الميزانية" },
      { category: "الباب الأمامي يمين", faultName: "فك في براغي - Loose Screws", severity: "low", description: "براغي غير مثبتة" },
      { category: "الباب الأمامي يمين", faultName: "نقص براغي - Missing Screws", severity: "low", description: "براغي ناقصة" },
      { category: "الباب الأمامي يمين", faultName: "مفصلة حالة سيئة - Hinge Poor Condition", severity: "medium", description: "المفصلة حالتها سيئة" },
      { category: "الباب الأمامي يمين", faultName: "مفصلة كسر - Hinge Broken", severity: "high", description: "المفصلة مكسورة" },
      { category: "الباب الأمامي يمين", faultName: "قبضة حالة سيئة - Handle Poor Condition", severity: "medium", description: "القبضة حالتها سيئة" },
      { category: "الباب الأمامي يمين", faultName: "قبضة كسر - Handle Broken", severity: "medium", description: "القبضة مكسورة" },
      { category: "الباب الأمامي يمين", faultName: "قبضة لا توجد - Handle Missing", severity: "medium", description: "القبضة غير موجودة" },
      { category: "الباب الأمامي يمين", faultName: "قبضة تثبيت سيئ - Handle Poor Installation", severity: "low", description: "تثبيت القبضة سيئ" },
      { category: "الباب الأمامي يمين", faultName: "كفر الباب من الداخل كسر - Inner Panel Broken", severity: "medium", description: "كفر الباب مكسور" },
      { category: "الباب الأمامي يمين", faultName: "كفر الباب من الداخل تثبيت سيئ - Inner Panel Poor Install", severity: "low", description: "تثبيت كفر الباب سيئ" },
      { category: "الباب الأمامي يمين", faultName: "كفر الباب من الداخل منجد - Inner Panel Upholstered", severity: "low", description: "كفر الباب منجد" },
      { category: "الباب الأمامي يمين", faultName: "ربلة الباب حالة سيئة - Door Seal Poor Condition", severity: "low", description: "ربلة الباب حالتها سيئة" },
      { category: "الباب الأمامي يمين", faultName: "ربلة الباب قطع - Door Seal Cut", severity: "low", description: "ربلة الباب مقطوعة" },
      { category: "الباب الأمامي يمين", faultName: "ربلة الباب لا توجد - Door Seal Missing", severity: "medium", description: "ربلة الباب غير موجودة" },
      { category: "الباب الأمامي يمين", faultName: "جامة الباب لا تعمل - Window Not Working", severity: "medium", description: "جامة الباب لا تعمل" },
      { category: "الباب الأمامي يمين", faultName: "جامة الباب كسر - Window Broken", severity: "high", description: "جامة الباب مكسورة" },
      { category: "الباب الأمامي يمين", faultName: "موتور الجامة لا يعمل - Window Motor Not Working", severity: "medium", description: "موتور الجامة لا يعمل" },
      { category: "الباب الأمامي يمين", faultName: "ازرار تحكم لا تعمل - Controls Not Working", severity: "medium", description: "أزرار التحكم لا تعمل" },

      // ═══════════════════════════════════════════════════════════════
      // الباب الأمامي يسار - Front Left Door
      // ═══════════════════════════════════════════════════════════════
      { category: "الباب الأمامي يسار", faultName: "الباب مبدل - Replaced", severity: "medium", description: "الباب تم استبداله" },
      { category: "الباب الأمامي يسار", faultName: "مصبوغ لكر تجميلي - Clear Coat Repaint", severity: "low", description: "صبغ لكر تجميلي" },
      { category: "الباب الأمامي يسار", faultName: "مصبوغ معجون - Painted with Filler", severity: "medium", description: "مصبوغ مع معجون" },
      { category: "الباب الأمامي يسار", faultName: "مصبوغ معجون بعض الأجزاء - Partial Filler", severity: "medium", description: "بعض الأجزاء مصبوغة بمعجون" },
      { category: "الباب الأمامي يسار", faultName: "مرشوش صبغ - Spray Painted", severity: "low", description: "مرشوش صبغ" },
      { category: "الباب الأمامي يسار", faultName: "ملمع بولش - Polished", severity: "low", description: "تم تلميعه" },
      { category: "الباب الأمامي يسار", faultName: "يوجد جلاد - Stickers Present", severity: "low", description: "ملصقات" },
      { category: "الباب الأمامي يسار", faultName: "خدوش - Scratches", severity: "low", description: "خدوش" },
      { category: "الباب الأمامي يسار", faultName: "نقور - Chips", severity: "low", description: "نقور" },
      { category: "الباب الأمامي يسار", faultName: "ضربة - Impact Damage", severity: "high", description: "ضربة" },
      { category: "الباب الأمامي يسار", faultName: "اختلاف في الميزانية - Misalignment", severity: "medium", description: "اختلاف في الميزانية" },
      { category: "الباب الأمامي يسار", faultName: "فك في براغي - Loose Screws", severity: "low", description: "براغي غير مثبتة" },
      { category: "الباب الأمامي يسار", faultName: "نقص براغي - Missing Screws", severity: "low", description: "براغي ناقصة" },
      { category: "الباب الأمامي يسار", faultName: "مفصلة حالة سيئة - Hinge Poor Condition", severity: "medium", description: "المفصلة حالتها سيئة" },
      { category: "الباب الأمامي يسار", faultName: "مفصلة كسر - Hinge Broken", severity: "high", description: "المفصلة مكسورة" },
      { category: "الباب الأمامي يسار", faultName: "قبضة حالة سيئة - Handle Poor Condition", severity: "medium", description: "القبضة حالتها سيئة" },
      { category: "الباب الأمامي يسار", faultName: "قبضة كسر - Handle Broken", severity: "medium", description: "القبضة مكسورة" },
      { category: "الباب الأمامي يسار", faultName: "قبضة لا توجد - Handle Missing", severity: "medium", description: "القبضة غير موجودة" },
      { category: "الباب الأمامي يسار", faultName: "قبضة تثبيت سيئ - Handle Poor Installation", severity: "low", description: "تثبيت القبضة سيئ" },
      { category: "الباب الأمامي يسار", faultName: "كفر الباب من الداخل كسر - Inner Panel Broken", severity: "medium", description: "كفر الباب مكسور" },
      { category: "الباب الأمامي يسار", faultName: "كفر الباب من الداخل تثبيت سيئ - Inner Panel Poor Install", severity: "low", description: "تثبيت كفر الباب سيئ" },
      { category: "الباب الأمامي يسار", faultName: "كفر الباب من الداخل منجد - Inner Panel Upholstered", severity: "low", description: "كفر الباب منجد" },
      { category: "الباب الأمامي يسار", faultName: "ربلة الباب حالة سيئة - Door Seal Poor Condition", severity: "low", description: "ربلة الباب حالتها سيئة" },
      { category: "الباب الأمامي يسار", faultName: "ربلة الباب قطع - Door Seal Cut", severity: "low", description: "ربلة الباب مقطوعة" },
      { category: "الباب الأمامي يسار", faultName: "ربلة الباب لا توجد - Door Seal Missing", severity: "medium", description: "ربلة الباب غير موجودة" },
      { category: "الباب الأمامي يسار", faultName: "جامة الباب لا تعمل - Window Not Working", severity: "medium", description: "جامة الباب لا تعمل" },
      { category: "الباب الأمامي يسار", faultName: "جامة الباب كسر - Window Broken", severity: "high", description: "جامة الباب مكسورة" },
      { category: "الباب الأمامي يسار", faultName: "موتور الجامة لا يعمل - Window Motor Not Working", severity: "medium", description: "موتور الجامة لا يعمل" },
      { category: "الباب الأمامي يسار", faultName: "ازرار تحكم لا تعمل - Controls Not Working", severity: "medium", description: "أزرار التحكم لا تعمل" },

      // ═══════════════════════════════════════════════════════════════
      // الباب الخلفي يمين - Rear Right Door
      // ═══════════════════════════════════════════════════════════════
      { category: "الباب الخلفي يمين", faultName: "الباب مبدل - Replaced", severity: "medium", description: "الباب تم استبداله" },
      { category: "الباب الخلفي يمين", faultName: "مصبوغ لكر تجميلي - Clear Coat Repaint", severity: "low", description: "صبغ لكر تجميلي" },
      { category: "الباب الخلفي يمين", faultName: "مصبوغ معجون - Painted with Filler", severity: "medium", description: "مصبوغ مع معجون" },
      { category: "الباب الخلفي يمين", faultName: "مصبوغ معجون بعض الأجزاء - Partial Filler", severity: "medium", description: "بعض الأجزاء مصبوغة بمعجون" },
      { category: "الباب الخلفي يمين", faultName: "مرشوش صبغ - Spray Painted", severity: "low", description: "مرشوش صبغ" },
      { category: "الباب الخلفي يمين", faultName: "ملمع بولش - Polished", severity: "low", description: "تم تلميعه" },
      { category: "الباب الخلفي يمين", faultName: "يوجد جلاد - Stickers Present", severity: "low", description: "ملصقات" },
      { category: "الباب الخلفي يمين", faultName: "خدوش - Scratches", severity: "low", description: "خدوش" },
      { category: "الباب الخلفي يمين", faultName: "نقور - Chips", severity: "low", description: "نقور" },
      { category: "الباب الخلفي يمين", faultName: "ضربة - Impact Damage", severity: "high", description: "ضربة" },
      { category: "الباب الخلفي يمين", faultName: "اختلاف في الميزانية - Misalignment", severity: "medium", description: "اختلاف في الميزانية" },
      { category: "الباب الخلفي يمين", faultName: "فك في براغي - Loose Screws", severity: "low", description: "براغي غير مثبتة" },
      { category: "الباب الخلفي يمين", faultName: "نقص براغي - Missing Screws", severity: "low", description: "براغي ناقصة" },
      { category: "الباب الخلفي يمين", faultName: "مفصلة حالة سيئة - Hinge Poor Condition", severity: "medium", description: "المفصلة حالتها سيئة" },
      { category: "الباب الخلفي يمين", faultName: "مفصلة كسر - Hinge Broken", severity: "high", description: "المفصلة مكسورة" },
      { category: "الباب الخلفي يمين", faultName: "قبضة حالة سيئة - Handle Poor Condition", severity: "medium", description: "القبضة حالتها سيئة" },
      { category: "الباب الخلفي يمين", faultName: "قبضة كسر - Handle Broken", severity: "medium", description: "القبضة مكسورة" },
      { category: "الباب الخلفي يمين", faultName: "قبضة لا توجد - Handle Missing", severity: "medium", description: "القبضة غير موجودة" },
      { category: "الباب الخلفي يمين", faultName: "قبضة تثبيت سيئ - Handle Poor Installation", severity: "low", description: "تثبيت القبضة سيئ" },
      { category: "الباب الخلفي يمين", faultName: "كفر الباب من الداخل كسر - Inner Panel Broken", severity: "medium", description: "كفر الباب مكسور" },
      { category: "الباب الخلفي يمين", faultName: "كفر الباب من الداخل تثبيت سيئ - Inner Panel Poor Install", severity: "low", description: "تثبيت كفر الباب سيئ" },
      { category: "الباب الخلفي يمين", faultName: "كفر الباب من الداخل منجد - Inner Panel Upholstered", severity: "low", description: "كفر الباب منجد" },
      { category: "الباب الخلفي يمين", faultName: "ربلة الباب حالة سيئة - Door Seal Poor Condition", severity: "low", description: "ربلة الباب حالتها سيئة" },
      { category: "الباب الخلفي يمين", faultName: "ربلة الباب قطع - Door Seal Cut", severity: "low", description: "ربلة الباب مقطوعة" },
      { category: "الباب الخلفي يمين", faultName: "ربلة الباب لا توجد - Door Seal Missing", severity: "medium", description: "ربلة الباب غير موجودة" },
      { category: "الباب الخلفي يمين", faultName: "جامة الباب لا تعمل - Window Not Working", severity: "medium", description: "جامة الباب لا تعمل" },
      { category: "الباب الخلفي يمين", faultName: "جامة الباب كسر - Window Broken", severity: "high", description: "جامة الباب مكسورة" },
      { category: "الباب الخلفي يمين", faultName: "موتور الجامة لا يعمل - Window Motor Not Working", severity: "medium", description: "موتور الجامة لا يعمل" },
      { category: "الباب الخلفي يمين", faultName: "ازرار تحكم لا تعمل - Controls Not Working", severity: "medium", description: "أزرار التحكم لا تعمل" },

      // ═══════════════════════════════════════════════════════════════
      // الباب الخلفي يسار - Rear Left Door
      // ═══════════════════════════════════════════════════════════════
      { category: "الباب الخلفي يسار", faultName: "الباب مبدل - Replaced", severity: "medium", description: "الباب تم استبداله" },
      { category: "الباب الخلفي يسار", faultName: "مصبوغ لكر تجميلي - Clear Coat Repaint", severity: "low", description: "صبغ لكر تجميلي" },
      { category: "الباب الخلفي يسار", faultName: "مصبوغ معجون - Painted with Filler", severity: "medium", description: "مصبوغ مع معجون" },
      { category: "الباب الخلفي يسار", faultName: "مصبوغ معجون بعض الأجزاء - Partial Filler", severity: "medium", description: "بعض الأجزاء مصبوغة بمعجون" },
      { category: "الباب الخلفي يسار", faultName: "مرشوش صبغ - Spray Painted", severity: "low", description: "مرشوش صبغ" },
      { category: "الباب الخلفي يسار", faultName: "ملمع بولش - Polished", severity: "low", description: "تم تلميعه" },
      { category: "الباب الخلفي يسار", faultName: "يوجد جلاد - Stickers Present", severity: "low", description: "ملصقات" },
      { category: "الباب الخلفي يسار", faultName: "خدوش - Scratches", severity: "low", description: "خدوش" },
      { category: "الباب الخلفي يسار", faultName: "نقور - Chips", severity: "low", description: "نقور" },
      { category: "الباب الخلفي يسار", faultName: "ضربة - Impact Damage", severity: "high", description: "ضربة" },
      { category: "الباب الخلفي يسار", faultName: "اختلاف في الميزانية - Misalignment", severity: "medium", description: "اختلاف في الميزانية" },
      { category: "الباب الخلفي يسار", faultName: "فك في براغي - Loose Screws", severity: "low", description: "براغي غير مثبتة" },
      { category: "الباب الخلفي يسار", faultName: "نقص براغي - Missing Screws", severity: "low", description: "براغي ناقصة" },
      { category: "الباب الخلفي يسار", faultName: "مفصلة حالة سيئة - Hinge Poor Condition", severity: "medium", description: "المفصلة حالتها سيئة" },
      { category: "الباب الخلفي يسار", faultName: "مفصلة كسر - Hinge Broken", severity: "high", description: "المفصلة مكسورة" },
      { category: "الباب الخلفي يسار", faultName: "قبضة حالة سيئة - Handle Poor Condition", severity: "medium", description: "القبضة حالتها سيئة" },
      { category: "الباب الخلفي يسار", faultName: "قبضة كسر - Handle Broken", severity: "medium", description: "القبضة مكسورة" },
      { category: "الباب الخلفي يسار", faultName: "قبضة لا توجد - Handle Missing", severity: "medium", description: "القبضة غير موجودة" },
      { category: "الباب الخلفي يسار", faultName: "قبضة تثبيت سيئ - Handle Poor Installation", severity: "low", description: "تثبيت القبضة سيئ" },
      { category: "الباب الخلفي يسار", faultName: "كفر الباب من الداخل كسر - Inner Panel Broken", severity: "medium", description: "كفر الباب مكسور" },
      { category: "الباب الخلفي يسار", faultName: "كفر الباب من الداخل تثبيت سيئ - Inner Panel Poor Install", severity: "low", description: "تثبيت كفر الباب سيئ" },
      { category: "الباب الخلفي يسار", faultName: "كفر الباب من الداخل منجد - Inner Panel Upholstered", severity: "low", description: "كفر الباب منجد" },
      { category: "الباب الخلفي يسار", faultName: "ربلة الباب حالة سيئة - Door Seal Poor Condition", severity: "low", description: "ربلة الباب حالتها سيئة" },
      { category: "الباب الخلفي يسار", faultName: "ربلة الباب قطع - Door Seal Cut", severity: "low", description: "ربلة الباب مقطوعة" },
      { category: "الباب الخلفي يسار", faultName: "ربلة الباب لا توجد - Door Seal Missing", severity: "medium", description: "ربلة الباب غير موجودة" },
      { category: "الباب الخلفي يسار", faultName: "جامة الباب لا تعمل - Window Not Working", severity: "medium", description: "جامة الباب لا تعمل" },
      { category: "الباب الخلفي يسار", faultName: "جامة الباب كسر - Window Broken", severity: "high", description: "جامة الباب مكسورة" },
      { category: "الباب الخلفي يسار", faultName: "موتور الجامة لا يعمل - Window Motor Not Working", severity: "medium", description: "موتور الجامة لا يعمل" },
      { category: "الباب الخلفي يسار", faultName: "ازرار تحكم لا تعمل - Controls Not Working", severity: "medium", description: "أزرار التحكم لا تعمل" },

      // ═══════════════════════════════════════════════════════════════
      // الدبة - Trunk
      // ═══════════════════════════════════════════════════════════════
      { category: "الدبة", faultName: "مبدلة - Replaced", severity: "medium", description: "الدبة تم استبدالها" },
      { category: "الدبة", faultName: "مصبوغة معجون - Painted with Filler", severity: "medium", description: "مصبوغة مع معجون" },
      { category: "الدبة", faultName: "مصبوغة معجون بعض الأجزاء - Partial Filler", severity: "medium", description: "بعض الأجزاء مصبوغة بمعجون" },
      { category: "الدبة", faultName: "مصبوغة لكر - Clear Coat Repaint", severity: "low", description: "مصبوغة لكر" },
      { category: "الدبة", faultName: "عليها جلاد - Stickers Present", severity: "low", description: "ملصقات على الدبة" },
      { category: "الدبة", faultName: "بولش - Polished", severity: "low", description: "تم تلميعها" },
      { category: "الدبة", faultName: "خدوش - Scratches", severity: "low", description: "خدوش" },
      { category: "الدبة", faultName: "نقور - Chips", severity: "low", description: "نقور" },
      { category: "الدبة", faultName: "ضربة - Impact Damage", severity: "high", description: "ضربة" },
      { category: "الدبة", faultName: "مرشوشة من الداخل و الخارج - Inside & Outside Spray", severity: "medium", description: "مرشوشة صبغ من الداخل والخارج" },
      { category: "الدبة", faultName: "تصليح و تلحيم من الداخل - Internal Weld Repair", severity: "medium", description: "تصليح وتلحيم من الداخل" },
      { category: "الدبة", faultName: "تصليح و تلحيم أعلى - Top Weld Repair", severity: "medium", description: "تصليح وتلحيم من أعلى" },
      { category: "الدبة", faultName: "تصليح و تلحيم أسفل - Bottom Weld Repair", severity: "medium", description: "تصليح وتلحيم من أسفل" },
      { category: "الدبة", faultName: "صدا - Rust", severity: "medium", description: "صدأ" },
      { category: "الدبة", faultName: "جانبين حالة سيئة - Sides Poor Condition", severity: "medium", description: "الجانبين حالتهم سيئة" },
      { category: "الدبة", faultName: "كفر حالة سيئة - Cover Poor Condition", severity: "low", description: "الغطاء حالته سيئة" },
      { category: "الدبة", faultName: "كفر لا يوجد - Cover Missing", severity: "low", description: "الغطاء غير موجود" },
      { category: "الدبة", faultName: "كفر قطع - Cover Cut", severity: "low", description: "الغطاء مقطوع" },
      { category: "الدبة", faultName: "كفر نقص كليبات - Cover Missing Clips", severity: "low", description: "كليبات الغطاء ناقصة" },
      { category: "الدبة", faultName: "ربلات حالة سيئة - Seals Poor Condition", severity: "low", description: "الربلات حالتها سيئة" },
      { category: "الدبة", faultName: "ربلات لا توجد - Seals Missing", severity: "medium", description: "الربلات غير موجودة" },
      { category: "الدبة", faultName: "ربلات قطع - Seals Cut", severity: "low", description: "الربلات مقطوعة" },
      { category: "الدبة", faultName: "اختلاف في الميزانية - Misalignment", severity: "medium", description: "اختلاف في الميزانية" },
      { category: "الدبة", faultName: "ضربة في حوض الدبة من الداخل - Internal Floor Impact", severity: "high", description: "ضربة في حوض الدبة من الداخل" },
      { category: "الدبة", faultName: "ضربة في حوض الدبة أسفل - Floor Bottom Impact", severity: "high", description: "ضربة في حوض الدبة من أسفل" },
      { category: "الدبة", faultName: "حوض الدبة مبدل - Floor Replaced", severity: "high", description: "حوض الدبة تم استبداله" },
      { category: "الدبة", faultName: "حوض الدبة مصبوغ - Floor Repainted", severity: "medium", description: "حوض الدبة تم صبغه" },
      { category: "الدبة", faultName: "حوض الدبة صدا - Floor Rust", severity: "medium", description: "حوض الدبة فيه صدأ" },
      { category: "الدبة", faultName: "حوض الدبة صدا و تاكل - Floor Rust & Corrosion", severity: "high", description: "حوض الدبة فيه صدأ وتآكل" },
      { category: "الدبة", faultName: "لوك لا يعمل - Lock Not Working", severity: "medium", description: "القفل لا يعمل" },
      { category: "الدبة", faultName: "لوك حالة سيئة - Lock Poor Condition", severity: "medium", description: "القفل حالته سيئة" },
      { category: "الدبة", faultName: "لوك ضربة - Lock Impact", severity: "medium", description: "القفل فيه ضربة" },
      { category: "الدبة", faultName: "موتور فتح و قفل لا يعمل - Motor Not Working", severity: "medium", description: "موتور الفتح والقفل لا يعمل" },

      // ═══════════════════════════════════════════════════════════════
      // الفخد - Quarter Panel
      // ═══════════════════════════════════════════════════════════════
      { category: "الفخد", faultName: "ضربة من الداخل - Internal Impact", severity: "high", description: "ضربة من الداخل" },
      { category: "الفخد", faultName: "ضربة أمامي - Front Impact", severity: "high", description: "ضربة من الأمام" },
      { category: "الفخد", faultName: "ضربة خلفي - Rear Impact", severity: "high", description: "ضربة من الخلف" },
      { category: "الفخد", faultName: "ضربة يمين - Right Impact", severity: "high", description: "ضربة من اليمين" },
      { category: "الفخد", faultName: "ضربة يسار - Left Impact", severity: "high", description: "ضربة من اليسار" },
      { category: "الفخد", faultName: "تصليح و تلحيم من الداخل - Internal Weld Repair", severity: "medium", description: "تصليح وتلحيم من الداخل" },
      { category: "الفخد", faultName: "صدا - Rust", severity: "medium", description: "صدأ" },
      { category: "الفخد", faultName: "صدا و تاكل - Rust & Corrosion", severity: "high", description: "صدأ وتآكل" },
      { category: "الفخد", faultName: "ضربة و استعدال من الداخل - Internal Impact & Straightened", severity: "medium", description: "ضربة واستعدال من الداخل" },
      { category: "الفخد", faultName: "مبدل - Replaced", severity: "high", description: "تم استبداله" },
      { category: "الفخد", faultName: "مصبوغ - Repainted", severity: "medium", description: "تم صبغه" },

      // ═══════════════════════════════════════════════════════════════
      // السقف - Roof
      // ═══════════════════════════════════════════════════════════════
      { category: "السقف", faultName: "السقف مبدل - Replaced", severity: "high", description: "السقف تم استبداله" },
      { category: "السقف", faultName: "مصبوغ معجون كامل - Full Filler Paint", severity: "medium", description: "مصبوغ معجون كامل" },
      { category: "السقف", faultName: "مصبوغ معجون بعض الأجزاء - Partial Filler Paint", severity: "medium", description: "مصبوغ معجون بعض الأجزاء" },
      { category: "السقف", faultName: "مصبوغ لكر - Clear Coat Repaint", severity: "low", description: "مصبوغ لكر" },
      { category: "السقف", faultName: "مرشوش صبغ - Spray Painted", severity: "low", description: "مرشوش صبغ" },
      { category: "السقف", faultName: "ضربات - Dents", severity: "high", description: "ضربات" },
      { category: "السقف", faultName: "صبغ حالة سيئة - Poor Paint", severity: "medium", description: "الصبغ حالته سيئة" },
      { category: "السقف", faultName: "نقور - Chips", severity: "low", description: "نقور" },
      { category: "السقف", faultName: "ملمع بولش - Polished", severity: "low", description: "تم تلميعه" },
      { category: "السقف", faultName: "يوجد جلاد - Stickers Present", severity: "low", description: "ملصقات" },
      { category: "السقف", faultName: "تصليح - Repaired", severity: "medium", description: "تم تصليحه" },
      { category: "السقف", faultName: "قطع و لحام - Cut & Welded", severity: "high", description: "قطع ولحام" },
      { category: "السقف", faultName: "صدا - Rust", severity: "medium", description: "صدأ" },
      { category: "السقف", faultName: "صدا و تاكل - Rust & Corrosion", severity: "high", description: "صدأ وتآكل" },
      { category: "السقف", faultName: "بانوراما لا يعمل - Panorama Not Working", severity: "medium", description: "البانوراما لا تعمل" },
      { category: "السقف", faultName: "قماش بانوراما حالة سيئة - Panorama Fabric Poor", severity: "low", description: "قماش البانوراما حالته سيئة" },
      { category: "السقف", faultName: "قماش بانوراما قطع - Panorama Fabric Cut", severity: "medium", description: "قماش البانوراما مقطوع" },
      { category: "السقف", faultName: "فتحة السقف مبدلة - Sunroof Replaced", severity: "medium", description: "فتحة السقف تم استبدالها" },
      { category: "السقف", faultName: "فتحة السقف لا تعمل - Sunroof Not Working", severity: "medium", description: "فتحة السقف لا تعمل" },
      { category: "السقف", faultName: "فتحة السقف كسر - Sunroof Broken", severity: "high", description: "فتحة السقف مكسورة" },
      { category: "السقف", faultName: "موتور فتحة السقف لا يوجد - Sunroof Motor Missing", severity: "medium", description: "موتور فتحة السقف غير موجود" },
      { category: "السقف", faultName: "فتحة السقف مجيمة - Sunroof Stuck", severity: "medium", description: "فتحة السقف مجيمة" },
      { category: "السقف", faultName: "ربلة فتحة حالة سيئة - Sunroof Seal Poor", severity: "low", description: "ربلة فتحة السقف حالتها سيئة" },
      { category: "السقف", faultName: "ربلة فتحة قطع - Sunroof Seal Cut", severity: "low", description: "ربلة فتحة السقف مقطوعة" },
      { category: "السقف", faultName: "نيكل كروم كسر - Chrome Broken", severity: "medium", description: "الكروم مكسور" },
      { category: "السقف", faultName: "نيكل كروم لا يوجد - Chrome Missing", severity: "medium", description: "الكروم غير موجود" },
      { category: "السقف", faultName: "نيكل كروم تثبيت سيئ - Chrome Poor Installation", severity: "low", description: "تثبيت الكروم سيئ" },

      // ═══════════════════════════════════════════════════════════════
      // القوائم - Pillars
      // ═══════════════════════════════════════════════════════════════
      { category: "القوائم", faultName: "القائم مبدل - Pillar Replaced", severity: "high", description: "القائم تم استبداله" },
      { category: "القوائم", faultName: "قطع و لحام - Cut & Welded", severity: "high", description: "قطع ولحام" },
      { category: "القوائم", faultName: "مصبوغ معجون - Painted with Filler", severity: "medium", description: "مصبوغ معجون" },
      { category: "القوائم", faultName: "مصبوغ لكر - Clear Coat Repaint", severity: "low", description: "مصبوغ لكر" },
      { category: "القوائم", faultName: "ضربات - Dents", severity: "high", description: "ضربات" },
      { category: "القوائم", faultName: "صدا - Rust", severity: "medium", description: "صدأ" },
      { category: "القوائم", faultName: "صدا و تاكل - Rust & Corrosion", severity: "high", description: "صدأ وتآكل" },
      { category: "القوائم", faultName: "يوجد جلاد - Stickers Present", severity: "low", description: "ملصقات" },
      { category: "القوائم", faultName: "نقور - Chips", severity: "low", description: "نقور" },
      { category: "القوائم", faultName: "خدوش - Scratches", severity: "low", description: "خدوش" },
      { category: "القوائم", faultName: "صبغ حالة سيئة - Poor Paint", severity: "medium", description: "الصبغ حالته سيئة" },
      { category: "القوائم", faultName: "مرشوش - Spray Painted", severity: "low", description: "مرشوش صبغ" },
      { category: "القوائم", faultName: "تصليح من الداخل - Internal Repair", severity: "medium", description: "تصليح من الداخل" },
      { category: "القوائم", faultName: "ملمع بولش - Polished", severity: "low", description: "تم تلميعه" },

      // ═══════════════════════════════════════════════════════════════
      // الجامات - Windows
      // ═══════════════════════════════════════════════════════════════
      { category: "الجامات", faultName: "الجامة مبدلة - Window Replaced", severity: "medium", description: "الجامة تم استبدالها" },
      { category: "الجامات", faultName: "كسر - Broken", severity: "high", description: "مكسورة" },
      { category: "الجامات", faultName: "خدوش - Scratches", severity: "low", description: "خدوش" },
      { category: "الجامات", faultName: "نقور - Chips", severity: "low", description: "نقور" },
      { category: "الجامات", faultName: "جامة الباب لا تعمل - Door Window Not Working", severity: "medium", description: "جامة الباب لا تعمل" },
      { category: "الجامات", faultName: "ربلة حالة سيئة - Seal Poor Condition", severity: "low", description: "ربلة حالتها سيئة" },
      { category: "الجامات", faultName: "ربلة قطع - Seal Cut", severity: "low", description: "ربلة مقطوعة" },
      { category: "الجامات", faultName: "ربلة لا توجد - Seal Missing", severity: "medium", description: "ربلة غير موجودة" },
      { category: "الجامات", faultName: "موتور لا يعمل - Motor Not Working", severity: "medium", description: "الموتور لا يعمل" },
      { category: "الجامات", faultName: "زرار تحكم لا يعمل - Control Button Not Working", severity: "medium", description: "زر التحكم لا يعمل" },
      { category: "الجامات", faultName: "زرار تحكم لا يوجد - Control Button Missing", severity: "medium", description: "زر التحكم غير موجود" },
      { category: "الجامات", faultName: "زرار تحكم كسر - Control Button Broken", severity: "medium", description: "زر التحكم مكسور" },
      { category: "الجامات", faultName: "ازرار تحكم جامات الابواب تثبيت سيئ - Button Poor Install", severity: "low", description: "تثبيت أزرار التحكم سيئ" },
      { category: "الجامات", faultName: "المراية كسر - Mirror Broken", severity: "medium", description: "المراية مكسورة" },
      { category: "الجامات", faultName: "جامة المراية كسر - Mirror Glass Broken", severity: "medium", description: "جامة المراية مكسورة" },
      { category: "الجامات", faultName: "المراية تثبيت سيئ - Mirror Poor Installation", severity: "low", description: "تثبيت المراية سيئ" },
      { category: "الجامات", faultName: "المراية لا توجد - Mirror Missing", severity: "medium", description: "المراية غير موجودة" },

      // ═══════════════════════════════════════════════════════════════
      // الليتات الأمامية - Front Lights
      // ═══════════════════════════════════════════════════════════════
      { category: "الليتات الأمامية", faultName: "الليت مبدل - Light Replaced", severity: "medium", description: "الليت تم استبداله" },
      { category: "الليتات الأمامية", faultName: "كسر في لمبة - Bulb Broken", severity: "medium", description: "اللمبة مكسورة" },
      { category: "الليتات الأمامية", faultName: "تلحيم - Welded", severity: "medium", description: "تم تلحيمه" },
      { category: "الليتات الأمامية", faultName: "كسر في كفر - Cover Broken", severity: "medium", description: "الكفر مكسور" },
      { category: "الليتات الأمامية", faultName: "كسر في القاعدة - Base Broken", severity: "medium", description: "القاعدة مكسورة" },
      { category: "الليتات الأمامية", faultName: "الليت لا يعمل - Light Not Working", severity: "medium", description: "الليت لا يعمل" },
      { category: "الليتات الأمامية", faultName: "حالة سيئة - Poor Condition", severity: "medium", description: "حالة سيئة" },
      { category: "الليتات الأمامية", faultName: "خدوش - Scratches", severity: "low", description: "خدوش" },
      { category: "الليتات الأمامية", faultName: "نقص براغي - Missing Screws", severity: "low", description: "براغي ناقصة" },
      { category: "الليتات الأمامية", faultName: "وايرات حالة سيئة - Wiring Poor Condition", severity: "medium", description: "الأسلاك حالتها سيئة" },
      { category: "الليتات الأمامية", faultName: "وايرات تعديل - Wiring Modified", severity: "medium", description: "الأسلاك تم تعديلها" },
      { category: "الليتات الأمامية", faultName: "وايرات قطع - Wiring Cut", severity: "medium", description: "الأسلاك مقطوعة" },
      { category: "الليتات الأمامية", faultName: "براغي تثبيت سيئ - Screws Poor Installation", severity: "low", description: "تثبيت البراغي سيئ" },

      // ═══════════════════════════════════════════════════════════════
      // الليتات الخلفية - Rear Lights
      // ═══════════════════════════════════════════════════════════════
      { category: "الليتات الخلفية", faultName: "الليت مبدل - Light Replaced", severity: "medium", description: "الليت تم استبداله" },
      { category: "الليتات الخلفية", faultName: "كسر في لمبة - Bulb Broken", severity: "medium", description: "اللمبة مكسورة" },
      { category: "الليتات الخلفية", faultName: "تلحيم - Welded", severity: "medium", description: "تم تلحيمه" },
      { category: "الليتات الخلفية", faultName: "كسر في كفر - Cover Broken", severity: "medium", description: "الكفر مكسور" },
      { category: "الليتات الخلفية", faultName: "كسر في القاعدة - Base Broken", severity: "medium", description: "القاعدة مكسورة" },
      { category: "الليتات الخلفية", faultName: "الليت لا يعمل - Light Not Working", severity: "medium", description: "الليت لا يعمل" },
      { category: "الليتات الخلفية", faultName: "حالة سيئة - Poor Condition", severity: "medium", description: "حالة سيئة" },
      { category: "الليتات الخلفية", faultName: "خدوش - Scratches", severity: "low", description: "خدوش" },
      { category: "الليتات الخلفية", faultName: "نقص براغي - Missing Screws", severity: "low", description: "براغي ناقصة" },
      { category: "الليتات الخلفية", faultName: "ليت البرك لا يعمل - Brake Light Not Working", severity: "high", description: "ليت البرك لا يعمل" },
      { category: "الليتات الخلفية", faultName: "ليت البرك كسر - Brake Light Broken", severity: "high", description: "ليت البرك مكسور" },
      { category: "الليتات الخلفية", faultName: "ليت اللوحة لا يعمل - Plate Light Not Working", severity: "medium", description: "ليت اللوحة لا يعمل" },
      { category: "الليتات الخلفية", faultName: "ليت اللوحة كسر - Plate Light Broken", severity: "medium", description: "ليت اللوحة مكسور" },
      { category: "الليتات الخلفية", faultName: "ليت اللوحة لا يوجد - Plate Light Missing", severity: "medium", description: "ليت اللوحة غير موجود" },
      { category: "الليتات الخلفية", faultName: "وايرات حالة سيئة - Wiring Poor Condition", severity: "medium", description: "الأسلاك حالتها سيئة" },
      { category: "الليتات الخلفية", faultName: "وايرات تعديل - Wiring Modified", severity: "medium", description: "الأسلاك تم تعديلها" },
      { category: "الليتات الخلفية", faultName: "براغي تثبيت سيئ - Screws Poor Installation", severity: "low", description: "تثبيت البراغي سيئ" },

      // ═══════════════════════════════════════════════════════════════
      // الداخلية - Interior
      // ═══════════════════════════════════════════════════════════════
      { category: "الداخلية", faultName: "فرش السقف من الداخل منجد - Headliner Upholstered", severity: "low", description: "فرش السقف منجد" },
      { category: "الداخلية", faultName: "فرش السقف حالة سيئة - Headliner Poor Condition", severity: "medium", description: "فرش السقف حالته سيئة" },
      { category: "الداخلية", faultName: "فرش السقف قطع - Headliner Cut", severity: "medium", description: "فرش السقف مقطوع" },
      { category: "الداخلية", faultName: "فرش السقف تثبيت سيئ - Headliner Poor Installation", severity: "low", description: "تثبيت فرش السقف سيئ" },
      { category: "الداخلية", faultName: "ليت السقف لا يعمل - Dome Light Not Working", severity: "low", description: "ليت السقف لا يعمل" },
      { category: "الداخلية", faultName: "ليت السقف لا يوجد - Dome Light Missing", severity: "low", description: "ليت السقف غير موجود" },
      { category: "الداخلية", faultName: "ليت السقف كسر - Dome Light Broken", severity: "low", description: "ليت السقف مكسور" },
      { category: "الداخلية", faultName: "الكراسي مبدلة - Seats Replaced", severity: "medium", description: "الكراسي تم استبدالها" },
      { category: "الداخلية", faultName: "الكراسي منجدة - Seats Upholstered", severity: "low", description: "الكراسي منجدة" },
      { category: "الداخلية", faultName: "الكراسي ملبسة - Seats Covered", severity: "low", description: "الكراسي ملبسة" },
      { category: "الداخلية", faultName: "الكراسي حالة سيئة - Seats Poor Condition", severity: "medium", description: "الكراسي حالتها سيئة" },
      { category: "الداخلية", faultName: "الكراسي قطع - Seats Cut", severity: "medium", description: "الكراسي مقطوعة" },
      { category: "الداخلية", faultName: "الكراسي استهلاك - Seats Worn", severity: "medium", description: "الكراسي مستهلكة" },
      { category: "الداخلية", faultName: "فك في براغي الكراسي - Seats Loose Screws", severity: "low", description: "براغي الكراسي غير مثبتة" },
      { category: "الداخلية", faultName: "ازرار تحكم الكراسي لا تعمل - Seat Controls Not Working", severity: "medium", description: "أزرار تحكم الكراسي لا تعمل" },
      { category: "الداخلية", faultName: "ازرار تحكم الكراسي كسر - Seat Controls Broken", severity: "medium", description: "أزرار تحكم الكراسي مكسورة" },
      { category: "الداخلية", faultName: "حزام الأمان لا يعمل - Seatbelt Not Working", severity: "high", description: "حزام الأمان لا يعمل" },
      { category: "الداخلية", faultName: "حزام الأمان قطع - Seatbelt Cut", severity: "high", description: "حزام الأمان مقطوع" },
      { category: "الداخلية", faultName: "حزام الأمان حالة سيئة - Seatbelt Poor Condition", severity: "medium", description: "حزام الأمان حالته سيئة" },
      { category: "الداخلية", faultName: "حزام الأمان لا يوجد - Seatbelt Missing", severity: "high", description: "حزام الأمان غير موجود" },
      { category: "الداخلية", faultName: "كفر حزام الأمان كسر - Seatbelt Cover Broken", severity: "low", description: "كفر حزام الأمان مكسور" },
      { category: "الداخلية", faultName: "ايرباق مبدل - Airbag Replaced", severity: "medium", description: "الإيرباق تم استبداله" },
      { category: "الداخلية", faultName: "ايرباق حالة سيئة - Airbag Poor Condition", severity: "high", description: "الإيرباق حالته سيئة" },
      { category: "الداخلية", faultName: "ايرباق لا يوجد - Airbag Missing", severity: "high", description: "الإيرباق غير موجود" },
      { category: "الداخلية", faultName: "الداشبورد مبدل - Dashboard Replaced", severity: "medium", description: "الداشبورد تم استبداله" },
      { category: "الداخلية", faultName: "الداشبورد منجد - Dashboard Upholstered", severity: "low", description: "الداشبورد منجد" },
      { category: "الداخلية", faultName: "الداشبورد حالة سيئة - Dashboard Poor Condition", severity: "medium", description: "الداشبورد حالته سيئة" },
      { category: "الداخلية", faultName: "الداشبورد كسر - Dashboard Broken", severity: "medium", description: "الداشبورد مكسور" },
      { category: "الداخلية", faultName: "كفر الداشبورد كسر - Dashboard Cover Broken", severity: "low", description: "كفر الداشبورد مكسور" },
      { category: "الداخلية", faultName: "السكان مبدل - Steering Replaced", severity: "medium", description: "السكان تم استبداله" },
      { category: "الداخلية", faultName: "السكان حالة سيئة - Steering Poor Condition", severity: "medium", description: "السكان حالته سيئة" },
      { category: "الداخلية", faultName: "السكان صدا أسفل - Steering Rust Underneath", severity: "medium", description: "صدأ أسفل السكان" },
      { category: "الداخلية", faultName: "السكان توجد تلبيسة - Steering Cover Present", severity: "low", description: "السكان فيه تلبيسة" },
      { category: "الداخلية", faultName: "الكنصولة مبدلة - Console Replaced", severity: "medium", description: "الكنصولة تم استبدالها" },
      { category: "الداخلية", faultName: "الكنصولة منجدة - Console Upholstered", severity: "low", description: "الكنصولة منجدة" },
      { category: "الداخلية", faultName: "الكنصولة تثبيت سيئ - Console Poor Installation", severity: "low", description: "تثبيت الكنصولة سيئ" },
      { category: "الداخلية", faultName: "الكنصولة فك - Console Loose", severity: "low", description: "الكنصولة غير مثبتة" },
      { category: "الداخلية", faultName: "الكنصولة نقص براغي - Console Missing Screws", severity: "low", description: "براغي الكنصولة ناقصة" },
      { category: "الداخلية", faultName: "ازرار التحكم الداخلية حالة سيئة - Interior Controls Poor", severity: "medium", description: "أزرار التحكم الداخلية حالتها سيئة" },
      { category: "الداخلية", faultName: "ازرار التحكم الداخلية نقص - Interior Controls Missing", severity: "medium", description: "أزرار التحكم الداخلية ناقصة" },
      { category: "الداخلية", faultName: "ازرار التحكم الداخلية لا تعمل - Interior Controls Not Working", severity: "medium", description: "أزرار التحكم الداخلية لا تعمل" },
      { category: "الداخلية", faultName: "ازرار التحكم الداخلية كسر - Interior Controls Broken", severity: "medium", description: "أزرار التحكم الداخلية مكسورة" },
      { category: "الداخلية", faultName: "فتحات التكيف حالة سيئة - AC Vents Poor Condition", severity: "low", description: "فتحات التكييف حالتها سيئة" },
      { category: "الداخلية", faultName: "فلتر المكيف حالة سيئة - AC Filter Poor Condition", severity: "low", description: "فلتر المكيف حالته سيئة" },
      { category: "الداخلية", faultName: "مروحة المكيف لا تعمل - AC Fan Not Working", severity: "medium", description: "مروحة المكيف لا تعمل" },
      { category: "الداخلية", faultName: "موتور المكيف لا يعمل - AC Motor Not Working", severity: "medium", description: "موتور المكيف لا يعمل" },
      { category: "الداخلية", faultName: "غاز المكيف ضعيف - AC Gas Low", severity: "medium", description: "غاز المكيف ضعيف" },
      { category: "الداخلية", faultName: "ثلاجة داخلية لا تعمل - Interior Fridge Not Working", severity: "low", description: "الثلاجة الداخلية لا تعمل" },
      { category: "الداخلية", faultName: "مرايا داخلية حالة سيئة - Interior Mirror Poor", severity: "low", description: "المرايا الداخلية حالتها سيئة" },
      { category: "الداخلية", faultName: "شمسية حالة سيئة - Sun Visor Poor Condition", severity: "low", description: "الشمسية حالتها سيئة" },
      { category: "الداخلية", faultName: "مساحات لا تعمل - Wipers Not Working", severity: "medium", description: "المساحات لا تعمل" },
      { category: "الداخلية", faultName: "دبة المساحات لا تعمل - Wiper Washer Not Working", severity: "low", description: "دبة المساحات لا تعمل" },
      { category: "الداخلية", faultName: "شاشة العداد حالة سيئة - Cluster Screen Poor", severity: "medium", description: "شاشة العداد حالتها سيئة" },
      { category: "الداخلية", faultName: "شاشة الداشبورد لا تعمل - Dashboard Screen Not Working", severity: "medium", description: "شاشة الداشبورد لا تعمل" },
      { category: "الداخلية", faultName: "الراديو لا يعمل - Radio Not Working", severity: "low", description: "الراديو لا يعمل" },
      { category: "الداخلية", faultName: "السماعات لا تعمل - Speakers Not Working", severity: "low", description: "السماعات لا تعمل" },
      { category: "الداخلية", faultName: "ليتات السقف لا تعمل - Roof Lights Not Working", severity: "low", description: "ليتات السقف لا تعمل" },
      { category: "الداخلية", faultName: "مقابض حالة سيئة - Handles Poor Condition", severity: "low", description: "المقابض حالتها سيئة" },
      { category: "الداخلية", faultName: "ولاعة لا تعمل - Lighter Not Working", severity: "low", description: "الولاعة لا تعمل" },
      { category: "الداخلية", faultName: "شاحن لا يعمل - Charger Not Working", severity: "low", description: "الشاحن لا يعمل" },
    ];

    await db.insert(faultLibrary).values(faults);
    console.log(`Seeded ${faults.length} faults to library`);
  }
  
  seedFaultLibrary().catch(console.error);

  return httpServer;
}
