import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useState, useMemo, useEffect, useRef } from "react";
import { 
  Car,
  Phone,
  User,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  Gauge,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Mail,
  MapPin,
  X,
  ZoomIn,
  RotateCcw,
  Palette
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getVehicleColor, calculateInspectionStats, getInspectionTypeLabel } from "@/lib/vehicle-utils";
import logoPath from "@assets/hs-logo.png";
import { VinPlate } from "@/components/vin-plate";
import carCutawayFrontLeft from "@assets/generated_images/car_cutaway_front-left_view.png";
import carCutawayRightSide from "@assets/generated_images/car_cutaway_right_side_view.png";
import carCutawayRearRight from "@assets/generated_images/car_cutaway_rear-right_view.png";
import carCutawayLeftSide from "@assets/generated_images/car_cutaway_left_side_view.png";
import type { Inspection, InspectionItem } from "@shared/schema";
import { INSPECTION_CATEGORIES, CATEGORY_GROUPS } from "@shared/categories";
import { LuxuryOdometer } from "@/components/luxury-odometer";
import { IntroAnimation } from "@/components/intro-animation";

type InspectionWithItems = Inspection & { items: InspectionItem[] };

// 360 degree car views configuration
type ViewAngle = 'front_left' | 'right_side' | 'rear_right' | 'left_side';
const CAR_CUTAWAY_VIEWS: { angle: ViewAngle; image: string; label: string }[] = [
  { angle: 'front_left', image: carCutawayFrontLeft, label: 'الأمام' },
  { angle: 'right_side', image: carCutawayRightSide, label: 'اليمين' },
  { angle: 'rear_right', image: carCutawayRearRight, label: 'الخلف' },
  { angle: 'left_side', image: carCutawayLeftSide, label: 'اليسار' },
];

// Anatomy positions per view angle for accurate fault placement on all 4 views
const ANATOMY_POSITIONS_BY_VIEW: Record<ViewAngle, Record<string, { top: string; left: string; label: string }>> = {
  // Front-Left view: Shows engine bay, front-left wheel, hood, front bumper, steering
  front_left: {
    // Mechanical
    engine: { top: "42%", left: "40%", label: "المحرك" },
    transmission_system: { top: "52%", left: "50%", label: "ناقل الحركة" },
    steering_system: { top: "48%", left: "32%", label: "التوجيه" },
    suspension_system: { top: "62%", left: "28%", label: "التعليق" },
    brake_system: { top: "68%", left: "22%", label: "الفرامل" },
    ac_cooling: { top: "38%", left: "35%", label: "التكييف" },
    fuel_exhaust: { top: "58%", left: "60%", label: "العادم" },
    misc_mechanical: { top: "45%", left: "55%", label: "أجزاء ميكانيكية" },
    // Body
    hood: { top: "30%", left: "42%", label: "غطاء المحرك" },
    front_bumper: { top: "58%", left: "15%", label: "الصدام الأمامي" },
    bumper_frame_front: { top: "62%", left: "18%", label: "جسر الصدام" },
    fender_front_left: { top: "48%", left: "20%", label: "الرفرف" },
    front_chest: { top: "55%", left: "35%", label: "صدر السيارة" },
    roof: { top: "22%", left: "58%", label: "السقف" },
    pillars: { top: "28%", left: "52%", label: "القوائم" },
    // Electric
    battery: { top: "35%", left: "30%", label: "البطارية" },
    electrical_system: { top: "40%", left: "48%", label: "الكهرباء" },
    exterior_lighting: { top: "52%", left: "12%", label: "الإضاءة" },
    wire_harness: { top: "44%", left: "45%", label: "الأسلاك" },
    // Other
    tires_rims: { top: "72%", left: "25%", label: "الإطارات" },
    windows: { top: "25%", left: "62%", label: "الزجاج" },
    glass_mirrors: { top: "32%", left: "18%", label: "المرايا" },
    interior: { top: "35%", left: "55%", label: "الداخلية" },
    safety_systems: { top: "38%", left: "58%", label: "السلامة" },
    chassis_frame: { top: "65%", left: "45%", label: "الهيكل" },
  },
  
  // Right side view: Shows right doors, right fenders, right wheels, side profile
  right_side: {
    // Mechanical
    engine: { top: "40%", left: "15%", label: "المحرك" },
    transmission_system: { top: "50%", left: "40%", label: "ناقل الحركة" },
    fuel_exhaust: { top: "60%", left: "72%", label: "العادم" },
    suspension_system: { top: "65%", left: "20%", label: "التعليق الأمامي" },
    brake_system: { top: "68%", left: "25%", label: "الفرامل" },
    steering_system: { top: "55%", left: "18%", label: "التوجيه" },
    ac_cooling: { top: "38%", left: "20%", label: "التكييف" },
    misc_mechanical: { top: "55%", left: "50%", label: "أجزاء ميكانيكية" },
    // Body - Right side
    door_front_right: { top: "38%", left: "32%", label: "الباب الأمامي يمين" },
    door_rear_right: { top: "38%", left: "55%", label: "الباب الخلفي يمين" },
    fender_front_right: { top: "50%", left: "18%", label: "الرفرف الأمامي" },
    fender_rear_right: { top: "50%", left: "78%", label: "الرفرف الخلفي" },
    hood: { top: "32%", left: "12%", label: "غطاء المحرك" },
    trunk: { top: "35%", left: "88%", label: "صندوق الأمتعة" },
    roof: { top: "20%", left: "45%", label: "السقف" },
    pillars: { top: "25%", left: "40%", label: "القوائم" },
    quarter_panel: { top: "42%", left: "75%", label: "اللوح الجانبي" },
    front_bumper: { top: "55%", left: "8%", label: "الصدام الأمامي" },
    rear_bumper: { top: "55%", left: "92%", label: "الصدام الخلفي" },
    // Electric
    exterior_lighting: { top: "48%", left: "10%", label: "الإضاءة الأمامية" },
    lights_rear: { top: "45%", left: "90%", label: "الإضاءة الخلفية" },
    electrical_system: { top: "42%", left: "45%", label: "الكهرباء" },
    mirror_controls: { top: "30%", left: "28%", label: "المرايا" },
    // Other
    tires_rims: { top: "72%", left: "22%", label: "الإطار الأمامي" },
    windows: { top: "28%", left: "42%", label: "الزجاج" },
    glass_mirrors: { top: "32%", left: "25%", label: "المرايا" },
    interior: { top: "35%", left: "45%", label: "الداخلية" },
    chassis_frame: { top: "62%", left: "50%", label: "الهيكل" },
  },
  
  // Rear-Right view: Shows trunk, rear bumper, exhaust, rear lights
  rear_right: {
    // Mechanical
    fuel_exhaust: { top: "62%", left: "42%", label: "العادم" },
    suspension_system: { top: "65%", left: "72%", label: "التعليق" },
    brake_system: { top: "70%", left: "75%", label: "الفرامل" },
    transmission_system: { top: "55%", left: "48%", label: "ناقل الحركة" },
    misc_mechanical: { top: "58%", left: "55%", label: "أجزاء ميكانيكية" },
    // Body - Rear
    trunk: { top: "32%", left: "50%", label: "صندوق الأمتعة" },
    rear_bumper: { top: "58%", left: "52%", label: "الصدام الخلفي" },
    bumper_frame_rear: { top: "62%", left: "50%", label: "جسر الصدام" },
    rear_chest: { top: "45%", left: "48%", label: "صدر السيارة الخلفي" },
    quarter_panel: { top: "40%", left: "70%", label: "اللوح الجانبي" },
    fender_rear_right: { top: "48%", left: "75%", label: "الرفرف الخلفي" },
    roof: { top: "22%", left: "50%", label: "السقف" },
    pillars: { top: "28%", left: "62%", label: "القوائم" },
    door_rear_right: { top: "38%", left: "78%", label: "الباب الخلفي يمين" },
    // Electric
    lights_rear: { top: "42%", left: "65%", label: "الإضاءة الخلفية" },
    exterior_lighting: { top: "45%", left: "58%", label: "الإضاءة" },
    electrical_system: { top: "50%", left: "55%", label: "الكهرباء" },
    // Other
    tires_rims: { top: "72%", left: "78%", label: "الإطارات" },
    windows: { top: "28%", left: "55%", label: "الزجاج الخلفي" },
    interior: { top: "35%", left: "52%", label: "الداخلية" },
    safety_systems: { top: "38%", left: "45%", label: "السلامة" },
    chassis_frame: { top: "65%", left: "55%", label: "الهيكل" },
  },
  
  // Left side view: Shows left doors, left fenders, left wheels (mirror of right)
  left_side: {
    // Mechanical
    engine: { top: "40%", left: "85%", label: "المحرك" },
    transmission_system: { top: "50%", left: "60%", label: "ناقل الحركة" },
    fuel_exhaust: { top: "60%", left: "28%", label: "العادم" },
    suspension_system: { top: "65%", left: "80%", label: "التعليق الأمامي" },
    brake_system: { top: "68%", left: "75%", label: "الفرامل" },
    steering_system: { top: "55%", left: "82%", label: "التوجيه" },
    ac_cooling: { top: "38%", left: "80%", label: "التكييف" },
    misc_mechanical: { top: "55%", left: "50%", label: "أجزاء ميكانيكية" },
    // Body - Left side
    door_front_left: { top: "38%", left: "68%", label: "الباب الأمامي يسار" },
    door_rear_left: { top: "38%", left: "45%", label: "الباب الخلفي يسار" },
    fender_front_left: { top: "50%", left: "82%", label: "الرفرف الأمامي" },
    fender_rear_left: { top: "50%", left: "22%", label: "الرفرف الخلفي" },
    hood: { top: "32%", left: "88%", label: "غطاء المحرك" },
    trunk: { top: "35%", left: "12%", label: "صندوق الأمتعة" },
    roof: { top: "20%", left: "55%", label: "السقف" },
    pillars: { top: "25%", left: "60%", label: "القوائم" },
    quarter_panel: { top: "42%", left: "25%", label: "اللوح الجانبي" },
    front_bumper: { top: "55%", left: "92%", label: "الصدام الأمامي" },
    rear_bumper: { top: "55%", left: "8%", label: "الصدام الخلفي" },
    // Electric
    exterior_lighting: { top: "48%", left: "90%", label: "الإضاءة الأمامية" },
    lights_rear: { top: "45%", left: "10%", label: "الإضاءة الخلفية" },
    electrical_system: { top: "42%", left: "55%", label: "الكهرباء" },
    mirror_controls: { top: "30%", left: "72%", label: "المرايا" },
    battery: { top: "35%", left: "78%", label: "البطارية" },
    // Other
    tires_rims: { top: "72%", left: "78%", label: "الإطار الأمامي" },
    windows: { top: "28%", left: "58%", label: "الزجاج" },
    glass_mirrors: { top: "32%", left: "75%", label: "المرايا" },
    interior: { top: "35%", left: "55%", label: "الداخلية" },
    chassis_frame: { top: "62%", left: "50%", label: "الهيكل" },
  },
};

// Mobile-friendly swipeable photo modal for section photos
const SectionPhotoModal = ({ 
  selectedSection, 
  onClose 
}: { 
  selectedSection: { label: string; labelEn: string; exteriorPhoto: string | null; interiorPhoto: string | null; };
  onClose: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<'exterior' | 'interior'>('exterior');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const minSwipeDistance = 50;
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && activeTab === 'exterior' && selectedSection.interiorPhoto) {
      setActiveTab('interior');
    } else if (isRightSwipe && activeTab === 'interior' && selectedSection.exteriorPhoto) {
      setActiveTab('exterior');
    }
  };

  const hasExterior = !!selectedSection.exteriorPhoto;
  const hasInterior = !!selectedSection.interiorPhoto;
  const hasBoth = hasExterior && hasInterior;

  return (
    <div 
      className="fixed inset-0 bg-black/95 z-50 flex flex-col"
      onClick={onClose}
    >
      {/* Header with close button */}
      <div className="flex items-center justify-between p-4 bg-black/50" onClick={(e) => e.stopPropagation()}>
        <div className="text-white text-right flex-1">
          <p className="font-bold font-arabic text-lg">{selectedSection.label}</p>
          <p className="text-white/60 text-sm">{selectedSection.labelEn}</p>
        </div>
        <button
          onClick={onClose}
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors touch-manipulation"
          data-testid="button-close-photo-modal"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <X className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* Photo tabs */}
      {hasBoth && (
        <div className="flex gap-2 justify-center p-3 bg-black/30" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setActiveTab('exterior')}
            className={cn(
              "px-6 py-2 rounded-full font-arabic text-sm transition-all touch-manipulation",
              activeTab === 'exterior' 
                ? "bg-blue-500 text-white shadow-lg" 
                : "bg-white/10 text-white/70"
            )}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-blue-300 ml-2"></span>
            خارجية
          </button>
          <button
            onClick={() => setActiveTab('interior')}
            className={cn(
              "px-6 py-2 rounded-full font-arabic text-sm transition-all touch-manipulation",
              activeTab === 'interior' 
                ? "bg-green-500 text-white shadow-lg" 
                : "bg-white/10 text-white/70"
            )}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-green-300 ml-2"></span>
            داخلية
          </button>
        </div>
      )}

      {/* Photo display area */}
      <div 
        className="flex-1 flex items-center justify-center p-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {activeTab === 'exterior' && hasExterior && (
          <img 
            src={selectedSection.exteriorPhoto!}
            alt={`${selectedSection.label} - خارجية`}
            className="max-w-full max-h-full object-contain rounded-xl"
          />
        )}
        {activeTab === 'interior' && hasInterior && (
          <img 
            src={selectedSection.interiorPhoto!}
            alt={`${selectedSection.label} - داخلية`}
            className="max-w-full max-h-full object-contain rounded-xl"
          />
        )}
        {activeTab === 'exterior' && !hasExterior && hasInterior && (
          <img 
            src={selectedSection.interiorPhoto!}
            alt={`${selectedSection.label} - داخلية`}
            className="max-w-full max-h-full object-contain rounded-xl"
          />
        )}
        {activeTab === 'interior' && !hasInterior && hasExterior && (
          <img 
            src={selectedSection.exteriorPhoto!}
            alt={`${selectedSection.label} - خارجية`}
            className="max-w-full max-h-full object-contain rounded-xl"
          />
        )}
      </div>

      {/* Swipe indicator for mobile */}
      {hasBoth && (
        <div className="p-4 text-center bg-black/30" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-center gap-2 mb-2">
            <div className={cn(
              "w-2 h-2 rounded-full transition-all",
              activeTab === 'exterior' ? "bg-blue-500 w-4" : "bg-white/30"
            )}></div>
            <div className={cn(
              "w-2 h-2 rounded-full transition-all",
              activeTab === 'interior' ? "bg-green-500 w-4" : "bg-white/30"
            )}></div>
          </div>
          <p className="text-white/50 text-xs font-arabic">اسحب يميناً أو يساراً للتبديل</p>
        </div>
      )}

      {/* Close button at bottom for easy mobile access */}
      <div className="p-4 pb-8 flex justify-center" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="px-8 py-3 bg-white text-slate-800 rounded-full font-bold font-arabic shadow-lg hover:shadow-xl transition-all touch-manipulation"
          data-testid="button-close-modal-bottom"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          إغلاق ومتابعة القراءة
        </button>
      </div>
    </div>
  );
};

// Car Section Photos Gallery Component - For displaying exterior/interior photos in public reports
const CarSectionPhotosGallery = ({ inspection }: { inspection: any }) => {
  const [selectedSection, setSelectedSection] = useState<{ 
    label: string; 
    labelEn: string;
    exteriorPhoto: string | null; 
    interiorPhoto: string | null;
  } | null>(null);
  
  const sections = [
    { 
      key: 'rearLeftDoor', 
      label: 'الباب الخلفي يسار', 
      labelEn: 'Rear Left Door', 
      exteriorPhoto: inspection.rearLeftDoorPhoto,
      interiorPhoto: null
    },
    { 
      key: 'rearRightDoor', 
      label: 'الباب الخلفي يمين', 
      labelEn: 'Rear Right Door', 
      exteriorPhoto: inspection.rearRightDoorPhoto,
      interiorPhoto: null
    },
    { 
      key: 'frontLeftDoor', 
      label: 'الباب الأمامي يسار', 
      labelEn: 'Front Left Door', 
      exteriorPhoto: inspection.frontLeftDoorPhoto,
      interiorPhoto: null
    },
    { 
      key: 'frontRightDoor', 
      label: 'الباب الأمامي يمين', 
      labelEn: 'Front Right Door', 
      exteriorPhoto: inspection.frontRightDoorPhoto,
      interiorPhoto: null
    },
    { 
      key: 'hood', 
      label: 'غطاء المحرك / حجرة المحرك', 
      labelEn: 'Hood / Engine Bay', 
      exteriorPhoto: inspection.hoodPhoto,
      interiorPhoto: null
    },
    { 
      key: 'trunk', 
      label: 'صندوق الأمتعة / الهيكل السفلي', 
      labelEn: 'Trunk / Chassis', 
      exteriorPhoto: inspection.trunkPhoto,
      interiorPhoto: null
    },
  ];

  const hasAnyPhoto = sections.some(s => s.exteriorPhoto || s.interiorPhoto);
  if (!hasAnyPhoto) return null;

  return (
    <>
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-l from-primary to-primary/80 text-white px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Car className="w-5 h-5" />
          </div>
          <div className="text-right">
            <h3 className="font-bold text-lg font-arabic">صور أقسام السيارة</h3>
            <p className="text-white/70 text-xs">Car Section Photos</p>
          </div>
        </div>
        <div className="p-4">
          <p className="text-xs text-slate-500 font-arabic mb-3 text-center">
            <ZoomIn className="w-3 h-3 inline ml-1" />
            اضغط على أي قسم لعرض الصورة الخارجية والداخلية
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {sections.map((section) => {
              const hasPhotos = section.exteriorPhoto || section.interiorPhoto;
              const photoCount = (section.exteriorPhoto ? 1 : 0) + (section.interiorPhoto ? 1 : 0);
              return (
                <button
                  key={section.key}
                  onClick={() => hasPhotos && setSelectedSection({ 
                    label: section.label, 
                    labelEn: section.labelEn,
                    exteriorPhoto: section.exteriorPhoto,
                    interiorPhoto: section.interiorPhoto
                  })}
                  disabled={!hasPhotos}
                  className={cn(
                    "relative rounded-2xl overflow-hidden border-2 transition-all",
                    hasPhotos 
                      ? "border-primary/30 hover:border-primary hover:shadow-lg cursor-pointer" 
                      : "border-slate-200 bg-slate-50 cursor-not-allowed opacity-60"
                  )}
                  data-testid={`button-view-${section.key}`}
                >
                  {section.exteriorPhoto ? (
                    <img 
                      src={section.exteriorPhoto} 
                      alt={`${section.label} - خارجية`}
                      className="w-full h-28 object-cover"
                    />
                  ) : section.interiorPhoto ? (
                    <img 
                      src={section.interiorPhoto} 
                      alt={`${section.label} - داخلية`}
                      className="w-full h-28 object-cover"
                    />
                  ) : (
                    <div className="w-full h-28 flex items-center justify-center bg-slate-100">
                      <Car className="w-8 h-8 text-slate-300" />
                    </div>
                  )}
                  {photoCount > 0 && (
                    <div className="absolute top-2 left-2 flex gap-1">
                      {section.exteriorPhoto && (
                        <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">خارجية</span>
                      )}
                      {section.interiorPhoto && (
                        <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">داخلية</span>
                      )}
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-white text-xs font-arabic text-center">{section.label}</p>
                    <p className="text-white/60 text-[10px] text-center">{section.labelEn}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section Photos Modal - Mobile swipeable gallery */}
      {selectedSection && (
        <SectionPhotoModal 
          selectedSection={selectedSection} 
          onClose={() => setSelectedSection(null)} 
        />
      )}
    </>
  );
};

const ImageModal = ({ imageUrl, faultName, onClose }: { imageUrl: string; faultName: string; onClose: () => void }) => (
  <div 
    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <button 
      className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
      onClick={onClose}
    >
      <X className="w-6 h-6" />
    </button>
    <div className="max-w-4xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
      <img 
        src={imageUrl} 
        alt={faultName} 
        className="w-full h-full object-contain rounded-2xl"
      />
      <div className="mt-4 text-center text-white">
        <h3 className="text-xl font-bold font-arabic">{faultName}</h3>
      </div>
    </div>
  </div>
);

const CarAnatomyVisualization = ({ items, onCategoryClick }: { items: InspectionItem[], onCategoryClick: (cat: string) => void }) => {
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragDistance, setDragDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentView = CAR_CUTAWAY_VIEWS[currentViewIndex];

  const getCategoryStatus = (catId: string) => {
    const catItems = items.filter(i => i.category === catId);
    if (catItems.length === 0) return 'good';
    if (catItems.some(i => i.status === 'fail')) return 'fail';
    if (catItems.some(i => i.status === 'warning')) return 'warning';
    return 'good';
  };

  const getCategoryItems = (catId: string) => items.filter(i => i.category === catId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fail': return 'bg-red-500 shadow-red-500/50';
      case 'warning': return 'bg-amber-500 shadow-amber-500/50';
      default: return 'bg-emerald-500 shadow-emerald-500/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fail': return <XCircle className="w-3 h-3" />;
      case 'warning': return <AlertCircle className="w-3 h-3" />;
      default: return <CheckCircle2 className="w-3 h-3" />;
    }
  };

  const handleCategoryPress = (catId: string) => {
    setSelectedCategory(selectedCategory === catId ? null : catId);
    onCategoryClick(catId);
  };

  const stats = useMemo(() => {
    const warning = items.filter(i => i.status === 'warning').length;
    const fail = items.filter(i => i.status === 'fail').length;
    return { warning, fail };
  }, [items]);

  const getPosition = (catId: string) => {
    const viewPositions = ANATOMY_POSITIONS_BY_VIEW[currentView.angle];
    return viewPositions[catId] || { top: "50%", left: "50%", label: catId };
  };

  const goToView = (direction: 'next' | 'prev') => {
    setCurrentViewIndex(prev => {
      if (direction === 'next') return (prev + 1) % CAR_CUTAWAY_VIEWS.length;
      return prev === 0 ? CAR_CUTAWAY_VIEWS.length - 1 : prev - 1;
    });
    setSelectedCategory(null);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setDragDistance(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setDragDistance(e.touches[0].clientX - startX);
  };

  const handleTouchEnd = () => {
    if (isDragging && Math.abs(dragDistance) > 50) {
      goToView(dragDistance > 0 ? 'prev' : 'next');
    }
    setIsDragging(false);
    setDragDistance(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setDragDistance(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setDragDistance(e.clientX - startX);
  };

  const handleMouseUp = () => {
    if (isDragging && Math.abs(dragDistance) > 50) {
      goToView(dragDistance > 0 ? 'prev' : 'next');
    }
    setIsDragging(false);
    setDragDistance(0);
  };

  return (
    <div className="relative w-full bg-gradient-to-b from-[#0C1A28] via-[#0f1f2e] to-[#0C1A28] rounded-3xl overflow-hidden">
      {/* Header stats */}
      <div className="absolute top-0 left-0 right-0 p-3 md:p-4 flex justify-between items-center z-20">
        <div className="bg-[#C5852C]/20 backdrop-blur-sm rounded-xl px-3 py-1.5 text-[#C5852C] text-xs font-arabic font-bold border border-[#C5852C]/30">
          {currentView.label}
        </div>
        <div className="flex gap-2">
          {stats.warning > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-400 px-2 md:px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border border-amber-500/30">
              <AlertCircle className="w-3 h-3 md:w-3.5 md:h-3.5" />
              <span>{stats.warning} تحذير</span>
            </div>
          )}
          {stats.fail > 0 && (
            <div className="flex items-center gap-1.5 bg-red-500/20 text-red-400 px-2 md:px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border border-red-500/30">
              <XCircle className="w-3 h-3 md:w-3.5 md:h-3.5" />
              <span>{stats.fail} خطير</span>
            </div>
          )}
        </div>
      </div>

      {/* 360 Rotation Car Visualization */}
      <div 
        ref={containerRef}
        className="relative w-full aspect-[4/3] md:aspect-[16/9] flex items-center justify-center pt-12 md:pt-14 pb-16 cursor-grab active:cursor-grabbing select-none touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-white/5 to-transparent" />
        
        <div className="relative w-full h-full px-2 md:px-8">
          <img 
            src={currentView.image} 
            alt={`عرض تشريحي - ${currentView.label}`} 
            className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-300"
            style={{ transform: isDragging ? `translateX(${dragDistance * 0.1}px)` : 'none' }}
            draggable={false}
          />

          {/* Category markers on anatomy diagram */}
          {INSPECTION_CATEGORIES.map(cat => {
            const viewPositions = ANATOMY_POSITIONS_BY_VIEW[currentView.angle];
            if (!viewPositions[cat.id]) return null;
            
            const position = getPosition(cat.id);
            const status = getCategoryStatus(cat.id);
            const hasIssues = status !== 'good';
            const catItems = getCategoryItems(cat.id);
            const isSelected = selectedCategory === cat.id;

            if (!hasIssues) return null;
            
            return (
              <div 
                key={cat.id} 
                className="absolute z-10 transition-all duration-300 -translate-x-1/2 -translate-y-1/2" 
                style={{ top: position.top, left: position.left }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => handleCategoryPress(cat.id)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold text-white transition-all duration-300 cursor-pointer",
                    getStatusColor(status),
                    "shadow-lg hover:scale-110",
                    isSelected ? "ring-2 ring-white scale-125" : "animate-pulse"
                  )}
                  data-testid={`button-anatomy-${cat.id}`}
                >
                  {getStatusIcon(status)}
                  <span className="font-arabic text-[8px] hidden md:inline">{position.label}</span>
                </button>
                
                {/* Fault details popup */}
                {isSelected && catItems.length > 0 && (
                  <div 
                    className="absolute top-full mt-2 right-0 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-3 min-w-[180px] max-w-[250px] z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                      <span className="font-bold text-xs text-slate-800 font-arabic">{cat.label}</span>
                      <span className="text-[10px] text-slate-500">{catItems.length}</span>
                    </div>
                    <div className="space-y-2 max-h-[120px] overflow-y-auto">
                      {catItems.map((item, idx) => (
                        <div 
                          key={idx}
                          className={cn(
                            "p-2 rounded-lg text-xs",
                            item.status === 'fail' ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            {item.status === 'fail' ? 
                              <XCircle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" /> : 
                              <AlertCircle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                            }
                            <p className={cn(
                              "font-bold font-arabic leading-tight text-[11px]",
                              item.status === 'fail' ? "text-red-700" : "text-amber-700"
                            )}>
                              {item.faultName.split(' - ')[0]}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* View Indicators (dots) */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-2">
        {CAR_CUTAWAY_VIEWS.map((view, idx) => (
          <button
            key={view.angle}
            onClick={() => { setCurrentViewIndex(idx); setSelectedCategory(null); }}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              idx === currentViewIndex 
                ? "bg-[#C5852C] w-6" 
                : "bg-white/30 w-2 hover:bg-white/50"
            )}
            data-testid={`button-view-${view.angle}`}
          />
        ))}
      </div>

      {/* Legend & Hint */}
      <div className="absolute bottom-2 left-0 right-0 space-y-1">
        <div className="flex justify-center gap-4 md:gap-6">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="text-[9px] md:text-[10px] text-white/70 font-arabic">سليم</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            <span className="text-[9px] md:text-[10px] text-white/70 font-arabic">تحذير</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
            <span className="text-[9px] md:text-[10px] text-white/70 font-arabic">خطير</span>
          </div>
        </div>
        <p className="text-center text-[8px] md:text-[9px] text-white/40 font-arabic">
          اسحب لتدوير السيارة 360° • اضغط على العلامة لمعرفة التفاصيل
        </p>
      </div>
    </div>
  );
};

export default function PublicReport() {
  const [, params] = useRoute("/view/:token");
  const token = params?.token;
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [introComplete, setIntroComplete] = useState(false);
  
  const { data: inspection, isLoading, error } = useQuery<InspectionWithItems>({
    queryKey: ['/api/public/report', token],
    queryFn: async () => {
      const res = await fetch(`/api/public/report/${token}`);
      if (!res.ok) throw new Error('Report not found');
      return res.json();
    },
    enabled: !!token
  });

  const handleIntroComplete = () => {
    setIntroComplete(true);
    setTimeout(() => setShowIntro(false), 100);
  };

  const handleCategoryClick = (catId: string) => {
    setHighlightedCategory(catId);
    const element = document.getElementById(`category-${catId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setHighlightedCategory(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <>
        {showIntro && <IntroAnimation onComplete={handleIntroComplete} duration={4500} />}
      </>
    );
  }

  if (error || !inspection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-lg rounded-3xl p-12">
          <XCircle className="w-20 h-20 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2 font-arabic">التقرير غير موجود</h1>
          <p className="text-white/60 font-arabic">الرابط غير صحيح أو انتهت صلاحيته</p>
        </div>
      </div>
    );
  }

  const items = inspection.items || [];
  const issueItems = items.filter(i => i.status === 'fail' || i.status === 'warning');
  const failCount = items.filter(i => i.status === 'fail').length;
  const warningCount = items.filter(i => i.status === 'warning').length;

  const getOverallStatus = () => {
    if (failCount > 0) return { label: 'يحتاج مراجعة', color: 'text-red-400', bg: 'bg-red-500/20', icon: XCircle };
    if (warningCount > 0) return { label: 'تحذيرات', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: AlertCircle };
    return { label: 'ممتازة', color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: CheckCircle2 };
  };

  const status = getOverallStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" dir="rtl">
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} duration={4500} />}
      
      {selectedImage && (
        <ImageModal 
          imageUrl={selectedImage.url} 
          faultName={selectedImage.name} 
          onClose={() => setSelectedImage(null)} 
        />
      )}
      
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        
        <div className="relative bg-gradient-to-br from-[#0C1A28] via-[#0f1f2e] to-[#0C1A28] rounded-3xl p-6 md:p-8 text-white shadow-2xl overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
            <img 
              src={logoPath} 
              alt="" 
              className="w-64 h-64 md:w-80 md:h-80 object-contain opacity-[0.06]"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0C1A28]/30 to-[#0C1A28] pointer-events-none" />
          
          <div className="relative z-10">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#C5852C] to-transparent" />
                <ShieldCheck className="w-10 h-10 text-[#C5852C]" />
                <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#C5852C] to-transparent" />
              </div>
              
              <h1 className="text-2xl md:text-3xl font-black mb-2 font-arabic text-white drop-shadow-lg">
                مركز فحص الأمان العالي الدولي
              </h1>
              <p className="text-[#C5852C] text-sm md:text-base font-bold tracking-widest mb-4 drop-shadow-md">
                HIGH SAFETY INTERNATIONAL INSPECTION CENTER
              </p>
              
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-[#C5852C]" />
                <div className="w-2 h-2 rounded-full bg-[#C5852C]" />
                <div className="w-2 h-2 rounded-full bg-[#C5852C]" />
              </div>
              
              <p className="text-white/80 text-sm font-arabic font-semibold">تقرير الفحص التفاعلي</p>
            </div>

          </div>
        </div>

        {/* Vehicle Info Section - Before Car Visualization */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 font-arabic text-slate-800">
            <Car className="w-6 h-6 text-primary" />
            معلومات السيارة
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4">
            <div className="bg-slate-50 rounded-lg md:rounded-xl p-2 md:p-3">
              <div className="text-xs md:text-sm text-slate-500 font-arabic mb-1">الشركة المصنعة</div>
              <div className="font-bold text-base md:text-lg text-slate-800 truncate">{inspection.make || '-'}</div>
            </div>
            <div className="bg-slate-50 rounded-lg md:rounded-xl p-2 md:p-3">
              <div className="text-xs md:text-sm text-slate-500 font-arabic mb-1">الموديل</div>
              <div className="font-bold text-base md:text-lg text-slate-800 truncate">{inspection.model || '-'}</div>
            </div>
            <div className="bg-slate-50 rounded-lg md:rounded-xl p-2 md:p-3">
              <div className="text-xs md:text-sm text-slate-500 font-arabic mb-1">سنة الصنع</div>
              <div className="font-bold text-base md:text-lg text-slate-800">{inspection.year || '-'}</div>
            </div>
            <div className="bg-slate-50 rounded-lg md:rounded-xl p-2 md:p-3">
              <div className="text-xs md:text-sm text-slate-500 font-arabic mb-1 flex items-center gap-1">
                <Palette className="w-3 h-3" />
                اللون
              </div>
              <div className="flex items-center gap-2">
                <span 
                  className="w-5 h-5 rounded-full border border-slate-200 shrink-0" 
                  style={{ backgroundColor: getVehicleColor(inspection.color).hex }}
                />
                <span className="font-bold text-base md:text-lg text-slate-800 truncate">
                  {getVehicleColor(inspection.color).ar}
                </span>
              </div>
            </div>
          </div>
          
          {/* VIN Section - Click to reveal photo */}
          <div className="mb-4 bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Car className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 font-arabic text-sm">رقم الهيكل (VIN)</h3>
                {inspection.vinPhoto && (
                  <p className="text-xs text-primary font-arabic flex items-center gap-1">
                    <ZoomIn className="w-3 h-3" />
                    اضغط على اللوحة لعرض الصورة الأصلية
                  </p>
                )}
              </div>
            </div>
            <VinPlate 
              vin={inspection.vin}
              make={inspection.make}
              model={inspection.model}
              year={inspection.year}
              vinPhoto={inspection.vinPhoto}
              className="max-w-md mx-auto"
            />
          </div>
          
          {/* Odometer Section - Click to reveal photo */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Gauge className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 font-arabic text-sm">قراءة العداد</h3>
                {inspection.odometerPhoto && (
                  <p className="text-xs text-primary font-arabic flex items-center gap-1">
                    <ZoomIn className="w-3 h-3" />
                    اضغط على العداد لعرض الصورة الأصلية
                  </p>
                )}
              </div>
            </div>
            <LuxuryOdometer 
              odometer={inspection.odometer || 0} 
              odometerPhoto={inspection.odometerPhoto}
            />
          </div>
          
          {inspection.inspectionType && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="bg-primary/10 rounded-lg md:rounded-xl p-3 md:p-4 text-center">
                <div className="text-xs md:text-sm text-slate-500 font-arabic mb-1">نوع الفحص</div>
                <div className="font-bold text-lg md:text-xl text-primary">
                  {getInspectionTypeLabel(inspection.inspectionType).ar}
                </div>
                <div className="text-sm text-slate-500">
                  {getInspectionTypeLabel(inspection.inspectionType).en}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Car Visualization - After Vehicle Info */}
        <CarAnatomyVisualization items={issueItems} onCategoryClick={handleCategoryClick} />

        {/* Car Section Photos Gallery */}
        <CarSectionPhotosGallery inspection={inspection} />

        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 text-center shadow-sm border border-slate-100">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-amber-600">{warningCount}</div>
            <div className="text-xs md:text-sm text-slate-600 font-arabic font-semibold">تحذير</div>
          </div>
          <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 text-center shadow-sm border border-slate-100">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-2">
              <XCircle className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-red-600">{failCount}</div>
            <div className="text-xs md:text-sm text-slate-600 font-arabic font-semibold">خطير</div>
          </div>
        </div>

        {issueItems.length > 0 && (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold flex items-center gap-2 font-arabic text-slate-800">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                نتائج الفحص
              </h2>
              <p className="text-slate-500 text-sm mt-1 font-arabic">اضغط على الصورة لتكبيرها</p>
            </div>
            
            <div className="divide-y divide-slate-100">
              {INSPECTION_CATEGORIES.map(cat => {
                const catItems = issueItems.filter(i => i.category === cat.id);
                if (catItems.length === 0) return null;
                
                const isHighlighted = highlightedCategory === cat.id;
                
                return (
                  <div 
                    key={cat.id} 
                    id={`category-${cat.id}`}
                    className={cn(
                      "p-4 transition-all duration-300",
                      isHighlighted && "bg-primary/5 ring-2 ring-primary ring-inset"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-slate-700 font-arabic">{cat.label}</h3>
                      <span className="text-xs text-slate-400">{cat.labelEn}</span>
                    </div>
                    <div className="space-y-3">
                      {catItems.map(item => (
                        <div 
                          key={item.id} 
                          className={cn(
                            "p-4 rounded-xl flex flex-col md:flex-row-reverse gap-4",
                            item.status === 'fail' ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'
                          )}
                        >
                          {item.imageUrl && (
                            <button
                              onClick={() => setSelectedImage({ url: item.imageUrl!, name: item.faultName.split(' - ')[0] })}
                              className="relative w-full md:w-32 h-32 rounded-xl overflow-hidden shrink-0 group cursor-pointer"
                            >
                              <img src={item.imageUrl} alt="صورة العطل" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </button>
                          )}
                          <div className="flex-1 text-right">
                            <div className="flex items-start gap-3">
                              {item.status === 'fail' ? <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-1" /> :
                               <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-1" />}
                              <div className="flex-1">
                                <div className="font-bold text-slate-800 font-arabic text-lg">{item.faultName.split(' - ')[0]}</div>
                                {item.faultName.split(' - ')[1] && (
                                  <p className="text-xs text-slate-400 font-mono">{item.faultName.split(' - ')[1]}</p>
                                )}
                                {item.description && (
                                  <p className="text-sm text-slate-600 mt-2 font-arabic leading-relaxed">{item.description}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {issueItems.length === 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-emerald-800 font-arabic mb-2">المركبة في حالة ممتازة</h3>
            <p className="text-emerald-600 font-arabic">لا توجد ملاحظات على المركبة</p>
          </div>
        )}

        {/* OBD Codes Section - Professional HS Report */}
        {(() => {
          const obdCodes = (inspection.obdCodes as Array<{code: string; nameEn: string; nameAr: string}> | null) || [];
          if (obdCodes.length === 0) return null;
          const getCodeType = (code: string) => {
            const p = code.charAt(0).toUpperCase();
            if (p === 'P') return { color: 'bg-red-600', label: 'Powertrain', labelAr: 'المحرك وناقل الحركة' };
            if (p === 'C') return { color: 'bg-amber-600', label: 'Chassis', labelAr: 'الشاصي' };
            if (p === 'B') return { color: 'bg-blue-600', label: 'Body', labelAr: 'الهيكل' };
            if (p === 'U') return { color: 'bg-purple-600', label: 'Network', labelAr: 'شبكة الاتصال' };
            return { color: 'bg-slate-600', label: 'Other', labelAr: 'أخرى' };
          };
          return (
            <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-200" data-testid="obd-report-section">
              <div className="bg-gradient-to-l from-slate-800 via-slate-900 to-black text-white p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-black text-xs">HS</span>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-mono" dir="ltr">HIGH SAFETY</div>
                      <div className="text-[10px] text-slate-400 font-mono" dir="ltr">DIAGNOSTIC REPORT</div>
                    </div>
                  </div>
                  <div className="text-left" dir="ltr">
                    <div className="text-[10px] text-slate-400 font-mono">CODES FOUND</div>
                    <div className="text-2xl font-black text-emerald-400">{obdCodes.length}</div>
                  </div>
                </div>
                <div className="text-center border-t border-white/10 pt-3">
                  <h3 className="text-lg font-black font-arabic">تقرير فحص كمبيوتر السيارة</h3>
                  <p className="text-slate-400 text-xs font-mono mt-0.5" dir="ltr">OBD-II Diagnostic Trouble Codes Report</p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {obdCodes.map((obd, idx) => {
                  const type = getCodeType(obd.code);
                  return (
                    <div key={idx} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                      <div className="shrink-0 pt-0.5">
                        <div className={`font-mono font-black text-white text-sm px-3 py-1.5 rounded-lg ${type.color} shadow-sm min-w-[70px] text-center`}>{obd.code}</div>
                        <div className="text-[9px] text-center text-slate-400 mt-1 font-arabic">{type.labelAr}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-900 font-arabic leading-snug">{obd.nameAr}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5 leading-snug" dir="ltr">{obd.nameEn}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono" dir="ltr">HIGH SAFETY INSPECTION CENTER</span>
                <span className="text-[10px] text-slate-400 font-mono" dir="ltr">HS-OBD-{String(inspection.id).padStart(4, '0')}</span>
              </div>
            </div>
          );
        })()}

        {/* Terms and Conditions */}
        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 text-center font-arabic">
            الأحكام والشروط | Terms & Conditions
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3 items-start">
              <span className="text-primary font-bold min-w-[24px]">1.</span>
              <div>
                <p className="text-slate-700 font-arabic">المركز غير مسئول عن أي أعطال تحدث أثناء الفحص أو بعده.</p>
                <p className="text-slate-500 text-xs">The center is not responsible for any malfunctions occurring during or after inspection.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-primary font-bold min-w-[24px]">2.</span>
              <div>
                <p className="text-slate-700 font-arabic">المركز مسئول عن نتيجة الفحص وقت الفحص فقط وغير مسئول بعد خروج المركبة من الفحص.</p>
                <p className="text-slate-500 text-xs">The center is only responsible for inspection results at the time of inspection.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-primary font-bold min-w-[24px]">3.</span>
              <div>
                <p className="text-slate-700 font-arabic">هذا الفحص غير معتمد لدى إدارة التراخيص.</p>
                <p className="text-slate-500 text-xs">This inspection is not approved by the Licensing Authority.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-primary font-bold min-w-[24px]">4.</span>
              <div>
                <p className="text-slate-700 font-arabic">المركز غير مسئول عن أي أغراض شخصية داخل السيارة أثناء الفحص.</p>
                <p className="text-slate-500 text-xs">The center is not responsible for any personal belongings inside the vehicle.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-primary font-bold min-w-[24px]">5.</span>
              <div>
                <p className="text-slate-700 font-arabic">يعتبر هذا التقرير لحالة المركبة حسب قراءة الأجهزة في وقت الفحص.</p>
                <p className="text-slate-500 text-xs">This report reflects the vehicle condition based on device readings at inspection time.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with WhatsApp CTA */}
        <div className="bg-gradient-to-br from-[#0C1A28] via-[#0f1f2e] to-[#0C1A28] rounded-2xl p-8 text-center text-white border border-[#C5852C]/20">
          <img src={logoPath} alt="High Safety" className="h-16 mx-auto mb-4 drop-shadow-lg" />
          <div className="bg-[#C5852C]/10 rounded-xl px-6 py-3 inline-block mb-3 border border-[#C5852C]/30">
            <h3 className="text-xl md:text-2xl font-black font-arabic text-[#C5852C] tracking-wide drop-shadow-sm">
              هاي سيفتي انترناشيونال
            </h3>
            <p className="text-[#C5852C]/80 text-sm font-bold tracking-widest mt-1">
              HIGH SAFETY INTERNATIONAL
            </p>
          </div>
          <p className="text-white/70 text-sm font-arabic font-medium">
            مركز فحص السيارات - الشارقة، الإمارات
          </p>
          
          {/* WhatsApp CTA Button */}
          <a 
            href="https://wa.me/971542206000" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-8 rounded-2xl mt-6 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105"
            data-testid="link-whatsapp-footer"
          >
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span className="font-arabic text-lg">تواصل معنا واتساب</span>
            <span className="font-mono text-lg">0542206000</span>
          </a>
          
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-white/70">
              <MapPin className="w-4 h-4" />
              <span className="font-arabic">سيتي بلازا الدراري - الشارقة</span>
            </div>
          </div>
          <p className="text-white/40 text-sm mt-4 font-arabic">
            تاريخ التقرير: {new Date().toLocaleDateString('ar-AE', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

      </div>
    </div>
  );
}
