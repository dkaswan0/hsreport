// ==============================================================================
// High Safety International - Car Images & Studio Vehicle Render Service
// Integration with CarImagesAPI / Imagin Automotive Imagery CDN
// ==============================================================================

export interface StudioCarImageResult {
  success: boolean;
  imageUrl?: string;
  thumbnailUrl?: string;
  source: 'carimagesapi' | 'automotive-cdn' | 'dealer-stock';
  angle?: 'front34' | 'side' | 'rear34';
}

export class CarImagesService {
  private static readonly API_KEY = process.env.CAR_IMAGES_API_KEY || "ci_7dfc9e4e63b36ad66fdf58f0b451f1a1527591f2542380a044322d38";
  private static readonly API_SECRET = process.env.CAR_IMAGES_API_SECRET || "7e22a50a1545db05c6dd1939825bbb21737200a3af56a4821f70408f3f618aad";

  /**
   * Generates or fetches high-resolution studio vehicle photo
   */
  public static async getStudioImage(params: {
    make?: string;
    model?: string;
    year?: number | string;
    color?: string;
    angle?: 'front34' | 'side' | 'rear34';
  }): Promise<StudioCarImageResult> {
    const { make, model, year, color, angle = 'front34' } = params;

    if (!make || !model) {
      return { success: false, source: 'dealer-stock' };
    }

    const cleanMake = make.trim().toLowerCase();
    const cleanModel = model.trim().toLowerCase();
    const cleanYear = year ? String(year).trim() : new Date().getFullYear().toString();

    // 1. Try CarImagesAPI REST service
    try {
      const apiUrl = `https://carimagesapi.com/api/v1/cars/images?make=${encodeURIComponent(cleanMake)}&model=${encodeURIComponent(cleanModel)}&year=${encodeURIComponent(cleanYear)}`;
      const res = await fetch(apiUrl, {
        headers: {
          "Authorization": `Bearer ${this.API_KEY}`,
          "X-API-KEY": this.API_KEY,
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        const data = await res.json();
        const foundUrl = data?.image_url || data?.url || data?.images?.[0]?.url;
        if (foundUrl) {
          return {
            success: true,
            imageUrl: foundUrl,
            thumbnailUrl: foundUrl,
            source: 'carimagesapi',
            angle,
          };
        }
      }
    } catch {
      // Fallback to high-speed automotive CDN render engine
    }

    // 2. High-speed Automotive CDN Fallback Engine (Imagin Studio / Dealer Stock 4K Transparent Cutouts)
    try {
      const angleCode = angle === 'side' ? 'side' : angle === 'rear34' ? '29' : '01';
      const cdnUrl = `https://cdn.imagin.studio/getimage?customer=img&make=${encodeURIComponent(cleanMake)}&modelFamily=${encodeURIComponent(cleanModel)}&modelYear=${encodeURIComponent(cleanYear)}&angle=${angleCode}&width=1200&zoomType=fullscreen`;

      return {
        success: true,
        imageUrl: cdnUrl,
        thumbnailUrl: cdnUrl,
        source: 'automotive-cdn',
        angle,
      };
    } catch {
      return { success: false, source: 'dealer-stock' };
    }
  }
}
