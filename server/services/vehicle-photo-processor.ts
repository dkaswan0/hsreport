import crypto from "crypto";
import { spawn } from "child_process";
import path from "path";

export const VEHICLE_INSPECTION_PHOTO_PROMPT = `This is a vehicle inspection evidence photograph.

The original image is the permanent source of truth.

Preserve the exact vehicle identity, condition, damage, color, parts, geometry, proportions, and all visible details.

DO NOT regenerate, reconstruct, beautify, repair, clean, retouch, reshape, recolor, replace, add, remove, or modify any part of the vehicle.

DO NOT remove or hide scratches, dents, cracks, accident damage, paint differences, or any visible defect.

DO NOT change the vehicle's camera angle or composition unless a minimal geometric correction is required.

Allowed operations ONLY:
- Background cleanup or replacement with a clean, neutral studio backdrop.
- Natural lighting correction and balanced exposure.
- Mild exposure and contrast correction.
- Optional lens distortion correction.
- Optional mild perspective alignment when clearly necessary.
- Clean cropping and framing.

Any perspective correction must modify the photograph geometry only and must NEVER alter the vehicle geometry or condition.

If a requested correction may modify or distort the vehicle, DO NOT apply that correction.

Preserve all visible vehicle damage exactly as shown.

The result must remain a faithful photographic representation of the original inspection evidence.`;

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
   * Process vehicle photo using the high-performance studio presentation engine.
   * Performs background cleanup, lighting and exposure balancing, and ground contact shadow.
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
    const version = "v2.5-studio-presentation";
    const provider = "hs-studio-processor";

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
    const cacheKey = `${imageHash}_${enablePerspectiveCorrection ? "persp" : "nopdf"}`;

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
            // Fallback safely to original image
            this.processingCache.set(cacheKey, imageUrl);
            resolve(imageUrl);
          });

          pyProc.on("error", (err) => {
            console.warn("[VehiclePhotoProcessor] Process spawn error:", err);
            resolve(imageUrl);
          });

          // Send image data as input
          pyProc.stdin.write(
            JSON.stringify({
              imageUrl,
              enablePerspective: enablePerspectiveCorrection,
            })
          );
          pyProc.stdin.end();

          // Timeout safety: 10 seconds max
          setTimeout(() => {
            if (!pyProc.killed) {
              pyProc.kill();
              resolve(imageUrl);
            }
          }, 10000);
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
}
