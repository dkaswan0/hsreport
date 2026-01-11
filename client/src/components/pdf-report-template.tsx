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
  primary: '#0C1A28',      // Navy blue
  secondary: '#1E3A5F',    // Medium blue
  accent: '#C5852C',       // Gold/Copper
  accentLight: '#E8B86D',  // Light gold
  success: '#059669',      // Green
  warning: '#D97706',      // Orange
  danger: '#DC2626',       // Red
  light: '#F8FAFC',        // Light background
  dark: '#0F172A',         // Dark text
  muted: '#64748B',        // Muted text
  border: '#E2E8F0',       // Border color
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

// Color mapping for vehicle colors
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
    case 'comprehensive': return { ar: 'فحص شامل', en: 'Comprehensive' };
    case 'mechanical_computer': return { ar: 'فحص ميكانيكي + كمبيوتر', en: 'Mechanical + Computer' };
    case 'basic_parts': return { ar: 'فحص قطع اساسية', en: 'Basic Parts' };
    case 'custom': return { ar: 'فحص مخصص', en: 'Custom' };
    default: return { ar: 'فحص شامل', en: 'Comprehensive' };
  }
};

// Use simple Arabic text without special characters for better PDF rendering
const textStyle: React.CSSProperties = {
  fontFamily: 'Tahoma, "Segoe UI", Arial, sans-serif',
  letterSpacing: '0',
  wordSpacing: '2px',
  lineHeight: '1.5',
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
    
    // Adaptive sizing
    let gridCols = 2;
    let fontSize = '12px';
    let catFontSize = '9px';
    let itemPad = '12px 14px';
    let imgSize = { w: '75px', h: '60px' };
    let gapSize = '10px';
    
    if (itemCount <= 4) {
      gridCols = 2;
      fontSize = '13px';
      catFontSize = '10px';
      itemPad = '14px 16px';
      imgSize = { w: '85px', h: '68px' };
      gapSize = '12px';
    } else if (itemCount <= 8) {
      gridCols = 2;
      fontSize = '11px';
      catFontSize = '9px';
      itemPad = '10px 12px';
      imgSize = { w: '70px', h: '56px' };
      gapSize = '8px';
    } else if (itemCount <= 12) {
      gridCols = 3;
      fontSize = '10px';
      catFontSize = '8px';
      itemPad = '8px 10px';
      imgSize = { w: '58px', h: '46px' };
      gapSize = '6px';
    } else {
      gridCols = 3;
      fontSize = '9px';
      catFontSize = '7px';
      itemPad = '6px 8px';
      imgSize = { w: '50px', h: '40px' };
      gapSize = '5px';
    }

    // Calculate health percentage
    const healthPercent = totalItems > 0 ? Math.round((passCount / totalItems) * 100) : 100;
    const healthColor = healthPercent >= 80 ? BRAND.success : healthPercent >= 60 ? BRAND.warning : BRAND.danger;

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
        {/* Premium Header with Gold Accent */}
        <div style={{
          background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.secondary} 100%)`,
          padding: '20px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          borderBottom: `4px solid ${BRAND.accent}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              border: `2px solid ${BRAND.accent}`,
            }}>
              <img src={logoPath} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <h1 style={{ color: '#ffffff', fontSize: '22px', fontWeight: 'bold', margin: 0, ...textStyle }}>
                مركز الامان العالي
              </h1>
              <p style={{ color: BRAND.accentLight, fontSize: '12px', margin: '4px 0 0 0', ...englishStyle, fontWeight: '600' }}>
                HIGH SAFETY CENTER
              </p>
            </div>
          </div>
          
          <div style={{ textAlign: 'left' }}>
            <div style={{
              background: `linear-gradient(135deg, ${BRAND.accent} 0%, ${BRAND.accentLight} 100%)`,
              color: BRAND.primary,
              padding: '8px 20px',
              borderRadius: '24px',
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '8px',
              boxShadow: '0 2px 8px rgba(197,133,44,0.4)',
              ...textStyle,
            }}>
              {inspectionTypeLabel.ar}
            </div>
            <p style={{ color: '#94a3b8', fontSize: '10px', margin: 0, ...englishStyle }}>
              {englishDate} | {reportTime}
            </p>
            <p style={{ color: '#cbd5e1', fontSize: '11px', margin: '3px 0 0 0', ...textStyle }}>
              {reportDate}
            </p>
          </div>
        </div>

        {/* Vehicle Info Section */}
        <div style={{
          backgroundColor: BRAND.light,
          padding: '16px 28px',
          display: 'grid',
          gridTemplateColumns: '1.4fr 1.5fr 0.9fr 1.2fr',
          gap: '14px',
          borderBottom: `1px solid ${BRAND.border}`,
          flexShrink: 0,
        }}>
          {/* Vehicle Details */}
          <div style={{ 
            background: '#ffffff', 
            borderRadius: '12px', 
            padding: '14px 16px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            border: `1px solid ${BRAND.border}`,
            borderTop: `3px solid ${BRAND.accent}`,
          }}>
            <p style={{ color: BRAND.muted, fontSize: '9px', margin: '0 0 6px 0', display: 'flex', justifyContent: 'space-between' }}>
              <span style={textStyle}>المركبة</span>
              <span style={englishStyle}>Vehicle</span>
            </p>
            <p style={{ color: BRAND.dark, fontSize: '16px', fontWeight: 'bold', margin: 0, ...englishStyle }}>
              {inspection.make} {inspection.model}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <span style={{ color: BRAND.muted, fontSize: '11px', ...englishStyle }}>
                {inspection.year}
              </span>
              <span style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: BRAND.light,
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '10px',
              }}>
                <span style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: vehicleColor.hex,
                  border: vehicleColor.hex === '#FFFFFF' ? '1px solid #E2E8F0' : 'none',
                  display: 'inline-block',
                }}></span>
                <span style={{ color: BRAND.dark, ...textStyle }}>{vehicleColor.ar}</span>
              </span>
            </div>
          </div>

          {/* VIN */}
          <div style={{ 
            background: '#ffffff', 
            borderRadius: '12px', 
            padding: '14px 16px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            border: `1px solid ${BRAND.border}`,
            borderTop: `3px solid ${BRAND.secondary}`,
          }}>
            <p style={{ color: BRAND.muted, fontSize: '9px', margin: '0 0 6px 0', display: 'flex', justifyContent: 'space-between' }}>
              <span style={textStyle}>رقم الشاصي</span>
              <span style={englishStyle}>VIN</span>
            </p>
            <p style={{ 
              color: BRAND.dark, 
              fontSize: '11px', 
              fontWeight: 'bold', 
              margin: 0,
              fontFamily: "'Courier New', monospace",
              letterSpacing: '0.5px',
              backgroundColor: BRAND.light,
              padding: '6px 10px',
              borderRadius: '6px',
            }}>
              {inspection.vin}
            </p>
            <p style={{ color: BRAND.accent, fontSize: '10px', margin: '6px 0 0 0', fontWeight: 'bold', ...englishStyle }}>
              Report: HS-{inspection.id}
            </p>
          </div>

          {/* Odometer */}
          <div style={{
            background: `linear-gradient(180deg, ${BRAND.primary} 0%, #0a1420 100%)`,
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}>
            <p style={{ color: BRAND.accentLight, fontSize: '8px', margin: '0 0 4px 0', ...englishStyle, textTransform: 'uppercase', letterSpacing: '2px' }}>
              ODOMETER
            </p>
            <div style={{
              background: 'linear-gradient(180deg, #0a0a14 0%, #1a1a2e 100%)',
              borderRadius: '6px',
              padding: '6px 12px',
              border: `2px solid ${BRAND.accent}`,
            }}>
              <span style={{
                color: '#00ff88',
                fontSize: '18px',
                fontFamily: "'Courier New', monospace",
                fontWeight: 'bold',
                textShadow: '0 0 10px rgba(0,255,136,0.5)',
              }}>
                {(inspection.odometer || inspection.mileage || 0).toLocaleString('en-US')}
              </span>
            </div>
            <p style={{ color: '#4ade80', fontSize: '10px', margin: '5px 0 0 0', ...englishStyle, fontWeight: 'bold' }}>
              KM
            </p>
          </div>

          {/* Health Score */}
          <div style={{ 
            background: '#ffffff', 
            borderRadius: '12px', 
            padding: '12px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            border: `1px solid ${BRAND.border}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <p style={{ color: BRAND.muted, fontSize: '8px', margin: '0 0 6px 0', ...englishStyle, textTransform: 'uppercase' }}>
              Health Score
            </p>
            <div style={{
              width: '55px',
              height: '55px',
              borderRadius: '50%',
              border: `4px solid ${healthColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${healthColor}15`,
            }}>
              <span style={{ color: healthColor, fontSize: '18px', fontWeight: 'bold', ...englishStyle }}>
                {healthPercent}%
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <span style={{ fontSize: '9px', color: BRAND.success, fontWeight: 'bold', ...englishStyle }}>
                {passCount} Pass
              </span>
              <span style={{ fontSize: '9px', color: BRAND.danger, fontWeight: 'bold', ...englishStyle }}>
                {failItems.length} Fail
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, padding: '16px 28px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {issueItems.length === 0 ? (
            <div style={{
              backgroundColor: '#dcfce7',
              borderRadius: '20px',
              padding: '50px',
              textAlign: 'center',
              marginTop: '50px',
              border: `3px solid ${BRAND.success}`,
            }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                backgroundColor: BRAND.success, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 4px 16px rgba(5,150,105,0.3)',
              }}>
                <span style={{ color: '#fff', fontSize: '40px' }}>&#10003;</span>
              </div>
              <h2 style={{ color: '#166534', fontSize: '26px', fontWeight: 'bold', margin: '0 0 10px 0', ...textStyle }}>
                المركبة بحالة ممتازة
              </h2>
              <p style={{ color: '#15803d', fontSize: '16px', margin: 0, ...englishStyle }}>
                Vehicle in Excellent Condition
              </p>
            </div>
          ) : (
            <>
              {/* Section Title */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '14px',
                paddingBottom: '10px',
                borderBottom: `3px solid ${BRAND.primary}`,
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '6px',
                    height: '36px',
                    backgroundColor: BRAND.accent,
                    borderRadius: '3px',
                  }}></div>
                  <div>
                    <h2 style={{ color: BRAND.dark, fontSize: '16px', fontWeight: 'bold', margin: 0, ...textStyle }}>
                      البنود التي تحتاج متابعة
                    </h2>
                    <p style={{ color: BRAND.muted, fontSize: '10px', margin: '2px 0 0 0', ...englishStyle }}>
                      Items Requiring Attention
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ 
                    backgroundColor: BRAND.danger,
                    color: '#ffffff',
                    padding: '6px 14px',
                    borderRadius: '16px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    ...englishStyle,
                  }}>
                    {failItems.length} Fail
                  </span>
                  <span style={{ 
                    backgroundColor: BRAND.warning,
                    color: '#ffffff',
                    padding: '6px 14px',
                    borderRadius: '16px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    ...englishStyle,
                  }}>
                    {warningItems.length} Warning
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
                  
                  return (
                    <div 
                      key={item.id || idx} 
                      style={{
                        backgroundColor: isFail ? '#fef2f2' : '#fffbeb',
                        border: `1px solid ${isFail ? '#fecaca' : '#fde68a'}`,
                        borderRight: `5px solid ${itemColor}`,
                        borderRadius: '10px',
                        padding: itemPad,
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start',
                      }}
                    >
                      {item.imageUrl && (
                        <img 
                          src={item.imageUrl} 
                          alt="" 
                          style={{ 
                            width: imgSize.w, 
                            height: imgSize.h, 
                            objectFit: 'cover', 
                            borderRadius: '8px',
                            flexShrink: 0,
                            border: '2px solid #e5e7eb',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                          }} 
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                          <span style={{ 
                            color: itemColor, 
                            fontSize: '16px',
                            fontWeight: 'bold',
                          }}>
                            {isFail ? '\u25CF' : '\u25D0'}
                          </span>
                          <span style={{ 
                            color: BRAND.dark, 
                            fontSize: catFontSize,
                            backgroundColor: '#e5e7eb',
                            padding: '3px 10px',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            ...textStyle,
                          }}>
                            {catLabel.ar}
                          </span>
                        </div>
                        <p style={{ 
                          color: BRAND.dark, 
                          fontSize: fontSize, 
                          fontWeight: 'bold', 
                          margin: '0 0 5px 0',
                          lineHeight: '1.4',
                          ...textStyle,
                        }}>
                          {item.faultName.split(' - ')[0]}
                        </p>
                        <p style={{ 
                          color: itemColor, 
                          fontSize: catFontSize, 
                          margin: 0,
                          fontWeight: 'bold',
                          ...englishStyle,
                        }}>
                          {isFail ? '\u25CF Needs Repair' : '\u25D0 Needs Attention'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Signature Section */}
        {(inspection.signature || inspection.customerSignature) && (
          <div style={{ 
            padding: '12px 28px', 
            borderTop: `1px solid ${BRAND.border}`,
            flexShrink: 0,
          }}>
            <div style={{
              backgroundColor: BRAND.light,
              borderRadius: '12px',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: `1px solid ${BRAND.border}`,
            }}>
              <div>
                <p style={{ color: BRAND.muted, fontSize: '9px', margin: '0 0 4px 0', display: 'flex', gap: '10px' }}>
                  <span style={textStyle}>توقيع العميل</span>
                  <span style={englishStyle}>Customer Signature</span>
                </p>
                <p style={{ color: BRAND.dark, fontSize: '14px', fontWeight: 'bold', margin: 0, ...textStyle }}>
                  {inspection.customerName || 'العميل'}
                </p>
              </div>
              <img 
                src={inspection.signature || inspection.customerSignature || ''} 
                alt="Signature" 
                style={{ 
                  height: '50px', 
                  maxWidth: '150px',
                  objectFit: 'contain',
                }} 
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.secondary} 100%)`,
          padding: '16px 28px',
          flexShrink: 0,
          borderTop: `3px solid ${BRAND.accent}`,
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={logoPath} alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${BRAND.accent}` }} />
              <div>
                <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: 'bold', ...textStyle }}>
                  مركز الامان العالي
                </span>
                <span style={{ color: BRAND.accentLight, fontSize: '10px', marginRight: '10px', ...englishStyle }}>
                  High Safety Center
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: '10px', ...englishStyle }}>Tel: 0542206000</span>
              <span style={{ color: '#94a3b8', fontSize: '10px', ...englishStyle }}>highsafety2021@gmail.com</span>
            </div>
          </div>
          <p style={{ 
            color: BRAND.muted, 
            fontSize: '8px', 
            textAlign: 'center', 
            margin: '12px 0 0 0',
            borderTop: `1px solid ${BRAND.secondary}`,
            paddingTop: '12px',
            ...englishStyle,
          }}>
            This report reflects the vehicle condition at the time of inspection only | Report ID: HS-{inspection.id}
          </p>
        </div>
      </div>
    );
  }
);

PdfReportTemplate.displayName = 'PdfReportTemplate';
