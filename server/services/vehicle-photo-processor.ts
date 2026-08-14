import crypto from "crypto";
import { execFile } from "child_process";
import path from "path";
import fs from "fs/promises";
import os from "os";

export const VEHICLE_INSPECTION_PHOTO_PROMPT = `This is a vehicle inspection evidence image.

The uploaded image(s) are the permanent source of truth for the vehicle.

Create professional studio-style camera views of the SAME vehicle.

Generate new camera views, NOT a new vehicle.

Preserve the exact vehicle identity, model, trim, body design, color, wheels, tires, lights, mirrors, windows, handles, badges, proportions, geometry, and all visible details.

Preserve the actual condition of the vehicle.

Do NOT repair, beautify, clean, reshape, recolor, replace, remove, add, or modify any vehicle component.

Do NOT remove or hide scratches, dents, cracks, accident damage, paint differences, or any visible defect.

Do NOT replace the vehicle with a similar vehicle.

Do NOT invent a different vehicle design.

Use the uploaded image(s) as the highest-priority reference.

The purpose is to create professional photographic views of the same vehicle as if it had been photographed inside a white automotive studio.

Allowed presentation changes:
- Pure solid white studio background (#FFFFFF).
- Natural studio lighting and exposure balancing.
- Multi-layer ground contact shadows beneath tires and chassis.
- Professional framing and composition.

Vehicle condition and visible damage have higher priority than visual beautification.

Original Image = Permanent Inspection Evidence.
Processed Images = Optional Presentation Views.`;

export class VehiclePhotoProcessor {
  private static processingCache = new Map<string, string>();

  private static getPythonCmd(): string {
    if (process.env.PYTHON_BIN) return process.env.PYTHON_BIN;
    if (process.platform === "win32") {
      return "python";
    }
    return "python3";
  }

  public static calculateImageHash(imageInput: string): string {
    return crypto.createHash("sha256").update(imageInput).digest("hex");
  }

  /**
   * Process a single vehicle photo using the real AI vehicle segmentation and studio backdrop engine.
   * Isolates the exact vehicle down to pixels, placing it on pure #FFFFFF white studio with contact shadows.
   * Preserves 100% of the vehicle body and damage evidence.
   */
  public static async processVehiclePhoto(params: {
    imageUrl: string;
    slotKey: string;
    inspectionId: number;
    enablePerspectiveCorrection?: boolean;
  }): Promise<{
    success: boolean;
    processedUrl: string;
    imageHash: string;
    provider: string;
    version: string;
    appliedPerspectiveCorrection: boolean;
    error?: string;
  }> {
    const { imageUrl, slotKey, inspectionId, enablePerspectiveCorrection = false } = params;
    const version = "v4.0-ai-studio";
    const provider = "ai-u2net-studio-processor";

    if (!imageUrl || typeof imageUrl !== "string") {
      return {
        success: false,
        processedUrl: "",
        imageHash: "",
        provider: "bypass",
        version,
        appliedPerspectiveCorrection: false,
        error: "الصورة غير متوفرة للمعالجة",
      };
    }

    const imageHash = this.calculateImageHash(imageUrl);
    const cacheKey = `${imageHash}_${slotKey}`;

    if (this.processingCache.has(cacheKey)) {
      return {
        success: true,
        processedUrl: this.processingCache.get(cacheKey)!,
        imageHash,
        provider,
        version,
        appliedPerspectiveCorrection: enablePerspectiveCorrection,
      };
    }

    const tmpDir = os.tmpdir();
    const randId = Math.random().toString(36).substring(2, 9);
    const inFilePath = path.join(tmpDir, `hs_in_${Date.now()}_${randId}.json`);
    const outFilePath = path.join(tmpDir, `hs_out_${Date.now()}_${randId}.json`);
    const uploadsDir = path.join(process.cwd(), "public", "uploads");

    try {
      await fs.mkdir(uploadsDir, { recursive: true }).catch(() => {});
      await fs.writeFile(
        inFilePath,
        JSON.stringify({
          mode: "single",
          imageUrl,
          slotKey,
          uploadsDir,
          enablePerspective: enablePerspectiveCorrection,
        }),
        "utf-8"
      );

      const scriptPath = path.join(process.cwd(), "server", "services", "studio_enhancer.py");
      const pyBin = this.getPythonCmd();

      await new Promise<void>((resolve, reject) => {
        execFile(pyBin, [scriptPath, inFilePath, outFilePath], { timeout: 35000 }, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      const outContent = await fs.readFile(outFilePath, "utf-8");
      const res = JSON.parse(outContent.trim());

      if (res.success && res.processedUrl) {
        this.processingCache.set(cacheKey, res.processedUrl);
        return {
          success: true,
          processedUrl: res.processedUrl,
          imageHash,
          provider,
          version,
          appliedPerspectiveCorrection: enablePerspectiveCorrection,
        };
      }

      return {
        success: false,
        processedUrl: imageUrl,
        imageHash,
        provider,
        version,
        appliedPerspectiveCorrection: enablePerspectiveCorrection,
        error: res.error || "فشلت المعالجة بالذكاء الاصطناعي",
      };
    } catch (err: any) {
      console.error("[VehiclePhotoProcessor] Single photo process error:", err);
      return {
        success: false,
        processedUrl: imageUrl,
        imageHash,
        provider,
        version,
        appliedPerspectiveCorrection: enablePerspectiveCorrection,
        error: err?.message || "حدث خطأ أثناء معالجة صورة السيارة",
      };
    } finally {
      await fs.unlink(inFilePath).catch(() => {});
      await fs.unlink(outFilePath).catch(() => {});
    }
  }

  /**
   * Generates a synchronized Professional Vehicle Photo Sheet across all uploaded slots
   * with real AI foreground segmentation and pure white studio backdrops.
   */
  public static async processVehiclePhotoSheet(params: {
    inspectionId: number;
    images: Record<string, string>;
  }): Promise<{
    success: boolean;
    sheet: Record<string, string>;
    provider: string;
    version: string;
    error?: string;
  }> {
    const { images } = params;
    const version = "v4.0-ai-studio";
    const provider = "ai-u2net-studio-processor";

    if (!images || Object.keys(images).length === 0) {
      return { success: false, sheet: {}, provider, version, error: "لا توجد صور متاحة للمعالجة" };
    }

    const tmpDir = os.tmpdir();
    const randId = Math.random().toString(36).substring(2, 9);
    const inFilePath = path.join(tmpDir, `hs_sheet_in_${Date.now()}_${randId}.json`);
    const outFilePath = path.join(tmpDir, `hs_sheet_out_${Date.now()}_${randId}.json`);
    const uploadsDir = path.join(process.cwd(), "public", "uploads");

    try {
      await fs.mkdir(uploadsDir, { recursive: true }).catch(() => {});
      await fs.writeFile(
        inFilePath,
        JSON.stringify({
          mode: "sheet",
          images,
          uploadsDir,
        }),
        "utf-8"
      );

      const scriptPath = path.join(process.cwd(), "server", "services", "studio_enhancer.py");
      const pyBin = this.getPythonCmd();

      await new Promise<void>((resolve, reject) => {
        execFile(pyBin, [scriptPath, inFilePath, outFilePath], { timeout: 60000 }, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      const outContent = await fs.readFile(outFilePath, "utf-8");
      const res = JSON.parse(outContent.trim());

      if (res.success && res.sheet && Object.keys(res.sheet).length > 0) {
        return {
          success: true,
          sheet: res.sheet,
          provider,
          version,
        };
      }

      return {
        success: false,
        sheet: images,
        provider,
        version,
        error: res.error || "فشل توليد طقم صور الاستوديو",
      };
    } catch (err: any) {
      console.error("[VehiclePhotoProcessor] Photo sheet error:", err);
      return {
        success: false,
        sheet: images,
        provider,
        version,
        error: err?.message || "حدث خطأ أثناء معالجة طقم صور المركبة",
      };
    } finally {
      await fs.unlink(inFilePath).catch(() => {});
      await fs.unlink(outFilePath).catch(() => {});
    }
  }
}
