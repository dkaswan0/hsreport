import React, { forwardRef } from 'react';
import logoPath from '@assets/hs-logo.png';
import hsBannerPath from '@assets/hs-banner.jpeg';
import hsCarBranding from '@assets/hs_car_branding.png';
import { PhosphorIcon } from '@/components/phosphor-icon';
// @ts-expect-error untyped module
import reshaper from 'arabic-reshaper';

// Helper function to connect Arabic text for html2canvas rendering
const fixArabic = (text: any): string => {
  if (text === null || text === undefined) return '';
  const str = String(text).trim();
  if (!str) return '';

  const arabicRegex = /[\u0600-\u06FF]/;
  if (!arabicRegex.test(str)) {
    return str; // Return unchanged if there are no Arabic characters
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

export interface InspectionItem {
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

export interface Inspection {
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
  autelReportName?: string | null;
}

export const BRAND = {
  navy: '#0C1A28',
  navyDark: '#071019',
  gold: '#C5852C',
  goldLight: '#D4AF37',
  red: '#dc2626',
  orange: '#ea580c',
  yellow: '#ca8a04',
  blue: '#2563eb',
  border: '#CBD5E1',
  text: '#0C1A28',
  textMuted: '#64748B',
  bgLight: '#F8FAFC',
};

const textStyle: React.CSSProperties = {
  fontFamily: '"Cairo", "Segoe UI", Tahoma, sans-serif',
  letterSpacing: '0px',
  wordSpacing: '0px',
  lineHeight: '1.35',
  fontSmooth: 'always',
  WebkitFontSmoothing: 'antialiased',
};

// ----------------------------------------------------
// 1. TOP HEADER BANNER (EXACT MASTER REFERENCE)
// ----------------------------------------------------
export const PdfHeaderBanner = ({ 
  inspection, 
  pageNum, 
  totalPages,
  formattedDate
}: { 
  inspection: Inspection; 
  pageNum: number; 
  totalPages: number; 
  formattedDate: string; 
}) => (
  <div style={{
    backgroundColor: BRAND.navy,
    borderRadius: '8px',
    overflow: 'hidden',
    border: `1px solid ${BRAND.gold}`,
    color: '#ffffff',
    flexShrink: 0,
    boxSizing: 'border-box',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '6px',
  }}>
    <img 
      src={hsBannerPath} 
      alt="High Safety International Center" 
      style={{ 
        width: '100%', 
        height: 'auto', 
        maxHeight: '92px', 
        objectFit: 'contain',
        display: 'block' 
      }} 
    />
  </div>
);

// ----------------------------------------------------
// 2. SECTION 1: VEHICLE INFORMATION (NATURAL ASPECT RATIO)
// ----------------------------------------------------
export const PdfVehicleInfoSection = ({ inspection }: { inspection: Inspection }) => {
  return (
    <div style={{ border: `1px solid ${BRAND.border}`, borderRadius: '10px', overflow: 'hidden', backgroundColor: '#ffffff', marginTop: '8px', flexShrink: 0 }}>
      {/* Dark Navy Section Header */}
      <div style={{ backgroundColor: BRAND.navy, color: '#ffffff', padding: '7px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PhosphorIcon name="car-profile" weight="duotone" size={18} className="text-[#C5852C]" />
          <span style={{ fontWeight: 'bold', fontSize: '12px' }}>
            <span style={{ color: BRAND.goldLight, marginRight: '4px' }}>1 |</span> {f('معلومات السيارة')} <span style={{ fontSize: '9px', color: '#94A3B8', fontFamily: 'monospace' }}>| Vehicle Information</span>
          </span>
        </div>
      </div>

      <div style={{ padding: '10px 12px', display: 'grid', gridTemplateColumns: '5fr 7fr', gap: '12px' }}>
        {/* Left 5 Cols: 2-Column Key-Value Specs */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: `1px solid ${BRAND.border}`, borderRadius: '8px', padding: '6px 10px', backgroundColor: BRAND.bgLight }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3.5px 0', borderBottom: '1px solid #e2e8f0', fontSize: '10px' }}>
            <span style={{ fontWeight: 'bold', color: BRAND.navy }}>{f(inspection.make || '-')}</span>
            <span style={{ color: BRAND.textMuted }}>{f('الشركة المصنعة | Manufacturer')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3.5px 0', borderBottom: '1px solid #e2e8f0', fontSize: '10px' }}>
            <span style={{ fontWeight: 'bold', color: BRAND.navy }}>{f(inspection.model || '-')}</span>
            <span style={{ color: BRAND.textMuted }}>{f('الموديل | Model')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3.5px 0', borderBottom: '1px solid #e2e8f0', fontSize: '10px' }}>
            <span style={{ fontWeight: 'bold', fontFamily: 'monospace', color: BRAND.navy }}>{inspection.year || '-'}</span>
            <span style={{ color: BRAND.textMuted }}>{f('سنة الصنع | Year')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3.5px 0', borderBottom: '1px solid #e2e8f0', fontSize: '10px' }}>
            <span style={{ fontWeight: 'bold', color: BRAND.navy }}>{f(inspection.color || '-')}</span>
            <span style={{ color: BRAND.textMuted }}>{f('اللون | Color')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3.5px 0', borderBottom: '1px solid #e2e8f0', fontSize: '10px' }}>
            <span style={{ fontWeight: 'bold', fontFamily: 'monospace', color: BRAND.navy }} dir="ltr">{inspection.vin || '-'}</span>
            <span style={{ color: BRAND.textMuted }}>{f('(VIN) رقم الهيكل | (VIN)')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3.5px 0', borderBottom: '1px solid #e2e8f0', fontSize: '10px' }}>
            <span style={{ fontWeight: 'bold', fontFamily: 'monospace', color: BRAND.navy }}>{(inspection.odometer || 0).toLocaleString()} KM</span>
            <span style={{ color: BRAND.textMuted }}>{f('قراءة العداد | Odometer')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3.5px 0', fontSize: '10px' }}>
            <span style={{ fontWeight: 'bold', color: '#059669' }}>{f('فحص شامل | Full')}</span>
            <span style={{ color: BRAND.textMuted }}>{f('نوع الفحص | Type')}</span>
          </div>
        </div>

        {/* Right 7 Cols: 3D Car Photo + VIN Card & Odometer Card (NO SQUASHING) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ 
            height: '115px', 
            borderRadius: '8px', 
            border: `1px solid ${BRAND.border}`, 
            overflow: 'hidden', 
            backgroundColor: BRAND.bgLight, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '4px',
            boxSizing: 'border-box'
          }}>
            {inspection.mainCarPhoto ? (
              <img 
                src={inspection.mainCarPhoto} 
                alt="Vehicle Main" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%', 
                  width: 'auto', 
                  height: 'auto', 
                  objectFit: 'contain' 
                }} 
              />
            ) : (
              <img 
                src={hsCarBranding} 
                alt="High Safety Branding" 
                style={{ 
                  maxWidth: '85%', 
                  maxHeight: '85%', 
                  width: 'auto', 
                  height: 'auto', 
                  objectFit: 'contain', 
                  opacity: 0.25 
                }} 
              />
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ border: `1px solid ${BRAND.border}`, borderRadius: '6px', padding: '5px', textAlign: 'center', backgroundColor: BRAND.bgLight }}>
              <div style={{ fontSize: '8.5px', fontWeight: 'bold', marginBottom: '3px', color: BRAND.navy }}>{f('VIN | رقم الهيكل (VIN)')}</div>
              <div style={{ height: '48px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', padding: '2px' }}>
                {inspection.vinPhoto ? (
                  <img src={inspection.vinPhoto} alt="VIN" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold', color: BRAND.navy }}>{inspection.vin}</span>
                )}
              </div>
            </div>

            <div style={{ border: `1px solid ${BRAND.border}`, borderRadius: '6px', padding: '5px', textAlign: 'center', backgroundColor: BRAND.bgLight }}>
              <div style={{ fontSize: '8.5px', fontWeight: 'bold', marginBottom: '3px', color: BRAND.navy }}>{f('قراءة العداد | Odometer')}</div>
              <div style={{ height: '48px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', padding: '2px' }}>
                {inspection.odometerPhoto ? (
                  <img src={inspection.odometerPhoto} alt="Odometer" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold', color: BRAND.navy }}>{(inspection.odometer || 85230).toLocaleString()} KM</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 3. SECTION 2: DYNAMIC VEHICLE SECTION PHOTOS ROW
// ----------------------------------------------------
export const PdfVehicleSectionsPhotosRow = ({ inspection }: { inspection: Inspection }) => {
  const allSections = [
    { labelAr: 'الواجهة الأمامية', labelEn: 'Front Side', photo: inspection.frontSidePhoto || inspection.frontLeftDoorPhoto },
    { labelAr: 'الواجهة الخلفية', labelEn: 'Rear Side', photo: inspection.rearSidePhoto || inspection.trunkPhoto },
    { labelAr: 'الجانب الأيسر', labelEn: 'Left Side', photo: inspection.rearLeftDoorPhoto || inspection.frontLeftDoorPhoto },
    { labelAr: 'الجانب الأيمن', labelEn: 'Right Side', photo: inspection.frontRightDoorPhoto || inspection.rearRightDoorPhoto },
    { labelAr: 'حجرة المحرك', labelEn: 'Engine Bay', photo: inspection.hoodPhoto },
    { labelAr: 'المقصورة الداخلية', labelEn: 'Interior', photo: inspection.interiorPhoto || inspection.frontLeftDoorInteriorPhoto },
    { labelAr: 'صندوق الأمتعة', labelEn: 'Trunk', photo: inspection.trunkPhoto },
  ];

  // Dynamic filter: only show non-empty or standard full list
  const activePhotos = allSections.filter(s => s.photo);
  const photoSections = activePhotos.length > 0 ? activePhotos : allSections;
  const colCount = Math.min(Math.max(photoSections.length, 1), 7);

  return (
    <div style={{ border: `1px solid ${BRAND.border}`, borderRadius: '10px', overflow: 'hidden', backgroundColor: '#ffffff', marginTop: '8px', flexShrink: 0 }}>
      <div style={{ backgroundColor: BRAND.navy, color: '#ffffff', padding: '7px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PhosphorIcon name="camera" weight="duotone" size={18} className="text-[#C5852C]" />
          <span style={{ fontWeight: 'bold', fontSize: '12px' }}>
            <span style={{ color: BRAND.goldLight, marginRight: '4px' }}>2 |</span> {f('صور أقسام السيارة')} <span style={{ fontSize: '9px', color: '#94A3B8', fontFamily: 'monospace' }}>| Vehicle Sections Photos ({photoSections.length})</span>
          </span>
        </div>
      </div>

      <div style={{ 
        padding: '8px 10px', 
        display: 'grid', 
        gridTemplateColumns: `repeat(${colCount}, 1fr)`, 
        gap: '6px' 
      }}>
        {photoSections.map((sec, idx) => (
          <div key={idx} style={{ border: `1px solid ${BRAND.border}`, borderRadius: '6px', overflow: 'hidden', textAlign: 'center', backgroundColor: BRAND.bgLight }}>
            <div style={{ height: '58px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {sec.photo ? (
                <img src={sec.photo} alt={sec.labelEn} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <PhosphorIcon name="camera" weight="duotone" size={20} className="text-slate-400" />
              )}
            </div>
            <div style={{ padding: '3px 2px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '8.5px', fontWeight: 'bold', color: BRAND.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f(sec.labelAr)}</div>
              <div style={{ fontSize: '7px', color: '#94a3b8', fontFamily: 'monospace' }} dir="ltr">{sec.labelEn}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 4. FINDING CARD COMPONENT (WITH BLUEPRINT SVG)
// ----------------------------------------------------
export const PdfFindingCard = ({ item }: { item: InspectionItem }) => {
  const titleAr = item.faultName?.split(' - ')[0] || item.faultName || 'ملاحظة فنية';

  return (
    <div style={{
      border: `1px solid ${BRAND.border}`,
      borderRadius: '8px',
      padding: '8px 10px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      backgroundColor: '#ffffff',
      boxSizing: 'border-box',
    }}>
      {/* Left: Defect Photo with Natural Aspect Ratio */}
      <div style={{ 
        width: '115px', 
        height: '82px', 
        borderRadius: '6px', 
        overflow: 'hidden', 
        backgroundColor: '#f1f5f9', 
        flexShrink: 0, 
        border: '1px solid #cbd5e1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {item.imageUrl ? (
          <img 
            src={item.imageUrl} 
            alt="Defect" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover', 
              objectPosition: 'center' 
            }} 
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PhosphorIcon name="camera" weight="duotone" size={24} className="text-slate-400" />
          </div>
        )}
      </div>

      {/* Middle: Details & Descriptions */}
      <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
        <div style={{ fontSize: '9.5px', fontWeight: 'bold', color: BRAND.gold }}>{f(item.category || 'فحص عام')}</div>
        <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: BRAND.navy, margin: '2px 0' }}>{f(titleAr)}</h4>
        <p style={{ fontSize: '9.5px', color: '#334155', margin: '2px 0', lineHeight: '1.35' }}>{f(item.description || item.notes || 'ملاحظة مسجلة أثناء الفحص الفني.')}</p>
        {item.descriptionEn && (
          <p style={{ fontSize: '8px', color: '#94A3B8', margin: 0, fontFamily: 'monospace' }} dir="ltr">{item.descriptionEn}</p>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 5. SECTIONS 4, 5, 6, 7: OBD, AUTEL & TERMS BLOCK
export const PdfObdAndTermsBlock = ({ inspection }: { inspection: Inspection }) => {
  const obdCodes = (inspection.obdCodes as Array<{code: string; nameEn: string; nameAr: string; status?: string}> | null) || [];
  const hasAutel = !!inspection.autelReportPdf;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', flexShrink: 0 }}>
      {/* 2-Column Block: Section 4 OBD Codes, Section 5 Terms */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
        {/* Col 1: Section 4 - OBD Diagnostic Trouble Codes */}
        <div style={{ border: `1px solid ${BRAND.border}`, borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
          <div style={{ backgroundColor: BRAND.navy, color: '#ffffff', padding: '6px 8px', fontSize: '10px', fontWeight: 'bold' }}>
            <span style={{ color: BRAND.goldLight, marginRight: '3px' }}>4 |</span> {f('أعطال وتشخيص كمبيوتر السيارة')}
            <div style={{ fontSize: '7.5px', color: '#94a3b8' }}>OBD-II Diagnostic Trouble Codes</div>
          </div>
          <div style={{ padding: '6px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: BRAND.bgLight }}>
            {obdCodes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '12px 4px', color: BRAND.textMuted, fontSize: '9px' }}>
                {f('لا توجد أكواد أعطال مسجلة (OBD Clear)')}
              </div>
            ) : (
              obdCodes.slice(0, 4).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px', backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '8.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: BRAND.navy, fontSize: '10px' }}>{c.code}</span>
                    <span style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{f(c.nameAr)}</span>
                  </div>
                  <span style={{ fontSize: '7.5px', color: '#64748b', fontFamily: 'monospace' }}>{c.nameEn}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Col 2: Section 5 - Terms & Conditions */}
        <div style={{ border: `1px solid ${BRAND.border}`, borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
          <div style={{ backgroundColor: BRAND.navy, color: '#ffffff', padding: '6px 8px', fontSize: '10px', fontWeight: 'bold' }}>
            <span style={{ color: BRAND.goldLight, marginRight: '3px' }}>5 |</span> {f('الأحكام والشروط')}
            <div style={{ fontSize: '7.5px', color: '#94a3b8' }}>Terms & Conditions</div>
          </div>
          <div style={{ padding: '6px 8px', fontSize: '8px', lineHeight: '1.3', backgroundColor: '#ffffff', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div><p style={{ margin: '1px 0', fontWeight: 'bold' }}>{f('1. المركز غير مسئول عن أي أعطال بعد الفحص.')}</p></div>
            <div><p style={{ margin: '1px 0', fontWeight: 'bold' }}>{f('2. مسؤول عن نتيجة الفحص وقت الفحص فقط.')}</p></div>
            <div><p style={{ margin: '1px 0', fontWeight: 'bold' }}>{f('3. الفحص غير معتمد لدى إدارة التراخيص.')}</p></div>
            <div><p style={{ margin: '1px 0', fontWeight: 'bold' }}>{f('4. غير مسئول عن أي أغراض شخصية داخل السيارة.')}</p></div>
            <div><p style={{ margin: '1px 0', fontWeight: 'bold' }}>{f('5. التقرير حسب قراءة الأجهزة وقت الفحص.')}</p></div>
          </div>
        </div>
      </div>

      {/* Section 6: Autel Computer Diagnostic Report Row (If available) */}
      {hasAutel && (
        <div style={{ 
          border: `1px solid ${BRAND.border}`, 
          borderRadius: '8px', 
          overflow: 'hidden', 
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 14px',
          background: 'linear-gradient(to left, #f8fafc, #ffffff)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: BRAND.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PhosphorIcon name="cpu" weight="duotone" size={16} className="text-[#C5852C]" />
            </div>
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: BRAND.navy }}>
                <span style={{ color: BRAND.gold, marginRight: '4px' }}>6 |</span>
                {f('تقرير فحص الكمبيوتر الشامل من جهاز Autel MaxiSys')}
              </div>
              <div style={{ fontSize: '8px', color: '#64748B', fontFamily: 'monospace' }} dir="ltr">
                Autel MaxiSys Diagnostic Report Attached Seamlessly in PDF
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#fef3c7', border: '1px solid #fde68a', padding: '3px 8px', borderRadius: '6px' }}>
            <PhosphorIcon name="file-pdf" weight="duotone" size={14} className="text-red-500" />
            <span style={{ fontSize: '8.5px', fontWeight: 'bold', color: '#92400e' }}>{f('مرفق بالتقرير')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// 6. BOTTOM FOOTER BAR
// ----------------------------------------------------
export const PdfFooterBar = ({ pageNum, totalPages }: { pageNum: number; totalPages: number }) => (
  <div style={{
    backgroundColor: BRAND.navy,
    borderRadius: '8px',
    padding: '8px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: `2px solid ${BRAND.gold}`,
    color: '#ffffff',
    fontSize: '8.5px',
    marginTop: '8px',
    flexShrink: 0,
  }}>
    <div style={{ display: 'flex', gap: '20px', color: '#cbd5e1' }}>
      <span>📞 0542206000</span>
      <span>📍 {f('الشارقة الصناعية 13، طريق المدينة الجامعية')}</span>
    </div>
    <span style={{ color: BRAND.goldLight, fontWeight: 'bold', fontSize: '9px' }}>{f(`الصفحة ${pageNum} من ${totalPages}`)}</span>
  </div>
);

// ----------------------------------------------------
// 7. DYNAMIC MULTI-PAGE DOCUMENT CONTAINER
// ----------------------------------------------------
export const PdfMultiPageDocument = forwardRef<HTMLDivElement, { inspection: Inspection; lang?: 'ar' | 'en' }>(
  ({ inspection, lang = 'ar' }, ref) => {
    const items = inspection.items || [];
    const formattedDate = inspection.createdAt 
      ? new Date(inspection.createdAt).toLocaleDateString('ar-AE', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + new Date(inspection.createdAt).toLocaleTimeString('ar-AE', { hour: '2-digit', minute: '2-digit' })
      : '20/05/2024 02:35 PM';

    // Dynamic pagination calculation:
    // Page 1 has Header, Section 1, Section 2.
    // In Page 1, if items <= 4, items + OBD/Terms fit on Page 1 (1 High Safety page).
    // If items == 5 or 6, Page 1 holds 6 items; Page 2 holds OBD/Terms (2 High Safety pages).
    // If items > 6, Page 1 holds 6 items, subsequent pages hold up to 8 items, and final page holds remaining items + OBD/Terms.
    const pageChunks: InspectionItem[][] = [];

    if (items.length <= 4) {
      pageChunks.push(items); // Page 1 holds all items + OBD/Terms
    } else {
      // Page 1 gets first 6 items
      pageChunks.push(items.slice(0, 6));
      let remaining = items.slice(6);
      while (remaining.length > 0) {
        if (remaining.length <= 4) {
          pageChunks.push(remaining); // Fits with OBD/Terms on this page
          break;
        } else if (remaining.length <= 8) {
          pageChunks.push(remaining); // Full findings page
          break;
        } else {
          pageChunks.push(remaining.slice(0, 8));
          remaining = remaining.slice(8);
        }
      }
    }

    // Determine if OBD/Terms need their own standalone page
    const lastChunk = pageChunks[pageChunks.length - 1];
    const needSeparateObdPage = items.length > 4 && lastChunk.length > 4;
    const totalHighSafetyPages = pageChunks.length + (needSeparateObdPage ? 1 : 0);

    return (
      <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {pageChunks.map((chunk, pageIdx) => {
          const pageNum = pageIdx + 1;
          const isFirstPage = pageNum === 1;
          const isLastFindingsPage = pageIdx === pageChunks.length - 1;
          const showObdOnThisPage = isLastFindingsPage && !needSeparateObdPage;

          return (
            <div
              key={pageIdx}
              className="pdf-page-render"
              dir="rtl"
              style={{
                width: '794px',
                height: '1123px',
                backgroundColor: '#ffffff',
                padding: '20px 24px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: BRAND.text,
                overflow: 'hidden',
                position: 'relative',
                ...textStyle,
              }}
            >
              {/* Header Banner */}
              <PdfHeaderBanner 
                inspection={inspection} 
                pageNum={pageNum} 
                totalPages={totalHighSafetyPages} 
                formattedDate={formattedDate} 
              />

              {/* First Page: Section 1 & Section 2 */}
              {isFirstPage && (
                <>
                  <PdfVehicleInfoSection inspection={inspection} />
                  <PdfVehicleSectionsPhotosRow inspection={inspection} />
                </>
              )}

              {/* Section 3: Inspection Results */}
              <div style={{
                border: `1px solid ${BRAND.border}`,
                borderRadius: '10px',
                overflow: 'hidden',
                backgroundColor: '#ffffff',
                marginTop: '8px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}>
                <div style={{ backgroundColor: BRAND.navy, color: '#ffffff', padding: '7px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PhosphorIcon name="clipboard-text" weight="duotone" size={18} className="text-[#C5852C]" />
                    <span style={{ fontWeight: 'bold', fontSize: '12px' }}>
                      <span style={{ color: BRAND.goldLight, marginRight: '4px' }}>3 |</span> {f('نتائج الفحص')} <span style={{ fontSize: '9px', color: '#94A3B8', fontFamily: 'monospace' }}>| Inspection Results</span>
                    </span>
                  </div>
                </div>

                <div style={{
                  padding: '8px',
                  flex: 1,
                  display: chunk.length === 1 ? 'flex' : 'grid',
                  gridTemplateColumns: chunk.length === 1 ? undefined : '1fr 1fr',
                  alignItems: chunk.length === 1 ? 'center' : undefined,
                  justifyContent: chunk.length === 1 ? 'center' : undefined,
                  gap: '8px',
                  overflow: 'hidden',
                  backgroundColor: BRAND.bgLight,
                }}>
                  {chunk.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', width: '100%' }}>
                      <PhosphorIcon name="check-circle" weight="duotone" size={40} className="text-emerald-600 mx-auto" />
                      <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: BRAND.navy, margin: '6px 0 2px 0' }}>{f('المركبة بحالة ممتازة')}</h4>
                      <p style={{ fontSize: '10px', color: BRAND.textMuted, margin: 0 }}>{f('لم يتم تسجيل أي ملاحظات أو عيوب فنية على المركبة')}</p>
                    </div>
                  ) : chunk.length === 1 ? (
                    <div style={{ width: '92%', margin: '0 auto' }}>
                      <PdfFindingCard item={chunk[0]} />
                    </div>
                  ) : (
                    chunk.map((item, i) => (
                      <PdfFindingCard key={item.id || i} item={item} />
                    ))
                  )}
                </div>
              </div>

              {/* Render OBD & Terms block if this page holds it */}
              {showObdOnThisPage && (
                <PdfObdAndTermsBlock inspection={inspection} />
              )}

              {/* Bottom Footer Bar */}
              <PdfFooterBar pageNum={pageNum} totalPages={totalHighSafetyPages} />
            </div>
          );
        })}

        {/* Separate OBD & Terms Page if needed for overflow */}
        {needSeparateObdPage && (
          <div
            className="pdf-page-render"
            dir="rtl"
            style={{
              width: '794px',
              height: '1123px',
              backgroundColor: '#ffffff',
              padding: '20px 24px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              color: BRAND.text,
              overflow: 'hidden',
              position: 'relative',
              ...textStyle,
            }}
          >
            <PdfHeaderBanner 
              inspection={inspection} 
              pageNum={totalHighSafetyPages} 
              totalPages={totalHighSafetyPages} 
              formattedDate={formattedDate} 
            />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px' }}>
              <PdfObdAndTermsBlock inspection={inspection} />
            </div>

            <PdfFooterBar pageNum={totalHighSafetyPages} totalPages={totalHighSafetyPages} />
          </div>
        )}
      </div>
    );
  }
);
PdfMultiPageDocument.displayName = 'PdfMultiPageDocument';
