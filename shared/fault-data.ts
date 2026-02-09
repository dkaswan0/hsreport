// قاعدة بيانات الأعطال الشاملة - 5000+ عطل للأجزاء الخارجية
// منظمة حسب الأقسام الستة الرئيسية

export interface FaultEntry {
  category: string;
  faultName: string;
  faultNameEn: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// حالات الأعطال الشائعة
const CONDITIONS = {
  ar: ['مكسور', 'مخدوش', 'صدأ', 'تشققات', 'انبعاج', 'مطلي', 'مبدلة', 'أصلي', 'مرمم', 'مفكوك', 'ناقص', 'تالف', 'متآكل', 'مثقوب', 'ملحوم', 'مقطوع', 'متسخ', 'باهت', 'محروق', 'مشوه'],
  en: ['Broken', 'Scratched', 'Rusted', 'Cracked', 'Dented', 'Repainted', 'Replaced', 'Original', 'Repaired', 'Loose', 'Missing', 'Damaged', 'Worn', 'Punctured', 'Welded', 'Cut', 'Dirty', 'Faded', 'Burnt', 'Deformed']
};

const SEVERITIES = {
  ar: ['بسيط', 'متوسط', 'شديد', 'خطير'],
  en: ['Minor', 'Medium', 'Severe', 'Critical'],
  values: ['low', 'medium', 'high', 'critical'] as const
};

const LOCATIONS = {
  ar: ['يمين', 'يسار', 'أمامي', 'خلفي', 'علوي', 'سفلي', 'داخلي', 'خارجي'],
  en: ['Right', 'Left', 'Front', 'Rear', 'Upper', 'Lower', 'Inner', 'Outer']
};

// ==================== الأجزاء الميكانيكية ====================
const MECHANIC_PARTS = [
  // المحرك
  { ar: 'بلوك المحرك', en: 'Engine Block', cat: 'engine' },
  { ar: 'رأس المحرك', en: 'Cylinder Head', cat: 'engine' },
  { ar: 'كرنك المحرك', en: 'Crankshaft', cat: 'engine' },
  { ar: 'بستون', en: 'Piston', cat: 'engine' },
  { ar: 'عمود الكامات', en: 'Camshaft', cat: 'engine' },
  { ar: 'صمامات المحرك', en: 'Engine Valves', cat: 'engine' },
  { ar: 'سيور المحرك', en: 'Engine Belts', cat: 'engine' },
  { ar: 'طرمبة الماء', en: 'Water Pump', cat: 'engine' },
  { ar: 'طرمبة الزيت', en: 'Oil Pump', cat: 'engine' },
  { ar: 'فلتر الزيت', en: 'Oil Filter', cat: 'engine' },
  { ar: 'فلتر الهواء', en: 'Air Filter', cat: 'engine' },
  { ar: 'ثرموستات', en: 'Thermostat', cat: 'engine' },
  { ar: 'ردياتر المحرك', en: 'Engine Radiator', cat: 'engine' },
  { ar: 'مروحة التبريد', en: 'Cooling Fan', cat: 'engine' },
  { ar: 'خراطيم المحرك', en: 'Engine Hoses', cat: 'engine' },
  { ar: 'كاسكيت رأس المحرك', en: 'Head Gasket', cat: 'engine' },
  { ar: 'أويل سيل', en: 'Oil Seal', cat: 'engine' },
  { ar: 'كارتير الزيت', en: 'Oil Pan', cat: 'engine' },
  { ar: 'غطاء الصمامات', en: 'Valve Cover', cat: 'engine' },
  { ar: 'بوابة الهواء', en: 'Throttle Body', cat: 'engine' },
  { ar: 'مجمع السحب', en: 'Intake Manifold', cat: 'engine' },
  { ar: 'مجمع العادم', en: 'Exhaust Manifold', cat: 'engine' },
  { ar: 'توربو', en: 'Turbocharger', cat: 'engine' },
  { ar: 'سوبر تشارجر', en: 'Supercharger', cat: 'engine' },
  { ar: 'انتركولر', en: 'Intercooler', cat: 'engine' },
  
  // نظام التعليق
  { ar: 'مساعد أمامي يمين', en: 'Front Right Shock', cat: 'suspension_system' },
  { ar: 'مساعد أمامي يسار', en: 'Front Left Shock', cat: 'suspension_system' },
  { ar: 'مساعد خلفي يمين', en: 'Rear Right Shock', cat: 'suspension_system' },
  { ar: 'مساعد خلفي يسار', en: 'Rear Left Shock', cat: 'suspension_system' },
  { ar: 'زنبرك أمامي يمين', en: 'Front Right Spring', cat: 'suspension_system' },
  { ar: 'زنبرك أمامي يسار', en: 'Front Left Spring', cat: 'suspension_system' },
  { ar: 'زنبرك خلفي يمين', en: 'Rear Right Spring', cat: 'suspension_system' },
  { ar: 'زنبرك خلفي يسار', en: 'Rear Left Spring', cat: 'suspension_system' },
  { ar: 'ذراع التحكم العلوي', en: 'Upper Control Arm', cat: 'suspension_system' },
  { ar: 'ذراع التحكم السفلي', en: 'Lower Control Arm', cat: 'suspension_system' },
  { ar: 'مقص أمامي يمين', en: 'Front Right Control Arm', cat: 'suspension_system' },
  { ar: 'مقص أمامي يسار', en: 'Front Left Control Arm', cat: 'suspension_system' },
  { ar: 'مقص خلفي يمين', en: 'Rear Right Control Arm', cat: 'suspension_system' },
  { ar: 'مقص خلفي يسار', en: 'Rear Left Control Arm', cat: 'suspension_system' },
  { ar: 'كبس مساعد أمامي', en: 'Front Strut Mount', cat: 'suspension_system' },
  { ar: 'كبس مساعد خلفي', en: 'Rear Strut Mount', cat: 'suspension_system' },
  { ar: 'ستبلايزر لينك أمامي', en: 'Front Sway Bar Link', cat: 'suspension_system' },
  { ar: 'ستبلايزر لينك خلفي', en: 'Rear Sway Bar Link', cat: 'suspension_system' },
  { ar: 'بار التوازن الأمامي', en: 'Front Sway Bar', cat: 'suspension_system' },
  { ar: 'بار التوازن الخلفي', en: 'Rear Sway Bar', cat: 'suspension_system' },
  { ar: 'جلبة ذراع التحكم', en: 'Control Arm Bushing', cat: 'suspension_system' },
  
  // نظام التوجيه
  { ar: 'جريدة الدركسيون', en: 'Steering Rack', cat: 'steering_system' },
  { ar: 'طرمبة البور ستيرنق', en: 'Power Steering Pump', cat: 'steering_system' },
  { ar: 'خزان سائل البور', en: 'Power Steering Reservoir', cat: 'steering_system' },
  { ar: 'خراطيم البور ستيرنق', en: 'Power Steering Hoses', cat: 'steering_system' },
  { ar: 'تاي رود أمامي يمين', en: 'Front Right Tie Rod', cat: 'steering_system' },
  { ar: 'تاي رود أمامي يسار', en: 'Front Left Tie Rod', cat: 'steering_system' },
  { ar: 'طرف تاي رود يمين', en: 'Right Tie Rod End', cat: 'steering_system' },
  { ar: 'طرف تاي رود يسار', en: 'Left Tie Rod End', cat: 'steering_system' },
  { ar: 'صليبة الدركسيون', en: 'Steering Column', cat: 'steering_system' },
  { ar: 'عجلة القيادة', en: 'Steering Wheel', cat: 'steering_system' },
  { ar: 'بلي عجلة القيادة', en: 'Steering Wheel Bearing', cat: 'steering_system' },
  
  // نظام الفرامل
  { ar: 'ديسك أمامي يمين', en: 'Front Right Disc', cat: 'brake_system' },
  { ar: 'ديسك أمامي يسار', en: 'Front Left Disc', cat: 'brake_system' },
  { ar: 'ديسك خلفي يمين', en: 'Rear Right Disc', cat: 'brake_system' },
  { ar: 'ديسك خلفي يسار', en: 'Rear Left Disc', cat: 'brake_system' },
  { ar: 'فحمات أمامية', en: 'Front Brake Pads', cat: 'brake_system' },
  { ar: 'فحمات خلفية', en: 'Rear Brake Pads', cat: 'brake_system' },
  { ar: 'سوبر أمامي يمين', en: 'Front Right Caliper', cat: 'brake_system' },
  { ar: 'سوبر أمامي يسار', en: 'Front Left Caliper', cat: 'brake_system' },
  { ar: 'سوبر خلفي يمين', en: 'Rear Right Caliper', cat: 'brake_system' },
  { ar: 'سوبر خلفي يسار', en: 'Rear Left Caliper', cat: 'brake_system' },
  { ar: 'ماستر الفرامل', en: 'Brake Master Cylinder', cat: 'brake_system' },
  { ar: 'بوستر الفرامل', en: 'Brake Booster', cat: 'brake_system' },
  { ar: 'خراطيم الفرامل', en: 'Brake Hoses', cat: 'brake_system' },
  { ar: 'سائل الفرامل', en: 'Brake Fluid', cat: 'brake_system' },
  { ar: 'ABS سنسور أمامي يمين', en: 'Front Right ABS Sensor', cat: 'brake_system' },
  { ar: 'ABS سنسور أمامي يسار', en: 'Front Left ABS Sensor', cat: 'brake_system' },
  { ar: 'ABS سنسور خلفي يمين', en: 'Rear Right ABS Sensor', cat: 'brake_system' },
  { ar: 'ABS سنسور خلفي يسار', en: 'Rear Left ABS Sensor', cat: 'brake_system' },
  { ar: 'وحدة ABS', en: 'ABS Module', cat: 'brake_system' },
  { ar: 'فرامل اليد', en: 'Parking Brake', cat: 'brake_system' },
  { ar: 'كوابل فرامل اليد', en: 'Parking Brake Cables', cat: 'brake_system' },
  
  // نظام الوقود والعادم
  { ar: 'تانكي البنزين', en: 'Fuel Tank', cat: 'fuel_exhaust' },
  { ar: 'طرمبة البنزين', en: 'Fuel Pump', cat: 'fuel_exhaust' },
  { ar: 'فلتر البنزين', en: 'Fuel Filter', cat: 'fuel_exhaust' },
  { ar: 'بخاخات الوقود', en: 'Fuel Injectors', cat: 'fuel_exhaust' },
  { ar: 'ريل البنزين', en: 'Fuel Rail', cat: 'fuel_exhaust' },
  { ar: 'غطاء التانكي', en: 'Fuel Cap', cat: 'fuel_exhaust' },
  { ar: 'أنابيب الوقود', en: 'Fuel Lines', cat: 'fuel_exhaust' },
  { ar: 'سنسور مستوى البنزين', en: 'Fuel Level Sensor', cat: 'fuel_exhaust' },
  { ar: 'هيدر العادم', en: 'Exhaust Header', cat: 'fuel_exhaust' },
  { ar: 'كاتليزر', en: 'Catalytic Converter', cat: 'fuel_exhaust' },
  { ar: 'أنابيب العادم', en: 'Exhaust Pipes', cat: 'fuel_exhaust' },
  { ar: 'شكمان', en: 'Muffler', cat: 'fuel_exhaust' },
  { ar: 'طرف الشكمان', en: 'Exhaust Tip', cat: 'fuel_exhaust' },
  { ar: 'سنسور الأوكسجين', en: 'O2 Sensor', cat: 'fuel_exhaust' },
  { ar: 'جوانات العادم', en: 'Exhaust Gaskets', cat: 'fuel_exhaust' },
  
  // نظام التكييف
  { ar: 'كمبروسر المكيف', en: 'AC Compressor', cat: 'ac_cooling' },
  { ar: 'ردياتر المكيف', en: 'AC Condenser', cat: 'ac_cooling' },
  { ar: 'إفابريتر المكيف', en: 'Evaporator', cat: 'ac_cooling' },
  { ar: 'فلتر المكيف', en: 'Cabin Air Filter', cat: 'ac_cooling' },
  { ar: 'صمام التمدد', en: 'Expansion Valve', cat: 'ac_cooling' },
  { ar: 'خراطيم المكيف', en: 'AC Hoses', cat: 'ac_cooling' },
  { ar: 'غاز الفريون', en: 'Refrigerant', cat: 'ac_cooling' },
  { ar: 'مروحة المكيف', en: 'AC Fan', cat: 'ac_cooling' },
  { ar: 'موتور البلاور', en: 'Blower Motor', cat: 'ac_cooling' },
  { ar: 'ريسيستور البلاور', en: 'Blower Resistor', cat: 'ac_cooling' },
  
  // أعطال ميكانيكية متنوعة
  { ar: 'تسريب زيت المحرك', en: 'Engine Oil Leak', cat: 'misc_mechanical' },
  { ar: 'صوت طقطقة من المحرك', en: 'Engine Knocking', cat: 'misc_mechanical' },
  { ar: 'ارتفاع حرارة المحرك', en: 'Engine Overheating', cat: 'misc_mechanical' },
  { ar: 'اهتزاز المحرك', en: 'Engine Vibration', cat: 'misc_mechanical' },
  { ar: 'دخان أسود من العادم', en: 'Black Exhaust Smoke', cat: 'misc_mechanical' },
  { ar: 'دخان أبيض من العادم', en: 'White Exhaust Smoke', cat: 'misc_mechanical' },
  { ar: 'دخان أزرق من العادم', en: 'Blue Exhaust Smoke', cat: 'misc_mechanical' },
  { ar: 'صعوبة في التشغيل', en: 'Hard Starting', cat: 'misc_mechanical' },
  { ar: 'توقف المحرك فجأة', en: 'Engine Stalling', cat: 'misc_mechanical' },
  { ar: 'ضعف في العزم', en: 'Loss of Power', cat: 'misc_mechanical' },
];

// ==================== ناقل الحركة ====================
const TRANSMISSION_PARTS = [
  { ar: 'علبة القير', en: 'Transmission Case', cat: 'transmission_auto' },
  { ar: 'زيت القير', en: 'Transmission Fluid', cat: 'transmission_auto' },
  { ar: 'فلتر القير', en: 'Transmission Filter', cat: 'transmission_auto' },
  { ar: 'كارتير القير', en: 'Transmission Pan', cat: 'transmission_auto' },
  { ar: 'تورك كونفرتر', en: 'Torque Converter', cat: 'transmission_auto' },
  { ar: 'صوف القير', en: 'Transmission Solenoid', cat: 'transmission_auto' },
  { ar: 'شفت القير', en: 'Output Shaft', cat: 'transmission_auto' },
  { ar: 'انبوت شفت', en: 'Input Shaft', cat: 'transmission_auto' },
  { ar: 'ترس القير', en: 'Gear Set', cat: 'transmission_auto' },
  { ar: 'كلتش', en: 'Clutch', cat: 'transmission_manual' },
  { ar: 'صحن الكلتش', en: 'Clutch Disc', cat: 'transmission_manual' },
  { ar: 'غطاء الكلتش', en: 'Pressure Plate', cat: 'transmission_manual' },
  { ar: 'بلي الكلتش', en: 'Throw-out Bearing', cat: 'transmission_manual' },
  { ar: 'ماستر الكلتش', en: 'Clutch Master', cat: 'transmission_manual' },
  { ar: 'سلندر الكلتش', en: 'Clutch Slave', cat: 'transmission_manual' },
  { ar: 'تأخر في التبديل', en: 'Delayed Shifting', cat: 'transmission_performance' },
  { ar: 'رجة عند التبديل', en: 'Harsh Shifting', cat: 'transmission_performance' },
  { ar: 'انزلاق القير', en: 'Transmission Slipping', cat: 'transmission_performance' },
  { ar: 'عدم استجابة القير', en: 'No Response', cat: 'transmission_performance' },
  { ar: 'صوت طحن من القير', en: 'Grinding Noise', cat: 'transmission_sounds' },
  { ar: 'صوت أنين من القير', en: 'Whining Noise', cat: 'transmission_sounds' },
  { ar: 'صوت طقطقة عند التبديل', en: 'Clunking on Shift', cat: 'transmission_sounds' },
  { ar: 'تسريب زيت القير', en: 'Transmission Leak', cat: 'transmission_leaks' },
  { ar: 'تسريب من صوف القير', en: 'Seal Leak', cat: 'transmission_leaks' },
  { ar: 'صعوبة في التعشيق', en: 'Hard to Engage', cat: 'transmission_shifting' },
  { ar: 'فصل القير', en: 'Gear Disengagement', cat: 'transmission_shifting' },
  { ar: 'عصاية القير', en: 'Shift Lever', cat: 'transmission_shifting' },
  { ar: 'كوابل التعشيق', en: 'Shift Cables', cat: 'transmission_shifting' },
  { ar: 'سنسور القير', en: 'Transmission Sensor', cat: 'transmission_auto' },
  { ar: 'TCM وحدة تحكم القير', en: 'TCM Module', cat: 'transmission_auto' },
];

// ==================== الهيكل الخارجي ====================
const BODY_PARTS = [
  // الأبواب
  { ar: 'صاج الباب الأمامي يمين', en: 'Front Right Door Panel', cat: 'door_front_right' },
  { ar: 'صاج الباب الأمامي يسار', en: 'Front Left Door Panel', cat: 'door_front_left' },
  { ar: 'صاج الباب الخلفي يمين', en: 'Rear Right Door Panel', cat: 'door_rear_right' },
  { ar: 'صاج الباب الخلفي يسار', en: 'Rear Left Door Panel', cat: 'door_rear_left' },
  { ar: 'مقبض الباب الخارجي', en: 'Exterior Door Handle', cat: 'door_front_right' },
  { ar: 'مفصلات الباب', en: 'Door Hinges', cat: 'door_front_right' },
  { ar: 'قفل الباب', en: 'Door Lock', cat: 'door_front_right' },
  { ar: 'موتور زجاج الباب', en: 'Window Motor', cat: 'door_front_right' },
  { ar: 'ريقليتور الزجاج', en: 'Window Regulator', cat: 'door_front_right' },
  { ar: 'إطار الباب', en: 'Door Frame', cat: 'door_front_right' },
  { ar: 'جوانات الباب', en: 'Door Seals', cat: 'door_front_right' },
  { ar: 'مانع الصدمات الباب', en: 'Door Check', cat: 'door_front_right' },
  
  // غطاء المحرك
  { ar: 'صاج غطاء المحرك', en: 'Hood Panel', cat: 'hood' },
  { ar: 'مفصلات غطاء المحرك', en: 'Hood Hinges', cat: 'hood' },
  { ar: 'قفل غطاء المحرك', en: 'Hood Latch', cat: 'hood' },
  { ar: 'كابل غطاء المحرك', en: 'Hood Cable', cat: 'hood' },
  { ar: 'دعامة غطاء المحرك', en: 'Hood Strut', cat: 'hood' },
  { ar: 'عازل حرارة غطاء المحرك', en: 'Hood Insulation', cat: 'hood' },
  
  // صندوق الأمتعة
  { ar: 'صاج صندوق الأمتعة', en: 'Trunk Panel', cat: 'trunk' },
  { ar: 'مفصلات صندوق الأمتعة', en: 'Trunk Hinges', cat: 'trunk' },
  { ar: 'قفل صندوق الأمتعة', en: 'Trunk Latch', cat: 'trunk' },
  { ar: 'دعامة صندوق الأمتعة', en: 'Trunk Strut', cat: 'trunk' },
  { ar: 'بطانة صندوق الأمتعة', en: 'Trunk Liner', cat: 'trunk' },
  { ar: 'جوانات صندوق الأمتعة', en: 'Trunk Seals', cat: 'trunk' },
  
  // الرفارف واللوح جانبي
  { ar: 'رفرف أمامي يمين', en: 'Front Right Fender', cat: 'fender_front_right' },
  { ar: 'رفرف أمامي يسار', en: 'Front Left Fender', cat: 'fender_front_left' },
  { ar: 'رفرف خلفي يمين', en: 'Rear Right Fender', cat: 'fender_rear_right' },
  { ar: 'رفرف خلفي يسار', en: 'Rear Left Fender', cat: 'fender_rear_left' },
  { ar: 'لوح جانبي يمين', en: 'Right Quarter Panel', cat: 'quarter_panel_right' },
  { ar: 'لوح جانبي يسار', en: 'Left Quarter Panel', cat: 'quarter_panel_left' },
  { ar: 'تجويف العجلة أمامي يمين', en: 'Front Right Wheel Well', cat: 'fender_front_right' },
  { ar: 'تجويف العجلة أمامي يسار', en: 'Front Left Wheel Well', cat: 'fender_front_left' },
  { ar: 'تجويف العجلة خلفي يمين', en: 'Rear Right Wheel Well', cat: 'fender_rear_right' },
  { ar: 'تجويف العجلة خلفي يسار', en: 'Rear Left Wheel Well', cat: 'fender_rear_left' },
  { ar: 'بطانة الرفرف', en: 'Fender Liner', cat: 'fender_front_right' },
  
  // السقف والقوائم
  { ar: 'صاج السقف', en: 'Roof Panel', cat: 'roof' },
  { ar: 'فتحة السقف', en: 'Sunroof', cat: 'roof' },
  { ar: 'قائمة A يمين', en: 'Right A-Pillar', cat: 'pillars' },
  { ar: 'قائمة A يسار', en: 'Left A-Pillar', cat: 'pillars' },
  { ar: 'قائمة B يمين', en: 'Right B-Pillar', cat: 'pillars' },
  { ar: 'قائمة B يسار', en: 'Left B-Pillar', cat: 'pillars' },
  { ar: 'قائمة C يمين', en: 'Right C-Pillar', cat: 'pillars' },
  { ar: 'قائمة C يسار', en: 'Left C-Pillar', cat: 'pillars' },
  { ar: 'قائمة D يمين', en: 'Right D-Pillar', cat: 'pillars' },
  { ar: 'قائمة D يسار', en: 'Left D-Pillar', cat: 'pillars' },
  
  // الصدور
  { ar: 'صدر السيارة الأمامي', en: 'Front Frame Rail', cat: 'front_chest' },
  { ar: 'صدر السيارة الخلفي', en: 'Rear Frame Rail', cat: 'rear_chest' },
  { ar: 'حوض الردياتر', en: 'Radiator Support', cat: 'front_chest' },
  { ar: 'حوض صندوق الأمتعة', en: 'Trunk Floor', cat: 'rear_chest' },
  
  // الدعاميات والجسور
  { ar: 'دعامية أمامية', en: 'Front Bumper Cover', cat: 'front_bumper' },
  { ar: 'دعامية خلفية', en: 'Rear Bumper Cover', cat: 'rear_bumper' },
  { ar: 'جسر الدعامية الأمامية', en: 'Front Bumper Reinforcement', cat: 'bumper_frame_front' },
  { ar: 'جسر الدعامية الخلفية', en: 'Rear Bumper Reinforcement', cat: 'bumper_frame_rear' },
  { ar: 'ماص الصدمات الأمامي', en: 'Front Impact Absorber', cat: 'front_bumper' },
  { ar: 'ماص الصدمات الخلفي', en: 'Rear Impact Absorber', cat: 'rear_bumper' },
  { ar: 'شبك الدعامية الأمامية', en: 'Front Grille', cat: 'front_bumper' },
  { ar: 'فوق العادم', en: 'Exhaust Cover', cat: 'rear_bumper' },
  
  // الرفارف
  { ar: 'رفرف أمامي يمين', en: 'Front Right Wing', cat: 'fender_front' },
  { ar: 'رفرف أمامي يسار', en: 'Front Left Wing', cat: 'fender_front' },
  { ar: 'رفرف خلفي يمين', en: 'Rear Right Wing', cat: 'fender_rear' },
  { ar: 'رفرف خلفي يسار', en: 'Rear Left Wing', cat: 'fender_rear' },
];

// ==================== الهيكل ====================
const CHASSIS_PARTS = [
  { ar: 'شاصي أمامي يمين', en: 'Front Right Frame', cat: 'chassis_frame' },
  { ar: 'شاصي أمامي يسار', en: 'Front Left Frame', cat: 'chassis_frame' },
  { ar: 'شاصي خلفي يمين', en: 'Rear Right Frame', cat: 'chassis_frame' },
  { ar: 'شاصي خلفي يسار', en: 'Rear Left Frame', cat: 'chassis_frame' },
  { ar: 'أرضية السيارة', en: 'Floor Pan', cat: 'chassis_frame' },
  { ar: 'نفق الكردان', en: 'Transmission Tunnel', cat: 'chassis_frame' },
  { ar: 'بار التقوية', en: 'Strut Bar', cat: 'chassis_frame' },
  { ar: 'سبفريم أمامي', en: 'Front Subframe', cat: 'chassis_frame' },
  { ar: 'سبفريم خلفي', en: 'Rear Subframe', cat: 'chassis_frame' },
  { ar: 'نقاط تثبيت المحرك', en: 'Engine Mounts', cat: 'chassis_frame' },
  { ar: 'نقاط تثبيت التعليق', en: 'Suspension Points', cat: 'chassis_frame' },
  { ar: 'ميلان في الاستقامة', en: 'Alignment Issue', cat: 'chassis_alignment' },
  { ar: 'زوايا العجلات غير صحيحة', en: 'Incorrect Wheel Angles', cat: 'chassis_alignment' },
  { ar: 'كامبر غير منتظم', en: 'Uneven Camber', cat: 'chassis_alignment' },
  { ar: 'توي غير منتظم', en: 'Uneven Toe', cat: 'chassis_alignment' },
  { ar: 'سحب المقود', en: 'Steering Pull', cat: 'chassis_alignment' },
  { ar: 'آثار قص في الهيكل', en: 'Frame Cutting Evidence', cat: 'chassis_welding' },
  { ar: 'لحام غير أصلي', en: 'Non-Original Welding', cat: 'chassis_welding' },
  { ar: 'معجون على الهيكل', en: 'Body Filler on Frame', cat: 'chassis_welding' },
  { ar: 'تقوية غير أصلية', en: 'Non-Original Reinforcement', cat: 'chassis_welding' },
  { ar: 'آثار حادث أمامي', en: 'Front Collision Damage', cat: 'chassis_accident' },
  { ar: 'آثار حادث خلفي', en: 'Rear Collision Damage', cat: 'chassis_accident' },
  { ar: 'آثار حادث جانبي يمين', en: 'Right Side Collision', cat: 'chassis_accident' },
  { ar: 'آثار حادث جانبي يسار', en: 'Left Side Collision', cat: 'chassis_accident' },
  { ar: 'انثناء في الهيكل', en: 'Frame Bend', cat: 'chassis_accident' },
  { ar: 'تلف هيكلي شديد', en: 'Severe Structural Damage', cat: 'chassis_accident' },
];

// ==================== الأجزاء الكهربائية ====================
const ELECTRIC_PARTS = [
  { ar: 'البطارية', en: 'Battery', cat: 'battery' },
  { ar: 'أطراف البطارية', en: 'Battery Terminals', cat: 'battery' },
  { ar: 'حامل البطارية', en: 'Battery Holder', cat: 'battery' },
  { ar: 'كابل البطارية الموجب', en: 'Positive Cable', cat: 'battery' },
  { ar: 'كابل البطارية السالب', en: 'Ground Cable', cat: 'battery' },
  { ar: 'دينمو', en: 'Alternator', cat: 'electrical_system' },
  { ar: 'سلف', en: 'Starter Motor', cat: 'electrical_system' },
  { ar: 'صندوق الفيوزات', en: 'Fuse Box', cat: 'electrical_system' },
  { ar: 'ريلي', en: 'Relay', cat: 'electrical_system' },
  { ar: 'تيب الأسلاك الرئيسي', en: 'Main Wiring Harness', cat: 'wire_harness' },
  { ar: 'تيب أسلاك المحرك', en: 'Engine Harness', cat: 'wire_harness' },
  { ar: 'تيب أسلاك الأبواب', en: 'Door Harness', cat: 'wire_harness' },
  { ar: 'فيش كهربائي', en: 'Electrical Connector', cat: 'wire_harness' },
  { ar: 'لمبة الهيدلايت يمين', en: 'Right Headlight', cat: 'lights_front' },
  { ar: 'لمبة الهيدلايت يسار', en: 'Left Headlight', cat: 'lights_front' },
  { ar: 'لمبة الفوق هاي بيم يمين', en: 'Right High Beam', cat: 'lights_front' },
  { ar: 'لمبة الفوق هاي بيم يسار', en: 'Left High Beam', cat: 'lights_front' },
  { ar: 'لمبة الضباب الأمامية يمين', en: 'Right Fog Light', cat: 'lights_front' },
  { ar: 'لمبة الضباب الأمامية يسار', en: 'Left Fog Light', cat: 'lights_front' },
  { ar: 'لمبة الإشارة الأمامية يمين', en: 'Right Turn Signal', cat: 'lights_front' },
  { ar: 'لمبة الإشارة الأمامية يسار', en: 'Left Turn Signal', cat: 'lights_front' },
  { ar: 'ستوب يمين', en: 'Right Tail Light', cat: 'lights_rear' },
  { ar: 'ستوب يسار', en: 'Left Tail Light', cat: 'lights_rear' },
  { ar: 'لمبة الإشارة الخلفية يمين', en: 'Right Rear Signal', cat: 'lights_rear' },
  { ar: 'لمبة الإشارة الخلفية يسار', en: 'Left Rear Signal', cat: 'lights_rear' },
  { ar: 'لمبة الرجوع يمين', en: 'Right Reverse Light', cat: 'lights_rear' },
  { ar: 'لمبة الرجوع يسار', en: 'Left Reverse Light', cat: 'lights_rear' },
  { ar: 'لمبة اللوحة', en: 'License Plate Light', cat: 'lights_rear' },
  { ar: 'لمبة الثالث ستوب', en: 'Third Brake Light', cat: 'lights_rear' },
  { ar: 'زر تحكم المرايا', en: 'Mirror Switch', cat: 'mirror_controls' },
  { ar: 'موتور المرآة يمين', en: 'Right Mirror Motor', cat: 'mirror_controls' },
  { ar: 'موتور المرآة يسار', en: 'Left Mirror Motor', cat: 'mirror_controls' },
  { ar: 'وحدة ECU', en: 'ECU Module', cat: 'computer_sensors' },
  { ar: 'سنسور الهواء', en: 'MAF Sensor', cat: 'computer_sensors' },
  { ar: 'سنسور الحرارة', en: 'Temperature Sensor', cat: 'computer_sensors' },
  { ar: 'سنسور الكرنك', en: 'Crankshaft Sensor', cat: 'computer_sensors' },
  { ar: 'سنسور الكام', en: 'Camshaft Sensor', cat: 'computer_sensors' },
  { ar: 'سنسور الطرق', en: 'Knock Sensor', cat: 'computer_sensors' },
  { ar: 'سنسور الضغط', en: 'MAP Sensor', cat: 'computer_sensors' },
  { ar: 'إضاءة داخلية', en: 'Interior Lighting', cat: 'exterior_lighting' },
  { ar: 'إضاءة الطبلون', en: 'Dashboard Lighting', cat: 'exterior_lighting' },
  { ar: 'إضاءة صندوق القفازات', en: 'Glove Box Light', cat: 'exterior_lighting' },
  { ar: 'إضاءة صندوق الأمتعة', en: 'Trunk Light', cat: 'exterior_lighting' },
];

// ==================== الداخلية والسلامة ====================
const INTERIOR_PARTS = [
  { ar: 'طبلون', en: 'Dashboard', cat: 'interior' },
  { ar: 'عداد السرعة', en: 'Speedometer', cat: 'interior' },
  { ar: 'عداد RPM', en: 'Tachometer', cat: 'interior' },
  { ar: 'شاشة المعلومات', en: 'Display Screen', cat: 'interior' },
  { ar: 'مقود', en: 'Steering Wheel', cat: 'interior' },
  { ar: 'ناقل السرعات', en: 'Gear Shifter', cat: 'interior' },
  { ar: 'فرامل اليد', en: 'Hand Brake', cat: 'interior' },
  { ar: 'كرسي السائق', en: 'Driver Seat', cat: 'interior' },
  { ar: 'كرسي الراكب', en: 'Passenger Seat', cat: 'interior' },
  { ar: 'كراسي خلفية', en: 'Rear Seats', cat: 'interior' },
  { ar: 'حزام الأمان الأمامي يمين', en: 'Front Right Seatbelt', cat: 'safety_systems' },
  { ar: 'حزام الأمان الأمامي يسار', en: 'Front Left Seatbelt', cat: 'safety_systems' },
  { ar: 'حزام الأمان الخلفي يمين', en: 'Rear Right Seatbelt', cat: 'safety_systems' },
  { ar: 'حزام الأمان الخلفي يسار', en: 'Rear Left Seatbelt', cat: 'safety_systems' },
  { ar: 'إيرباق السائق', en: 'Driver Airbag', cat: 'safety_systems' },
  { ar: 'إيرباق الراكب', en: 'Passenger Airbag', cat: 'safety_systems' },
  { ar: 'إيرباق جانبي', en: 'Side Airbag', cat: 'safety_systems' },
  { ar: 'إيرباق الستارة', en: 'Curtain Airbag', cat: 'safety_systems' },
  { ar: 'سنسور وسائد الهوائية', en: 'Airbag Sensor', cat: 'safety_systems' },
  { ar: 'إطار أمامي يمين', en: 'Front Right Tire', cat: 'tires_rims' },
  { ar: 'إطار أمامي يسار', en: 'Front Left Tire', cat: 'tires_rims' },
  { ar: 'إطار خلفي يمين', en: 'Rear Right Tire', cat: 'tires_rims' },
  { ar: 'إطار خلفي يسار', en: 'Rear Left Tire', cat: 'tires_rims' },
  { ar: 'جنط أمامي يمين', en: 'Front Right Rim', cat: 'tires_rims' },
  { ar: 'جنط أمامي يسار', en: 'Front Left Rim', cat: 'tires_rims' },
  { ar: 'جنط خلفي يمين', en: 'Rear Right Rim', cat: 'tires_rims' },
  { ar: 'جنط خلفي يسار', en: 'Rear Left Rim', cat: 'tires_rims' },
  { ar: 'إطار الاحتياط', en: 'Spare Tire', cat: 'tires_rims' },
  { ar: 'زجاج أمامي', en: 'Windshield', cat: 'windows' },
  { ar: 'زجاج خلفي', en: 'Rear Window', cat: 'windows' },
  { ar: 'زجاج باب أمامي يمين', en: 'Front Right Window', cat: 'windows' },
  { ar: 'زجاج باب أمامي يسار', en: 'Front Left Window', cat: 'windows' },
  { ar: 'زجاج باب خلفي يمين', en: 'Rear Right Window', cat: 'windows' },
  { ar: 'زجاج باب خلفي يسار', en: 'Rear Left Window', cat: 'windows' },
  { ar: 'مرآة جانبية يمين', en: 'Right Side Mirror', cat: 'mirrors' },
  { ar: 'مرآة جانبية يسار', en: 'Left Side Mirror', cat: 'mirrors' },
  { ar: 'مرآة داخلية', en: 'Rearview Mirror', cat: 'mirrors' },
  { ar: 'غطاء المرآة يمين', en: 'Right Mirror Cover', cat: 'mirrors' },
  { ar: 'غطاء المرآة يسار', en: 'Left Mirror Cover', cat: 'mirrors' },
  { ar: 'شاشة الترفيه', en: 'Infotainment Screen', cat: 'accessories' },
  { ar: 'سماعات', en: 'Speakers', cat: 'accessories' },
  { ar: 'كاميرا خلفية', en: 'Rear Camera', cat: 'accessories' },
  { ar: 'حساسات الركن', en: 'Parking Sensors', cat: 'accessories' },
  { ar: 'ريموت السيارة', en: 'Key Fob', cat: 'accessories' },
  { ar: 'مفتاح السيارة', en: 'Car Key', cat: 'accessories' },
  { ar: 'استمارة السيارة', en: 'Vehicle Registration', cat: 'documentation' },
  { ar: 'رخصة السير', en: 'License', cat: 'documentation' },
  { ar: 'تأمين السيارة', en: 'Insurance', cat: 'documentation' },
  { ar: 'كتيب الصيانة', en: 'Service Book', cat: 'documentation' },
  { ar: 'مفتاح احتياطي', en: 'Spare Key', cat: 'documentation' },
  { ar: 'دليل المالك', en: 'Owner Manual', cat: 'documentation' },
];

// وظيفة لتوليد الأعطال
function generateFaults(): FaultEntry[] {
  const faults: FaultEntry[] = [];
  const allParts = [...MECHANIC_PARTS, ...TRANSMISSION_PARTS, ...BODY_PARTS, ...CHASSIS_PARTS, ...ELECTRIC_PARTS, ...INTERIOR_PARTS];
  
  // لكل جزء، نضيف حالات مختلفة
  for (const part of allParts) {
    // الحالات الأساسية
    for (let i = 0; i < CONDITIONS.ar.length; i++) {
      const condition = CONDITIONS.ar[i];
      const conditionEn = CONDITIONS.en[i];
      const severityIndex = i < 5 ? 0 : i < 10 ? 1 : i < 15 ? 2 : 3;
      
      faults.push({
        category: part.cat,
        faultName: `${part.ar} - ${condition}`,
        faultNameEn: `${part.en} - ${conditionEn}`,
        severity: SEVERITIES.values[severityIndex],
      });
    }
    
    // مواقع مختلفة للجزء
    for (let i = 0; i < Math.min(4, LOCATIONS.ar.length); i++) {
      faults.push({
        category: part.cat,
        faultName: `${part.ar} - ${LOCATIONS.ar[i]} - تالف`,
        faultNameEn: `${part.en} - ${LOCATIONS.en[i]} - Damaged`,
        severity: 'medium',
      });
    }
  }
  
  // أعطال إضافية خاصة بالهيكل الخارجي
  const bodyFaultTypes = [
    { ar: 'خدش سطحي', en: 'Surface Scratch', sev: 'low' as const },
    { ar: 'خدش عميق', en: 'Deep Scratch', sev: 'medium' as const },
    { ar: 'صدأ بسيط', en: 'Light Rust', sev: 'low' as const },
    { ar: 'صدأ متوسط', en: 'Medium Rust', sev: 'medium' as const },
    { ar: 'صدأ شديد', en: 'Heavy Rust', sev: 'high' as const },
    { ar: 'طلاء متقشر', en: 'Peeling Paint', sev: 'medium' as const },
    { ar: 'لون مختلف', en: 'Color Mismatch', sev: 'low' as const },
    { ar: 'انبعاج بسيط', en: 'Minor Dent', sev: 'low' as const },
    { ar: 'انبعاج متوسط', en: 'Medium Dent', sev: 'medium' as const },
    { ar: 'انبعاج كبير', en: 'Major Dent', sev: 'high' as const },
    { ar: 'تشقق في الصاج', en: 'Panel Crack', sev: 'high' as const },
    { ar: 'ثقب', en: 'Hole', sev: 'high' as const },
    { ar: 'فجوة غير متساوية', en: 'Uneven Gap', sev: 'medium' as const },
    { ar: 'معجون ظاهر', en: 'Visible Body Filler', sev: 'medium' as const },
    { ar: 'لحام مرئي', en: 'Visible Welding', sev: 'high' as const },
    { ar: 'قطعة غير أصلية', en: 'Non-Original Part', sev: 'medium' as const },
    { ar: 'قطعة تايوان', en: 'Aftermarket Part', sev: 'low' as const },
    { ar: 'قطعة مستعملة', en: 'Used Part', sev: 'low' as const },
  ];
  
  const bodyCategories = ['door_front_right', 'door_front_left', 'door_rear_right', 'door_rear_left', 'hood', 'trunk', 'fender_front_right', 'fender_front_left', 'fender_rear_right', 'fender_rear_left', 'quarter_panel_right', 'quarter_panel_left', 'roof', 'pillars', 'front_bumper', 'rear_bumper', 'front_chest', 'rear_chest'];
  
  for (const cat of bodyCategories) {
    for (const faultType of bodyFaultTypes) {
      faults.push({
        category: cat,
        faultName: faultType.ar,
        faultNameEn: faultType.en,
        severity: faultType.sev,
      });
    }
  }
  
  // أعطال إضافية للإطارات
  const tireFaults = [
    { ar: 'تآكل غير متساوي', en: 'Uneven Wear', sev: 'medium' as const },
    { ar: 'نفخ زائد', en: 'Over Inflated', sev: 'low' as const },
    { ar: 'نفخ ناقص', en: 'Under Inflated', sev: 'medium' as const },
    { ar: 'شق جانبي', en: 'Sidewall Cut', sev: 'high' as const },
    { ar: 'انتفاخ', en: 'Bulge', sev: 'critical' as const },
    { ar: 'مسمار في الإطار', en: 'Nail in Tire', sev: 'high' as const },
    { ar: 'عمر الإطار منتهي', en: 'Tire Age Expired', sev: 'medium' as const },
    { ar: 'ماركة غير معروفة', en: 'Unknown Brand', sev: 'low' as const },
  ];
  
  for (const tireFault of tireFaults) {
    for (const loc of ['أمامي يمين', 'أمامي يسار', 'خلفي يمين', 'خلفي يسار']) {
      faults.push({
        category: 'tires_rims',
        faultName: `إطار ${loc} - ${tireFault.ar}`,
        faultNameEn: `Tire - ${tireFault.en}`,
        severity: tireFault.sev,
      });
    }
  }
  
  // أعطال إضافية للجنوط
  const rimFaults = [
    { ar: 'خدش', en: 'Scratched', sev: 'low' as const },
    { ar: 'انحناء', en: 'Bent', sev: 'high' as const },
    { ar: 'تشقق', en: 'Cracked', sev: 'critical' as const },
    { ar: 'تآكل', en: 'Corroded', sev: 'medium' as const },
    { ar: 'صدأ', en: 'Rusted', sev: 'medium' as const },
    { ar: 'غير متطابق', en: 'Mismatched', sev: 'low' as const },
    { ar: 'حجم غير صحيح', en: 'Wrong Size', sev: 'medium' as const },
  ];
  
  for (const rimFault of rimFaults) {
    for (const loc of ['أمامي يمين', 'أمامي يسار', 'خلفي يمين', 'خلفي يسار']) {
      faults.push({
        category: 'tires_rims',
        faultName: `جنط ${loc} - ${rimFault.ar}`,
        faultNameEn: `Rim - ${rimFault.en}`,
        severity: rimFault.sev,
      });
    }
  }
  
  return faults;
}

export const FAULT_DATABASE = generateFaults();
export const FAULT_COUNT = FAULT_DATABASE.length;
