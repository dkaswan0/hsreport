// Shared vehicle utilities for consistent display across all reports

export interface VehicleColor {
  ar: string;
  en: string;
  hex: string;
}

export const COLOR_MAP: Record<string, VehicleColor> = {
  'اخضر': { ar: 'اخضر', en: 'Green', hex: '#22C55E' },
  'اخضر غامق': { ar: 'اخضر غامق', en: 'Dark Green', hex: '#166534' },
  'احمر': { ar: 'احمر', en: 'Red', hex: '#EF4444' },
  'ازرق': { ar: 'ازرق', en: 'Blue', hex: '#3B82F6' },
  'ازرق غامق': { ar: 'ازرق غامق', en: 'Dark Blue', hex: '#1E40AF' },
  'ابيض': { ar: 'ابيض', en: 'White', hex: '#FFFFFF' },
  'اسود': { ar: 'اسود', en: 'Black', hex: '#1F2937' },
  'فضي': { ar: 'فضي', en: 'Silver', hex: '#9CA3AF' },
  'رمادي': { ar: 'رمادي', en: 'Gray', hex: '#6B7280' },
  'ذهبي': { ar: 'ذهبي', en: 'Gold', hex: '#F59E0B' },
  'بني': { ar: 'بني', en: 'Brown', hex: '#92400E' },
  'برتقالي': { ar: 'برتقالي', en: 'Orange', hex: '#F97316' },
  'اصفر': { ar: 'اصفر', en: 'Yellow', hex: '#EAB308' },
  'بنفسجي': { ar: 'بنفسجي', en: 'Purple', hex: '#A855F7' },
  'وردي': { ar: 'وردي', en: 'Pink', hex: '#EC4899' },
  'بيج': { ar: 'بيج', en: 'Beige', hex: '#D4B896' },
  'عنابي': { ar: 'عنابي', en: 'Maroon', hex: '#7F1D1D' },
  'نبيتي': { ar: 'نبيتي', en: 'Burgundy', hex: '#831843' },
  'green': { ar: 'اخضر', en: 'Green', hex: '#22C55E' },
  'red': { ar: 'احمر', en: 'Red', hex: '#EF4444' },
  'blue': { ar: 'ازرق', en: 'Blue', hex: '#3B82F6' },
  'white': { ar: 'ابيض', en: 'White', hex: '#FFFFFF' },
  'black': { ar: 'اسود', en: 'Black', hex: '#1F2937' },
  'silver': { ar: 'فضي', en: 'Silver', hex: '#9CA3AF' },
  'gray': { ar: 'رمادي', en: 'Gray', hex: '#6B7280' },
  'grey': { ar: 'رمادي', en: 'Gray', hex: '#6B7280' },
  'gold': { ar: 'ذهبي', en: 'Gold', hex: '#F59E0B' },
  'brown': { ar: 'بني', en: 'Brown', hex: '#92400E' },
  'orange': { ar: 'برتقالي', en: 'Orange', hex: '#F97316' },
  'yellow': { ar: 'اصفر', en: 'Yellow', hex: '#EAB308' },
  'purple': { ar: 'بنفسجي', en: 'Purple', hex: '#A855F7' },
  'pink': { ar: 'وردي', en: 'Pink', hex: '#EC4899' },
  'beige': { ar: 'بيج', en: 'Beige', hex: '#D4B896' },
  'maroon': { ar: 'عنابي', en: 'Maroon', hex: '#7F1D1D' },
};

export function getVehicleColor(colorStr?: string | null): VehicleColor {
  if (!colorStr) return { ar: 'غير محدد', en: 'Not specified', hex: '#6B7280' };
  const normalized = colorStr.toLowerCase().trim().split(',')[0].trim();
  const found = COLOR_MAP[normalized];
  if (found) return found;
  // Try to find partial match
  for (const [key, value] of Object.entries(COLOR_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  return { ar: colorStr, en: colorStr, hex: '#6B7280' };
}

export interface InspectionStats {
  pass: number;
  warning: number;
  fail: number;
  total: number;
  passPercent: number;
}

export function calculateInspectionStats(items: Array<{ status: string }>): InspectionStats {
  const pass = items.filter(i => i.status === 'pass').length;
  const warning = items.filter(i => i.status === 'warning').length;
  const fail = items.filter(i => i.status === 'fail').length;
  const total = items.length;
  const passPercent = total > 0 ? Math.round((pass / total) * 100) : 100;
  return { pass, warning, fail, total, passPercent };
}

export function getHealthLabel(percent: number): { ar: string; en: string; color: string } {
  if (percent >= 80) return { ar: 'ممتاز', en: 'Excellent', color: '#18181b' };
  if (percent >= 60) return { ar: 'جيد', en: 'Good', color: '#52525b' };
  return { ar: 'ضعيف', en: 'Poor', color: '#09090b' };
}

export const CAR_COLORS = [
  "أبيض", "أبيض لؤلؤي", "أبيض عاجي", "أبيض كريمي", "أسود", "أسود لؤلؤي", "أسود مطفي", 
  "فضي", "فضي معدني", "رمادي", "رمادي فاتح", "رمادي غامق", "رمادي فحمي", "رمادي معدني", 
  "أزرق", "أزرق فاتح", "أزرق غامق", "أزرق سماوي", "أزرق بحري", "أزرق ملكي", "أزرق معدني", 
  "أحمر", "أحمر غامق", "أحمر كرزي", "أحمر عنابي", "أحمر نبيذي", "أحمر معدني", 
  "برتقالي", "برتقالي محروق", "أصفر", "أصفر ذهبي", "أصفر ليموني", "ذهبي", "ذهبي شامبانيا", 
  "ذهبي رملي", "بني", "بني فاتح", "بني غامق", "بني شوكولاتة", "بني نحاسي", "بيج", "بيج رملي", 
  "كريمي", "عاجي", "أخضر", "أخضر فاتح", "أخضر غامق", "أخضر زيتوني", "أخضر زمردي", 
  "أخضر ليموني", "تركواز", "فيروزي", "بنفسجي", "بنفسجي غامق", "بنفسجي فاتح", "وردي", 
  "وردي فاتح", "نحاسي", "برونزي", "خمري", "عنابي", "موف", "زيتي", "كاكي", "فستقي", 
  "نعناعي", "ليلكي", "شامبانيا", "كستنائي", "مرجاني", "كهرماني", "دخاني", "رصاصي", 
  "جرافيت", "فحمي", "لؤلؤي", "معدني", "مطفي", "متعدد الألوان", "لونين (ثنائي)"
];

export const INSPECTION_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  full: { ar: 'فحص شامل', en: 'Comprehensive Inspection' },
  comprehensive: { ar: 'فحص شامل', en: 'Comprehensive Inspection' },
  mechanical: { ar: 'فحص ميكانيكي وإلكتروني', en: 'Mechanical & Computer Inspection' },
  mechanical_computer: { ar: 'فحص ميكانيكي وإلكتروني', en: 'Mechanical & Computer Inspection' },
  basic: { ar: 'الأجزاء الأساسية', en: 'Essential Components Inspection' },
  basic_parts: { ar: 'الأجزاء الأساسية', en: 'Essential Components Inspection' },
  custom: { ar: 'فحوصات متنوعة', en: 'Custom Inspection' },
};

export function getInspectionTypeLabel(type?: string | null): { ar: string; en: string } {
  if (!type) return { ar: 'فحص شامل', en: 'Comprehensive Inspection' };
  
  const trimmed = type.trim();
  if (INSPECTION_TYPE_LABELS[trimmed]) {
    return INSPECTION_TYPE_LABELS[trimmed];
  }

  // Handle direct Arabic strings saved in DB
  if (trimmed.includes('فحص شامل') || trimmed.includes('شامل')) {
    return { ar: 'فحص شامل', en: 'Comprehensive Inspection' };
  }
  if (trimmed.includes('ميكانيكي') || trimmed.includes('كمبيوتر')) {
    return { ar: 'فحص ميكانيكي وإلكتروني', en: 'Mechanical & Computer Inspection' };
  }
  if (trimmed.includes('أساسية') || trimmed.includes('اساسية')) {
    return { ar: 'الأجزاء الأساسية', en: 'Essential Components Inspection' };
  }
  if (trimmed.includes('متنوعة') || trimmed.includes('مخصص')) {
    return { ar: 'فحوصات متنوعة', en: 'Custom Inspection' };
  }

  return { ar: trimmed, en: trimmed };
}
