import { ImageAnalysisService } from "../server/services/image-analysis";

async function run() {
  console.log("Testing Gemini API connection...");
  try {
    const key = process.env.GEMINI_API_KEY;
    console.log("Key starts with:", key ? key.substring(0, 10) + "..." : "undefined");
    
    // Test lookupObdCodes
    const result = await ImageAnalysisService.lookupObdCodes(["P0128"]);
    console.log("Gemini API connection test: SUCCESS!");
    console.log("Result:", JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error: any) {
    console.error("Gemini API connection test: FAILED!");
    console.error(error.message);
    process.exit(1);
  }
}

run();
