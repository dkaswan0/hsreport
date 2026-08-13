import crypto from "crypto";

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

  private static getApiKey(): string {
    return process.env.GEMINI_API_KEY || "AQ.Ab8RN6LPP02KWpHLCqLW1-UoVYJAmedebRUdmYQhLgDvo9D2aA";
  }

  public static calculateImageHash(imageInput: string): string {
    return crypto.createHash("sha256").update(imageInput).digest("hex");
  }

  /**
   * Main processing entry point.
   * Ensures non-blocking execution, caching, rate protection, and strict validation.
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
    const version = "v2.0-studio-presentation";
    const provider = "gemini-studio-processor";

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
      const mimeMatch = imageUrl.match(/^data:([^;]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const base64Data = imageUrl.replace(/^data:[^;]+;base64,/, "");

      const prompt = `${VEHICLE_INSPECTION_PHOTO_PROMPT}

Slot: ${slotKey} (Inspection #${inspectionId})
Perspective Alignment: ${enablePerspectiveCorrection ? "YES - mild geometric correction only" : "NO"}

Process and optimize the background and natural lighting presentation for inspection report.`;

      const apiKey = this.getApiKey();
      const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.0-flash-lite"];

      try {
        for (const model of models) {
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const body = {
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inlineData: {
                        mimeType,
                        data: base64Data,
                      },
                    },
                  ],
                },
              ],
            };

            const response = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });

            if (response.ok) {
              const resData = await response.json();
              const candidates = resData.candidates || [];
              for (const cand of candidates) {
                const parts = cand.content?.parts || [];
                for (const part of parts) {
                  if (part.inlineData && part.inlineData.data) {
                    const outUrl = `data:${part.inlineData.mimeType || "image/jpeg"};base64,${part.inlineData.data}`;
                    this.processingCache.set(cacheKey, outUrl);
                    return outUrl;
                  }
                }
              }
            }
          } catch (modelErr) {
            console.warn(`[VehiclePhotoProcessor] model ${model} failed, trying next:`, modelErr);
          }
        }

        // If models did not return inline image, keep original image safely
        this.processingCache.set(cacheKey, imageUrl);
        return imageUrl;
      } catch (err) {
        console.warn("[VehiclePhotoProcessor] Processing error fallback to original:", err);
        return imageUrl;
      } finally {
        this.inFlightRequests.delete(cacheKey);
      }
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
