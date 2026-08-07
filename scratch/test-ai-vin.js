import { ImageAnalysisService } from "../server/services/image-analysis";

async function decodeVinWithAI(vin) {
  const prompt = `Decode the vehicle VIN: "${vin}".
Provide a valid JSON response with keys:
- make (string, e.g. Toyota, BMW, Nissan, Hyundai, Mercedes-Benz, Ford, etc.)
- model (string, e.g. Camry, Patrol, Land Cruiser, Accent, E300, etc., or "" if uncertain)
- year (number, model year if decodable, or null)
- country (string, country of origin)

Return ONLY JSON: {"make": "...", "model": "...", "year": 2023, "country": "..."}`;

  try {
    const result = await ImageAnalysisService["callAI"](prompt);
    console.log(`AI VIN Decode Result for ${vin}:`, result);
    return result;
  } catch (err) {
    console.error("AI VIN Decode error:", err.message);
    return null;
  }
}

decodeVinWithAI("JTD11234567890123");
