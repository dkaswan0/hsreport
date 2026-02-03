import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes, openai } from "./replit_integrations/image"; // Import openai client

// Authentication middleware - protects admin routes
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.session?.isAuthenticated) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized - Please login" });
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register Replit AI integration routes
  registerChatRoutes(app);
  registerImageRoutes(app);

  // === Authentication Routes ===
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USERNAME || "hs";
    const adminPass = process.env.ADMIN_PASSWORD || "ahmed";

    if (username === adminUser && password === adminPass) {
      req.session.isAuthenticated = true;
      req.session.username = username;
      res.json({ success: true, message: "Login successful" });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ success: true, message: "Logged out" });
    });
  });

  app.get("/api/auth/check", (req, res) => {
    res.json({ 
      isAuthenticated: !!req.session?.isAuthenticated,
      username: req.session?.username || null
    });
  });

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

  app.post(api.inspections.deleteMultiple.path, async (req, res) => {
    try {
      const input = api.inspections.deleteMultiple.input.parse(req.body);
      const deleted = await storage.deleteMultipleInspections(input.ids);
      res.json({ deleted });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
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

  // Add new fault to library
  app.post("/api/fault-library", async (req, res) => {
    try {
      const { category, faultName, description, severity } = req.body;
      if (!category || !faultName) {
        return res.status(400).json({ error: "القسم واسم العطل مطلوبان" });
      }
      const fault = await storage.createFault({ category, faultName, description, severity });
      res.json(fault);
    } catch (error: any) {
      console.error("Add fault error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete fault from library
  app.delete(api.faultLibrary.delete.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ message: "رقم العطل غير صالح" });
      }
      const deleted = await storage.deleteFault(id);
      if (!deleted) {
        return res.status(404).json({ message: "العطل غير موجود" });
      }
      res.status(204).end();
    } catch (error: any) {
      console.error("Delete fault error:", error);
      res.status(500).json({ error: error.message });
    }
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
    const { FAULT_DATABASE, FAULT_COUNT } = await import("@shared/fault-data");
    
    // Total expected: original 1479 + new from fault-data.ts
    const EXPECTED_FAULT_COUNT = 1479 + FAULT_COUNT;
    const existingFaults = await db.select().from(faultLibrary);
    
    // Always reseed if count doesn't match expected (handles production with stale 1039 faults)
    if (existingFaults.length === EXPECTED_FAULT_COUNT) {
      console.log(`Fault library complete: ${existingFaults.length} faults`);
      return;
    }
    
    // Clear and reseed with complete library
    console.log(`Reseeding fault library: found ${existingFaults.length}, expected ${EXPECTED_FAULT_COUNT}`);
    await db.execute(sql`DELETE FROM fault_library`);
    
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

      // ═══════════════════════════════════════════════════════════════
      // المحرك - Engine (50 faults)
      // ═══════════════════════════════════════════════════════════════
      { category: "المحرك", faultName: "المحرك يصدر صوت غير طبيعي - Engine Noise", severity: "high", description: "صوت غير طبيعي من المحرك" },
      { category: "المحرك", faultName: "المحرك يهتز - Engine Vibration", severity: "medium", description: "اهتزاز في المحرك" },
      { category: "المحرك", faultName: "تسريب زيت المحرك - Engine Oil Leak", severity: "high", description: "تسريب زيت من المحرك" },
      { category: "المحرك", faultName: "زيت المحرك قديم - Old Engine Oil", severity: "medium", description: "زيت المحرك يحتاج تغيير" },
      { category: "المحرك", faultName: "مستوى زيت المحرك منخفض - Low Engine Oil", severity: "high", description: "مستوى زيت المحرك منخفض" },
      { category: "المحرك", faultName: "فلتر الزيت قديم - Old Oil Filter", severity: "low", description: "فلتر الزيت يحتاج تغيير" },
      { category: "المحرك", faultName: "فلتر الهواء متسخ - Dirty Air Filter", severity: "low", description: "فلتر الهواء يحتاج تغيير" },
      { category: "المحرك", faultName: "بيلت المحرك متشقق - Cracked Engine Belt", severity: "medium", description: "بيلت المحرك متشقق" },
      { category: "المحرك", faultName: "بيلت المحرك مرتخي - Loose Engine Belt", severity: "medium", description: "بيلت المحرك مرتخي" },
      { category: "المحرك", faultName: "بيلت التايمنج يحتاج تغيير - Timing Belt Needs Replacement", severity: "high", description: "بيلت التايمنج قديم" },
      { category: "المحرك", faultName: "البواجي تالفة - Spark Plugs Worn", severity: "medium", description: "البواجي تحتاج تغيير" },
      { category: "المحرك", faultName: "الكويلات ضعيفة - Weak Ignition Coils", severity: "medium", description: "كويلات الإشعال ضعيفة" },
      { category: "المحرك", faultName: "حساس الأكسجين تالف - O2 Sensor Faulty", severity: "medium", description: "حساس الأكسجين تالف" },
      { category: "المحرك", faultName: "حساس الهواء تالف - MAF Sensor Faulty", severity: "medium", description: "حساس الهواء تالف" },
      { category: "المحرك", faultName: "ثروتل بودي متسخ - Dirty Throttle Body", severity: "medium", description: "ثروتل بودي يحتاج تنظيف" },
      { category: "المحرك", faultName: "البخاخات متسخة - Dirty Fuel Injectors", severity: "medium", description: "البخاخات تحتاج تنظيف" },
      { category: "المحرك", faultName: "بخاخ تالف - Faulty Fuel Injector", severity: "high", description: "بخاخ تالف" },
      { category: "المحرك", faultName: "مضخة البنزين ضعيفة - Weak Fuel Pump", severity: "high", description: "مضخة البنزين ضعيفة" },
      { category: "المحرك", faultName: "فلتر البنزين قديم - Old Fuel Filter", severity: "low", description: "فلتر البنزين يحتاج تغيير" },
      { category: "المحرك", faultName: "حساس الكرنك تالف - Crankshaft Sensor Faulty", severity: "high", description: "حساس الكرنك تالف" },
      { category: "المحرك", faultName: "حساس الكامة تالف - Camshaft Sensor Faulty", severity: "high", description: "حساس الكامة تالف" },
      { category: "المحرك", faultName: "جوان الكولاس تالف - Head Gasket Blown", severity: "high", description: "جوان الكولاس تالف" },
      { category: "المحرك", faultName: "الكولاس يحتاج تخريم - Cylinder Head Needs Work", severity: "high", description: "الكولاس يحتاج صيانة" },
      { category: "المحرك", faultName: "البستم تالف - Piston Damage", severity: "high", description: "تلف في البستم" },
      { category: "المحرك", faultName: "الشنابر تالفة - Piston Rings Worn", severity: "high", description: "الشنابر تالفة" },
      { category: "المحرك", faultName: "عمود الكرنك تالف - Crankshaft Damage", severity: "high", description: "تلف في عمود الكرنك" },
      { category: "المحرك", faultName: "بيرنق المحرك تالف - Engine Bearing Worn", severity: "high", description: "بيرنق المحرك تالف" },
      { category: "المحرك", faultName: "صمامات المحرك تالفة - Engine Valves Worn", severity: "high", description: "صمامات المحرك تالفة" },
      { category: "المحرك", faultName: "ترموستات تالف - Thermostat Faulty", severity: "medium", description: "ترموستات تالف" },
      { category: "المحرك", faultName: "طرمبة الماء ضعيفة - Water Pump Weak", severity: "medium", description: "طرمبة الماء ضعيفة" },
      { category: "المحرك", faultName: "تسريب ماء الرديتر - Coolant Leak", severity: "high", description: "تسريب ماء التبريد" },
      { category: "المحرك", faultName: "الرديتر مسدود - Radiator Clogged", severity: "medium", description: "الرديتر مسدود" },
      { category: "المحرك", faultName: "مروحة الرديتر لا تعمل - Radiator Fan Not Working", severity: "high", description: "مروحة الرديتر تالفة" },
      { category: "المحرك", faultName: "حرارة المحرك مرتفعة - Engine Overheating", severity: "high", description: "ارتفاع حرارة المحرك" },
      { category: "المحرك", faultName: "كمبيوتر المحرك يحتاج برمجة - ECU Needs Programming", severity: "medium", description: "كمبيوتر المحرك يحتاج برمجة" },
      { category: "المحرك", faultName: "لمبة المحرك مضاءة - Check Engine Light On", severity: "medium", description: "لمبة فحص المحرك مضاءة" },
      { category: "المحرك", faultName: "المحرك لا يشتغل - Engine Won't Start", severity: "high", description: "المحرك لا يشتغل" },
      { category: "المحرك", faultName: "المحرك يطفي - Engine Stalls", severity: "high", description: "المحرك يطفي أثناء التشغيل" },
      { category: "المحرك", faultName: "استهلاك زيت مرتفع - High Oil Consumption", severity: "medium", description: "المحرك يستهلك زيت كثير" },
      { category: "المحرك", faultName: "دخان أبيض من الإكزوز - White Exhaust Smoke", severity: "high", description: "دخان أبيض من الإكزوز" },
      { category: "المحرك", faultName: "دخان أسود من الإكزوز - Black Exhaust Smoke", severity: "medium", description: "دخان أسود من الإكزوز" },
      { category: "المحرك", faultName: "دخان أزرق من الإكزوز - Blue Exhaust Smoke", severity: "high", description: "دخان أزرق من الإكزوز" },
      { category: "المحرك", faultName: "قاعدة المحرك تالفة - Engine Mount Worn", severity: "medium", description: "قاعدة المحرك تالفة" },
      { category: "المحرك", faultName: "غطاء البلوف يسرب - Valve Cover Leak", severity: "medium", description: "غطاء البلوف يسرب زيت" },
      { category: "المحرك", faultName: "PCV فالف تالف - PCV Valve Faulty", severity: "low", description: "صمام PCV تالف" },
      { category: "المحرك", faultName: "الانتيك مانيفولد مكسور - Intake Manifold Cracked", severity: "medium", description: "الانتيك مانيفولد مكسور" },
      { category: "المحرك", faultName: "تسريب فاكيوم - Vacuum Leak", severity: "medium", description: "تسريب في نظام الفاكيوم" },
      { category: "المحرك", faultName: "EGR فالف تالف - EGR Valve Faulty", severity: "medium", description: "صمام EGR تالف" },
      { category: "المحرك", faultName: "كتلايزر مسدود - Catalytic Converter Clogged", severity: "high", description: "الكتلايزر مسدود" },

      // ═══════════════════════════════════════════════════════════════
      // ناقل الحركة - Transmission (40 faults)
      // ═══════════════════════════════════════════════════════════════
      { category: "ناقل الحركة", faultName: "القير يضرب - Transmission Slipping", severity: "high", description: "القير يضرب أثناء التغيير" },
      { category: "ناقل الحركة", faultName: "القير ثقيل - Hard Shifting", severity: "medium", description: "صعوبة في تغيير الغيارات" },
      { category: "ناقل الحركة", faultName: "تسريب زيت القير - Transmission Fluid Leak", severity: "high", description: "تسريب زيت القير" },
      { category: "ناقل الحركة", faultName: "زيت القير قديم - Old Transmission Fluid", severity: "medium", description: "زيت القير يحتاج تغيير" },
      { category: "ناقل الحركة", faultName: "مستوى زيت القير منخفض - Low Transmission Fluid", severity: "high", description: "مستوى زيت القير منخفض" },
      { category: "ناقل الحركة", faultName: "فلتر القير قديم - Old Transmission Filter", severity: "medium", description: "فلتر القير يحتاج تغيير" },
      { category: "ناقل الحركة", faultName: "القير لا يدخل الدرايف - Won't Engage Drive", severity: "high", description: "القير لا يدخل وضع الدرايف" },
      { category: "ناقل الحركة", faultName: "القير لا يدخل الريفرس - Won't Engage Reverse", severity: "high", description: "القير لا يدخل وضع الريفرس" },
      { category: "ناقل الحركة", faultName: "صوت من القير - Transmission Noise", severity: "medium", description: "صوت غير طبيعي من القير" },
      { category: "ناقل الحركة", faultName: "كمبيوتر القير يحتاج برمجة - TCM Needs Programming", severity: "medium", description: "كمبيوتر القير يحتاج برمجة" },
      { category: "ناقل الحركة", faultName: "حساس القير تالف - Transmission Sensor Faulty", severity: "medium", description: "حساس القير تالف" },
      { category: "ناقل الحركة", faultName: "سلونيد القير تالف - Transmission Solenoid Faulty", severity: "medium", description: "سلونيد القير تالف" },
      { category: "ناقل الحركة", faultName: "تورك كونفيرتر تالف - Torque Converter Faulty", severity: "high", description: "التورك كونفيرتر تالف" },
      { category: "ناقل الحركة", faultName: "الكلتش تالف - Clutch Worn", severity: "high", description: "الكلتش تالف (للعادي)" },
      { category: "ناقل الحركة", faultName: "دبرياج ثقيل - Heavy Clutch Pedal", severity: "medium", description: "دواسة الدبرياج ثقيلة" },
      { category: "ناقل الحركة", faultName: "تسريب سائل الكلتش - Clutch Fluid Leak", severity: "medium", description: "تسريب سائل الكلتش" },
      { category: "ناقل الحركة", faultName: "ماستر الكلتش تالف - Clutch Master Cylinder Faulty", severity: "medium", description: "ماستر الكلتش تالف" },
      { category: "ناقل الحركة", faultName: "سليف الكلتش تالف - Clutch Slave Cylinder Faulty", severity: "medium", description: "سليف الكلتش تالف" },
      { category: "ناقل الحركة", faultName: "فلايويل تالف - Flywheel Worn", severity: "high", description: "الفلايويل تالف" },
      { category: "ناقل الحركة", faultName: "اهتزاز عند التعشيق - Vibration When Engaging", severity: "medium", description: "اهتزاز عند تعشيق الكلتش" },
      { category: "ناقل الحركة", faultName: "عمود القير تالف - Driveshaft Worn", severity: "high", description: "عمود القير تالف" },
      { category: "ناقل الحركة", faultName: "صليبة القير تالفة - U-Joint Worn", severity: "medium", description: "صليبة القير تالفة" },
      { category: "ناقل الحركة", faultName: "CV جوينت تالف - CV Joint Worn", severity: "medium", description: "CV جوينت تالف" },
      { category: "ناقل الحركة", faultName: "بوت CV مقطوع - CV Boot Torn", severity: "medium", description: "بوت CV مقطوع" },
      { category: "ناقل الحركة", faultName: "الدفرنس يصدر صوت - Differential Noise", severity: "medium", description: "صوت من الدفرنس" },
      { category: "ناقل الحركة", faultName: "تسريب زيت الدفرنس - Differential Oil Leak", severity: "medium", description: "تسريب زيت الدفرنس" },
      { category: "ناقل الحركة", faultName: "زيت الدفرنس قديم - Old Differential Oil", severity: "low", description: "زيت الدفرنس يحتاج تغيير" },
      { category: "ناقل الحركة", faultName: "ترانسفير كيس تالف - Transfer Case Faulty", severity: "high", description: "ترانسفير كيس تالف (للدفع الرباعي)" },
      { category: "ناقل الحركة", faultName: "تسريب ترانسفير كيس - Transfer Case Leak", severity: "medium", description: "تسريب من الترانسفير كيس" },
      { category: "ناقل الحركة", faultName: "عصا القير صعبة - Stiff Gear Lever", severity: "low", description: "عصا القير صعبة الحركة" },
      { category: "ناقل الحركة", faultName: "بوشات القير تالفة - Transmission Mount Bushings Worn", severity: "medium", description: "بوشات القير تالفة" },
      { category: "ناقل الحركة", faultName: "قاعدة القير تالفة - Transmission Mount Worn", severity: "medium", description: "قاعدة القير تالفة" },
      { category: "ناقل الحركة", faultName: "كيبل القير تالف - Shifter Cable Worn", severity: "medium", description: "كيبل القير تالف" },
      { category: "ناقل الحركة", faultName: "نظام الدفع الرباعي لا يعمل - 4WD Not Engaging", severity: "high", description: "نظام الدفع الرباعي لا يعمل" },
      { category: "ناقل الحركة", faultName: "اكتويتر الدفع الرباعي تالف - 4WD Actuator Faulty", severity: "medium", description: "اكتويتر الدفع الرباعي تالف" },
      { category: "ناقل الحركة", faultName: "هوب فري لا يعمل - Free Hub Not Working", severity: "medium", description: "هوب فري لا يعمل" },
      { category: "ناقل الحركة", faultName: "رجة عند السرعة العالية - Vibration at High Speed", severity: "medium", description: "رجة عند السرعات العالية" },
      { category: "ناقل الحركة", faultName: "القير يخرج من الغيار - Transmission Pops Out of Gear", severity: "high", description: "القير يخرج من الغيار" },
      { category: "ناقل الحركة", faultName: "تأخر في تعشيق القير - Delayed Engagement", severity: "medium", description: "تأخر في تعشيق القير" },
      { category: "ناقل الحركة", faultName: "لمبة القير مضاءة - Transmission Warning Light", severity: "medium", description: "لمبة تحذير القير مضاءة" },

      // ═══════════════════════════════════════════════════════════════
      // نظام الفرامل - Brakes (40 faults)
      // ═══════════════════════════════════════════════════════════════
      { category: "نظام الفرامل", faultName: "فحمات الفرامل الأمامية تالفة - Front Brake Pads Worn", severity: "high", description: "فحمات الفرامل الأمامية تالفة" },
      { category: "نظام الفرامل", faultName: "فحمات الفرامل الخلفية تالفة - Rear Brake Pads Worn", severity: "high", description: "فحمات الفرامل الخلفية تالفة" },
      { category: "نظام الفرامل", faultName: "ديسك الفرامل الأمامي تالف - Front Brake Disc Worn", severity: "high", description: "ديسك الفرامل الأمامي تالف" },
      { category: "نظام الفرامل", faultName: "ديسك الفرامل الخلفي تالف - Rear Brake Disc Worn", severity: "high", description: "ديسك الفرامل الخلفي تالف" },
      { category: "نظام الفرامل", faultName: "ديسك الفرامل ملتوي - Warped Brake Disc", severity: "medium", description: "ديسك الفرامل ملتوي" },
      { category: "نظام الفرامل", faultName: "سماكر الفرامل تالفة - Brake Caliper Worn", severity: "high", description: "سماكر الفرامل تالفة" },
      { category: "نظام الفرامل", faultName: "سماكر الفرامل عالقة - Brake Caliper Stuck", severity: "high", description: "سماكر الفرامل عالقة" },
      { category: "نظام الفرامل", faultName: "تسريب سائل الفرامل - Brake Fluid Leak", severity: "high", description: "تسريب سائل الفرامل" },
      { category: "نظام الفرامل", faultName: "سائل الفرامل قديم - Old Brake Fluid", severity: "medium", description: "سائل الفرامل يحتاج تغيير" },
      { category: "نظام الفرامل", faultName: "مستوى سائل الفرامل منخفض - Low Brake Fluid", severity: "high", description: "مستوى سائل الفرامل منخفض" },
      { category: "نظام الفرامل", faultName: "ماستر الفرامل تالف - Brake Master Cylinder Faulty", severity: "high", description: "ماستر الفرامل تالف" },
      { category: "نظام الفرامل", faultName: "بوستر الفرامل تالف - Brake Booster Faulty", severity: "high", description: "بوستر الفرامل تالف" },
      { category: "نظام الفرامل", faultName: "دبة الفرامل تالفة - Brake Drum Worn", severity: "medium", description: "دبة الفرامل تالفة" },
      { category: "نظام الفرامل", faultName: "سبايك الفرامل تالف - Brake Shoes Worn", severity: "medium", description: "سبايك الفرامل تالف" },
      { category: "نظام الفرامل", faultName: "فرامل اليد لا تعمل - Handbrake Not Working", severity: "medium", description: "فرامل اليد لا تعمل" },
      { category: "نظام الفرامل", faultName: "كيبل فرامل اليد مقطوع - Handbrake Cable Broken", severity: "medium", description: "كيبل فرامل اليد مقطوع" },
      { category: "نظام الفرامل", faultName: "دواسة الفرامل رخوة - Soft Brake Pedal", severity: "high", description: "دواسة الفرامل رخوة" },
      { category: "نظام الفرامل", faultName: "دواسة الفرامل صلبة - Hard Brake Pedal", severity: "medium", description: "دواسة الفرامل صلبة" },
      { category: "نظام الفرامل", faultName: "صرير الفرامل - Brake Squeal", severity: "low", description: "صوت صرير من الفرامل" },
      { category: "نظام الفرامل", faultName: "اهتزاز عند الفرملة - Vibration When Braking", severity: "medium", description: "اهتزاز عند الفرملة" },
      { category: "نظام الفرامل", faultName: "السيارة تميل عند الفرملة - Car Pulls When Braking", severity: "medium", description: "السيارة تميل عند الفرملة" },
      { category: "نظام الفرامل", faultName: "نظام ABS لا يعمل - ABS Not Working", severity: "high", description: "نظام ABS لا يعمل" },
      { category: "نظام الفرامل", faultName: "لمبة ABS مضاءة - ABS Warning Light On", severity: "medium", description: "لمبة تحذير ABS مضاءة" },
      { category: "نظام الفرامل", faultName: "حساس ABS تالف - ABS Sensor Faulty", severity: "medium", description: "حساس ABS تالف" },
      { category: "نظام الفرامل", faultName: "وحدة ABS تالفة - ABS Module Faulty", severity: "high", description: "وحدة ABS تالفة" },
      { category: "نظام الفرامل", faultName: "لمبة الفرامل مضاءة - Brake Warning Light On", severity: "medium", description: "لمبة تحذير الفرامل مضاءة" },
      { category: "نظام الفرامل", faultName: "خراطيم الفرامل متشققة - Brake Hoses Cracked", severity: "high", description: "خراطيم الفرامل متشققة" },
      { category: "نظام الفرامل", faultName: "أنابيب الفرامل صدئة - Brake Lines Rusty", severity: "high", description: "أنابيب الفرامل صدئة" },
      { category: "نظام الفرامل", faultName: "فلنجات الفرامل تالفة - Brake Flanges Worn", severity: "medium", description: "فلنجات الفرامل تالفة" },
      { category: "نظام الفرامل", faultName: "بولتات السماكر مفقودة - Caliper Bolts Missing", severity: "medium", description: "بولتات السماكر مفقودة" },
      { category: "نظام الفرامل", faultName: "نظام ESP لا يعمل - ESP Not Working", severity: "high", description: "نظام الثبات لا يعمل" },
      { category: "نظام الفرامل", faultName: "لمبة ESP مضاءة - ESP Warning Light On", severity: "medium", description: "لمبة ESP مضاءة" },
      { category: "نظام الفرامل", faultName: "نظام التراكشن لا يعمل - Traction Control Not Working", severity: "medium", description: "نظام التراكشن لا يعمل" },
      { category: "نظام الفرامل", faultName: "بريك هولد لا يعمل - Brake Hold Not Working", severity: "low", description: "بريك هولد لا يعمل" },
      { category: "نظام الفرامل", faultName: "نظام الفرامل الأوتوماتيكي لا يعمل - Auto Brake Not Working", severity: "medium", description: "الفرملة الأوتوماتيكية لا تعمل" },
      { category: "نظام الفرامل", faultName: "حساس ضغط الفرامل تالف - Brake Pressure Sensor Faulty", severity: "medium", description: "حساس ضغط الفرامل تالف" },
      { category: "نظام الفرامل", faultName: "سويتش الفرامل تالف - Brake Light Switch Faulty", severity: "low", description: "سويتش إنارة الفرامل تالف" },
      { category: "نظام الفرامل", faultName: "تآكل غير متساوي للفحمات - Uneven Pad Wear", severity: "medium", description: "تآكل غير متساوي للفحمات" },
      { category: "نظام الفرامل", faultName: "صوت طقطقة من الفرامل - Brake Clicking Noise", severity: "low", description: "صوت طقطقة من الفرامل" },
      { category: "نظام الفرامل", faultName: "رائحة احتراق من الفرامل - Burning Smell from Brakes", severity: "high", description: "رائحة احتراق من الفرامل" },

      // ═══════════════════════════════════════════════════════════════
      // نظام التعليق - Suspension (40 faults)
      // ═══════════════════════════════════════════════════════════════
      { category: "نظام التعليق", faultName: "مساعد أمامي يمين تالف - Front Right Shock Worn", severity: "medium", description: "المساعد الأمامي الأيمن تالف" },
      { category: "نظام التعليق", faultName: "مساعد أمامي يسار تالف - Front Left Shock Worn", severity: "medium", description: "المساعد الأمامي الأيسر تالف" },
      { category: "نظام التعليق", faultName: "مساعد خلفي يمين تالف - Rear Right Shock Worn", severity: "medium", description: "المساعد الخلفي الأيمن تالف" },
      { category: "نظام التعليق", faultName: "مساعد خلفي يسار تالف - Rear Left Shock Worn", severity: "medium", description: "المساعد الخلفي الأيسر تالف" },
      { category: "نظام التعليق", faultName: "تسريب مساعد أمامي - Front Shock Leaking", severity: "medium", description: "تسريب من المساعد الأمامي" },
      { category: "نظام التعليق", faultName: "تسريب مساعد خلفي - Rear Shock Leaking", severity: "medium", description: "تسريب من المساعد الخلفي" },
      { category: "نظام التعليق", faultName: "يايات أمامية ضعيفة - Front Springs Weak", severity: "medium", description: "اليايات الأمامية ضعيفة" },
      { category: "نظام التعليق", faultName: "يايات خلفية ضعيفة - Rear Springs Weak", severity: "medium", description: "اليايات الخلفية ضعيفة" },
      { category: "نظام التعليق", faultName: "ياي أمامي مكسور - Front Spring Broken", severity: "high", description: "الياي الأمامي مكسور" },
      { category: "نظام التعليق", faultName: "ياي خلفي مكسور - Rear Spring Broken", severity: "high", description: "الياي الخلفي مكسور" },
      { category: "نظام التعليق", faultName: "طقم مساعد أمامي تالف - Front Shock Mount Worn", severity: "medium", description: "طقم المساعد الأمامي تالف" },
      { category: "نظام التعليق", faultName: "طقم مساعد خلفي تالف - Rear Shock Mount Worn", severity: "medium", description: "طقم المساعد الخلفي تالف" },
      { category: "نظام التعليق", faultName: "مقص أمامي تالف - Front Control Arm Worn", severity: "high", description: "المقص الأمامي تالف" },
      { category: "نظام التعليق", faultName: "مقص خلفي تالف - Rear Control Arm Worn", severity: "high", description: "المقص الخلفي تالف" },
      { category: "نظام التعليق", faultName: "بوش المقص تالف - Control Arm Bushing Worn", severity: "medium", description: "بوش المقص تالف" },
      { category: "نظام التعليق", faultName: "كرة المقص تالفة - Ball Joint Worn", severity: "high", description: "كرة المقص تالفة" },
      { category: "نظام التعليق", faultName: "وصلة المقصات تالفة - Sway Bar Link Worn", severity: "medium", description: "وصلة المقصات تالفة" },
      { category: "نظام التعليق", faultName: "ميزان أمامي تالف - Front Sway Bar Worn", severity: "medium", description: "الميزان الأمامي تالف" },
      { category: "نظام التعليق", faultName: "ميزان خلفي تالف - Rear Sway Bar Worn", severity: "medium", description: "الميزان الخلفي تالف" },
      { category: "نظام التعليق", faultName: "بوش الميزان تالف - Sway Bar Bushing Worn", severity: "low", description: "بوش الميزان تالف" },
      { category: "نظام التعليق", faultName: "طرف مقود أمامي تالف - Tie Rod End Worn", severity: "high", description: "طرف المقود الأمامي تالف" },
      { category: "نظام التعليق", faultName: "طرف مقود خلفي تالف - Rear Tie Rod End Worn", severity: "high", description: "طرف المقود الخلفي تالف" },
      { category: "نظام التعليق", faultName: "علبة الدركسون تالفة - Steering Rack Worn", severity: "high", description: "علبة الدركسون تالفة" },
      { category: "نظام التعليق", faultName: "تسريب من علبة الدركسون - Steering Rack Leak", severity: "medium", description: "تسريب من علبة الدركسون" },
      { category: "نظام التعليق", faultName: "هوب أمامي تالف - Front Wheel Hub Worn", severity: "high", description: "الهوب الأمامي تالف" },
      { category: "نظام التعليق", faultName: "هوب خلفي تالف - Rear Wheel Hub Worn", severity: "high", description: "الهوب الخلفي تالف" },
      { category: "نظام التعليق", faultName: "بيرنق العجلة أمامي تالف - Front Wheel Bearing Worn", severity: "high", description: "بيرنق العجلة الأمامي تالف" },
      { category: "نظام التعليق", faultName: "بيرنق العجلة خلفي تالف - Rear Wheel Bearing Worn", severity: "high", description: "بيرنق العجلة الخلفي تالف" },
      { category: "نظام التعليق", faultName: "صوت طقطقة من التعليق - Suspension Clicking Noise", severity: "medium", description: "صوت طقطقة من التعليق" },
      { category: "نظام التعليق", faultName: "صوت صرير من التعليق - Suspension Squeaking", severity: "low", description: "صوت صرير من التعليق" },
      { category: "نظام التعليق", faultName: "السيارة تنزل من جهة - Car Leans to One Side", severity: "medium", description: "السيارة تنزل من جهة واحدة" },
      { category: "نظام التعليق", faultName: "التوازن غير مضبوط - Wheel Alignment Off", severity: "medium", description: "التوازن يحتاج ضبط" },
      { category: "نظام التعليق", faultName: "اهتزاز في الدركسون - Steering Wheel Vibration", severity: "medium", description: "اهتزاز في عجلة القيادة" },
      { category: "نظام التعليق", faultName: "ثقل في الدركسون - Heavy Steering", severity: "medium", description: "ثقل في عجلة القيادة" },
      { category: "نظام التعليق", faultName: "الدركسون يميل - Steering Wheel Off-Center", severity: "low", description: "الدركسون يميل جهة" },
      { category: "نظام التعليق", faultName: "نظام التعليق الهوائي تالف - Air Suspension Faulty", severity: "high", description: "نظام التعليق الهوائي تالف" },
      { category: "نظام التعليق", faultName: "كمبروسر التعليق الهوائي تالف - Air Compressor Faulty", severity: "high", description: "كمبروسر التعليق الهوائي تالف" },
      { category: "نظام التعليق", faultName: "وسادة هوائية مثقوبة - Air Bag Leaking", severity: "medium", description: "وسادة التعليق الهوائي مثقوبة" },
      { category: "نظام التعليق", faultName: "حساس ارتفاع تالف - Height Sensor Faulty", severity: "medium", description: "حساس ارتفاع التعليق تالف" },

      // ═══════════════════════════════════════════════════════════════
      // الإطارات والجنوط - Tires & Wheels (40 faults)
      // ═══════════════════════════════════════════════════════════════
      { category: "الإطارات والجنوط", faultName: "إطار أمامي يمين تالف - Front Right Tire Worn", severity: "medium", description: "الإطار الأمامي الأيمن تالف" },
      { category: "الإطارات والجنوط", faultName: "إطار أمامي يسار تالف - Front Left Tire Worn", severity: "medium", description: "الإطار الأمامي الأيسر تالف" },
      { category: "الإطارات والجنوط", faultName: "إطار خلفي يمين تالف - Rear Right Tire Worn", severity: "medium", description: "الإطار الخلفي الأيمن تالف" },
      { category: "الإطارات والجنوط", faultName: "إطار خلفي يسار تالف - Rear Left Tire Worn", severity: "medium", description: "الإطار الخلفي الأيسر تالف" },
      { category: "الإطارات والجنوط", faultName: "ضغط الإطار منخفض - Low Tire Pressure", severity: "medium", description: "ضغط الإطار منخفض" },
      { category: "الإطارات والجنوط", faultName: "ضغط الإطار مرتفع - High Tire Pressure", severity: "low", description: "ضغط الإطار مرتفع" },
      { category: "الإطارات والجنوط", faultName: "تآكل غير متساوي للإطار - Uneven Tire Wear", severity: "medium", description: "تآكل غير متساوي للإطار" },
      { category: "الإطارات والجنوط", faultName: "إطار مثقوب - Punctured Tire", severity: "high", description: "الإطار مثقوب" },
      { category: "الإطارات والجنوط", faultName: "إطار منتفخ - Tire Bulge", severity: "high", description: "انتفاخ في الإطار" },
      { category: "الإطارات والجنوط", faultName: "إطار متشقق - Cracked Tire", severity: "medium", description: "تشققات في الإطار" },
      { category: "الإطارات والجنوط", faultName: "الجنط ملتوي - Bent Rim", severity: "medium", description: "الجنط ملتوي" },
      { category: "الإطارات والجنوط", faultName: "الجنط متشقق - Cracked Rim", severity: "high", description: "الجنط متشقق" },
      { category: "الإطارات والجنوط", faultName: "الجنط صدئ - Rusty Rim", severity: "low", description: "الجنط صدئ" },
      { category: "الإطارات والجنوط", faultName: "الجنط مخدوش - Scratched Rim", severity: "low", description: "الجنط مخدوش" },
      { category: "الإطارات والجنوط", faultName: "بولت العجلة مفقود - Missing Wheel Bolt", severity: "high", description: "بولت العجلة مفقود" },
      { category: "الإطارات والجنوط", faultName: "بولت العجلة مكسور - Broken Wheel Bolt", severity: "high", description: "بولت العجلة مكسور" },
      { category: "الإطارات والجنوط", faultName: "غطاء الجنط مفقود - Missing Hub Cap", severity: "low", description: "غطاء الجنط مفقود" },
      { category: "الإطارات والجنوط", faultName: "غطاء الجنط مكسور - Broken Hub Cap", severity: "low", description: "غطاء الجنط مكسور" },
      { category: "الإطارات والجنوط", faultName: "بلف الإطار تالف - Tire Valve Faulty", severity: "low", description: "بلف الإطار تالف" },
      { category: "الإطارات والجنوط", faultName: "حساس ضغط الإطار تالف - TPMS Sensor Faulty", severity: "low", description: "حساس ضغط الإطار تالف" },
      { category: "الإطارات والجنوط", faultName: "لمبة ضغط الإطارات مضاءة - TPMS Warning Light On", severity: "low", description: "لمبة ضغط الإطارات مضاءة" },
      { category: "الإطارات والجنوط", faultName: "إطار الاحتياطي تالف - Spare Tire Worn", severity: "medium", description: "إطار الاحتياطي تالف" },
      { category: "الإطارات والجنوط", faultName: "إطار الاحتياطي مفقود - Spare Tire Missing", severity: "medium", description: "إطار الاحتياطي مفقود" },
      { category: "الإطارات والجنوط", faultName: "عدة الإطار مفقودة - Tire Jack Missing", severity: "low", description: "عدة الإطار مفقودة" },
      { category: "الإطارات والجنوط", faultName: "مفتاح العجلات مفقود - Wheel Wrench Missing", severity: "low", description: "مفتاح العجلات مفقود" },
      { category: "الإطارات والجنوط", faultName: "الإطارات غير متطابقة - Mismatched Tires", severity: "medium", description: "الإطارات غير متطابقة" },
      { category: "الإطارات والجنوط", faultName: "مقاس الإطار غير مناسب - Wrong Tire Size", severity: "medium", description: "مقاس الإطار غير مناسب" },
      { category: "الإطارات والجنوط", faultName: "الإطار قديم - Old Tire", severity: "medium", description: "الإطار قديم ويحتاج تغيير" },
      { category: "الإطارات والجنوط", faultName: "ترصيص العجلات غير مضبوط - Wheel Balance Off", severity: "medium", description: "ترصيص العجلات يحتاج ضبط" },
      { category: "الإطارات والجنوط", faultName: "اهتزاز من العجلات - Wheel Vibration", severity: "medium", description: "اهتزاز من العجلات" },
      { category: "الإطارات والجنوط", faultName: "صوت من الإطارات - Tire Noise", severity: "low", description: "صوت غير طبيعي من الإطارات" },
      { category: "الإطارات والجنوط", faultName: "العجلة غير مثبتة - Loose Wheel", severity: "high", description: "العجلة غير مثبتة بشكل صحيح" },
      { category: "الإطارات والجنوط", faultName: "الجنط غير أصلي - Non-Original Rim", severity: "low", description: "الجنط غير أصلي" },
      { category: "الإطارات والجنوط", faultName: "تلف في جانب الإطار - Tire Sidewall Damage", severity: "high", description: "تلف في جانب الإطار" },
      { category: "الإطارات والجنوط", faultName: "الإطار مرقع - Patched Tire", severity: "medium", description: "الإطار مرقع" },
      { category: "الإطارات والجنوط", faultName: "الإطار مسمر - Tire with Nail", severity: "medium", description: "يوجد مسمار في الإطار" },
      { category: "الإطارات والجنوط", faultName: "تسريب هواء من الإطار - Tire Air Leak", severity: "medium", description: "تسريب هواء من الإطار" },
      { category: "الإطارات والجنوط", faultName: "تسريب هواء من الجنط - Rim Air Leak", severity: "medium", description: "تسريب هواء من الجنط" },
      { category: "الإطارات والجنوط", faultName: "قفل العجلة مفقود - Wheel Lock Missing", severity: "low", description: "قفل العجلة مفقود" },
      { category: "الإطارات والجنوط", faultName: "مفتاح قفل العجلة مفقود - Wheel Lock Key Missing", severity: "low", description: "مفتاح قفل العجلة مفقود" },

      // ═══════════════════════════════════════════════════════════════
      // النظام الكهربائي - Electrical System (60 faults)
      // ═══════════════════════════════════════════════════════════════
      { category: "النظام الكهربائي", faultName: "البطارية ضعيفة - Weak Battery", severity: "medium", description: "البطارية ضعيفة" },
      { category: "النظام الكهربائي", faultName: "البطارية تالفة - Dead Battery", severity: "high", description: "البطارية تالفة" },
      { category: "النظام الكهربائي", faultName: "أقطاب البطارية متآكلة - Corroded Battery Terminals", severity: "medium", description: "أقطاب البطارية متآكلة" },
      { category: "النظام الكهربائي", faultName: "كيبل البطارية تالف - Battery Cable Worn", severity: "medium", description: "كيبل البطارية تالف" },
      { category: "النظام الكهربائي", faultName: "الدينمو ضعيف - Weak Alternator", severity: "medium", description: "الدينمو ضعيف" },
      { category: "النظام الكهربائي", faultName: "الدينمو تالف - Faulty Alternator", severity: "high", description: "الدينمو تالف" },
      { category: "النظام الكهربائي", faultName: "بيلت الدينمو متشقق - Alternator Belt Cracked", severity: "medium", description: "بيلت الدينمو متشقق" },
      { category: "النظام الكهربائي", faultName: "السلف ضعيف - Weak Starter", severity: "medium", description: "السلف ضعيف" },
      { category: "النظام الكهربائي", faultName: "السلف تالف - Faulty Starter", severity: "high", description: "السلف تالف" },
      { category: "النظام الكهربائي", faultName: "سويتش التشغيل تالف - Ignition Switch Faulty", severity: "medium", description: "سويتش التشغيل تالف" },
      { category: "النظام الكهربائي", faultName: "لايت أمامي أيمن تالف - Right Headlight Faulty", severity: "medium", description: "اللايت الأمامي الأيمن تالف" },
      { category: "النظام الكهربائي", faultName: "لايت أمامي أيسر تالف - Left Headlight Faulty", severity: "medium", description: "اللايت الأمامي الأيسر تالف" },
      { category: "النظام الكهربائي", faultName: "لايت خلفي أيمن تالف - Right Taillight Faulty", severity: "medium", description: "اللايت الخلفي الأيمن تالف" },
      { category: "النظام الكهربائي", faultName: "لايت خلفي أيسر تالف - Left Taillight Faulty", severity: "medium", description: "اللايت الخلفي الأيسر تالف" },
      { category: "النظام الكهربائي", faultName: "الإشارة اليمنى لا تعمل - Right Turn Signal Faulty", severity: "medium", description: "الإشارة اليمنى لا تعمل" },
      { category: "النظام الكهربائي", faultName: "الإشارة اليسرى لا تعمل - Left Turn Signal Faulty", severity: "medium", description: "الإشارة اليسرى لا تعمل" },
      { category: "النظام الكهربائي", faultName: "لايت الفرامل لا يعمل - Brake Light Faulty", severity: "high", description: "لايت الفرامل لا يعمل" },
      { category: "النظام الكهربائي", faultName: "لايت الريفرس لا يعمل - Reverse Light Faulty", severity: "medium", description: "لايت الريفرس لا يعمل" },
      { category: "النظام الكهربائي", faultName: "لايت الضباب لا يعمل - Fog Light Faulty", severity: "low", description: "لايت الضباب لا يعمل" },
      { category: "النظام الكهربائي", faultName: "الهاي بيم لا يعمل - High Beam Faulty", severity: "medium", description: "الهاي بيم لا يعمل" },
      { category: "النظام الكهربائي", faultName: "لايت اللوحة لا يعمل - License Plate Light Faulty", severity: "low", description: "لايت اللوحة لا يعمل" },
      { category: "النظام الكهربائي", faultName: "الهورن لا يعمل - Horn Faulty", severity: "medium", description: "الهورن لا يعمل" },
      { category: "النظام الكهربائي", faultName: "المساحات لا تعمل - Wipers Faulty", severity: "medium", description: "المساحات لا تعمل" },
      { category: "النظام الكهربائي", faultName: "موتور المساحات تالف - Wiper Motor Faulty", severity: "medium", description: "موتور المساحات تالف" },
      { category: "النظام الكهربائي", faultName: "مضخة الماء للمساحات لا تعمل - Washer Pump Faulty", severity: "low", description: "مضخة ماء المساحات تالفة" },
      { category: "النظام الكهربائي", faultName: "زجاج كهربائي أمامي يمين لا يعمل - FR Power Window Faulty", severity: "medium", description: "الزجاج الكهربائي الأمامي الأيمن لا يعمل" },
      { category: "النظام الكهربائي", faultName: "زجاج كهربائي أمامي يسار لا يعمل - FL Power Window Faulty", severity: "medium", description: "الزجاج الكهربائي الأمامي الأيسر لا يعمل" },
      { category: "النظام الكهربائي", faultName: "زجاج كهربائي خلفي يمين لا يعمل - RR Power Window Faulty", severity: "medium", description: "الزجاج الكهربائي الخلفي الأيمن لا يعمل" },
      { category: "النظام الكهربائي", faultName: "زجاج كهربائي خلفي يسار لا يعمل - RL Power Window Faulty", severity: "medium", description: "الزجاج الكهربائي الخلفي الأيسر لا يعمل" },
      { category: "النظام الكهربائي", faultName: "القفل المركزي لا يعمل - Central Lock Faulty", severity: "medium", description: "القفل المركزي لا يعمل" },
      { category: "النظام الكهربائي", faultName: "الريموت لا يعمل - Remote Key Faulty", severity: "low", description: "ريموت السيارة لا يعمل" },
      { category: "النظام الكهربائي", faultName: "بطارية الريموت ضعيفة - Remote Battery Low", severity: "low", description: "بطارية الريموت ضعيفة" },
      { category: "النظام الكهربائي", faultName: "المرايا الكهربائية لا تعمل - Power Mirrors Faulty", severity: "medium", description: "المرايا الكهربائية لا تعمل" },
      { category: "النظام الكهربائي", faultName: "تدفئة المرايا لا تعمل - Mirror Heater Faulty", severity: "low", description: "تدفئة المرايا لا تعمل" },
      { category: "النظام الكهربائي", faultName: "المقاعد الكهربائية لا تعمل - Power Seats Faulty", severity: "medium", description: "المقاعد الكهربائية لا تعمل" },
      { category: "النظام الكهربائي", faultName: "تدفئة المقاعد لا تعمل - Seat Heater Faulty", severity: "low", description: "تدفئة المقاعد لا تعمل" },
      { category: "النظام الكهربائي", faultName: "تبريد المقاعد لا يعمل - Seat Cooler Faulty", severity: "low", description: "تبريد المقاعد لا يعمل" },
      { category: "النظام الكهربائي", faultName: "فتحة السقف لا تعمل - Sunroof Faulty", severity: "medium", description: "فتحة السقف لا تعمل" },
      { category: "النظام الكهربائي", faultName: "الشاشة لا تعمل - Display Screen Faulty", severity: "medium", description: "الشاشة لا تعمل" },
      { category: "النظام الكهربائي", faultName: "الراديو لا يعمل - Radio Faulty", severity: "low", description: "الراديو لا يعمل" },
      { category: "النظام الكهربائي", faultName: "السماعات لا تعمل - Speakers Faulty", severity: "low", description: "السماعات لا تعمل" },
      { category: "النظام الكهربائي", faultName: "البلوتوث لا يعمل - Bluetooth Faulty", severity: "low", description: "البلوتوث لا يعمل" },
      { category: "النظام الكهربائي", faultName: "الكاميرا الخلفية لا تعمل - Rear Camera Faulty", severity: "medium", description: "الكاميرا الخلفية لا تعمل" },
      { category: "النظام الكهربائي", faultName: "حساسات الوقوف لا تعمل - Parking Sensors Faulty", severity: "medium", description: "حساسات الوقوف لا تعمل" },
      { category: "النظام الكهربائي", faultName: "نظام الملاحة لا يعمل - Navigation Faulty", severity: "low", description: "نظام الملاحة لا يعمل" },
      { category: "النظام الكهربائي", faultName: "مثبت السرعة لا يعمل - Cruise Control Faulty", severity: "medium", description: "مثبت السرعة لا يعمل" },
      { category: "النظام الكهربائي", faultName: "فيوز محروق - Blown Fuse", severity: "low", description: "فيوز محروق" },
      { category: "النظام الكهربائي", faultName: "تماس كهربائي - Electrical Short", severity: "high", description: "تماس كهربائي" },
      { category: "النظام الكهربائي", faultName: "الضفيرة تالفة - Wiring Harness Damaged", severity: "high", description: "الضفيرة الكهربائية تالفة" },
      { category: "النظام الكهربائي", faultName: "ريليه تالف - Faulty Relay", severity: "medium", description: "ريليه تالف" },
      { category: "النظام الكهربائي", faultName: "كمبيوتر السيارة يحتاج برمجة - ECU Needs Programming", severity: "medium", description: "كمبيوتر السيارة يحتاج برمجة" },
      { category: "النظام الكهربائي", faultName: "عداد الطبلون لا يعمل - Dashboard Gauge Faulty", severity: "medium", description: "عداد الطبلون لا يعمل" },
      { category: "النظام الكهربائي", faultName: "إنارة الطبلون لا تعمل - Dashboard Light Faulty", severity: "low", description: "إنارة الطبلون لا تعمل" },
      { category: "النظام الكهربائي", faultName: "ساعة السيارة لا تعمل - Clock Faulty", severity: "low", description: "ساعة السيارة لا تعمل" },
      { category: "النظام الكهربائي", faultName: "ولاعة السيارة لا تعمل - Cigarette Lighter Faulty", severity: "low", description: "ولاعة السيارة لا تعمل" },
      { category: "النظام الكهربائي", faultName: "منفذ USB لا يعمل - USB Port Faulty", severity: "low", description: "منفذ USB لا يعمل" },
      { category: "النظام الكهربائي", faultName: "الشحن اللاسلكي لا يعمل - Wireless Charging Faulty", severity: "low", description: "الشحن اللاسلكي لا يعمل" },
      { category: "النظام الكهربائي", faultName: "نظام الإنذار لا يعمل - Alarm System Faulty", severity: "medium", description: "نظام الإنذار لا يعمل" },
      { category: "النظام الكهربائي", faultName: "الإيموبلايزر تالف - Immobilizer Faulty", severity: "high", description: "الإيموبلايزر تالف" },

      // ═══════════════════════════════════════════════════════════════
      // تيب الوايرات - Wire Harness (50 faults)
      // ═══════════════════════════════════════════════════════════════
      { category: "تيب الوايرات", faultName: "تيب الوايرات الأمامي تالف - Front Wire Harness Damaged", severity: "high", description: "تيب الوايرات الأمامي تالف" },
      { category: "تيب الوايرات", faultName: "تيب الوايرات الخلفي تالف - Rear Wire Harness Damaged", severity: "high", description: "تيب الوايرات الخلفي تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات الباب الأمامي الأيمن تالف - FR Door Harness Damaged", severity: "medium", description: "تيب وايرات الباب الأمامي الأيمن تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات الباب الأمامي الأيسر تالف - FL Door Harness Damaged", severity: "medium", description: "تيب وايرات الباب الأمامي الأيسر تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات الباب الخلفي الأيمن تالف - RR Door Harness Damaged", severity: "medium", description: "تيب وايرات الباب الخلفي الأيمن تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات الباب الخلفي الأيسر تالف - RL Door Harness Damaged", severity: "medium", description: "تيب وايرات الباب الخلفي الأيسر تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات الدبة تالف - Trunk Harness Damaged", severity: "medium", description: "تيب وايرات الدبة تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات البونيت تالف - Hood Harness Damaged", severity: "medium", description: "تيب وايرات البونيت تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات المحرك تالف - Engine Harness Damaged", severity: "high", description: "تيب وايرات المحرك تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات الجير تالف - Transmission Harness Damaged", severity: "high", description: "تيب وايرات الجير تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات الطبلون تالف - Dashboard Harness Damaged", severity: "high", description: "تيب وايرات الطبلون تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات البطارية تالف - Battery Harness Damaged", severity: "high", description: "تيب وايرات البطارية تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات الإضاءة الأمامية تالف - Front Lighting Harness Damaged", severity: "medium", description: "تيب وايرات الإضاءة الأمامية تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات الإضاءة الخلفية تالف - Rear Lighting Harness Damaged", severity: "medium", description: "تيب وايرات الإضاءة الخلفية تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات المكيف تالف - AC Harness Damaged", severity: "medium", description: "تيب وايرات المكيف تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات الفرامل ABS تالف - ABS Harness Damaged", severity: "high", description: "تيب وايرات الفرامل ABS تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات الإيرباق تالف - Airbag Harness Damaged", severity: "high", description: "تيب وايرات الإيرباق تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات السنتر كونسول تالف - Center Console Harness Damaged", severity: "medium", description: "تيب وايرات السنتر كونسول تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات الشاشة تالف - Display Harness Damaged", severity: "medium", description: "تيب وايرات الشاشة تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات السماعات تالف - Speaker Harness Damaged", severity: "low", description: "تيب وايرات السماعات تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات المقاعد الكهربائية تالف - Power Seat Harness Damaged", severity: "medium", description: "تيب وايرات المقاعد الكهربائية تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات السقف تالف - Roof Harness Damaged", severity: "medium", description: "تيب وايرات السقف تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات فتحة السقف تالف - Sunroof Harness Damaged", severity: "medium", description: "تيب وايرات فتحة السقف تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات الكاميرات تالف - Camera Harness Damaged", severity: "medium", description: "تيب وايرات الكاميرات تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات الحساسات تالف - Sensor Harness Damaged", severity: "medium", description: "تيب وايرات الحساسات تالف" },
      { category: "تيب الوايرات", faultName: "كونكتر الوايرات مفكوك - Loose Wire Connector", severity: "medium", description: "كونكتر الوايرات مفكوك" },
      { category: "تيب الوايرات", faultName: "كونكتر الوايرات مكسور - Broken Wire Connector", severity: "high", description: "كونكتر الوايرات مكسور" },
      { category: "تيب الوايرات", faultName: "كونكتر الوايرات متآكل - Corroded Wire Connector", severity: "medium", description: "كونكتر الوايرات متآكل" },
      { category: "تيب الوايرات", faultName: "كونكتر الوايرات محروق - Burnt Wire Connector", severity: "high", description: "كونكتر الوايرات محروق" },
      { category: "تيب الوايرات", faultName: "وايرات مكشوفة - Exposed Wires", severity: "high", description: "وايرات مكشوفة" },
      { category: "تيب الوايرات", faultName: "وايرات محروقة - Burnt Wires", severity: "high", description: "وايرات محروقة" },
      { category: "تيب الوايرات", faultName: "وايرات متآكلة - Corroded Wires", severity: "medium", description: "وايرات متآكلة" },
      { category: "تيب الوايرات", faultName: "وايرات مقطوعة - Cut Wires", severity: "high", description: "وايرات مقطوعة" },
      { category: "تيب الوايرات", faultName: "وايرات مربوطة بشكل خاطئ - Incorrectly Wired", severity: "high", description: "وايرات مربوطة بشكل خاطئ" },
      { category: "تيب الوايرات", faultName: "عزل الوايرات تالف - Wire Insulation Damaged", severity: "medium", description: "عزل الوايرات تالف" },
      { category: "تيب الوايرات", faultName: "عزل الوايرات منصهر - Wire Insulation Melted", severity: "high", description: "عزل الوايرات منصهر" },
      { category: "تيب الوايرات", faultName: "تيب وايرات الدينمو تالف - Alternator Harness Damaged", severity: "high", description: "تيب وايرات الدينمو تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات السلف تالف - Starter Harness Damaged", severity: "high", description: "تيب وايرات السلف تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات البواجي تالف - Spark Plug Harness Damaged", severity: "medium", description: "تيب وايرات البواجي تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات الإنجكترات تالف - Injector Harness Damaged", severity: "high", description: "تيب وايرات الإنجكترات تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات الأكسجين سنسور تالف - O2 Sensor Harness Damaged", severity: "medium", description: "تيب وايرات الأكسجين سنسور تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات الثروتل تالف - Throttle Harness Damaged", severity: "medium", description: "تيب وايرات الثروتل تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات الكويلات تالف - Coil Harness Damaged", severity: "medium", description: "تيب وايرات الكويلات تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات الكمبيوتر تالف - ECU Harness Damaged", severity: "high", description: "تيب وايرات الكمبيوتر تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات المرايا تالف - Mirror Harness Damaged", severity: "low", description: "تيب وايرات المرايا تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات الهورن تالف - Horn Harness Damaged", severity: "low", description: "تيب وايرات الهورن تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات ماسحات الزجاج تالف - Wiper Harness Damaged", severity: "medium", description: "تيب وايرات ماسحات الزجاج تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات القفل المركزي تالف - Central Lock Harness Damaged", severity: "medium", description: "تيب وايرات القفل المركزي تالف" },
      { category: "تيب الوايرات", faultName: "تيب وايرات التوجيه الكهربائي تالف - EPS Harness Damaged", severity: "high", description: "تيب وايرات التوجيه الكهربائي تالف" },

      // ═══════════════════════════════════════════════════════════════
      // زر تحكم المرايا - Mirror Controls (30 faults)
      // ═══════════════════════════════════════════════════════════════
      { category: "زر تحكم المرايا", faultName: "زر تحكم المرايا لا يعمل - Mirror Control Switch Not Working", severity: "medium", description: "زر تحكم المرايا لا يعمل" },
      { category: "زر تحكم المرايا", faultName: "زر تحكم المرايا مكسور - Mirror Control Switch Broken", severity: "medium", description: "زر تحكم المرايا مكسور" },
      { category: "زر تحكم المرايا", faultName: "زر تحكم المرايا عالق - Mirror Control Switch Stuck", severity: "medium", description: "زر تحكم المرايا عالق" },
      { category: "زر تحكم المرايا", faultName: "زر تحكم المرايا مفكوك - Mirror Control Switch Loose", severity: "low", description: "زر تحكم المرايا مفكوك" },
      { category: "زر تحكم المرايا", faultName: "زر اختيار المرآة لا يعمل - Mirror Selector Not Working", severity: "medium", description: "زر اختيار المرآة لا يعمل" },
      { category: "زر تحكم المرايا", faultName: "المرآة اليمنى لا تتحرك - Right Mirror Not Moving", severity: "medium", description: "المرآة اليمنى لا تتحرك" },
      { category: "زر تحكم المرايا", faultName: "المرآة اليسرى لا تتحرك - Left Mirror Not Moving", severity: "medium", description: "المرآة اليسرى لا تتحرك" },
      { category: "زر تحكم المرايا", faultName: "المرآة اليمنى لا تتحرك للأعلى - Right Mirror Won't Move Up", severity: "medium", description: "المرآة اليمنى لا تتحرك للأعلى" },
      { category: "زر تحكم المرايا", faultName: "المرآة اليمنى لا تتحرك للأسفل - Right Mirror Won't Move Down", severity: "medium", description: "المرآة اليمنى لا تتحرك للأسفل" },
      { category: "زر تحكم المرايا", faultName: "المرآة اليمنى لا تتحرك لليمين - Right Mirror Won't Move Right", severity: "medium", description: "المرآة اليمنى لا تتحرك لليمين" },
      { category: "زر تحكم المرايا", faultName: "المرآة اليمنى لا تتحرك لليسار - Right Mirror Won't Move Left", severity: "medium", description: "المرآة اليمنى لا تتحرك لليسار" },
      { category: "زر تحكم المرايا", faultName: "المرآة اليسرى لا تتحرك للأعلى - Left Mirror Won't Move Up", severity: "medium", description: "المرآة اليسرى لا تتحرك للأعلى" },
      { category: "زر تحكم المرايا", faultName: "المرآة اليسرى لا تتحرك للأسفل - Left Mirror Won't Move Down", severity: "medium", description: "المرآة اليسرى لا تتحرك للأسفل" },
      { category: "زر تحكم المرايا", faultName: "المرآة اليسرى لا تتحرك لليمين - Left Mirror Won't Move Right", severity: "medium", description: "المرآة اليسرى لا تتحرك لليمين" },
      { category: "زر تحكم المرايا", faultName: "المرآة اليسرى لا تتحرك لليسار - Left Mirror Won't Move Left", severity: "medium", description: "المرآة اليسرى لا تتحرك لليسار" },
      { category: "زر تحكم المرايا", faultName: "موتور المرآة اليمنى تالف - Right Mirror Motor Faulty", severity: "medium", description: "موتور المرآة اليمنى تالف" },
      { category: "زر تحكم المرايا", faultName: "موتور المرآة اليسرى تالف - Left Mirror Motor Faulty", severity: "medium", description: "موتور المرآة اليسرى تالف" },
      { category: "زر تحكم المرايا", faultName: "المرآة اليمنى لا تطوي - Right Mirror Won't Fold", severity: "low", description: "المرآة اليمنى لا تطوي" },
      { category: "زر تحكم المرايا", faultName: "المرآة اليسرى لا تطوي - Left Mirror Won't Fold", severity: "low", description: "المرآة اليسرى لا تطوي" },
      { category: "زر تحكم المرايا", faultName: "زر طي المرايا لا يعمل - Mirror Fold Button Not Working", severity: "low", description: "زر طي المرايا لا يعمل" },
      { category: "زر تحكم المرايا", faultName: "المرايا لا تطوي تلقائياً - Auto Fold Not Working", severity: "low", description: "المرايا لا تطوي تلقائياً" },
      { category: "زر تحكم المرايا", faultName: "موتور طي المرآة اليمنى تالف - Right Mirror Fold Motor Faulty", severity: "medium", description: "موتور طي المرآة اليمنى تالف" },
      { category: "زر تحكم المرايا", faultName: "موتور طي المرآة اليسرى تالف - Left Mirror Fold Motor Faulty", severity: "medium", description: "موتور طي المرآة اليسرى تالف" },
      { category: "زر تحكم المرايا", faultName: "تدفئة المرآة اليمنى لا تعمل - Right Mirror Heater Not Working", severity: "low", description: "تدفئة المرآة اليمنى لا تعمل" },
      { category: "زر تحكم المرايا", faultName: "تدفئة المرآة اليسرى لا تعمل - Left Mirror Heater Not Working", severity: "low", description: "تدفئة المرآة اليسرى لا تعمل" },
      { category: "زر تحكم المرايا", faultName: "إضاءة إشارة المرآة اليمنى لا تعمل - Right Mirror Turn Signal Not Working", severity: "medium", description: "إضاءة إشارة المرآة اليمنى لا تعمل" },
      { category: "زر تحكم المرايا", faultName: "إضاءة إشارة المرآة اليسرى لا تعمل - Left Mirror Turn Signal Not Working", severity: "medium", description: "إضاءة إشارة المرآة اليسرى لا تعمل" },
      { category: "زر تحكم المرايا", faultName: "كونكتر زر المرايا تالف - Mirror Switch Connector Faulty", severity: "medium", description: "كونكتر زر المرايا تالف" },
      { category: "زر تحكم المرايا", faultName: "وايرات زر المرايا مقطوعة - Mirror Switch Wiring Cut", severity: "high", description: "وايرات زر المرايا مقطوعة" },
      { category: "زر تحكم المرايا", faultName: "المرآة الوسطى مكسورة - Center Mirror Broken", severity: "low", description: "المرآة الوسطى مكسورة" },

      // ═══════════════════════════════════════════════════════════════
      // نظام التكييف - AC System (30 faults)
      // ═══════════════════════════════════════════════════════════════
      { category: "نظام التكييف", faultName: "المكيف لا يبرد - AC Not Cooling", severity: "medium", description: "المكيف لا يبرد" },
      { category: "نظام التكييف", faultName: "المكيف ضعيف - Weak AC", severity: "medium", description: "المكيف ضعيف" },
      { category: "نظام التكييف", faultName: "غاز المكيف ناقص - Low AC Gas", severity: "medium", description: "غاز المكيف ناقص" },
      { category: "نظام التكييف", faultName: "تسريب غاز المكيف - AC Gas Leak", severity: "medium", description: "تسريب غاز المكيف" },
      { category: "نظام التكييف", faultName: "كمبروسر المكيف تالف - AC Compressor Faulty", severity: "high", description: "كمبروسر المكيف تالف" },
      { category: "نظام التكييف", faultName: "كمبروسر المكيف يصدر صوت - AC Compressor Noisy", severity: "medium", description: "كمبروسر المكيف يصدر صوت" },
      { category: "نظام التكييف", faultName: "كلتش الكمبروسر تالف - AC Clutch Faulty", severity: "medium", description: "كلتش الكمبروسر تالف" },
      { category: "نظام التكييف", faultName: "كندنسر المكيف مسدود - AC Condenser Clogged", severity: "medium", description: "كندنسر المكيف مسدود" },
      { category: "نظام التكييف", faultName: "كندنسر المكيف تالف - AC Condenser Damaged", severity: "medium", description: "كندنسر المكيف تالف" },
      { category: "نظام التكييف", faultName: "إيفابوريتر المكيف مسدود - AC Evaporator Clogged", severity: "medium", description: "إيفابوريتر المكيف مسدود" },
      { category: "نظام التكييف", faultName: "إيفابوريتر المكيف تالف - AC Evaporator Damaged", severity: "high", description: "إيفابوريتر المكيف تالف" },
      { category: "نظام التكييف", faultName: "فلتر المكيف متسخ - Dirty AC Filter", severity: "low", description: "فلتر المكيف يحتاج تغيير" },
      { category: "نظام التكييف", faultName: "مروحة المكيف لا تعمل - AC Fan Faulty", severity: "medium", description: "مروحة المكيف لا تعمل" },
      { category: "نظام التكييف", faultName: "مروحة المكيف ضعيفة - Weak AC Fan", severity: "medium", description: "مروحة المكيف ضعيفة" },
      { category: "نظام التكييف", faultName: "مقاومة مروحة المكيف تالفة - Blower Resistor Faulty", severity: "medium", description: "مقاومة مروحة المكيف تالفة" },
      { category: "نظام التكييف", faultName: "موتور مروحة المكيف تالف - Blower Motor Faulty", severity: "medium", description: "موتور مروحة المكيف تالف" },
      { category: "نظام التكييف", faultName: "صمام التمدد تالف - Expansion Valve Faulty", severity: "medium", description: "صمام التمدد تالف" },
      { category: "نظام التكييف", faultName: "درير المكيف مسدود - AC Dryer Clogged", severity: "medium", description: "درير المكيف مسدود" },
      { category: "نظام التكييف", faultName: "خراطيم المكيف تالفة - AC Hoses Damaged", severity: "medium", description: "خراطيم المكيف تالفة" },
      { category: "نظام التكييف", faultName: "أوليج المكيف ناقص - Low AC Oil", severity: "medium", description: "أوليج المكيف ناقص" },
      { category: "نظام التكييف", faultName: "حساس ضغط المكيف تالف - AC Pressure Sensor Faulty", severity: "medium", description: "حساس ضغط المكيف تالف" },
      { category: "نظام التكييف", faultName: "حساس حرارة المكيف تالف - AC Temp Sensor Faulty", severity: "medium", description: "حساس حرارة المكيف تالف" },
      { category: "نظام التكييف", faultName: "لوحة تحكم المكيف تالفة - AC Control Panel Faulty", severity: "medium", description: "لوحة تحكم المكيف تالفة" },
      { category: "نظام التكييف", faultName: "أزرار المكيف لا تعمل - AC Buttons Faulty", severity: "low", description: "أزرار المكيف لا تعمل" },
      { category: "نظام التكييف", faultName: "شاشة المكيف لا تعمل - AC Display Faulty", severity: "low", description: "شاشة المكيف لا تعمل" },
      { category: "نظام التكييف", faultName: "موتور توزيع الهواء تالف - Blend Door Motor Faulty", severity: "medium", description: "موتور توزيع الهواء تالف" },
      { category: "نظام التكييف", faultName: "رائحة كريهة من المكيف - AC Smell", severity: "low", description: "رائحة كريهة من المكيف" },
      { category: "نظام التكييف", faultName: "تسريب ماء من المكيف - AC Water Leak", severity: "low", description: "تسريب ماء من المكيف" },
      { category: "نظام التكييف", faultName: "التدفئة لا تعمل - Heater Not Working", severity: "medium", description: "التدفئة لا تعمل" },
      { category: "نظام التكييف", faultName: "هيتر كور تالف - Heater Core Faulty", severity: "medium", description: "هيتر كور تالف" },

      // ═══════════════════════════════════════════════════════════════
      // أنظمة السلامة - Safety Systems (40 faults)
      // ═══════════════════════════════════════════════════════════════
      { category: "أنظمة السلامة", faultName: "إيرباق السائق لا يعمل - Driver Airbag Faulty", severity: "high", description: "إيرباق السائق لا يعمل" },
      { category: "أنظمة السلامة", faultName: "إيرباق الراكب لا يعمل - Passenger Airbag Faulty", severity: "high", description: "إيرباق الراكب لا يعمل" },
      { category: "أنظمة السلامة", faultName: "إيرباق جانبي لا يعمل - Side Airbag Faulty", severity: "high", description: "إيرباق جانبي لا يعمل" },
      { category: "أنظمة السلامة", faultName: "إيرباق الستائر لا يعمل - Curtain Airbag Faulty", severity: "high", description: "إيرباق الستائر لا يعمل" },
      { category: "أنظمة السلامة", faultName: "لمبة الإيرباق مضاءة - Airbag Warning Light On", severity: "high", description: "لمبة الإيرباق مضاءة" },
      { category: "أنظمة السلامة", faultName: "حساس الإيرباق تالف - Airbag Sensor Faulty", severity: "high", description: "حساس الإيرباق تالف" },
      { category: "أنظمة السلامة", faultName: "وحدة الإيرباق تالفة - Airbag Module Faulty", severity: "high", description: "وحدة الإيرباق تالفة" },
      { category: "أنظمة السلامة", faultName: "حزام الأمان الأمامي لا يعمل - Front Seatbelt Faulty", severity: "high", description: "حزام الأمان الأمامي لا يعمل" },
      { category: "أنظمة السلامة", faultName: "حزام الأمان الخلفي لا يعمل - Rear Seatbelt Faulty", severity: "medium", description: "حزام الأمان الخلفي لا يعمل" },
      { category: "أنظمة السلامة", faultName: "شداد حزام الأمان تالف - Seatbelt Pretensioner Faulty", severity: "high", description: "شداد حزام الأمان تالف" },
      { category: "أنظمة السلامة", faultName: "حساس حزام الأمان تالف - Seatbelt Sensor Faulty", severity: "medium", description: "حساس حزام الأمان تالف" },
      { category: "أنظمة السلامة", faultName: "نظام تحذير الخروج عن المسار لا يعمل - Lane Departure Warning Faulty", severity: "medium", description: "نظام تحذير الخروج عن المسار لا يعمل" },
      { category: "أنظمة السلامة", faultName: "نظام النقطة العمياء لا يعمل - Blind Spot Monitor Faulty", severity: "medium", description: "نظام النقطة العمياء لا يعمل" },
      { category: "أنظمة السلامة", faultName: "نظام التحذير من الاصطدام لا يعمل - Collision Warning Faulty", severity: "medium", description: "نظام التحذير من الاصطدام لا يعمل" },
      { category: "أنظمة السلامة", faultName: "نظام الفرملة التلقائية لا يعمل - Auto Emergency Brake Faulty", severity: "high", description: "نظام الفرملة التلقائية لا يعمل" },
      { category: "أنظمة السلامة", faultName: "كاميرا المساعدة لا تعمل - Assist Camera Faulty", severity: "medium", description: "كاميرا المساعدة لا تعمل" },
      { category: "أنظمة السلامة", faultName: "رادار الأمان لا يعمل - Safety Radar Faulty", severity: "medium", description: "رادار الأمان لا يعمل" },
      { category: "أنظمة السلامة", faultName: "نظام مراقبة السائق لا يعمل - Driver Monitor Faulty", severity: "medium", description: "نظام مراقبة السائق لا يعمل" },
      { category: "أنظمة السلامة", faultName: "نظام المساعدة في الركن لا يعمل - Park Assist Faulty", severity: "low", description: "نظام المساعدة في الركن لا يعمل" },
      { category: "أنظمة السلامة", faultName: "نظام التعرف على الإشارات لا يعمل - Traffic Sign Recognition Faulty", severity: "low", description: "نظام التعرف على الإشارات لا يعمل" },
      { category: "أنظمة السلامة", faultName: "نظام الرؤية الليلية لا يعمل - Night Vision Faulty", severity: "low", description: "نظام الرؤية الليلية لا يعمل" },
      { category: "أنظمة السلامة", faultName: "نظام تثبيت السرعة التكيفي لا يعمل - Adaptive Cruise Control Faulty", severity: "medium", description: "نظام تثبيت السرعة التكيفي لا يعمل" },
      { category: "أنظمة السلامة", faultName: "نظام الحفاظ على المسار لا يعمل - Lane Keep Assist Faulty", severity: "medium", description: "نظام الحفاظ على المسار لا يعمل" },
      { category: "أنظمة السلامة", faultName: "نظام منع الانقلاب لا يعمل - Roll Stability Control Faulty", severity: "high", description: "نظام منع الانقلاب لا يعمل" },
      { category: "أنظمة السلامة", faultName: "نظام التحكم بالنزول لا يعمل - Hill Descent Control Faulty", severity: "medium", description: "نظام التحكم بالنزول لا يعمل" },
      { category: "أنظمة السلامة", faultName: "نظام المساعدة بالصعود لا يعمل - Hill Start Assist Faulty", severity: "medium", description: "نظام المساعدة بالصعود لا يعمل" },
      { category: "أنظمة السلامة", faultName: "نظام التحذير من التعب لا يعمل - Fatigue Warning Faulty", severity: "medium", description: "نظام التحذير من التعب لا يعمل" },
      { category: "أنظمة السلامة", faultName: "مفتاح الطوارئ لا يعمل - Emergency Key Faulty", severity: "medium", description: "مفتاح الطوارئ لا يعمل" },
      { category: "أنظمة السلامة", faultName: "قفل الأطفال لا يعمل - Child Lock Faulty", severity: "medium", description: "قفل الأطفال لا يعمل" },
      { category: "أنظمة السلامة", faultName: "نظام ISOFIX مكسور - ISOFIX Damaged", severity: "high", description: "نظام ISOFIX مكسور" },
      { category: "أنظمة السلامة", faultName: "طفاية الحريق مفقودة - Fire Extinguisher Missing", severity: "medium", description: "طفاية الحريق مفقودة" },
      { category: "أنظمة السلامة", faultName: "مثلث التحذير مفقود - Warning Triangle Missing", severity: "low", description: "مثلث التحذير مفقود" },
      { category: "أنظمة السلامة", faultName: "عدة الإسعافات الأولية مفقودة - First Aid Kit Missing", severity: "low", description: "عدة الإسعافات الأولية مفقودة" },
      { category: "أنظمة السلامة", faultName: "سترة السلامة مفقودة - Safety Vest Missing", severity: "low", description: "سترة السلامة مفقودة" },
      { category: "أنظمة السلامة", faultName: "نظام الاتصال بالطوارئ لا يعمل - Emergency Call System Faulty", severity: "medium", description: "نظام الاتصال بالطوارئ لا يعمل" },
      { category: "أنظمة السلامة", faultName: "كاميرا 360 لا تعمل - 360 Camera Faulty", severity: "low", description: "كاميرا 360 لا تعمل" },
      { category: "أنظمة السلامة", faultName: "حساس الضغط الجوي تالف - Atmospheric Pressure Sensor Faulty", severity: "low", description: "حساس الضغط الجوي تالف" },
      { category: "أنظمة السلامة", faultName: "نظام التهوية في الحوادث لا يعمل - Crash Ventilation Faulty", severity: "medium", description: "نظام التهوية في الحوادث لا يعمل" },
      { category: "أنظمة السلامة", faultName: "قفل المقود لا يعمل - Steering Lock Faulty", severity: "medium", description: "قفل المقود لا يعمل" },
      { category: "أنظمة السلامة", faultName: "إنذار الباب مفتوح لا يعمل - Door Ajar Warning Faulty", severity: "low", description: "إنذار الباب مفتوح لا يعمل" },

      // ═══════════════════════════════════════════════════════════════
      // نظام الوقود والعادم - Fuel & Exhaust (30 faults)
      // ═══════════════════════════════════════════════════════════════
      { category: "نظام الوقود والعادم", faultName: "تسريب بنزين - Fuel Leak", severity: "high", description: "تسريب في نظام الوقود" },
      { category: "نظام الوقود والعادم", faultName: "رائحة بنزين - Fuel Smell", severity: "medium", description: "رائحة بنزين غير طبيعية" },
      { category: "نظام الوقود والعادم", faultName: "مضخة البنزين ضعيفة - Weak Fuel Pump", severity: "medium", description: "مضخة البنزين ضعيفة" },
      { category: "نظام الوقود والعادم", faultName: "مضخة البنزين تالفة - Fuel Pump Faulty", severity: "high", description: "مضخة البنزين تالفة" },
      { category: "نظام الوقود والعادم", faultName: "فلتر البنزين مسدود - Fuel Filter Clogged", severity: "medium", description: "فلتر البنزين مسدود" },
      { category: "نظام الوقود والعادم", faultName: "خزان الوقود تالف - Fuel Tank Damaged", severity: "high", description: "خزان الوقود تالف" },
      { category: "نظام الوقود والعادم", faultName: "غطاء البنزين تالف - Fuel Cap Faulty", severity: "low", description: "غطاء البنزين تالف" },
      { category: "نظام الوقود والعادم", faultName: "غطاء البنزين مفقود - Fuel Cap Missing", severity: "low", description: "غطاء البنزين مفقود" },
      { category: "نظام الوقود والعادم", faultName: "حساس مستوى البنزين تالف - Fuel Level Sensor Faulty", severity: "medium", description: "حساس مستوى البنزين تالف" },
      { category: "نظام الوقود والعادم", faultName: "منظم ضغط الوقود تالف - Fuel Pressure Regulator Faulty", severity: "medium", description: "منظم ضغط الوقود تالف" },
      { category: "نظام الوقود والعادم", faultName: "أنابيب الوقود تالفة - Fuel Lines Damaged", severity: "high", description: "أنابيب الوقود تالفة" },
      { category: "نظام الوقود والعادم", faultName: "البخاخات تحتاج تنظيف - Injectors Need Cleaning", severity: "medium", description: "البخاخات تحتاج تنظيف" },
      { category: "نظام الوقود والعادم", faultName: "بخاخ تالف - Faulty Injector", severity: "high", description: "بخاخ تالف" },
      { category: "نظام الوقود والعادم", faultName: "نظام EVAP تالف - EVAP System Faulty", severity: "medium", description: "نظام تبخير الوقود تالف" },
      { category: "نظام الوقود والعادم", faultName: "صمام تنفيس الوقود تالف - Fuel Vent Valve Faulty", severity: "medium", description: "صمام تنفيس الوقود تالف" },
      { category: "نظام الوقود والعادم", faultName: "إكزوز مثقوب - Exhaust Pipe Hole", severity: "medium", description: "ثقب في الإكزوز" },
      { category: "نظام الوقود والعادم", faultName: "إكزوز صدئ - Rusty Exhaust", severity: "medium", description: "صدأ في الإكزوز" },
      { category: "نظام الوقود والعادم", faultName: "تسريب من الإكزوز - Exhaust Leak", severity: "medium", description: "تسريب من الإكزوز" },
      { category: "نظام الوقود والعادم", faultName: "كتلايزر تالف - Catalytic Converter Faulty", severity: "high", description: "الكتلايزر تالف" },
      { category: "نظام الوقود والعادم", faultName: "كتلايزر مسروق - Catalytic Converter Stolen", severity: "high", description: "الكتلايزر مسروق" },
      { category: "نظام الوقود والعادم", faultName: "سنسر الإكزوز تالف - Exhaust Sensor Faulty", severity: "medium", description: "حساس الإكزوز تالف" },
      { category: "نظام الوقود والعادم", faultName: "مانيفولد الإكزوز مكسور - Exhaust Manifold Cracked", severity: "high", description: "مانيفولد الإكزوز مكسور" },
      { category: "نظام الوقود والعادم", faultName: "جوان الإكزوز تالف - Exhaust Gasket Faulty", severity: "medium", description: "جوان الإكزوز تالف" },
      { category: "نظام الوقود والعادم", faultName: "علاقات الإكزوز تالفة - Exhaust Hangers Worn", severity: "low", description: "علاقات الإكزوز تالفة" },
      { category: "نظام الوقود والعادم", faultName: "سدادة الإكزوز مفقودة - Muffler Missing", severity: "medium", description: "سدادة الإكزوز مفقودة" },
      { category: "نظام الوقود والعادم", faultName: "صوت عالي من الإكزوز - Loud Exhaust", severity: "medium", description: "صوت عالي من الإكزوز" },
      { category: "نظام الوقود والعادم", faultName: "التيربو يصدر صوت - Turbo Noise", severity: "medium", description: "التيربو يصدر صوت" },
      { category: "نظام الوقود والعادم", faultName: "التيربو ضعيف - Weak Turbo", severity: "medium", description: "التيربو ضعيف" },
      { category: "نظام الوقود والعادم", faultName: "التيربو تالف - Turbo Faulty", severity: "high", description: "التيربو تالف" },
      { category: "نظام الوقود والعادم", faultName: "تسريب زيت من التيربو - Turbo Oil Leak", severity: "medium", description: "تسريب زيت من التيربو" },

      // ═══════════════════════════════════════════════════════════════
      // الهيكل والشاصي - Body & Chassis (50 faults)
      // ═══════════════════════════════════════════════════════════════
      { category: "الهيكل والشاصي", faultName: "الشاصي فيه صدأ - Chassis Rust", severity: "high", description: "صدأ في الشاصي" },
      { category: "الهيكل والشاصي", faultName: "الشاصي ملتوي - Bent Chassis", severity: "high", description: "الشاصي ملتوي" },
      { category: "الهيكل والشاصي", faultName: "الشاصي فيه تصليح - Chassis Repair", severity: "high", description: "تصليح سابق في الشاصي" },
      { category: "الهيكل والشاصي", faultName: "الشاصي فيه لحام - Chassis Welding", severity: "high", description: "لحام في الشاصي" },
      { category: "الهيكل والشاصي", faultName: "قاعدة المحرك تالفة - Engine Subframe Damaged", severity: "high", description: "قاعدة المحرك تالفة" },
      { category: "الهيكل والشاصي", faultName: "قاعدة التعليق تالفة - Suspension Subframe Damaged", severity: "high", description: "قاعدة التعليق تالفة" },
      { category: "الهيكل والشاصي", faultName: "أرضية السيارة صدئة - Floor Pan Rust", severity: "high", description: "صدأ في أرضية السيارة" },
      { category: "الهيكل والشاصي", faultName: "أرضية السيارة مثقوبة - Floor Pan Hole", severity: "high", description: "ثقب في أرضية السيارة" },
      { category: "الهيكل والشاصي", faultName: "عزل الأرضية تالف - Floor Insulation Damaged", severity: "low", description: "عزل الأرضية تالف" },
      { category: "الهيكل والشاصي", faultName: "تسريب ماء للداخل - Water Leak Inside", severity: "medium", description: "تسريب ماء للداخل" },
      { category: "الهيكل والشاصي", faultName: "الباب الأمامي يمين ثقيل - Front Right Door Heavy", severity: "low", description: "الباب الأمامي الأيمن ثقيل" },
      { category: "الهيكل والشاصي", faultName: "الباب الأمامي يسار ثقيل - Front Left Door Heavy", severity: "low", description: "الباب الأمامي الأيسر ثقيل" },
      { category: "الهيكل والشاصي", faultName: "الباب الخلفي يمين ثقيل - Rear Right Door Heavy", severity: "low", description: "الباب الخلفي الأيمن ثقيل" },
      { category: "الهيكل والشاصي", faultName: "الباب الخلفي يسار ثقيل - Rear Left Door Heavy", severity: "low", description: "الباب الخلفي الأيسر ثقيل" },
      { category: "الهيكل والشاصي", faultName: "مفصلة الباب تالفة - Door Hinge Worn", severity: "medium", description: "مفصلة الباب تالفة" },
      { category: "الهيكل والشاصي", faultName: "قفل الباب لا يعمل - Door Lock Faulty", severity: "medium", description: "قفل الباب لا يعمل" },
      { category: "الهيكل والشاصي", faultName: "مقبض الباب مكسور - Door Handle Broken", severity: "medium", description: "مقبض الباب مكسور" },
      { category: "الهيكل والشاصي", faultName: "ربلة الباب تالفة - Door Seal Worn", severity: "low", description: "ربلة الباب تالفة" },
      { category: "الهيكل والشاصي", faultName: "الكابوت لا يقفل - Hood Won't Latch", severity: "medium", description: "الكابوت لا يقفل" },
      { category: "الهيكل والشاصي", faultName: "كيبل الكابوت مقطوع - Hood Cable Broken", severity: "medium", description: "كيبل الكابوت مقطوع" },
      { category: "الهيكل والشاصي", faultName: "شماعات الكابوت تالفة - Hood Hinges Worn", severity: "low", description: "شماعات الكابوت تالفة" },
      { category: "الهيكل والشاصي", faultName: "دعامات الكابوت ضعيفة - Hood Struts Weak", severity: "low", description: "دعامات الكابوت ضعيفة" },
      { category: "الهيكل والشاصي", faultName: "الدكة لا تقفل - Trunk Won't Latch", severity: "medium", description: "الدكة لا تقفل" },
      { category: "الهيكل والشاصي", faultName: "كيبل الدكة مقطوع - Trunk Cable Broken", severity: "medium", description: "كيبل الدكة مقطوع" },
      { category: "الهيكل والشاصي", faultName: "دعامات الدكة ضعيفة - Trunk Struts Weak", severity: "low", description: "دعامات الدكة ضعيفة" },
      { category: "الهيكل والشاصي", faultName: "ربلة الدكة تالفة - Trunk Seal Worn", severity: "low", description: "ربلة الدكة تالفة" },
      { category: "الهيكل والشاصي", faultName: "سقف السيارة مضروب - Roof Damage", severity: "high", description: "ضرر في سقف السيارة" },
      { category: "الهيكل والشاصي", faultName: "تلف من البرد - Hail Damage", severity: "medium", description: "تلف من البرد" },
      { category: "الهيكل والشاصي", faultName: "صدأ حول الزجاج - Rust Around Glass", severity: "medium", description: "صدأ حول الزجاج" },
      { category: "الهيكل والشاصي", faultName: "تسريب من الزجاج الأمامي - Windshield Leak", severity: "medium", description: "تسريب من الزجاج الأمامي" },
      { category: "الهيكل والشاصي", faultName: "تسريب من الزجاج الخلفي - Rear Glass Leak", severity: "medium", description: "تسريب من الزجاج الخلفي" },
      { category: "الهيكل والشاصي", faultName: "البراويز صدئة - Trim Rust", severity: "low", description: "صدأ في البراويز" },
      { category: "الهيكل والشاصي", faultName: "البراويز مفقودة - Trim Missing", severity: "low", description: "البراويز مفقودة" },
      { category: "الهيكل والشاصي", faultName: "البراويز مكسورة - Trim Broken", severity: "low", description: "البراويز مكسورة" },
      { category: "الهيكل والشاصي", faultName: "عازل الصوت تالف - Sound Deadening Damaged", severity: "low", description: "عازل الصوت تالف" },
      { category: "الهيكل والشاصي", faultName: "رش صوت سيئ - Poor Undercoating", severity: "low", description: "رش الصوت بحالة سيئة" },
      { category: "الهيكل والشاصي", faultName: "غطاء المحرك السفلي مفقود - Engine Undertray Missing", severity: "low", description: "غطاء المحرك السفلي مفقود" },
      { category: "الهيكل والشاصي", faultName: "غطاء المحرك السفلي تالف - Engine Undertray Damaged", severity: "low", description: "غطاء المحرك السفلي تالف" },
      { category: "الهيكل والشاصي", faultName: "واقي الطين مفقود - Fender Liner Missing", severity: "low", description: "واقي الطين مفقود" },
      { category: "الهيكل والشاصي", faultName: "واقي الطين تالف - Fender Liner Damaged", severity: "low", description: "واقي الطين تالف" },
      { category: "الهيكل والشاصي", faultName: "جسم السيارة غير متوازن - Body Misalignment", severity: "high", description: "جسم السيارة غير متوازن" },
      { category: "الهيكل والشاصي", faultName: "الفجوات بين الأجزاء غير متساوية - Uneven Panel Gaps", severity: "medium", description: "الفجوات بين الأجزاء غير متساوية" },
      { category: "الهيكل والشاصي", faultName: "علامات حادث سابقة - Signs of Previous Accident", severity: "high", description: "علامات حادث سابقة" },
      { category: "الهيكل والشاصي", faultName: "هيكل مستورد - Imported Frame", severity: "high", description: "الهيكل مستورد" },
      { category: "الهيكل والشاصي", faultName: "VIN غير مطابق - VIN Mismatch", severity: "high", description: "رقم الشاصي غير مطابق" },
      { category: "الهيكل والشاصي", faultName: "السيارة غرقانة - Flood Damage", severity: "high", description: "السيارة تعرضت للغرق" },
      { category: "الهيكل والشاصي", faultName: "علامات الغرق ظاهرة - Visible Flood Signs", severity: "high", description: "علامات الغرق ظاهرة" },
      { category: "الهيكل والشاصي", faultName: "رائحة عفن - Mold Smell", severity: "medium", description: "رائحة عفن داخل السيارة" },
      { category: "الهيكل والشاصي", faultName: "السيارة محروقة جزئياً - Partial Fire Damage", severity: "high", description: "السيارة محروقة جزئياً" },

      // ═══════════════════════════════════════════════════════════════
      // الزجاج والمرايا - Glass & Mirrors (30 faults)
      // ═══════════════════════════════════════════════════════════════
      { category: "الزجاج والمرايا", faultName: "الزجاج الأمامي مكسور - Windshield Cracked", severity: "high", description: "كسر في الزجاج الأمامي" },
      { category: "الزجاج والمرايا", faultName: "الزجاج الأمامي مشروخ - Windshield Chipped", severity: "medium", description: "شرخ في الزجاج الأمامي" },
      { category: "الزجاج والمرايا", faultName: "الزجاج الأمامي مخدوش - Windshield Scratched", severity: "low", description: "خدوش على الزجاج الأمامي" },
      { category: "الزجاج والمرايا", faultName: "الزجاج الأمامي مبدل - Windshield Replaced", severity: "low", description: "الزجاج الأمامي مبدل" },
      { category: "الزجاج والمرايا", faultName: "الزجاج الخلفي مكسور - Rear Window Cracked", severity: "high", description: "كسر في الزجاج الخلفي" },
      { category: "الزجاج والمرايا", faultName: "الزجاج الخلفي مشروخ - Rear Window Chipped", severity: "medium", description: "شرخ في الزجاج الخلفي" },
      { category: "الزجاج والمرايا", faultName: "تسخين الزجاج الخلفي لا يعمل - Rear Defrost Not Working", severity: "low", description: "تسخين الزجاج الخلفي لا يعمل" },
      { category: "الزجاج والمرايا", faultName: "زجاج الباب مكسور - Door Glass Broken", severity: "high", description: "زجاج الباب مكسور" },
      { category: "الزجاج والمرايا", faultName: "زجاج الباب مخدوش - Door Glass Scratched", severity: "low", description: "زجاج الباب مخدوش" },
      { category: "الزجاج والمرايا", faultName: "تظليل الزجاج تالف - Window Tint Damaged", severity: "low", description: "تظليل الزجاج تالف" },
      { category: "الزجاج والمرايا", faultName: "تظليل الزجاج فقاعات - Window Tint Bubbling", severity: "low", description: "فقاعات في تظليل الزجاج" },
      { category: "الزجاج والمرايا", faultName: "المرآة الجانبية يمين مكسورة - Right Mirror Broken", severity: "medium", description: "المرآة الجانبية اليمنى مكسورة" },
      { category: "الزجاج والمرايا", faultName: "المرآة الجانبية يسار مكسورة - Left Mirror Broken", severity: "medium", description: "المرآة الجانبية اليسرى مكسورة" },
      { category: "الزجاج والمرايا", faultName: "غطاء المرآة يمين مفقود - Right Mirror Cover Missing", severity: "low", description: "غطاء المرآة الأيمن مفقود" },
      { category: "الزجاج والمرايا", faultName: "غطاء المرآة يسار مفقود - Left Mirror Cover Missing", severity: "low", description: "غطاء المرآة الأيسر مفقود" },
      { category: "الزجاج والمرايا", faultName: "المرآة الداخلية مكسورة - Interior Mirror Broken", severity: "medium", description: "المرآة الداخلية مكسورة" },
      { category: "الزجاج والمرايا", faultName: "المرآة الداخلية مرتخية - Interior Mirror Loose", severity: "low", description: "المرآة الداخلية مرتخية" },
      { category: "الزجاج والمرايا", faultName: "تعتيم المرآة الداخلية لا يعمل - Auto Dim Mirror Not Working", severity: "low", description: "تعتيم المرآة التلقائي لا يعمل" },
      { category: "الزجاج والمرايا", faultName: "موتور الزجاج الأمامي يمين تالف - FR Window Motor Faulty", severity: "medium", description: "موتور الزجاج الأمامي الأيمن تالف" },
      { category: "الزجاج والمرايا", faultName: "موتور الزجاج الأمامي يسار تالف - FL Window Motor Faulty", severity: "medium", description: "موتور الزجاج الأمامي الأيسر تالف" },
      { category: "الزجاج والمرايا", faultName: "موتور الزجاج الخلفي يمين تالف - RR Window Motor Faulty", severity: "medium", description: "موتور الزجاج الخلفي الأيمن تالف" },
      { category: "الزجاج والمرايا", faultName: "موتور الزجاج الخلفي يسار تالف - RL Window Motor Faulty", severity: "medium", description: "موتور الزجاج الخلفي الأيسر تالف" },
      { category: "الزجاج والمرايا", faultName: "سويتش الزجاج تالف - Window Switch Faulty", severity: "medium", description: "سويتش الزجاج تالف" },
      { category: "الزجاج والمرايا", faultName: "ربلة الزجاج تالفة - Window Seal Worn", severity: "low", description: "ربلة الزجاج تالفة" },
      { category: "الزجاج والمرايا", faultName: "صوت صرير من الزجاج - Window Squeak", severity: "low", description: "صوت صرير من الزجاج" },
      { category: "الزجاج والمرايا", faultName: "الزجاج بطيء - Slow Window", severity: "low", description: "الزجاج بطيء في الحركة" },
      { category: "الزجاج والمرايا", faultName: "الزجاج يسقط - Window Falls Down", severity: "medium", description: "الزجاج يسقط من نفسه" },
      { category: "الزجاج والمرايا", faultName: "زجاج البانوراما مكسور - Panoramic Roof Glass Cracked", severity: "high", description: "زجاج البانوراما مكسور" },
      { category: "الزجاج والمرايا", faultName: "ربلة البانوراما تسرب - Panoramic Roof Seal Leak", severity: "medium", description: "تسريب من ربلة البانوراما" },
      { category: "الزجاج والمرايا", faultName: "ستارة البانوراما لا تعمل - Panoramic Shade Not Working", severity: "low", description: "ستارة البانوراما لا تعمل" },

      // ═══════════════════════════════════════════════════════════════
      // الإضاءة الخارجية - Exterior Lighting (30 faults)
      // ═══════════════════════════════════════════════════════════════
      { category: "الإضاءة الخارجية", faultName: "لايت أمامي يمين محروق - Right Headlight Burnt", severity: "medium", description: "اللايت الأمامي الأيمن محروق" },
      { category: "الإضاءة الخارجية", faultName: "لايت أمامي يسار محروق - Left Headlight Burnt", severity: "medium", description: "اللايت الأمامي الأيسر محروق" },
      { category: "الإضاءة الخارجية", faultName: "لايت أمامي ضعيف - Dim Headlight", severity: "low", description: "اللايت الأمامي ضعيف" },
      { category: "الإضاءة الخارجية", faultName: "لايت أمامي مبخر - Foggy Headlight", severity: "medium", description: "اللايت الأمامي مبخر" },
      { category: "الإضاءة الخارجية", faultName: "غطاء اللايت الأمامي مكسور - Headlight Lens Cracked", severity: "medium", description: "غطاء اللايت الأمامي مكسور" },
      { category: "الإضاءة الخارجية", faultName: "موتور اللايت الأمامي تالف - Headlight Motor Faulty", severity: "medium", description: "موتور اللايت الأمامي تالف" },
      { category: "الإضاءة الخارجية", faultName: "ضبط اللايت الأمامي غير صحيح - Headlight Aim Off", severity: "medium", description: "ضبط اللايت الأمامي غير صحيح" },
      { category: "الإضاءة الخارجية", faultName: "نظام اللايت الأوتوماتيكي لا يعمل - Auto Lights Not Working", severity: "low", description: "نظام اللايت الأوتوماتيكي لا يعمل" },
      { category: "الإضاءة الخارجية", faultName: "لايت خلفي يمين محروق - Right Taillight Burnt", severity: "medium", description: "اللايت الخلفي الأيمن محروق" },
      { category: "الإضاءة الخارجية", faultName: "لايت خلفي يسار محروق - Left Taillight Burnt", severity: "medium", description: "اللايت الخلفي الأيسر محروق" },
      { category: "الإضاءة الخارجية", faultName: "غطاء اللايت الخلفي مكسور - Taillight Lens Cracked", severity: "medium", description: "غطاء اللايت الخلفي مكسور" },
      { category: "الإضاءة الخارجية", faultName: "لايت الفرامل محروق - Brake Light Burnt", severity: "high", description: "لايت الفرامل محروق" },
      { category: "الإضاءة الخارجية", faultName: "لايت الفرامل الثالث محروق - Third Brake Light Burnt", severity: "medium", description: "لايت الفرامل الثالث محروق" },
      { category: "الإضاءة الخارجية", faultName: "إشارة أمامية يمين محروقة - Right Front Turn Signal Burnt", severity: "medium", description: "الإشارة الأمامية اليمنى محروقة" },
      { category: "الإضاءة الخارجية", faultName: "إشارة أمامية يسار محروقة - Left Front Turn Signal Burnt", severity: "medium", description: "الإشارة الأمامية اليسرى محروقة" },
      { category: "الإضاءة الخارجية", faultName: "إشارة خلفية يمين محروقة - Right Rear Turn Signal Burnt", severity: "medium", description: "الإشارة الخلفية اليمنى محروقة" },
      { category: "الإضاءة الخارجية", faultName: "إشارة خلفية يسار محروقة - Left Rear Turn Signal Burnt", severity: "medium", description: "الإشارة الخلفية اليسرى محروقة" },
      { category: "الإضاءة الخارجية", faultName: "إشارة المرآة يمين لا تعمل - Right Mirror Signal Not Working", severity: "low", description: "إشارة المرآة اليمنى لا تعمل" },
      { category: "الإضاءة الخارجية", faultName: "إشارة المرآة يسار لا تعمل - Left Mirror Signal Not Working", severity: "low", description: "إشارة المرآة اليسرى لا تعمل" },
      { category: "الإضاءة الخارجية", faultName: "لايت الضباب الأمامي محروق - Front Fog Light Burnt", severity: "low", description: "لايت الضباب الأمامي محروق" },
      { category: "الإضاءة الخارجية", faultName: "لايت الضباب الخلفي محروق - Rear Fog Light Burnt", severity: "low", description: "لايت الضباب الخلفي محروق" },
      { category: "الإضاءة الخارجية", faultName: "لايت الريفرس محروق - Reverse Light Burnt", severity: "medium", description: "لايت الريفرس محروق" },
      { category: "الإضاءة الخارجية", faultName: "لايت اللوحة محروق - License Plate Light Burnt", severity: "low", description: "لايت اللوحة محروق" },
      { category: "الإضاءة الخارجية", faultName: "لايت الباب محروق - Door Light Burnt", severity: "low", description: "لايت الباب محروق" },
      { category: "الإضاءة الخارجية", faultName: "ريليه الإشارات تالف - Turn Signal Relay Faulty", severity: "medium", description: "ريليه الإشارات تالف" },
      { category: "الإضاءة الخارجية", faultName: "فلاشر الطوارئ لا يعمل - Hazard Flasher Not Working", severity: "medium", description: "فلاشر الطوارئ لا يعمل" },
      { category: "الإضاءة الخارجية", faultName: "DRL لا يعمل - DRL Not Working", severity: "low", description: "أضواء النهار لا تعمل" },
      { category: "الإضاءة الخارجية", faultName: "LED تالف - LED Light Faulty", severity: "medium", description: "إضاءة LED تالفة" },
      { category: "الإضاءة الخارجية", faultName: "زينون تالف - Xenon Light Faulty", severity: "medium", description: "إضاءة زينون تالفة" },
      { category: "الإضاءة الخارجية", faultName: "بالاست الزينون تالف - Xenon Ballast Faulty", severity: "medium", description: "بالاست الزينون تالف" },

      // ═══════════════════════════════════════════════════════════════
      // نظام التوجيه - Steering System (25 faults)
      // ═══════════════════════════════════════════════════════════════
      { category: "نظام التوجيه", faultName: "طرمبة الباور ضعيفة - Power Steering Pump Weak", severity: "medium", description: "طرمبة الباور ضعيفة" },
      { category: "نظام التوجيه", faultName: "طرمبة الباور تالفة - Power Steering Pump Faulty", severity: "high", description: "طرمبة الباور تالفة" },
      { category: "نظام التوجيه", faultName: "تسريب زيت الباور - Power Steering Fluid Leak", severity: "medium", description: "تسريب زيت الباور" },
      { category: "نظام التوجيه", faultName: "زيت الباور منخفض - Low Power Steering Fluid", severity: "medium", description: "زيت الباور منخفض" },
      { category: "نظام التوجيه", faultName: "زيت الباور قديم - Old Power Steering Fluid", severity: "low", description: "زيت الباور قديم" },
      { category: "نظام التوجيه", faultName: "صوت من الباور - Power Steering Noise", severity: "medium", description: "صوت من نظام الباور" },
      { category: "نظام التوجيه", faultName: "بيلت الباور متشقق - Power Steering Belt Cracked", severity: "medium", description: "بيلت الباور متشقق" },
      { category: "نظام التوجيه", faultName: "خراطيم الباور تالفة - Power Steering Hoses Damaged", severity: "medium", description: "خراطيم الباور تالفة" },
      { category: "نظام التوجيه", faultName: "نظام التوجيه الكهربائي تالف - Electric Power Steering Faulty", severity: "high", description: "نظام التوجيه الكهربائي تالف" },
      { category: "نظام التوجيه", faultName: "موتور التوجيه الكهربائي تالف - EPS Motor Faulty", severity: "high", description: "موتور التوجيه الكهربائي تالف" },
      { category: "نظام التوجيه", faultName: "حساس التوجيه تالف - Steering Sensor Faulty", severity: "medium", description: "حساس التوجيه تالف" },
      { category: "نظام التوجيه", faultName: "حساس زاوية المقود تالف - Steering Angle Sensor Faulty", severity: "medium", description: "حساس زاوية المقود تالف" },
      { category: "نظام التوجيه", faultName: "عمود المقود يحتاج تشحيم - Steering Column Needs Grease", severity: "low", description: "عمود المقود يحتاج تشحيم" },
      { category: "نظام التوجيه", faultName: "صوت طقطقة من المقود - Steering Wheel Click", severity: "low", description: "صوت طقطقة من المقود" },
      { category: "نظام التوجيه", faultName: "المقود يهتز - Steering Wheel Vibrates", severity: "medium", description: "المقود يهتز" },
      { category: "نظام التوجيه", faultName: "المقود ثقيل - Heavy Steering", severity: "medium", description: "المقود ثقيل" },
      { category: "نظام التوجيه", faultName: "المقود خفيف زيادة - Too Light Steering", severity: "medium", description: "المقود خفيف أكثر من اللازم" },
      { category: "نظام التوجيه", faultName: "المقود يميل - Steering Wheel Off Center", severity: "medium", description: "المقود يميل لجهة" },
      { category: "نظام التوجيه", faultName: "السيارة تسحب يمين - Car Pulls Right", severity: "medium", description: "السيارة تسحب لليمين" },
      { category: "نظام التوجيه", faultName: "السيارة تسحب يسار - Car Pulls Left", severity: "medium", description: "السيارة تسحب لليسار" },
      { category: "نظام التوجيه", faultName: "لمبة الباور مضاءة - Power Steering Warning Light", severity: "medium", description: "لمبة تحذير الباور مضاءة" },
      { category: "نظام التوجيه", faultName: "تلف في الرانك - Rack Damage", severity: "high", description: "تلف في رانك التوجيه" },
      { category: "نظام التوجيه", faultName: "بوش عمود المقود تالف - Steering Column Bushing Worn", severity: "medium", description: "بوش عمود المقود تالف" },
      { category: "نظام التوجيه", faultName: "المقود يلف كثير - Excessive Steering Play", severity: "high", description: "لعب زيادة في المقود" },
      { category: "نظام التوجيه", faultName: "غطاء المقود تالف - Steering Wheel Cover Worn", severity: "low", description: "غطاء المقود تالف" },

      // ═══════════════════════════════════════════════════════════════
      // الملحقات والإكسسوارات - Accessories (30 faults)
      // ═══════════════════════════════════════════════════════════════
      { category: "الملحقات والإكسسوارات", faultName: "الفرش الداخلي تالف - Floor Mats Worn", severity: "low", description: "الفرش الداخلي تالف" },
      { category: "الملحقات والإكسسوارات", faultName: "الفرش الداخلي مفقود - Floor Mats Missing", severity: "low", description: "الفرش الداخلي مفقود" },
      { category: "الملحقات والإكسسوارات", faultName: "غطاء البضاعة مفقود - Cargo Cover Missing", severity: "low", description: "غطاء البضاعة مفقود" },
      { category: "الملحقات والإكسسوارات", faultName: "شبكة البضاعة مفقودة - Cargo Net Missing", severity: "low", description: "شبكة البضاعة مفقودة" },
      { category: "الملحقات والإكسسوارات", faultName: "أرضية الدكة مفقودة - Trunk Floor Missing", severity: "low", description: "أرضية الدكة مفقودة" },
      { category: "الملحقات والإكسسوارات", faultName: "غطاء العجلة الاحتياطية مفقود - Spare Tire Cover Missing", severity: "low", description: "غطاء العجلة الاحتياطية مفقود" },
      { category: "الملحقات والإكسسوارات", faultName: "رف السقف مفقود - Roof Rack Missing", severity: "low", description: "رف السقف مفقود" },
      { category: "الملحقات والإكسسوارات", faultName: "رف السقف تالف - Roof Rack Damaged", severity: "low", description: "رف السقف تالف" },
      { category: "الملحقات والإكسسوارات", faultName: "أنتينا مكسورة - Antenna Broken", severity: "low", description: "الأنتينا مكسورة" },
      { category: "الملحقات والإكسسوارات", faultName: "أنتينا مفقودة - Antenna Missing", severity: "low", description: "الأنتينا مفقودة" },
      { category: "الملحقات والإكسسوارات", faultName: "مسند اليد تالف - Armrest Damaged", severity: "low", description: "مسند اليد تالف" },
      { category: "الملحقات والإكسسوارات", faultName: "مسند الرأس مفقود - Headrest Missing", severity: "low", description: "مسند الرأس مفقود" },
      { category: "الملحقات والإكسسوارات", faultName: "مسند الرأس تالف - Headrest Damaged", severity: "low", description: "مسند الرأس تالف" },
      { category: "الملحقات والإكسسوارات", faultName: "مساحة الزجاج الخلفي مفقودة - Rear Wiper Missing", severity: "low", description: "مساحة الزجاج الخلفي مفقودة" },
      { category: "الملحقات والإكسسوارات", faultName: "مساحة الزجاج الخلفي لا تعمل - Rear Wiper Not Working", severity: "low", description: "مساحة الزجاج الخلفي لا تعمل" },
      { category: "الملحقات والإكسسوارات", faultName: "غطاء الخزان مفقود - Fuel Door Missing", severity: "low", description: "غطاء الخزان مفقود" },
      { category: "الملحقات والإكسسوارات", faultName: "غطاء الخزان لا يقفل - Fuel Door Won't Lock", severity: "low", description: "غطاء الخزان لا يقفل" },
      { category: "الملحقات والإكسسوارات", faultName: "كتيب السيارة مفقود - Owner Manual Missing", severity: "low", description: "كتيب السيارة مفقود" },
      { category: "الملحقات والإكسسوارات", faultName: "المفتاح الاحتياطي مفقود - Spare Key Missing", severity: "low", description: "المفتاح الاحتياطي مفقود" },
      { category: "الملحقات والإكسسوارات", faultName: "درج القفازات مكسور - Glove Box Broken", severity: "low", description: "درج القفازات مكسور" },
      { category: "الملحقات والإكسسوارات", faultName: "درج القفازات لا يقفل - Glove Box Won't Lock", severity: "low", description: "درج القفازات لا يقفل" },
      { category: "الملحقات والإكسسوارات", faultName: "حامل الأكواب مكسور - Cup Holder Broken", severity: "low", description: "حامل الأكواب مكسور" },
      { category: "الملحقات والإكسسوارات", faultName: "منفضة السجائر مفقودة - Ashtray Missing", severity: "low", description: "منفضة السجائر مفقودة" },
      { category: "الملحقات والإكسسوارات", faultName: "غطاء المرآة الشمسية مكسور - Vanity Mirror Cover Broken", severity: "low", description: "غطاء المرآة الشمسية مكسور" },
      { category: "الملحقات والإكسسوارات", faultName: "إنارة المرآة الشمسية لا تعمل - Vanity Mirror Light Not Working", severity: "low", description: "إنارة المرآة الشمسية لا تعمل" },
      { category: "الملحقات والإكسسوارات", faultName: "غطاء فتحة السقف مفقود - Sunroof Shade Missing", severity: "low", description: "غطاء فتحة السقف مفقود" },
      { category: "الملحقات والإكسسوارات", faultName: "مقبض السقف مكسور - Grab Handle Broken", severity: "low", description: "مقبض السقف مكسور" },
      { category: "الملحقات والإكسسوارات", faultName: "خطاف الملابس مكسور - Coat Hook Broken", severity: "low", description: "خطاف الملابس مكسور" },
      { category: "الملحقات والإكسسوارات", faultName: "طفاية السجائر لا تعمل - Cigarette Lighter Not Working", severity: "low", description: "طفاية السجائر لا تعمل" },
      { category: "الملحقات والإكسسوارات", faultName: "كماليات إضافية مركبة - Aftermarket Accessories Installed", severity: "low", description: "كماليات إضافية مركبة" },

      // ═══════════════════════════════════════════════════════════════
      // الوثائق والتوثيق - Documentation (15 faults)
      // ═══════════════════════════════════════════════════════════════
      { category: "الوثائق والتوثيق", faultName: "الملكية مفقودة - Registration Missing", severity: "high", description: "الملكية مفقودة" },
      { category: "الوثائق والتوثيق", faultName: "الملكية منتهية - Registration Expired", severity: "high", description: "الملكية منتهية" },
      { category: "الوثائق والتوثيق", faultName: "التأمين منتهي - Insurance Expired", severity: "high", description: "التأمين منتهي" },
      { category: "الوثائق والتوثيق", faultName: "الفحص الفني منتهي - Inspection Expired", severity: "high", description: "الفحص الفني منتهي" },
      { category: "الوثائق والتوثيق", faultName: "سجل الصيانة مفقود - Service Records Missing", severity: "medium", description: "سجل الصيانة مفقود" },
      { category: "الوثائق والتوثيق", faultName: "تاريخ الصيانة غير مكتمل - Incomplete Service History", severity: "medium", description: "تاريخ الصيانة غير مكتمل" },
      { category: "الوثائق والتوثيق", faultName: "الضمان منتهي - Warranty Expired", severity: "low", description: "الضمان منتهي" },
      { category: "الوثائق والتوثيق", faultName: "الضمان الممتد غير متوفر - Extended Warranty Not Available", severity: "low", description: "الضمان الممتد غير متوفر" },
      { category: "الوثائق والتوثيق", faultName: "حوادث سابقة مسجلة - Previous Accidents Recorded", severity: "high", description: "حوادث سابقة مسجلة" },
      { category: "الوثائق والتوثيق", faultName: "استرجاع سابق من الشركة - Previous Recall", severity: "medium", description: "استرجاع سابق من الشركة" },
      { category: "الوثائق والتوثيق", faultName: "مالكين سابقين متعددين - Multiple Previous Owners", severity: "low", description: "مالكين سابقين متعددين" },
      { category: "الوثائق والتوثيق", faultName: "السيارة مستوردة - Imported Vehicle", severity: "medium", description: "السيارة مستوردة" },
      { category: "الوثائق والتوثيق", faultName: "السيارة تاكسي سابق - Previous Taxi", severity: "high", description: "السيارة كانت تاكسي" },
      { category: "الوثائق والتوثيق", faultName: "السيارة إيجار سابق - Previous Rental", severity: "medium", description: "السيارة كانت إيجار" },
      { category: "الوثائق والتوثيق", faultName: "العداد ملوب - Odometer Rolled Back", severity: "high", description: "العداد ملوب" },

      // ═══════════════════════════════════════════════════════════════
      // أعطال متنوعة - Miscellaneous (15 faults)
      // ═══════════════════════════════════════════════════════════════
      { category: "أعطال متنوعة", faultName: "رائحة غريبة من السيارة - Strange Smell", severity: "medium", description: "رائحة غريبة من السيارة" },
      { category: "أعطال متنوعة", faultName: "صوت غريب غير محدد - Unidentified Noise", severity: "medium", description: "صوت غريب غير محدد المصدر" },
      { category: "أعطال متنوعة", faultName: "اهتزاز غير طبيعي - Abnormal Vibration", severity: "medium", description: "اهتزاز غير طبيعي" },
      { category: "أعطال متنوعة", faultName: "استهلاك وقود مرتفع - High Fuel Consumption", severity: "medium", description: "استهلاك الوقود مرتفع" },
      { category: "أعطال متنوعة", faultName: "أداء ضعيف - Poor Performance", severity: "medium", description: "أداء السيارة ضعيف" },
      { category: "أعطال متنوعة", faultName: "تسارع بطيء - Slow Acceleration", severity: "medium", description: "التسارع بطيء" },
      { category: "أعطال متنوعة", faultName: "السيارة تهز عند الوقوف - Idle Vibration", severity: "medium", description: "السيارة تهز وهي واقفة" },
      { category: "أعطال متنوعة", faultName: "صعوبة في التشغيل البارد - Hard Cold Start", severity: "medium", description: "صعوبة في التشغيل وهي باردة" },
      { category: "أعطال متنوعة", faultName: "صعوبة في التشغيل الحار - Hard Hot Start", severity: "medium", description: "صعوبة في التشغيل وهي حارة" },
      { category: "أعطال متنوعة", faultName: "تفتفة في المحرك - Engine Misfire", severity: "high", description: "تفتفة في المحرك" },
      { category: "أعطال متنوعة", faultName: "ضعف عزم عند الصعود - Low Power on Hills", severity: "medium", description: "ضعف عزم عند الصعود" },
      { category: "أعطال متنوعة", faultName: "السيارة تموت عند التوقف - Stalls at Stop", severity: "high", description: "السيارة تموت عند التوقف" },
      { category: "أعطال متنوعة", faultName: "بطء استجابة الدعسة - Throttle Response Delay", severity: "medium", description: "بطء استجابة دواسة البنزين" },
      { category: "أعطال متنوعة", faultName: "صفير عند التشغيل - Squeal on Startup", severity: "medium", description: "صوت صفير عند التشغيل" },
      { category: "أعطال متنوعة", faultName: "تنقيط زيت تحت السيارة - Oil Drip Under Car", severity: "medium", description: "تنقيط زيت تحت السيارة" },
      { category: "أعطال متنوعة", faultName: "دخان من الماكينة - Engine Smoke", severity: "high", description: "دخان يطلع من الماكينة" },

      // ═══════════════════════════════════════════════════════════════
      // البطارية - Battery (Even percentages only: 2%, 4%, 6%... 100%)
      // ═══════════════════════════════════════════════════════════════
      { category: "البطارية", faultName: "حالة البطارية 2% - Battery Charge 2%", severity: "high", description: "حالة البطارية 2%" },
      { category: "البطارية", faultName: "حالة البطارية 4% - Battery Charge 4%", severity: "high", description: "حالة البطارية 4%" },
      { category: "البطارية", faultName: "حالة البطارية 6% - Battery Charge 6%", severity: "high", description: "حالة البطارية 6%" },
      { category: "البطارية", faultName: "حالة البطارية 8% - Battery Charge 8%", severity: "high", description: "حالة البطارية 8%" },
      { category: "البطارية", faultName: "حالة البطارية 10% - Battery Charge 10%", severity: "high", description: "حالة البطارية 10%" },
      { category: "البطارية", faultName: "حالة البطارية 12% - Battery Charge 12%", severity: "high", description: "حالة البطارية 12%" },
      { category: "البطارية", faultName: "حالة البطارية 14% - Battery Charge 14%", severity: "high", description: "حالة البطارية 14%" },
      { category: "البطارية", faultName: "حالة البطارية 16% - Battery Charge 16%", severity: "high", description: "حالة البطارية 16%" },
      { category: "البطارية", faultName: "حالة البطارية 18% - Battery Charge 18%", severity: "high", description: "حالة البطارية 18%" },
      { category: "البطارية", faultName: "حالة البطارية 20% - Battery Charge 20%", severity: "high", description: "حالة البطارية 20%" },
      { category: "البطارية", faultName: "حالة البطارية 22% - Battery Charge 22%", severity: "high", description: "حالة البطارية 22%" },
      { category: "البطارية", faultName: "حالة البطارية 24% - Battery Charge 24%", severity: "high", description: "حالة البطارية 24%" },
      { category: "البطارية", faultName: "حالة البطارية 26% - Battery Charge 26%", severity: "medium", description: "حالة البطارية 26%" },
      { category: "البطارية", faultName: "حالة البطارية 28% - Battery Charge 28%", severity: "medium", description: "حالة البطارية 28%" },
      { category: "البطارية", faultName: "حالة البطارية 30% - Battery Charge 30%", severity: "medium", description: "حالة البطارية 30%" },
      { category: "البطارية", faultName: "حالة البطارية 32% - Battery Charge 32%", severity: "medium", description: "حالة البطارية 32%" },
      { category: "البطارية", faultName: "حالة البطارية 34% - Battery Charge 34%", severity: "medium", description: "حالة البطارية 34%" },
      { category: "البطارية", faultName: "حالة البطارية 36% - Battery Charge 36%", severity: "medium", description: "حالة البطارية 36%" },
      { category: "البطارية", faultName: "حالة البطارية 38% - Battery Charge 38%", severity: "medium", description: "حالة البطارية 38%" },
      { category: "البطارية", faultName: "حالة البطارية 40% - Battery Charge 40%", severity: "medium", description: "حالة البطارية 40%" },
      { category: "البطارية", faultName: "حالة البطارية 42% - Battery Charge 42%", severity: "medium", description: "حالة البطارية 42%" },
      { category: "البطارية", faultName: "حالة البطارية 44% - Battery Charge 44%", severity: "medium", description: "حالة البطارية 44%" },
      { category: "البطارية", faultName: "حالة البطارية 46% - Battery Charge 46%", severity: "medium", description: "حالة البطارية 46%" },
      { category: "البطارية", faultName: "حالة البطارية 48% - Battery Charge 48%", severity: "medium", description: "حالة البطارية 48%" },
      { category: "البطارية", faultName: "حالة البطارية 50% - Battery Charge 50%", severity: "medium", description: "حالة البطارية 50%" },
      { category: "البطارية", faultName: "حالة البطارية 52% - Battery Charge 52%", severity: "low", description: "حالة البطارية 52%" },
      { category: "البطارية", faultName: "حالة البطارية 54% - Battery Charge 54%", severity: "low", description: "حالة البطارية 54%" },
      { category: "البطارية", faultName: "حالة البطارية 56% - Battery Charge 56%", severity: "low", description: "حالة البطارية 56%" },
      { category: "البطارية", faultName: "حالة البطارية 58% - Battery Charge 58%", severity: "low", description: "حالة البطارية 58%" },
      { category: "البطارية", faultName: "حالة البطارية 60% - Battery Charge 60%", severity: "low", description: "حالة البطارية 60%" },
      { category: "البطارية", faultName: "حالة البطارية 62% - Battery Charge 62%", severity: "low", description: "حالة البطارية 62%" },
      { category: "البطارية", faultName: "حالة البطارية 64% - Battery Charge 64%", severity: "low", description: "حالة البطارية 64%" },
      { category: "البطارية", faultName: "حالة البطارية 66% - Battery Charge 66%", severity: "low", description: "حالة البطارية 66%" },
      { category: "البطارية", faultName: "حالة البطارية 68% - Battery Charge 68%", severity: "low", description: "حالة البطارية 68%" },
      { category: "البطارية", faultName: "حالة البطارية 70% - Battery Charge 70%", severity: "low", description: "حالة البطارية 70%" },
      { category: "البطارية", faultName: "حالة البطارية 72% - Battery Charge 72%", severity: "low", description: "حالة البطارية 72%" },
      { category: "البطارية", faultName: "حالة البطارية 74% - Battery Charge 74%", severity: "low", description: "حالة البطارية 74%" },
      { category: "البطارية", faultName: "حالة البطارية 76% - Battery Charge 76%", severity: "low", description: "حالة البطارية 76%" },
      { category: "البطارية", faultName: "حالة البطارية 78% - Battery Charge 78%", severity: "low", description: "حالة البطارية 78%" },
      { category: "البطارية", faultName: "حالة البطارية 80% - Battery Charge 80%", severity: "low", description: "حالة البطارية 80%" },
      { category: "البطارية", faultName: "حالة البطارية 82% - Battery Charge 82%", severity: "low", description: "حالة البطارية 82%" },
      { category: "البطارية", faultName: "حالة البطارية 84% - Battery Charge 84%", severity: "low", description: "حالة البطارية 84%" },
      { category: "البطارية", faultName: "حالة البطارية 86% - Battery Charge 86%", severity: "low", description: "حالة البطارية 86%" },
      { category: "البطارية", faultName: "حالة البطارية 88% - Battery Charge 88%", severity: "low", description: "حالة البطارية 88%" },
      { category: "البطارية", faultName: "حالة البطارية 90% - Battery Charge 90%", severity: "low", description: "حالة البطارية 90%" },
      { category: "البطارية", faultName: "حالة البطارية 92% - Battery Charge 92%", severity: "low", description: "حالة البطارية 92%" },
      { category: "البطارية", faultName: "حالة البطارية 94% - Battery Charge 94%", severity: "low", description: "حالة البطارية 94%" },
      { category: "البطارية", faultName: "حالة البطارية 96% - Battery Charge 96%", severity: "low", description: "حالة البطارية 96%" },
      { category: "البطارية", faultName: "حالة البطارية 98% - Battery Charge 98%", severity: "low", description: "حالة البطارية 98%" },
      { category: "البطارية", faultName: "حالة البطارية 100% - Battery Charge 100%", severity: "low", description: "حالة البطارية 100%" },

      // ═══════════════════════════════════════════════════════════════
      // زيت المحرك - Engine Oil (1-100%)
      // ═══════════════════════════════════════════════════════════════
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 1% - Engine Oil Level 1%", severity: "high", description: "مستوى زيت المحرك 1%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 2% - Engine Oil Level 2%", severity: "high", description: "مستوى زيت المحرك 2%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 3% - Engine Oil Level 3%", severity: "high", description: "مستوى زيت المحرك 3%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 4% - Engine Oil Level 4%", severity: "high", description: "مستوى زيت المحرك 4%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 5% - Engine Oil Level 5%", severity: "high", description: "مستوى زيت المحرك 5%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 6% - Engine Oil Level 6%", severity: "high", description: "مستوى زيت المحرك 6%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 7% - Engine Oil Level 7%", severity: "high", description: "مستوى زيت المحرك 7%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 8% - Engine Oil Level 8%", severity: "high", description: "مستوى زيت المحرك 8%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 9% - Engine Oil Level 9%", severity: "high", description: "مستوى زيت المحرك 9%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 10% - Engine Oil Level 10%", severity: "high", description: "مستوى زيت المحرك 10%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 11% - Engine Oil Level 11%", severity: "high", description: "مستوى زيت المحرك 11%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 12% - Engine Oil Level 12%", severity: "high", description: "مستوى زيت المحرك 12%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 13% - Engine Oil Level 13%", severity: "high", description: "مستوى زيت المحرك 13%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 14% - Engine Oil Level 14%", severity: "high", description: "مستوى زيت المحرك 14%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 15% - Engine Oil Level 15%", severity: "high", description: "مستوى زيت المحرك 15%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 16% - Engine Oil Level 16%", severity: "high", description: "مستوى زيت المحرك 16%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 17% - Engine Oil Level 17%", severity: "high", description: "مستوى زيت المحرك 17%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 18% - Engine Oil Level 18%", severity: "high", description: "مستوى زيت المحرك 18%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 19% - Engine Oil Level 19%", severity: "high", description: "مستوى زيت المحرك 19%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 20% - Engine Oil Level 20%", severity: "high", description: "مستوى زيت المحرك 20%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 21% - Engine Oil Level 21%", severity: "high", description: "مستوى زيت المحرك 21%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 22% - Engine Oil Level 22%", severity: "high", description: "مستوى زيت المحرك 22%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 23% - Engine Oil Level 23%", severity: "high", description: "مستوى زيت المحرك 23%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 24% - Engine Oil Level 24%", severity: "high", description: "مستوى زيت المحرك 24%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 25% - Engine Oil Level 25%", severity: "high", description: "مستوى زيت المحرك 25%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 26% - Engine Oil Level 26%", severity: "medium", description: "مستوى زيت المحرك 26%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 27% - Engine Oil Level 27%", severity: "medium", description: "مستوى زيت المحرك 27%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 28% - Engine Oil Level 28%", severity: "medium", description: "مستوى زيت المحرك 28%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 29% - Engine Oil Level 29%", severity: "medium", description: "مستوى زيت المحرك 29%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 30% - Engine Oil Level 30%", severity: "medium", description: "مستوى زيت المحرك 30%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 31% - Engine Oil Level 31%", severity: "medium", description: "مستوى زيت المحرك 31%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 32% - Engine Oil Level 32%", severity: "medium", description: "مستوى زيت المحرك 32%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 33% - Engine Oil Level 33%", severity: "medium", description: "مستوى زيت المحرك 33%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 34% - Engine Oil Level 34%", severity: "medium", description: "مستوى زيت المحرك 34%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 35% - Engine Oil Level 35%", severity: "medium", description: "مستوى زيت المحرك 35%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 36% - Engine Oil Level 36%", severity: "medium", description: "مستوى زيت المحرك 36%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 37% - Engine Oil Level 37%", severity: "medium", description: "مستوى زيت المحرك 37%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 38% - Engine Oil Level 38%", severity: "medium", description: "مستوى زيت المحرك 38%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 39% - Engine Oil Level 39%", severity: "medium", description: "مستوى زيت المحرك 39%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 40% - Engine Oil Level 40%", severity: "medium", description: "مستوى زيت المحرك 40%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 41% - Engine Oil Level 41%", severity: "medium", description: "مستوى زيت المحرك 41%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 42% - Engine Oil Level 42%", severity: "medium", description: "مستوى زيت المحرك 42%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 43% - Engine Oil Level 43%", severity: "medium", description: "مستوى زيت المحرك 43%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 44% - Engine Oil Level 44%", severity: "medium", description: "مستوى زيت المحرك 44%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 45% - Engine Oil Level 45%", severity: "medium", description: "مستوى زيت المحرك 45%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 46% - Engine Oil Level 46%", severity: "medium", description: "مستوى زيت المحرك 46%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 47% - Engine Oil Level 47%", severity: "medium", description: "مستوى زيت المحرك 47%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 48% - Engine Oil Level 48%", severity: "medium", description: "مستوى زيت المحرك 48%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 49% - Engine Oil Level 49%", severity: "medium", description: "مستوى زيت المحرك 49%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 50% - Engine Oil Level 50%", severity: "medium", description: "مستوى زيت المحرك 50%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 51% - Engine Oil Level 51%", severity: "low", description: "مستوى زيت المحرك 51%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 52% - Engine Oil Level 52%", severity: "low", description: "مستوى زيت المحرك 52%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 53% - Engine Oil Level 53%", severity: "low", description: "مستوى زيت المحرك 53%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 54% - Engine Oil Level 54%", severity: "low", description: "مستوى زيت المحرك 54%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 55% - Engine Oil Level 55%", severity: "low", description: "مستوى زيت المحرك 55%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 56% - Engine Oil Level 56%", severity: "low", description: "مستوى زيت المحرك 56%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 57% - Engine Oil Level 57%", severity: "low", description: "مستوى زيت المحرك 57%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 58% - Engine Oil Level 58%", severity: "low", description: "مستوى زيت المحرك 58%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 59% - Engine Oil Level 59%", severity: "low", description: "مستوى زيت المحرك 59%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 60% - Engine Oil Level 60%", severity: "low", description: "مستوى زيت المحرك 60%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 61% - Engine Oil Level 61%", severity: "low", description: "مستوى زيت المحرك 61%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 62% - Engine Oil Level 62%", severity: "low", description: "مستوى زيت المحرك 62%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 63% - Engine Oil Level 63%", severity: "low", description: "مستوى زيت المحرك 63%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 64% - Engine Oil Level 64%", severity: "low", description: "مستوى زيت المحرك 64%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 65% - Engine Oil Level 65%", severity: "low", description: "مستوى زيت المحرك 65%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 66% - Engine Oil Level 66%", severity: "low", description: "مستوى زيت المحرك 66%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 67% - Engine Oil Level 67%", severity: "low", description: "مستوى زيت المحرك 67%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 68% - Engine Oil Level 68%", severity: "low", description: "مستوى زيت المحرك 68%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 69% - Engine Oil Level 69%", severity: "low", description: "مستوى زيت المحرك 69%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 70% - Engine Oil Level 70%", severity: "low", description: "مستوى زيت المحرك 70%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 71% - Engine Oil Level 71%", severity: "low", description: "مستوى زيت المحرك 71%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 72% - Engine Oil Level 72%", severity: "low", description: "مستوى زيت المحرك 72%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 73% - Engine Oil Level 73%", severity: "low", description: "مستوى زيت المحرك 73%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 74% - Engine Oil Level 74%", severity: "low", description: "مستوى زيت المحرك 74%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 75% - Engine Oil Level 75%", severity: "low", description: "مستوى زيت المحرك 75%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 76% - Engine Oil Level 76%", severity: "low", description: "مستوى زيت المحرك 76%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 77% - Engine Oil Level 77%", severity: "low", description: "مستوى زيت المحرك 77%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 78% - Engine Oil Level 78%", severity: "low", description: "مستوى زيت المحرك 78%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 79% - Engine Oil Level 79%", severity: "low", description: "مستوى زيت المحرك 79%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 80% - Engine Oil Level 80%", severity: "low", description: "مستوى زيت المحرك 80%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 81% - Engine Oil Level 81%", severity: "low", description: "مستوى زيت المحرك 81%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 82% - Engine Oil Level 82%", severity: "low", description: "مستوى زيت المحرك 82%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 83% - Engine Oil Level 83%", severity: "low", description: "مستوى زيت المحرك 83%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 84% - Engine Oil Level 84%", severity: "low", description: "مستوى زيت المحرك 84%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 85% - Engine Oil Level 85%", severity: "low", description: "مستوى زيت المحرك 85%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 86% - Engine Oil Level 86%", severity: "low", description: "مستوى زيت المحرك 86%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 87% - Engine Oil Level 87%", severity: "low", description: "مستوى زيت المحرك 87%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 88% - Engine Oil Level 88%", severity: "low", description: "مستوى زيت المحرك 88%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 89% - Engine Oil Level 89%", severity: "low", description: "مستوى زيت المحرك 89%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 90% - Engine Oil Level 90%", severity: "low", description: "مستوى زيت المحرك 90%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 91% - Engine Oil Level 91%", severity: "low", description: "مستوى زيت المحرك 91%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 92% - Engine Oil Level 92%", severity: "low", description: "مستوى زيت المحرك 92%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 93% - Engine Oil Level 93%", severity: "low", description: "مستوى زيت المحرك 93%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 94% - Engine Oil Level 94%", severity: "low", description: "مستوى زيت المحرك 94%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 95% - Engine Oil Level 95%", severity: "low", description: "مستوى زيت المحرك 95%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 96% - Engine Oil Level 96%", severity: "low", description: "مستوى زيت المحرك 96%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 97% - Engine Oil Level 97%", severity: "low", description: "مستوى زيت المحرك 97%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 98% - Engine Oil Level 98%", severity: "low", description: "مستوى زيت المحرك 98%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 99% - Engine Oil Level 99%", severity: "low", description: "مستوى زيت المحرك 99%" },
      { category: "زيت المحرك", faultName: "مستوى زيت المحرك 100% - Engine Oil Level 100%", severity: "low", description: "مستوى زيت المحرك 100%" },

      // ═══════════════════════════════════════════════════════════════
      // سائل التبريد - Coolant (Descriptive levels without percentages)
      // ═══════════════════════════════════════════════════════════════
      { category: "سائل التبريد", faultName: "سائل التبريد فاضي - Coolant Empty", severity: "high", description: "خزان سائل التبريد فارغ تماماً" },
      { category: "سائل التبريد", faultName: "سائل التبريد فاضي تقريباً - Coolant Almost Empty", severity: "high", description: "سائل التبريد شبه فارغ" },
      { category: "سائل التبريد", faultName: "سائل التبريد منخفض جداً - Coolant Very Low", severity: "high", description: "مستوى سائل التبريد منخفض جداً" },
      { category: "سائل التبريد", faultName: "سائل التبريد منخفض - Coolant Low", severity: "medium", description: "مستوى سائل التبريد منخفض" },
      { category: "سائل التبريد", faultName: "سائل التبريد تحت الحد الأدنى - Coolant Below Minimum", severity: "medium", description: "سائل التبريد تحت علامة الحد الأدنى" },
      { category: "سائل التبريد", faultName: "سائل التبريد قريب من الحد الأدنى - Coolant Near Minimum", severity: "medium", description: "سائل التبريد قريب من الحد الأدنى" },
      { category: "سائل التبريد", faultName: "سائل التبريد متوسط منخفض - Coolant Medium Low", severity: "low", description: "سائل التبريد في المستوى المتوسط المنخفض" },
      { category: "سائل التبريد", faultName: "سائل التبريد متوسط - Coolant Medium", severity: "low", description: "سائل التبريد في المستوى المتوسط" },
      { category: "سائل التبريد", faultName: "سائل التبريد متوسط مرتفع - Coolant Medium High", severity: "low", description: "سائل التبريد في المستوى المتوسط المرتفع" },
      { category: "سائل التبريد", faultName: "سائل التبريد مقبول - Coolant Acceptable", severity: "low", description: "مستوى سائل التبريد مقبول" },
      { category: "سائل التبريد", faultName: "سائل التبريد جيد - Coolant Good", severity: "low", description: "مستوى سائل التبريد جيد" },
      { category: "سائل التبريد", faultName: "سائل التبريد ممتلئ - Coolant Full", severity: "low", description: "سائل التبريد ممتلئ" },
      { category: "سائل التبريد", faultName: "سائل التبريد زيادة - Coolant Overfilled", severity: "medium", description: "سائل التبريد زيادة عن الحد" },
      { category: "سائل التبريد", faultName: "سائل التبريد ملوث - Coolant Contaminated", severity: "high", description: "سائل التبريد ملوث" },
      { category: "سائل التبريد", faultName: "سائل التبريد لونه غير طبيعي - Coolant Abnormal Color", severity: "medium", description: "لون سائل التبريد غير طبيعي" },
      { category: "سائل التبريد", faultName: "سائل التبريد صدئ - Coolant Rusty", severity: "high", description: "سائل التبريد صدئ" },
      { category: "سائل التبريد", faultName: "سائل التبريد زيتي - Coolant Oily", severity: "high", description: "سائل التبريد مختلط بالزيت" },
      { category: "سائل التبريد", faultName: "سائل التبريد قديم - Coolant Old", severity: "medium", description: "سائل التبريد قديم يحتاج تغيير" },
      { category: "سائل التبريد", faultName: "سائل التبريد مخفف - Coolant Diluted", severity: "medium", description: "سائل التبريد مخفف بالماء" },
      { category: "سائل التبريد", faultName: "سائل التبريد مركز - Coolant Concentrated", severity: "low", description: "سائل التبريد مركز" },
      { category: "سائل التبريد", faultName: "رائحة سائل التبريد - Coolant Smell", severity: "medium", description: "رائحة سائل التبريد ظاهرة" },
      { category: "سائل التبريد", faultName: "تسريب سائل التبريد - Coolant Leak", severity: "high", description: "تسريب في سائل التبريد" },
      { category: "سائل التبريد", faultName: "تسريب من الرديتر - Radiator Leak", severity: "high", description: "تسريب سائل التبريد من الرديتر" },
      { category: "سائل التبريد", faultName: "تسريب من الخراطيم - Hose Leak", severity: "high", description: "تسريب من خراطيم التبريد" },
      { category: "سائل التبريد", faultName: "غطاء الرديتر تالف - Radiator Cap Damaged", severity: "medium", description: "غطاء الرديتر تالف" },
      { category: "سائل التبريد", faultName: "خزان التبريد متشقق - Reservoir Cracked", severity: "high", description: "خزان سائل التبريد متشقق" },
      { category: "سائل التبريد", faultName: "خزان التبريد متسخ - Reservoir Dirty", severity: "low", description: "خزان سائل التبريد متسخ" },
      { category: "سائل التبريد", faultName: "فقاعات في سائل التبريد - Coolant Bubbles", severity: "high", description: "فقاعات في سائل التبريد" },
      { category: "سائل التبريد", faultName: "ضغط التبريد مرتفع - High Coolant Pressure", severity: "high", description: "ضغط نظام التبريد مرتفع" },
      { category: "سائل التبريد", faultName: "ضغط التبريد منخفض - Low Coolant Pressure", severity: "medium", description: "ضغط نظام التبريد منخفض" },

      // ═══════════════════════════════════════════════════════════════
      // زيت الفرامل - Brake Fluid
      // ═══════════════════════════════════════════════════════════════
      { category: "زيت الفرامل", faultName: "زيت الفرامل فاضي - Brake Fluid Empty", severity: "high", description: "خزان زيت الفرامل فارغ" },
      { category: "زيت الفرامل", faultName: "زيت الفرامل منخفض جداً - Brake Fluid Very Low", severity: "high", description: "مستوى زيت الفرامل منخفض جداً" },
      { category: "زيت الفرامل", faultName: "زيت الفرامل منخفض - Brake Fluid Low", severity: "medium", description: "مستوى زيت الفرامل منخفض" },
      { category: "زيت الفرامل", faultName: "زيت الفرامل تحت الحد الأدنى - Brake Fluid Below Min", severity: "medium", description: "زيت الفرامل تحت الحد الأدنى" },
      { category: "زيت الفرامل", faultName: "زيت الفرامل متوسط - Brake Fluid Medium", severity: "low", description: "مستوى زيت الفرامل متوسط" },
      { category: "زيت الفرامل", faultName: "زيت الفرامل جيد - Brake Fluid Good", severity: "low", description: "مستوى زيت الفرامل جيد" },
      { category: "زيت الفرامل", faultName: "زيت الفرامل ممتلئ - Brake Fluid Full", severity: "low", description: "زيت الفرامل ممتلئ" },
      { category: "زيت الفرامل", faultName: "زيت الفرامل قديم - Brake Fluid Old", severity: "medium", description: "زيت الفرامل قديم يحتاج تغيير" },
      { category: "زيت الفرامل", faultName: "زيت الفرامل ملوث - Brake Fluid Contaminated", severity: "high", description: "زيت الفرامل ملوث" },
      { category: "زيت الفرامل", faultName: "زيت الفرامل لونه غامق - Brake Fluid Dark", severity: "medium", description: "لون زيت الفرامل غامق" },
      { category: "زيت الفرامل", faultName: "تسريب زيت الفرامل - Brake Fluid Leak", severity: "high", description: "تسريب في زيت الفرامل" },
      { category: "زيت الفرامل", faultName: "غطاء زيت الفرامل مفقود - Brake Fluid Cap Missing", severity: "medium", description: "غطاء خزان زيت الفرامل مفقود" },
      { category: "زيت الفرامل", faultName: "غطاء زيت الفرامل تالف - Brake Fluid Cap Damaged", severity: "medium", description: "غطاء خزان زيت الفرامل تالف" },
      { category: "زيت الفرامل", faultName: "خزان زيت الفرامل متشقق - Brake Fluid Reservoir Cracked", severity: "high", description: "خزان زيت الفرامل متشقق" },
      { category: "زيت الفرامل", faultName: "خزان زيت الفرامل متسخ - Brake Fluid Reservoir Dirty", severity: "low", description: "خزان زيت الفرامل متسخ" },

      // ═══════════════════════════════════════════════════════════════
      // زيت القير - Transmission Fluid
      // ═══════════════════════════════════════════════════════════════
      { category: "زيت القير", faultName: "زيت القير فاضي - Trans Fluid Empty", severity: "high", description: "زيت القير فارغ" },
      { category: "زيت القير", faultName: "زيت القير منخفض جداً - Trans Fluid Very Low", severity: "high", description: "مستوى زيت القير منخفض جداً" },
      { category: "زيت القير", faultName: "زيت القير منخفض - Trans Fluid Low", severity: "medium", description: "مستوى زيت القير منخفض" },
      { category: "زيت القير", faultName: "زيت القير تحت الحد الأدنى - Trans Fluid Below Min", severity: "medium", description: "زيت القير تحت الحد الأدنى" },
      { category: "زيت القير", faultName: "زيت القير متوسط - Trans Fluid Medium", severity: "low", description: "مستوى زيت القير متوسط" },
      { category: "زيت القير", faultName: "زيت القير جيد - Trans Fluid Good", severity: "low", description: "مستوى زيت القير جيد" },
      { category: "زيت القير", faultName: "زيت القير ممتلئ - Trans Fluid Full", severity: "low", description: "زيت القير ممتلئ" },
      { category: "زيت القير", faultName: "زيت القير قديم - Trans Fluid Old", severity: "medium", description: "زيت القير قديم يحتاج تغيير" },
      { category: "زيت القير", faultName: "زيت القير محروق - Trans Fluid Burnt", severity: "high", description: "زيت القير محروق" },
      { category: "زيت القير", faultName: "زيت القير لونه غامق - Trans Fluid Dark", severity: "medium", description: "لون زيت القير غامق" },
      { category: "زيت القير", faultName: "زيت القير رائحته محروقة - Trans Fluid Burnt Smell", severity: "high", description: "رائحة زيت القير محروقة" },
      { category: "زيت القير", faultName: "تسريب زيت القير - Trans Fluid Leak", severity: "high", description: "تسريب في زيت القير" },
      { category: "زيت القير", faultName: "زيت القير ملوث بالماء - Trans Fluid Water Contaminated", severity: "high", description: "زيت القير ملوث بالماء" },
      { category: "زيت القير", faultName: "زيت القير فيه برادة - Trans Fluid Metal Particles", severity: "high", description: "برادة معدنية في زيت القير" },
      { category: "زيت القير", faultName: "زيت القير يحتاج تغيير - Trans Fluid Needs Change", severity: "medium", description: "زيت القير يحتاج تغيير" },

      // ═══════════════════════════════════════════════════════════════
      // زيت الباور - Power Steering Fluid
      // ═══════════════════════════════════════════════════════════════
      { category: "زيت الباور", faultName: "زيت الباور فاضي - PS Fluid Empty", severity: "high", description: "زيت الباور فارغ" },
      { category: "زيت الباور", faultName: "زيت الباور منخفض جداً - PS Fluid Very Low", severity: "high", description: "مستوى زيت الباور منخفض جداً" },
      { category: "زيت الباور", faultName: "زيت الباور منخفض - PS Fluid Low", severity: "medium", description: "مستوى زيت الباور منخفض" },
      { category: "زيت الباور", faultName: "زيت الباور تحت الحد الأدنى - PS Fluid Below Min", severity: "medium", description: "زيت الباور تحت الحد الأدنى" },
      { category: "زيت الباور", faultName: "زيت الباور متوسط - PS Fluid Medium", severity: "low", description: "مستوى زيت الباور متوسط" },
      { category: "زيت الباور", faultName: "زيت الباور جيد - PS Fluid Good", severity: "low", description: "مستوى زيت الباور جيد" },
      { category: "زيت الباور", faultName: "زيت الباور ممتلئ - PS Fluid Full", severity: "low", description: "زيت الباور ممتلئ" },
      { category: "زيت الباور", faultName: "زيت الباور قديم - PS Fluid Old", severity: "medium", description: "زيت الباور قديم يحتاج تغيير" },
      { category: "زيت الباور", faultName: "زيت الباور ملوث - PS Fluid Contaminated", severity: "high", description: "زيت الباور ملوث" },
      { category: "زيت الباور", faultName: "زيت الباور لونه غامق - PS Fluid Dark", severity: "medium", description: "لون زيت الباور غامق" },
      { category: "زيت الباور", faultName: "تسريب زيت الباور - PS Fluid Leak", severity: "high", description: "تسريب في زيت الباور" },
      { category: "زيت الباور", faultName: "غطاء زيت الباور مفقود - PS Fluid Cap Missing", severity: "medium", description: "غطاء خزان زيت الباور مفقود" },
      { category: "زيت الباور", faultName: "غطاء زيت الباور تالف - PS Fluid Cap Damaged", severity: "medium", description: "غطاء خزان زيت الباور تالف" },
      { category: "زيت الباور", faultName: "خزان زيت الباور متشقق - PS Fluid Reservoir Cracked", severity: "high", description: "خزان زيت الباور متشقق" },
      { category: "زيت الباور", faultName: "زيت الباور يرغي - PS Fluid Foamy", severity: "medium", description: "زيت الباور يرغي" },

      // ═══════════════════════════════════════════════════════════════
      // سائل المساحات - Washer Fluid
      // ═══════════════════════════════════════════════════════════════
      { category: "سائل المساحات", faultName: "سائل المساحات فاضي - Washer Fluid Empty", severity: "low", description: "سائل المساحات فارغ" },
      { category: "سائل المساحات", faultName: "سائل المساحات منخفض - Washer Fluid Low", severity: "low", description: "مستوى سائل المساحات منخفض" },
      { category: "سائل المساحات", faultName: "سائل المساحات متوسط - Washer Fluid Medium", severity: "low", description: "مستوى سائل المساحات متوسط" },
      { category: "سائل المساحات", faultName: "سائل المساحات ممتلئ - Washer Fluid Full", severity: "low", description: "سائل المساحات ممتلئ" },
      { category: "سائل المساحات", faultName: "سائل المساحات ملوث - Washer Fluid Contaminated", severity: "low", description: "سائل المساحات ملوث" },
      { category: "سائل المساحات", faultName: "خزان المساحات متشقق - Washer Reservoir Cracked", severity: "medium", description: "خزان سائل المساحات متشقق" },
      { category: "سائل المساحات", faultName: "طرمبة المساحات لا تعمل - Washer Pump Not Working", severity: "medium", description: "طرمبة سائل المساحات لا تعمل" },
      { category: "سائل المساحات", faultName: "بخاخ المساحات مسدود - Washer Nozzle Blocked", severity: "low", description: "بخاخ سائل المساحات مسدود" },
      { category: "سائل المساحات", faultName: "بخاخ المساحات مكسور - Washer Nozzle Broken", severity: "low", description: "بخاخ سائل المساحات مكسور" },
      { category: "سائل المساحات", faultName: "خراطيم المساحات تالفة - Washer Hoses Damaged", severity: "low", description: "خراطيم سائل المساحات تالفة" },

      // ═══════════════════════════════════════════════════════════════
      // سوائل إضافية - Additional Fluids
      // ═══════════════════════════════════════════════════════════════
      { category: "سوائل إضافية", faultName: "سائل الدفرنس منخفض - Diff Fluid Low", severity: "medium", description: "سائل الدفرنس منخفض" },
      { category: "سوائل إضافية", faultName: "سائل الدفرنس قديم - Diff Fluid Old", severity: "medium", description: "سائل الدفرنس قديم" },
      { category: "سوائل إضافية", faultName: "سائل الدفرنس ملوث - Diff Fluid Contaminated", severity: "high", description: "سائل الدفرنس ملوث" },
      { category: "سوائل إضافية", faultName: "تسريب سائل الدفرنس - Diff Fluid Leak", severity: "high", description: "تسريب في سائل الدفرنس" },
      { category: "سوائل إضافية", faultName: "سائل الترانسفير منخفض - Transfer Case Fluid Low", severity: "medium", description: "سائل صندوق التحويل منخفض" },
      { category: "سوائل إضافية", faultName: "سائل الترانسفير قديم - Transfer Case Fluid Old", severity: "medium", description: "سائل صندوق التحويل قديم" },
      { category: "سوائل إضافية", faultName: "تسريب سائل الترانسفير - Transfer Case Fluid Leak", severity: "high", description: "تسريب في سائل صندوق التحويل" },
      { category: "سوائل إضافية", faultName: "سائل التكييف منخفض - AC Refrigerant Low", severity: "medium", description: "سائل التكييف منخفض" },
      { category: "سوائل إضافية", faultName: "سائل التكييف فاضي - AC Refrigerant Empty", severity: "high", description: "سائل التكييف فارغ" },
      { category: "سوائل إضافية", faultName: "تسريب سائل التكييف - AC Refrigerant Leak", severity: "high", description: "تسريب في سائل التكييف" },

      // ═══════════════════════════════════════════════════════════════
      // أعطال المحرك الإضافية - Additional Engine Faults
      // ═══════════════════════════════════════════════════════════════
      { category: "المحرك", faultName: "فلتر الهواء متسخ - Air Filter Dirty", severity: "low", description: "فلتر الهواء متسخ" },
      { category: "المحرك", faultName: "فلتر الهواء مسدود - Air Filter Clogged", severity: "medium", description: "فلتر الهواء مسدود" },
      { category: "المحرك", faultName: "فلتر الزيت قديم - Oil Filter Old", severity: "low", description: "فلتر الزيت قديم" },
      { category: "المحرك", faultName: "فلتر الزيت مسدود - Oil Filter Clogged", severity: "medium", description: "فلتر الزيت مسدود" },
      { category: "المحرك", faultName: "فلتر البنزين متسخ - Fuel Filter Dirty", severity: "medium", description: "فلتر البنزين متسخ" },
      { category: "المحرك", faultName: "فلتر البنزين مسدود - Fuel Filter Clogged", severity: "high", description: "فلتر البنزين مسدود" },
      { category: "المحرك", faultName: "بيلت المحرك متشقق - Engine Belt Cracked", severity: "medium", description: "بيلت المحرك متشقق" },
      { category: "المحرك", faultName: "بيلت المحرك مرتخي - Engine Belt Loose", severity: "medium", description: "بيلت المحرك مرتخي" },
      { category: "المحرك", faultName: "بيلت المحرك يصفر - Engine Belt Squealing", severity: "medium", description: "بيلت المحرك يصفر" },
      { category: "المحرك", faultName: "بيلت التايمنق متآكل - Timing Belt Worn", severity: "high", description: "بيلت التايمنق متآكل" },
      { category: "المحرك", faultName: "بيلت التايمنق يحتاج تغيير - Timing Belt Needs Change", severity: "high", description: "بيلت التايمنق يحتاج تغيير" },
      { category: "المحرك", faultName: "جنزير التايمنق متآكل - Timing Chain Worn", severity: "high", description: "جنزير التايمنق متآكل" },
      { category: "المحرك", faultName: "جنزير التايمنق صوت - Timing Chain Noise", severity: "high", description: "صوت من جنزير التايمنق" },
      { category: "المحرك", faultName: "شمعات الاحتراق تالفة - Spark Plugs Faulty", severity: "medium", description: "شمعات الاحتراق تالفة" },
      { category: "المحرك", faultName: "شمعات الاحتراق قديمة - Spark Plugs Old", severity: "low", description: "شمعات الاحتراق قديمة" },
      { category: "المحرك", faultName: "كويلات الاشتعال تالفة - Ignition Coils Faulty", severity: "medium", description: "كويلات الاشتعال تالفة" },
      { category: "المحرك", faultName: "أسلاك الشمعات تالفة - Spark Plug Wires Faulty", severity: "medium", description: "أسلاك الشمعات تالفة" },
      { category: "المحرك", faultName: "حساس الأكسجين تالف - O2 Sensor Faulty", severity: "medium", description: "حساس الأكسجين تالف" },
      { category: "المحرك", faultName: "حساس الهواء تالف - MAF Sensor Faulty", severity: "medium", description: "حساس كتلة الهواء تالف" },
      { category: "المحرك", faultName: "حساس الحرارة تالف - Temp Sensor Faulty", severity: "medium", description: "حساس الحرارة تالف" },
      { category: "المحرك", faultName: "حساس الضغط تالف - MAP Sensor Faulty", severity: "medium", description: "حساس ضغط المانيفولد تالف" },
      { category: "المحرك", faultName: "حساس الكرنك تالف - Crank Sensor Faulty", severity: "high", description: "حساس الكرنك تالف" },
      { category: "المحرك", faultName: "حساس الكام تالف - Cam Sensor Faulty", severity: "high", description: "حساس الكام تالف" },
      { category: "المحرك", faultName: "ثروتل بودي متسخ - Throttle Body Dirty", severity: "medium", description: "ثروتل بودي متسخ" },
      { category: "المحرك", faultName: "ثروتل بودي تالف - Throttle Body Faulty", severity: "high", description: "ثروتل بودي تالف" },
      { category: "المحرك", faultName: "صمام EGR متسخ - EGR Valve Dirty", severity: "medium", description: "صمام EGR متسخ" },
      { category: "المحرك", faultName: "صمام EGR تالف - EGR Valve Faulty", severity: "medium", description: "صمام EGR تالف" },
      { category: "المحرك", faultName: "صمام PCV تالف - PCV Valve Faulty", severity: "low", description: "صمام PCV تالف" },
      { category: "المحرك", faultName: "بخاخات البنزين متسخة - Fuel Injectors Dirty", severity: "medium", description: "بخاخات البنزين متسخة" },
      { category: "المحرك", faultName: "بخاخات البنزين تالفة - Fuel Injectors Faulty", severity: "high", description: "بخاخات البنزين تالفة" },
      { category: "المحرك", faultName: "طرمبة البنزين ضعيفة - Fuel Pump Weak", severity: "medium", description: "طرمبة البنزين ضعيفة" },
      { category: "المحرك", faultName: "طرمبة البنزين تالفة - Fuel Pump Faulty", severity: "high", description: "طرمبة البنزين تالفة" },
      { category: "المحرك", faultName: "منظم الضغط تالف - Fuel Pressure Regulator Faulty", severity: "medium", description: "منظم ضغط البنزين تالف" },

      // ═══════════════════════════════════════════════════════════════
      // أعطال الكهرباء الإضافية - Additional Electrical Faults
      // ═══════════════════════════════════════════════════════════════
      { category: "النظام الكهربائي", faultName: "فيوز محروق - Blown Fuse", severity: "low", description: "فيوز محروق" },
      { category: "النظام الكهربائي", faultName: "فيوزات متعددة محروقة - Multiple Blown Fuses", severity: "medium", description: "فيوزات متعددة محروقة" },
      { category: "النظام الكهربائي", faultName: "صندوق الفيوزات تالف - Fuse Box Damaged", severity: "medium", description: "صندوق الفيوزات تالف" },
      { category: "النظام الكهربائي", faultName: "ريليه تالف - Faulty Relay", severity: "medium", description: "ريليه تالف" },
      { category: "النظام الكهربائي", faultName: "أسلاك متآكلة - Corroded Wires", severity: "medium", description: "أسلاك كهربائية متآكلة" },
      { category: "النظام الكهربائي", faultName: "أسلاك مقطوعة - Cut Wires", severity: "high", description: "أسلاك كهربائية مقطوعة" },
      { category: "النظام الكهربائي", faultName: "توصيلات سيئة - Poor Connections", severity: "medium", description: "توصيلات كهربائية سيئة" },
      { category: "النظام الكهربائي", faultName: "تأريض سيء - Bad Ground", severity: "medium", description: "تأريض كهربائي سيء" },
      { category: "النظام الكهربائي", faultName: "شورت في الأسلاك - Wire Short Circuit", severity: "high", description: "شورت في الأسلاك الكهربائية" },
      { category: "النظام الكهربائي", faultName: "ضعف في الكهرباء - Weak Electrical System", severity: "medium", description: "ضعف عام في النظام الكهربائي" },
      { category: "النظام الكهربائي", faultName: "استهلاك كهرباء زيادة - Parasitic Draw", severity: "medium", description: "استهلاك كهرباء زيادة عن الطبيعي" },
      { category: "النظام الكهربائي", faultName: "دينمو ضعيف - Weak Alternator", severity: "medium", description: "الدينمو ضعيف" },
      { category: "النظام الكهربائي", faultName: "دينمو لا يشحن - Alternator Not Charging", severity: "high", description: "الدينمو لا يشحن" },
      { category: "النظام الكهربائي", faultName: "بيلت الدينمو متشقق - Alternator Belt Cracked", severity: "medium", description: "بيلت الدينمو متشقق" },
      { category: "النظام الكهربائي", faultName: "بيلت الدينمو مرتخي - Alternator Belt Loose", severity: "medium", description: "بيلت الدينمو مرتخي" },

      // ═══════════════════════════════════════════════════════════════
      // أعطال الفرامل الإضافية - Additional Brake Faults
      // ═══════════════════════════════════════════════════════════════
      { category: "نظام الفرامل", faultName: "تيل الفرامل الأمامي متآكل - Front Brake Pads Worn", severity: "medium", description: "تيل الفرامل الأمامي متآكل" },
      { category: "نظام الفرامل", faultName: "تيل الفرامل الخلفي متآكل - Rear Brake Pads Worn", severity: "medium", description: "تيل الفرامل الخلفي متآكل" },
      { category: "نظام الفرامل", faultName: "تيل الفرامل منتهي - Brake Pads Finished", severity: "high", description: "تيل الفرامل منتهي" },
      { category: "نظام الفرامل", faultName: "هوبات الفرامل الأمامية متآكلة - Front Rotors Worn", severity: "medium", description: "هوبات الفرامل الأمامية متآكلة" },
      { category: "نظام الفرامل", faultName: "هوبات الفرامل الخلفية متآكلة - Rear Rotors Worn", severity: "medium", description: "هوبات الفرامل الخلفية متآكلة" },
      { category: "نظام الفرامل", faultName: "هوبات الفرامل معوجة - Warped Rotors", severity: "medium", description: "هوبات الفرامل معوجة" },
      { category: "نظام الفرامل", faultName: "هوبات الفرامل مخددة - Grooved Rotors", severity: "medium", description: "هوبات الفرامل مخددة" },
      { category: "نظام الفرامل", faultName: "سماكرات الفرامل تالفة - Brake Caliper Faulty", severity: "high", description: "سماكرات الفرامل تالفة" },
      { category: "نظام الفرامل", faultName: "سماكرات الفرامل معلقة - Brake Caliper Stuck", severity: "high", description: "سماكرات الفرامل معلقة" },
      { category: "نظام الفرامل", faultName: "خراطيم الفرامل تالفة - Brake Hoses Damaged", severity: "high", description: "خراطيم الفرامل تالفة" },
      { category: "نظام الفرامل", faultName: "خراطيم الفرامل منتفخة - Brake Hoses Swollen", severity: "high", description: "خراطيم الفرامل منتفخة" },
      { category: "نظام الفرامل", faultName: "ماستر الفرامل تالف - Brake Master Cylinder Faulty", severity: "high", description: "ماستر الفرامل تالف" },
      { category: "نظام الفرامل", faultName: "بوستر الفرامل ضعيف - Brake Booster Weak", severity: "high", description: "بوستر الفرامل ضعيف" },
      { category: "نظام الفرامل", faultName: "بوستر الفرامل تالف - Brake Booster Faulty", severity: "high", description: "بوستر الفرامل تالف" },
      { category: "نظام الفرامل", faultName: "صوت صرير من الفرامل - Brake Squeal", severity: "low", description: "صوت صرير من الفرامل" },
      { category: "نظام الفرامل", faultName: "صوت طقطقة من الفرامل - Brake Click", severity: "medium", description: "صوت طقطقة من الفرامل" },
      { category: "نظام الفرامل", faultName: "اهتزاز عند الفرملة - Vibration When Braking", severity: "medium", description: "اهتزاز عند الفرملة" },
      { category: "نظام الفرامل", faultName: "السيارة تميل عند الفرملة - Car Pulls When Braking", severity: "medium", description: "السيارة تميل عند الفرملة" },
      { category: "نظام الفرامل", faultName: "دواسة الفرامل لينة - Soft Brake Pedal", severity: "high", description: "دواسة الفرامل لينة" },
      { category: "نظام الفرامل", faultName: "دواسة الفرامل صلبة - Hard Brake Pedal", severity: "high", description: "دواسة الفرامل صلبة" },

      // ═══════════════════════════════════════════════════════════════
      // أعطال إضافية للوصول لـ 1400 - Additional Faults to reach 1400
      // ═══════════════════════════════════════════════════════════════
      { category: "ناقل الحركة", faultName: "قير يعلق - Transmission Sticks", severity: "high", description: "القير يعلق" },
      { category: "ناقل الحركة", faultName: "قير يتأخر - Transmission Delay", severity: "medium", description: "تأخر في استجابة القير" },
      { category: "ناقل الحركة", faultName: "قير ينط - Transmission Jerks", severity: "high", description: "القير ينط عند التغيير" },
      { category: "ناقل الحركة", faultName: "قير ينزلق - Transmission Slips", severity: "high", description: "القير ينزلق" },
      { category: "ناقل الحركة", faultName: "صوت من القير - Transmission Noise", severity: "medium", description: "صوت من ناقل الحركة" },
      { category: "ناقل الحركة", faultName: "قير يرفض الدخول - Transmission Won't Engage", severity: "high", description: "القير يرفض الدخول" },
      { category: "ناقل الحركة", faultName: "لمبة القير مضاءة - Trans Warning Light", severity: "high", description: "لمبة تحذير القير مضاءة" },
      { category: "نظام التعليق", faultName: "مساعد أمامي يمين ضعيف - FR Shock Weak", severity: "medium", description: "المساعد الأمامي الأيمن ضعيف" },
      { category: "نظام التعليق", faultName: "مساعد أمامي يسار ضعيف - FL Shock Weak", severity: "medium", description: "المساعد الأمامي الأيسر ضعيف" },
      { category: "نظام التعليق", faultName: "مساعد خلفي يمين ضعيف - RR Shock Weak", severity: "medium", description: "المساعد الخلفي الأيمن ضعيف" },
      { category: "نظام التعليق", faultName: "مساعد خلفي يسار ضعيف - RL Shock Weak", severity: "medium", description: "المساعد الخلفي الأيسر ضعيف" },
      { category: "نظام التعليق", faultName: "مساعد يسرب زيت - Shock Leaking", severity: "high", description: "المساعد يسرب زيت" },
      { category: "نظام التعليق", faultName: "ياي أمامي مكسور - Front Spring Broken", severity: "high", description: "الياي الأمامي مكسور" },
      { category: "نظام التعليق", faultName: "ياي خلفي مكسور - Rear Spring Broken", severity: "high", description: "الياي الخلفي مكسور" },
      { category: "نظام التعليق", faultName: "ياي ضعيف - Spring Weak", severity: "medium", description: "الياي ضعيف" },
      { category: "نظام التعليق", faultName: "طقم بلي العجل تالف - Wheel Bearing Faulty", severity: "high", description: "طقم بلي العجل تالف" },
      { category: "نظام التعليق", faultName: "صوت من بلي العجل - Wheel Bearing Noise", severity: "medium", description: "صوت من بلي العجل" },
      { category: "نظام التعليق", faultName: "مقص أمامي تالف - Front Control Arm Faulty", severity: "high", description: "المقص الأمامي تالف" },
      { category: "نظام التعليق", faultName: "مقص خلفي تالف - Rear Control Arm Faulty", severity: "high", description: "المقص الخلفي تالف" },
      { category: "نظام التعليق", faultName: "بوش المقص تالف - Control Arm Bushing Worn", severity: "medium", description: "بوش المقص تالف" },
      { category: "نظام التعليق", faultName: "كرة التعليق تالفة - Ball Joint Worn", severity: "high", description: "كرة التعليق تالفة" },
      { category: "نظام التعليق", faultName: "وصلة المكينة تالفة - Engine Mount Faulty", severity: "medium", description: "وصلة المحرك تالفة" },
      { category: "نظام التعليق", faultName: "وصلة القير تالفة - Trans Mount Faulty", severity: "medium", description: "وصلة ناقل الحركة تالفة" },
      { category: "الإطارات والجنوط", faultName: "إطار أمامي يمين بالون - FR Tire Bald", severity: "high", description: "الإطار الأمامي الأيمن بالون" },
      { category: "الإطارات والجنوط", faultName: "إطار أمامي يسار بالون - FL Tire Bald", severity: "high", description: "الإطار الأمامي الأيسر بالون" },
      { category: "الإطارات والجنوط", faultName: "إطار خلفي يمين بالون - RR Tire Bald", severity: "high", description: "الإطار الخلفي الأيمن بالون" },
      { category: "الإطارات والجنوط", faultName: "إطار خلفي يسار بالون - RL Tire Bald", severity: "high", description: "الإطار الخلفي الأيسر بالون" },
      { category: "الإطارات والجنوط", faultName: "إطار متشقق - Tire Cracked", severity: "high", description: "الإطار متشقق" },
      { category: "الإطارات والجنوط", faultName: "إطار منتفخ - Tire Bulge", severity: "high", description: "انتفاخ في الإطار" },
      { category: "الإطارات والجنوط", faultName: "إطار مرقع - Tire Patched", severity: "low", description: "الإطار مرقع" },
      { category: "الإطارات والجنوط", faultName: "إطار مختلف المقاس - Tire Size Mismatch", severity: "medium", description: "إطار مختلف المقاس" },
      { category: "الإطارات والجنوط", faultName: "جنط معوج - Bent Wheel", severity: "medium", description: "الجنط معوج" },
      { category: "الإطارات والجنوط", faultName: "جنط متآكل - Corroded Wheel", severity: "low", description: "الجنط متآكل" },
      { category: "الإطارات والجنوط", faultName: "جنط مخدوش - Scratched Wheel", severity: "low", description: "الجنط مخدوش" },
      { category: "الإطارات والجنوط", faultName: "غطاء الجنط مفقود - Wheel Cap Missing", severity: "low", description: "غطاء الجنط مفقود" },
      { category: "الإطارات والجنوط", faultName: "صامولة العجل مفقودة - Lug Nut Missing", severity: "high", description: "صامولة العجل مفقودة" },
      { category: "الإطارات والجنوط", faultName: "صامولة العجل مرتخية - Lug Nut Loose", severity: "high", description: "صامولة العجل مرتخية" },
      { category: "نظام التكييف", faultName: "كمبروسر التكييف ضعيف - AC Compressor Weak", severity: "medium", description: "كمبروسر التكييف ضعيف" },
      { category: "نظام التكييف", faultName: "كمبروسر التكييف تالف - AC Compressor Faulty", severity: "high", description: "كمبروسر التكييف تالف" },
      { category: "نظام التكييف", faultName: "كلتش الكمبروسر لا يعمل - AC Clutch Not Engaging", severity: "high", description: "كلتش كمبروسر التكييف لا يعمل" },
      { category: "نظام التكييف", faultName: "مبخر التكييف متسخ - AC Evaporator Dirty", severity: "medium", description: "مبخر التكييف متسخ" },
      { category: "نظام التكييف", faultName: "مكثف التكييف متسخ - AC Condenser Dirty", severity: "medium", description: "مكثف التكييف متسخ" },
      { category: "نظام التكييف", faultName: "مكثف التكييف تالف - AC Condenser Damaged", severity: "high", description: "مكثف التكييف تالف" },
      { category: "نظام التكييف", faultName: "فلتر المكيف متسخ - Cabin Filter Dirty", severity: "low", description: "فلتر المكيف متسخ" },
      { category: "نظام التكييف", faultName: "فلتر المكيف مسدود - Cabin Filter Clogged", severity: "medium", description: "فلتر المكيف مسدود" },
      { category: "نظام التكييف", faultName: "مروحة التكييف لا تعمل - AC Fan Not Working", severity: "high", description: "مروحة التكييف لا تعمل" },
      { category: "نظام التكييف", faultName: "ريليه المكيف تالف - AC Relay Faulty", severity: "medium", description: "ريليه المكيف تالف" },
    ];

    // Add faults from the new comprehensive database
    const newFaults = FAULT_DATABASE.map(f => ({
      category: f.category,
      faultName: f.faultName,
      severity: f.severity,
      description: f.description || f.faultNameEn,
    }));
    
    // Combine old faults with new ones
    const allFaults = [...faults, ...newFaults];
    
    // Insert in batches to avoid hitting limits
    const batchSize = 500;
    for (let i = 0; i < allFaults.length; i += batchSize) {
      const batch = allFaults.slice(i, i + batchSize);
      await db.insert(faultLibrary).values(batch);
    }
    console.log(`Seeded ${allFaults.length} faults to library (${faults.length} original + ${newFaults.length} new)`);
  }
  
  seedFaultLibrary().catch(console.error);

  return httpServer;
}
