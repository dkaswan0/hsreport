import { getVehicleColor, calculateInspectionStats, getHealthLabel, resolveVehiclePhoto } from "@/lib/vehicle-utils";
import React, { forwardRef } from 'react';
import logoPath from '@assets/hs-logo.png';
import hsCarBranding from '@assets/hs_car_branding.png';
import { PhosphorIcon } from '@/components/phosphor-icon';
import { CarBlueprintPinpoint } from '@/components/car-blueprint-pinpoint';

export interface InspectionItem {
  id: number;
  category: string;
  faultName: string;
  status: string;
  severity?: string | null;
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
  black: '#09090b',
  dark: '#18181b',
  grayDark: '#27272a',
  grayMid: '#71717a',
  grayLight: '#e4e4e7',
  border: '#e4e4e7',
  borderLight: '#f4f4f5',
  text: '#09090b',
  textMuted: '#71717a',
  bgLight: '#fafafa',
};

const textStyle: React.CSSProperties = {
  fontFamily: '"Cairo", "Segoe UI", -apple-system, BlinkMacSystemFont, Tahoma, sans-serif',
  letterSpacing: '0px',
  wordSpacing: '0px',
  lineHeight: '1.35',
  fontSmooth: 'always',
  WebkitFontSmoothing: 'antialiased',
};

// ----------------------------------------------------
// 1. TOP HEADER (LUXURY MONOCHROME LOGO HEADER)
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
    backgroundColor: BRAND.black,
    borderRadius: '8px',
    overflow: 'hidden',
    border: `1.5px solid ${BRAND.grayDark}`,
    color: '#ffffff',
    flexShrink: 0,
    boxSizing: 'border-box',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '6px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  }}>
    <div style={{
      padding: '8px 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: `1px solid ${BRAND.grayDark}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '8px',
          backgroundColor: BRAND.dark,
          border: `1px solid ${BRAND.grayDark}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}>
          <img 
            src={logoPath} 
            alt="High Safety International Center" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#ffffff' }}>
            مركز الأمان العالي الدولي لفحص السيارات
          </h1>
          <p style={{ margin: '1px 0 0 0', fontSize: '7.5px', color: '#a1a1aa', fontFamily: 'monospace', letterSpacing: '0.5px' }} dir="ltr">
            HIGH SAFETY INTERNATIONAL VEHICLE INSPECTION
          </p>
        </div>
      </div>
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
        <div style={{
          fontSize: '7.5px',
          fontWeight: 'bold',
          backgroundColor: BRAND.dark,
          border: `1px solid ${BRAND.grayDark}`,
          color: '#e4e4e7',
          padding: '2px 6px',
          borderRadius: '4px'
        }}>
          تقرير فحص فني معتمد
        </div>
        <div style={{ fontSize: '7px', color: '#71717a', fontFamily: 'monospace' }} dir="ltr">
          REPORT ID: HS-{String(inspection.id).padStart(4, '0')}
        </div>
      </div>
    </div>

    {/* Contact sub-bar */}
    <div style={{
      backgroundColor: BRAND.dark,
      padding: '3px 14px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '7.5px',
      color: '#d4d4d8',
    }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <span>📞 <span dir="ltr" style={{ fontWeight: 'bold' }}>0542206000</span></span>
        <span>📍 الشارقة الصناعية 13، طريق المدينة الجامعية</span>
      </div>
      <span style={{ color: '#a1a1aa', fontFamily: 'monospace' }} dir="ltr">
        {formattedDate}
      </span>
    </div>
  </div>
);

// ----------------------------------------------------
// 2. SECTION 1: VEHICLE INFORMATION
// ----------------------------------------------------
export const PdfVehicleInfoSection = ({ inspection }: { inspection: Inspection }) => {
  return (
    <div style={{ 
      border: `1px solid ${BRAND.border}`, 
      borderRadius: '8px', 
      overflow: 'hidden', 
      backgroundColor: '#ffffff', 
      marginTop: '6px', 
      flexShrink: 0 
    }}>
      {/* Luxury Monochrome Section Header */}
      <div style={{ 
        backgroundColor: BRAND.black, 
        color: '#ffffff', 
        padding: '5px 12px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: `1px solid ${BRAND.grayDark}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PhosphorIcon name="car-profile" weight="bold" size={16} className="text-white" />
          <span style={{ fontWeight: 'bold', fontSize: '11.5px' }}>
            <span style={{ color: '#a1a1aa', marginRight: '4px' }}>1 |</span> معلومات السيارة <span style={{ fontSize: '9px', color: '#a1a1aa', fontFamily: 'monospace' }}>| Vehicle Information</span>
          </span>
        </div>
      </div>

      <div style={{ padding: '8px 10px', display: 'grid', gridTemplateColumns: '5fr 7fr', gap: '10px' }}>
        {/* Left 5 Cols: Key-Value Specs Table */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between', 
          border: `1px solid ${BRAND.borderLight}`, 
          borderRadius: '6px', 
          padding: '5px 8px', 
          backgroundColor: BRAND.bgLight 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #e4e4e7', fontSize: '9.5px' }}>
            <span style={{ fontWeight: 'bold', color: BRAND.black }}>{inspection.make || '-'}</span>
            <span style={{ color: BRAND.textMuted }}>الشركة المصنعة | Manufacturer</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #e4e4e7', fontSize: '9.5px' }}>
            <span style={{ fontWeight: 'bold', color: BRAND.black }}>{inspection.model || '-'}</span>
            <span style={{ color: BRAND.textMuted }}>الموديل | Model</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #e4e4e7', fontSize: '9.5px' }}>
            <span style={{ fontWeight: 'bold', fontFamily: 'monospace', color: BRAND.black }}>{inspection.year || '-'}</span>
            <span style={{ color: BRAND.textMuted }}>سنة الصنع | Year</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #e4e4e7', fontSize: '9.5px' }}>
            <span style={{ fontWeight: 'bold', color: BRAND.black }}>{inspection.color || '-'}</span>
            <span style={{ color: BRAND.textMuted }}>اللون | Color</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #e4e4e7', fontSize: '9.5px' }}>
            <span style={{ fontWeight: 'bold', fontFamily: 'monospace', color: BRAND.black }} dir="ltr">{inspection.vin || '-'}</span>
            <span style={{ color: BRAND.textMuted }}>(VIN) رقم الهيكل | (VIN)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #e4e4e7', fontSize: '9.5px' }}>
            <span style={{ fontWeight: 'bold', fontFamily: 'monospace', color: BRAND.black }}>{(inspection.odometer || 0).toLocaleString()} كم</span>
            <span style={{ color: BRAND.textMuted }}>قراءة العداد | Odometer</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '9.5px' }}>
            <span style={{ fontWeight: 'bold', color: BRAND.black }}>{inspection.inspectionType || 'فحص شامل Full Inspection'}</span>
            <span style={{ color: BRAND.textMuted }}>نوع الفحص | Inspection Type</span>
          </div>
        </div>

        {/* Right 7 Cols: Hero Car Photo + VIN Card & Odometer Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ 
            height: '105px', 
            borderRadius: '6px', 
            border: `1px solid ${BRAND.borderLight}`, 
            overflow: 'hidden', 
            backgroundColor: BRAND.bgLight, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '3px',
            boxSizing: 'border-box'
          }}>
            {resolveVehiclePhoto(inspection, "mainCarPhoto") ? (
              <img 
                src={resolveVehiclePhoto(inspection, "mainCarPhoto")} 
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
                  opacity: 0.3 
                }} 
              />
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <div style={{ border: `1px solid ${BRAND.borderLight}`, borderRadius: '6px', padding: '4px', textAlign: 'center', backgroundColor: BRAND.bgLight }}>
              <div style={{ fontSize: '8px', fontWeight: 'bold', marginBottom: '2px', color: BRAND.black }}>رقم الهيكل (VIN)</div>
              <div style={{ height: '42px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e4e4e7', padding: '2px' }}>
                {inspection.vinPhoto ? (
                  <img src={inspection.vinPhoto} alt="VIN" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold', color: BRAND.black }}>{inspection.vin}</span>
                )}
              </div>
            </div>

            <div style={{ border: `1px solid ${BRAND.borderLight}`, borderRadius: '6px', padding: '4px', textAlign: 'center', backgroundColor: BRAND.bgLight }}>
              <div style={{ fontSize: '8px', fontWeight: 'bold', marginBottom: '2px', color: BRAND.black }}>قراءة العداد | Odometer</div>
              <div style={{ height: '42px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e4e4e7', padding: '2px' }}>
                {inspection.odometerPhoto ? (
                  <img src={inspection.odometerPhoto} alt="Odometer" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold', color: BRAND.black }}>{(inspection.odometer || 0).toLocaleString()} كم</span>
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
// 3. SECTION 2: VEHICLE SECTION PHOTOS ROW (7 FRAMES)
// ----------------------------------------------------
export const PdfVehicleSectionsPhotosRow = ({ inspection }: { inspection: Inspection }) => {
  const allSections = [
    { labelAr: 'الواجهة الأمامية', labelEn: 'Front Side', photo: inspection.frontSidePhoto },
    { labelAr: 'الواجهة الخلفية', labelEn: 'Rear Side', photo: inspection.rearSidePhoto },
    { labelAr: 'الجانب الأيسر', labelEn: 'Left Side', photo: inspection.rearLeftDoorPhoto || inspection.frontLeftDoorPhoto },
    { labelAr: 'الجانب الأيمن', labelEn: 'Right Side', photo: inspection.frontRightDoorPhoto || inspection.rearRightDoorPhoto },
    { labelAr: 'حجرة المحرك', labelEn: 'Engine Bay', photo: inspection.hoodPhoto },
    { labelAr: 'المقصورة الداخلية', labelEn: 'Interior', photo: inspection.interiorPhoto || inspection.frontLeftDoorInteriorPhoto },
    { labelAr: 'صندوق الأمتعة', labelEn: 'Trunk', photo: inspection.trunkPhoto },
  ];

  return (
    <div style={{ 
      border: `1px solid ${BRAND.border}`, 
      borderRadius: '8px', 
      overflow: 'hidden', 
      backgroundColor: '#ffffff', 
      marginTop: '6px', 
      flexShrink: 0 
    }}>
      <div style={{ 
        backgroundColor: BRAND.black, 
        color: '#ffffff', 
        padding: '5px 12px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: `1px solid ${BRAND.grayDark}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PhosphorIcon name="camera" weight="bold" size={16} className="text-white" />
          <span style={{ fontWeight: 'bold', fontSize: '11.5px' }}>
            <span style={{ color: '#a1a1aa', marginRight: '4px' }}>2 |</span> صور أقسام السيارة <span style={{ fontSize: '9px', color: '#a1a1aa', fontFamily: 'monospace' }}>| Vehicle Sections Photos</span>
          </span>
        </div>
      </div>

      <div style={{ 
        padding: '6px 8px', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: '5px' 
      }}>
        {allSections.map((sec, idx) => (
          <div key={idx} style={{ 
            border: `1px solid ${BRAND.borderLight}`, 
            borderRadius: '5px', 
            overflow: 'hidden', 
            textAlign: 'center', 
            backgroundColor: BRAND.bgLight 
          }}>
            <div style={{ 
              height: '52px', 
              backgroundColor: '#f4f4f5', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              overflow: 'hidden' 
            }}>
              {sec.photo ? (
                <img src={sec.photo} alt={sec.labelEn} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <PhosphorIcon name="camera" weight="bold" size={18} className="text-zinc-400" />
              )}
            </div>
            <div style={{ padding: '2px 1px', backgroundColor: '#ffffff', borderTop: '1px solid #e4e4e7' }}>
              <div style={{ fontSize: '8px', fontWeight: 'bold', color: BRAND.black, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sec.labelAr}</div>
              <div style={{ fontSize: '6.5px', color: '#a1a1aa', fontFamily: 'monospace' }} dir="ltr">{sec.labelEn}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 4. FINDING CARD COMPONENT (WITH BLUEPRINT SVG PINPOINT)
// ----------------------------------------------------
const getSeverityBadge = (severity?: string | null) => {
  return { labelAr: severity || 'ملاحظة', bg: '#f4f4f5', text: '#18181b', border: '#d4d4d8' };
};

export const PdfFindingCard = ({ 
  item, 
  isFullWidth = false 
}: { 
  item: InspectionItem; 
  isFullWidth?: boolean;
}) => {
  const titleAr = item.faultName?.split(' - ')[0] || item.faultName || 'ملاحظة فنية';
  const badge = getSeverityBadge(item.severity);

  return (
    <div style={{
      border: `1px solid ${BRAND.borderLight}`,
      borderRadius: '8px',
      padding: isFullWidth ? '8px 12px' : '6px 8px',
      display: 'flex',
      alignItems: 'center',
      gap: isFullWidth ? '14px' : '8px',
      backgroundColor: '#ffffff',
      boxSizing: 'border-box',
      height: '100%',
      minHeight: isFullWidth ? '92px' : '78px',
    }}>
      {/* Left: Defect Photo */}
      <div style={{ 
        width: isFullWidth ? '120px' : '75px', 
        height: isFullWidth ? '80px' : '64px', 
        borderRadius: '6px', 
        overflow: 'hidden', 
        backgroundColor: '#f4f4f5', 
        flexShrink: 0, 
        border: '1px solid #e4e4e7',
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
            <PhosphorIcon name="camera" weight="bold" size={20} className="text-zinc-400" />
          </div>
        )}
      </div>

      {/* Middle: Details & Descriptions with Black Vertical Line */}
      <div style={{ flex: 1, minWidth: 0, textAlign: 'right', borderRight: `3px solid ${BRAND.black}`, paddingRight: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginBottom: '2px' }}>
          <span style={{ fontSize: isFullWidth ? '10px' : '8.5px', fontWeight: 'bold', color: BRAND.black }}>
            {item.category || 'فحص عام'}
          </span>
          <span style={{ 
            fontSize: '7.5px', 
            fontWeight: 'bold', 
            backgroundColor: badge.bg, 
            color: badge.text, 
            border: `1px solid ${badge.border}`, 
            padding: '1px 5px', 
            borderRadius: '4px' 
          }}>
            {badge.labelAr}
          </span>
        </div>

        <h4 style={{ 
          fontSize: isFullWidth ? '11.5px' : '10px', 
          fontWeight: 'bold', 
          color: BRAND.black, 
          margin: '1px 0',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {titleAr}
        </h4>

        <p style={{ 
          fontSize: isFullWidth ? '9px' : '8px', 
          color: '#27272a', 
          margin: '1px 0', 
          lineHeight: '1.3',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {item.description || item.notes || 'وجود ملاحظة فنية مسجلة أثناء عملية الفحص الفني.'}
        </p>

        {item.descriptionEn && (
          <p style={{ 
            fontSize: isFullWidth ? '7.5px' : '7px', 
            color: '#71717a', 
            margin: 0, 
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }} dir="ltr">
            {item.descriptionEn}
          </p>
        )}
      </div>

      {/* Right: Car Blueprint Pinpoint Outline */}
      <div style={{ 
        width: isFullWidth ? '58px' : '42px', 
        height: isFullWidth ? '80px' : '64px', 
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <CarBlueprintPinpoint 
          category={item.category || ''} 
          className={isFullWidth ? "w-14 h-20" : "w-10 h-16"}
        />
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 5. SECTIONS 4, 5, 6: OBD, AUTEL & TERMS BLOCK
// ----------------------------------------------------
export const PdfObdAndTermsBlock = ({ inspection }: { inspection: Inspection }) => {
  const obdCodes = (inspection.obdCodes as Array<{code: string; nameEn: string; nameAr: string; diagnosis?: string}> | null) || [];
  const hasAutel = !!inspection.autelReportPdf;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', flexShrink: 0 }}>
      {/* 2-Column Block: Section 4 OBD Codes, Section 6 Terms */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '6px' }}>
        {/* Col 1: Section 4 - OBD Diagnostic Trouble Codes */}
        <div style={{ 
          border: `1px solid ${BRAND.border}`, 
          borderRadius: '8px', 
          overflow: 'hidden', 
          backgroundColor: '#ffffff', 
          display: 'flex', 
          flexDirection: 'column' 
        }}>
          <div style={{ 
            backgroundColor: BRAND.black, 
            color: '#ffffff', 
            padding: '5px 8px', 
            fontSize: '9.5px', 
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${BRAND.grayDark}`
          }}>
            <div>
              <span style={{ color: '#a1a1aa', marginRight: '3px' }}>4 |</span> أعطال وتشخيص كمبيوتر السيارة
              <span style={{ fontSize: '7.5px', color: '#a1a1aa', marginRight: '4px' }}>| OBD-II Diagnostic Codes</span>
            </div>
            <span style={{ fontSize: '8px', backgroundColor: BRAND.dark, border: `1px solid ${BRAND.grayDark}`, padding: '1px 5px', borderRadius: '4px' }}>
              {obdCodes.length} DTC
            </span>
          </div>

          <div style={{ padding: '5px', flex: 1, display: 'flex', flexDirection: 'column', gap: '3.5px', backgroundColor: BRAND.bgLight }}>
            {obdCodes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '10px 4px', color: BRAND.textMuted, fontSize: '8.5px' }}>
                لا توجد أكواد أعطال مسجلة (OBD Clear - No Faults)
              </div>
            ) : (
              obdCodes.slice(0, 3).map((c, i) => (
                <div key={i} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '3px 6px', 
                  backgroundColor: '#ffffff', 
                  borderRadius: '4px', 
                  border: '1px solid #e4e4e7', 
                  fontSize: '8px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#ffffff', fontSize: '9px', backgroundColor: BRAND.black, padding: '1px 5px', borderRadius: '3px' }}>
                      {c.code}
                    </span>
                    <span style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px', color: BRAND.black }}>
                      {c.nameAr}
                    </span>
                  </div>
                  <span style={{ fontSize: '7px', color: '#71717a', fontFamily: 'monospace', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.nameEn}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Col 2: Section 6 - Terms & Conditions */}
        <div style={{ 
          border: `1px solid ${BRAND.border}`, 
          borderRadius: '8px', 
          overflow: 'hidden', 
          backgroundColor: '#ffffff', 
          display: 'flex', 
          flexDirection: 'column' 
        }}>
          <div style={{ 
            backgroundColor: BRAND.black, 
            color: '#ffffff', 
            padding: '5px 8px', 
            fontSize: '9.5px', 
            fontWeight: 'bold',
            borderBottom: `1px solid ${BRAND.grayDark}`
          }}>
            <span style={{ color: '#a1a1aa', marginRight: '3px' }}>6 |</span> الأحكام والشروط
            <span style={{ fontSize: '7.5px', color: '#a1a1aa', marginRight: '4px' }}>| Terms & Conditions</span>
          </div>
          <div style={{ padding: '5px 6px', fontSize: '7.5px', lineHeight: '1.25', backgroundColor: '#ffffff', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: BRAND.black }}>
            <div><p style={{ margin: '1px 0', fontWeight: 'bold' }}>1. المركز غير مسئول عن أي أعطال تحدث بعد الفحص.</p></div>
            <div><p style={{ margin: '1px 0', fontWeight: 'bold' }}>2. مسؤول عن نتيجة الفحص وقت الفحص فقط.</p></div>
            <div><p style={{ margin: '1px 0', fontWeight: 'bold' }}>3. الفحص غير معتمد لدى إدارة التراخيص.</p></div>
            <div><p style={{ margin: '1px 0', fontWeight: 'bold' }}>4. غير مسئول عن أي أغراض شخصية داخل السيارة.</p></div>
            <div><p style={{ margin: '1px 0', fontWeight: 'bold' }}>5. التقرير يعكس حالة المركبة وقت الفحص فقط.</p></div>
          </div>
        </div>
      </div>

      {/* Section 5: Autel Computer Diagnostic Report Row */}
      {hasAutel && (
        <div style={{ 
          border: `1px solid ${BRAND.border}`, 
          borderRadius: '8px', 
          overflow: 'hidden', 
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '5px 12px',
          background: 'linear-gradient(to left, #f4f4f5, #ffffff)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: BRAND.black, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PhosphorIcon name="cpu" weight="bold" size={15} className="text-white" />
            </div>
            <div>
              <div style={{ fontSize: '9.5px', fontWeight: 'bold', color: BRAND.black }}>
                <span style={{ color: '#71717a', marginRight: '4px' }}>5 |</span>
                تقرير فحص الكمبيوتر الشامل من جهاز Autel MaxiSys
              </div>
              <div style={{ fontSize: '7.5px', color: '#71717a', fontFamily: 'monospace' }} dir="ltr">
                Autel MaxiSys Diagnostic Full Pages Attached In Final PDF
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#f4f4f5', border: '1px solid #e4e4e7', padding: '2px 7px', borderRadius: '5px' }}>
            <PhosphorIcon name="file-pdf" weight="bold" size={13} className="text-zinc-800" />
            <span style={{ fontSize: '8px', fontWeight: 'bold', color: BRAND.black }}>مرفق بالتقرير</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// 6. BOTTOM FOOTER BAR (EXACT REFERENCE)
// ----------------------------------------------------
export const PdfFooterBar = ({ pageNum, totalPages }: { pageNum: number; totalPages: number }) => (
  <div style={{
    backgroundColor: BRAND.black,
    borderRadius: '6px',
    padding: '6px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: `2px solid ${BRAND.grayDark}`,
    color: '#ffffff',
    fontSize: '8px',
    marginTop: '6px',
    flexShrink: 0,
  }}>
    <div style={{ display: 'flex', gap: '16px', color: '#a1a1aa' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        📞 <span dir="ltr" style={{ color: '#ffffff', fontWeight: 'bold' }}>0542206000</span>
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        📍 الشارقة الصناعية 13، طريق المدينة الجامعية
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} dir="ltr">
        
      </span>
    </div>
    <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '8.5px' }}>
      الصفحة {pageNum} من {totalPages}
    </span>
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
    // Page 1 holds: Header + Section 1 + Section 2 + First chunk of items (1 to 4 items) + OBD/Terms.
    // If items > 4: Page 1 holds 2 items + OBD/Terms, subsequent pages hold up to 6 items each.
    const pageChunks: InspectionItem[][] = [];

    if (items.length <= 4) {
      pageChunks.push(items); // Fits all on Page 1
    } else {
      // Page 1 gets first 2 items
      pageChunks.push(items.slice(0, 2));
      let remaining = items.slice(2);
      while (remaining.length > 0) {
        pageChunks.push(remaining.slice(0, 6));
        remaining = remaining.slice(6);
      }
    }

    const totalPages = pageChunks.length;

    return (
      <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {pageChunks.map((chunk, pageIdx) => {
          const pageNum = pageIdx + 1;
          const isFirstPage = pageNum === 1;
          const isSingleItem = chunk.length === 1 && isFirstPage;

          return (
            <div
              key={pageIdx}
              className="pdf-page-render"
              dir="rtl"
              style={{
                width: '794px',
                height: '1123px',
                backgroundColor: '#ffffff',
                padding: '16px 20px',
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
                totalPages={totalPages} 
                formattedDate={formattedDate} 
              />

              {/* First Page: Section 1 (Vehicle Info) & Section 2 (Sections Photos) */}
              {isFirstPage && (
                <>
                  <PdfVehicleInfoSection inspection={inspection} />
                  <PdfVehicleSectionsPhotosRow inspection={inspection} />
                </>
              )}

              {/* Section 3: Inspection Results */}
              <div style={{
                border: `1px solid ${BRAND.border}`,
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#ffffff',
                marginTop: '6px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}>
                <div style={{ 
                  backgroundColor: BRAND.black, 
                  color: '#ffffff', 
                  padding: '5px 12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  flexShrink: 0,
                  borderBottom: `1px solid ${BRAND.grayDark}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PhosphorIcon name="clipboard-text" weight="bold" size={16} className="text-white" />
                    <span style={{ fontWeight: 'bold', fontSize: '11.5px' }}>
                      <span style={{ color: '#a1a1aa', marginRight: '4px' }}>3 |</span> نتائج الفحص <span style={{ fontSize: '9px', color: '#a1a1aa', fontFamily: 'monospace' }}>| Inspection Results ({items.length})</span>
                    </span>
                  </div>
                </div>

                <div style={{
                  padding: '6px 8px',
                  flex: 1,
                  display: isSingleItem ? 'flex' : 'grid',
                  gridTemplateColumns: isSingleItem ? undefined : '1fr 1fr',
                  alignItems: isSingleItem ? 'center' : undefined,
                  justifyContent: isSingleItem ? 'center' : undefined,
                  gap: '6px',
                  overflow: 'hidden',
                  backgroundColor: BRAND.bgLight,
                }}>
                  {chunk.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', width: '100%' }}>
                      <PhosphorIcon name="check-circle" weight="bold" size={36} className="text-zinc-700 mx-auto" />
                      <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: BRAND.black, margin: '4px 0 2px 0' }}>المركبة بحالة ممتازة</h4>
                      <p style={{ fontSize: '9.5px', color: BRAND.textMuted, margin: 0 }}>لم يتم تسجيل أي ملاحظات أو عيوب فنية على المركبة (No Faults Found)</p>
                    </div>
                  ) : isSingleItem ? (
                    <div style={{ width: '100%' }}>
                      <PdfFindingCard item={chunk[0]} isFullWidth={true} />
                    </div>
                  ) : (
                    chunk.map((item, i) => (
                      <PdfFindingCard key={item.id || i} item={item} isFullWidth={false} />
                    ))
                  )}
                </div>
              </div>

              {/* Render OBD & Terms block on First Page if <= 4 items or Last Page */}
              {(isFirstPage || pageNum === totalPages) && (
                <PdfObdAndTermsBlock inspection={inspection} />
              )}

              {/* Bottom Footer Bar */}
              <PdfFooterBar pageNum={pageNum} totalPages={totalPages} />
            </div>
          );
        })}
      </div>
    );
  }
);
PdfMultiPageDocument.displayName = 'PdfMultiPageDocument';

