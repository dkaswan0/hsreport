export const INSPECTION_CATEGORIES = [
  { id: "front_bumper", label: "الدعامية الأمامية", labelEn: "Front Bumper" },
  { id: "rear_bumper", label: "الدعامية الخلفية", labelEn: "Rear Bumper" },
  { id: "bumper_frame_front", label: "جسر الدعامية الأمامية", labelEn: "Front Bumper Frame" },
  { id: "bumper_frame_rear", label: "جسر الدعامية الخلفية", labelEn: "Rear Bumper Frame" },
  { id: "hood", label: "البونيت", labelEn: "Hood" },
  { id: "front_chest", label: "صدر السيارة الأمامي", labelEn: "Front Frame" },
  { id: "rear_chest", label: "صدر السيارة الخلفي", labelEn: "Rear Frame" },
  { id: "fender_front_right", label: "المدقار الأمامي يمين", labelEn: "Front Right Fender" },
  { id: "fender_front_left", label: "المدقار الأمامي يسار", labelEn: "Front Left Fender" },
  { id: "fender_rear_right", label: "المدقار الخلفي يمين", labelEn: "Rear Right Fender" },
  { id: "fender_rear_left", label: "المدقار الخلفي يسار", labelEn: "Rear Left Fender" },
  { id: "door_front_right", label: "الباب الأمامي يمين", labelEn: "Front Right Door" },
  { id: "door_front_left", label: "الباب الأمامي يسار", labelEn: "Front Left Door" },
  { id: "door_rear_right", label: "الباب الخلفي يمين", labelEn: "Rear Right Door" },
  { id: "door_rear_left", label: "الباب الخلفي يسار", labelEn: "Rear Left Door" },
  { id: "trunk", label: "الدبة", labelEn: "Trunk" },
  { id: "quarter_panel", label: "الفخد", labelEn: "Quarter Panel" },
  { id: "roof", label: "السقف", labelEn: "Roof" },
  { id: "pillars", label: "القوائم", labelEn: "Pillars" },
  { id: "windows", label: "الجامات", labelEn: "Windows" },
  { id: "lights_front", label: "الليتات الأمامية", labelEn: "Front Lights" },
  { id: "lights_rear", label: "الليتات الخلفية", labelEn: "Rear Lights" },
  { id: "interior", label: "الداخلية", labelEn: "Interior" },
  { id: "chassis", label: "الشاصي", labelEn: "Chassis" },
  { id: "engine", label: "الماكينة", labelEn: "Engine" },
  { id: "transmission", label: "القير", labelEn: "Transmission" },
  { id: "transfer_case", label: "الدبل", labelEn: "Transfer Case" },
  { id: "differential", label: "الديفرايشن", labelEn: "Differential" },
  { id: "driveshaft", label: "الشافت", labelEn: "Driveshaft" },
  { id: "condenser", label: "الكوندنسر", labelEn: "Condenser" },
  { id: "radiator", label: "الردياتر", labelEn: "Radiator" },
  { id: "cooling_fan", label: "المروحة", labelEn: "Cooling Fan" },
  { id: "turbo", label: "التيربو", labelEn: "Turbo" },
  { id: "water_pump", label: "الوتربمب", labelEn: "Water Pump" },
  { id: "thermostat", label: "الترموستات", labelEn: "Thermostat" },
  { id: "control_arms", label: "الجانبينات", labelEn: "Control Arms" },
  { id: "exhaust", label: "الاكزوز", labelEn: "Exhaust" },
  { id: "tires", label: "التواير", labelEn: "Tires" },
  { id: "rims", label: "الرنقات", labelEn: "Rims" },
  { id: "brake_pads", label: "السفايف", labelEn: "Brake Pads" },
  { id: "brake_drums", label: "الدرامات", labelEn: "Brake Drums" },
  { id: "brakes", label: "البريك", labelEn: "Brakes" },
  { id: "suspension_arms", label: "الشيالات", labelEn: "Suspension Arms" },
  { id: "axles", label: "الاكسلات", labelEn: "Axles" },
  { id: "fuel_tank", label: "تانكي البترول", labelEn: "Fuel Tank" },
  { id: "power_steering", label: "البورستيرنق", labelEn: "Power Steering" },
  { id: "fuel_pump", label: "طرمبة البترول", labelEn: "Fuel Pump" },
  { id: "tie_rod", label: "التايررود", labelEn: "Tie Rod" },
  { id: "stabilizer_link", label: "الاستبلايزر لينك", labelEn: "Stabilizer Link" },
  // النظام الكهربائي
  { id: "battery", label: "البطارية", labelEn: "Battery" },
  { id: "charging_system", label: "الشارجنق سيستم", labelEn: "Charging System" },
  { id: "starting_system", label: "السلف", labelEn: "Starting System" },
  { id: "ignition_system", label: "الاشتعال", labelEn: "Ignition System" },
  { id: "ecu_computers", label: "الكمبيوتر", labelEn: "ECU & Computers" },
  { id: "sensors", label: "السنسرات", labelEn: "Sensors" },
  { id: "lighting", label: "الليتات", labelEn: "Lighting System" },
  { id: "wiring", label: "الوايرات", labelEn: "Wiring & Protection" },
  { id: "interior_electrical", label: "كهرباء الداخلية", labelEn: "Interior Electrical" },
  { id: "ac_electrical", label: "كهرباء المكيف", labelEn: "AC Electrical" },
  { id: "entertainment", label: "السيستم والشاشة", labelEn: "Entertainment & Info" },
  { id: "safety_systems", label: "السيفتي سيستم", labelEn: "Safety Systems" },
  { id: "driver_assist", label: "مساعدات السواقة", labelEn: "Driver Assistance" },
];

export const CATEGORY_GROUPS = [
  {
    group: "البودي",
    groupEn: "Exterior Body",
    categories: ["front_bumper", "rear_bumper", "bumper_frame_front", "bumper_frame_rear", "hood", "front_chest", "rear_chest", "fender_front_right", "fender_front_left", "fender_rear_right", "fender_rear_left", "door_front_right", "door_front_left", "door_rear_right", "door_rear_left", "trunk", "quarter_panel", "roof", "pillars", "windows", "lights_front", "lights_rear"]
  },
  {
    group: "الداخلية",
    groupEn: "Interior",
    categories: ["interior"]
  },
  {
    group: "الشاصي",
    groupEn: "Frame & Chassis",
    categories: ["chassis"]
  },
  {
    group: "الماكينة والقير",
    groupEn: "Engine & Drivetrain",
    categories: ["engine", "transmission", "transfer_case", "differential", "driveshaft"]
  },
  {
    group: "التبريد",
    groupEn: "Cooling System",
    categories: ["condenser", "radiator", "cooling_fan", "turbo", "water_pump", "thermostat"]
  },
  {
    group: "الاكزوز",
    groupEn: "Exhaust",
    categories: ["exhaust", "control_arms"]
  },
  {
    group: "التواير والبريك",
    groupEn: "Wheels & Brakes",
    categories: ["tires", "rims", "brake_pads", "brake_drums", "brakes"]
  },
  {
    group: "السسبنشن",
    groupEn: "Suspension",
    categories: ["suspension_arms", "axles", "tie_rod", "stabilizer_link"]
  },
  {
    group: "البترول والستيرنق",
    groupEn: "Fuel & Steering",
    categories: ["fuel_tank", "power_steering", "fuel_pump"]
  },
  {
    group: "الكهرباء",
    groupEn: "Electrical System",
    categories: ["battery", "charging_system", "starting_system", "ignition_system", "ecu_computers", "sensors", "lighting", "wiring", "interior_electrical", "ac_electrical", "entertainment", "safety_systems", "driver_assist"]
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
