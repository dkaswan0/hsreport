import { forwardRef } from 'react';
import logoPath from '@assets/IMG_3029.png';

interface InspectionItem {
  id: number;
  category: string;
  name: string;
  status: 'pass' | 'fail' | 'warning';
  notes?: string;
  imageUrl?: string;
}

interface Inspection {
  id: number;
  vin: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  mileage?: number;
  customerName?: string;
  customerPhone?: string;
  inspectionType?: string;
  signature?: string;
  createdAt?: string;
  items?: InspectionItem[];
}

interface PdfReportTemplateProps {
  inspection: Inspection;
}

const INSPECTION_CATEGORIES = [
  { id: 'engine', name: 'المحرك', icon: '⚙️' },
  { id: 'transmission', name: 'ناقل الحركة', icon: '🔧' },
  { id: 'chassis', name: 'الشاسيه', icon: '🚗' },
  { id: 'body', name: 'الهيكل', icon: '🛡️' },
  { id: 'tires', name: 'الإطارات', icon: '⭕' },
  { id: 'brakes', name: 'الفرامل', icon: '🛑' },
  { id: 'electrical', name: 'الكهرباء', icon: '⚡' },
  { id: 'wheels', name: 'الجنوط', icon: '🔘' },
  { id: 'suspension', name: 'نظام التعليق', icon: '🔩' },
  { id: 'ac', name: 'التكييف', icon: '❄️' },
  { id: 'exhaust', name: 'الإكزوز', icon: '💨' },
  { id: 'safety', name: 'السلامة', icon: '🛡️' },
];

const getInspectionTypeLabel = (type?: string) => {
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
    const passCount = items.filter(i => i.status === 'pass').length;
    const totalCategories = INSPECTION_CATEGORIES.length;
    
    const inspectionDate = inspection.createdAt ? new Date(inspection.createdAt) : new Date();
    const reportDate = inspectionDate.toLocaleDateString('ar-AE', { year: 'numeric', month: 'long', day: 'numeric' });
    const reportTime = inspectionDate.toLocaleTimeString('ar-AE', { hour: '2-digit', minute: '2-digit', hour12: false });
    const fullDateTime = `${reportDate} - الساعة ${reportTime}`;

    const getCategoryName = (catId: string) => {
      return INSPECTION_CATEGORIES.find(c => c.id === catId)?.name || catId;
    };

    const groupedFails = failItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, InspectionItem[]>);

    const groupedWarnings = warningItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, InspectionItem[]>);

    return (
      <div 
        ref={ref}
        dir="rtl"
        style={{
          width: '794px',
          minHeight: '1123px',
          backgroundColor: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          padding: '0',
          margin: '0',
          boxSizing: 'border-box',
        }}
      >
        {/* Header Band */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img src={logoPath} alt="Logo" style={{ width: '56px', height: '56px', borderRadius: '12px' }} />
            <div>
              <h1 style={{ color: '#ffffff', fontSize: '22px', fontWeight: 'bold', margin: 0 }}>
                مركز الأمان العالي الدولي
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: '4px 0 0 0' }}>
                HIGH SAFETY INTERNATIONAL
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 'bold',
              marginBottom: '8px',
            }}>
              {getInspectionTypeLabel(inspection.inspectionType)}
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '11px', margin: 0 }}>{fullDateTime}</p>
          </div>
        </div>

        {/* Vehicle Info Strip */}
        <div style={{
          backgroundColor: '#f8f5f0',
          padding: '20px 32px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '24px',
          borderBottom: '2px solid #e2e8f0',
        }}>
          {/* Vehicle Identity */}
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: '#64748b', fontSize: '11px', margin: '0 0 8px 0', fontWeight: 'normal' }}>بيانات المركبة</h3>
            <p style={{ color: '#0f172a', fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
              {inspection.make} {inspection.model} {inspection.year}
            </p>
            <p style={{ color: '#475569', fontSize: '12px', margin: 0 }}>
              اللون: {inspection.color?.split(',')[0]?.trim() || 'غير محدد'}
            </p>
            <p style={{ color: '#475569', fontSize: '12px', margin: '4px 0 0 0' }}>
              الممشى: {inspection.mileage?.toLocaleString() || '—'} كم
            </p>
          </div>

          {/* VIN */}
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: '#64748b', fontSize: '11px', margin: '0 0 8px 0', fontWeight: 'normal' }}>رقم الشاصي (VIN)</h3>
            <p style={{ 
              color: '#0f172a', 
              fontSize: '13px', 
              fontWeight: 'bold', 
              margin: 0,
              fontFamily: 'monospace',
              letterSpacing: '1px',
              wordBreak: 'break-all',
            }}>
              {inspection.vin}
            </p>
            <p style={{ color: '#64748b', fontSize: '11px', margin: '8px 0 0 0' }}>
              رقم التقرير: HS-{inspection.id}
            </p>
          </div>

          {/* Quick Stats */}
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: '#64748b', fontSize: '11px', margin: '0 0 12px 0', fontWeight: 'normal' }}>ملخص الفحص</h3>
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <p style={{ color: '#16a34a', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{passCount}</p>
                <p style={{ color: '#64748b', fontSize: '10px', margin: '2px 0 0 0' }}>سليم</p>
              </div>
              <div>
                <p style={{ color: '#dc2626', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{failItems.length}</p>
                <p style={{ color: '#64748b', fontSize: '10px', margin: '2px 0 0 0' }}>عطل</p>
              </div>
              <div>
                <p style={{ color: '#f97316', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{warningItems.length}</p>
                <p style={{ color: '#64748b', fontSize: '10px', margin: '2px 0 0 0' }}>ملاحظة</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Faults */}
        <div style={{ padding: '24px 32px' }}>
          {failItems.length === 0 && warningItems.length === 0 ? (
            <div style={{
              backgroundColor: '#dcfce7',
              borderRadius: '16px',
              padding: '40px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
              <h2 style={{ color: '#166534', fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                السيارة بحالة ممتازة
              </h2>
              <p style={{ color: '#15803d', fontSize: '14px', margin: 0 }}>
                لا توجد أعطال أو ملاحظات تستدعي المتابعة
              </p>
            </div>
          ) : (
            <>
              <h2 style={{ 
                color: '#0f172a', 
                fontSize: '16px', 
                fontWeight: 'bold', 
                margin: '0 0 16px 0',
                paddingBottom: '8px',
                borderBottom: '2px solid #0f172a',
              }}>
                البنود التي تحتاج متابعة
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Fails Column */}
                <div>
                  {failItems.length > 0 && (
                    <>
                      <div style={{
                        backgroundColor: '#fef2f2',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        <span style={{ color: '#dc2626', fontSize: '16px' }}>●</span>
                        <span style={{ color: '#991b1b', fontSize: '13px', fontWeight: 'bold' }}>
                          أعطال تحتاج إصلاح ({failItems.length})
                        </span>
                      </div>
                      {Object.entries(groupedFails).map(([catId, catItems]) => (
                        <div key={catId} style={{ marginBottom: '12px' }}>
                          <p style={{ color: '#475569', fontSize: '11px', fontWeight: 'bold', margin: '0 0 6px 0' }}>
                            {getCategoryName(catId)}
                          </p>
                          {catItems.map((item) => (
                            <div key={item.id} style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #fecaca',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              marginBottom: '6px',
                              borderRight: '4px solid #dc2626',
                            }}>
                              <p style={{ color: '#1e293b', fontSize: '12px', fontWeight: 'bold', margin: 0 }}>
                                {item.name}
                              </p>
                              {item.notes && (
                                <p style={{ color: '#64748b', fontSize: '10px', margin: '4px 0 0 0' }}>
                                  {item.notes}
                                </p>
                              )}
                              <p style={{ color: '#dc2626', fontSize: '10px', margin: '4px 0 0 0', fontWeight: 'bold' }}>
                                يحتاج متابعة ●
                              </p>
                            </div>
                          ))}
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* Warnings Column */}
                <div>
                  {warningItems.length > 0 && (
                    <>
                      <div style={{
                        backgroundColor: '#fff7ed',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        <span style={{ color: '#f97316', fontSize: '16px' }}>◐</span>
                        <span style={{ color: '#9a3412', fontSize: '13px', fontWeight: 'bold' }}>
                          ملاحظات تحتاج انتباه ({warningItems.length})
                        </span>
                      </div>
                      {Object.entries(groupedWarnings).map(([catId, catItems]) => (
                        <div key={catId} style={{ marginBottom: '12px' }}>
                          <p style={{ color: '#475569', fontSize: '11px', fontWeight: 'bold', margin: '0 0 6px 0' }}>
                            {getCategoryName(catId)}
                          </p>
                          {catItems.map((item) => (
                            <div key={item.id} style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #fed7aa',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              marginBottom: '6px',
                              borderRight: '4px solid #f97316',
                            }}>
                              <p style={{ color: '#1e293b', fontSize: '12px', fontWeight: 'bold', margin: 0 }}>
                                {item.name}
                              </p>
                              {item.notes && (
                                <p style={{ color: '#64748b', fontSize: '10px', margin: '4px 0 0 0' }}>
                                  {item.notes}
                                </p>
                              )}
                              <p style={{ color: '#f97316', fontSize: '10px', margin: '4px 0 0 0', fontWeight: 'bold' }}>
                                يحتاج متابعة ◐
                              </p>
                            </div>
                          ))}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Signature Section */}
        {inspection.signature && (
          <div style={{ padding: '0 32px 24px 32px' }}>
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '11px', margin: '0 0 4px 0' }}>توقيع العميل الإلكتروني</p>
                <p style={{ color: '#0f172a', fontSize: '13px', fontWeight: 'bold', margin: 0 }}>
                  {inspection.customerName || 'العميل'}
                </p>
              </div>
              <img 
                src={inspection.signature} 
                alt="Signature" 
                style={{ 
                  height: '50px', 
                  maxWidth: '150px',
                  objectFit: 'contain',
                  filter: 'contrast(1.2)',
                }} 
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          backgroundColor: '#0f172a',
          padding: '20px 32px',
          marginTop: 'auto',
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={logoPath} alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
              <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: 'bold' }}>
                مركز الأمان العالي الدولي
              </span>
            </div>
            <div style={{ display: 'flex', gap: '24px' }}>
              <span style={{ color: '#94a3b8', fontSize: '11px' }}>📱 0542206000</span>
              <span style={{ color: '#94a3b8', fontSize: '11px' }}>📧 highsafety2021@gmail.com</span>
              <span style={{ color: '#94a3b8', fontSize: '11px' }}>📍 سيتي بلازا الدراري - الشارقة</span>
            </div>
          </div>
          <p style={{ 
            color: '#64748b', 
            fontSize: '9px', 
            textAlign: 'center', 
            margin: 0,
            borderTop: '1px solid #334155',
            paddingTop: '12px',
          }}>
            هذا التقرير الإلكتروني صادر عن مركز الأمان العالي الدولي ويعكس حالة المركبة وقت الفحص فقط. لا يُعتبر ضماناً لحالة المركبة المستقبلية.
          </p>
        </div>
      </div>
    );
  }
);

PdfReportTemplate.displayName = 'PdfReportTemplate';
