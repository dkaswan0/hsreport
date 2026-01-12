import { forwardRef } from 'react';
import logoPath from '@assets/logo_1767706304085.png';

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
}

interface PdfReportTemplateProps {
  inspection: Inspection;
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

const CATEGORIES: Record<string, { ar: string; en: string }> = {
  engine: { ar: 'المحرك', en: 'Engine' },
  transmission: { ar: 'ناقل الحركة', en: 'Transmission' },
  chassis: { ar: 'الشاسيه', en: 'Chassis' },
  body: { ar: 'الهيكل', en: 'Body' },
  tires: { ar: 'الاطارات', en: 'Tires' },
  brakes: { ar: 'الفرامل', en: 'Brakes' },
  electrical: { ar: 'الكهرباء', en: 'Electrical' },
  wheels: { ar: 'الجنوط', en: 'Wheels' },
  suspension: { ar: 'التعليق', en: 'Suspension' },
  ac: { ar: 'التكييف', en: 'A/C' },
  exhaust: { ar: 'العادم', en: 'Exhaust' },
  safety: { ar: 'السلامة', en: 'Safety' },
  front_bumper: { ar: 'الصدام الامامي', en: 'Front Bumper' },
  rear_bumper: { ar: 'الصدام الخلفي', en: 'Rear Bumper' },
  hood: { ar: 'الكبوت', en: 'Hood' },
  trunk: { ar: 'الشنطة', en: 'Trunk' },
  doors: { ar: 'الابواب', en: 'Doors' },
  fenders: { ar: 'الرفارف', en: 'Fenders' },
  roof: { ar: 'السقف', en: 'Roof' },
  lights: { ar: 'الاضاءة', en: 'Lights' },
  interior: { ar: 'الداخلية', en: 'Interior' },
  glass: { ar: 'الزجاج', en: 'Glass' },
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
  fontFamily: 'Tahoma, "Segoe UI", Arial, sans-serif',
  letterSpacing: '0',
  wordSpacing: '2px',
  lineHeight: '1.4',
};

const englishStyle: React.CSSProperties = {
  fontFamily: 'Arial, Helvetica, sans-serif',
  letterSpacing: '0.3px',
};

export const PdfReportTemplate = forwardRef<HTMLDivElement, PdfReportTemplateProps>(
  ({ inspection }, ref) => {
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
        dir="rtl"
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
          ...textStyle,
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
              <h1 style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold', margin: 0, ...textStyle }}>
                مركز الامان العالي
              </h1>
              <p style={{ color: BRAND.accentLight, fontSize: '11px', margin: '3px 0 0 0', ...englishStyle, fontWeight: '600' }}>
                HIGH SAFETY CENTER
              </p>
            </div>
          </div>
          
          <div style={{ textAlign: 'left' }}>
            <div style={{
              background: `linear-gradient(135deg, ${BRAND.accent} 0%, ${BRAND.accentLight} 100%)`,
              color: BRAND.primary,
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '10px',
              fontWeight: 'bold',
              marginBottom: '6px',
              boxShadow: '0 2px 8px rgba(197,133,44,0.4)',
              ...textStyle,
            }}>
              <span>{inspectionTypeLabel.ar}</span>
              <span style={{ ...englishStyle, marginRight: '6px', fontSize: '9px' }}>| {inspectionTypeLabel.en}</span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '9px', margin: 0, ...englishStyle }}>
              {englishDate} | {reportTime}
            </p>
            <p style={{ color: '#cbd5e1', fontSize: '10px', margin: '2px 0 0 0', ...textStyle }}>
              {reportDate}
            </p>
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
              <span style={textStyle}>المركبة</span>
              <span style={englishStyle}>Vehicle</span>
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

          {/* VIN - Metal Plate Style */}
          <div style={{ 
            background: 'linear-gradient(145deg, #d4d4d8 0%, #a1a1aa 25%, #d4d4d8 50%, #a1a1aa 75%, #d4d4d8 100%)',
            borderRadius: '8px', 
            padding: '10px 12px', 
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.15)',
            position: 'relative',
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              borderBottom: '1px solid rgba(82, 82, 91, 0.3)',
              paddingBottom: '4px',
              marginBottom: '4px',
            }}>
              <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#3f3f46', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {inspection.make || 'MANUFACTURER'}
              </span>
              <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#3f3f46' }}>
                {inspection.year || '----'}
              </span>
            </div>
            {inspection.model && (
              <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#27272a', textAlign: 'center', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                {inspection.model}
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '7px', fontWeight: 'bold', color: '#52525b' }}>VIN</span>
              <div style={{
                flex: 1,
                background: 'linear-gradient(180deg, #fafafa 0%, #e4e4e7 100%)',
                borderRadius: '4px',
                padding: '4px 6px',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15)',
              }}>
                <p style={{ 
                  fontFamily: "'Courier New', monospace",
                  fontWeight: 900,
                  fontSize: '9px',
                  color: '#18181b',
                  letterSpacing: '1.5px',
                  textAlign: 'center',
                  margin: 0,
                }}>
                  {inspection.vin}
                </p>
              </div>
            </div>
            <p style={{ fontSize: '6px', color: '#52525b', textAlign: 'center', margin: '4px 0 0 0', borderTop: '1px solid rgba(82, 82, 91, 0.2)', paddingTop: '3px' }}>
              VEHICLE IDENTIFICATION • Report: HS-{inspection.id}
            </p>
            <div style={{
              position: 'absolute',
              top: '6px',
              left: '6px',
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #a1a1aa, #52525b)',
            }} />
            <div style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #a1a1aa, #52525b)',
            }} />
          </div>

          {/* Odometer */}
          <div style={{
            background: `linear-gradient(180deg, ${BRAND.primary} 0%, #0a1420 100%)`,
            borderRadius: '10px',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
          }}>
            <p style={{ color: BRAND.muted, fontSize: '7px', margin: '0 0 2px 0', ...textStyle }}>
              عداد المسافة
            </p>
            <p style={{ color: BRAND.accentLight, fontSize: '7px', margin: '0 0 3px 0', ...englishStyle, textTransform: 'uppercase', letterSpacing: '1px' }}>
              ODOMETER
            </p>
            <div style={{
              background: 'linear-gradient(180deg, #0a0a14 0%, #1a1a2e 100%)',
              borderRadius: '5px',
              padding: '4px 10px',
              border: `2px solid ${BRAND.accent}`,
            }}>
              <span style={{
                color: '#00ff88',
                fontSize: '15px',
                fontFamily: "'Courier New', monospace",
                fontWeight: 'bold',
                textShadow: '0 0 8px rgba(0,255,136,0.5)',
              }}>
                {(inspection.odometer || inspection.mileage || 0).toLocaleString('en-US')}
              </span>
            </div>
            <p style={{ color: '#4ade80', fontSize: '9px', margin: '3px 0 0 0', ...englishStyle, fontWeight: 'bold' }}>
              KM
            </p>
          </div>

          {/* Health Score */}
          <div style={{ 
            background: '#ffffff', 
            borderRadius: '10px', 
            padding: '10px', 
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            border: `1px solid ${BRAND.border}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <p style={{ color: BRAND.muted, fontSize: '7px', margin: '0 0 4px 0', display: 'flex', gap: '4px' }}>
              <span style={textStyle}>نتيجة الفحص</span>
              <span style={englishStyle}>Score</span>
            </p>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: `4px solid ${healthColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${healthColor}15`,
            }}>
              <span style={{ color: healthColor, fontSize: '16px', fontWeight: 'bold', ...englishStyle }}>
                {healthPercent}%
              </span>
            </div>
            <p style={{ fontSize: '8px', color: healthColor, fontWeight: 'bold', margin: '4px 0 0 0', textAlign: 'center' }}>
              <span style={textStyle}>{healthLabel.ar}</span>
              <span style={{ ...englishStyle, marginRight: '4px' }}>| {healthLabel.en}</span>
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '8px', color: BRAND.success, fontWeight: 'bold', ...englishStyle }}>
                {passCount} <span style={textStyle}>سليم</span>
              </span>
              <span style={{ fontSize: '8px', color: BRAND.danger, fontWeight: 'bold', ...englishStyle }}>
                {failItems.length} <span style={textStyle}>عطل</span>
              </span>
            </div>
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
              <h2 style={{ color: '#166534', fontSize: '22px', fontWeight: 'bold', margin: '0 0 8px 0', ...textStyle }}>
                المركبة بحالة ممتازة
              </h2>
              <p style={{ color: '#15803d', fontSize: '14px', margin: 0, ...englishStyle }}>
                Vehicle in Excellent Condition - No Issues Found
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
                    <h2 style={{ color: BRAND.dark, fontSize: '14px', fontWeight: 'bold', margin: 0, ...textStyle }}>
                      البنود التي تحتاج متابعة
                    </h2>
                    <p style={{ color: BRAND.muted, fontSize: '9px', margin: '2px 0 0 0', ...englishStyle }}>
                      Items Requiring Attention ({itemCount} items)
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
                    <span style={textStyle}>يحتاج اصلاح</span> | {failItems.length} Fail
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
                    <span style={textStyle}>تحذير</span> | {warningItems.length} Warning
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
                            ...textStyle,
                          }}>
                            {catLabel.ar}
                          </span>
                          <span style={{ 
                            color: BRAND.muted, 
                            fontSize: catFontSize,
                            ...englishStyle,
                          }}>
                            {catLabel.en}
                          </span>
                        </div>
                        <p style={{ 
                          color: BRAND.dark, 
                          fontSize: titleSize, 
                          fontWeight: 'bold', 
                          margin: '0 0 2px 0',
                          lineHeight: '1.3',
                          ...textStyle,
                        }}>
                          {faultNameAr}
                        </p>
                        <p style={{ 
                          color: BRAND.muted, 
                          fontSize: fontSize, 
                          margin: '0 0 3px 0',
                          ...englishStyle,
                        }}>
                          {faultNameEn !== faultNameAr ? faultNameEn : ''}
                        </p>
                        <p style={{ 
                          color: itemColor, 
                          fontSize: catFontSize, 
                          margin: 0,
                          fontWeight: 'bold',
                        }}>
                          <span style={textStyle}>{isFail ? '\u25CF يحتاج اصلاح' : '\u25D0 ملاحظة'}</span>
                          <span style={{ ...englishStyle, marginRight: '4px' }}>| {isFail ? 'Needs Repair' : 'Needs Attention'}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Signature */}
        {(inspection.signature || inspection.customerSignature) && (
          <div style={{ 
            padding: '10px 24px', 
            borderTop: `1px solid ${BRAND.border}`,
            flexShrink: 0,
          }}>
            <div style={{
              backgroundColor: BRAND.light,
              borderRadius: '10px',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: `1px solid ${BRAND.border}`,
            }}>
              <div>
                <p style={{ color: BRAND.muted, fontSize: '8px', margin: '0 0 3px 0' }}>
                  <span style={textStyle}>توقيع العميل</span>
                  <span style={{ ...englishStyle, marginRight: '6px' }}>| Customer Signature</span>
                </p>
                <p style={{ color: BRAND.dark, fontSize: '12px', fontWeight: 'bold', margin: 0, ...textStyle }}>
                  {inspection.customerName || 'العميل'}
                </p>
              </div>
              <img 
                src={inspection.signature || inspection.customerSignature || ''} 
                alt="Signature" 
                style={{ 
                  height: '45px', 
                  maxWidth: '130px',
                  objectFit: 'contain',
                }} 
              />
            </div>
          </div>
        )}

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
                <span style={{ color: '#ffffff', fontSize: '11px', fontWeight: 'bold', ...textStyle }}>
                  مركز الامان العالي
                </span>
                <span style={{ color: BRAND.accentLight, fontSize: '9px', marginRight: '8px', ...englishStyle }}>
                  High Safety Center
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
            <span style={textStyle}>هذا التقرير يعكس حالة المركبة وقت الفحص فقط</span>
            <span style={{ ...englishStyle, marginRight: '8px' }}>| This report reflects the vehicle condition at the time of inspection only</span>
            <span style={{ ...englishStyle, marginRight: '8px' }}>| Report ID: HS-{inspection.id}</span>
          </p>
        </div>
      </div>
    );
  }
);

PdfReportTemplate.displayName = 'PdfReportTemplate';
