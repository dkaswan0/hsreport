import { forwardRef } from 'react';
import logoPath from '@assets/hs-logo.png';
import hsCarBranding from '@assets/hs_car_branding.png';
import { PhosphorIcon } from '@/components/phosphor-icon';
import { CarBlueprintPinpoint } from '@/components/car-blueprint-pinpoint';
// @ts-expect-error untyped module
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

  const convertArabic = (reshaper as any).convertArabic || 
                        (reshaper as any).default?.convertArabic || 
                        reshaper;

  if (typeof convertArabic !== 'function') {
    return str;
  }

  return convertArabic(str);
};

const f = (text: any): string => fixArabic(text);

interface InspectionItem {
  id: number;
  category: string;
  faultName: string;
  status: string;
  severity?: string;
  notes?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
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
  vinPhoto?: string | null;
  odometerPhoto?: string | null;
  frontSidePhoto?: string | null;
  rearSidePhoto?: string | null;
  rearLeftDoorPhoto?: string | null;
  rearRightDoorPhoto?: string | null;
  frontLeftDoorPhoto?: string | null;
  frontRightDoorPhoto?: string | null;
  hoodPhoto?: string | null;
  trunkPhoto?: string | null;
  interiorPhoto?: string | null;
  rearLeftDoorInteriorPhoto?: string | null;
  rearRightDoorInteriorPhoto?: string | null;
  frontLeftDoorInteriorPhoto?: string | null;
  frontRightDoorInteriorPhoto?: string | null;
  hoodInteriorPhoto?: string | null;
  trunkInteriorPhoto?: string | null;
  obdCodes?: any;
  autelReportPdf?: string | null;
}

type PdfLang = 'ar' | 'en';

interface PdfReportTemplateProps {
  inspection: Inspection;
  lang?: PdfLang;
  pageNum?: number;
  totalPages?: number;
}

const BRAND = {
  navy: '#0C1A28',
  gold: '#C5852C',
  goldLight: '#D4AF37',
  red: '#dc2626',
  orange: '#ea580c',
  yellow: '#ca8a04',
  blue: '#2563eb',
  border: '#E2E8F0',
  text: '#0C1A28',
  textMuted: '#64748B',
  bgLight: '#F8FAFC',
};

const textStyle: React.CSSProperties = {
  fontFamily: '"Cairo", "Segoe UI", Tahoma, sans-serif',
  letterSpacing: '0px',
  wordSpacing: '0px',
  lineHeight: '1.4',
  fontSmooth: 'always',
  WebkitFontSmoothing: 'antialiased',
};

// ==========================================
// 1. PAGE 1: COVER & VEHICLE INFO & 7 PHOTOS
// ==========================================
export const PdfCoverPage = forwardRef<HTMLDivElement, PdfReportTemplateProps>(
  ({ inspection, lang = 'ar', totalPages = 4 }, ref) => {
    const isAr = lang === 'ar';
    const formattedDate = inspection.createdAt 
      ? new Date(inspection.createdAt).toLocaleDateString('ar-AE', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + new Date(inspection.createdAt).toLocaleTimeString('ar-AE', { hour: '2-digit', minute: '2-digit' })
      : '20/05/2024 02:35 PM';

    const photoSections = [
      { labelAr: 'الواجهة الأمامية', labelEn: 'Front Side', photo: inspection.frontSidePhoto || inspection.frontLeftDoorPhoto },
      { labelAr: 'الواجهة الخلفية', labelEn: 'Rear Side', photo: inspection.rearSidePhoto || inspection.trunkPhoto },
      { labelAr: 'الجانب الأيسر', labelEn: 'Left Side', photo: inspection.rearLeftDoorPhoto || inspection.frontLeftDoorPhoto },
      { labelAr: 'الجانب الأيمن', labelEn: 'Right Side', photo: inspection.frontRightDoorPhoto || inspection.rearRightDoorPhoto },
      { labelAr: 'حجرة المحرك', labelEn: 'Engine Bay', photo: inspection.hoodPhoto },
      { labelAr: 'المقصورة الداخلية', labelEn: 'Interior', photo: inspection.interiorPhoto || inspection.frontLeftDoorInteriorPhoto },
      { labelAr: 'صندوق الأمتعة', labelEn: 'Trunk', photo: inspection.trunkPhoto },
    ];

    return (
      <div 
        ref={ref}
        dir="rtl"
        style={{
          width: '794px',
          height: '1123px',
          backgroundColor: '#ffffff',
          padding: '24px 28px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: BRAND.text,
          overflow: 'hidden',
          ...textStyle,
        }}
      >
        {/* Top Header Banner with Center Crest & Meta Box */}
        <div style={{
          backgroundColor: BRAND.navy,
          borderRadius: '12px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `2px solid ${BRAND.gold}`,
          color: '#ffffff',
        }}>
          {/* Left: English Branding */}
          <div style={{ textAlign: 'left', minWidth: '180px' }} dir="ltr">
            <h3 style={{ margin: 0, fontSize: '11px', fontWeight: 'bold', color: BRAND.goldLight, letterSpacing: '0.5px' }}>
              HIGH SAFETY INTERNATIONAL CENTER L.L.C.
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '8px', color: '#94A3B8' }}>
              FOR THE TECHNICAL INSPECTION OF VEHICLES
            </p>
          </div>

          {/* Center: High Safety Gold Emblem */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 12px' }}>
            <img src={logoPath} alt="Logo" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${BRAND.gold}` }} />
          </div>

          {/* Right: Arabic Branding & Meta Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: BRAND.goldLight }}>
                {f('مركز الأمان العالي الدولي ش.ذ.م.م')}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '8px', color: '#94A3B8' }}>
                {f('للفحص الفني للمركبات والمعدات والآليات')}
              </p>
            </div>

            <div style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(197,133,44,0.4)',
              borderRadius: '8px',
              padding: '6px 10px',
              textAlign: 'right',
              fontSize: '8px',
            }}>
              <div><span style={{ color: BRAND.goldLight }}>{f('رقم التقرير: ')}</span><span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>HS-{inspection.id || '2024-001'}</span></div>
              <div><span style={{ color: '#94A3B8' }}>{f('تاريخ الفحص: ')}</span><span>{f(formattedDate)}</span></div>
              <div><span style={{ color: '#94A3B8' }}>{f('عدد الصفحات: ')}</span><span>{f(`1 من ${totalPages}`)}</span></div>
            </div>
          </div>
        </div>

        {/* Section 1: Vehicle Information */}
        <div style={{ border: `1px solid ${BRAND.border}`, borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ffffff', marginTop: '12px' }}>
          <div style={{ backgroundColor: BRAND.navy, color: '#ffffff', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PhosphorIcon name="car-profile" weight="duotone" size={18} className="text-[#C5852C]" />
              <span style={{ fontWeight: 'bold', fontSize: '12px' }}>
                <span style={{ color: BRAND.goldLight, marginRight: '4px' }}>1 |</span> {f('معلومات السيارة')} <span style={{ fontSize: '9px', color: '#94A3B8', fontFamily: 'monospace' }}>| Vehicle Information</span>
              </span>
            </div>
          </div>

          <div style={{ padding: '14px', display: 'grid', gridTemplateColumns: '5fr 7fr', gap: '14px' }}>
            {/* Left 5 Cols: Specs Table */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: `1px solid ${BRAND.border}`, borderRadius: '8px', padding: '8px 12px', backgroundColor: BRAND.bgLight }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0', fontSize: '10px' }}>
                <span style={{ fontWeight: 'bold' }}>{f(inspection.make || '-')}</span>
                <span style={{ color: BRAND.textMuted }}>{f('الشركة المصنعة / Manufacturer')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0', fontSize: '10px' }}>
                <span style={{ fontWeight: 'bold' }}>{f(inspection.model || '-')}</span>
                <span style={{ color: BRAND.textMuted }}>{f('الموديل / Model')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0', fontSize: '10px' }}>
                <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{inspection.year || '-'}</span>
                <span style={{ color: BRAND.textMuted }}>{f('سنة الصنع / Year')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0', fontSize: '10px' }}>
                <span style={{ fontWeight: 'bold' }}>{f(inspection.color || '-')}</span>
                <span style={{ color: BRAND.textMuted }}>{f('اللون / Color')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0', fontSize: '10px' }}>
                <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }} dir="ltr">{inspection.vin || '-'}</span>
                <span style={{ color: BRAND.textMuted }}>{f('رقم الهيكل / VIN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0', fontSize: '10px' }}>
                <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{(inspection.odometer || 0).toLocaleString()} كم</span>
                <span style={{ color: BRAND.textMuted }}>{f('قراءة العداد / Odometer')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '10px' }}>
                <span style={{ fontWeight: 'bold', color: '#059669' }}>{f('فحص شامل / Full')}</span>
                <span style={{ color: BRAND.textMuted }}>{f('نوع الفحص / Type')}</span>
              </div>
            </div>

            {/* Right 7 Cols: Main 3D Car Photo + VIN Card & Odometer Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ height: '140px', borderRadius: '8px', border: `1px solid ${BRAND.border}`, overflow: 'hidden', backgroundColor: BRAND.bgLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {inspection.mainCarPhoto ? (
                  <img src={inspection.mainCarPhoto} alt="Vehicle Main" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <img src={hsCarBranding} alt="High Safety Branding" style={{ width: '80%', height: '80%', objectFit: 'contain', opacity: 0.2 }} />
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ border: `1px solid ${BRAND.border}`, borderRadius: '6px', padding: '6px', textAlign: 'center', backgroundColor: BRAND.bgLight }}>
                  <div style={{ fontSize: '8px', fontWeight: 'bold', marginBottom: '4px' }}>{f('رقم الهيكل (VIN)')}</div>
                  <div style={{ height: '55px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                    {inspection.vinPhoto ? (
                      <img src={inspection.vinPhoto} alt="VIN" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold' }}>{inspection.vin}</span>
                    )}
                  </div>
                </div>

                <div style={{ border: `1px solid ${BRAND.border}`, borderRadius: '6px', padding: '6px', textAlign: 'center', backgroundColor: BRAND.bgLight }}>
                  <div style={{ fontSize: '8px', fontWeight: 'bold', marginBottom: '4px' }}>{f('قراءة العداد (Odometer)')}</div>
                  <div style={{ height: '55px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                    {inspection.odometerPhoto ? (
                      <img src={inspection.odometerPhoto} alt="Odometer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold', color: BRAND.navy }}>{(inspection.odometer || 85230).toLocaleString()} KM</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Vehicle Section Photos */}
        <div style={{ border: `1px solid ${BRAND.border}`, borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ffffff', marginTop: '10px' }}>
          <div style={{ backgroundColor: BRAND.navy, color: '#ffffff', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PhosphorIcon name="camera" weight="duotone" size={18} className="text-[#C5852C]" />
              <span style={{ fontWeight: 'bold', fontSize: '12px' }}>
                <span style={{ color: BRAND.goldLight, marginRight: '4px' }}>2 |</span> {f('صور أقسام السيارة')} <span style={{ fontSize: '9px', color: '#94A3B8', fontFamily: 'monospace' }}>| Vehicle Sections Photos</span>
              </span>
            </div>
          </div>

          <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {photoSections.map((sec, idx) => (
              <div key={idx} style={{ border: `1px solid ${BRAND.border}`, borderRadius: '6px', overflow: 'hidden', textAlign: 'center', backgroundColor: BRAND.bgLight }}>
                <div style={{ height: '65px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {sec.photo ? (
                    <img src={sec.photo} alt={sec.labelEn} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <PhosphorIcon name="camera" weight="duotone" size={20} className="text-slate-400" />
                  )}
                </div>
                <div style={{ padding: '4px 2px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '8px', fontWeight: 'bold', color: BRAND.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f(sec.labelAr)}</div>
                  <div style={{ fontSize: '7px', color: '#94a3b8', fontFamily: 'monospace' }} dir="ltr">{sec.labelEn}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Banner */}
        <div style={{
          backgroundColor: BRAND.navy,
          borderRadius: '10px',
          padding: '8px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: `2px solid ${BRAND.gold}`,
          color: '#ffffff',
          fontSize: '8px',
          marginTop: '10px',
        }}>
          <div style={{ display: 'flex', gap: '16px', color: '#cbd5e1' }}>
            <span>📞 0542206000</span>
            <span>✉️ highsafety2021@gmail.com</span>
            <span>🌐 www.highsafetyint.com</span>
            <span>📍 {f('سيتي بلازا الدراري - الشارقة')}</span>
          </div>
          <span style={{ color: BRAND.goldLight, fontWeight: 'bold' }}>{f(`الصفحة 1 من ${totalPages}`)}</span>
        </div>
      </div>
    );
  }
);
PdfCoverPage.displayName = 'PdfCoverPage';

// ==========================================
// 2. PAGE 2: DETAILED FINDINGS & CAR BLUEPRINT
// ==========================================
export const PdfReportTemplate = forwardRef<HTMLDivElement, PdfReportTemplateProps>(
  ({ inspection, lang = 'ar', pageNum = 2, totalPages = 4 }, ref) => {
    const isAr = lang === 'ar';
    const items = inspection.items || [];
    const formattedDate = inspection.createdAt 
      ? new Date(inspection.createdAt).toLocaleDateString('ar-AE', { year: 'numeric', month: '2-digit', day: '2-digit' })
      : '';

    return (
      <div 
        ref={ref}
        dir="rtl"
        style={{
          width: '794px',
          height: '1123px',
          backgroundColor: '#ffffff',
          padding: '24px 28px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: BRAND.text,
          overflow: 'hidden',
          ...textStyle,
        }}
      >
        {/* Header Strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${BRAND.border}`, paddingBottom: '8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={logoPath} alt="Logo" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: `1px solid ${BRAND.gold}` }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: BRAND.navy }}>{f('مركز الأمان العالي الدولي للفحص الفني')}</h3>
              <p style={{ margin: 0, fontSize: '8px', color: BRAND.textMuted }}>{f('نتائج الفحص التفصيلية ومواضع الملاحظات على هيكل السيارة')}</p>
            </div>
          </div>
          <div style={{ textAlign: 'left', fontSize: '8px', color: BRAND.textMuted }} dir="ltr">
            <span>{`HS-${inspection.id} | ${formattedDate}`}</span>
          </div>
        </div>

        {/* Section 3: Inspection Results */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, marginTop: '10px' }}>
          <div style={{ backgroundColor: BRAND.navy, color: '#ffffff', padding: '8px 16px', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PhosphorIcon name="clipboard-text" weight="duotone" size={18} className="text-[#C5852C]" />
              <span style={{ fontWeight: 'bold', fontSize: '12px' }}>
                <span style={{ color: BRAND.goldLight, marginRight: '4px' }}>3 |</span> {f('نتائج الفحص')} <span style={{ fontSize: '9px', color: '#94A3B8', fontFamily: 'monospace' }}>| Inspection Results</span>
              </span>
            </div>
          </div>

          <div style={{ flex: 1, border: `1px solid ${BRAND.border}`, borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', backgroundColor: BRAND.bgLight, borderRadius: '8px' }}>
                <PhosphorIcon name="check-circle" weight="duotone" size={40} className="text-emerald-600 mx-auto" />
                <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: BRAND.navy, margin: '8px 0 2px 0' }}>{f('المركبة بحالة ممتازة')}</h4>
                <p style={{ fontSize: '10px', color: BRAND.textMuted, margin: 0 }}>{f('لم يتم تسجيل أي ملاحظات أو عيوب فنية على المركبة')}</p>
              </div>
            ) : (
              items.slice(0, 4).map((item, idx) => {
                const titleAr = item.faultName?.split(' - ')[0] || item.faultName || 'ملاحظة فنية';

                return (
                  <div key={idx} style={{ border: `1px solid ${BRAND.border}`, borderRadius: '8px', padding: '8px', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#ffffff' }}>
                    {/* Left: Photo */}
                    <div style={{ width: '110px', height: '80px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#e2e8f0', flexShrink: 0 }}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="Defect" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <PhosphorIcon name="camera" weight="duotone" size={24} className="text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* Middle: Details */}
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                      <div style={{ fontSize: '9px', fontWeight: 'bold', color: BRAND.gold }}>{f(item.category || 'فحص عام')}</div>
                      <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: BRAND.navy, margin: '2px 0' }}>{f(titleAr)}</h4>
                      <p style={{ fontSize: '9px', color: '#475569', margin: '2px 0', lineHeight: '1.3' }}>{f(item.description || item.notes || 'ملاحظة مسجلة أثناء الفحص.')}</p>
                      {item.descriptionEn && (
                        <p style={{ fontSize: '8px', color: '#94A3B8', margin: 0, fontFamily: 'monospace' }} dir="ltr">{item.descriptionEn}</p>
                      )}
                    </div>

                    {/* Right: Top-Down Car Blueprint Pinpoint */}
                    <div style={{ width: '70px', height: '85px', borderRadius: '6px', backgroundColor: BRAND.bgLight, border: `1px solid ${BRAND.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CarBlueprintPinpoint category={item.category || ''} dotColor={BRAND.red} className="w-full h-full" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${BRAND.border}`, paddingTop: '8px', fontSize: '8px', color: BRAND.textMuted, display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
          <span>{f('مركز الأمان العالي الدولي لفحص السيارات - High Safety International')}</span>
          <span>{f(`الصفحة ${pageNum} من ${totalPages}`)}</span>
        </div>
      </div>
    );
  }
);
PdfReportTemplate.displayName = 'PdfReportTemplate';

// ==========================================
// 3. PAGE 3: SECTION PHOTOS DETAIL (IF OVERFLOW)
// ==========================================
export const PdfCarPhotosPage = forwardRef<HTMLDivElement, PdfReportTemplateProps>(
  ({ inspection, lang = 'ar', pageNum = 3, totalPages = 4 }, ref) => {
    const isAr = lang === 'ar';
    const items = inspection.items || [];
    const remainingItems = items.slice(4);

    if (remainingItems.length === 0) return null;

    return (
      <div
        ref={ref}
        dir="rtl"
        style={{
          width: '794px',
          height: '1123px',
          backgroundColor: '#ffffff',
          padding: '24px 28px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: BRAND.text,
          overflow: 'hidden',
          ...textStyle,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${BRAND.border}`, paddingBottom: '8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={logoPath} alt="Logo" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: BRAND.navy }}>{f('نتائج الفحص الإضافية')}</h3>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', margin: '10px 0', overflow: 'hidden' }}>
          {remainingItems.map((item, idx) => (
            <div key={idx} style={{ border: `1px solid ${BRAND.border}`, borderRadius: '8px', padding: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '110px', height: '80px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#e2e8f0', flexShrink: 0 }}>
                {item.imageUrl && <img src={item.imageUrl} alt="Defect" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: BRAND.navy, margin: '2px 0' }}>{f(item.faultName)}</h4>
                <p style={{ fontSize: '9px', color: '#475569', margin: 0 }}>{f(item.description || item.notes)}</p>
              </div>
              <div style={{ width: '70px', height: '85px', borderRadius: '6px', backgroundColor: BRAND.bgLight, flexShrink: 0 }}>
                <CarBlueprintPinpoint category={item.category || ''} dotColor={BRAND.red} className="w-full h-full" />
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: `1px solid ${BRAND.border}`, paddingTop: '8px', fontSize: '8px', color: BRAND.textMuted, display: 'flex', justifyContent: 'space-between' }}>
          <span>{f('مركز الأمان العالي الدولي')}</span>
          <span>{f(`الصفحة ${pageNum} من ${totalPages}`)}</span>
        </div>
      </div>
    );
  }
);
PdfCarPhotosPage.displayName = 'PdfCarPhotosPage';

// ==========================================
// 4. PAGE 4: OBD-II, AUTEL, TERMS & SIGNATURES
// ==========================================
export const PdfSignaturesPage = forwardRef<HTMLDivElement, PdfReportTemplateProps>(
  ({ inspection, lang = 'ar', pageNum = 4, totalPages = 4 }, ref) => {
    const isAr = lang === 'ar';
    const obdCodes = (inspection.obdCodes as Array<{code: string; nameEn: string; nameAr: string; status?: string}> | null) || [];
    const currentCodes = obdCodes.filter(c => c.status !== 'history');
    const historyCodes = obdCodes.filter(c => c.status === 'history');

    return (
      <div
        ref={ref}
        dir="rtl"
        style={{
          width: '794px',
          height: '1123px',
          backgroundColor: '#ffffff',
          padding: '24px 28px',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${BRAND.border}`, paddingBottom: '8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={logoPath} alt="Logo" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: `1px solid ${BRAND.gold}` }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: BRAND.navy }}>{f('فحص كمبيوتر السيارة والاعتماد والتواقيع')}</h3>
              <p style={{ margin: 0, fontSize: '8px', color: BRAND.textMuted }}>{f('OBD-II Diagnostics & Certification')}</p>
            </div>
          </div>
          <div style={{ textAlign: 'left', fontSize: '8px', color: BRAND.textMuted }} dir="ltr">
            <span>{`HS-${inspection.id}`}</span>
          </div>
        </div>

        {/* Section 4 & 5: OBD-II Active & History Codes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          {currentCodes.length > 0 && (
            <div style={{ border: `1px solid ${BRAND.border}`, borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: BRAND.navy, color: '#ffffff', padding: '6px 12px', fontSize: '10px', fontWeight: 'bold' }}>
                <span style={{ color: BRAND.goldLight, marginRight: '4px' }}>4 |</span> {f('الأعطال الحالية — Current')} <span style={{ fontSize: '8px', color: '#94a3b8' }}>| Active Trouble Codes</span>
              </div>
              <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#ffffff' }}>
                {currentCodes.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', backgroundColor: BRAND.bgLight, borderRadius: '4px', fontSize: '9px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: BRAND.navy, fontSize: '11px' }}>{c.code}</span>
                      <span style={{ fontWeight: 'bold' }}>{f(c.nameAr)}</span>
                    </div>
                    <span style={{ color: BRAND.red, fontSize: '8px', fontWeight: 'bold' }}>{f('نشط Active')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {historyCodes.length > 0 && (
            <div style={{ border: `1px solid ${BRAND.border}`, borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: BRAND.navy, color: '#ffffff', padding: '6px 12px', fontSize: '10px', fontWeight: 'bold' }}>
                <span style={{ color: BRAND.goldLight, marginRight: '4px' }}>5 |</span> {f('الأعطال السابقة — History')} <span style={{ fontSize: '8px', color: '#94a3b8' }}>| Stored Trouble Codes</span>
              </div>
              <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#ffffff' }}>
                {historyCodes.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', backgroundColor: BRAND.bgLight, borderRadius: '4px', fontSize: '9px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: BRAND.navy, fontSize: '11px' }}>{c.code}</span>
                      <span style={{ fontWeight: 'bold' }}>{f(c.nameAr)}</span>
                    </div>
                    <span style={{ color: BRAND.yellow, fontSize: '8px', fontWeight: 'bold' }}>{f('سابق History')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 6: Autel Computer Report Overview */}
        <div style={{ border: `1px solid ${BRAND.border}`, borderRadius: '8px', overflow: 'hidden', marginTop: '6px' }}>
          <div style={{ backgroundColor: BRAND.navy, color: '#ffffff', padding: '6px 12px', fontSize: '10px', fontWeight: 'bold' }}>
            <span style={{ color: BRAND.goldLight, marginRight: '4px' }}>6 |</span> {f('تقرير فحص الكمبيوتر Autel')} <span style={{ fontSize: '8px', color: '#94a3b8' }}>| Autel Diagnostic Report</span>
          </div>
          <div style={{ padding: '8px 12px', backgroundColor: BRAND.bgLight, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '9px' }}>
              <div style={{ fontWeight: 'bold', color: BRAND.navy }}>{f('تقرير فحص الكمبيوتر الشامل من جهاز Autel MaxiSys')}</div>
              <div style={{ color: BRAND.textMuted, fontSize: '8px' }}>{f('مرفق التقرير الأصلي بالكامل في الصفحات التالية من هذا الملف')}</div>
            </div>
            <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#059669', backgroundColor: '#ecfdf5', padding: '4px 8px', borderRadius: '4px' }}>
              {f('تم الدمج بنجاح')}
            </span>
          </div>
        </div>

        {/* Section 7: Terms and Conditions */}
        <div style={{ border: `1px solid ${BRAND.border}`, borderRadius: '8px', overflow: 'hidden', marginTop: '6px' }}>
          <div style={{ backgroundColor: BRAND.navy, color: '#ffffff', padding: '6px 12px', fontSize: '10px', fontWeight: 'bold' }}>
            <span style={{ color: BRAND.goldLight, marginRight: '4px' }}>7 |</span> {f('الأحكام والشروط')} <span style={{ fontSize: '8px', color: '#94a3b8' }}>| Terms & Conditions</span>
          </div>
          <div style={{ padding: '8px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '8px', lineHeight: '1.3', backgroundColor: '#ffffff' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{f('1. المركز غير مسئول عن أي أعطال تحدث أثناء الفحص أو بعده.')}</p>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{f('2. المركز مسئول عن نتيجة الفحص وقت الفحص فقط وغير مسئول بعد خروج المركبة.')}</p>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{f('3. هذا الفحص غير معتمد لدى إدارة التراخيص.')}</p>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{f('4. المركز غير مسئول عن أي أغراض شخصية داخل السيارة أثناء الفحص.')}</p>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{f('5. يعتبر هذا التقرير لحالة المركبة حسب قراءة الأجهزة في وقت الفحص.')}</p>
            </div>
          </div>
        </div>

        {/* Signatures & Certification */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px dashed ${BRAND.border}`, borderRadius: '8px', padding: '10px 16px', marginTop: '6px' }}>
          <div style={{ textAlign: 'center', width: '160px' }}>
            <div style={{ fontSize: '8px', color: BRAND.textMuted, marginBottom: '16px' }}>{f('توقيع الفاحص / المركز')}</div>
            <div style={{ borderTop: `1px solid ${BRAND.textMuted}`, paddingTop: '2px', fontSize: '8px', fontWeight: 'bold' }}>HIGH SAFETY CENTER</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <img src={logoPath} alt="Verified" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: `1px solid ${BRAND.gold}` }} />
            <div style={{ fontSize: '7px', fontWeight: 'bold', color: BRAND.gold, marginTop: '2px' }}>VERIFIED REPORT</div>
          </div>

          <div style={{ textAlign: 'center', width: '160px' }}>
            <div style={{ fontSize: '8px', color: BRAND.textMuted, marginBottom: '16px' }}>{f('توقيع العميل')}</div>
            <div style={{ borderTop: `1px solid ${BRAND.textMuted}`, paddingTop: '2px', fontSize: '8px' }}>{f(inspection.customerName || 'العميل الكريم')}</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${BRAND.border}`, paddingTop: '8px', fontSize: '8px', color: BRAND.textMuted, display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
          <span>{f('مركز الأمان العالي الدولي لفحص السيارات')}</span>
          <span>{f(`الصفحة ${pageNum} من ${totalPages}`)}</span>
        </div>
      </div>
    );
  }
);
PdfSignaturesPage.displayName = 'PdfSignaturesPage';
