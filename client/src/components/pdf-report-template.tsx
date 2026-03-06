import { forwardRef } from 'react';
import logoPath from '@assets/hs-logo.png';
import hsCarBranding from '@assets/hs_car_branding.png';

interface InspectionItem {
  id: number;
  category: string;
  faultName: string;
  status: string;
  notes?: string | null;
  imageUrl?: string | null;
  description?: string | null;
}

interface Inspection {
  id: number;
  vin: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  mileage?: number | null;
  odometer?: number | null;
  customerName?: string | null;
  customerPhone?: string | null;
  inspectionType?: string | null;
  signature?: string | null;
  customerSignature?: string | null;
  createdAt?: string | Date | null;
  items?: InspectionItem[];
  mainCarPhoto?: string | null;
  rearLeftDoorPhoto?: string | null;
  rearRightDoorPhoto?: string | null;
  frontLeftDoorPhoto?: string | null;
  frontRightDoorPhoto?: string | null;
  hoodPhoto?: string | null;
  trunkPhoto?: string | null;
  rearLeftDoorInteriorPhoto?: string | null;
  rearRightDoorInteriorPhoto?: string | null;
  frontLeftDoorInteriorPhoto?: string | null;
  frontRightDoorInteriorPhoto?: string | null;
  hoodInteriorPhoto?: string | null;
  trunkInteriorPhoto?: string | null;
}

type PdfLang = 'ar' | 'en';

interface PdfReportTemplateProps {
  inspection: Inspection;
  lang?: PdfLang;
}

// High Safety Brand Colors
const BRAND = {
  primary: '#0C1A28',
  secondary: '#1E3A5F',
  accent: '#C5852C',
  accentLight: '#E8B86D',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  light: '#F8FAFC',
  dark: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
};

// Main 6 Sections with subcategories
const MAIN_SECTIONS_PDF = [
  { id: 'mechanic', ar: 'الأجزاء الميكانيكية', en: 'MECHANIC' },
  { id: 'transmission', ar: 'ناقل الحركة', en: 'TRANSMISSION' },
  { id: 'body', ar: 'الهيكل الخارجي', en: 'BODY' },
  { id: 'chassis', ar: 'الهيكل', en: 'CHASSIS' },
  { id: 'electric', ar: 'الأجزاء الكهربائية', en: 'ELECTRIC' },
  { id: 'interior', ar: 'الداخلية والسلامة', en: 'INTERIOR & SAFETY' },
];

const CATEGORIES: Record<string, { ar: string; en: string; section?: string }> = {
  // MECHANIC Section
  engine: { ar: 'المحرك', en: 'Engine', section: 'mechanic' },
  suspension_system: { ar: 'نظام التعليق', en: 'Suspension System', section: 'mechanic' },
  steering_system: { ar: 'نظام التوجيه', en: 'Steering System', section: 'mechanic' },
  brake_system: { ar: 'نظام الفرامل', en: 'Brake System', section: 'mechanic' },
  fuel_exhaust: { ar: 'نظام الوقود والعادم', en: 'Fuel & Exhaust', section: 'mechanic' },
  ac_cooling: { ar: 'نظام التكييف', en: 'AC & Cooling', section: 'mechanic' },
  misc_mechanical: { ar: 'أعطال ميكانيكية متنوعة', en: 'Misc Mechanical', section: 'mechanic' },
  // Legacy mechanic categories
  suspension: { ar: 'التعليق', en: 'Suspension', section: 'mechanic' },
  brakes: { ar: 'الفرامل', en: 'Brakes', section: 'mechanic' },
  ac: { ar: 'التكييف', en: 'A/C', section: 'mechanic' },
  exhaust: { ar: 'العادم', en: 'Exhaust', section: 'mechanic' },
  
  // TRANSMISSION Section
  transmission: { ar: 'ناقل الحركة', en: 'Transmission', section: 'transmission' },
  transmission_auto: { ar: 'قير أوتوماتيك', en: 'Automatic Transmission', section: 'transmission' },
  transmission_manual: { ar: 'قير عادي', en: 'Manual Transmission', section: 'transmission' },
  transmission_performance: { ar: 'أداء ناقل الحركة', en: 'Transmission Performance', section: 'transmission' },
  transmission_sounds: { ar: 'أصوات ناقل الحركة', en: 'Transmission Sounds', section: 'transmission' },
  transmission_leaks: { ar: 'تسريبات ناقل الحركة', en: 'Transmission Leaks', section: 'transmission' },
  transmission_shifting: { ar: 'التبديل والتعشيق', en: 'Gear Shifting', section: 'transmission' },
  
  // BODY Section
  body: { ar: 'الهيكل', en: 'Body', section: 'body' },
  door_front_left: { ar: 'الباب الأمامي يسار', en: 'Front Left Door', section: 'body' },
  door_front_right: { ar: 'الباب الأمامي يمين', en: 'Front Right Door', section: 'body' },
  door_rear_left: { ar: 'الباب الخلفي يسار', en: 'Rear Left Door', section: 'body' },
  door_rear_right: { ar: 'الباب الخلفي يمين', en: 'Rear Right Door', section: 'body' },
  hood: { ar: 'غطاء المحرك', en: 'Hood', section: 'body' },
  trunk: { ar: 'صندوق الأمتعة', en: 'Trunk', section: 'body' },
  fender_front_left: { ar: 'الرفرف الأمامي يسار', en: 'Front Left Fender', section: 'body' },
  fender_front_right: { ar: 'الرفرف الأمامي يمين', en: 'Front Right Fender', section: 'body' },
  fender_rear_left: { ar: 'الرفرف الخلفي يسار', en: 'Rear Left Fender', section: 'body' },
  fender_rear_right: { ar: 'الرفرف الخلفي يمين', en: 'Rear Right Fender', section: 'body' },
  quarter_panel_left: { ar: 'اللوح الجانبي الأيسر', en: 'Left Quarter Panel', section: 'body' },
  quarter_panel_right: { ar: 'اللوح الجانبي الأيمن', en: 'Right Quarter Panel', section: 'body' },
  roof: { ar: 'السقف', en: 'Roof', section: 'body' },
  pillars: { ar: 'القوائم', en: 'Pillars', section: 'body' },
  front_chest: { ar: 'الصدر الأمامي', en: 'Front Frame', section: 'body' },
  rear_chest: { ar: 'الصدر الخلفي', en: 'Rear Frame', section: 'body' },
  front_bumper: { ar: 'الدعامية الأمامية', en: 'Front Bumper', section: 'body' },
  rear_bumper: { ar: 'الدعامية الخلفية', en: 'Rear Bumper', section: 'body' },
  bumper_frame_front: { ar: 'جسر الدعامية الأمامية', en: 'Front Bumper Frame', section: 'body' },
  bumper_frame_rear: { ar: 'جسر الدعامية الخلفية', en: 'Rear Bumper Frame', section: 'body' },
  fender_front: { ar: 'الرفرف الأمامي', en: 'Front Fender', section: 'body' },
  fender_rear: { ar: 'الرفرف الخلفي', en: 'Rear Fender', section: 'body' },
  // Legacy body categories
  doors: { ar: 'الابواب', en: 'Doors', section: 'body' },
  fenders: { ar: 'الرفارف', en: 'Fenders', section: 'body' },
  
  // CHASSIS Section
  chassis: { ar: 'الشاسيه', en: 'Chassis', section: 'chassis' },
  chassis_frame: { ar: 'الهيكل والإطار', en: 'Chassis & Frame', section: 'chassis' },
  chassis_alignment: { ar: 'الاستقامة', en: 'Alignment', section: 'chassis' },
  chassis_welding: { ar: 'القص واللحام', en: 'Cutting & Welding', section: 'chassis' },
  chassis_accident: { ar: 'آثار الحوادث القوية', en: 'Accident Damage', section: 'chassis' },
  
  // ELECTRIC Section
  electrical: { ar: 'الكهرباء', en: 'Electrical', section: 'electric' },
  electrical_system: { ar: 'النظام الكهربائي', en: 'Electrical System', section: 'electric' },
  battery: { ar: 'البطارية', en: 'Battery', section: 'electric' },
  exterior_lighting: { ar: 'الإضاءة الخارجية', en: 'Exterior Lighting', section: 'electric' },
  lights_front: { ar: 'الأضواء الأمامية', en: 'Front Lights', section: 'electric' },
  lights_rear: { ar: 'الأضواء الخلفية', en: 'Rear Lights', section: 'electric' },
  wire_harness: { ar: 'أسلاك التوصيل', en: 'Wire Harness', section: 'electric' },
  mirror_controls: { ar: 'زر تحكم المرايا', en: 'Mirror Controls', section: 'electric' },
  computer_sensors: { ar: 'فحص الكمبيوتر والحساسات', en: 'Computer & Sensors', section: 'electric' },
  lights: { ar: 'الاضاءة', en: 'Lights', section: 'electric' },
  
  // INTERIOR & SAFETY Section
  interior: { ar: 'الداخلية', en: 'Interior', section: 'interior' },
  safety: { ar: 'السلامة', en: 'Safety', section: 'interior' },
  safety_systems: { ar: 'أنظمة السلامة', en: 'Safety Systems', section: 'interior' },
  tires_rims: { ar: 'الإطارات والجنوط', en: 'Tires & Rims', section: 'interior' },
  windows: { ar: 'الزجاج والنوافذ', en: 'Glass & Windows', section: 'interior' },
  mirrors: { ar: 'المرايا', en: 'Mirrors', section: 'interior' },
  accessories: { ar: 'الإكسسوارات والملحقات', en: 'Accessories', section: 'interior' },
  documentation: { ar: 'الوثائق والتوثيق', en: 'Documentation', section: 'interior' },
  tires: { ar: 'الاطارات', en: 'Tires', section: 'interior' },
  wheels: { ar: 'الجنوط', en: 'Wheels', section: 'interior' },
  glass: { ar: 'الزجاج', en: 'Glass', section: 'interior' },
};

const getCategorySection = (categoryId: string): string => {
  return CATEGORIES[categoryId]?.section || 'interior';
};

// Fault name translations
const FAULT_TRANSLATIONS: Record<string, string> = {
  'يحتاج تغيير': 'Needs Replacement',
  'يحتاج صيانة': 'Needs Maintenance',
  'يحتاج اصلاح': 'Needs Repair',
  'تسريب': 'Leak',
  'تلف': 'Damage',
  'صدأ': 'Rust',
  'خدوش': 'Scratches',
  'كسر': 'Broken',
  'ضعيف': 'Weak',
  'متآكل': 'Worn',
};

const COLOR_MAP: Record<string, { ar: string; en: string; hex: string }> = {
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

const getVehicleColor = (colorStr?: string | null) => {
  if (!colorStr) return { ar: '-', en: '-', hex: '#6B7280' };
  const normalized = colorStr.toLowerCase().trim().split(',')[0].trim();
  return COLOR_MAP[normalized] || { ar: colorStr, en: colorStr, hex: '#6B7280' };
};


const getInspectionTypeLabel = (type?: string | null) => {
  switch (type) {
    case 'comprehensive': return { ar: 'فحص شامل', en: 'Comprehensive Inspection' };
    case 'mechanical_computer': return { ar: 'فحص ميكانيكي + كمبيوتر', en: 'Mechanical + Computer' };
    case 'basic_parts': return { ar: 'فحص قطع اساسية', en: 'Basic Parts Inspection' };
    case 'custom': return { ar: 'فحص مخصص', en: 'Custom Inspection' };
    default: return { ar: 'فحص شامل', en: 'Comprehensive Inspection' };
  }
};

const getFaultTranslation = (faultName: string): string => {
  for (const [ar, en] of Object.entries(FAULT_TRANSLATIONS)) {
    if (faultName.includes(ar)) {
      return faultName.replace(ar, en);
    }
  }
  return faultName;
};

const textStyle: React.CSSProperties = {
  fontFamily: '"Segoe UI", Tahoma, "Noto Sans Arabic", "Noto Kufi Arabic", Arial, sans-serif',
  letterSpacing: '0',
  wordSpacing: '2px',
  lineHeight: '1.6',
  WebkitFontSmoothing: 'antialiased',
};

const englishStyle: React.CSSProperties = {
  fontFamily: 'Arial, Helvetica, sans-serif',
  letterSpacing: '0.3px',
};

const arTextStyle = textStyle;

export const PdfReportTemplate = forwardRef<HTMLDivElement, PdfReportTemplateProps>(
  ({ inspection, lang = 'ar' }, ref) => {
    const isAr = lang === 'ar';
    const items = inspection.items || [];
    const failItems = items.filter(i => i.status === 'fail');
    const warningItems = items.filter(i => i.status === 'warning');
    const issueItems = [...failItems, ...warningItems];
    const passCount = items.filter(i => i.status === 'pass').length;
    const totalItems = items.length;
    
    const inspectionDate = inspection.createdAt ? new Date(inspection.createdAt) : new Date();
    const reportDate = inspectionDate.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
    const reportTime = inspectionDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: false });
    const englishDate = inspectionDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    const getCategoryLabel = (catId: string) => CATEGORIES[catId] || { ar: catId, en: catId };
    const inspectionTypeLabel = getInspectionTypeLabel(inspection.inspectionType);
    const vehicleColor = getVehicleColor(inspection.color);

    const itemCount = issueItems.length;
    
    // Adaptive sizing based on content - LARGER minimum sizes for readability
    let gridCols = 2;
    let fontSize = '13px';
    let titleSize = '15px';
    let catFontSize = '10px';
    let itemPad = '12px 14px';
    let imgSize = { w: '75px', h: '60px' };
    let gapSize = '10px';
    let showImage = true;
    
    if (itemCount === 0) {
      // No issues - large display
    } else if (itemCount <= 4) {
      gridCols = 2;
      fontSize = '14px';
      titleSize = '16px';
      catFontSize = '11px';
      itemPad = '14px 16px';
      imgSize = { w: '90px', h: '72px' };
      gapSize = '12px';
    } else if (itemCount <= 6) {
      gridCols = 2;
      fontSize = '13px';
      titleSize = '15px';
      catFontSize = '10px';
      itemPad = '12px 14px';
      imgSize = { w: '80px', h: '64px' };
      gapSize = '10px';
    } else if (itemCount <= 10) {
      gridCols = 2;
      fontSize = '12px';
      titleSize = '14px';
      catFontSize = '9px';
      itemPad = '10px 12px';
      imgSize = { w: '70px', h: '56px' };
      gapSize = '8px';
    } else if (itemCount <= 14) {
      gridCols = 3;
      fontSize = '11px';
      titleSize = '13px';
      catFontSize = '9px';
      itemPad = '8px 10px';
      imgSize = { w: '60px', h: '48px' };
      gapSize = '6px';
    } else {
      gridCols = 3;
      fontSize = '10px';
      titleSize = '12px';
      catFontSize = '8px';
      itemPad = '6px 8px';
      imgSize = { w: '55px', h: '44px' };
      gapSize = '5px';
      showImage = itemCount <= 18;
    }

    const healthPercent = totalItems > 0 ? Math.round((passCount / totalItems) * 100) : 100;
    const healthColor = healthPercent >= 80 ? BRAND.success : healthPercent >= 60 ? BRAND.warning : BRAND.danger;
    const healthLabel = healthPercent >= 80 ? { ar: 'ممتاز', en: 'Excellent' } : healthPercent >= 60 ? { ar: 'جيد', en: 'Good' } : { ar: 'ضعيف', en: 'Poor' };

    return (
      <div 
        ref={ref}
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          width: '794px',
          height: '1123px',
          backgroundColor: '#ffffff',
          padding: '0',
          margin: '0',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          ...(isAr ? textStyle : englishStyle),
        }}
      >
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.secondary} 100%)`,
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          borderBottom: `4px solid ${BRAND.accent}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '55px',
              height: '55px',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              border: `2px solid ${BRAND.accent}`,
            }}>
              <img src={logoPath} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <h1 style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold', margin: 0, ...(isAr ? textStyle : englishStyle) }}>
                {isAr ? 'مركز الامان العالي' : 'HIGH SAFETY CENTER'}
              </h1>
              <p style={{ color: BRAND.accentLight, fontSize: '11px', margin: '3px 0 0 0', ...(isAr ? englishStyle : textStyle), fontWeight: '600' }}>
                {isAr ? 'HIGH SAFETY CENTER' : 'مركز الامان العالي'}
              </p>
            </div>
          </div>
          
          <div style={{ textAlign: isAr ? 'left' : 'right' }}>
            <div style={{
              background: `linear-gradient(135deg, ${BRAND.accent} 0%, ${BRAND.accentLight} 100%)`,
              color: BRAND.primary,
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '10px',
              fontWeight: 'bold',
              marginBottom: '6px',
              boxShadow: '0 2px 8px rgba(197,133,44,0.4)',
              ...(isAr ? textStyle : englishStyle),
            }}>
              {isAr ? (
                <>
                  <span>{inspectionTypeLabel.ar}</span>
                  <span style={{ ...englishStyle, marginRight: '6px', fontSize: '9px' }}>| {inspectionTypeLabel.en}</span>
                </>
              ) : (
                <>
                  <span>{inspectionTypeLabel.en}</span>
                  <span style={{ ...textStyle, marginLeft: '6px', fontSize: '9px' }}>| {inspectionTypeLabel.ar}</span>
                </>
              )}
            </div>
            <p style={{ color: '#94a3b8', fontSize: '9px', margin: 0, ...englishStyle }}>
              {englishDate} | {reportTime}
            </p>
            {isAr && (
              <p style={{ color: '#cbd5e1', fontSize: '10px', margin: '2px 0 0 0', ...textStyle }}>
                {reportDate}
              </p>
            )}
          </div>
        </div>

        {/* Vehicle Info */}
        <div style={{
          backgroundColor: BRAND.light,
          padding: '12px 24px',
          display: 'grid',
          gridTemplateColumns: '1.3fr 1.5fr 0.8fr 1fr',
          gap: '12px',
          borderBottom: `1px solid ${BRAND.border}`,
          flexShrink: 0,
        }}>
          {/* Vehicle */}
          <div style={{ 
            background: '#ffffff', 
            borderRadius: '10px', 
            padding: '12px 14px', 
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            border: `1px solid ${BRAND.border}`,
            borderTop: `3px solid ${BRAND.accent}`,
          }}>
            <p style={{ color: BRAND.muted, fontSize: '8px', margin: '0 0 4px 0', display: 'flex', justifyContent: 'space-between' }}>
              <span style={isAr ? textStyle : englishStyle}>{isAr ? 'المركبة' : 'Vehicle'}</span>
              <span style={isAr ? englishStyle : textStyle}>{isAr ? 'Vehicle' : 'المركبة'}</span>
            </p>
            <p style={{ color: BRAND.dark, fontSize: '14px', fontWeight: 'bold', margin: 0, ...englishStyle }}>
              {inspection.make} {inspection.model}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px', flexWrap: 'wrap' }}>
              <span style={{ color: BRAND.muted, fontSize: '10px', ...englishStyle }}>
                {inspection.year}
              </span>
              <span style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                backgroundColor: BRAND.light,
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '9px',
              }}>
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: vehicleColor.hex,
                  border: vehicleColor.hex === '#FFFFFF' ? '1px solid #ccc' : 'none',
                  display: 'inline-block',
                  flexShrink: 0,
                }}></span>
                <span style={{ color: BRAND.dark, ...textStyle }}>{vehicleColor.ar}</span>
                <span style={{ color: BRAND.muted, ...englishStyle, fontSize: '8px' }}>({vehicleColor.en})</span>
              </span>
            </div>
          </div>

          {/* VIN - Realistic Stamped Metal Plate */}
          <div style={{ 
            background: 'linear-gradient(180deg, #c0c0c0 0%, #a8a8a8 20%, #d0d0d0 40%, #b8b8b8 60%, #c8c8c8 80%, #a0a0a0 100%)',
            borderRadius: '4px', 
            padding: '8px 10px', 
            boxShadow: '0 3px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.2)',
            position: 'relative',
            border: '1px solid #888',
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '6px',
            }}>
              <span style={{ fontSize: '7px', fontWeight: 'bold', color: '#333', letterSpacing: '0.5px' }}>
                {inspection.make?.toUpperCase() || 'MANUFACTURER'}
              </span>
              <span style={{ fontSize: '7px', fontWeight: 'bold', color: '#333' }}>
                {inspection.year || '----'}
              </span>
            </div>
            <div style={{
              background: 'linear-gradient(180deg, #f5f5f5 0%, #e8e8e8 50%, #f0f0f0 100%)',
              borderRadius: '2px',
              padding: '6px 8px',
              border: '1px solid #999',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
            }}>
              <p style={{ 
                fontFamily: "'Courier New', 'Consolas', monospace",
                fontWeight: 900,
                fontSize: '10px',
                color: '#1a1a1a',
                letterSpacing: '2px',
                textAlign: 'center',
                margin: 0,
                textShadow: '0 1px 0 rgba(255,255,255,0.5)',
              }}>
                {inspection.vin}
              </p>
            </div>
            <p style={{ fontSize: '6px', color: '#555', textAlign: 'center', margin: '5px 0 0 0', letterSpacing: '0.5px' }}>
              VEHICLE IDENTIFICATION NUMBER
            </p>
            {/* Rivets */}
            <div style={{
              position: 'absolute', top: '5px', left: '5px',
              width: '6px', height: '6px', borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #e0e0e0, #808080 40%, #606060)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }} />
            <div style={{
              position: 'absolute', top: '5px', right: '5px',
              width: '6px', height: '6px', borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #e0e0e0, #808080 40%, #606060)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }} />
            <div style={{
              position: 'absolute', bottom: '5px', left: '5px',
              width: '6px', height: '6px', borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #e0e0e0, #808080 40%, #606060)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }} />
            <div style={{
              position: 'absolute', bottom: '5px', right: '5px',
              width: '6px', height: '6px', borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #e0e0e0, #808080 40%, #606060)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }} />
          </div>

          {/* Realistic Analog Odometer with Dual Gauges */}
          <div style={{
            background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #0a0a0a 60%, #000 100%)',
            borderRadius: '10px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.05)',
            border: '2px solid #333',
          }}>
            {/* Left Gauge (RPM style) */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #2a2a2a 0%, #111 60%, #000 100%)',
              border: '2px solid #444',
              position: 'relative',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.9)',
            }}>
              {/* Gauge markings */}
              {[0, 30, 60, 90, 120, 150, 180, 210, 240].map((angle, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '1px',
                  height: '4px',
                  background: i > 6 ? '#ff3333' : '#fff',
                  transformOrigin: 'center -10px',
                  transform: `translate(-50%, -50%) rotate(${angle - 120}deg)`,
                }} />
              ))}
              {/* Needle */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '2px',
                height: '12px',
                background: 'linear-gradient(180deg, #ff4444 0%, #cc0000 100%)',
                transformOrigin: 'bottom center',
                transform: 'translate(-50%, -100%) rotate(-30deg)',
                borderRadius: '1px',
              }} />
              {/* Center cap */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #666 0%, #222 100%)',
                border: '1px solid #444',
              }} />
            </div>

            {/* Center Digital Odometer Display */}
            <div style={{
              background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
              borderRadius: '4px',
              padding: '6px 8px',
              border: '1px solid #333',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.9)',
            }}>
              {/* Mechanical roller digits */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1px',
                background: '#111',
                padding: '3px 4px',
                borderRadius: '2px',
                border: '1px solid #222',
              }}>
                {String(inspection.odometer || inspection.mileage || 0).padStart(6, '0').split('').map((digit, i) => (
                  <div key={i} style={{
                    width: '10px',
                    height: '14px',
                    background: i < 5 ? 'linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)' : 'linear-gradient(180deg, #ff2222 0%, #cc0000 50%, #aa0000 100%)',
                    borderRadius: '1px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #333',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
                  }}>
                    <span style={{
                      color: '#fff',
                      fontSize: '10px',
                      fontFamily: "'Arial', sans-serif",
                      fontWeight: 'bold',
                    }}>
                      {digit}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{
                textAlign: 'center',
                marginTop: '2px',
              }}>
                <span style={{ 
                  color: '#888', 
                  fontSize: '6px', 
                  letterSpacing: '1px',
                  ...englishStyle,
                }}>
                  km
                </span>
              </div>
            </div>

            {/* Right Gauge (Speed style) */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #2a2a2a 0%, #111 60%, #000 100%)',
              border: '2px solid #444',
              position: 'relative',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.9)',
            }}>
              {/* Gauge markings */}
              {[0, 30, 60, 90, 120, 150, 180, 210, 240].map((angle, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '1px',
                  height: '4px',
                  background: i > 6 ? '#ff3333' : '#fff',
                  transformOrigin: 'center -10px',
                  transform: `translate(-50%, -50%) rotate(${angle - 120}deg)`,
                }} />
              ))}
              {/* Needle */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '2px',
                height: '12px',
                background: 'linear-gradient(180deg, #ff4444 0%, #cc0000 100%)',
                transformOrigin: 'bottom center',
                transform: 'translate(-50%, -100%) rotate(15deg)',
                borderRadius: '1px',
              }} />
              {/* Center cap */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #666 0%, #222 100%)',
                border: '1px solid #444',
              }} />
            </div>
          </div>

          {/* Main Car Photo with HS Watermark Frame - Replaces Black Car */}
          <div style={{ 
            position: 'relative',
            width: '160px',
            height: '110px',
            borderRadius: '8px', 
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 0 20px rgba(197,133,44,0.1)',
            border: `3px solid ${BRAND.accent}`,
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
          }}>
            {inspection.mainCarPhoto ? (
              <img 
                src={inspection.mainCarPhoto} 
                alt="Vehicle Photo" 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              <img 
                src={hsCarBranding} 
                alt="High Safety" 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            )}
            {/* HS Watermark Overlay */}
            <div style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              background: 'rgba(12, 26, 40, 0.9)',
              borderRadius: '4px',
              padding: '3px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              border: `1px solid ${BRAND.accent}`,
            }}>
              <img 
                src={logoPath} 
                alt="HS" 
                style={{
                  width: '18px',
                  height: '18px',
                  objectFit: 'contain',
                }}
              />
              <span style={{
                fontSize: '7px',
                color: BRAND.accent,
                fontWeight: 'bold',
                  letterSpacing: '0.5px',
                }}>HIGH SAFETY</span>
              </div>
              {/* Corner Accents */}
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: '12px',
                height: '12px',
                borderTop: `2px solid ${BRAND.accent}`,
                borderLeft: `2px solid ${BRAND.accent}`,
              }} />
              <div style={{
                position: 'absolute',
                top: '0',
                right: '0',
                width: '12px',
                height: '12px',
                borderTop: `2px solid ${BRAND.accent}`,
                borderRight: `2px solid ${BRAND.accent}`,
              }} />
              <div style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                width: '12px',
                height: '12px',
                borderBottom: `2px solid ${BRAND.accent}`,
                borderLeft: `2px solid ${BRAND.accent}`,
              }} />
              <div style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '12px',
                height: '12px',
                borderBottom: `2px solid ${BRAND.accent}`,
                borderRight: `2px solid ${BRAND.accent}`,
              }} />
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '12px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {issueItems.length === 0 ? (
            <div style={{
              backgroundColor: '#dcfce7',
              borderRadius: '16px',
              padding: '40px',
              textAlign: 'center',
              marginTop: '40px',
              border: `3px solid ${BRAND.success}`,
            }}>
              <div style={{ 
                width: '70px', 
                height: '70px', 
                borderRadius: '50%', 
                backgroundColor: BRAND.success, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
              }}>
                <span style={{ color: '#fff', fontSize: '36px' }}>&#10003;</span>
              </div>
              <h2 style={{ color: '#166534', fontSize: '22px', fontWeight: 'bold', margin: '0 0 8px 0', ...(isAr ? textStyle : englishStyle) }}>
                {isAr ? 'لا توجد ملاحظات على المركبة' : 'Vehicle in Excellent Condition'}
              </h2>
              <p style={{ color: '#15803d', fontSize: '14px', margin: 0, ...(isAr ? englishStyle : textStyle) }}>
                {isAr ? 'Vehicle in Excellent Condition - No Issues Found' : 'لا توجد ملاحظات على المركبة'}
              </p>
            </div>
          ) : (
            <>
              {/* Section Header */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '10px',
                paddingBottom: '8px',
                borderBottom: `2px solid ${BRAND.primary}`,
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '5px',
                    height: '30px',
                    backgroundColor: BRAND.accent,
                    borderRadius: '3px',
                  }}></div>
                  <div>
                    <h2 style={{ color: BRAND.dark, fontSize: '14px', fontWeight: 'bold', margin: 0, ...(isAr ? textStyle : englishStyle) }}>
                      {isAr ? 'البنود التي تحتاج متابعة' : 'Items Requiring Attention'}
                    </h2>
                    <p style={{ color: BRAND.muted, fontSize: '9px', margin: '2px 0 0 0', ...(isAr ? englishStyle : textStyle) }}>
                      {isAr ? `Items Requiring Attention (${itemCount} items)` : `البنود التي تحتاج متابعة (${itemCount})`}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ 
                    backgroundColor: BRAND.danger,
                    color: '#ffffff',
                    padding: '4px 12px',
                    borderRadius: '14px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    ...englishStyle,
                  }}>
                    {isAr ? <><span style={textStyle}>أعطال</span> | {failItems.length} Faults</> : <>{failItems.length} Faults | <span style={textStyle}>أعطال</span></>}
                  </span>
                  <span style={{ 
                    backgroundColor: BRAND.warning,
                    color: '#ffffff',
                    padding: '4px 12px',
                    borderRadius: '14px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    ...englishStyle,
                  }}>
                    {isAr ? <><span style={textStyle}>تحذير</span> | {warningItems.length} Warning</> : <>{warningItems.length} Warning | <span style={textStyle}>تحذير</span></>}
                  </span>
                </div>
              </div>

              {/* Issues Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: `repeat(${gridCols}, 1fr)`, 
                gap: gapSize,
                flex: 1,
                alignContent: 'start',
              }}>
                {issueItems.map((item, idx) => {
                  const isFail = item.status === 'fail';
                  const catLabel = getCategoryLabel(item.category);
                  const itemColor = isFail ? BRAND.danger : BRAND.warning;
                  const faultNameAr = item.faultName.split(' - ')[0];
                  const faultNameEn = getFaultTranslation(faultNameAr);
                  
                  return (
                    <div 
                      key={item.id || idx} 
                      style={{
                        backgroundColor: isFail ? '#fef2f2' : '#fffbeb',
                        border: `1px solid ${isFail ? '#fecaca' : '#fde68a'}`,
                        borderRight: `4px solid ${itemColor}`,
                        borderRadius: '8px',
                        padding: itemPad,
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'flex-start',
                      }}
                    >
                      {showImage && item.imageUrl && (
                        <img 
                          src={item.imageUrl} 
                          alt="" 
                          style={{ 
                            width: imgSize.w, 
                            height: imgSize.h, 
                            objectFit: 'cover', 
                            borderRadius: '6px',
                            flexShrink: 0,
                            border: '1px solid #e5e7eb',
                          }} 
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span style={{ 
                            color: itemColor, 
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}>
                            {isFail ? '\u25CF' : '\u25D0'}
                          </span>
                          <span style={{ 
                            color: BRAND.dark, 
                            fontSize: catFontSize,
                            backgroundColor: '#e5e7eb',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            ...(isAr ? textStyle : englishStyle),
                          }}>
                            {isAr ? catLabel.ar : catLabel.en}
                          </span>
                          <span style={{ 
                            color: BRAND.muted, 
                            fontSize: catFontSize,
                            ...(isAr ? englishStyle : textStyle),
                          }}>
                            {isAr ? catLabel.en : catLabel.ar}
                          </span>
                        </div>
                        <p style={{ 
                          color: BRAND.dark, 
                          fontSize: titleSize, 
                          fontWeight: 'bold', 
                          margin: '0 0 2px 0',
                          lineHeight: '1.3',
                          ...(isAr ? textStyle : englishStyle),
                        }}>
                          {isAr ? faultNameAr : (faultNameEn !== faultNameAr ? faultNameEn : faultNameAr)}
                        </p>
                        <p style={{ 
                          color: BRAND.muted, 
                          fontSize: fontSize, 
                          margin: '0 0 3px 0',
                          ...(isAr ? englishStyle : textStyle),
                        }}>
                          {isAr ? (faultNameEn !== faultNameAr ? faultNameEn : '') : faultNameAr}
                        </p>
                        <p style={{ 
                          color: itemColor, 
                          fontSize: catFontSize, 
                          margin: 0,
                          fontWeight: 'bold',
                        }}>
                          {isAr ? (
                            <>
                              <span style={textStyle}>{isFail ? '\u25CF عطل' : '\u25D0 ملاحظة'}</span>
                              <span style={{ ...englishStyle, marginRight: '4px' }}>| {isFail ? 'Fault' : 'Note'}</span>
                            </>
                          ) : (
                            <>
                              <span style={englishStyle}>{isFail ? '\u25CF Fault' : '\u25D0 Note'}</span>
                              <span style={{ ...textStyle, marginLeft: '4px' }}>| {isFail ? 'عطل' : 'ملاحظة'}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* OBD Codes Section */}
        {(() => {
          const obdCodes = (inspection.obdCodes as Array<{code: string; nameEn: string; nameAr: string}> | null) || [];
          if (obdCodes.length === 0) return null;
          return (
            <div style={{ padding: '16px 24px', borderTop: `2px solid ${BRAND.accent}`, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '5px', height: '20px', backgroundColor: '#059669', borderRadius: '3px' }}></div>
                <h3 style={{ color: BRAND.dark, fontSize: '12px', fontWeight: 'bold', margin: 0 }}>
                  {isAr ? (
                    <><span style={textStyle}>قراءة أعطال كمبيوتر السيارة</span><span style={{ ...englishStyle, marginRight: '10px', color: BRAND.muted }}>| OBD Diagnostic Codes</span></>
                  ) : (
                    <><span style={englishStyle}>OBD Diagnostic Codes</span><span style={{ ...textStyle, marginLeft: '10px', color: BRAND.muted }}>| قراءة أعطال كمبيوتر السيارة</span></>
                  )}
                </h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#ecfdf5', borderBottom: '2px solid #a7f3d0' }}>
                    <th style={{ padding: '6px 10px', textAlign: isAr ? 'right' : 'left', fontWeight: 'bold', color: '#065f46', ...textStyle }}>
                      {isAr ? 'كود العطل' : 'Code'}
                    </th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 'bold', color: '#065f46', ...englishStyle }}>
                      English
                    </th>
                    <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 'bold', color: '#065f46', ...textStyle }}>
                      العربية
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {obdCodes.map((obd, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '5px 10px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#059669', backgroundColor: '#ecfdf5', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', border: '1px solid #a7f3d0' }}>{obd.code}</span>
                      </td>
                      <td style={{ padding: '5px 10px', textAlign: 'left', color: '#475569', ...englishStyle, fontSize: '9px' }}>{obd.nameEn}</td>
                      <td style={{ padding: '5px 10px', textAlign: 'right', color: '#1e293b', ...textStyle, fontWeight: '600' }}>{obd.nameAr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}

        {/* Terms & Conditions */}
        <div style={{
          padding: '14px 24px',
          backgroundColor: BRAND.light,
          borderTop: `2px solid ${BRAND.accent}`,
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px',
          }}>
            <div style={{
              width: '5px',
              height: '20px',
              backgroundColor: BRAND.accent,
              borderRadius: '3px',
            }}></div>
            <h3 style={{ color: BRAND.dark, fontSize: '12px', fontWeight: 'bold', margin: 0 }}>
              {isAr ? (
                <><span style={textStyle}>البنود والأحكام</span><span style={{ ...englishStyle, marginRight: '10px', color: BRAND.muted }}>| Terms & Conditions</span></>
              ) : (
                <><span style={englishStyle}>Terms & Conditions</span><span style={{ ...textStyle, marginLeft: '10px', color: BRAND.muted }}>| البنود والأحكام</span></>
              )}
            </h3>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px 20px',
          }}>
            {[
              { ar: 'المركز غير مسئول عن أي أعطال تحدث أثناء الفحص أو بعده.', en: 'The center is not responsible for any malfunctions during or after inspection.' },
              { ar: 'المركز مسئول عن نتيجة الفحص وقت الفحص فقط.', en: 'The center is only responsible for inspection results at the time of inspection.' },
              { ar: 'هذا الفحص غير معتمد لدى إدارة التراخيص.', en: 'This inspection is not approved by the Licensing Authority.' },
              { ar: 'المركز غير مسئول عن أي أغراض شخصية داخل السيارة.', en: 'The center is not responsible for personal belongings inside the vehicle.' },
            ].map((term, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ color: BRAND.accent, fontSize: '10px', marginTop: '2px', fontWeight: 'bold' }}>●</span>
                <div>
                  <p style={{ color: BRAND.dark, fontSize: '10px', margin: 0, lineHeight: '1.5', fontWeight: '600', ...(isAr ? textStyle : englishStyle) }}>
                    {isAr ? term.ar : term.en}
                  </p>
                  <p style={{ color: BRAND.muted, fontSize: '9px', margin: '2px 0 0 0', lineHeight: '1.4', ...(isAr ? englishStyle : textStyle) }}>
                    {isAr ? term.en : term.ar}
                  </p>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', gridColumn: 'span 2' }}>
              <span style={{ color: BRAND.accent, fontSize: '10px', marginTop: '2px', fontWeight: 'bold' }}>●</span>
              <div>
                <p style={{ color: BRAND.dark, fontSize: '10px', margin: 0, lineHeight: '1.5', fontWeight: '600', ...(isAr ? textStyle : englishStyle) }}>
                  {isAr ? 'يعتبر هذا التقرير لحالة المركبة حسب قراءة الأجهزة في وقت الفحص.' : 'This report reflects the vehicle condition based on device readings at the time of inspection.'}
                </p>
                <p style={{ color: BRAND.muted, fontSize: '9px', margin: '2px 0 0 0', lineHeight: '1.4', ...(isAr ? englishStyle : textStyle) }}>
                  {isAr ? 'This report reflects the vehicle condition based on device readings at the time of inspection.' : 'يعتبر هذا التقرير لحالة المركبة حسب قراءة الأجهزة في وقت الفحص.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.secondary} 100%)`,
          padding: '14px 24px',
          flexShrink: 0,
          borderTop: `3px solid ${BRAND.accent}`,
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={logoPath} alt="Logo" style={{ width: '28px', height: '28px', borderRadius: '6px', border: `1px solid ${BRAND.accent}` }} />
              <div>
                <span style={{ color: '#ffffff', fontSize: '11px', fontWeight: 'bold', ...(isAr ? textStyle : englishStyle) }}>
                  {isAr ? 'مركز الامان العالي' : 'High Safety Center'}
                </span>
                <span style={{ color: BRAND.accentLight, fontSize: '9px', ...(isAr ? { marginRight: '8px', ...englishStyle } : { marginLeft: '8px', ...textStyle }) }}>
                  {isAr ? 'High Safety Center' : 'مركز الامان العالي'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: '9px', ...englishStyle }}>Tel: 0542206000</span>
              <span style={{ color: '#94a3b8', fontSize: '9px', ...englishStyle }}>highsafety2021@gmail.com</span>
            </div>
          </div>
          <p style={{ 
            color: BRAND.muted, 
            fontSize: '7px', 
            textAlign: 'center', 
            margin: '10px 0 0 0',
            borderTop: `1px solid ${BRAND.secondary}`,
            paddingTop: '10px',
          }}>
            {isAr ? (
              <>
                <span style={textStyle}>هذا التقرير يعكس حالة المركبة وقت الفحص فقط</span>
                <span style={{ ...englishStyle, marginRight: '8px' }}>| This report reflects the vehicle condition at the time of inspection only</span>
              </>
            ) : (
              <>
                <span style={englishStyle}>This report reflects the vehicle condition at the time of inspection only</span>
                <span style={{ ...textStyle, marginLeft: '8px' }}>| هذا التقرير يعكس حالة المركبة وقت الفحص فقط</span>
              </>
            )}
            <span style={{ ...englishStyle, ...(isAr ? { marginRight: '8px' } : { marginLeft: '8px' }) }}>| Report ID: HS-{inspection.id}</span>
          </p>
        </div>
      </div>
    );
  }
);

PdfReportTemplate.displayName = 'PdfReportTemplate';

interface CarPhotoSection {
  key: string;
  ar: string;
  en: string;
  exteriorPhoto?: string | null;
  interiorPhoto?: string | null;
}

export const PdfCarPhotosPage = forwardRef<HTMLDivElement, PdfReportTemplateProps>(
  ({ inspection, lang = 'ar' }, ref) => {
    const isAr = lang === 'ar';
    const sections: CarPhotoSection[] = [
      {
        key: 'frontRight',
        ar: 'الباب الأمامي الأيمن',
        en: 'Front Right Door',
        exteriorPhoto: inspection.frontRightDoorPhoto,
        interiorPhoto: null,
      },
      {
        key: 'frontLeft',
        ar: 'الباب الأمامي الأيسر',
        en: 'Front Left Door',
        exteriorPhoto: inspection.frontLeftDoorPhoto,
        interiorPhoto: null,
      },
      {
        key: 'rearRight',
        ar: 'الباب الخلفي الأيمن',
        en: 'Rear Right Door',
        exteriorPhoto: inspection.rearRightDoorPhoto,
        interiorPhoto: null,
      },
      {
        key: 'rearLeft',
        ar: 'الباب الخلفي الأيسر',
        en: 'Rear Left Door',
        exteriorPhoto: inspection.rearLeftDoorPhoto,
        interiorPhoto: null,
      },
      {
        key: 'hood',
        ar: 'غطاء المحرك',
        en: 'Hood / Engine Bay',
        exteriorPhoto: inspection.hoodPhoto,
        interiorPhoto: null,
      },
      {
        key: 'trunk',
        ar: 'صندوق الأمتعة',
        en: 'Trunk',
        exteriorPhoto: inspection.trunkPhoto,
        interiorPhoto: null,
      },
    ];

    const hasAnyPhoto = sections.some(s => s.exteriorPhoto || s.interiorPhoto);
    if (!hasAnyPhoto) return null;

    const inspectionDate = inspection.createdAt ? new Date(inspection.createdAt) : new Date();
    const reportTime = inspectionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const englishDate = inspectionDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const inspectionTypeLabel = getInspectionTypeLabel(inspection.inspectionType);
    const vehicleColor = getVehicleColor(inspection.color);

    return (
      <div
        ref={ref}
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          width: '794px',
          height: '1123px',
          backgroundColor: '#ffffff',
          padding: '0',
          margin: '0',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          ...(isAr ? textStyle : englishStyle),
        }}
      >
        {/* Header with branding */}
        <div style={{
          background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.secondary} 100%)`,
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          borderBottom: `4px solid ${BRAND.accent}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              border: `2px solid ${BRAND.accent}`,
            }}>
              <img src={logoPath} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <h1 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 'bold', margin: 0, ...arTextStyle }}>
                {isAr ? 'مركز الأمان العالي' : 'HIGH SAFETY CENTER'}
              </h1>
              <p style={{ color: BRAND.accentLight, fontSize: '10px', margin: '2px 0 0 0', ...(isAr ? englishStyle : arTextStyle), fontWeight: '600' }}>
                {isAr ? 'HIGH SAFETY CENTER' : 'مركز الأمان العالي'}
              </p>
            </div>
          </div>
          <div style={{ textAlign: isAr ? 'left' : 'right' }}>
            <div style={{
              background: `linear-gradient(135deg, ${BRAND.accent} 0%, ${BRAND.accentLight} 100%)`,
              color: BRAND.primary,
              padding: '5px 14px',
              borderRadius: '20px',
              fontSize: '10px',
              fontWeight: 'bold',
              marginBottom: '5px',
              boxShadow: '0 2px 8px rgba(197,133,44,0.4)',
            }}>
              {isAr ? (
                <>
                  <span style={arTextStyle}>{inspectionTypeLabel.ar}</span>
                  <span style={{ ...englishStyle, marginRight: '6px', fontSize: '9px' }}>| {inspectionTypeLabel.en}</span>
                </>
              ) : (
                <>
                  <span style={englishStyle}>{inspectionTypeLabel.en}</span>
                  <span style={{ ...arTextStyle, marginLeft: '6px', fontSize: '9px' }}>| {inspectionTypeLabel.ar}</span>
                </>
              )}
            </div>
            <p style={{ color: '#94a3b8', fontSize: '9px', margin: 0, ...englishStyle }}>
              {englishDate} | {reportTime}
            </p>
          </div>
        </div>

        {/* Vehicle Info Bar */}
        <div style={{
          backgroundColor: BRAND.light,
          padding: '10px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          borderBottom: `1px solid ${BRAND.border}`,
          flexShrink: 0,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ color: BRAND.muted, fontSize: '7px', margin: '0 0 2px 0', ...englishStyle }}>
                {isAr ? 'المركبة | Vehicle' : 'Vehicle | المركبة'}
              </p>
              <p style={{ color: BRAND.dark, fontSize: '14px', fontWeight: 'bold', margin: 0, ...englishStyle }}>
                {inspection.make} {inspection.model}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                backgroundColor: '#ffffff',
                border: `1px solid ${BRAND.border}`,
                borderRadius: '12px',
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: 'bold',
                color: BRAND.dark,
                ...englishStyle,
              }}>
                {inspection.year}
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#ffffff',
                border: `1px solid ${BRAND.border}`,
                padding: '3px 10px',
                borderRadius: '12px',
                fontSize: '10px',
              }}>
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: vehicleColor.hex,
                  border: vehicleColor.hex === '#FFFFFF' ? '1px solid #ccc' : 'none',
                  display: 'inline-block',
                  flexShrink: 0,
                }}></span>
                <span style={{ color: BRAND.dark, ...arTextStyle }}>{vehicleColor.ar}</span>
                <span style={{ color: BRAND.muted, ...englishStyle, fontSize: '9px' }}>{vehicleColor.en}</span>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {inspection.customerName && (
              <div style={{ textAlign: isAr ? 'left' : 'right' }}>
                <p style={{ color: BRAND.muted, fontSize: '7px', margin: '0 0 2px 0' }}>
                  {isAr ? 'العميل | Customer' : 'Customer | العميل'}
                </p>
                <p style={{ color: BRAND.dark, fontSize: '12px', fontWeight: 'bold', margin: 0, ...arTextStyle }}>
                  {inspection.customerName}
                </p>
              </div>
            )}
            {(inspection.odometer || inspection.mileage) && (
              <div style={{
                background: '#0a0a0a',
                borderRadius: '6px',
                padding: '4px 8px',
                border: '1px solid #333',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  {String(inspection.odometer || inspection.mileage || 0).padStart(6, '0').split('').map((digit, i) => (
                    <div key={i} style={{
                      width: '9px',
                      height: '13px',
                      background: i < 5 ? 'linear-gradient(180deg, #1a1a1a, #2a2a2a, #1a1a1a)' : 'linear-gradient(180deg, #ff2222, #cc0000, #aa0000)',
                      borderRadius: '1px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #333',
                    }}>
                      <span style={{ color: '#fff', fontSize: '9px', fontWeight: 'bold', fontFamily: 'Arial' }}>{digit}</span>
                    </div>
                  ))}
                  <span style={{ color: '#888', fontSize: '6px', marginLeft: '3px', ...englishStyle }}>km</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* VIN Bar */}
        <div style={{
          padding: '6px 24px',
          backgroundColor: '#ffffff',
          borderBottom: `1px solid ${BRAND.border}`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 0,
        }}>
          <span style={{ color: BRAND.muted, fontSize: '7px', letterSpacing: '0.5px', ...englishStyle }}>VIN</span>
          <div style={{
            background: 'linear-gradient(180deg, #f5f5f5, #e8e8e8, #f0f0f0)',
            borderRadius: '3px',
            padding: '4px 12px',
            border: '1px solid #bbb',
          }}>
            <span style={{
              fontFamily: "'Courier New', 'Consolas', monospace",
              fontWeight: 900,
              fontSize: '11px',
              color: '#1a1a1a',
              letterSpacing: '2.5px',
            }}>
              {inspection.vin}
            </span>
          </div>
          <span style={{ color: BRAND.muted, fontSize: '7px', ...englishStyle }}>HS-{inspection.id}</span>
        </div>

        {/* Section Title */}
        <div style={{
          padding: '8px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
        }}>
          <div style={{
            width: '4px',
            height: '18px',
            backgroundColor: BRAND.accent,
            borderRadius: '3px',
          }}></div>
          <h2 style={{ color: BRAND.dark, fontSize: '13px', fontWeight: 'bold', margin: 0, ...(isAr ? arTextStyle : englishStyle) }}>
            {isAr ? 'صور أقسام المركبة' : 'Vehicle Section Photos'}
          </h2>
          <span style={{ color: BRAND.muted, fontSize: '10px', ...(isAr ? englishStyle : arTextStyle) }}>
            {isAr ? 'Vehicle Section Photos' : 'صور أقسام المركبة'}
          </span>
        </div>

        {/* Photos Grid */}
        <div style={{
          flex: 1,
          padding: '0 20px 10px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: '8px',
          overflow: 'hidden',
        }}>
          {sections.map((section) => {
            const hasExterior = !!section.exteriorPhoto;
            const hasInterior = !!section.interiorPhoto;

            return (
              <div
                key={section.key}
                style={{
                  border: `1px solid ${BRAND.border}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#ffffff',
                }}
              >
                <div style={{
                  background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.secondary} 100%)`,
                  padding: '5px 10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ color: '#ffffff', fontSize: '10px', fontWeight: 'bold', ...(isAr ? arTextStyle : englishStyle) }}>
                    {isAr ? section.ar : section.en}
                  </span>
                  <span style={{ color: BRAND.accentLight, fontSize: '8px', ...(isAr ? englishStyle : arTextStyle) }}>
                    {isAr ? section.en : section.ar}
                  </span>
                </div>

                <div style={{
                  flex: 1,
                  display: 'flex',
                  gap: '3px',
                  padding: '3px',
                  minHeight: 0,
                }}>
                  {hasExterior && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{
                        fontSize: '7px',
                        color: BRAND.muted,
                        textAlign: 'center',
                        padding: '1px 0',
                        flexShrink: 0,
                        ...(isAr ? arTextStyle : englishStyle),
                      }}>
                        {isAr ? 'خارجي | Exterior' : 'Exterior | خارجي'}
                      </span>
                      <div style={{
                        flex: 1,
                        borderRadius: '4px',
                        overflow: 'hidden',
                        border: `1px solid ${BRAND.border}`,
                        minHeight: 0,
                      }}>
                        <img
                          src={section.exteriorPhoto!}
                          alt={`${section.en} Exterior`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </div>
                    </div>
                  )}
                  {hasInterior && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{
                        fontSize: '7px',
                        color: BRAND.muted,
                        textAlign: 'center',
                        padding: '1px 0',
                        flexShrink: 0,
                        ...(isAr ? arTextStyle : englishStyle),
                      }}>
                        {isAr ? 'داخلي | Interior' : 'Interior | داخلي'}
                      </span>
                      <div style={{
                        flex: 1,
                        borderRadius: '4px',
                        overflow: 'hidden',
                        border: `1px solid ${BRAND.border}`,
                        minHeight: 0,
                      }}>
                        <img
                          src={section.interiorPhoto!}
                          alt={`${section.en} Interior`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </div>
                    </div>
                  )}
                  {!hasExterior && !hasInterior && (
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: BRAND.light,
                      borderRadius: '4px',
                      border: `1px dashed ${BRAND.border}`,
                    }}>
                      <span style={{ color: BRAND.muted, fontSize: '9px', ...(isAr ? arTextStyle : englishStyle) }}>
                        {isAr ? 'لا توجد صور' : 'No Photos'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.secondary} 100%)`,
          padding: '10px 24px',
          flexShrink: 0,
          borderTop: `3px solid ${BRAND.accent}`,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src={logoPath} alt="Logo" style={{ width: '22px', height: '22px', borderRadius: '4px', border: `1px solid ${BRAND.accent}` }} />
              <span style={{ color: '#ffffff', fontSize: '10px', fontWeight: 'bold', ...arTextStyle }}>
                {isAr ? 'مركز الأمان العالي' : 'High Safety Center'}
              </span>
              <span style={{ color: BRAND.accentLight, fontSize: '8px', ...(isAr ? englishStyle : arTextStyle) }}>
                {isAr ? 'High Safety Center' : 'مركز الأمان العالي'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: '8px', ...englishStyle }}>Tel: 0542206000</span>
              <span style={{ color: '#94a3b8', fontSize: '8px', ...englishStyle }}>highsafety2021@gmail.com</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

PdfCarPhotosPage.displayName = 'PdfCarPhotosPage';
