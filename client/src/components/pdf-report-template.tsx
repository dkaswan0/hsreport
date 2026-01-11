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

    const itemsWithImages = issueItems.filter(i => i.imageUrl);
    const itemsWithoutImages = issueItems.filter(i => !i.imageUrl);

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
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={logoPath} alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
            <div>
              <h1 style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
                مركز الأمان العالي الدولي
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '9px', margin: '2px 0 0 0' }}>
                HIGH SAFETY INTERNATIONAL
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: 'bold',
              marginBottom: '4px',
            }}>
              {getInspectionTypeLabel(inspection.inspectionType)}
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '9px', margin: 0 }}>{fullDateTime}</p>
          </div>
        </div>

        {/* Vehicle Info - Compact Grid */}
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '10px 20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: '12px',
          borderBottom: '1px solid #e2e8f0',
          flexShrink: 0,
        }}>
          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '8px 10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#64748b', fontSize: '8px', margin: '0 0 2px 0' }}>المركبة</p>
            <p style={{ color: '#0f172a', fontSize: '11px', fontWeight: 'bold', margin: 0 }}>
              {inspection.make} {inspection.model} {inspection.year}
            </p>
          </div>
          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '8px 10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#64748b', fontSize: '8px', margin: '0 0 2px 0' }}>رقم الشاصي</p>
            <p style={{ color: '#0f172a', fontSize: '9px', fontWeight: 'bold', margin: 0, fontFamily: 'monospace' }}>
              {inspection.vin}
            </p>
          </div>
          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '8px 10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#64748b', fontSize: '8px', margin: '0 0 2px 0' }}>اللون / الممشى</p>
            <p style={{ color: '#0f172a', fontSize: '10px', fontWeight: 'bold', margin: 0 }}>
              {inspection.color?.split(',')[0]?.trim() || '-'} / {(inspection.odometer || inspection.mileage)?.toLocaleString() || '-'} كم
            </p>
          </div>
          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '8px 10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#16a34a', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{passCount}</p>
              <p style={{ color: '#64748b', fontSize: '7px', margin: 0 }}>سليم</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#dc2626', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{failItems.length}</p>
              <p style={{ color: '#64748b', fontSize: '7px', margin: 0 }}>عطل</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#f97316', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{warningItems.length}</p>
              <p style={{ color: '#64748b', fontSize: '7px', margin: 0 }}>ملاحظة</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '12px 20px', overflow: 'hidden' }}>
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
                marginBottom: '10px',
                paddingBottom: '6px',
                borderBottom: '2px solid #0f172a',
              }}>
                <h2 style={{ color: '#0f172a', fontSize: '13px', fontWeight: 'bold', margin: 0 }}>
                  البنود التي تحتاج متابعة
                </h2>
                <span style={{ color: '#64748b', fontSize: '10px' }}>({issueItems.length} بند)</span>
              </div>

              {/* Issues Grid - Two Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {issueItems.slice(0, 16).map((item, idx) => {
                  const isFail = item.status === 'fail';
                  return (
                    <div 
                      key={item.id || idx} 
                      style={{
                        backgroundColor: isFail ? '#fef2f2' : '#fffbeb',
                        border: `1px solid ${isFail ? '#fecaca' : '#fde68a'}`,
                        borderRight: `3px solid ${isFail ? '#dc2626' : '#f97316'}`,
                        borderRadius: '6px',
                        padding: '6px 8px',
                        display: 'flex',
                        gap: '6px',
                      }}
                    >
                      {item.imageUrl && (
                        <img 
                          src={item.imageUrl} 
                          alt="" 
                          style={{ 
                            width: '45px', 
                            height: '35px', 
                            objectFit: 'cover', 
                            borderRadius: '4px',
                            flexShrink: 0,
                          }} 
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                          <span style={{ 
                            color: isFail ? '#dc2626' : '#f97316', 
                            fontSize: '10px',
                            fontWeight: 'bold',
                          }}>
                            {isFail ? '●' : '◐'}
                          </span>
                          <span style={{ 
                            color: '#64748b', 
                            fontSize: '8px',
                            backgroundColor: '#f1f5f9',
                            padding: '1px 4px',
                            borderRadius: '4px',
                          }}>
                            {getCategoryName(item.category)}
                          </span>
                        </div>
                        <p style={{ 
                          color: '#1e293b', 
                          fontSize: '9px', 
                          fontWeight: 'bold', 
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {item.faultName.split(' - ')[0]}
                        </p>
                        {item.notes && (
                          <p style={{ 
                            color: '#64748b', 
                            fontSize: '7px', 
                            margin: '2px 0 0 0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {item.notes}
                          </p>
                        )}
                        <p style={{ 
                          color: isFail ? '#dc2626' : '#f97316', 
                          fontSize: '7px', 
                          margin: '2px 0 0 0',
                          fontWeight: 'bold',
                        }}>
                          يحتاج متابعة
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Show remaining count if more than 16 items */}
              {issueItems.length > 16 && (
                <p style={{ 
                  color: '#64748b', 
                  fontSize: '9px', 
                  textAlign: 'center', 
                  margin: '8px 0 0 0',
                  fontStyle: 'italic',
                }}>
                  + {issueItems.length - 16} بند إضافي
                </p>
              )}
            </>
          )}
        </div>

        {/* Signature Section - Compact */}
        {(inspection.signature || inspection.customerSignature) && (
          <div style={{ 
            padding: '8px 20px', 
            borderTop: '1px solid #e2e8f0',
            flexShrink: 0,
          }}>
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '8px', margin: '0 0 2px 0' }}>توقيع العميل</p>
                <p style={{ color: '#0f172a', fontSize: '10px', fontWeight: 'bold', margin: 0 }}>
                  {inspection.customerName || 'العميل'}
                </p>
              </div>
              <img 
                src={inspection.signature || inspection.customerSignature || ''} 
                alt="Signature" 
                style={{ 
                  height: '35px', 
                  maxWidth: '100px',
                  objectFit: 'contain',
                }} 
              />
            </div>
          </div>
        )}

        {/* Footer - Compact */}
        <div style={{
          backgroundColor: '#0f172a',
          padding: '10px 20px',
          flexShrink: 0,
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src={logoPath} alt="Logo" style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
              <span style={{ color: '#ffffff', fontSize: '10px', fontWeight: 'bold' }}>
                مركز الأمان العالي الدولي
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: '8px' }}>0542206000</span>
              <span style={{ color: '#94a3b8', fontSize: '8px' }}>highsafety2021@gmail.com</span>
              <span style={{ color: '#94a3b8', fontSize: '8px' }}>سيتي بلازا - الشارقة</span>
            </div>
          </div>
          <p style={{ 
            color: '#64748b', 
            fontSize: '7px', 
            textAlign: 'center', 
            margin: '6px 0 0 0',
            borderTop: '1px solid #334155',
            paddingTop: '6px',
          }}>
            تقرير رقم: HS-{inspection.id} | هذا التقرير يعكس حالة المركبة وقت الفحص فقط
          </p>
        </div>
      </div>
    );
  }
);

PdfReportTemplate.displayName = 'PdfReportTemplate';
