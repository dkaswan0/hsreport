import { Buffer } from "node:buffer";

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
    imageBase64: string,
    responseSchema?: any
  ): Promise<any> {
    const apiKey = this.getApiKey();
    const { mimeType, data } = this.cleanBase64(imageBase64);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

    const body: any = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

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
إذا كان هناك عطل مرئي، اقترح قائمة بالأعطال المحتملة مع تحديد درجة خطورتها (low/medium/high) ووصف دقيق لها.
اكتب أيضاً ملاحظة فنية احترافية كفاحص سيارات (professionalNotes) يمكن إضافتها لتقرير الفحص باللغة العربية.

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
  "professionalNotes": "ملاحظة فنية واحترافية للفحص بالعربية"
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
    const apiKey = this.getApiKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

    const prompt = `You are an expert automotive OBD-II diagnostics specialist. You must provide accurate DTC (Diagnostic Trouble Code) information.
For each code, provide:
- code: The OBD code itself (e.g. P0128)
- nameEn: Official English fault name (concise)
- nameAr: Arabic translation of the fault name (Modern Standard Arabic - الفصحى المبسطة)
- diagnosis: Detailed technical diagnosis explanation in Arabic
- causes: Common causes in Arabic (comma separated)
- solutions: Recommended repair solutions in Arabic (comma separated)

Provide full details for these OBD-II fault codes: ${codes.join(', ')}

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
    return JSON.parse(textResponse);
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
}
