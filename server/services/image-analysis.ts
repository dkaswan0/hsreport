import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";

export interface PhotoAnalysisResult {
  detectedPart: string;
  detectedPartArabic: string;
  category: string;
  suggestedFaults: Array<{
    faultName: string;
    severity: "low" | "medium" | "high";
    description: string;
  }>;
  professionalNotes?: string;
}

export interface OdometerAnalysisResult {
  odometer: number;
  confidence: number;
  professionalNotes?: string;
}

export interface ObdLookupResult {
  code: string;
  nameEn: string;
  nameAr: string;
  diagnosis: string;
  causes: string;
  solutions: string;
}

const CACHE_FILE = path.join(process.cwd(), "server", "services", "obd-cache.json");

function readObdCache(): Record<string, ObdLookupResult> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to read OBD cache:", e);
  }
  return {};
}

function writeObdCache(cache: Record<string, ObdLookupResult>) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write OBD cache:", e);
  }
}

export class ImageAnalysisService {
  private static getApiKey(): string {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("مفتاح API الخاص بـ Google Gemini (GEMINI_API_KEY) غير مهيأ في ملف الإعدادات (.env). يرجى إضافته لتفعيل ميزات الذكاء الاصطناعي.");
    }
    return key;
  }

  private static cleanBase64(base64: string): { mimeType: string; data: string } {
    const match = base64.match(/^data:([^;]+);base64,(.*)$/);
    if (match) {
      return { mimeType: match[1], data: match[2] };
    }
    return { mimeType: "image/jpeg", data: base64 };
  }

  private static async callGemini(
    prompt: string,
    imageBase64?: string,
    responseSchema?: any
  ): Promise<any> {
    const apiKey = this.getApiKey();

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const body: any = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    if (imageBase64) {
      const { mimeType, data } = this.cleanBase64(imageBase64);
      body.contents[0].parts.push({
        inlineData: {
          mimeType,
          data
        }
      });
    }

    if (responseSchema) {
      body.generationConfig.responseSchema = responseSchema;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      let parsedErr;
      try {
        parsedErr = JSON.parse(errText);
      } catch {
        parsedErr = { error: { message: errText } };
      }
      throw new Error(`فشل الاتصال بخدمة الذكاء الاصطناعي (Gemini): ${parsedErr?.error?.message || response.statusText}`);
    }

    const result = await response.json();
    try {
      const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResponse) {
        throw new Error("لم يتم إرجاع نتيجة من خادم الذكاء الاصطناعي.");
      }
      return JSON.parse(textResponse);
    } catch (e: any) {
      console.error("Gemini Parse Error. Raw response:", JSON.stringify(result));
      throw new Error(`فشل تحليل استجابة الذكاء الاصطناعي: ${e.message}`);
    }
  }

  public static async analyzePhoto(imageBase64: string): Promise<PhotoAnalysisResult> {
    const prompt = `حلل هذه الصورة لقطعة سيارة أو عطل سيارة. حدد اسم الجزء المكتشف باللغة الإنجليزية والعربية، وصنف الفئة الخاصة به (مثل: المحرك، الهيكل الخارجي، ناقل الحركة، الهيكل السفلي، الأجزاء الكهربائية، الداخلية والسلامة).
إذا كان هناك عطل مرئي، اقترح قائمة بالأعطال المحتملة مع وصف دقيق لها.
اكتب أيضاً ملاحظة فنية احترافية كفاحص سيارات (professionalNotes) يمكن إضافتها لتقرير الفحص باللغة العربية تصف فيها المشكلة فقط.

تنبيه هام للغاية وصارم: يمنع منعاً باتاً استخدام عبارات مثل "يتطلب الاستبدال" أو "مما يستدعي استبداله" أو "مما يكشف أجزاء المحرك الداخلية" أو أي توصيات مشابهة بالإصلاح أو الاستبدال أو الصيانة. المطلوب هو وصف وذكر العطل الملاحظ فقط بشكل مباشر واحترافي دون اقتراح أي نوع من أنواع الإصلاح أو الاستبدال.

يجب إرجاع النتيجة بصيغة JSON مطابقة للنموذج التالي:
{
  "detectedPart": "Part name in English (e.g. Bumper)",
  "detectedPartArabic": "اسم الجزء بالعربية (مثل الدعامية الأمامية)",
  "category": "الفئة بالعربية (مثل الهيكل الخارجي)",
  "suggestedFaults": [
    {
      "faultName": "اسم العطل بالعربية (مثل كسر أو خدوش)",
      "severity": "low/medium/high",
      "description": "وصف العطل بدقة"
    }
  ],
  "professionalNotes": "ملاحظة فنية واحترافية تصف المشكلة فقط بالعربية دون أي توصيات بالإصلاح أو الاستبدال"
}`;

    const schema = {
      type: "OBJECT",
      properties: {
        detectedPart: { type: "STRING" },
        detectedPartArabic: { type: "STRING" },
        category: { type: "STRING" },
        suggestedFaults: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              faultName: { type: "STRING" },
              severity: { type: "STRING", enum: ["low", "medium", "high"] },
              description: { type: "STRING" }
            },
            required: ["faultName", "severity", "description"]
          }
        },
        professionalNotes: { type: "STRING" }
      },
      required: ["detectedPart", "detectedPartArabic", "category", "suggestedFaults", "professionalNotes"]
    };

    return this.callGemini(prompt, imageBase64, schema);
  }

  public static async analyzeOdometer(imageBase64: string): Promise<OdometerAnalysisResult> {
    const prompt = `حلل هذه الصورة لعداد الكيلومترات (odometer) الخاص بالسيارة.
استخرج القراءة العددية الكلية الظاهرة للعداد بالكيلومترات (أو الأميال إذا كانت واضحة).
تجاهل أرقام الرحلات القصيرة (Trip) وركز على قراءة العداد الكلية (Odometer/Total mileage).

يجب إرجاع النتيجة بصيغة JSON مطابقة للنموذج التالي:
{
  "odometer": 123456, // القراءة المستخرجة كرقم صحيح فقط بدون فواصل أو نصوص
  "confidence": 0.95, // نسبة الثقة بين 0.0 و 1.0
  "professionalNotes": "ملاحظة فنية بالعربية (مثال: قراءة العداد واضحة وتساوي 123,456 كم)"
}`;

    const schema = {
      type: "OBJECT",
      properties: {
        odometer: { type: "INTEGER" },
        confidence: { type: "NUMBER" },
        professionalNotes: { type: "STRING" }
      },
      required: ["odometer", "confidence", "professionalNotes"]
    };

    return this.callGemini(prompt, imageBase64, schema);
  }

  public static async extractObdCodes(imageBase64: string): Promise<string[]> {
    const prompt = `You are an expert at reading OBD-II diagnostic scanner screens. Extract ALL fault codes visible in the image.
OBD codes follow patterns like: P0xxx, P1xxx, P2xxx, P3xxx, C0xxx, C1xxx, C2xxx, B0xxx, B1xxx, U0xxx, U1xxx, etc.
Return ONLY a JSON object containing an array of codes found. If no codes are found, return an empty array.

JSON format:
{
  "codes": ["P0128", "C1201"]
}`;

    const schema = {
      type: "OBJECT",
      properties: {
        codes: {
          type: "ARRAY",
          items: { type: "STRING" }
        }
      },
      required: ["codes"]
    };

    const result = await this.callGemini(prompt, imageBase64, schema);
    return result.codes || [];
  }

  public static async lookupObdCodes(codes: string[]): Promise<ObdLookupResult[]> {
    if (!codes || codes.length === 0) return [];
    
    // 1. Load cache
    const cache = readObdCache();
    const results: ObdLookupResult[] = [];
    const missingCodes: string[] = [];

    for (const code of codes) {
      const normalized = code.trim().toUpperCase();
      if (cache[normalized]) {
        results.push(cache[normalized]);
      } else {
        missingCodes.push(normalized);
      }
    }

    // 2. If nothing is missing, return cached results immediately
    if (missingCodes.length === 0) {
      return results;
    }

    // 3. Query Gemini for missing codes
    const apiKey = this.getApiKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `You are an expert automotive OBD-II diagnostics specialist. You must provide accurate DTC (Diagnostic Trouble Code) information.
For each code, provide:
- code: The OBD code itself (e.g. P0128)
- nameEn: Official English fault name (concise)
- nameAr: Arabic translation of the fault name (Modern Standard Arabic - الفصحى المبسطة)
- diagnosis: Detailed technical diagnosis explanation in Arabic
- causes: Common causes in Arabic (comma separated)
- solutions: Recommended repair solutions in Arabic (comma separated)

Provide full details for these OBD-II fault codes: ${missingCodes.join(', ')}

Return a JSON array of objects.`;

    const schema = {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          code: { type: "STRING" },
          nameEn: { type: "STRING" },
          nameAr: { type: "STRING" },
          diagnosis: { type: "STRING" },
          causes: { type: "STRING" },
          solutions: { type: "STRING" }
        },
        required: ["code", "nameEn", "nameAr", "diagnosis", "causes", "solutions"]
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini OBD Lookup API failed with status ${response.status}`);
    }

    const result = await response.json();
    const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) {
      throw new Error("No OBD lookup description returned from Gemini.");
    }

    const newResults: ObdLookupResult[] = JSON.parse(textResponse);

    // 4. Update cache
    for (const res of newResults) {
      const normalized = res.code.trim().toUpperCase();
      cache[normalized] = res;
      results.push(res);
    }
    writeObdCache(cache);

    return results;
  }

  public static async analyzeVoice(audioBase64: string, mimeType: string): Promise<any> {
    const prompt = `حلل هذا التسجيل الصوتي للفاحص باللغة العربية. قم بنسخ الكلام (transcribe) بدقة.
استخرج اسم الجزء المكتشف باللغة الإنجليزية والعربية، وصنف الفئة الخاصة به (مثل: المحرك، الهيكل الخارجي، ناقل الحركة، الهيكل السفلي، الأجزاء الكهربائية، الداخلية والسلامة).
استخرج أي أعطال مذكورة في التسجيل مع تحديد درجة خطورتها (low/medium/high) ووصف دقيق للمشكلة.
اكتب أيضاً ملاحظة فنية احترافية (notes) تلخص الفحص باللغة العربية.

يجب إرجاع النتيجة بصيغة JSON مطابقة للنموذج التالي:
{
  "detectedPart": "Part name in English (e.g. Radiator)",
  "detectedPartArabic": "اسم الجزء بالعربية (مثل المبرد)",
  "category": "الفئة بالعربية (مثل المحرك)",
  "suggestedFaults": [
    {
      "faultName": "اسم العطل بالعربية (مثل تهريب ماء)",
      "severity": "low/medium/high",
      "description": "وصف العطل بدقة"
    }
  ],
  "notes": "ملاحظة فنية واحترافية للفحص بالعربية تلخص ما تم قوله",
  "transcript": "النص الصوتي المنسوخ بالكامل"
}`;

    const schema = {
      type: "OBJECT",
      properties: {
        detectedPart: { type: "STRING" },
        detectedPartArabic: { type: "STRING" },
        category: { type: "STRING" },
        suggestedFaults: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              faultName: { type: "STRING" },
              severity: { type: "STRING", enum: ["low", "medium", "high"] },
              description: { type: "STRING" }
            },
            required: ["faultName", "severity", "description"]
          }
        },
        notes: { type: "STRING" },
        transcript: { type: "STRING" }
      },
      required: ["detectedPart", "detectedPartArabic", "category", "suggestedFaults", "notes", "transcript"]
    };

    return this.callGemini(prompt, `data:${mimeType};base64,${audioBase64}`, schema);
  }

  public static async extractVin(imageBase64: string): Promise<string> {
    const prompt = `You are an expert at reading vehicle chassis numbers (VIN) from labels, metal plates, barcodes, or windshields.
Identify the 17-character VIN number from the image.
A VIN code consists of exactly 17 characters (numbers and uppercase letters) excluding I, O, Q (which are normalized or avoided in VIN standards, but if they appear, extract them exactly as printed).
Return a JSON object containing the extracted VIN. If no VIN is found, return an empty string.

JSON format:
{
  "vin": "WBA3A5C50DF123456"
}`;

    const schema = {
      type: "OBJECT",
      properties: {
        vin: { type: "STRING" }
      },
      required: ["vin"]
    };

    const result = await this.callGemini(prompt, imageBase64, schema);
    return result.vin || "";
  }

  public static async analyzeMojazMatch(mojazRecord: string, items: any[]): Promise<any> {
    const prompt = `You are an expert collision investigator. Compare the previous accidents history from the Mojaz report with the current physical inspection findings of the vehicle.
Mojaz Accidents Records:
"""
${mojazRecord}
"""

Current Physical Inspection Findings:
${JSON.stringify(items.map(i => ({ category: i.category, faultName: i.faultName, status: i.status, description: i.description })))}

Analyze and match the accident locations with the current damages. Assess the repair quality (e.g. professional repair, visible weld marks, poor repainting, or unaddressed damage).
Return the result in Arabic as a JSON object matching the following structure:
{
  "matches": [
    {
      "accidentDate": "تاريخ الحادث (إن وجد)",
      "accidentDescription": "وصف الحادث المسجل في موجز",
      "matchedPart": "الجزء المتطابق في الفحص الحالي (مثل الرفرف الخلفي الأيمن)",
      "repairQuality": "تقييم جودة الإصلاح (مثال: إصلاح ممتاز بمواصفات المصنع / أو إصلاح تجاري مع وجود معجون)",
      "matchStatus": "متطابق / غير متطابق / لا يمكن التأكيد"
    }
  ],
  "overallRepairAssessment": "تقييم عام باللغة العربية لجودة إصلاح الحوادث السابقة المسجلة بالسيارة ومدى مطابقتها للحالة الراهنة"
}`;

    const schema = {
      type: "OBJECT",
      properties: {
        matches: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              accidentDate: { type: "STRING" },
              accidentDescription: { type: "STRING" },
              matchedPart: { type: "STRING" },
              repairQuality: { type: "STRING" },
              matchStatus: { type: "STRING" }
            },
            required: ["accidentDate", "accidentDescription", "matchedPart", "repairQuality", "matchStatus"]
          }
        },
        overallRepairAssessment: { type: "STRING" }
      },
      required: ["matches", "overallRepairAssessment"]
    };

    return this.callGemini(prompt, undefined, schema);
  }
}
