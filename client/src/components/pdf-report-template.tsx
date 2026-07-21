import { forwardRef } from 'react';
import logoPath from '@assets/hs-logo.png';
import hsCarBranding from '@assets/hs_car_branding.png';
import reshaper from 'arabic-reshaper';

// Helper function to connect Arabic text for html2canvas rendering
const fixArabic = (text: any): string => {
  if (text === null || text === undefined) return '';
  const str = String(text).trim();
  if (!str) return '';

  const arabicRegex = /[\u0600-\u06FF]/;
  if (!arabicRegex.test(str)) {
    return str; // Return unchanged if there's no Arabic characters
  }

  // Resolve named/default export of arabic-reshaper CommonJS module
  const convertArabic = (reshaper as any).convertArabic || 
                        (reshaper as any).default?.convertArabic || 
                        reshaper;

  if (typeof convertArabic !== 'function') {
    return str;
  }

  // ONLY shape the text. DO NOT reverse the characters or tokens because the DOM has dir="rtl"
  return convertArabic(str);
};

// Shorthand helper for JSX clean syntax
const f = (text: any): string => fixArabic(text);

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
  obdCodes?: any;
}

type PdfLang = 'ar' | 'en';

interface PdfReportTemplateProps {
  inspection: Inspection;
  lang?: PdfLang;
  pageNum?: number;
  totalPages?: number;
}

const BRAND = {
  primary: '#0F172A',      // Slate 900
  secondary: '#334155',    // Slate 700
  accent: '#A57C48',       // Muted gold
  accentLight: '#F5E6D3',  // Gold tint
  success: '#059669',      // Flat emerald green
  successBg: '#ECFDF5',
  warning: '#D97706',      // Flat amber
  warningBg: '#FFFBEB',
  danger: '#DC2626',       // Flat red
  dangerBg: '#FEF2F2',
  light: '#F8FAFC',        // Slate 50
  border: '#E2E8F0',       // Slate 200
  dark: '#0F172A',
  text: '#1E293B',         // Slate 800
  textMuted: '#64748B',    // Slate 500
};

const CATEGORIES: Record<string, { ar: string; en: string; section?: string }> = {
  engine: { ar: 'المحرك', en: 'Engine', section: 'engine' },
  suspension_system: { ar: 'نظام التعليق', en: 'Suspension System', section: 'brake_system' },
  steering_system: { ar: 'نظام التوجيه', en: 'Steering System', section: 'brake_system' },
  brake_system: { ar: 'نظام الفرامل', en: 'Brake System', section: 'brake_system' },
  fuel_exhaust: { ar: 'نظام الوقود والعادم', en: 'Fuel & Exhaust', section: 'fuel_exhaust' },
  ac_cooling: { ar: 'نظام التكييف والتبريد', en: 'AC & Cooling', section: 'ac_cooling' },
  misc_mechanical: { ar: 'أعطال ميكانيكية متنوعة', en: 'Misc Mechanical', section: 'engine' },
  suspension: { ar: 'التعليق', en: 'Suspension', section: 'brake_system' },
  brakes: { ar: 'الفرامل', en: 'Brakes', section: 'brake_system' },
  ac: { ar: 'التكييف', en: 'A/C', section: 'ac_cooling' },
  exhaust: { ar: 'العادم', en: 'Exhaust', section: 'fuel_exhaust' },
  
  transmission: { ar: 'ناقل الحركة', en: 'Transmission', section: 'transmission' },
  transmission_auto: { ar: 'قير أوتوماتيك', en: 'Automatic Transmission', section: 'transmission' },
  transmission_manual: { ar: 'قير عادي', en: 'Manual Transmission', section: 'transmission' },
  transmission_performance: { ar: 'أداء ناقل الحركة', en: 'Transmission Performance', section: 'transmission' },
  transmission_sounds: { ar: 'أصوات ناقل الحركة', en: 'Transmission Sounds', section: 'transmission' },
  transmission_leaks: { ar: 'تسريبات ناقل الحركة', en: 'Transmission Leaks', section: 'transmission' },
  transmission_shifting: { ar: 'التبديل والتعشيق', en: 'Gear Shifting', section: 'transmission' },
  
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
  front_chest: { ar: 'صدر أمامي', en: 'Front Frame', section: 'body' },
  rear_chest: { ar: 'صدر خلفي', en: 'Rear Frame', section: 'body' },
  front_bumper: { ar: 'الدعامية الأمامية', en: 'Front Bumper', section: 'body' },
  rear_bumper: { ar: 'الدعامية الخلفية', en: 'Rear Bumper', section: 'body' },
  bumper_frame_front: { ar: 'جسر الدعامية الأمامية', en: 'Front Bumper Frame', section: 'body' },
  bumper_frame_rear: { ar: 'جسر الدعامية الخلفية', en: 'Rear Bumper Frame', section: 'body' },
  fender_front: { ar: 'الرفرف الأمامي', en: 'Front Fender', section: 'body' },
  fender_rear: { ar: 'الرفرف الخلفي', en: 'Rear Fender', section: 'body' },
  doors: { ar: 'الأبواب', en: 'Doors', section: 'body' },
  fenders: { ar: 'الرفارف', en: 'Fenders', section: 'body' },
  
  chassis: { ar: 'الشاسيه', en: 'Chassis', section: 'chassis' },
  chassis_frame: { ar: 'الهيكل والإطار', en: 'Chassis & Frame', section: 'chassis' },
  chassis_alignment: { ar: 'الاستقامة والاتزان', en: 'Alignment', section: 'chassis' },
  chassis_welding: { ar: 'القص واللحام', en: 'Cutting & Welding', section: 'chassis' },
  chassis_accident: { ar: 'آثار الحوادث القوية', en: 'Accident Damage', section: 'chassis' },
  
  electrical: { ar: 'الكهرباء', en: 'Electrical', section: 'electrical_system' },
  electrical_system: { ar: 'النظام الكهربائي', en: 'Electrical System', section: 'electrical_system' },
  battery: { ar: 'البطارية', en: 'Battery', section: 'electrical_system' },
  exterior_lighting: { ar: 'الإضاءة الخارجية', en: 'Exterior Lighting', section: 'electrical_system' },
  lights_front: { ar: 'الأضواء الأمامية', en: 'Front Lights', section: 'electrical_system' },
  lights_rear: { ar: 'الأضواء الخلفية', en: 'Rear Lights', section: 'electrical_system' },
  wire_harness: { ar: 'أسلاك التوصيل والظفيرة', en: 'Wire Harness', section: 'electrical_system' },
  mirror_controls: { ar: 'أزرار تحكم المرايا والزجاج', en: 'Mirror Controls', section: 'electrical_system' },
  computer_sensors: { ar: 'فحص الكمبيوتر والحساسات', en: 'Computer & Sensors', section: 'electrical_system' },
  lights: { ar: 'الإضاءة', en: 'Lights', section: 'electrical_system' },
  
  interior: { ar: 'الداخلية', en: 'Interior', section: 'body' },
  safety: { ar: 'أنظمة السلامة', en: 'Safety', section: 'electrical_system' },
  safety_systems: { ar: 'الوسائد الهوائية والأحزمة', en: 'Safety Systems', section: 'electrical_system' },
  tires_rims: { ar: 'الإطارات والجنوط', en: 'Tires & Rims', section: 'brake_system' },
  windows: { ar: 'الزجاج والنوافذ', en: 'Glass & Windows', section: 'body' },
  mirrors: { ar: 'المرايا الداخلية والخارجية', en: 'Mirrors', section: 'body' },
  accessories: { ar: 'الإكسسوارات والملحقات', en: 'Accessories', section: 'body' },
  documentation: { ar: 'الوثائق والتوثيق', en: 'Documentation', section: 'body' },
  tires: { ar: 'الإطارات', en: 'Tires', section: 'brake_system' },
  wheels: { ar: 'الجنوط', en: 'Wheels', section: 'brake_system' },
  glass: { ar: 'الزجاج', en: 'Glass', section: 'body' },
};

const getCategoryLabel = (catId: string) => CATEGORIES[catId] || { ar: catId, en: catId };

const getInspectionTypeLabel = (type?: string | null) => {
  switch (type) {
    case 'comprehensive': return { ar: 'تقرير فحص شامل للمركبة', en: 'Comprehensive Inspection Report' };
    case 'mechanical_computer': return { ar: 'تقرير فحص الميكانيكا والكمبيوتر', en: 'Mechanical & Computer Report' };
    case 'basic_parts': return { ar: 'تقرير فحص الأجزاء الأساسية', en: 'Basic Parts Report' };
    case 'custom': return { ar: 'تقرير فحص مخصص', en: 'Custom Inspection Report' };
    default: return { ar: 'تقرير فحص شامل للمركبة', en: 'Comprehensive Inspection Report' };
  }
};

const textStyle: React.CSSProperties = {
  fontFamily: '"Cairo", "Segoe UI", Tahoma, sans-serif',
  letterSpacing: '0px',
  wordSpacing: '0px',
  lineHeight: '1.5',
  fontSmooth: 'always',
  WebkitFontSmoothing: 'antialiased',
};

// ==========================================
// 1. PAGE 1: COVER PAGE
// ==========================================
export const PdfCoverPage = forwardRef<HTMLDivElement, PdfReportTemplateProps>(
  ({ inspection, lang = 'ar' }, ref) => {
    const isAr = lang === 'ar';
    const typeLabel = getInspectionTypeLabel(inspection.inspectionType);
    const formattedDate = inspection.createdAt 
      ? new Date(inspection.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '';

    return (
      <div 
        ref={ref}
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          width: '794px',
          height: '1123px',
          backgroundColor: BRAND.primary,
          padding: '60px 50px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          color: '#ffffff',
          overflow: 'hidden',
          ...textStyle,
        }}
      >
        <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', borderRight: `4px solid ${BRAND.accent}`, borderTop: `4px solid ${BRAND.accent}`, opacity: 0.8 }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '150px', height: '150px', borderLeft: `4px solid ${BRAND.accent}`, borderBottom: `4px solid ${BRAND.accent}`, opacity: 0.8 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <img src={logoPath} alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
          <div style={{ textAlign: isAr ? 'left' : 'right' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: BRAND.accent, letterSpacing: '1px' }}>{f('HIGH SAFETY')}</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#94A3B8', letterSpacing: '0.5px' }}>{f('INTERNATIONAL INSPECTION CENTER')}</p>
          </div>
        </div>

        <div style={{ margin: '40px 0', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', height: '3px', width: '60px', backgroundColor: BRAND.accent, marginBottom: '20px' }} />
          <h1 style={{ fontSize: '26px', fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>
            {f(isAr ? typeLabel.ar : typeLabel.en)}
          </h1>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
            {f(isAr ? typeLabel.en : typeLabel.ar)}
          </p>
        </div>

        <div style={{
          width: '100%',
          height: '320px',
          borderRadius: '12px',
          overflow: 'hidden',
          border: `2px solid ${BRAND.accent}`,
          backgroundColor: '#1E293B',
        }}>
          {inspection.mainCarPhoto ? (
            <img src={inspection.mainCarPhoto} alt="Vehicle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={hsCarBranding} alt="High Safety" style={{ width: '80%', height: '80%', objectFit: 'contain', opacity: 0.15 }} />
            </div>
          )}
        </div>

        <div style={{
          backgroundColor: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
        }}>
          <div>
            <span style={{ fontSize: '10px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>{f(isAr ? 'المركبة' : 'VEHICLE')}</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{f(inspection.make)} {f(inspection.model)} ({f(inspection.year)})</span>
          </div>
          <div>
            <span style={{ fontSize: '10px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>{f(isAr ? 'رقم الشاصي (VIN)' : 'CHASSIS NO. (VIN)')}</span>
            <span style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1px' }}>{f(inspection.vin)}</span>
          </div>
          <div>
            <span style={{ fontSize: '10px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>{f(isAr ? 'اسم العميل' : 'CUSTOMER NAME')}</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{f(inspection.customerName || '-')}</span>
          </div>
          <div>
            <span style={{ fontSize: '10px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>{f(isAr ? 'تاريخ الفحص' : 'INSPECTION DATE')}</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{f(formattedDate)}</span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#94A3B8' }}>
          <span>{f(isAr ? 'مركز الأمان العالي الدولي لفحص السيارات' : 'High Safety International Vehicle Inspection Center')}</span>
          <span>{f(`ID: HS-${inspection.id}`)}</span>
        </div>
      </div>
    );
  }
);
PdfCoverPage.displayName = 'PdfCoverPage';

// ==========================================
// 2. PAGE 2: MAIN REPORT (OVERVIEW & ISSUES)
// ==========================================
export const PdfReportTemplate = forwardRef<HTMLDivElement, PdfReportTemplateProps>(
  ({ inspection, lang = 'ar', pageNum = 2, totalPages = 4 }, ref) => {
    const isAr = lang === 'ar';
    const items = inspection.items || [];
    const failItems = items.filter(i => i.status === 'fail');
    const warningItems = items.filter(i => i.status === 'warning');
    const issueItems = [...failItems, ...warningItems];
    const formattedDate = inspection.createdAt 
      ? new Date(inspection.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : '';

    // Main systems list for the summary grid
    const mainCategories = [
      { id: 'engine', ar: 'المحرك وملحقاته', en: 'Engine & Components' },
      { id: 'transmission', ar: 'ناقل الحركة (الجير)', en: 'Transmission (Gearbox)' },
      { id: 'chassis', ar: 'الشاسيه وهيكل السيارة', en: 'Chassis & Frame' },
      { id: 'body', ar: 'الهيكل الخارجي والطلاء', en: 'External Body & Paint' },
      { id: 'brake_system', ar: 'أنظمة الفرامل والتعليق', en: 'Brakes & Suspension' },
      { id: 'electrical_system', ar: 'الكهرباء والكمبيوتر', en: 'Electrical & Computer' },
      { id: 'ac_cooling', ar: 'التكييف ونظام التبريد', en: 'A/C & Cooling System' },
      { id: 'fuel_exhaust', ar: 'نظام الوقود والعادم', en: 'Fuel & Exhaust System' },
    ];

    // Compute status of a system category
    const getCategoryStatus = (catId: string) => {
      const catItems = items.filter(i => {
        const catInfo = CATEGORIES[i.category];
        return i.category === catId || (catInfo && catInfo.section === catId);
      });
      if (catItems.length === 0) return 'good';
      if (catItems.some(i => i.status === 'fail')) return 'fail';
      if (catItems.some(i => i.status === 'warning')) return 'warning';
      return 'good';
    };

    const getStatusStyle = (status: string) => {
      switch (status) {
        case 'fail':
          return { bg: BRAND.dangerBg, border: BRAND.danger, text: BRAND.danger, icon: '✗', label: isAr ? 'عطل' : 'Fault' };
        case 'warning':
          return { bg: BRAND.warningBg, border: BRAND.warning, text: BRAND.warning, icon: '⚠', label: isAr ? 'تنبيه' : 'Warning' };
        default:
          return { bg: BRAND.successBg, border: BRAND.success, text: BRAND.success, icon: '✓', label: isAr ? 'سليم' : 'Good' };
      }
    };

    return (
      <div 
        ref={ref}
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          width: '794px',
          height: '1123px',
          backgroundColor: '#ffffff',
          padding: '40px 30px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: BRAND.text,
          overflow: 'hidden',
          ...textStyle,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${BRAND.border}`, paddingBottom: '12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={logoPath} alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: BRAND.primary }}>{f(isAr ? 'مركز الأمان العالي' : 'High Safety Center')}</h3>
              <p style={{ margin: 0, fontSize: '8px', color: BRAND.textMuted }}>{f(isAr ? 'تقرير فحص الأنظمة والعيوب المكتشفة' : 'System Diagnostic & Findings')}</p>
            </div>
          </div>
          <div style={{ textAlign: isAr ? 'left' : 'right', fontSize: '9px', color: BRAND.textMuted }}>
            <span>{f(`ID: HS-${inspection.id} | ${formattedDate}`)}</span>
          </div>
        </div>

        {/* Overall Status Bar (No specs duplication) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${BRAND.border}`, borderRadius: '8px', padding: '10px 16px', backgroundColor: BRAND.light, margin: '10px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: BRAND.textMuted }}>{f(isAr ? 'حالة المركبة العامة:' : 'Overall Vehicle Status:')}</span>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: failItems.length > 0 ? BRAND.danger : warningItems.length > 0 ? BRAND.warning : BRAND.success }}>
              {f(failItems.length > 0 ? (isAr ? 'يوجد أعطال حرجة بحاجة لإصلاح' : 'Critical faults detected') : warningItems.length > 0 ? (isAr ? 'توجد ملاحظات بحاجة لمتابعة' : 'Warnings detected') : (isAr ? 'المركبة سليمة وخالية من الأعطال' : 'Vehicle is in good condition'))}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ fontSize: '11px' }}>
              <strong style={{ color: BRAND.danger }}>{f(failItems.length)}</strong> {f(isAr ? ' أعطال حرجة' : ' Critical Faults')}
            </div>
            <div style={{ width: '1px', height: '14px', backgroundColor: BRAND.border }} />
            <div style={{ fontSize: '11px' }}>
              <strong style={{ color: BRAND.warning }}>{f(warningItems.length)}</strong> {f(isAr ? ' ملاحظات' : ' Warnings')}
            </div>
          </div>
        </div>

        {/* 1. Systems Inspection Summary Grid */}
        <div style={{ flexShrink: 0, marginBottom: '8px' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: BRAND.primary, borderBottom: `1px solid ${BRAND.border}`, paddingBottom: '4px', margin: '0 0 6px 0' }}>
            {f(isAr ? 'ملخص فحص الأنظمة والقطاعات الرئيسية' : 'Systems Inspection Status Summary')}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {mainCategories.map(cat => {
              const status = getCategoryStatus(cat.id);
              const style = getStatusStyle(status);
              return (
                <div 
                  key={cat.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '6px 10px', 
                    borderRadius: '6px', 
                    border: `1px solid ${style.border}30`, 
                    backgroundColor: style.bg,
                    fontSize: '11px'
                  }}
                >
                  <span style={{ fontWeight: 'bold', color: BRAND.text }}>{f(isAr ? cat.ar : cat.en)}</span>
                  <span style={{ 
                    fontWeight: 'bold', 
                    color: style.text, 
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>{style.icon}</span>
                    <span>{f(style.label)}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Detailed Findings List */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: BRAND.primary, borderBottom: `1px solid ${BRAND.border}`, paddingBottom: '4px', margin: '0 0 6px 0', flexShrink: 0 }}>
            {f(isAr ? 'تفاصيل الملاحظات والعيوب المسجلة' : 'Detailed Defect & Findings List')}
          </h2>
          
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {issueItems.length === 0 ? (
              <div style={{
                backgroundColor: BRAND.successBg,
                border: `1px solid ${BRAND.success}30`,
                borderRadius: '8px',
                padding: '24px',
                textAlign: 'center',
                margin: '20px 0',
              }}>
                <span style={{ fontSize: '20px', display: 'block', marginBottom: '4px' }}>💚</span>
                <h3 style={{ color: BRAND.success, margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '12px' }}>
                  {f(isAr ? 'المركبة سليمة وفحص الأنظمة ممتاز' : 'All Inspected Systems are Healthy')}
                </h3>
                <p style={{ color: BRAND.textMuted, fontSize: '10px', margin: 0 }}>
                  {f(isAr ? 'لم يتم رصد أي ملاحظات فنية أو أعطال في الفحص البصري والميكانيكي.' : 'No faults or warnings were recorded during this inspection.')}
                </p>
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '8px',
                paddingBottom: '8px'
              }}>
                {issueItems.slice(0, 10).map((item, idx) => {
                  const isFail = item.status === 'fail';
                  const statusColor = isFail ? BRAND.danger : BRAND.warning;
                  const catLabel = getCategoryLabel(item.category);

                  return (
                    <div 
                      key={item.id || idx}
                      style={{
                        border: `1px solid ${BRAND.border}`,
                        borderRadius: '6px',
                        padding: '8px',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'flex-start',
                      }}
                    >
                      {item.imageUrl && (
                        <img 
                          src={item.imageUrl} 
                          alt="Defect" 
                          style={{ width: '54px', height: '54px', objectFit: 'cover', borderRadius: '4px', border: `1px solid ${BRAND.border}`, flexShrink: 0 }} 
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '2px', alignItems: 'center' }}>
                          <span style={{ 
                            fontSize: '8px', 
                            fontWeight: 'bold', 
                            color: '#ffffff', 
                            backgroundColor: statusColor, 
                            padding: '1px 4px', 
                            borderRadius: '3px' 
                          }}>
                            {f(isAr ? (isFail ? 'عطل' : 'تنبيه') : (isFail ? 'FAIL' : 'WARN'))}
                          </span>
                          <span style={{ fontSize: '9px', fontWeight: 'bold', color: BRAND.textMuted }}>
                            {f(isAr ? catLabel.ar : catLabel.en)}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: BRAND.primary, margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {f(item.faultName)}
                        </h4>
                        <p style={{ fontSize: '9px', color: BRAND.textMuted, margin: 0, lineHeight: '1.3', height: '2.6em', overflow: 'hidden' }}>
                          {f(item.description || item.notes || (isAr ? 'لا يوجد تفاصيل إضافية.' : 'No additional details.'))}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${BRAND.border}`, paddingTop: '10px', fontSize: '9px', color: BRAND.textMuted, display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
          <span>{f(isAr ? 'مركز الأمان العالي الدولي لفحص السيارات' : 'High Safety International Vehicle Inspection Center')}</span>
          <span>{f(isAr ? `صفحة ${pageNum} من ${totalPages}` : `Page ${pageNum} of ${totalPages}`)}</span>
        </div>
      </div>
    );
  }
);
PdfReportTemplate.displayName = 'PdfReportTemplate';

// ==========================================
// 3. PAGE 3: DETAILED SECTION PHOTOS
// ==========================================
interface CarPhotoSection {
  key: string;
  ar: string;
  en: string;
  exteriorPhoto?: string | null;
  interiorPhoto?: string | null;
}

export const PdfCarPhotosPage = forwardRef<HTMLDivElement, PdfReportTemplateProps>(
  ({ inspection, lang = 'ar', pageNum = 3, totalPages = 4 }, ref) => {
    const isAr = lang === 'ar';
    const sections: CarPhotoSection[] = [
      { key: 'frontRight', ar: 'الباب الأمامي الأيمن', en: 'Front Right Door', exteriorPhoto: inspection.frontRightDoorPhoto, interiorPhoto: null },
      { key: 'frontLeft', ar: 'الباب الأمامي الأيسر', en: 'Front Left Door', exteriorPhoto: inspection.frontLeftDoorPhoto, interiorPhoto: null },
      { key: 'rearRight', ar: 'الباب الخلفي الأيمن', en: 'Rear Right Door', exteriorPhoto: inspection.rearRightDoorPhoto, interiorPhoto: null },
      { key: 'rearLeft', ar: 'الباب الخلفي الأيسر', en: 'Rear Left Door', exteriorPhoto: inspection.rearLeftDoorPhoto, interiorPhoto: null },
      { key: 'hood', ar: 'غطاء المحرك / الماكينة', en: 'Hood / Engine Bay', exteriorPhoto: inspection.hoodPhoto, interiorPhoto: null },
      { key: 'trunk', ar: 'صندوق الأمتعة الخلفي', en: 'Trunk', exteriorPhoto: inspection.trunkPhoto, interiorPhoto: null },
    ];

    const hasAnyPhoto = sections.some(s => s.exteriorPhoto || s.interiorPhoto);
    const formattedDate = inspection.createdAt 
      ? new Date(inspection.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : '';

    if (!hasAnyPhoto) return null;

    return (
      <div
        ref={ref}
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          width: '794px',
          height: '1123px',
          backgroundColor: '#ffffff',
          padding: '40px 30px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: BRAND.text,
          overflow: 'hidden',
          ...textStyle,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${BRAND.border}`, paddingBottom: '12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={logoPath} alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: BRAND.primary }}>{f(isAr ? 'مركز الأمان العالي' : 'High Safety Center')}</h3>
              <p style={{ margin: 0, fontSize: '8px', color: BRAND.textMuted }}>{f(isAr ? 'تقرير التوثيق الفوتوغرافي للسيارة' : 'Photographic Documentation')}</p>
            </div>
          </div>
          <div style={{ textAlign: isAr ? 'left' : 'right', fontSize: '9px', color: BRAND.textMuted }}>
            <span>{f(`ID: HS-${inspection.id} | ${formattedDate}`)}</span>
          </div>
        </div>

        <div style={{ margin: '15px 0 10px 0', flexShrink: 0 }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: BRAND.primary, margin: 0 }}>
            {f(isAr ? 'صور أجزاء هيكل السيارة الفعلي' : 'Vehicle Body Section Photos')}
          </h2>
          <p style={{ fontSize: '10px', color: BRAND.textMuted, margin: '2px 0 0 0' }}>
            {f(isAr ? 'توثيق فوتوغرافي عالي الدقة لأقسام السيارة المختلفة أثناء عملية الفحص' : 'High-resolution photographic records of various sections during the inspection.')}
          </p>
        </div>

        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: '8px',
          overflow: 'hidden',
          margin: '5px 0',
        }}>
          {sections.map((section) => {
            const hasExterior = !!section.exteriorPhoto;
            return (
              <div key={section.key} style={{ border: `1px solid ${BRAND.border}`, borderRadius: '6px', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
                <div style={{ background: BRAND.primary, padding: '4px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#ffffff', fontSize: '9px', fontWeight: 'bold' }}>{f(isAr ? section.ar : section.en)}</span>
                </div>
                <div style={{ flex: 1, display: 'flex', padding: '2px', minHeight: 0 }}>
                  {hasExterior ? (
                    <img src={section.exteriorPhoto || undefined} alt={`${section.en}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '3px' }} />
                  ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.light, borderRadius: '3px', border: `1px dashed ${BRAND.border}` }}>
                      <span style={{ color: BRAND.textMuted, fontSize: '9px' }}>{f(isAr ? 'لا توجد صور متوفرة' : 'No Photos')}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${BRAND.border}`, paddingTop: '10px', fontSize: '9px', color: BRAND.textMuted, display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
          <span>{f(isAr ? 'مركز الأمان العالي الدولي لفحص السيارات' : 'High Safety International Vehicle Inspection Center')}</span>
          <span>{f(isAr ? `صفحة ${pageNum} من ${totalPages}` : `Page ${pageNum} of ${totalPages}`)}</span>
        </div>
      </div>
    );
  }
);
PdfCarPhotosPage.displayName = 'PdfCarPhotosPage';

// ==========================================
// 4. PAGE 4: COMPUTER DIAGNOSTICS & SIGNATURES
// ==========================================
export const PdfSignaturesPage = forwardRef<HTMLDivElement, PdfReportTemplateProps>(
  ({ inspection, lang = 'ar', pageNum = 4, totalPages = 4 }, ref) => {
    const isAr = lang === 'ar';
    const obdCodes = (inspection.obdCodes as Array<{code: string; nameEn: string; nameAr: string; diagnosis?: string}> | null) || [];
    const formattedDate = inspection.createdAt 
      ? new Date(inspection.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : '';

    return (
      <div
        ref={ref}
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          width: '794px',
          height: '1123px',
          backgroundColor: '#ffffff',
          padding: '40px 30px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: BRAND.text,
          overflow: 'hidden',
          ...textStyle,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${BRAND.border}`, paddingBottom: '12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={logoPath} alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: BRAND.primary }}>{f(isAr ? 'مركز الأمان العالي' : 'High Safety Center')}</h3>
              <p style={{ margin: 0, fontSize: '8px', color: BRAND.textMuted }}>{f(isAr ? 'تقرير فحص الكمبيوتر والتواقيع الرسمية' : 'Diagnostics & Final Sign-Off')}</p>
            </div>
          </div>
          <div style={{ textAlign: isAr ? 'left' : 'right', fontSize: '9px', color: BRAND.textMuted }}>
            <span>{f(`ID: HS-${inspection.id} | ${formattedDate}`)}</span>
          </div>
        </div>

        {/* OBD Scan Results */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', marginBottom: '15px' }}>
          <div style={{ margin: '10px 0 10px 0', flexShrink: 0 }}>
            <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: BRAND.primary, margin: 0 }}>
              {f(isAr ? 'تقرير فحص أنظمة الكمبيوتر (OBD-II Scan)' : 'OBD-II Computer Diagnostic Scan')}
            </h2>
            <p style={{ fontSize: '10px', color: BRAND.textMuted, margin: '2px 0 0 0' }}>
              {f(isAr ? `أكواد الأعطال الإلكترونية النشطة المسجلة بالمركبة (${obdCodes.length} كود)` : `Active electronic DTC codes retrieved (${obdCodes.length} codes).`)}
            </p>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', border: `1px solid ${BRAND.border}`, borderRadius: '6px', backgroundColor: BRAND.light, padding: '8px' }}>
            {obdCodes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: BRAND.success }}>
                <span style={{ fontSize: '20px', display: 'block', marginBottom: '4px' }}>✔️</span>
                <span style={{ fontWeight: 'bold', fontSize: '11px' }}>{f(isAr ? 'فحص الكمبيوتر سليم - لا توجد أكواد أعطال مسجلة' : 'No DTC Codes Found')}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {obdCodes.map((obd, idx) => (
                  <div key={idx} style={{ backgroundColor: '#ffffff', border: `1px solid ${BRAND.border}`, borderRadius: '6px', padding: '8px', display: 'flex', gap: '10px' }}>
                    <div style={{ backgroundColor: BRAND.danger, color: '#ffffff', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '11px', padding: '3px 6px', borderRadius: '3px', alignSelf: 'flex-start' }}>
                      {f(obd.code)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: BRAND.primary, margin: '0 0 2px 0' }}>
                        {f(isAr ? obd.nameAr : obd.nameEn)}
                      </h4>
                      <p style={{ fontSize: '9px', color: BRAND.textMuted, margin: 0 }}>
                        {f(isAr ? obd.diagnosis : obd.nameEn)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Legal Disclaimers (Terms & Conditions) */}
        <div style={{ backgroundColor: BRAND.light, border: `1px solid ${BRAND.border}`, borderRadius: '6px', padding: '12px', flexShrink: 0, marginBottom: '15px' }}>
          <h3 style={{ fontSize: '11px', fontWeight: 'bold', color: BRAND.primary, margin: '0 0 6px 0', borderBottom: `1px solid ${BRAND.border}`, paddingBottom: '3px' }}>
            {f(isAr ? 'البنود والشروط القانونية لإخلاء المسؤولية' : 'Legal Terms & Disclaimers')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: '9px', lineHeight: '1.4' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{f(isAr ? '1. نطاق ومسؤولية الفحص:' : '1. Diagnostic Scope:')}</p>
              <p style={{ margin: 0, color: BRAND.textMuted }}>{f(isAr ? 'المركز مسؤول عن توثيق حالة المركبة وقت الفحص فقط، ولا يضمن عدم حدوث أعطال مستقبلية.' : 'The report reflects vehicle state at inspection time only. Subsequent issues are excluded.')}</p>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{f(isAr ? '2. المقتنيات الشخصية:' : '2. Personal Property:')}</p>
              <p style={{ margin: 0, color: BRAND.textMuted }}>{f(isAr ? 'المركز لا يتحمل مسؤولية فقدان أي مقتنيات شخصية لم يتم إخراجها من السيارة قبل الفحص.' : 'The center is not liable for personal items left in the vehicle during inspection.')}</p>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{f(isAr ? '3. صلاحية التقارير:' : '3. Licensing & Validity:')}</p>
              <p style={{ margin: 0, color: BRAND.textMuted }}>{f(isAr ? 'يعتبر هذا التقرير استشارياً فقط لتوجيه المشتري، وليس وثيقة ترخيص رسمية.' : 'This report is advisory and does not replace official licensing checks.')}</p>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{f(isAr ? '4. نظام مكافحة التزوير:' : '4. Tamper Protection:')}</p>
              <p style={{ margin: 0, color: BRAND.textMuted }}>{f(isAr ? 'التقرير مصدق ومحمي برمز كودي رقمي من المركز للتحقق من سلامة البيانات إلكترونياً.' : 'Report data is secured against tampering under High Safety standards.')}</p>
            </div>
          </div>
        </div>

        {/* Signatures & Verification */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px dashed ${BRAND.border}`, borderRadius: '6px', padding: '14px', flexShrink: 0 }}>
          <div style={{ textAlign: 'center', width: '200px' }}>
            <span style={{ fontSize: '9px', color: BRAND.textMuted, display: 'block', marginBottom: '15px' }}>{f(isAr ? 'توقيع الفاحص / المركز' : 'Inspector / Center Signature')}</span>
            <div style={{ width: '100px', height: '1px', backgroundColor: BRAND.textMuted, margin: '0 auto 4px' }} />
            <span style={{ fontSize: '8px', color: BRAND.textMuted }}>{f('HIGH SAFETY CENTER')}</span>
          </div>

          <div style={{ textAlign: 'center' }}>
            <img src={logoPath} alt="Verified Logo" style={{ width: '40px', height: '40px', opacity: 0.8 }} />
            <div style={{ fontSize: '8px', fontWeight: 'bold', color: BRAND.accent, marginTop: '2px', letterSpacing: '1px' }}>{f('VERIFIED REPORT')}</div>
          </div>

          <div style={{ textAlign: 'center', width: '200px' }}>
            <span style={{ fontSize: '9px', color: BRAND.textMuted, display: 'block', marginBottom: '15px' }}>{f(isAr ? 'توقيع العميل' : 'Customer Signature')}</span>
            {inspection.customerSignature ? (
              <img src={inspection.customerSignature} alt="Signature" style={{ height: '30px', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
            ) : (
              <div style={{ width: '100px', height: '1px', backgroundColor: BRAND.textMuted, margin: '0 auto 4px' }} />
            )}
            <span style={{ fontSize: '8px', color: BRAND.textMuted }}>{f(inspection.customerName || '-')}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${BRAND.border}`, paddingTop: '10px', fontSize: '9px', color: BRAND.textMuted, display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
          <span>{f(isAr ? 'مركز الأمان العالي الدولي لفحص السيارات' : 'High Safety International Vehicle Inspection Center')}</span>
          <span>{f(isAr ? `صفحة ${pageNum} من ${totalPages}` : `Page ${pageNum} of ${totalPages}`)}</span>
        </div>
      </div>
    );
  }
);
PdfReportTemplate.displayName = 'PdfReportTemplate';
