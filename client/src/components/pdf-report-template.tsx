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
    const isCompact = itemCount > 10;
    const isVeryCompact = itemCount > 20;
    const gridCols = itemCount > 12 ? 3 : 2;
    
    const itemFontSize = isVeryCompact ? '7px' : isCompact ? '8px' : '9px';
    const itemPadding = isVeryCompact ? '4px 6px' : isCompact ? '5px 7px' : '6px 8px';
    const imgSize = isVeryCompact ? { w: '30px', h: '24px' } : isCompact ? { w: '38px', h: '30px' } : { w: '45px', h: '35px' };
    const gapSize = isVeryCompact ? '4px' : isCompact ? '6px' : '8px';

    return (
      <div 
        ref={ref}
        dir="rtl"
        style={{
          width: '794px',
          height: '1123px',
          backgroundColor: '#ffffff',
          fontFamily: 'Arial, Tahoma, sans-serif',
          padding: '0',
          margin: '0',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header - Compact */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
          padding: '10px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={logoPath} alt="Logo" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
            <div>
              <h1 style={{ color: '#ffffff', fontSize: '14px', fontWeight: 'bold', margin: 0 }}>
                مركز الأمان العالي الدولي
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '8px', margin: '2px 0 0 0' }}>
                HIGH SAFETY INTERNATIONAL
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              padding: '3px 10px',
              borderRadius: '10px',
              fontSize: '9px',
              fontWeight: 'bold',
              marginBottom: '3px',
            }}>
              {getInspectionTypeLabel(inspection.inspectionType)}
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '8px', margin: 0 }}>{fullDateTime}</p>
          </div>
        </div>

        {/* Vehicle Info - Compact Grid */}
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '8px 20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: '10px',
          borderBottom: '1px solid #e2e8f0',
          flexShrink: 0,
        }}>
          <div style={{ background: '#ffffff', borderRadius: '6px', padding: '6px 8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#64748b', fontSize: '7px', margin: '0 0 2px 0' }}>المركبة</p>
            <p style={{ color: '#0f172a', fontSize: '10px', fontWeight: 'bold', margin: 0 }}>
              {inspection.make} {inspection.model} {inspection.year}
            </p>
          </div>
          <div style={{ background: '#ffffff', borderRadius: '6px', padding: '6px 8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#64748b', fontSize: '7px', margin: '0 0 2px 0' }}>رقم الشاصي</p>
            <p style={{ color: '#0f172a', fontSize: '8px', fontWeight: 'bold', margin: 0, fontFamily: 'monospace' }}>
              {inspection.vin}
            </p>
          </div>
          <div style={{ background: '#ffffff', borderRadius: '6px', padding: '6px 8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#64748b', fontSize: '7px', margin: '0 0 2px 0' }}>اللون / الممشى</p>
            <p style={{ color: '#0f172a', fontSize: '9px', fontWeight: 'bold', margin: 0 }}>
              {inspection.color?.split(',')[0]?.trim() || '-'} / {(inspection.odometer || inspection.mileage)?.toLocaleString() || '-'} كم
            </p>
          </div>
          <div style={{ background: '#ffffff', borderRadius: '6px', padding: '6px 8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#16a34a', fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{passCount}</p>
              <p style={{ color: '#64748b', fontSize: '6px', margin: 0 }}>سليم</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#dc2626', fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{failItems.length}</p>
              <p style={{ color: '#64748b', fontSize: '6px', margin: 0 }}>عطل</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#f97316', fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{warningItems.length}</p>
              <p style={{ color: '#64748b', fontSize: '6px', margin: 0 }}>ملاحظة</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '10px 20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {issueItems.length === 0 ? (
            <div style={{
              backgroundColor: '#dcfce7',
              borderRadius: '12px',
              padding: '30px',
              textAlign: 'center',
              marginTop: '20px',
            }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>✓</div>
              <h2 style={{ color: '#166534', fontSize: '18px', fontWeight: 'bold', margin: '0 0 6px 0' }}>
                المركبة بحالة ممتازة
              </h2>
              <p style={{ color: '#15803d', fontSize: '12px', margin: 0 }}>
                لا توجد أعطال أو ملاحظات تستدعي المتابعة
              </p>
            </div>
          ) : (
            <>
              {/* Section Title */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '8px',
                paddingBottom: '4px',
                borderBottom: '2px solid #0f172a',
                flexShrink: 0,
              }}>
                <h2 style={{ color: '#0f172a', fontSize: '11px', fontWeight: 'bold', margin: 0 }}>
                  البنود التي تحتاج متابعة
                </h2>
                <span style={{ color: '#64748b', fontSize: '9px' }}>({issueItems.length} بند)</span>
              </div>

              {/* Issues Grid - Adaptive Columns */}
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
                        border: `1px solid ${isFail ? '#fecaca' : '#fde68a'}`,
                        borderRight: `3px solid ${isFail ? '#dc2626' : '#f97316'}`,
                        borderRadius: '4px',
                        padding: itemPadding,
                        display: 'flex',
                        gap: '4px',
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
                            borderRadius: '3px',
                            flexShrink: 0,
                          }} 
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '1px' }}>
                          <span style={{ 
                            color: isFail ? '#dc2626' : '#f97316', 
                            fontSize: isVeryCompact ? '8px' : '10px',
                            fontWeight: 'bold',
                          }}>
                            {isFail ? '●' : '◐'}
                          </span>
                          <span style={{ 
                            color: '#64748b', 
                            fontSize: isVeryCompact ? '6px' : '7px',
                            backgroundColor: '#f1f5f9',
                            padding: '0px 3px',
                            borderRadius: '3px',
                          }}>
                            {getCategoryName(item.category)}
                          </span>
                        </div>
                        <p style={{ 
                          color: '#1e293b', 
                          fontSize: itemFontSize, 
                          fontWeight: 'bold', 
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {item.faultName.split(' - ')[0]}
                        </p>
                        <p style={{ 
                          color: isFail ? '#dc2626' : '#f97316', 
                          fontSize: isVeryCompact ? '6px' : '7px', 
                          margin: '1px 0 0 0',
                          fontWeight: 'bold',
                        }}>
                          يحتاج متابعة
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Signature Section - Compact */}
        {(inspection.signature || inspection.customerSignature) && (
          <div style={{ 
            padding: '6px 20px', 
            borderTop: '1px solid #e2e8f0',
            flexShrink: 0,
          }}>
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '7px', margin: '0 0 2px 0' }}>توقيع العميل</p>
                <p style={{ color: '#0f172a', fontSize: '9px', fontWeight: 'bold', margin: 0 }}>
                  {inspection.customerName || 'العميل'}
                </p>
              </div>
              <img 
                src={inspection.signature || inspection.customerSignature || ''} 
                alt="Signature" 
                style={{ 
                  height: '30px', 
                  maxWidth: '80px',
                  objectFit: 'contain',
                }} 
              />
            </div>
          </div>
        )}

        {/* Footer - Compact */}
        <div style={{
          backgroundColor: '#0f172a',
          padding: '8px 20px',
          flexShrink: 0,
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <img src={logoPath} alt="Logo" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
              <span style={{ color: '#ffffff', fontSize: '9px', fontWeight: 'bold' }}>
                مركز الأمان العالي الدولي
              </span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: '7px' }}>0542206000</span>
              <span style={{ color: '#94a3b8', fontSize: '7px' }}>highsafety2021@gmail.com</span>
              <span style={{ color: '#94a3b8', fontSize: '7px' }}>سيتي بلازا - الشارقة</span>
            </div>
          </div>
          <p style={{ 
            color: '#64748b', 
            fontSize: '6px', 
            textAlign: 'center', 
            margin: '4px 0 0 0',
            borderTop: '1px solid #334155',
            paddingTop: '4px',
          }}>
            تقرير رقم: HS-{inspection.id} | هذا التقرير يعكس حالة المركبة وقت الفحص فقط
          </p>
        </div>
      </div>
    );
  }
);

PdfReportTemplate.displayName = 'PdfReportTemplate';
