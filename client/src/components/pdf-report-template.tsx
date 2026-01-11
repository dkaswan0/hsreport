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

const CATEGORIES: Record<string, string> = {
  engine: 'المحرك',
  transmission: 'ناقل الحركة',
  chassis: 'الشاسيه',
  body: 'الهيكل',
  tires: 'الإطارات',
  brakes: 'الفرامل',
  electrical: 'الكهرباء',
  wheels: 'الجنوط',
  suspension: 'التعليق',
  ac: 'التكييف',
  exhaust: 'العادم',
  safety: 'السلامة',
  front_bumper: 'الصدام الأمامي',
  rear_bumper: 'الصدام الخلفي',
  hood: 'الكبوت',
  trunk: 'الشنطة',
  doors: 'الأبواب',
  fenders: 'الرفارف',
  roof: 'السقف',
  lights: 'الإضاءة',
  interior: 'الداخلية',
  glass: 'الزجاج',
};

const getInspectionTypeLabel = (type?: string | null) => {
  switch (type) {
    case 'comprehensive': return 'فحص شامل';
    case 'mechanical_computer': return 'فحص ميكانيكي + كمبيوتر';
    case 'basic_parts': return 'فحص قطع أساسية';
    case 'custom': return 'فحص مخصص';
    default: return 'فحص شامل';
  }
};

const OdometerWidget = ({ value }: { value: number }) => {
  const formattedValue = value.toLocaleString('en-US');
  
  return (
    <div style={{
      background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
      borderRadius: '8px',
      padding: '10px 14px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 2px 4px rgba(0,0,0,0.5)',
      border: '1px solid #2d2d44',
    }}>
      <p style={{ 
        color: '#9ca3af', 
        fontSize: '9px', 
        margin: '0 0 6px 0',
        fontFamily: 'Arial, sans-serif',
        textTransform: 'uppercase',
        letterSpacing: '2px',
        fontWeight: 'bold',
      }}>
        ODOMETER
      </p>
      <div style={{
        background: 'linear-gradient(180deg, #0a0a14 0%, #1a1a2e 100%)',
        borderRadius: '6px',
        padding: '6px 12px',
        border: '2px solid #3d3d54',
        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)',
      }}>
        <span style={{
          color: '#00ff88',
          fontSize: '18px',
          fontFamily: "'Courier New', 'Lucida Console', monospace",
          fontWeight: 'bold',
          textShadow: '0 0 10px rgba(0,255,136,0.6), 0 0 20px rgba(0,255,136,0.3)',
          letterSpacing: '1px',
        }}>
          {formattedValue}
        </span>
      </div>
      <p style={{ 
        color: '#4ade80', 
        fontSize: '10px', 
        margin: '6px 0 0 0',
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        letterSpacing: '1px',
      }}>
        KM
      </p>
    </div>
  );
};

// Arabic text style to prevent letter separation in html2canvas
const arabicTextStyle: React.CSSProperties = {
  fontFamily: 'Tahoma, "Segoe UI", Arial, sans-serif',
  letterSpacing: 'normal',
  wordSpacing: 'normal',
  textRendering: 'optimizeLegibility',
  fontFeatureSettings: '"liga" 1, "calt" 1',
  WebkitFontSmoothing: 'antialiased',
  whiteSpace: 'pre-wrap',
};

export const PdfReportTemplate = forwardRef<HTMLDivElement, PdfReportTemplateProps>(
  ({ inspection }, ref) => {
    const items = inspection.items || [];
    const failItems = items.filter(i => i.status === 'fail');
    const warningItems = items.filter(i => i.status === 'warning');
    const issueItems = [...failItems, ...warningItems];
    const passCount = items.filter(i => i.status === 'pass').length;
    
    const inspectionDate = inspection.createdAt ? new Date(inspection.createdAt) : new Date();
    const reportDate = inspectionDate.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
    const reportTime = inspectionDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: false });
    const fullDateTime = `${reportDate} - الساعة ${reportTime}`;

    const getCategoryName = (catId: string) => CATEGORIES[catId] || catId;

    const itemCount = issueItems.length;
    const gridCols = itemCount > 10 ? 3 : 2;
    const isCompact = itemCount > 8;
    const fontSize = isCompact ? '10px' : '12px';
    const categoryFontSize = isCompact ? '9px' : '10px';
    const itemPadding = isCompact ? '8px 10px' : '10px 12px';
    const imgSize = isCompact ? { w: '55px', h: '45px' } : { w: '70px', h: '55px' };
    const gapSize = isCompact ? '8px' : '10px';

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
          ...arabicTextStyle,
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={logoPath} alt="Logo" style={{ width: '44px', height: '44px', borderRadius: '10px' }} />
            <div>
              <h1 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 'bold', margin: 0, ...arabicTextStyle }}>
                مركز الأمان العالي الدولي
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '10px', margin: '2px 0 0 0', fontFamily: 'Arial, sans-serif' }}>
                HIGH SAFETY INTERNATIONAL
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              padding: '5px 14px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 'bold',
              marginBottom: '4px',
              ...arabicTextStyle,
            }}>
              {getInspectionTypeLabel(inspection.inspectionType)}
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '10px', margin: 0, ...arabicTextStyle }}>{fullDateTime}</p>
          </div>
        </div>

        {/* Vehicle Info */}
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '12px 24px',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1.5fr 0.8fr 1fr',
          gap: '12px',
          borderBottom: '2px solid #e2e8f0',
          flexShrink: 0,
        }}>
          {/* Vehicle */}
          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '10px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <p style={{ color: '#64748b', fontSize: '9px', margin: '0 0 4px 0' }}>
              <span style={arabicTextStyle}>المركبة</span> / <span style={{ fontFamily: 'Arial, sans-serif' }}>Vehicle</span>
            </p>
            <p style={{ color: '#0f172a', fontSize: '13px', fontWeight: 'bold', margin: 0, fontFamily: 'Arial, sans-serif' }}>
              {inspection.make} {inspection.model}
            </p>
            <p style={{ color: '#475569', fontSize: '11px', margin: '2px 0 0 0', fontFamily: 'Arial, sans-serif' }}>
              {inspection.year} | {inspection.color?.split(',')[0]?.trim() || '-'}
            </p>
          </div>

          {/* VIN */}
          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '10px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <p style={{ color: '#64748b', fontSize: '9px', margin: '0 0 4px 0' }}>
              <span style={arabicTextStyle}>رقم الشاصي</span> / <span style={{ fontFamily: 'Arial, sans-serif' }}>VIN</span>
            </p>
            <p style={{ 
              color: '#0f172a', 
              fontSize: '11px', 
              fontWeight: 'bold', 
              margin: 0,
              fontFamily: "'Courier New', monospace",
              letterSpacing: '0.5px',
            }}>
              {inspection.vin}
            </p>
            <p style={{ color: '#64748b', fontSize: '9px', margin: '4px 0 0 0', fontFamily: 'Arial, sans-serif' }}>
              Report: HS-{inspection.id}
            </p>
          </div>

          {/* Odometer Widget */}
          <OdometerWidget value={inspection.odometer || inspection.mileage || 0} />

          {/* Stats */}
          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '10px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#16a34a', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{passCount}</p>
              <p style={{ color: '#16a34a', fontSize: '8px', margin: 0, fontWeight: 'bold' }}>PASS</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#dc2626', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{failItems.length}</p>
              <p style={{ color: '#dc2626', fontSize: '8px', margin: 0, fontWeight: 'bold' }}>FAIL</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#f97316', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{warningItems.length}</p>
              <p style={{ color: '#f97316', fontSize: '8px', margin: 0, fontWeight: 'bold' }}>WARN</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '14px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {issueItems.length === 0 ? (
            <div style={{
              backgroundColor: '#dcfce7',
              borderRadius: '16px',
              padding: '40px',
              textAlign: 'center',
              marginTop: '30px',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>✓</div>
              <h2 style={{ color: '#166534', fontSize: '22px', fontWeight: 'bold', margin: '0 0 8px 0', ...arabicTextStyle }}>
                المركبة بحالة ممتازة
              </h2>
              <p style={{ color: '#15803d', fontSize: '12px', margin: 0, fontFamily: 'Arial, sans-serif' }}>
                Vehicle in Excellent Condition
              </p>
              <p style={{ color: '#15803d', fontSize: '12px', margin: '8px 0 0 0', ...arabicTextStyle }}>
                لا توجد أعطال أو ملاحظات تستدعي المتابعة
              </p>
            </div>
          ) : (
            <>
              {/* Section Title */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                marginBottom: '10px',
                paddingBottom: '6px',
                borderBottom: '3px solid #0f172a',
                flexShrink: 0,
              }}>
                <div>
                  <h2 style={{ color: '#0f172a', fontSize: '14px', fontWeight: 'bold', margin: 0, ...arabicTextStyle }}>
                    البنود التي تحتاج متابعة
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '10px', margin: '2px 0 0 0', fontFamily: 'Arial, sans-serif' }}>
                    Items Requiring Attention
                  </p>
                </div>
                <span style={{ 
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  padding: '2px 10px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                }}>
                  {issueItems.length}
                </span>
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
                  return (
                    <div 
                      key={item.id || idx} 
                      style={{
                        backgroundColor: isFail ? '#fef2f2' : '#fffbeb',
                        border: `2px solid ${isFail ? '#fca5a5' : '#fcd34d'}`,
                        borderRight: `5px solid ${isFail ? '#dc2626' : '#f97316'}`,
                        borderRadius: '6px',
                        padding: itemPadding,
                        display: 'flex',
                        gap: '8px',
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
                            borderRadius: '4px',
                            flexShrink: 0,
                            border: '1px solid #e5e7eb',
                          }} 
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                          <span style={{ 
                            color: isFail ? '#dc2626' : '#f97316', 
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}>
                            {isFail ? '●' : '◐'}
                          </span>
                          <span style={{ 
                            color: '#374151', 
                            fontSize: categoryFontSize,
                            backgroundColor: '#e5e7eb',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            ...arabicTextStyle,
                          }}>
                            {getCategoryName(item.category)}
                          </span>
                        </div>
                        <p style={{ 
                          color: '#1f2937', 
                          fontSize: fontSize, 
                          fontWeight: 'bold', 
                          margin: '0 0 2px 0',
                          lineHeight: '1.3',
                          ...arabicTextStyle,
                        }}>
                          {item.faultName.split(' - ')[0]}
                        </p>
                        <p style={{ 
                          color: isFail ? '#b91c1c' : '#c2410c', 
                          fontSize: '9px', 
                          margin: 0,
                          fontWeight: 'bold',
                        }}>
                          <span style={arabicTextStyle}>{isFail ? '● يحتاج إصلاح' : '◐ يحتاج متابعة'}</span>
                          <span style={{ fontFamily: 'Arial, sans-serif', marginRight: '4px' }}> / {isFail ? 'Needs Repair' : 'Needs Attention'}</span>
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
            padding: '8px 24px', 
            borderTop: '1px solid #e2e8f0',
            flexShrink: 0,
          }}>
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '9px', margin: '0 0 2px 0' }}>
                  <span style={arabicTextStyle}>توقيع العميل</span> / <span style={{ fontFamily: 'Arial, sans-serif' }}>Customer Signature</span>
                </p>
                <p style={{ color: '#0f172a', fontSize: '12px', fontWeight: 'bold', margin: 0, ...arabicTextStyle }}>
                  {inspection.customerName || 'العميل'}
                </p>
              </div>
              <img 
                src={inspection.signature || inspection.customerSignature || ''} 
                alt="Signature" 
                style={{ 
                  height: '40px', 
                  maxWidth: '120px',
                  objectFit: 'contain',
                }} 
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          backgroundColor: '#0f172a',
          padding: '12px 24px',
          flexShrink: 0,
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src={logoPath} alt="Logo" style={{ width: '24px', height: '24px', borderRadius: '6px' }} />
              <span style={{ color: '#ffffff', fontSize: '11px', fontWeight: 'bold', ...arabicTextStyle }}>
                مركز الأمان العالي الدولي
              </span>
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: '9px' }}>Tel: 0542206000</span>
              <span style={{ color: '#94a3b8', fontSize: '9px' }}>highsafety2021@gmail.com</span>
              <span style={{ color: '#94a3b8', fontSize: '9px' }}>City Plaza - Sharjah</span>
            </div>
          </div>
          <p style={{ 
            color: '#64748b', 
            fontSize: '8px', 
            textAlign: 'center', 
            margin: '8px 0 0 0',
            borderTop: '1px solid #334155',
            paddingTop: '8px',
          }}>
            Report: HS-{inspection.id} | This report reflects the vehicle condition at the time of inspection only
          </p>
        </div>
      </div>
    );
  }
);

PdfReportTemplate.displayName = 'PdfReportTemplate';
