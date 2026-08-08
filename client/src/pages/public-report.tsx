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
import hsBannerPath from "@assets/hs-banner.jpeg";
import hsCarBranding from "@assets/hs_car_branding.png";
import { VinPlate } from "@/components/vin-plate";
import { CarBlueprintPinpoint } from "@/components/car-blueprint-pinpoint";
import type { Inspection, InspectionItem } from "@shared/schema";
import { INSPECTION_CATEGORIES } from "@shared/categories";
import { IntroAnimation } from "@/components/intro-animation";

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
          <div className="w-8 h-8 rounded-full bg-[#C5852C]/20 border border-[#C5852C]/40 flex items-center justify-center shrink-0">
            <PhosphorIcon name="camera" weight="duotone" size={18} className="text-[#C5852C]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-bold font-arabic text-sm sm:text-base truncate">{faultName}</h3>
            <p className="text-slate-400 text-xs font-arabic hidden sm:block">معاينة الصورة بالحجم الكامل - اضغط ESC أو في أي مكان للإغلاق</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-red-600 active:scale-95 text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer shadow-xl"
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
          className="max-w-[95vw] max-h-[82vh] object-contain rounded-xl shadow-2xl border border-white/10"
        />
      </div>

      {/* Bottom Hint */}
      <div className="fixed bottom-4 left-0 right-0 text-center pointer-events-none">
        <span className="bg-black/70 text-slate-300 text-xs px-4 py-1.5 rounded-full font-arabic backdrop-blur-sm border border-white/10">
          اضغط في أي مكان خارج الصورة أو على زر (X) للإغلاق
        </span>
      </div>
    </div>
  );
};

// Company Header Component - Exact High Safety Reference
const CompanyHeader = () => (
  <div className="rounded-3xl overflow-hidden shadow-2xl border border-[#C5852C]/30">
    <div className="bg-[#0C1A28] relative">
      <img 
        src={hsBannerPath} 
        alt="High Safety International Center" 
        className="w-full object-cover"
        style={{ maxHeight: '130px', objectPosition: 'center' }}
      />
    </div>
    <div className="bg-gradient-to-l from-[#0C1A28] to-[#0f2035] text-white px-6 py-3 flex flex-wrap justify-center md:justify-between items-center gap-3 border-t border-[#C5852C]/40">
      <div className="flex flex-wrap justify-center gap-4 text-sm">
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
          <PhosphorIcon name="phone" weight="duotone" size={16} className="text-[#C5852C]" />
          <span className="font-mono font-bold">0542206000</span>
        </div>
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
          <PhosphorIcon name="envelope" weight="duotone" size={16} className="text-[#C5852C]" />
          <span className="text-xs font-mono">highsafety2021@gmail.com</span>
        </div>
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
          <PhosphorIcon name="map-pin" weight="duotone" size={16} className="text-[#C5852C]" />
          <span className="font-arabic">سيتي بلازا الدراري - الشارقة</span>
        </div>
      </div>
    </div>
  </div>
);

// Section 1: Vehicle Info Card - Exact 2-Column Specs + Car 3D + VIN Card & Odometer Card
const VehicleInfoCard = ({ inspection }: { inspection: any }) => {
  const vehicleColor = useMemo(() => getVehicleColor(inspection.color), [inspection.color]);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden" data-testid="vehicle-info-card">
      <div className="bg-[#0C1A28] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shadow-md">
            <PhosphorIcon name="car-profile" weight="duotone" size={22} className="text-[#C5852C]" />
          </div>
          <div>
            <h3 className="font-bold text-lg md:text-xl font-arabic flex items-center gap-2 text-white">
              <span className="font-mono text-[#C5852C] font-black">1 |</span>
              <span className="text-white font-black">معلومات السيارة</span>
              <span className="text-slate-300 text-xs md:text-sm font-mono font-semibold">| Vehicle Information</span>
            </h3>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side (5 Cols): 2-Column Key-Value Specs Table */}
        <div className="lg:col-span-5 flex flex-col justify-between divide-y divide-slate-100 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
          <div className="py-2.5 px-3 flex items-center justify-between text-right">
            <span className="font-bold text-slate-900 text-sm font-arabic">{inspection.make || '-'}</span>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="text-xs text-slate-400 font-mono">Manufacturer</span>
              <span className="text-xs font-bold text-slate-700 font-arabic">الشركة المصنعة</span>
              <PhosphorIcon name="buildings" weight="duotone" size={16} className="text-[#C5852C]" />
            </div>
          </div>

          <div className="py-2.5 px-3 flex items-center justify-between text-right">
            <span className="font-bold text-slate-900 text-sm font-arabic">{inspection.model || '-'}</span>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="text-xs text-slate-400 font-mono">Model</span>
              <span className="text-xs font-bold text-slate-700 font-arabic">الموديل</span>
              <PhosphorIcon name="car" weight="duotone" size={16} className="text-[#C5852C]" />
            </div>
          </div>

          <div className="py-2.5 px-3 flex items-center justify-between text-right">
            <span className="font-bold text-slate-900 text-sm font-mono">{inspection.year || '-'}</span>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="text-xs text-slate-400 font-mono">Year</span>
              <span className="text-xs font-bold text-slate-700 font-arabic">سنة الصنع</span>
              <PhosphorIcon name="calendar-blank" weight="duotone" size={16} className="text-[#C5852C]" />
            </div>
          </div>

          <div className="py-2.5 px-3 flex items-center justify-between text-right">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: vehicleColor.hex }} />
              <span className="font-bold text-slate-900 text-sm font-arabic">{vehicleColor.ar}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="text-xs text-slate-400 font-mono">Color</span>
              <span className="text-xs font-bold text-slate-700 font-arabic">اللون</span>
              <PhosphorIcon name="paint-brush" weight="duotone" size={16} className="text-[#C5852C]" />
            </div>
          </div>

          <div className="py-2.5 px-3 flex items-center justify-between text-right">
            <span className="font-mono font-bold text-slate-900 text-xs tracking-wider" dir="ltr">{inspection.vin || '-'}</span>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="text-xs text-slate-400 font-mono">VIN</span>
              <span className="text-xs font-bold text-slate-700 font-arabic">رقم الهيكل (VIN)</span>
              <PhosphorIcon name="barcode" weight="duotone" size={16} className="text-[#C5852C]" />
            </div>
          </div>

          <div className="py-2.5 px-3 flex items-center justify-between text-right">
            <span className="font-mono font-bold text-slate-900 text-sm">{inspection.odometer?.toLocaleString() || '0'} كم</span>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="text-xs text-slate-400 font-mono">Odometer Reading</span>
              <span className="text-xs font-bold text-slate-700 font-arabic">قراءة العداد</span>
              <PhosphorIcon name="gauge" weight="duotone" size={16} className="text-[#C5852C]" />
            </div>
          </div>

          <div className="py-2.5 px-3 flex items-center justify-between text-right">
            <span className="font-bold text-emerald-700 text-sm font-arabic">فحص شامل / Full</span>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="text-xs text-slate-400 font-mono">Inspection Type</span>
              <span className="text-xs font-bold text-slate-700 font-arabic">نوع الفحص</span>
              <PhosphorIcon name="shield-check" weight="duotone" size={16} className="text-[#C5852C]" />
            </div>
          </div>
        </div>

        {/* Right Side (7 Cols): Car 3D Photo + VIN Card & Odometer Card (Crisp & Unsquashed) */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          {/* Main Car Photo */}
          <div className="w-full h-72 sm:h-80 md:h-96 rounded-2xl overflow-hidden bg-slate-900/5 border border-slate-200 flex items-center justify-center p-4 relative group shadow-sm">
            {inspection.mainCarPhoto ? (
              <img 
                src={inspection.mainCarPhoto} 
                alt="Vehicle Main" 
                className="w-full h-full max-h-full max-w-full object-contain drop-shadow-lg" 
              />
            ) : (
              <img 
                src={hsCarBranding} 
                alt="High Safety Vehicle" 
                className="w-full h-full max-h-full max-w-full object-contain opacity-70" 
              />
            )}
          </div>

          {/* Bottom 2 Sub-Cards: VIN Photo & Odometer Reading */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center flex flex-col justify-between">
              <div className="text-xs font-bold text-slate-800 font-arabic mb-1.5">رقم الهيكل (VIN)</div>
              <div className="h-28 md:h-32 rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center p-2 shadow-inner">
                {inspection.vinPhoto ? (
                  <img src={inspection.vinPhoto} alt="VIN Plate" className="max-h-full max-w-full object-contain rounded-lg" />
                ) : (
                  <div className="font-mono font-black text-sm text-slate-800 tracking-wider" dir="ltr">{inspection.vin}</div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center flex flex-col justify-between">
              <div className="text-xs font-bold text-slate-800 font-arabic mb-1.5">قراءة العداد (Odometer)</div>
              <div className="h-28 md:h-32 rounded-xl overflow-hidden bg-white border border-slate-200 flex flex-col items-center justify-center p-2 shadow-inner">
                {inspection.odometerPhoto ? (
                  <img src={inspection.odometerPhoto} alt="Odometer Photo" className="max-h-full max-w-full object-contain rounded-lg" />
                ) : (
                  <>
                    <PhosphorIcon name="gauge" weight="duotone" size={32} className="text-[#C5852C] mb-1" />
                    <div className="font-mono font-black text-slate-900 text-base md:text-lg">{inspection.odometer?.toLocaleString() || '85,230'} KM</div>
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
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden" data-testid="car-section-photos-gallery">
        <div className="bg-[#0C1A28] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shadow-md">
              <PhosphorIcon name="camera" weight="duotone" size={22} className="text-[#C5852C]" />
            </div>
            <div>
              <h3 className="font-bold text-lg md:text-xl font-arabic flex items-center gap-2 text-white">
                <span className="font-mono text-[#C5852C] font-black">2 |</span>
                <span className="text-white font-black">صور أقسام السيارة</span>
                <span className="text-slate-300 text-xs md:text-sm font-mono font-semibold">| Vehicle Sections Photos ({count})</span>
              </h3>
            </div>
          </div>
        </div>

        {/* Intelligent Visual Grid Layout based on actual photo count */}
        <div className="p-6">
          <div className={
            count === 1 
              ? "max-w-xl mx-auto" 
              : count === 2 
                ? "grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto" 
                : count === 3 
                  ? "grid grid-cols-1 sm:grid-cols-3 gap-4" 
                  : count === 4 
                    ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4" 
                    : count === 5 
                      ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4" 
                      : count === 6 
                        ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" 
                        : count === 7 
                          ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4" 
                          : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
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
                  className={`group flex flex-col rounded-2xl border border-slate-200 overflow-hidden bg-white hover:shadow-lg transition-all text-center cursor-pointer disabled:cursor-default ${spanClass}`}
                >
                  <div className="w-full aspect-[16/11] bg-slate-900/5 flex items-center justify-center p-2 relative overflow-hidden">
                    {sec.photo ? (
                      <img 
                        src={sec.photo} 
                        alt={sec.labelAr} 
                        className="max-w-full max-h-full w-auto h-auto object-contain group-hover:scale-105 transition-transform duration-300" 
                      />
                    ) : (
                      <PhosphorIcon name="camera" weight="duotone" size={28} className="text-slate-300" />
                    )}
                    {sec.photo && (
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <PhosphorIcon name="magnifying-glass-plus" weight="duotone" size={24} className="text-white drop-shadow-md" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-slate-100 bg-white flex items-center justify-between">
                    <div className="text-xs md:text-sm font-bold text-slate-900 font-arabic truncate">{sec.labelAr}</div>
                    <div className="text-[11px] text-slate-400 font-mono truncate" dir="ltr">{sec.labelEn}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999999] flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="bg-[#0C1A28] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base font-arabic">{selectedPhoto.labelAr}</h4>
                <p className="text-xs text-slate-400 font-mono" dir="ltr">{selectedPhoto.labelEn}</p>
              </div>
              <button onClick={() => setSelectedPhoto(null)} className="text-white hover:text-red-400 p-1">
                <PhosphorIcon name="x" weight="bold" size={22} />
              </button>
            </div>
            <div className="p-4 bg-slate-900 flex items-center justify-center max-h-[75vh]">
              <img src={selectedPhoto.url} alt={selectedPhoto.labelAr} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Section 3: Inspection Results Section - Detailed Finding Cards + Car Blueprint SVG
const InspectionResults = ({ 
  inspection, 
  onImageClick 
}: { 
  inspection: any; 
  onImageClick?: (url: string, name: string) => void; 
}) => {
  const items = inspection.items || [];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden" data-testid="inspection-results-section">
      <div className="bg-[#0C1A28] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shadow-md">
            <PhosphorIcon name="clipboard-text" weight="duotone" size={22} className="text-[#C5852C]" />
          </div>
          <div>
            <h3 className="font-bold text-lg md:text-xl font-arabic flex items-center gap-2 text-white">
              <span className="font-mono text-[#C5852C] font-black">3 |</span>
              <span className="text-white font-black">نتائج الفحص</span>
              <span className="text-slate-300 text-xs md:text-sm font-mono font-semibold">| Inspection Results ({items.length})</span>
            </h3>
          </div>
        </div>
      </div>

      <div className="p-6">
        {items.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-100">
            <PhosphorIcon name="check-circle" weight="duotone" size={48} className="text-emerald-500 mx-auto mb-3" />
            <h4 className="text-xl font-bold text-slate-800 font-arabic mb-1">المركبة بحالة ممتازة</h4>
            <p className="text-slate-500 text-sm font-arabic">لم يتم تسجيل أي ملاحظات أو عيوب فنية على المركبة</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {items.map((item: any, idx: number) => {
              const cat = INSPECTION_CATEGORIES.find(c => c.id === item.category) || { label: item.category || 'فحص عام', labelEn: 'General' };
              const titleAr = item.faultName?.split(' - ')[0] || item.faultName || 'ملاحظة فنية';

              return (
                <div
                  key={item.id || idx}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all p-4 flex items-center gap-4 text-right"
                >
                  {/* Left: Defect Photo */}
                  <div className="shrink-0 w-32 h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative group">
                    {item.imageUrl ? (
                      <button
                        type="button"
                        onClick={() => onImageClick?.(item.imageUrl!, titleAr)}
                        className="w-full h-full block cursor-pointer"
                      >
                        <img src={item.imageUrl} alt={titleAr} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <PhosphorIcon name="magnifying-glass-plus" weight="duotone" size={22} className="text-white" />
                        </div>
                      </button>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 bg-slate-50">
                        <PhosphorIcon name="camera-slash" weight="duotone" size={24} />
                        <span className="text-[9px] font-arabic">لا توجد صورة</span>
                      </div>
                    )}
                  </div>

                  {/* Center: Details & Descriptions */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#C5852C] font-arabic">{cat.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono" dir="ltr">{cat.labelEn}</span>
                    </div>

                    <h4 className="font-bold text-slate-900 font-arabic text-sm leading-snug">
                      {titleAr}
                    </h4>

                    {item.description && (
                      <p className="text-xs text-slate-700 font-arabic leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    {item.descriptionEn && (
                      <p className="text-[10px] text-slate-400 font-mono truncate" dir="ltr">
                        {item.descriptionEn}
                      </p>
                    )}
                  </div>

                  {/* Right: Top-down Car Blueprint SVG Pinpoint */}
                  <div className="shrink-0 w-20 h-24 bg-slate-50/80 rounded-xl border border-slate-100 p-1 flex items-center justify-center">
                    <CarBlueprintPinpoint category={item.category || ''} dotColor="#dc2626" className="w-full h-full" />
                  </div>
                </div>
              );
            })}
          </div>
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center bg-white/10 backdrop-blur-lg rounded-3xl p-12 max-w-md">
          <XCircle className="w-20 h-20 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2 font-arabic">التقرير غير موجود</h1>
          <p className="text-white/60 font-arabic">الرابط غير صحيح أو انتهت صلاحيته</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} duration={4500} />}
      
      {selectedImage && (
        <ImageModal 
          imageUrl={selectedImage.url} 
          faultName={selectedImage.name} 
          onClose={() => setSelectedImage(null)} 
        />
      )}

      {/* Report Content */}
      <div id="report-content" className="max-w-6xl mx-auto py-4 px-4 space-y-6 print:py-0">
        {/* Company Header */}
        <CompanyHeader />

        {/* Section 1: Vehicle Info Card */}
        <VehicleInfoCard inspection={inspection} />

        {/* Section 2: Car Section Photos Gallery */}
        <CarSectionPhotosGallery inspection={inspection} />

        {/* Section 3: Inspection Results */}
        <InspectionResults 
          inspection={inspection} 
          onImageClick={(url, name) => setSelectedImage({ url, name })}
        />

        {/* Dynamic OBD Codes Section - Section 4 Current & Section 5 History */}
        {(() => {
          const obdCodes = (inspection.obdCodes as Array<{code: string; nameEn: string; nameAr: string; diagnosis?: string; causes?: string; solutions?: string; status?: 'current' | 'history'}> | null) || [];
          const currentCodes = obdCodes.filter(c => c.status !== 'history');
          const historyCodes = obdCodes.filter(c => c.status === 'history');

          if (currentCodes.length === 0 && historyCodes.length === 0) return null;

          const renderCodeList = (codes: typeof obdCodes, isHistory: boolean) => (
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200" data-testid={isHistory ? "obd-history-section" : "obd-current-section"}>
              <div className="bg-[#0C1A28] text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shadow-md">
                    <PhosphorIcon name={isHistory ? "clock-counter-clockwise" : "warning-octagon"} weight="duotone" size={22} className={isHistory ? "text-amber-400" : "text-red-500"} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg md:text-xl font-arabic flex items-center gap-2 text-white">
                      <span className="font-mono text-[#C5852C] font-black">{isHistory ? "5 |" : "4 |"}</span>
                      <span className="text-white font-black">{isHistory ? "الأعطال السابقة — History" : "الأعطال الحالية — Current"}</span>
                      <span className="text-slate-300 text-xs md:text-sm font-mono font-semibold">| {isHistory ? "Stored & History Trouble Codes" : "Active & Current Trouble Codes"}</span>
                    </h3>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-3">
                {codes.map((obd, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-right">
                    <div className="shrink-0 text-center">
                      <div className="font-mono font-black text-[#0C1A28] text-lg px-4 py-1.5 rounded-xl bg-slate-200/80 shadow-sm min-w-[90px] text-center">{obd.code}</div>
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="text-base font-black text-slate-900 font-arabic leading-snug">{obd.nameAr}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5" dir="ltr">{obd.nameEn}</div>
                    </div>
                    <div className="shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold font-arabic flex items-center gap-1.5 ${isHistory ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                        <PhosphorIcon name={isHistory ? "clock-counter-clockwise" : "warning-octagon"} weight="duotone" size={14} />
                        <span>{isHistory ? 'سابق History' : 'نشط Active'}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );

          return (
            <div className="space-y-6">
              {currentCodes.length > 0 && renderCodeList(currentCodes, false)}
              {historyCodes.length > 0 && renderCodeList(historyCodes, true)}
            </div>
          );
        })()}

        {/* Section 6: Autel Computer Report Section */}
        {inspection.autelReportPdf && (
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200" data-testid="autel-report-section">
            <div className="bg-[#0C1A28] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shadow-md">
                  <PhosphorIcon name="cpu" weight="duotone" size={22} className="text-[#C5852C]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg md:text-xl font-arabic flex items-center gap-2 text-white">
                    <span className="font-mono text-[#C5852C] font-black">6 |</span>
                    <span className="text-white font-black">تقرير فحص الكمبيوتر</span>
                    <span className="text-slate-300 text-xs md:text-sm font-mono font-semibold">| Autel Computer Diagnostic Report</span>
                  </h3>
                </div>
              </div>
            </div>
            <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/50">
              <div className="flex items-center gap-4 text-right">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                  <PhosphorIcon name="file-pdf" weight="duotone" size={36} className="text-red-500" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 font-arabic text-base">تقرير فحص الكمبيوتر الشامل من جهاز Autel</h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5" dir="ltr">Autel MaxiSys Diagnostic Report — Attached in PDF</p>
                </div>
              </div>
              <a
                href={`/api/autel/report/public/${token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0C1A28] hover:bg-[#1a334d] text-white rounded-xl font-bold font-arabic transition-all shadow-md hover:shadow-lg"
                data-testid="btn-open-autel-pdf"
              >
                <PhosphorIcon name="arrow-square-out" weight="duotone" size={20} className="text-[#C5852C]" />
                <span>فتح تقرير Autel المرفق</span>
              </a>
            </div>
          </div>
        )}

        {/* Section 7: Terms and Conditions */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200" data-testid="terms-section">
          <div className="bg-[#0C1A28] text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shadow-md">
                <PhosphorIcon name="scales" weight="duotone" size={22} className="text-[#C5852C]" />
              </div>
              <div>
                <h3 className="font-bold text-lg md:text-xl font-arabic flex items-center gap-2 text-white">
                  <span className="font-mono text-[#C5852C] font-black">7 |</span>
                  <span className="text-white font-black">الأحكام والشروط</span>
                  <span className="text-slate-300 text-xs md:text-sm font-mono font-semibold">| Terms & Conditions</span>
                </h3>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-3 text-right">
              <div className="flex-1">
                <p className="font-bold text-slate-900 font-arabic text-sm">1. المركز غير مسئول عن أي أعطال تحدث أثناء الفحص أو بعده.</p>
                <p className="text-xs text-slate-500 font-mono mt-1" dir="ltr">The center is not responsible for any malfunctions occurring during or after inspection.</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                <PhosphorIcon name="shield-warning" weight="duotone" size={20} className="text-[#C5852C]" />
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-3 text-right">
              <div className="flex-1">
                <p className="font-bold text-slate-900 font-arabic text-sm">2. المركز مسئول عن نتيجة الفحص وقت الفحص فقط وغير مسئول بعد خروج المركبة من الفحص.</p>
                <p className="text-xs text-slate-500 font-mono mt-1" dir="ltr">The center is only responsible for inspection results at the time of inspection.</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                <PhosphorIcon name="clock" weight="duotone" size={20} className="text-[#C5852C]" />
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-3 text-right">
              <div className="flex-1">
                <p className="font-bold text-slate-900 font-arabic text-sm">3. هذا الفحص غير معتمد لدى إدارة التراخيص.</p>
                <p className="text-xs text-slate-500 font-mono mt-1" dir="ltr">This inspection is not approved by the Licensing Authority.</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                <PhosphorIcon name="file-text" weight="duotone" size={20} className="text-[#C5852C]" />
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-3 text-right">
              <div className="flex-1">
                <p className="font-bold text-slate-900 font-arabic text-sm">4. المركز غير مسئول عن أي أغراض شخصية داخل السيارة أثناء الفحص.</p>
                <p className="text-xs text-slate-500 font-mono mt-1" dir="ltr">The center is not responsible for any personal belongings inside the vehicle.</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                <PhosphorIcon name="backpack" weight="duotone" size={20} className="text-[#C5852C]" />
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-3 text-right md:col-span-2">
              <div className="flex-1">
                <p className="font-bold text-slate-900 font-arabic text-sm">5. يعتبر هذا التقرير لحالة المركبة حسب قراءة الأجهزة في وقت الفحص.</p>
                <p className="text-xs text-slate-500 font-mono mt-1" dir="ltr">This report reflects the vehicle condition based on device readings at the time of inspection.</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                <PhosphorIcon name="clipboard-check" weight="duotone" size={20} className="text-[#C5852C]" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Banner */}
        <div className="bg-[#0C1A28] text-white rounded-3xl p-6 border-t-2 border-[#C5852C] shadow-2xl text-center space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/80 font-arabic">
            <div className="flex items-center gap-2">
              <PhosphorIcon name="phone" weight="duotone" size={16} className="text-[#C5852C]" />
              <span className="font-mono font-bold">0542206000</span>
            </div>
            <div className="flex items-center gap-2">
              <PhosphorIcon name="envelope" weight="duotone" size={16} className="text-[#C5852C]" />
              <span className="font-mono">highsafety2021@gmail.com</span>
            </div>
            <div className="flex items-center gap-2">
              <PhosphorIcon name="globe" weight="duotone" size={16} className="text-[#C5852C]" />
              <span className="font-mono">www.highsafetyint.com</span>
            </div>
            <div className="flex items-center gap-2">
              <PhosphorIcon name="map-pin" weight="duotone" size={16} className="text-[#C5852C]" />
              <span>سيتي بلازا الدراري - الشارقة - الإمارات العربية المتحدة</span>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 flex flex-col md:flex-row items-center justify-between text-xs text-white/50 gap-2">
            <p className="font-arabic">جميع الحقوق محفوظة © {new Date().getFullYear()} مركز الأمان العالي الدولي للفحص الفني</p>
            <p className="font-mono" dir="ltr">HIGH SAFETY INTERNATIONAL CENTER L.L.C.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
