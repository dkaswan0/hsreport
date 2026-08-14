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
- White studio background.
- Natural studio lighting.
- Natural shadows.
- Professional framing.
- Professional camera composition.
- Mild lens correction.
- Mild perspective correction.
- Professional cropping.

For additional camera angles, preserve the vehicle's identity and geometry as accurately as possible.

Never use a generated detail to contradict a clearly visible detail in the original image.

If a vehicle detail cannot be reliably determined from the source image(s), do not invent or modify it.

Vehicle condition and visible damage have higher priority than visual beautification.

The output must remain a faithful representation of the same inspected vehicle.

Original Image = Permanent Inspection Evidence.
Processed Images = Optional Presentation Views.`;

export class VehiclePhotoProcessor {
  private static processingCache = new Map<string, string>();

  private static getPythonCmd(): string {
    return process.env.PYTHON_BIN || (process.platform === 'win32' ? 'C:\\Users\\1medo\\AppData\\Local\\Python\\pythoncore-3.14-64\\python.exe' : 'python3');
  }

  public static calculateImageHash(imageInput: string): string {
    return crypto.createHash("sha256").update(imageInput).digest("hex");
  }

  /**
   * Process a single vehicle photo using the high-performance studio presentation engine.
   * Performs white background cleanup, lighting and exposure balancing, and ground contact shadow.
   * 100% zero-alteration of vehicle body and damage evidence.
   */
  public static async processVehiclePhoto(params: {
    imageUrl: string;
    slotKey: string;
    inspectionId: number;
    enablePerspectiveCorrection?: boolean;
  }): Promise<{
    processedUrl: string;
    imageHash: string;
    provider: string;
    version: string;
    appliedPerspectiveCorrection: boolean;
  }> {
    const { imageUrl, slotKey, inspectionId, enablePerspectiveCorrection = false } = params;
    const version = "v3.1-white-studio";
    const provider = "hs-studio-processor";

    if (!imageUrl || typeof imageUrl !== "string") {
      return {
        processedUrl: imageUrl || "",
        imageHash: this.calculateImageHash(imageUrl || ""),
        provider: "bypass",
        version,
        appliedPerspectiveCorrection: false,
      };
    }

    const imageHash = this.calculateImageHash(imageUrl);
    const cacheKey = `${imageHash}_${slotKey}`;

    if (this.processingCache.has(cacheKey)) {
      return {
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

    try {
      await fs.writeFile(
        inFilePath,
        JSON.stringify({
          mode: "single",
          imageUrl,
          enablePerspective: enablePerspectiveCorrection,
        }),
        "utf-8"
      );

      const scriptPath = path.join(process.cwd(), "server", "services", "studio_enhancer.py");
      const pyBin = this.getPythonCmd();

      await new Promise<void>((resolve, reject) => {
        execFile(pyBin, [scriptPath, inFilePath, outFilePath], { timeout: 15000 }, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      const outContent = await fs.readFile(outFilePath, "utf-8");
      const res = JSON.parse(outContent.trim());

      if (res.success && res.processedUrl) {
        this.processingCache.set(cacheKey, res.processedUrl);
        return {
          processedUrl: res.processedUrl,
          imageHash,
          provider,
          version,
          appliedPerspectiveCorrection: enablePerspectiveCorrection,
        };
      }

      return {
        processedUrl: imageUrl,
        imageHash,
        provider,
        version,
        appliedPerspectiveCorrection: enablePerspectiveCorrection,
      };
    } catch (err) {
      console.warn("[VehiclePhotoProcessor] Single photo process warning:", err);
      return {
        processedUrl: imageUrl,
        imageHash,
        provider,
        version,
        appliedPerspectiveCorrection: enablePerspectiveCorrection,
      };
    } finally {
      await fs.unlink(inFilePath).catch(() => {});
      await fs.unlink(outFilePath).catch(() => {});
    }
  }

  /**
   * Generates a synchronized Professional Vehicle Photo Sheet across all available slots
   * using multi-image reference consistency.
   */
  public static async processVehiclePhotoSheet(params: {
    inspectionId: number;
    images: Record<string, string>;
  }): Promise<{
    sheet: Record<string, string>;
    provider: string;
    version: string;
  }> {
    const { images } = params;
    const version = "v3.1-white-studio";
    const provider = "hs-studio-processor";

    if (!images || Object.keys(images).length === 0) {
      return { sheet: {}, provider, version };
    }

    const tmpDir = os.tmpdir();
    const randId = Math.random().toString(36).substring(2, 9);
    const inFilePath = path.join(tmpDir, `hs_sheet_in_${Date.now()}_${randId}.json`);
    const outFilePath = path.join(tmpDir, `hs_sheet_out_${Date.now()}_${randId}.json`);

    try {
      await fs.writeFile(
        inFilePath,
        JSON.stringify({
          mode: "sheet",
          images,
        }),
        "utf-8"
      );

      const scriptPath = path.join(process.cwd(), "server", "services", "studio_enhancer.py");
      const pyBin = this.getPythonCmd();

      await new Promise<void>((resolve, reject) => {
        execFile(pyBin, [scriptPath, inFilePath, outFilePath], { timeout: 30000 }, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      const outContent = await fs.readFile(outFilePath, "utf-8");
      const res = JSON.parse(outContent.trim());

      if (res.success && res.sheet) {
        return {
          sheet: res.sheet,
          provider,
          version,
        };
      }

      return {
        sheet: images,
        provider,
        version,
      };
    } catch (err) {
      console.warn("[VehiclePhotoProcessor] Photo sheet warning:", err);
      return {
        sheet: images,
        provider,
        version,
      };
    } finally {
      await fs.unlink(inFilePath).catch(() => {});
      await fs.unlink(outFilePath).catch(() => {});
    }
  }
}
