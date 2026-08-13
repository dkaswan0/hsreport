import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { 
  Car,
  Phone,
  User,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  Gauge,
  CheckCircle2,
  XCircle,
  Mail,
  MapPin,
  X,
  ZoomIn,
  Palette,
  ExternalLink,
  Fuel,
} from "lucide-react";
import { PhosphorIcon } from "@/components/phosphor-icon";
import { cn } from "@/lib/utils";
import { getVehicleColor, calculateInspectionStats, getInspectionTypeLabel } from "@/lib/vehicle-utils";
import logoPath from "@assets/hs-logo.png";
import hsCarBranding from "@assets/hs_car_branding.png";
import { VinPlate } from "@/components/vin-plate";
import type { Inspection, InspectionItem } from "@shared/schema";
import { INSPECTION_CATEGORIES } from "@shared/categories";
import { IntroAnimation } from "@/components/intro-animation";
import { MobileReportView } from "@/components/mobile-report-view";



type InspectionWithItems = Inspection & { items: InspectionItem[] };

// Image Modal for High-Resolution Zoom with ESC key and high z-index
const ImageModal = ({ imageUrl, faultName, onClose }: { imageUrl: string; faultName: string; onClose: () => void }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black/95 z-[999999] flex flex-col items-center justify-center p-2 sm:p-4 select-none animate-in fade-in duration-200"
      onClick={onClose}
      data-testid="image-lightbox-overlay"
      dir="rtl"
    >
      {/* Top Floating Bar with Title & Prominent Close Button */}
      <div 
        className="fixed top-0 left-0 right-0 z-[1000000] px-4 py-3 bg-gradient-to-b from-black/90 via-black/60 to-transparent flex items-center justify-between pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 text-right max-w-[75%]">
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
            <PhosphorIcon name="camera" weight="bold" size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-bold font-arabic text-sm sm:text-base truncate">{faultName}</h3>
            <p className="text-zinc-400 text-xs font-arabic hidden sm:block">معاينة الصورة بالحجم الكامل - اضغط ESC أو في أي مكان للإغلاق</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white flex items-center justify-center border border-zinc-600 transition-all cursor-pointer shadow-xl"
          title="إغلاق (ESC)"
          data-testid="btn-close-lightbox"
        >
          <PhosphorIcon name="x" weight="bold" size={22} />
        </button>
      </div>

      {/* Main Image Container */}
      <div 
        className="relative max-w-full max-h-[85vh] flex items-center justify-center my-auto p-2" 
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={imageUrl} 
          alt={faultName} 
          className="max-w-[95vw] max-h-[82vh] object-contain rounded-xl shadow-2xl border border-zinc-800"
        />
      </div>

      {/* Bottom Hint */}
      <div className="fixed bottom-4 left-0 right-0 text-center pointer-events-none">
        <span className="bg-black/70 text-zinc-300 text-xs px-4 py-1.5 rounded-full font-arabic backdrop-blur-sm border border-white/10">
          اضغط في أي مكان خارج الصورة أو على زر (X) للإغلاق
        </span>
      </div>
    </div>
  );
};

export const formatInspectionDateTime = (dateStr?: string | Date | null) => {
  if (!dateStr) return { date: '-', time: '-', full: '-' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { date: '-', time: '-', full: '-' };
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');
  const timeStr = `${formattedHours}:${minutes} ${ampm}`;

  return {
    date: `${year}/${month}/${day}`,
    time: timeStr,
    full: `${year}/${month}/${day} — ${timeStr}`
  };
};

// Company Header Component - Compact Balanced Luxury Monochrome Brand Header with Logo
const CompanyHeader = ({ inspection }: { inspection?: any }) => {
  const dateTime = useMemo(() => formatInspectionDateTime(inspection?.createdAt), [inspection?.createdAt]);

  return (
    <div className="bg-zinc-950 text-white rounded-2xl overflow-hidden shadow-sm border border-zinc-800" data-testid="company-header">
      <div className="p-2.5 sm:p-3 md:p-3.5 flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-3">
        {/* Right: High-Res Logo & Center Titles */}
        <div className="flex items-center gap-3 text-center md:text-right">
          <div className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 flex items-center justify-center shrink-0">
            <img 
              src={logoPath} 
              alt="High Safety Logo" 
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>
          <div className="text-right">
            <h1 className="text-xs sm:text-sm md:text-base font-black font-arabic text-white tracking-wide leading-tight">
              مركز الأمان العالي الدولي لفحص السيارات
            </h1>
            <p className="text-[9px] sm:text-[10px] font-mono text-zinc-400 font-semibold tracking-wider uppercase mt-0.5" dir="ltr">
              HIGH SAFETY INTERNATIONAL VEHICLE INSPECTION
            </p>
          </div>
        </div>

        {/* Left: Report Meta Info */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 text-xs">
          <div className="bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg text-center shadow-xs">
            <div className="text-[9px] text-zinc-400 font-arabic leading-tight">رقم التقرير | Report No</div>
            <div className="font-mono font-black text-xs sm:text-sm text-white">
              {inspection?.id ? `HS-${inspection.id}` : '-'}
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg text-center shadow-xs">
            <div className="text-[9px] text-zinc-400 font-arabic leading-tight">تاريخ ووقت الفحص | Date & Time</div>
            <div className="font-mono font-bold text-[11px] sm:text-xs text-zinc-200" dir="ltr">
              {dateTime.full}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Bar (Clean - No Email) */}
      <div className="bg-zinc-900/90 border-t border-zinc-800 px-3 sm:px-4 py-1.5 flex flex-wrap items-center justify-center md:justify-between gap-2 text-[10px] sm:text-[11px] text-zinc-300">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5">
            <PhosphorIcon name="phone" weight="bold" size={12} className="text-zinc-400" />
            <span className="font-mono font-bold text-white text-xs" dir="ltr">0542206000</span>
          </div>
          <div className="flex items-center gap-1.5">
            <PhosphorIcon name="map-pin" weight="bold" size={12} className="text-zinc-400" />
            <span className="font-arabic">الشارقة الصناعية 13، طريق المدينة الجامعية</span>
          </div>
        </div>
        <div className="font-mono text-zinc-400 text-[9px] sm:text-[10px] hidden sm:block" dir="ltr">
          SHARJAH, UNITED ARAB EMIRATES
        </div>
      </div>
    </div>
  );
};


const VehicleInfoCard = ({ inspection }: { inspection: any }) => {
  const vehicleColor = useMemo(() => getVehicleColor(inspection.color), [inspection.color]);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-zinc-200 overflow-hidden" data-testid="vehicle-info-card">
      {/* Section Header */}
      <div className="bg-zinc-950 text-white px-3.5 py-2.5 sm:px-4 sm:py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800">
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner">
            <PhosphorIcon name="car-profile" weight="bold" size={18} className="text-white sm:text-[22px]" />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
            <span className="font-mono text-zinc-400 font-black text-base sm:text-lg md:text-xl">1 |</span>
            <span className="text-white font-black text-sm sm:text-base md:text-xl font-arabic">معلومات السيارة</span>
            <span className="text-zinc-400 text-[11px] sm:text-xs md:text-sm font-mono font-semibold">| Vehicle Information</span>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left Side (5 Cols): 2-Column Key-Value Specs Table */}
        <div className="lg:col-span-5 flex flex-col justify-between divide-y divide-zinc-200 border border-zinc-200 rounded-2xl p-2 bg-zinc-50/50">
          <div className="py-1.5 px-2 flex items-center justify-between text-right gap-2">
            <span className="font-bold text-zinc-950 text-xs sm:text-sm font-arabic truncate max-w-[50%]">{inspection.make || '-'}</span>
            <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-500 shrink-0">
              <span className="text-[10px] sm:text-xs text-zinc-400 font-mono hidden sm:inline">Manufacturer</span>
              <span className="text-xs font-bold text-zinc-700 font-arabic">الشركة المصنعة</span>
              <PhosphorIcon name="buildings" weight="bold" size={16} className="text-zinc-600" />
            </div>
          </div>

          <div className="py-1.5 px-2 flex items-center justify-between text-right gap-2">
            <span className="font-bold text-zinc-950 text-xs sm:text-sm font-arabic truncate max-w-[50%]">{inspection.model || '-'}</span>
            <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-500 shrink-0">
              <span className="text-[10px] sm:text-xs text-zinc-400 font-mono hidden sm:inline">Model</span>
              <span className="text-xs font-bold text-zinc-700 font-arabic">الموديل</span>
              <PhosphorIcon name="car" weight="bold" size={16} className="text-zinc-600" />
            </div>
          </div>

          <div className="py-1.5 px-2 flex items-center justify-between text-right gap-2">
            <span className="font-bold text-zinc-950 text-xs sm:text-sm font-mono truncate max-w-[50%]">{inspection.year || '-'}</span>
            <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-500 shrink-0">
              <span className="text-[10px] sm:text-xs text-zinc-400 font-mono hidden sm:inline">Year</span>
              <span className="text-xs font-bold text-zinc-700 font-arabic">سنة الصنع</span>
              <PhosphorIcon name="calendar-blank" weight="bold" size={16} className="text-zinc-600" />
            </div>
          </div>

          <div className="py-1.5 px-2 flex items-center justify-between text-right gap-2">
            <div className="flex items-center gap-2 truncate max-w-[50%]">
              <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-zinc-300 shadow-sm shrink-0" style={{ backgroundColor: vehicleColor.hex }} />
              <span className="font-bold text-zinc-950 text-xs sm:text-sm font-arabic truncate">{vehicleColor.ar}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-500 shrink-0">
              <span className="text-[10px] sm:text-xs text-zinc-400 font-mono hidden sm:inline">Color</span>
              <span className="text-xs font-bold text-zinc-700 font-arabic">اللون</span>
              <PhosphorIcon name="paint-brush" weight="bold" size={16} className="text-zinc-600" />
            </div>
          </div>

          <div className="py-1.5 px-2 flex items-center justify-between text-right gap-2">
            <span className="font-mono font-bold text-zinc-950 text-xs tracking-wider truncate max-w-[50%]" dir="ltr">{inspection.vin || '-'}</span>
            <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-500 shrink-0">
              <span className="text-[10px] sm:text-xs text-zinc-400 font-mono hidden sm:inline">VIN</span>
              <span className="text-xs font-bold text-zinc-700 font-arabic">رقم الهيكل</span>
              <PhosphorIcon name="barcode" weight="bold" size={16} className="text-zinc-600" />
            </div>
          </div>

          <div className="py-1.5 px-2 flex items-center justify-between text-right gap-2">
            <span className="font-mono font-bold text-zinc-950 text-xs sm:text-sm truncate max-w-[50%]">{inspection.odometer?.toLocaleString() || '0'} كم</span>
            <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-500 shrink-0">
              <span className="text-[10px] sm:text-xs text-zinc-400 font-mono hidden sm:inline">Odometer</span>
              <span className="text-xs font-bold text-zinc-700 font-arabic">قراءة العداد</span>
              <PhosphorIcon name="gauge" weight="bold" size={16} className="text-zinc-600" />
            </div>
          </div>

          <div className="py-1.5 px-2 flex items-center justify-between text-right gap-2">
            <span className="font-bold text-zinc-900 bg-zinc-200/80 px-2 py-0.5 rounded text-xs sm:text-sm font-arabic truncate max-w-[50%]">فحص شامل / Full</span>
            <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-500 shrink-0">
              <span className="text-[10px] sm:text-xs text-zinc-400 font-mono hidden sm:inline">Type</span>
              <span className="text-xs font-bold text-zinc-700 font-arabic">نوع الفحص</span>
              <PhosphorIcon name="shield-check" weight="bold" size={16} className="text-zinc-600" />
            </div>
          </div>
        </div>

        {/* Right Side (7 Cols): Car 3D Photo + VIN Card & Odometer Card */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-3 sm:gap-4">
          {/* Main Car Photo */}
          <div className="w-full h-40 sm:h-48 md:h-52 lg:h-56 rounded-2xl overflow-hidden bg-zinc-100/80 border border-zinc-200 flex items-center justify-center p-3 sm:p-4 relative group shadow-xs">
            {inspection.mainCarPhoto ? (
              <img 
                src={inspection.mainCarPhoto} 
                alt="Vehicle Main" 
                className="w-full h-full max-h-full max-w-full object-contain drop-shadow-md" 
              />
            ) : (
              <img 
                src={hsCarBranding} 
                alt="High Safety Vehicle" 
                className="w-full h-full max-h-full max-w-full object-contain opacity-60" 
              />
            )}
          </div>

          {/* Bottom 2 Sub-Cards: VIN Photo & Odometer Reading */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-2.5 sm:p-3 text-center flex flex-col justify-between">
              <div className="text-xs font-bold text-zinc-800 font-arabic mb-1">رقم الهيكل (VIN)</div>
              <div className="h-16 sm:h-20 rounded-lg overflow-hidden bg-white border border-zinc-200 flex items-center justify-center p-2 shadow-inner">
                {inspection.vinPhoto ? (
                  <img src={inspection.vinPhoto} alt="VIN Plate" className="max-h-full max-w-full object-contain rounded-lg" />
                ) : (
                  <div className="font-mono font-black text-xs sm:text-sm md:text-base text-zinc-800 tracking-wider break-all" dir="ltr">{inspection.vin}</div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-2.5 sm:p-3 text-center flex flex-col justify-between">
              <div className="text-xs font-bold text-zinc-800 font-arabic mb-1">قراءة العداد (Odometer)</div>
              <div className="h-16 sm:h-20 rounded-lg overflow-hidden bg-white border border-zinc-200 flex flex-col items-center justify-center p-2 shadow-inner">
                {inspection.odometerPhoto ? (
                  <img src={inspection.odometerPhoto} alt="Odometer Photo" className="max-h-full max-w-full object-contain rounded-lg" />
                ) : (
                  <>
                    <PhosphorIcon name="gauge" weight="bold" size={32} className="text-zinc-600 mb-1" />
                    <div className="font-mono font-black text-zinc-950 text-base md:text-xl">{inspection.odometer?.toLocaleString() || '0'} KM</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Section 2: Car Section Photos Component - Intelligent Visual Layout
const CarSectionPhotosGallery = ({ inspection }: { inspection: any }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; labelAr: string; labelEn: string } | null>(null);

  const sections = [
    { key: 'frontSide', labelAr: 'الواجهة الأمامية', labelEn: 'Front Side', photo: inspection.frontSidePhoto || inspection.frontLeftDoorPhoto },
    { key: 'rearSide', labelAr: 'الواجهة الخلفية', labelEn: 'Rear Side', photo: inspection.rearSidePhoto || inspection.trunkPhoto },
    { key: 'leftSide', labelAr: 'الجانب الأيسر', labelEn: 'Left Side', photo: inspection.rearLeftDoorPhoto || inspection.frontLeftDoorPhoto },
    { key: 'rightSide', labelAr: 'الجانب الأيمن', labelEn: 'Right Side', photo: inspection.frontRightDoorPhoto || inspection.rearRightDoorPhoto },
    { key: 'engineBay', labelAr: 'حجرة المحرك', labelEn: 'Engine Bay', photo: inspection.hoodPhoto },
    { key: 'interior', labelAr: 'المقصورة الداخلية', labelEn: 'Interior', photo: inspection.interiorPhoto || inspection.frontLeftDoorInteriorPhoto },
    { key: 'trunk', labelAr: 'صندوق الأمتعة', labelEn: 'Trunk', photo: inspection.trunkPhoto },
  ].filter(s => s.photo);

  const displaySections = sections.length > 0 ? sections : [
    { key: 'frontSide', labelAr: 'الواجهة الأمامية', labelEn: 'Front Side', photo: null },
    { key: 'rearSide', labelAr: 'الواجهة الخلفية', labelEn: 'Rear Side', photo: null },
    { key: 'leftSide', labelAr: 'الجانب الأيسر', labelEn: 'Left Side', photo: null },
    { key: 'rightSide', labelAr: 'الجانب الأيمن', labelEn: 'Right Side', photo: null },
    { key: 'engineBay', labelAr: 'حجرة المحرك', labelEn: 'Engine Bay', photo: null },
    { key: 'interior', labelAr: 'المقصورة الداخلية', labelEn: 'Interior', photo: null },
    { key: 'trunk', labelAr: 'صندوق الأمتعة', labelEn: 'Trunk', photo: null },
  ];

  const count = displaySections.length;

  return (
    <>
      {/* Section 2: Car Section Photos Gallery */}
      <div className="bg-white rounded-2xl shadow-xs border border-zinc-200 overflow-hidden" data-testid="car-section-photos-gallery">
        <div className="bg-zinc-950 text-white px-3.5 py-2.5 sm:px-4 sm:py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800">
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner">
              <PhosphorIcon name="camera" weight="bold" size={18} className="text-white sm:text-[22px]" />
            </div>
            <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
              <span className="font-mono text-zinc-400 font-black text-base sm:text-lg md:text-xl">2 |</span>
              <span className="text-white font-black text-sm sm:text-base md:text-xl font-arabic">صور أقسام السيارة</span>
              <span className="text-zinc-400 text-[11px] sm:text-xs md:text-sm font-mono font-semibold">| Vehicle Sections Photos ({count})</span>
            </div>
          </div>
        </div>

        {/* Intelligent Visual Grid Layout based on actual photo count */}
        <div className="p-2.5 sm:p-3.5">
          <div className={
            count === 1 
              ? "max-w-xl mx-auto" 
              : count === 2 
                ? "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-4xl mx-auto" 
                : count === 3 
                  ? "grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4" 
                  : count === 4 
                    ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4" 
                    : count === 5 
                      ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4" 
                      : count === 6 
                        ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4" 
                        : count === 7 
                          ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4" 
                          : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
          }>
            {displaySections.map((sec, idx) => {
              const spanClass = 
                count === 5 
                  ? (idx < 3 ? "md:col-span-2" : "md:col-span-3") 
                  : count === 7 
                    ? (idx < 4 ? "md:col-span-3" : "md:col-span-4") 
                    : "";

              return (
                <button
                  key={sec.key || idx}
                  type="button"
                  onClick={() => sec.photo && setSelectedPhoto({ url: sec.photo, labelAr: sec.labelAr, labelEn: sec.labelEn })}
                  disabled={!sec.photo}
                  className={`group flex flex-col rounded-2xl border border-zinc-200 overflow-hidden bg-white hover:border-zinc-400 hover:shadow-md transition-all text-center cursor-pointer disabled:cursor-default ${spanClass}`}
                >
                  <div className="w-full aspect-[4/3] bg-zinc-100/70 flex items-center justify-center p-2 relative overflow-hidden">
                    {sec.photo ? (
                      <img 
                        src={sec.photo} 
                        alt={sec.labelAr} 
                        className="max-w-full max-h-full w-auto h-auto object-contain group-hover:scale-105 transition-transform duration-300" 
                      />
                    ) : (
                      <PhosphorIcon name="camera" weight="bold" size={28} className="text-zinc-300" />
                    )}
                    {sec.photo && (
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <PhosphorIcon name="magnifying-glass-plus" weight="bold" size={24} className="text-white drop-shadow-md" />
                      </div>
                    )}
                  </div>
                  <div className="p-1.5 sm:p-2 border-t border-zinc-100 bg-white flex items-center justify-between gap-1.5">
                    <div className="text-xs md:text-sm font-bold text-zinc-950 font-arabic truncate">{sec.labelAr}</div>
                    <div className="text-[11px] text-zinc-400 font-mono truncate" dir="ltr">{sec.labelEn}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999999] flex items-center justify-center p-3 sm:p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-3xl w-full bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-700" onClick={e => e.stopPropagation()}>
            <div className="bg-zinc-950 text-white px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between border-b border-zinc-800">
              <div>
                <h4 className="font-bold text-sm sm:text-base font-arabic text-white">{selectedPhoto.labelAr}</h4>
                <p className="text-xs text-zinc-400 font-mono" dir="ltr">{selectedPhoto.labelEn}</p>
              </div>
              <button onClick={() => setSelectedPhoto(null)} className="text-zinc-400 hover:text-white p-1">
                <PhosphorIcon name="x" weight="bold" size={22} />
              </button>
            </div>
            <div className="p-3 sm:p-4 bg-black flex items-center justify-center max-h-[75vh]">
              <img src={selectedPhoto.url} alt={selectedPhoto.labelAr} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Helper to group findings by category
interface CategoryGroup {
  id: string;
  labelAr: string;
  labelEn: string;
  iconName: string;
  items: any[];
}

function groupInspectionItemsByCategory(items: any[]): CategoryGroup[] {
  const groupsMap = new Map<string, CategoryGroup>();

  const getGroupMeta = (category: string) => {
    const c = (category || '').toLowerCase();
    if (c.includes('door') || c.includes('hood') || c.includes('trunk') || c.includes('fender') || c.includes('bumper') || c.includes('roof') || c.includes('pillar') || c.includes('chest') || c.includes('body') || c.includes('هيكل') || c.includes('صدام') || c.includes('باب') || c.includes('رفرف') || c.includes('كبوت') || c.includes('دعامية')) {
      return { id: 'body', labelAr: 'الهيكل الخارجي', labelEn: 'Body & Exterior', iconName: 'car-profile' };
    }
    if (c.includes('brake') || c.includes('suspension') || c.includes('steering') || c.includes('engine') || c.includes('mechanic') || c.includes('fuel') || c.includes('exhaust') || c.includes('cooling') || c.includes('محرك') || c.includes('فرامل') || c.includes('ميكانيك') || c.includes('سير') || c.includes('بلوف') || c.includes('زيت')) {
      return { id: 'mechanic', labelAr: 'الميكانيكا', labelEn: 'Mechanics & Powertrain', iconName: 'gear-six' };
    }
    if (c.includes('tire') || c.includes('wheel') || c.includes('rim') || c.includes('إطار') || c.includes('جنط') || c.includes('كفر') || c.includes('عجلات')) {
      return { id: 'tires', labelAr: 'الإطارات والعجلات', labelEn: 'Tires & Wheels', iconName: 'circle-dashed' };
    }
    if (c.includes('electric') || c.includes('battery') || c.includes('light') || c.includes('sensor') || c.includes('كهرباء') || c.includes('بطارية') || c.includes('إضاءة') || c.includes('حساس')) {
      return { id: 'electric', labelAr: 'الكهرباء والإلكترونيات', labelEn: 'Electrical & Electronics', iconName: 'lightning' };
    }
    if (c.includes('transmission') || c.includes('gear') || c.includes('قير')) {
      return { id: 'transmission', labelAr: 'ناقل الحركة', labelEn: 'Transmission', iconName: 'arrows-left-right' };
    }
    if (c.includes('interior') || c.includes('window') || c.includes('seat') || c.includes('mirror') || c.includes('داخلي') || c.includes('فرش') || c.includes('زجاج') || c.includes('سلامة') || c.includes('مقصورة')) {
      return { id: 'interior', labelAr: 'المقصورة والداخلية', labelEn: 'Interior & Cabin', iconName: 'armchair' };
    }
    const found = INSPECTION_CATEGORIES.find(ic => ic.id === category);
    if (found) {
      if (found.section === 'body') return { id: 'body', labelAr: 'الهيكل الخارجي', labelEn: 'Body & Exterior', iconName: 'car-profile' };
      if (found.section === 'mechanic') return { id: 'mechanic', labelAr: 'الميكانيكا', labelEn: 'Mechanics & Powertrain', iconName: 'gear-six' };
      if (found.section === 'electric') return { id: 'electric', labelAr: 'الكهرباء والإلكترونيات', labelEn: 'Electrical & Electronics', iconName: 'lightning' };
      if (found.section === 'transmission') return { id: 'transmission', labelAr: 'ناقل الحركة', labelEn: 'Transmission', iconName: 'arrows-left-right' };
      if (found.section === 'interior') return { id: 'interior', labelAr: 'المقصورة والداخلية', labelEn: 'Interior & Cabin', iconName: 'armchair' };
    }
    return { id: 'general', labelAr: 'الفحص العام', labelEn: 'General Inspection', iconName: 'clipboard-text' };
  };

  items.forEach((item) => {
    const meta = getGroupMeta(item.category);
    if (!groupsMap.has(meta.id)) {
      groupsMap.set(meta.id, {
        id: meta.id,
        labelAr: meta.labelAr,
        labelEn: meta.labelEn,
        iconName: meta.iconName,
        items: []
      });
    }
    groupsMap.get(meta.id)!.items.push(item);
  });

  return Array.from(groupsMap.values());
}

// Section 3: Inspection Results Section - Categorized Finding Cards matching Reference
const InspectionResults = ({ 
  inspection, 
  onImageClick 
}: { 
  inspection: any; 
  onImageClick?: (url: string, name: string) => void; 
}) => {
  const items = inspection.items || [];
  const categoryGroups = useMemo(() => groupInspectionItemsByCategory(items), [items]);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-zinc-200 overflow-hidden" data-testid="inspection-results-section">
      {/* Section 3 Header */}
      <div className="bg-zinc-950 text-white px-3.5 py-2.5 sm:px-4 sm:py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800">
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner">
            <PhosphorIcon name="clipboard-text" weight="bold" size={18} className="text-white sm:text-[22px]" />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
            <span className="font-mono text-zinc-400 font-black text-base sm:text-lg md:text-xl">3 |</span>
            <span className="text-white font-black text-sm sm:text-base md:text-xl font-arabic">الأعطال المسجلة</span>
            <span className="text-zinc-400 text-[11px] sm:text-xs md:text-sm font-mono font-semibold">| Inspection Results ({items.length})</span>
          </div>
        </div>
        <div className="text-xs font-bold text-zinc-400 font-arabic">
          {categoryGroups.length} {categoryGroups.length === 1 ? 'قسم' : 'أقسام مفحوصة'}
        </div>
      </div>

      <div className="p-2.5 sm:p-3.5 space-y-3">
        {items.length === 0 ? (
          <div className="p-8 sm:p-12 text-center bg-zinc-50 rounded-2xl border border-zinc-200">
            <PhosphorIcon name="check-circle" weight="bold" size={48} className="text-zinc-700 mx-auto mb-3" />
            <h4 className="text-lg sm:text-xl font-bold text-zinc-900 font-arabic mb-1">المركبة بحالة ممتازة</h4>
            <p className="text-zinc-500 text-xs sm:text-sm font-arabic">لم يتم تسجيل أي ملاحظات أو عيوب فنية على المركبة</p>
          </div>
        ) : (
          categoryGroups.map((group) => (
            <div 
              key={group.id} 
              className="rounded-2xl border border-zinc-200 overflow-hidden shadow-xs bg-white"
            >
              {/* Sleek Metallic Category Header Banner */}
              <div className="bg-gradient-to-l from-zinc-800 via-zinc-700 to-zinc-600 text-white px-3.5 py-2 flex items-center justify-between shadow-xs border-b border-zinc-700">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-zinc-900 border border-zinc-600 flex items-center justify-center shadow-inner shrink-0">
                    <PhosphorIcon name={group.iconName as any} weight="bold" size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base md:text-lg text-white font-arabic leading-tight">{group.labelAr}</h3>
                    <span className="text-[10px] sm:text-xs text-zinc-300 font-mono" dir="ltr">{group.labelEn}</span>
                  </div>
                </div>
                <div className="bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-bold text-white">
                  {group.items.length} {group.items.length === 1 ? 'ملاحظة' : 'ملاحظات'}
                </div>
              </div>

              {/* Finding Cards List inside Category */}
              <div className="divide-y divide-zinc-200">
                {group.items.map((item: any, idx: number) => {
                  const titleAr = item.faultName?.split(' - ')[0] || item.faultName || 'ملاحظة فنية';

                  return (
                    <div
                      key={item.id || idx}
                      className="p-2.5 sm:p-3 bg-white hover:bg-zinc-50/60 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 sm:gap-4 text-right">
                        {/* Left: Defect Photo */}
                        <div className="w-full sm:w-40 md:w-48 h-32 sm:h-24 md:h-28 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0 relative group">
                          {item.imageUrl ? (
                            <button
                              type="button"
                              onClick={() => onImageClick?.(item.imageUrl!, titleAr)}
                              className="w-full h-full block cursor-pointer"
                            >
                              <img 
                                src={item.imageUrl} 
                                alt={titleAr} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                              />
                              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <PhosphorIcon name="magnifying-glass-plus" weight="bold" size={24} className="text-white drop-shadow-md" />
                              </div>
                            </button>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-1 bg-zinc-50">
                              <PhosphorIcon name="camera-slash" weight="bold" size={24} />
                              <span className="text-[10px] font-arabic">لا توجد صورة</span>
                            </div>
                          )}
                        </div>

                        {/* Right: Defect Information with Right Vertical Accent Line */}
                        <div className="flex-1 min-w-0 pr-3 sm:pr-4 border-r-4 border-black py-0.5 space-y-1.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <h4 className="font-bold text-zinc-950 font-arabic text-sm sm:text-base md:text-lg leading-snug">
                              {titleAr}
                            </h4>
                            {item.severity && (
                              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md border shrink-0 bg-zinc-100 text-zinc-900 border-zinc-300">
                                {item.severity}
                              </span>
                            )}
                          </div>

                          {item.description && (
                            <p className="text-xs sm:text-sm text-zinc-800 font-arabic leading-relaxed">
                              {item.description}
                            </p>
                          )}

                          {item.descriptionEn && (
                            <p className="text-[11px] sm:text-xs text-zinc-500 font-mono mt-0.5" dir="ltr">
                              {item.descriptionEn}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default function PublicReport() {
  const [, paramsToken] = useRoute("/view/:token");
  const [, paramsShare] = useRoute("/reports/share/:token");
  const [, paramsDirect] = useRoute("/report/:id");
  const token = paramsToken?.token || paramsShare?.token || paramsDirect?.id;
  const isDirectId = !!paramsDirect?.id && !paramsToken?.token && !paramsShare?.token;

  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
  const [showIntro, setShowIntro] = useState(() => {
    const hasSeenIntro = sessionStorage.getItem(`hs_intro_${token}`);
    return !hasSeenIntro;
  });

  const handleIntroComplete = () => {
    setShowIntro(false);
    if (token) {
      sessionStorage.setItem(`hs_intro_${token}`, 'true');
    }
  };

  const { data: inspection, isLoading, error } = useQuery<InspectionWithItems>({
    queryKey: [isDirectId ? `/api/inspections/${token}` : `/api/public/report/${token}`],
    queryFn: async () => {
      const endpoint = isDirectId ? `/api/inspections/${token}` : `/api/public/report/${token}`
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Report not found');
      return res.json();
    },
    enabled: !!token
  });

  if (isLoading) {
    return (
      <>
        {showIntro && <IntroAnimation onComplete={handleIntroComplete} duration={4500} />}
      </>
    );
  }

  if (error || !inspection) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
        <div className="text-center bg-white/10 backdrop-blur-lg rounded-3xl p-8 sm:p-12 max-w-md w-full">
          <XCircle className="w-16 h-16 sm:w-20 sm:h-20 text-zinc-400 mx-auto mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 font-arabic">التقرير غير موجود</h1>
          <p className="text-zinc-400 text-sm font-arabic">الرابط غير صحيح أو انتهت صلاحيته</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 overflow-x-hidden" dir="rtl">
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} duration={4500} />}
      
      {selectedImage && (
        <ImageModal 
          imageUrl={selectedImage.url} 
          faultName={selectedImage.name} 
          onClose={() => setSelectedImage(null)} 
        />
      )}

      {/* Mobile-Specific Layout */}
      <div className="block md:hidden max-w-lg mx-auto p-3 sm:p-4">
        <MobileReportView
          inspection={inspection}
          onImageClick={(url, name) => setSelectedImage({ url, name })}
          isPublicView={true}
          token={token}
        />
      </div>

      {/* Tablet & Desktop Layout (768px+) */}
      <div id="report-content" className="hidden md:block max-w-5xl mx-auto py-3 sm:py-4 px-3 sm:px-4 space-y-3 sm:space-y-3.5 print:py-0">
        {/* Company Header with Logo */}
        <CompanyHeader inspection={inspection} />

        {/* Section 1: Vehicle Info Card */}
        <VehicleInfoCard inspection={inspection} />

        {/* Section 2: Car Section Photos Gallery */}
        <CarSectionPhotosGallery inspection={inspection} />

        {/* Section 3: Inspection Results */}
        <InspectionResults 
          inspection={inspection} 
          onImageClick={(url, name) => setSelectedImage({ url, name })}
        />

        {/* Dynamic OBD Codes Section - Section 4 OBD Diagnostic Report */}
        {(() => {
          const obdCodes = (inspection.obdCodes as Array<{code: string; nameEn: string; nameAr: string; diagnosis?: string; causes?: string; solutions?: string}> | null) || [];

          if (obdCodes.length === 0) return null;

          return (
            <div className="bg-white rounded-2xl overflow-hidden shadow-xs border border-zinc-200" data-testid="obd-diagnostic-section">
              <div className="bg-zinc-950 text-white px-3.5 py-2.5 sm:px-4 sm:py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800">
                <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner">
                    <PhosphorIcon name="cpu" weight="bold" size={18} className="text-white" />
                  </div>
                  <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
                    <span className="font-mono text-zinc-400 font-black text-base sm:text-lg md:text-xl">4 |</span>
                    <span className="text-white font-black text-sm sm:text-base md:text-xl font-arabic">أعطال وتشخيص كمبيوتر السيارة (OBD-II)</span>
                    <span className="text-zinc-400 text-[11px] sm:text-xs md:text-sm font-mono font-semibold">| Diagnostic Trouble Codes</span>
                  </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1 text-xs font-mono text-white font-bold">
                  {obdCodes.length} DTC
                </div>
              </div>

              <div className="p-2.5 sm:p-3.5 space-y-2.5">
                {obdCodes.map((obd, idx) => (
                  <div key={idx} className="p-2.5 sm:p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-right space-y-1.5">
                    <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                      <div className="shrink-0 text-center">
                        <div className="font-mono font-black text-white text-base sm:text-lg px-2.5 py-1 rounded-lg bg-zinc-950 shadow-xs min-w-[75px] text-center">{obd.code}</div>
                      </div>
                      <div className="flex-1 min-w-0 pr-1 sm:pr-2">
                        <div className="text-sm sm:text-base font-black text-zinc-950 font-arabic leading-snug break-words whitespace-normal">{obd.nameAr}</div>
                        <div className="text-xs text-zinc-500 font-mono mt-0.5 break-words whitespace-normal" dir="ltr">{obd.nameEn}</div>
                      </div>
                    </div>

                    {obd.diagnosis && (
                      <div className="bg-zinc-100 rounded-xl p-2.5 text-xs text-zinc-800 leading-relaxed font-arabic border border-zinc-200 break-words whitespace-normal">
                        <span className="font-bold text-zinc-950 ml-1">التشخيص:</span>
                        {obd.diagnosis}
                      </div>
                    )}
                    {obd.causes && (
                      <div className="bg-zinc-100 rounded-xl p-2.5 text-xs text-zinc-800 leading-relaxed font-arabic border border-zinc-200 break-words whitespace-normal">
                        <span className="font-bold text-zinc-950 ml-1">الأسباب:</span>
                        {obd.causes}
                      </div>
                    )}
                    {obd.solutions && (
                      <div className="bg-zinc-100 rounded-xl p-2.5 text-xs text-zinc-800 leading-relaxed font-arabic border border-zinc-200 break-words whitespace-normal">
                        <span className="font-bold text-zinc-950 ml-1">خطوات الإصلاح:</span>
                        {obd.solutions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Section 6: Autel Computer Report Section */}
        {inspection.autelReportPdf && (
          <div className="bg-white rounded-2xl overflow-hidden shadow-xs border border-zinc-200" data-testid="autel-report-section">
            <div className="bg-zinc-950 text-white px-3.5 py-2.5 sm:px-4 sm:py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800">
              <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner">
                  <PhosphorIcon name="cpu" weight="bold" size={18} className="text-white sm:text-[22px]" />
                </div>
                <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
                  <span className="font-mono text-zinc-400 font-black text-base sm:text-lg md:text-xl">6 |</span>
                  <span className="text-white font-black text-sm sm:text-base md:text-xl font-arabic">تقرير فحص الكمبيوتر</span>
                  <span className="text-zinc-400 text-[11px] sm:text-xs md:text-sm font-mono font-semibold">| Autel Computer Diagnostic Report</span>
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-zinc-50/60">
              <div className="flex items-center gap-3 sm:gap-4 text-right">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shadow-sm shrink-0">
                  <PhosphorIcon name="file-pdf" weight="bold" size={30} className="text-zinc-800 sm:text-[36px]" />
                </div>
                <div>
                  <h4 className="font-black text-zinc-950 font-arabic text-sm sm:text-base">تقرير فحص الكمبيوتر الشامل من جهاز Autel</h4>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5" dir="ltr">Autel MaxiSys Diagnostic Report — Attached in PDF</p>
                </div>
              </div>
              <a
                href={`/api/autel/report/public/${token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-950 hover:bg-black text-white rounded-xl font-bold font-arabic text-xs transition-all shadow-xs"
                data-testid="btn-open-autel-pdf"
              >
                <PhosphorIcon name="arrow-square-out" weight="bold" size={20} className="text-white" />
                <span>فتح تقرير Autel المرفق</span>
              </a>
            </div>
          </div>
        )}

        {/* Section 7: Terms and Conditions */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-xs border border-zinc-200" data-testid="terms-section">
          <div className="bg-zinc-950 text-white px-3.5 py-2.5 sm:px-4 sm:py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800">
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner">
                <PhosphorIcon name="scales" weight="bold" size={18} className="text-white sm:text-[22px]" />
              </div>
              <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
                <span className="font-mono text-zinc-400 font-black text-base sm:text-lg md:text-xl">{inspection.autelReportPdf ? "7 |" : "6 |"}</span>
                <span className="text-white font-black text-sm sm:text-base md:text-xl font-arabic">الأحكام والشروط</span>
                <span className="text-zinc-400 text-[11px] sm:text-xs md:text-sm font-mono font-semibold">| Terms & Conditions</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 sm:p-3.5 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-200 flex items-start gap-2.5 text-right">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-zinc-950 font-arabic text-xs sm:text-sm">1. المركز غير مسئول عن أي أعطال تحدث أثناء الفحص أو بعده.</p>
                <p className="text-[11px] sm:text-xs text-zinc-500 font-mono mt-1" dir="ltr">The center is not responsible for any malfunctions occurring during or after inspection.</p>
              </div>
              <div className="w-7 h-7 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0 shadow-xs">
                <PhosphorIcon name="shield-warning" weight="bold" size={18} className="text-zinc-700" />
              </div>
            </div>

            <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-200 flex items-start gap-2.5 text-right">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-zinc-950 font-arabic text-xs sm:text-sm">2. المركز مسئول عن نتيجة الفحص وقت الفحص فقط وغير مسئول بعد خروج المركبة من الفحص.</p>
                <p className="text-[11px] sm:text-xs text-zinc-500 font-mono mt-1" dir="ltr">The center is only responsible for inspection results at the time of inspection.</p>
              </div>
              <div className="w-7 h-7 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0 shadow-xs">
                <PhosphorIcon name="clock" weight="bold" size={18} className="text-zinc-700" />
              </div>
            </div>

            <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-200 flex items-start gap-2.5 text-right">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-zinc-950 font-arabic text-xs sm:text-sm">3. هذا الفحص غير معتمد لدى إدارة التراخيص.</p>
                <p className="text-[11px] sm:text-xs text-zinc-500 font-mono mt-1" dir="ltr">This inspection is not approved by the Licensing Authority.</p>
              </div>
              <div className="w-7 h-7 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0 shadow-xs">
                <PhosphorIcon name="file-text" weight="bold" size={18} className="text-zinc-700" />
              </div>
            </div>

            <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-200 flex items-start gap-2.5 text-right">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-zinc-950 font-arabic text-xs sm:text-sm">4. المركز غير مسئول عن أي أغراض شخصية داخل السيارة أثناء الفحص.</p>
                <p className="text-[11px] sm:text-xs text-zinc-500 font-mono mt-1" dir="ltr">The center is not responsible for any personal belongings inside the vehicle.</p>
              </div>
              <div className="w-7 h-7 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0 shadow-xs">
                <PhosphorIcon name="backpack" weight="bold" size={18} className="text-zinc-700" />
              </div>
            </div>

            <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-200 flex items-start gap-2.5 text-right md:col-span-2">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-zinc-950 font-arabic text-xs sm:text-sm">5. يعتبر هذا التقرير لحالة المركبة حسب قراءة الأجهزة في وقت الفحص.</p>
                <p className="text-[11px] sm:text-xs text-zinc-500 font-mono mt-1" dir="ltr">This report reflects the vehicle condition based on device readings at the time of inspection.</p>
              </div>
              <div className="w-7 h-7 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0 shadow-xs">
                <PhosphorIcon name="check-circle" weight="bold" size={18} className="text-zinc-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Banner */}
        <div className="bg-zinc-950 text-white rounded-2xl p-3.5 sm:p-4 border-t-2 border-zinc-700 shadow-md text-center space-y-2.5">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-zinc-300 font-arabic">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-zinc-900 rounded-lg px-3 py-1.5 border border-zinc-800">
              <PhosphorIcon name="phone" weight="bold" size={16} className="text-zinc-400" />
              <span className="font-mono font-bold" dir="ltr">0542206000</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 bg-zinc-900 rounded-lg px-3 py-1.5 border border-zinc-800">
              <PhosphorIcon name="map-pin" weight="bold" size={16} className="text-zinc-400" />
              <span>الشارقة الصناعية 13، طريق المدينة الجامعية</span>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-3 sm:pt-4 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
            <p className="font-arabic">جميع الحقوق محفوظة © {new Date().getFullYear()} مركز الأمان العالي الدولي للفحص الفني</p>
            <p className="font-mono" dir="ltr">HIGH SAFETY INTERNATIONAL CENTER L.L.C.</p>
          </div>
        </div>
      </div>


    </div>
  );
}
