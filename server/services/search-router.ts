export interface SearchResultItem {
  title: string;
  url: string;
  domain: string;
  content: string;
  info_context?: string;
}

export interface SearchRouterResponse {
  success: boolean;
  search_type: string;
  credits_remaining: number | null;
  results: SearchResultItem[];
}

export class SearchRouterService {
  private static getApiKey(): string {
    return process.env.SEARCH_ROUTER_API_KEY || "sr_0781cc375fdec5fe58de248c416bdbca04b9c8618eaa8e41";
  }

  public static async search(query: string, limit = 5): Promise<SearchResultItem[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.warn("SEARCH_ROUTER_API_KEY is not configured.");
      return [];
    }

    try {
      const res = await fetch("https://search-router.com/api/search", {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query, limit })
      });

      if (!res.ok) {
        console.warn(`SearchRouter API failed with status ${res.status}`);
        return [];
      }

      const data: SearchRouterResponse = await res.json();
      return data.results || [];
    } catch (err: any) {
      console.error("SearchRouter Service Error:", err?.message || err);
      return [];
    }
  }

  public static async searchVehicleRecalls(make: string, model: string, year?: number): Promise<string> {
    const query = `مشاكل وأعطال شائعة ورسائل استدعاء سيارة ${make} ${model} ${year || ''}`.trim();
    const results = await this.search(query, 3);
    if (!results || results.length === 0) return "";
    return results.map(r => `• ${r.title}: ${r.content || r.info_context || ''}`).join('\n');
  }
}
