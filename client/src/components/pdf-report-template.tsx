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

const CATEGORIES: Record<string, { ar: string; en: string }> = {
  engine: { ar: 'المحرك', en: 'Engine' },
  transmission: { ar: 'ناقل الحركة', en: 'Transmission' },
  chassis: { ar: 'الشاسيه', en: 'Chassis' },
  body: { ar: 'الهيكل', en: 'Body' },
  tires: { ar: 'الإطارات', en: 'Tires' },
  brakes: { ar: 'الفرامل', en: 'Brakes' },
  electrical: { ar: 'الكهرباء', en: 'Electrical' },
  wheels: { ar: 'الجنوط', en: 'Wheels' },
  suspension: { ar: 'التعليق', en: 'Suspension' },
  ac: { ar: 'التكييف', en: 'A/C' },
  exhaust: { ar: 'العادم', en: 'Exhaust' },
  safety: { ar: 'السلامة', en: 'Safety' },
  front_bumper: { ar: 'الصدام الأمامي', en: 'Front Bumper' },
  rear_bumper: { ar: 'الصدام الخلفي', en: 'Rear Bumper' },
  hood: { ar: 'الكبوت', en: 'Hood' },
  trunk: { ar: 'الشنطة', en: 'Trunk' },
  doors: { ar: 'الأبواب', en: 'Doors' },
  fenders: { ar: 'الرفارف', en: 'Fenders' },
  roof: { ar: 'السقف', en: 'Roof' },
  lights: { ar: 'الإضاءة', en: 'Lights' },
  interior: { ar: 'الداخلية', en: 'Interior' },
  glass: { ar: 'الزجاج', en: 'Glass' },
};

const getInspectionTypeLabel = (type?: string | null) => {
  switch (type) {
    case 'comprehensive': return { ar: 'فحص شامل', en: 'Comprehensive' };
    case 'mechanical_computer': return { ar: 'فحص ميكانيكي + كمبيوتر', en: 'Mechanical + Computer' };
    case 'basic_parts': return { ar: 'فحص قطع أساسية', en: 'Basic Parts' };
    case 'custom': return { ar: 'فحص مخصص', en: 'Custom' };
    default: return { ar: 'فحص شامل', en: 'Comprehensive' };
  }
};

const arabicFont: React.CSSProperties = {
  fontFamily: 'Tahoma, "Segoe UI", Arial, sans-serif',
  letterSpacing: 'normal',
  textRendering: 'optimizeLegibility',
};

const englishFont: React.CSSProperties = {
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

    const itemCount = issueItems.length;
    
    // Adaptive sizing
    let gridCols = 2;
    let fontSize = '13px';
    let catFontSize = '10px';
    let itemPad = '14px 16px';
    let imgSize = { w: '85px', h: '68px' };
    let gapSize = '12px';
    let statusSize = '10px';
    
    if (itemCount <= 4) {
      gridCols = 2;
      fontSize = '14px';
      catFontSize = '11px';
      itemPad = '16px 18px';
      imgSize = { w: '95px', h: '75px' };
      gapSize = '14px';
      statusSize = '11px';
    } else if (itemCount <= 8) {
      gridCols = 2;
      fontSize = '12px';
      catFontSize = '10px';
      itemPad = '12px 14px';
      imgSize = { w: '80px', h: '64px' };
      gapSize = '10px';
      statusSize = '10px';
    } else if (itemCount <= 12) {
      gridCols = 3;
      fontSize = '11px';
      catFontSize = '9px';
      itemPad = '10px 12px';
      imgSize = { w: '65px', h: '52px' };
      gapSize = '8px';
      statusSize = '9px';
    } else {
      gridCols = 3;
      fontSize = '10px';
      catFontSize = '8px';
      itemPad = '8px 10px';
      imgSize = { w: '55px', h: '44px' };
      gapSize = '6px';
      statusSize = '8px';
    }

    // Calculate health percentage
    const healthPercent = totalItems > 0 ? Math.round((passCount / totalItems) * 100) : 100;
    const healthColor = healthPercent >= 80 ? '#16a34a' : healthPercent >= 60 ? '#f97316' : '#dc2626';

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
          ...arabicFont,
        }}
      >
        {/* Header - Premium Design */}
        <div style={{
          background: 'linear-gradient(135deg, #0c1929 0%, #1e3a5f 50%, #0c1929 100%)',
          padding: '16px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          borderBottom: '3px solid #3b82f6',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              border: '2px solid rgba(255,255,255,0.2)',
            }}>
              <img src={logoPath} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <h1 style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold', margin: 0, ...arabicFont }}>
                مركز الأمان العالي الدولي
              </h1>
              <p style={{ color: '#60a5fa', fontSize: '11px', margin: '3px 0 0 0', ...englishFont, fontWeight: '600' }}>
                HIGH SAFETY INTERNATIONAL CENTER
              </p>
            </div>
          </div>
          
          <div style={{ textAlign: 'left' }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#ffffff',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 'bold',
              marginBottom: '6px',
              boxShadow: '0 2px 8px rgba(59,130,246,0.4)',
              ...arabicFont,
            }}>
              {inspectionTypeLabel.ar}
            </div>
            <p style={{ color: '#94a3b8', fontSize: '9px', margin: 0, ...englishFont }}>
              {englishDate} | {reportTime}
            </p>
            <p style={{ color: '#cbd5e1', fontSize: '10px', margin: '2px 0 0 0', ...arabicFont }}>
              {reportDate}
            </p>
          </div>
        </div>

        {/* Vehicle Info Bar */}
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '14px 28px',
          display: 'grid',
          gridTemplateColumns: '1.3fr 1.6fr 1fr 1.1fr',
          gap: '14px',
          borderBottom: '1px solid #e2e8f0',
          flexShrink: 0,
        }}>
          {/* Vehicle */}
          <div style={{ 
            background: '#ffffff', 
            borderRadius: '10px', 
            padding: '12px 14px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0',
          }}>
            <p style={{ color: '#64748b', fontSize: '9px', margin: '0 0 5px 0', display: 'flex', justifyContent: 'space-between' }}>
              <span style={arabicFont}>المركبة</span>
              <span style={englishFont}>Vehicle</span>
            </p>
            <p style={{ color: '#0f172a', fontSize: '15px', fontWeight: 'bold', margin: 0, ...englishFont }}>
              {inspection.make} {inspection.model}
            </p>
            <p style={{ color: '#475569', fontSize: '11px', margin: '3px 0 0 0', ...englishFont }}>
              {inspection.year} | {inspection.color?.split(',')[0]?.trim() || '-'}
            </p>
          </div>

          {/* VIN */}
          <div style={{ 
            background: '#ffffff', 
            borderRadius: '10px', 
            padding: '12px 14px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0',
          }}>
            <p style={{ color: '#64748b', fontSize: '9px', margin: '0 0 5px 0', display: 'flex', justifyContent: 'space-between' }}>
              <span style={arabicFont}>رقم الشاصي</span>
              <span style={englishFont}>VIN</span>
            </p>
            <p style={{ 
              color: '#0f172a', 
              fontSize: '12px', 
              fontWeight: 'bold', 
              margin: 0,
              fontFamily: "'Courier New', monospace",
              letterSpacing: '0.8px',
              backgroundColor: '#f1f5f9',
              padding: '4px 8px',
              borderRadius: '4px',
            }}>
              {inspection.vin}
            </p>
            <p style={{ color: '#3b82f6', fontSize: '9px', margin: '4px 0 0 0', fontWeight: 'bold', ...englishFont }}>
              Report: HS-{inspection.id}
            </p>
          </div>

          {/* Odometer */}
          <div style={{
            background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
            borderRadius: '10px',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          }}>
            <p style={{ color: '#9ca3af', fontSize: '8px', margin: '0 0 4px 0', ...englishFont, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              ODOMETER
            </p>
            <div style={{
              background: 'linear-gradient(180deg, #0a0a14 0%, #1a1a2e 100%)',
              borderRadius: '6px',
              padding: '5px 10px',
              border: '2px solid #3d3d54',
            }}>
              <span style={{
                color: '#00ff88',
                fontSize: '16px',
                fontFamily: "'Courier New', monospace",
                fontWeight: 'bold',
                textShadow: '0 0 8px rgba(0,255,136,0.5)',
              }}>
                {(inspection.odometer || inspection.mileage || 0).toLocaleString('en-US')}
              </span>
            </div>
            <p style={{ color: '#4ade80', fontSize: '9px', margin: '4px 0 0 0', ...englishFont, fontWeight: 'bold' }}>
              KM
            </p>
          </div>

          {/* Health Score */}
          <div style={{ 
            background: '#ffffff', 
            borderRadius: '10px', 
            padding: '10px 12px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <p style={{ color: '#64748b', fontSize: '8px', margin: '0 0 4px 0', ...englishFont, textTransform: 'uppercase' }}>
              Health Score
            </p>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              border: `4px solid ${healthColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${healthColor}15`,
            }}>
              <span style={{ color: healthColor, fontSize: '16px', fontWeight: 'bold', ...englishFont }}>
                {healthPercent}%
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '8px', color: '#16a34a', ...englishFont }}>{passCount} Pass</span>
              <span style={{ fontSize: '8px', color: '#dc2626', ...englishFont }}>{failItems.length} Fail</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '16px 28px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {issueItems.length === 0 ? (
            <div style={{
              backgroundColor: '#dcfce7',
              borderRadius: '16px',
              padding: '50px',
              textAlign: 'center',
              marginTop: '40px',
              border: '2px solid #86efac',
            }}>
              <div style={{ 
                width: '70px', 
                height: '70px', 
                borderRadius: '50%', 
                backgroundColor: '#16a34a', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
              }}>
                <span style={{ color: '#fff', fontSize: '36px' }}>✓</span>
              </div>
              <h2 style={{ color: '#166534', fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', ...arabicFont }}>
                المركبة بحالة ممتازة
              </h2>
              <p style={{ color: '#15803d', fontSize: '14px', margin: 0, ...englishFont }}>
                Vehicle in Excellent Condition
              </p>
            </div>
          ) : (
            <>
              {/* Section Header */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '2px solid #0f172a',
                flexShrink: 0,
              }}>
                <div>
                  <h2 style={{ color: '#0f172a', fontSize: '15px', fontWeight: 'bold', margin: 0, ...arabicFont }}>
                    البنود التي تحتاج متابعة
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '10px', margin: '2px 0 0 0', ...englishFont }}>
                    Items Requiring Attention
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ 
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    ...englishFont,
                  }}>
                    {failItems.length} Fail
                  </span>
                  <span style={{ 
                    backgroundColor: '#f97316',
                    color: '#ffffff',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    ...englishFont,
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
                  return (
                    <div 
                      key={item.id || idx} 
                      style={{
                        backgroundColor: isFail ? '#fef2f2' : '#fffbeb',
                        border: `2px solid ${isFail ? '#fca5a5' : '#fcd34d'}`,
                        borderRight: `5px solid ${isFail ? '#dc2626' : '#f97316'}`,
                        borderRadius: '8px',
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
                            borderRadius: '6px',
                            flexShrink: 0,
                            border: '2px solid #e5e7eb',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                          }} 
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span style={{ 
                            color: isFail ? '#dc2626' : '#f97316', 
                            fontSize: '14px',
                            fontWeight: 'bold',
                          }}>
                            {isFail ? '●' : '◐'}
                          </span>
                          <span style={{ 
                            color: '#374151', 
                            fontSize: catFontSize,
                            backgroundColor: '#e5e7eb',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            ...arabicFont,
                          }}>
                            {catLabel.ar}
                          </span>
                        </div>
                        <p style={{ 
                          color: '#1f2937', 
                          fontSize: fontSize, 
                          fontWeight: 'bold', 
                          margin: '0 0 4px 0',
                          lineHeight: '1.4',
                          ...arabicFont,
                        }}>
                          {item.faultName.split(' - ')[0]}
                        </p>
                        <p style={{ 
                          color: isFail ? '#b91c1c' : '#c2410c', 
                          fontSize: statusSize, 
                          margin: 0,
                          fontWeight: 'bold',
                          ...englishFont,
                        }}>
                          {isFail ? '● Needs Repair' : '◐ Needs Attention'}
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
            padding: '10px 28px', 
            borderTop: '1px solid #e2e8f0',
            flexShrink: 0,
          }}>
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '10px',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid #e2e8f0',
            }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '9px', margin: '0 0 3px 0', display: 'flex', gap: '8px' }}>
                  <span style={arabicFont}>توقيع العميل</span>
                  <span style={englishFont}>Customer Signature</span>
                </p>
                <p style={{ color: '#0f172a', fontSize: '13px', fontWeight: 'bold', margin: 0, ...arabicFont }}>
                  {inspection.customerName || 'العميل'}
                </p>
              </div>
              <img 
                src={inspection.signature || inspection.customerSignature || ''} 
                alt="Signature" 
                style={{ 
                  height: '45px', 
                  maxWidth: '140px',
                  objectFit: 'contain',
                }} 
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          background: 'linear-gradient(135deg, #0c1929 0%, #1e3a5f 100%)',
          padding: '14px 28px',
          flexShrink: 0,
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={logoPath} alt="Logo" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
              <div>
                <span style={{ color: '#ffffff', fontSize: '11px', fontWeight: 'bold', ...arabicFont }}>
                  مركز الأمان العالي
                </span>
                <span style={{ color: '#60a5fa', fontSize: '9px', marginRight: '8px', ...englishFont }}>
                  High Safety Center
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: '9px', ...englishFont }}>Tel: 0542206000</span>
              <span style={{ color: '#94a3b8', fontSize: '9px', ...englishFont }}>highsafety2021@gmail.com</span>
            </div>
          </div>
          <p style={{ 
            color: '#64748b', 
            fontSize: '8px', 
            textAlign: 'center', 
            margin: '10px 0 0 0',
            borderTop: '1px solid #334155',
            paddingTop: '10px',
            ...englishFont,
          }}>
            This report reflects the vehicle condition at the time of inspection only | Report ID: HS-{inspection.id}
          </p>
        </div>
      </div>
    );
  }
);

PdfReportTemplate.displayName = 'PdfReportTemplate';
