import { db } from "./db";
import { inspections, inspectionItems } from "@shared/schema";
import crypto from "crypto";

async function createTestReport() {
  const shareToken = crypto.randomUUID().replace(/-/g, '');

  console.log("Creating realistic test inspection report...");

  // 1. Insert Main Inspection Record
  const [newInspection] = await db.insert(inspections).values({
    vin: "JTEBU5JR2K5098765",
    make: "تويوتا",
    model: "لاندكروزر VXR",
    year: 2022,
    color: "أبيض لؤلؤي",
    odometer: 48500,
    customerName: "عبد الله محمد العتيبي",
    customerPhone: "0501234567",
    inspectionType: "فحص شامل",
    status: "completed",
    notes: "تم فحص المركبة بالكامل بمركز الفحص الفني المعتمد. المحرك والقير والشاصي بحالة ممتازة مع وجود ملاحظات تجميلية سطحية وترشيح زيت خفيف بغطاء البلوف.",
    shareToken: shareToken,
    mainCarPhoto: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80",
    hoodPhoto: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80",
    hoodInteriorPhoto: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80",
    frontRightDoorPhoto: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
    obdCodes: [
      {
        code: "P0171",
        nameEn: "System Too Lean (Bank 1)",
        nameAr: "خليط الوقود فقير جداً (البنك 1)",
        diagnosis: "ملاحظة زيادة نسبة الهواء مقارنة بالوقود بمجرى السحب",
        causes: ["اتساخ حساس الهواء MAF", "تسريب بسيط في بايبات منظم بخار البنزين"],
        solutions: ["تنظيف حساس الهواء MAF", "إعادة تثبيت خراطيم منظم الهواء"]
      }
    ],
    mojazRecord: "سجل حوادث موجز: حادث مروري تجميلي بسيط بالجانب الأيمن الأمامي سنة 2023 دون التأثير على الشاصي أو المحرك.",
    mojazAnalysis: {
      matchScore: 95,
      summary: "متطابق مع الفحص الميداني: تم رصد آثار رش تجميلي بالمدقار الأيمن الأمامي مطابق لسجل موجز."
    }
  }).returning();

  const inspectionId = newInspection.id;
  console.log(`Inspection created with ID: ${inspectionId}`);

  // 2. Add Detailed Inspection Items with real photos & notes
  const items = [
    {
      inspectionId,
      category: "engine",
      faultName: "ترشيح زيت خفيف حول غطاء البلوف",
      status: "warning",
      severity: "medium",
      imageUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80",
      description: "ملاحظة آثار ترشيح وتبخير زيت خفيف بالقرب من غطاء البلوف العلوي للمحرك دون وجود تهريب نشط أو تنقيط.",
      notes: "تم فحص حجرة المحرك ظاهرياً وملاحظة ترشيح زيت خفيف حول غطاء البلوف. المحرك يعمل بهدوء وبدون أصوات غريبة."
    },
    {
      inspectionId,
      category: "engine",
      faultName: "فك في براغي غطاء التايمنج الأمامي",
      status: "warning",
      severity: "medium",
      imageUrl: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=800&q=80",
      description: "آثار حل وفك سوابق ببراغي غطاء التايمنج الصدر الأمامي للمحرك.",
      notes: "ملاحظة آثار فك ببراغي غطاء صدر الماكينة لغرض الصيانة الدورية السابقة."
    },
    {
      inspectionId,
      category: "transmission_auto",
      faultName: "حالة ناقل الحركة والقير ممتازة",
      status: "pass",
      severity: "low",
      imageUrl: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80",
      description: "القير والدبل بحالة وكالة دون وجود تسريب زيت أو حل براغي تثبيت.",
      notes: "تم تجربة القير والدبل وتبديل السرعات بسلاسة تامة دون أي تنتيع أو تأخير."
    },
    {
      inspectionId,
      category: "fender_front_right",
      faultName: "آثار رش تجميلي بالمدقار الأمامي الأيمن (7.0 mil)",
      status: "warning",
      severity: "medium",
      imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
      description: "قراءة جهاز سماكة الطلاء 7.0 ميل (رش تجميلي لكر بدون معجون).",
      notes: "تم فحص المدقار الأمامي الأيمن وتبين وجود رش تجميلي لكر بدون معجون تماشياً مع القراءات."
    },
    {
      inspectionId,
      category: "front_bumper",
      faultName: "حككات سطحية بأسفل المصد الأمامي",
      status: "warning",
      severity: "low",
      imageUrl: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80",
      description: "حككات واحتكاك سطحي خفيف بالصبغ على الجزء السفلي للمصد الأمامي.",
      notes: "حككات تجميلية بسيطة لا تؤثر على سلامة الواجهة."
    },
    {
      inspectionId,
      category: "chassis_frame",
      faultName: "سلامة الشاصي والأجزاء الهيكلية الأساسية 100%",
      status: "pass",
      severity: "low",
      imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
      description: "الشاصي الأمامي والخلفي والجسور خالية من أي صدمات أو لحام أو صدأ.",
      notes: "تم الفحص الهيكلي الشامل لأسفل المركبة والشاصي سليم بحالة الوكالة."
    }
  ];

  for (const item of items) {
    await db.insert(inspectionItems).values(item);
  }

  console.log("==========================================");
  console.log("REAL TEST REPORT CREATED SUCCESSFULLY!");
  console.log(`VIN: JTEBU5JR2K5098765`);
  console.log(`Report ID: ${inspectionId}`);
  console.log(`Share Token: ${shareToken}`);
  console.log(`Local Interactive Link: http://localhost:5000/report/${shareToken}`);
  console.log(`Live Render Link: https://hsreport.onrender.com/report/${shareToken}`);
  console.log("==========================================");
  process.exit(0);
}

createTestReport().catch(err => {
  console.error("Error creating test report:", err);
  process.exit(1);
});
