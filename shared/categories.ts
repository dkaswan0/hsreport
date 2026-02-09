// Main category sections - 6 أقسام رئيسية
export const MAIN_SECTIONS = [
  { id: "mechanic", label: "الأجزاء الميكانيكية", labelEn: "MECHANIC" },
  { id: "transmission", label: "ناقل الحركة", labelEn: "TRANSMISSION" },
  { id: "body", label: "الهيكل الخارجي", labelEn: "BODY" },
  { id: "chassis", label: "الهيكل", labelEn: "CHASSIS" },
  { id: "electric", label: "الأجزاء الكهربائية والإلكترونية", labelEn: "ELECTRIC" },
  { id: "interior", label: "الداخلية والسلامة والملحقات", labelEn: "INTERIOR & SAFETY" },
];

export const INSPECTION_CATEGORIES = [
  // ==================== MECHANIC (الأجزاء الميكانيكية) ====================
  { id: "engine", label: "المحرك", labelEn: "Engine", section: "mechanic" },
  { id: "suspension_system", label: "نظام التعليق", labelEn: "Suspension System", section: "mechanic" },
  { id: "steering_system", label: "نظام التوجيه", labelEn: "Steering System", section: "mechanic" },
  { id: "brake_system", label: "نظام الفرامل", labelEn: "Brake System", section: "mechanic" },
  { id: "fuel_exhaust", label: "نظام الوقود والعادم", labelEn: "Fuel & Exhaust System", section: "mechanic" },
  { id: "ac_cooling", label: "نظام التكييف", labelEn: "AC & Cooling System", section: "mechanic" },
  { id: "misc_mechanical", label: "أعطال ميكانيكية متنوعة", labelEn: "Misc Mechanical", section: "mechanic" },
  
  // ==================== TRANSMISSION (ناقل الحركة) ====================
  { id: "transmission_auto", label: "قير أوتوماتيك", labelEn: "Automatic Transmission", section: "transmission" },
  { id: "transmission_manual", label: "قير عادي", labelEn: "Manual Transmission", section: "transmission" },
  { id: "transmission_performance", label: "أداء ناقل الحركة", labelEn: "Transmission Performance", section: "transmission" },
  { id: "transmission_sounds", label: "أصوات ناقل الحركة", labelEn: "Transmission Sounds", section: "transmission" },
  { id: "transmission_leaks", label: "تسريبات ناقل الحركة", labelEn: "Transmission Leaks", section: "transmission" },
  { id: "transmission_shifting", label: "التبديل والتعشيق", labelEn: "Gear Shifting", section: "transmission" },
  
  // ==================== BODY (الهيكل الخارجي) ====================
  { id: "door_front_left", label: "الباب الأمامي يسار", labelEn: "Front Left Door", section: "body" },
  { id: "door_front_right", label: "الباب الأمامي يمين", labelEn: "Front Right Door", section: "body" },
  { id: "door_rear_left", label: "الباب الخلفي يسار", labelEn: "Rear Left Door", section: "body" },
  { id: "door_rear_right", label: "الباب الخلفي يمين", labelEn: "Rear Right Door", section: "body" },
  { id: "hood", label: "غطاء المحرك", labelEn: "Hood", section: "body" },
  { id: "trunk", label: "صندوق الأمتعة", labelEn: "Trunk", section: "body" },
  { id: "fender_front_left", label: "الرفرف الأمامي يسار", labelEn: "Front Left Fender", section: "body" },
  { id: "fender_front_right", label: "الرفرف الأمامي يمين", labelEn: "Front Right Fender", section: "body" },
  { id: "fender_rear_left", label: "الرفرف الخلفي يسار", labelEn: "Rear Left Fender", section: "body" },
  { id: "fender_rear_right", label: "الرفرف الخلفي يمين", labelEn: "Rear Right Fender", section: "body" },
  { id: "quarter_panel_left", label: "اللوح الجانبي الأيسر", labelEn: "Left Quarter Panel", section: "body" },
  { id: "quarter_panel_right", label: "اللوح الجانبي الأيمن", labelEn: "Right Quarter Panel", section: "body" },
  { id: "roof", label: "السقف", labelEn: "Roof", section: "body" },
  { id: "pillars", label: "القوائم", labelEn: "Pillars", section: "body" },
  { id: "front_chest", label: "الصدر الأمامي", labelEn: "Front Frame", section: "body" },
  { id: "rear_chest", label: "الصدر الخلفي", labelEn: "Rear Frame", section: "body" },
  { id: "front_bumper", label: "الدعامية الأمامية", labelEn: "Front Bumper", section: "body" },
  { id: "rear_bumper", label: "الدعامية الخلفية", labelEn: "Rear Bumper", section: "body" },
  { id: "bumper_frame_front", label: "جسر الدعامية الأمامية", labelEn: "Front Bumper Frame", section: "body" },
  { id: "bumper_frame_rear", label: "جسر الدعامية الخلفية", labelEn: "Rear Bumper Frame", section: "body" },
  { id: "fender_front", label: "الرفرف الأمامي", labelEn: "Front Fender", section: "body" },
  { id: "fender_rear", label: "الرفرف الخلفي", labelEn: "Rear Fender", section: "body" },
  
  // ==================== CHASSIS (الهيكل) ====================
  { id: "chassis_frame", label: "الهيكل والإطار", labelEn: "Chassis & Frame", section: "chassis" },
  { id: "chassis_alignment", label: "الاستقامة", labelEn: "Alignment", section: "chassis" },
  { id: "chassis_welding", label: "القص واللحام", labelEn: "Cutting & Welding", section: "chassis" },
  { id: "chassis_accident", label: "آثار الحوادث القوية", labelEn: "Accident Damage", section: "chassis" },
  
  // ==================== ELECTRIC (الأجزاء الكهربائية والإلكترونية) ====================
  { id: "electrical_system", label: "النظام الكهربائي", labelEn: "Electrical System", section: "electric" },
  { id: "battery", label: "البطارية", labelEn: "Battery", section: "electric" },
  { id: "exterior_lighting", label: "الإضاءة الخارجية", labelEn: "Exterior Lighting", section: "electric" },
  { id: "lights_front", label: "الأضواء الأمامية", labelEn: "Front Lights", section: "electric" },
  { id: "lights_rear", label: "الأضواء الخلفية", labelEn: "Rear Lights", section: "electric" },
  { id: "wire_harness", label: "أسلاك التوصيل", labelEn: "Wire Harness", section: "electric" },
  { id: "mirror_controls", label: "زر تحكم المرايا", labelEn: "Mirror Controls", section: "electric" },
  { id: "computer_sensors", label: "فحص الكمبيوتر والحساسات", labelEn: "Computer & Sensors", section: "electric" },
  
  // ==================== INTERIOR & SAFETY (الداخلية والسلامة والملحقات) ====================
  { id: "interior", label: "الداخلية", labelEn: "Interior", section: "interior" },
  { id: "safety_systems", label: "أنظمة السلامة", labelEn: "Safety Systems", section: "interior" },
  { id: "tires_rims", label: "الإطارات والجنوط", labelEn: "Tires & Rims", section: "interior" },
  { id: "windows", label: "الزجاج والنوافذ", labelEn: "Glass & Windows", section: "interior" },
  { id: "mirrors", label: "المرايا", labelEn: "Mirrors", section: "interior" },
  { id: "accessories", label: "الإكسسوارات والملحقات", labelEn: "Accessories", section: "interior" },
  { id: "documentation", label: "الوثائق والتوثيق", labelEn: "Documentation", section: "interior" },
];

export const CATEGORY_GROUPS = [
  {
    group: "الأجزاء الميكانيكية",
    groupEn: "MECHANIC",
    sectionId: "mechanic",
    categories: ["engine", "suspension_system", "steering_system", "brake_system", "fuel_exhaust", "ac_cooling", "misc_mechanical"]
  },
  {
    group: "ناقل الحركة",
    groupEn: "TRANSMISSION",
    sectionId: "transmission",
    categories: ["transmission_auto", "transmission_manual", "transmission_performance", "transmission_sounds", "transmission_leaks", "transmission_shifting"]
  },
  {
    group: "الهيكل الخارجي",
    groupEn: "BODY",
    sectionId: "body",
    categories: ["door_front_left", "door_front_right", "door_rear_left", "door_rear_right", "hood", "trunk", "fender_front_left", "fender_front_right", "fender_rear_left", "fender_rear_right", "quarter_panel_left", "quarter_panel_right", "roof", "pillars", "front_chest", "rear_chest", "front_bumper", "rear_bumper", "bumper_frame_front", "bumper_frame_rear", "fender_front", "fender_rear"]
  },
  {
    group: "الهيكل",
    groupEn: "CHASSIS",
    sectionId: "chassis",
    categories: ["chassis_frame", "chassis_alignment", "chassis_welding", "chassis_accident"]
  },
  {
    group: "الأجزاء الكهربائية والإلكترونية",
    groupEn: "ELECTRIC",
    sectionId: "electric",
    categories: ["electrical_system", "battery", "exterior_lighting", "lights_front", "lights_rear", "wire_harness", "mirror_controls", "computer_sensors"]
  },
  {
    group: "الداخلية والسلامة والملحقات",
    groupEn: "INTERIOR & SAFETY",
    sectionId: "interior",
    categories: ["interior", "safety_systems", "tires_rims", "windows", "mirrors", "accessories", "documentation"]
  }
];

export function getCategoryById(id: string) {
  return INSPECTION_CATEGORIES.find(c => c.id === id);
}

export function getCategoryLabel(id: string): string {
  const cat = getCategoryById(id);
  return cat?.label || id;
}

export function getCategoryLabelEn(id: string): string {
  const cat = getCategoryById(id);
  return cat?.labelEn || id;
}

export function getCategorySection(id: string): string {
  const cat = getCategoryById(id);
  return cat?.section || "interior";
}

export function getSectionById(id: string) {
  return MAIN_SECTIONS.find(s => s.id === id);
}

export function getCategoriesBySection(sectionId: string) {
  return INSPECTION_CATEGORIES.filter(c => c.section === sectionId);
}
