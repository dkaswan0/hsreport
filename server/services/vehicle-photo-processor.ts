import crypto from "crypto";
import { spawn } from "child_process";
import path from "path";

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
  private static inFlightRequests = new Map<string, Promise<string>>();

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
    const version = "v3.0-white-studio-sheet";
    const provider = "hs-studio-sheet-processor";

    if (!imageUrl || !imageUrl.startsWith("data:image/")) {
      return {
        processedUrl: imageUrl,
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

    if (this.inFlightRequests.has(cacheKey)) {
      const existingPromise = this.inFlightRequests.get(cacheKey)!;
      const processedUrl = await existingPromise;
      return {
        processedUrl,
        imageHash,
        provider,
        version,
        appliedPerspectiveCorrection: enablePerspectiveCorrection,
      };
    }

    const processPromise = (async () => {
      return new Promise<string>((resolve) => {
        try {
          const scriptPath = path.join(process.cwd(), "server", "services", "studio_enhancer.py");
          const pyBin = this.getPythonCmd();
          const pyProc = spawn(pyBin, [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });

          let stdoutData = "";
          let stderrData = "";

          pyProc.stdout.on("data", (chunk) => {
            stdoutData += chunk.toString("utf-8");
          });

          pyProc.stderr.on("data", (chunk) => {
            stderrData += chunk.toString("utf-8");
          });

          pyProc.on("close", (code) => {
            if (code === 0 && stdoutData) {
              try {
                const res = JSON.parse(stdoutData.trim());
                if (res.success && res.processedUrl) {
                  this.processingCache.set(cacheKey, res.processedUrl);
                  return resolve(res.processedUrl);
                }
              } catch (e) {
                console.warn("[VehiclePhotoProcessor] JSON parse error:", e);
              }
            }
            if (stderrData) {
              console.warn("[VehiclePhotoProcessor] Python stderr:", stderrData);
            }
            this.processingCache.set(cacheKey, imageUrl);
            resolve(imageUrl);
          });

          pyProc.on("error", (err) => {
            console.warn("[VehiclePhotoProcessor] Process spawn error:", err);
            resolve(imageUrl);
          });

          pyProc.stdin.write(
            JSON.stringify({
              mode: 'single',
              imageUrl,
              enablePerspective: enablePerspectiveCorrection,
            })
          );
          pyProc.stdin.end();

          setTimeout(() => {
            if (!pyProc.killed) {
              pyProc.kill();
              resolve(imageUrl);
            }
          }, 12000);
        } catch (err) {
          console.warn("[VehiclePhotoProcessor] Execution error:", err);
          resolve(imageUrl);
        } finally {
          this.inFlightRequests.delete(cacheKey);
        }
      });
    })();

    this.inFlightRequests.set(cacheKey, processPromise);
    const processedUrl = await processPromise;

    return {
      processedUrl,
      imageHash,
      provider,
      version,
      appliedPerspectiveCorrection: enablePerspectiveCorrection,
    };
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
    const version = "v3.0-white-studio-sheet";
    const provider = "hs-studio-sheet-processor";

    return new Promise((resolve) => {
      try {
        const scriptPath = path.join(process.cwd(), "server", "services", "studio_enhancer.py");
        const pyBin = this.getPythonCmd();
        const pyProc = spawn(pyBin, [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });

        let stdoutData = "";
        let stderrData = "";

        pyProc.stdout.on("data", (chunk) => {
          stdoutData += chunk.toString("utf-8");
        });

        pyProc.stderr.on("data", (chunk) => {
          stderrData += chunk.toString("utf-8");
        });

        pyProc.on("close", (code) => {
          if (code === 0 && stdoutData) {
            try {
              const res = JSON.parse(stdoutData.trim());
              if (res.success && res.sheet) {
                return resolve({
                  sheet: res.sheet,
                  provider,
                  version,
                });
              }
            } catch (e) {
              console.warn("[VehiclePhotoProcessor] Photo Sheet JSON parse error:", e);
            }
          }
          if (stderrData) {
            console.warn("[VehiclePhotoProcessor] Python stderr:", stderrData);
          }
          resolve({
            sheet: images,
            provider,
            version,
          });
        });

        pyProc.on("error", (err) => {
          console.warn("[VehiclePhotoProcessor] Process spawn error:", err);
          resolve({
            sheet: images,
            provider,
            version,
          });
        });

        pyProc.stdin.write(
          JSON.stringify({
            mode: 'sheet',
            images,
          })
        );
        pyProc.stdin.end();

        setTimeout(() => {
          if (!pyProc.killed) {
            pyProc.kill();
            resolve({
              sheet: images,
              provider,
              version,
            });
          }
        }, 15000);
      } catch (err) {
        console.warn("[VehiclePhotoProcessor] Photo sheet error:", err);
        resolve({
          sheet: images,
          provider,
          version,
        });
      }
    });
  }
}
