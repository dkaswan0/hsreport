// Main category sections
export const MAIN_SECTIONS = [
  { id: "mechanic", label: "الأجزاء الميكانيكية", labelEn: "MECHANIC" },
  { id: "body", label: "الهيكل", labelEn: "BODY" },
  { id: "electric", label: "الأجزاء الكهربائية", labelEn: "ELECTRIC" },
  { id: "transmission", label: "ناقل الحركة", labelEn: "TRANSMISSION" },
  { id: "chassis", label: "الشاصي", labelEn: "CHASSIS" },
  { id: "other", label: "أخرى", labelEn: "OTHER" },
];

export const INSPECTION_CATEGORIES = [
  // ==================== MECHANIC (الأجزاء الميكانيكية) ====================
  { id: "suspension_system", label: "نظام التعليق", labelEn: "Suspension System", section: "mechanic" },
  { id: "steering_system", label: "نظام التوجيه", labelEn: "Steering System", section: "mechanic" },
  { id: "misc_mechanical", label: "أعطال متنوعة", labelEn: "Misc Mechanical", section: "mechanic" },
  { id: "engine", label: "المحرك", labelEn: "Engine", section: "mechanic" },
  { id: "brake_system", label: "نظام الفرامل", labelEn: "Brake System", section: "mechanic" },
  { id: "fuel_exhaust", label: "نظام الوقود والعادم", labelEn: "Fuel & Exhaust System", section: "mechanic" },
  { id: "ac_cooling", label: "نظام التكييف", labelEn: "AC & Cooling System", section: "mechanic" },
  
  // ==================== BODY (الهيكل) ====================
  { id: "door_front_left", label: "الباب الأمامي يسار", labelEn: "Front Left Door", section: "body" },
  { id: "door_front_right", label: "الباب الأمامي يمين", labelEn: "Front Right Door", section: "body" },
  { id: "door_rear_left", label: "الباب الخلفي يسار", labelEn: "Rear Left Door", section: "body" },
  { id: "door_rear_right", label: "الباب الخلفي يمين", labelEn: "Rear Right Door", section: "body" },
  { id: "trunk", label: "الدبة", labelEn: "Trunk", section: "body" },
  { id: "hood", label: "البونيت", labelEn: "Hood", section: "body" },
  { id: "front_bumper", label: "الدعامية الأمامية", labelEn: "Front Bumper", section: "body" },
  { id: "rear_bumper", label: "الدعامية الخلفية", labelEn: "Rear Bumper", section: "body" },
  { id: "roof", label: "السقف", labelEn: "Roof", section: "body" },
  { id: "quarter_panel", label: "الفخد", labelEn: "Quarter Panel", section: "body" },
  { id: "pillars", label: "القوائم", labelEn: "Pillars", section: "body" },
  { id: "fender_front_left", label: "المدقار الأمامي يسار", labelEn: "Front Left Fender", section: "body" },
  { id: "fender_front_right", label: "المدقار الأمامي يمين", labelEn: "Front Right Fender", section: "body" },
  { id: "fender_rear_left", label: "المدقار الخلفي يسار", labelEn: "Rear Left Fender", section: "body" },
  { id: "fender_rear_right", label: "المدقار الخلفي يمين", labelEn: "Rear Right Fender", section: "body" },
  { id: "bumper_frame_front", label: "جسر الدعامية الأمامية", labelEn: "Front Bumper Frame", section: "body" },
  { id: "bumper_frame_rear", label: "جسر الدعامية الخلفية", labelEn: "Rear Bumper Frame", section: "body" },
  { id: "front_chest", label: "صدر السيارة الأمامي", labelEn: "Front Frame", section: "body" },
  { id: "rear_chest", label: "صدر السيارة الخلفي", labelEn: "Rear Frame", section: "body" },
  
  // ==================== ELECTRIC (الأجزاء الكهربائية) ====================
  { id: "electrical_system", label: "النظام الكهربائي", labelEn: "Electrical System", section: "electric" },
  { id: "lights_rear", label: "الليتات الخلفية", labelEn: "Rear Lights", section: "electric" },
  { id: "exterior_lighting", label: "الإضاءة الخارجية", labelEn: "Exterior Lighting", section: "electric" },
  
  // ==================== TRANSMISSION (ناقل الحركة) ====================
  { id: "transmission_system", label: "ناقل الحركة", labelEn: "Transmission System", section: "transmission" },
  
  // ==================== CHASSIS (الشاصي) ====================
  { id: "chassis_frame", label: "الهيكل والشاصي", labelEn: "Chassis & Frame", section: "chassis" },
  
  // ==================== OTHER (أخرى) ====================
  { id: "safety_systems", label: "أنظمة السلامة", labelEn: "Safety Systems", section: "other" },
  { id: "tires_rims", label: "الإطارات والجنوط", labelEn: "Tires & Rims", section: "other" },
  { id: "windows", label: "الجامات", labelEn: "Windows", section: "other" },
  { id: "interior", label: "الداخلية", labelEn: "Interior", section: "other" },
  { id: "glass_mirrors", label: "الزجاج والمرايا", labelEn: "Glass & Mirrors", section: "other" },
  { id: "accessories", label: "الملحقات والإكسسوارات", labelEn: "Accessories", section: "other" },
  { id: "documentation", label: "الوثائق والتوثيق", labelEn: "Documentation", section: "other" },
];

export const CATEGORY_GROUPS = [
  {
    group: "الأجزاء الميكانيكية",
    groupEn: "MECHANIC",
    sectionId: "mechanic",
    categories: ["suspension_system", "steering_system", "misc_mechanical", "engine", "brake_system", "fuel_exhaust", "ac_cooling"]
  },
  {
    group: "الهيكل",
    groupEn: "BODY",
    sectionId: "body",
    categories: ["door_front_left", "door_front_right", "door_rear_left", "door_rear_right", "trunk", "hood", "front_bumper", "rear_bumper", "roof", "quarter_panel", "pillars", "fender_front_left", "fender_front_right", "fender_rear_left", "fender_rear_right", "bumper_frame_front", "bumper_frame_rear", "front_chest", "rear_chest"]
  },
  {
    group: "الأجزاء الكهربائية",
    groupEn: "ELECTRIC",
    sectionId: "electric",
    categories: ["electrical_system", "lights_rear", "exterior_lighting"]
  },
  {
    group: "ناقل الحركة",
    groupEn: "TRANSMISSION",
    sectionId: "transmission",
    categories: ["transmission_system"]
  },
  {
    group: "الشاصي",
    groupEn: "CHASSIS",
    sectionId: "chassis",
    categories: ["chassis_frame"]
  },
  {
    group: "أخرى",
    groupEn: "OTHER",
    sectionId: "other",
    categories: ["safety_systems", "tires_rims", "windows", "interior", "glass_mirrors", "accessories", "documentation"]
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
  return cat?.section || "other";
}

export function getSectionById(id: string) {
  return MAIN_SECTIONS.find(s => s.id === id);
}

export function getCategoriesBySection(sectionId: string) {
  return INSPECTION_CATEGORIES.filter(c => c.section === sectionId);
}
