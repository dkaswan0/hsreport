// ==============================================================================
// High Safety International Center - Core 6 Main Inspection Sections System
// ==============================================================================

export interface MainSectionDef {
  id: string;
  label: string;
  labelEn: string;
  iconName: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  description: string;
  sortOrder: number;
}

/**
 * The 6 Canonical Main Sections of High Safety Report
 */
export const MAIN_SECTIONS: MainSectionDef[] = [
  {
    id: "mechanical",
    label: "ميكانيكا",
    labelEn: "Mechanical",
    iconName: "wrench",
    color: "#3b82f6",
    badgeBg: "bg-blue-500/15",
    badgeBorder: "border-blue-500/30",
    badgeText: "text-blue-400",
    description: "المحرك، التبريد، الفرامل، التوجيه، العادم، السيور والفلاتر",
    sortOrder: 1,
  },
  {
    id: "exterior_body",
    label: "الهيكل الخارجي",
    labelEn: "Exterior Body",
    iconName: "car-profile",
    color: "#f59e0b",
    badgeBg: "bg-amber-500/15",
    badgeBorder: "border-amber-500/30",
    badgeText: "text-amber-400",
    description: "الصدمات، الأبواب، الرفارف، الكبوت، الشنطة، الزجاج، والدهان",
    sortOrder: 2,
  },
  {
    id: "electrical_electronics",
    label: "الأجزاء الكهربائية والإلكترونية",
    labelEn: "Electrical & Electronics",
    iconName: "lightning",
    color: "#eab308",
    badgeBg: "bg-yellow-500/15",
    badgeBorder: "border-yellow-500/30",
    badgeText: "text-yellow-400",
    description: "البطارية، الدينامو، الحساسات، الأنوار، المكيف، والكمبيوتر",
    sortOrder: 3,
  },
  {
    id: "transmission",
    label: "نقل الحركة",
    labelEn: "Transmission",
    iconName: "gear-six",
    color: "#8b5cf6",
    badgeBg: "bg-purple-500/15",
    badgeBorder: "border-purple-500/30",
    badgeText: "text-purple-400",
    description: "القير، الكلتش، الدبل، الدفرنس، العكوس، وعمود الكردان",
    sortOrder: 4,
  },
  {
    id: "chassis",
    label: "الشاصي (الهيكل السفلي)",
    labelEn: "Chassis (Underbody)",
    iconName: "shield-check",
    color: "#ef4444",
    badgeBg: "bg-rose-500/15",
    badgeBorder: "border-rose-500/30",
    badgeText: "text-rose-400",
    description: "جسور الشاصي، الشاصي الأمامي والخلفي، القوائم، والمقصات",
    sortOrder: 5,
  },
  {
    id: "other",
    label: "أخرى",
    labelEn: "Other",
    iconName: "dots-three-circle",
    color: "#6b7280",
    badgeBg: "bg-zinc-500/15",
    badgeBorder: "border-zinc-500/30",
    badgeText: "text-zinc-400",
    description: "الإطارات والجنوط، الملحقات، الداخلية، والسلامة العامة",
    sortOrder: 6,
  },
];

/**
 * Safe Mapping: Maps any legacy category or section to one of the 6 canonical Main Sections.
 * Ensures that 100% of old inspections and fault library items resolve accurately.
 */
export function mapLegacyCategoryToMainSection(categoryOrSection?: string | null): string {
  if (!categoryOrSection) return "other";
  const raw = categoryOrSection.toLowerCase().trim();

  // 1. Direct match with new canonical IDs
  if (raw === "mechanical" || raw === "mechanic") return "mechanical";
  if (raw === "exterior_body" || raw === "body" || raw === "exterior") return "exterior_body";
  if (raw === "electrical_electronics" || raw === "electric" || raw === "electrical") return "electrical_electronics";
  if (raw === "transmission" || raw === "gearbox") return "transmission";
  if (raw === "chassis" || raw === "underbody" || raw === "frame") return "chassis";
  if (raw === "other" || raw === "interior" || raw === "misc") return "other";

  // 2. Arabic name mappings
  if (raw.includes("ميكانيك") || raw.includes("محرك") || raw.includes("فرامل") || raw.includes("تبريد") || raw.includes("توجيه") || raw.includes("عادم") || raw.includes("سيور")) {
    return "mechanical";
  }
  if (raw.includes("هيكل خارجي") || raw.includes("صدم") || raw.includes("باب") || raw.includes("رفرف") || raw.includes("كبوت") || raw.includes("شنطة") || raw.includes("دعامية") || raw.includes("دهان") || raw.includes("رش") || raw.includes("سمكرة") || raw.includes("زجاج")) {
    return "exterior_body";
  }
  if (raw.includes("كهرب") || raw.includes("إلكترون") || raw.includes("بطارية") || raw.includes("دينامو") || raw.includes("حساس") || raw.includes("نور") || raw.includes("أنوار") || raw.includes("مكيف") || raw.includes("كمبيوتر") || raw.includes("ضفيرة")) {
    return "electrical_electronics";
  }
  if (raw.includes("نقل الحركة") || raw.includes("قير") || raw.includes("جير") || raw.includes("كلتش") || raw.includes("دبل") || raw.includes("دفرنس") || raw.includes("عكوس") || raw.includes("كردان") || raw.includes("تعشيق")) {
    return "transmission";
  }
  if (raw.includes("شاص") || raw.includes("هيكل سفلي") || raw.includes("مقص") || raw.includes("جسر") || raw.includes("قائم") || raw.includes("لحام") || raw.includes("قص")) {
    return "chassis";
  }

  // 3. Legacy category ID map
  const legacyMap: Record<string, string> = {
    engine: "mechanical",
    suspension_system: "chassis",
    steering_system: "mechanical",
    brake_system: "mechanical",
    fuel_exhaust: "mechanical",
    ac_cooling: "mechanical",
    misc_mechanical: "mechanical",

    transmission_auto: "transmission",
    transmission_manual: "transmission",
    transmission_performance: "transmission",
    transmission_sounds: "transmission",
    transmission_leaks: "transmission",
    transmission_shifting: "transmission",

    door_front_left: "exterior_body",
    door_front_right: "exterior_body",
    door_rear_left: "exterior_body",
    door_rear_right: "exterior_body",
    hood: "exterior_body",
    trunk: "exterior_body",
    fender_front_left: "exterior_body",
    fender_front_right: "exterior_body",
    fender_rear_left: "exterior_body",
    fender_rear_right: "exterior_body",
    quarter_panel_left: "exterior_body",
    quarter_panel_right: "exterior_body",
    roof: "exterior_body",
    pillars: "exterior_body",
    front_chest: "exterior_body",
    rear_chest: "exterior_body",
    front_bumper: "exterior_body",
    rear_bumper: "exterior_body",
    bumper_frame_front: "exterior_body",
    bumper_frame_rear: "exterior_body",
    fender_front: "exterior_body",
    fender_rear: "exterior_body",

    chassis_frame: "chassis",
    chassis_alignment: "chassis",
    chassis_welding: "chassis",
    chassis_accident: "chassis",

    electrical_system: "electrical_electronics",
    battery: "electrical_electronics",
    exterior_lighting: "electrical_electronics",
    lights_front: "electrical_electronics",
    lights_rear: "electrical_electronics",
    wire_harness: "electrical_electronics",
    mirror_controls: "electrical_electronics",
    computer_sensors: "electrical_electronics",

    interior: "other",
    safety_systems: "other",
    tires_rims: "other",
    windows: "exterior_body",
    mirrors: "exterior_body",
    accessories: "other",
    documentation: "other",
  };

  return legacyMap[raw] || "other";
}

/**
 * Intelligent section suggestion for search faults based on technical terms
 */
export function suggestMainSectionForFault(faultName: string, existingCategory?: string): string {
  if (existingCategory) {
    const mapped = mapLegacyCategoryToMainSection(existingCategory);
    if (mapped !== "other") return mapped;
  }

  const text = (faultName || "").toLowerCase();

  if (text.includes("قير") || text.includes("جير") || text.includes("transmission") || text.includes("كلتش") || text.includes("clutch") || text.includes("دبل") || text.includes("دفرنس") || text.includes("عكوس") || text.includes("كردان") || text.includes("تعشيق")) {
    return "transmission";
  }
  if (text.includes("شاص") || text.includes("chassis") || text.includes("مقص") || text.includes("لحام") || text.includes("قص") || text.includes("استقامة") || text.includes("جسور") || text.includes("قائم")) {
    return "chassis";
  }
  if (text.includes("باب") || text.includes("رفرف") || text.includes("كبوت") || text.includes("شنطة") || text.includes("دعامية") || text.includes("صدام") || text.includes("رش") || text.includes("سمكرة") || text.includes("خدش") || text.includes("صدم") || text.includes("دهان") || text.includes("fender") || text.includes("bumper") || text.includes("hood") || text.includes("door") || text.includes("paint") || text.includes("scratch")) {
    return "exterior_body";
  }
  if (text.includes("كهرب") || text.includes("بطارية") || text.includes("battery") || text.includes("دينامو") || text.includes("alternator") || text.includes("حساس") || text.includes("sensor") || text.includes("نور") || text.includes("light") || text.includes("مكيف") || text.includes("ac") || text.includes("كمبيوتر") || text.includes("ecu") || text.includes("ضفيرة") || text.includes("فيوز")) {
    return "electrical_electronics";
  }
  if (text.includes("زيت") || text.includes("oil") || text.includes("تهريب") || text.includes("ترشيح") || text.includes("leak") || text.includes("محرك") || text.includes("engine") || text.includes("فرامل") || text.includes("brake") || text.includes("رديتر") || text.includes("radiator") || text.includes("حرارة") || text.includes("سير") || text.includes("belt") || text.includes("عادم") || text.includes("exhaust") || text.includes("فلتر") || text.includes("filter") || text.includes("بواجي") || text.includes("spark")) {
    return "mechanical";
  }

  return "other";
}

export function getMainSectionById(id: string): MainSectionDef {
  const canonicalId = mapLegacyCategoryToMainSection(id);
  const found = MAIN_SECTIONS.find((s) => s.id === canonicalId);
  return (
    found || {
      id: canonicalId,
      label: "أخرى",
      labelEn: "Other",
      iconName: "dots-three-circle",
      color: "#6b7280",
      badgeBg: "bg-zinc-500/15",
      badgeBorder: "border-zinc-500/30",
      badgeText: "text-zinc-400",
      description: "فحص عام",
      sortOrder: 99,
    }
  );
}

export function getSectionLabel(id: string): string {
  return getMainSectionById(id).label;
}

export function getSectionLabelEn(id: string): string {
  return getMainSectionById(id).labelEn;
}

// Backward compatibility legacy arrays for any legacy import references
export const INSPECTION_CATEGORIES = MAIN_SECTIONS.map((s) => ({
  id: s.id,
  label: s.label,
  labelEn: s.labelEn,
  section: s.id,
}));

export const CATEGORY_GROUPS = MAIN_SECTIONS.map((s) => ({
  group: s.label,
  groupEn: s.labelEn,
  sectionId: s.id,
  categories: [s.id],
}));

export function getCategoryById(id: string) {
  return getMainSectionById(id);
}

export function getCategoryLabel(id: string): string {
  return getMainSectionById(id).label;
}

export function getCategoryLabelEn(id: string): string {
  return getMainSectionById(id).labelEn;
}

export function getCategorySection(id: string): string {
  return mapLegacyCategoryToMainSection(id);
}

export function getSectionById(id: string) {
  return getMainSectionById(id);
}

export function getCategoriesBySection(sectionId: string) {
  return [getMainSectionById(sectionId)];
}
