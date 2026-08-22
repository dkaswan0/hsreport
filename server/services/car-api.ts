// CarAPI Service Integration for VIN Decoding & Vehicle Specifications Backup
// Provider: https://carapi.app

export interface CarApiDecodeResult {
  success: boolean;
  make?: string;
  model?: string;
  year?: number;
  trim?: string;
  raw?: any;
}

export class CarApiService {
  private static jwtToken: string | null = null;
  private static tokenExpiresAt: number = 0;

  /**
   * Login to CarAPI and retrieve JWT Bearer token
   */
  private static async getJwtToken(): Promise<string | null> {
    const now = Date.now();
    // Return cached token if valid
    if (this.jwtToken && now < this.tokenExpiresAt) {
      return this.jwtToken;
    }

    const apiToken = process.env.CAR_API_TOKEN;
    const apiSecret = process.env.CAR_API_SECRET;
    if (!apiToken || !apiSecret) {
      return null;
    }

    try {
      const response = await fetch("https://carapi.app/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          api_token: apiToken,
          api_secret: apiSecret,
        }),
      });

      if (!response.ok) {
        console.warn(`CarAPI Login failed with status: ${response.status}`);
        return null;
      }

      const rawJwt = await response.text();
      const cleanJwt = rawJwt.replace(/^"|"$/g, "").trim();

      if (!cleanJwt) {
        console.warn("CarAPI returned empty JWT token");
        return null;
      }

      this.jwtToken = cleanJwt;
      this.tokenExpiresAt = now + 120 * 60 * 1000; // Cache token for 2 hours
      console.log("CarAPI JWT token retrieved and cached successfully");
      return cleanJwt;
    } catch (err: any) {
      console.error("CarAPI Authentication Error:", err?.message || err);
      return null;
    }
  }

  /**
   * Decode VIN using CarAPI
   */
  public static async decodeVin(vin: string): Promise<CarApiDecodeResult> {
    if (!vin || vin.length !== 17) {
      return { success: false };
    }

    const normalizedVin = vin.toUpperCase()
      .replace(/O/g, "0")
      .replace(/I/g, "1")
      .replace(/Q/g, "0");

    try {
      const jwt = await this.getJwtToken();
      if (!jwt) {
        return { success: false };
      }

      const response = await fetch(`https://carapi.app/api/vin/${normalizedVin}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.warn(`CarAPI VIN decode returned status: ${response.status}`);
        return { success: false };
      }

      const data = await response.json();
      const specs = data?.specs || {};
      const trims = data?.trims || [];
      const firstTrim = trims[0]?.make_model;

      const make = specs.make || firstTrim?.make?.name || "";
      const model = specs.model || firstTrim?.name || "";
      const yearStr = specs.year || trims[0]?.year;
      const year = yearStr ? parseInt(String(yearStr), 10) : undefined;
      const trim = specs.trim || trims[0]?.name || "";

      if (make || model) {
        console.log(`CarAPI successfully decoded VIN ${normalizedVin}: ${make} ${model} ${year || ''}`);
        return {
          success: true,
          make,
          model,
          year,
          trim,
          raw: data,
        };
      }

      return { success: false };
    } catch (err: any) {
      console.error("CarAPI VIN Decoding Error:", err?.message || err);
      return { success: false };
    }
  }
}
