import { db } from "./db";
import { faultLibrary } from "@shared/schema";

const gulfFaults = [
  // === الماكينة ودورة التبريد والملحقات ===
  { category: "المحرك والملحقات", faultName: "فك في براغي غطاء التثبيت", severity: "medium", description: "ملاحظة آثار فك أو حل في براغي غطاء التثبيت الخاص بالماكينة" },
  { category: "المحرك والملحقات", faultName: "فك في براغي الثلاجه", severity: "medium", description: "آثار حل وفك في براغي مجمع السحب (الثلاجة)" },
  { category: "المحرك والملحقات", faultName: "فك في غطاء التايمنج الامامي", severity: "medium", description: "آثار فك وتعديل ببراغي غطاء التايمنج الأمامي" },
  { category: "المحرك والملحقات", faultName: "فك في براغي كراسي الماكينه", severity: "medium", description: "ملاحظة حل أو فك سوابق في براغي كراسي المحرك" },
  { category: "المحرك والملحقات", faultName: "كراسي الماكينه حاله سيئه / ضعف", severity: "high", description: "تآكل أو ضعف وتلف في كراسي الماكينة مما يسبب اهتزازاً" },
  { category: "المحرك والملحقات", faultName: "غطاء التثبيت ليك / بدايه ليك", severity: "medium", description: "ملاحظة رطوبة أو آثار تسريب زيت حول غطاء التثبيت" },
  { category: "المحرك والملحقات", faultName: "الثلاجه ليك / بدايه ليك", severity: "medium", description: "ملاحظة بداية تسريب سوائل أو زيوت بالقرب من الثلاجة" },
  { category: "المحرك والملحقات", faultName: "غطاء التايمنج ليك / بدايه ليك", severity: "medium", description: "آثار ترشيح زيت حول غطاء صدر التايمنج الأمامي" },
  { category: "المحرك والملحقات", faultName: "بيلت الماكينه حاله سيئه", severity: "medium", description: "تشققات وقدم في سير الماكينة الخارجي" },
  { category: "المحرك والملحقات", faultName: "مروحه الردياتر حاله سيئه", severity: "high", description: "تراجع كفاءة مروحة التبريد أو وجود كسر بالريش" },
  { category: "المحرك والملحقات", faultName: "كلتش مروحه الردياتر فضاوه", severity: "high", description: "فضاوه واهتزاز بمركز كلتش مروحة الردياتير" },
  { category: "المحرك والملحقات", faultName: "صدا بالردياتر ودورة تبريد الماكينه", severity: "high", description: "وجود ترسبات وصدأ في مياه ودورة تبريد الماكينة ودبة المياه" },
  { category: "المحرك والملحقات", faultName: "غطاء الردياتر ليك / بايبات الردياتر ليك", severity: "medium", description: "ترشيح سائل التبريد حول غطاء الردياتير أو خراطيم التبريد" },
  { category: "المحرك والملحقات", faultName: "بايبات دبه الباور استيرنق ليك / بدايه ليك", severity: "medium", description: "ترشيح زيت بمحيط أنابيب ومضخة الباور ستيرنج" },
  { category: "المحرك والملحقات", faultName: "اويل الماكينه حاله سيئه / نقص السوائل", severity: "medium", description: "احتراق وتلوث زيت الماكينة أو ملاحظة نقص في ليفل السوائل" },
  { category: "المحرك والملحقات", faultName: "ضفيره السياره تركيب سيئ / صبانه", severity: "high", description: "وجود عزل يدوي أو صبانة وتعديل عشوائي بضفيرة الكهرباء" },
  { category: "المحرك والملحقات", faultName: "الفيوز بوكس كسر / غطاء الفيوز بوكس كسر", severity: "medium", description: "كسر أو تلف بغطاء علبة الفيوزات الرئيسية" },
  { category: "المحرك والملحقات", faultName: "كفرات وايرات الماكينه حاله سيئه", severity: "low", description: "تآكل بالحافظة العازلة لأسلاك الماكينة" },
  { category: "المحرك والملحقات", faultName: "ضفيره اللبات الاماميه حاله سيئه", severity: "medium", description: "سوء تركيب وتوصيل بضفيرة الإضاءة والإنارة الأمامية" },
  { category: "المحرك والملحقات", faultName: "بايبات منظم ضغط بخار البنزين حاله سيئه", severity: "medium", description: "تشقق بايبات منظم بخار البنزين (EVAP)" },
  { category: "المحرك والملحقات", faultName: "فك في براغي كرانك كايس الماكينه", severity: "medium", description: "آثار حل وبراغي فك بكرانك كايس الماكينة" },
  { category: "المحرك والملحقات", faultName: "كرانك كايس الماكينه ليك / بدايه ليك", severity: "medium", description: "ترشيح وتنديك زيت بقاعدة كرانك كايس المحرك" },

  // === القير والدبل ونظام الدفع ===
  { category: "ناقل الحركة", faultName: "فك في براغي بين القير والماكينه", severity: "high", description: "ملاحظة فك وحل سوابق في براغي التثبيت بين القير والماكينة" },
  { category: "ناقل الحركة", faultName: "ليك بين القير والماكينه", severity: "high", description: "تنديك وترشيح زيت في المنطقة الفاصلة بين القير والمحرك" },
  { category: "ناقل الحركة", faultName: "فك في براغي القير / ليك من القير", severity: "medium", description: "آثار فك في براغي القير مع وجود ترشيح زيت" },
  { category: "ناقل الحركة", faultName: "الدبل ليك / الدبل بدايه ليك", severity: "medium", description: "بداية تسريب زيت بجسم قير الدبل الفرعي" },
  { category: "ناقل الحركة", faultName: "كراسي القير حاله سيئه / ضعف", severity: "high", description: "تلف وضرر في كراسي تثبيت ناقل الحركة" },

  // === الهيكل السفلي والتعليق والشاصي ===
  { category: "الهيكل السفلي والتعليق", faultName: "اويلسيلات الاستيرنق بوكس ليك / بدايه ليك", severity: "medium", description: "ترشيح زيت بأويلسيلات علبة عجلة التوجيه (الستيرنج)" },
  { category: "الهيكل السفلي والتعليق", faultName: "تاير رود حاله سيئه / ضعف", severity: "high", description: "فضاوه وضعف بأذرع ورؤوس التاير رود" },
  { category: "الهيكل السفلي والتعليق", faultName: "بوشات الشيالات الاماميه / الخلفيه حاله سيئه", severity: "medium", description: "تآكل وتشقق ببوشات وعضلات الشيالات الأمامية أو الخلفية" },
  { category: "الهيكل السفلي والتعليق", faultName: "الاستبلايزر لينك رود حاله سيئه / ضعف", severity: "medium", description: "ضعف وفضاوه بمجموعات مسمار التوازن الاستبلايزر" },
  { category: "الهيكل السفلي والتعليق", faultName: "الاكسيلات الاماميه / الخلفيه فضاوه / ليك", severity: "high", description: "فضاوه بالرأس أو تلف بربلات وترشيح أويلسيلات العكوس والاكسات" },
  { category: "الهيكل السفلي والتعليق", faultName: "الشافت الامامي فضاوه / نقص قريز", severity: "high", description: "اهتزاز وفضاوه بنير الشافت مع نقص الشحم (القريز)" },
  { category: "الهيكل السفلي والتعليق", faultName: "فك في براغي الديفرايشن الخلفي / ليك", severity: "medium", description: "آثار فك في براغي الدفرنس الخلفي مع تنديك زيت" },

  // === الهيكل الخارجي والطلاء ===
  { category: "الهيكل الخارجي", faultName: "تحديد نسبة الصبغ (وكاله 3-5)", severity: "low", description: "قراءة سماكة الدهان بين 3 إلى 5 ميل (دهان مصنع أصلي وكالة)" },
  { category: "الهيكل الخارجي", faultName: "تحديد نسبة الصبغ (رش تجميلي لكر 6-7.5)", severity: "medium", description: "قراءة سماكة الدهان بين 6 إلى 7.5 ميل (رش تجميلي لكر بدون معجون)" },
  { category: "الهيكل الخارجي", faultName: "تحديد نسبة الصبغ (معجون 8-21 وأكثر)", severity: "high", description: "قراءة سماكة الدهان أعلى من 8 ميل (وجود طبقات معجون وتعديل سابق)" },
  { category: "الهيكل الخارجي", faultName: "بدايه صدا في الشاصي / تاكل من الداخل", severity: "critical", description: "وجود صدأ أو تآكل في عوارض الشاصي أو رأس الشاصي" },
  { category: "الهيكل الخارجي", faultName: "صدا في جسر الدعامية الامامية / الخلفية", severity: "medium", description: "آثار صدأ سطحي على جسر الهيكل الداخلي للدعامية" }
];

export async function seedGulfFaults() {
  try {
    for (const fault of gulfFaults) {
      await db.insert(faultLibrary).values(fault).onConflictDoNothing();
    }
  } catch (e) {
    // Non-blocking catch
  }
}
