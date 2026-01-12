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
import logoPath from "@assets/logo_1767706304085.png";
import { VinPlate } from "@/components/vin-plate";
import carFrontView from "@assets/generated_images/car_front_view_diagram.png";
import carRightView from "@assets/generated_images/car_right_side_view.png";
import carRearView from "@assets/generated_images/car_rear_view_diagram.png";
import carLeftView from "@assets/generated_images/car_left_side_view.png";
import type { Inspection, InspectionItem } from "@shared/schema";
import { INSPECTION_CATEGORIES, CATEGORY_GROUPS } from "@shared/categories";
import { LuxuryOdometer } from "@/components/luxury-odometer";
import { IntroAnimation } from "@/components/intro-animation";
import { ChevronLeft, ChevronRight } from "lucide-react";

type InspectionWithItems = Inspection & { items: InspectionItem[] };

// Car views configuration
type ViewAngle = 'front' | 'right' | 'rear' | 'left';
const CAR_VIEWS: { angle: ViewAngle; image: string; label: string }[] = [
  { angle: 'front', image: carFrontView, label: 'الأمام' },
  { angle: 'right', image: carRightView, label: 'الجانب الأيمن' },
  { angle: 'rear', image: carRearView, label: 'الخلف' },
  { angle: 'left', image: carLeftView, label: 'الجانب الأيسر' },
];

// Category positions for each viewing angle
const CATEGORY_POSITIONS_BY_VIEW: Record<ViewAngle, Record<string, { top: string; left: string }>> = {
  front: {
    engine: { top: "55%", left: "50%" },
    suspension_system: { top: "85%", left: "30%" },
    steering_system: { top: "65%", left: "50%" },
    brake_system: { top: "88%", left: "25%" },
    ac_cooling: { top: "60%", left: "40%" },
    hood: { top: "35%", left: "50%" },
    front_bumper: { top: "78%", left: "50%" },
    exterior_lighting: { top: "45%", left: "25%" },
    windows: { top: "25%", left: "50%" },
    tires_rims: { top: "88%", left: "75%" },
  },
  right: {
    door_front_right: { top: "40%", left: "35%" },
    door_rear_right: { top: "40%", left: "60%" },
    fender_front_right: { top: "50%", left: "18%" },
    fender_rear_right: { top: "50%", left: "82%" },
    quarter_panel: { top: "45%", left: "75%" },
    pillars: { top: "30%", left: "45%" },
    roof: { top: "22%", left: "50%" },
    windows: { top: "32%", left: "55%" },
    tires_rims: { top: "85%", left: "25%" },
    engine: { top: "55%", left: "15%" },
  },
  rear: {
    trunk: { top: "35%", left: "50%" },
    rear_bumper: { top: "78%", left: "50%" },
    rear_chest: { top: "65%", left: "50%" },
    fender_rear_right: { top: "50%", left: "20%" },
    fender_rear_left: { top: "50%", left: "80%" },
    exterior_lighting: { top: "45%", left: "25%" },
    windows: { top: "25%", left: "50%" },
    tires_rims: { top: "88%", left: "75%" },
    fuel_exhaust: { top: "70%", left: "50%" },
  },
  left: {
    door_front_left: { top: "40%", left: "65%" },
    door_rear_left: { top: "40%", left: "40%" },
    fender_front_left: { top: "50%", left: "82%" },
    fender_rear_left: { top: "50%", left: "18%" },
    quarter_panel: { top: "45%", left: "25%" },
    pillars: { top: "30%", left: "55%" },
    roof: { top: "22%", left: "50%" },
    windows: { top: "32%", left: "45%" },
    tires_rims: { top: "85%", left: "75%" },
    engine: { top: "55%", left: "85%" },
  },
};

// Legacy fallback positions
const CATEGORY_POSITIONS: Record<string, { top: string; left: string }> = {
  front_bumper: { top: "42%", left: "8%" },
  rear_bumper: { top: "42%", left: "92%" },
  hood: { top: "25%", left: "15%" },
  trunk: { top: "25%", left: "85%" },
  engine: { top: "55%", left: "18%" },
  tires_rims: { top: "92%", left: "25%" },
};

// Get position with fallback
const getCategoryPosition = (catId: string, currentView: ViewAngle): { top: string; left: string } => {
  const viewPositions = CATEGORY_POSITIONS_BY_VIEW[currentView];
  if (viewPositions[catId]) return viewPositions[catId];
  if (CATEGORY_POSITIONS[catId]) return CATEGORY_POSITIONS[catId];
  return { top: "50%", left: "50%" };
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

const Car3DVisualization = ({ items, onCategoryClick }: { items: InspectionItem[], onCategoryClick: (cat: string) => void }) => {
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragDistance, setDragDistance] = useState(0);

  const currentView = CAR_VIEWS[currentViewIndex];

  // Auto-rotate through views (pause when popup is open)
  useEffect(() => {
    if (!isAutoRotating || isDragging || selectedCategory) return;
    const interval = setInterval(() => {
      setCurrentViewIndex(prev => (prev + 1) % CAR_VIEWS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isAutoRotating, isDragging, selectedCategory]);

  const goToView = (direction: 'next' | 'prev') => {
    setCurrentViewIndex(prev => {
      if (direction === 'next') return (prev + 1) % CAR_VIEWS.length;
      return prev === 0 ? CAR_VIEWS.length - 1 : prev - 1;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setDragDistance(0);
    setIsAutoRotating(false);
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
    setTimeout(() => setIsAutoRotating(true), 500);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setDragDistance(0);
    setIsAutoRotating(false);
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
    setTimeout(() => setIsAutoRotating(true), 500);
  };

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

  return (
    <div className="relative w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-3xl overflow-hidden">
      {/* Header stats */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-1.5 text-white text-xs font-arabic">
          {currentView.label}
        </div>
        <div className="flex gap-2">
          {stats.warning > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{stats.warning}</span>
            </div>
          )}
          {stats.fail > 0 && (
            <div className="flex items-center gap-1.5 bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm">
              <XCircle className="w-3.5 h-3.5" />
              <span>{stats.fail}</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={() => goToView('prev')}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        data-testid="button-view-prev"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => goToView('next')}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        data-testid="button-view-next"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Car visualization with drag/swipe */}
      <div 
        className="relative w-full aspect-square md:aspect-[16/10] flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white/5 to-transparent" />
        
        <div className="relative w-[85%] h-[75%]">
          <img 
            src={currentView.image} 
            alt={`Vehicle - ${currentView.label}`} 
            className="w-full h-full object-contain drop-shadow-2xl"
          />

          {/* Category indicators */}
          {INSPECTION_CATEGORIES.map(cat => {
            const position = getCategoryPosition(cat.id, currentView.angle);
            const status = getCategoryStatus(cat.id);
            const hasIssues = status !== 'good';
            const catItems = getCategoryItems(cat.id);
            const isSelected = selectedCategory === cat.id;

            if (!hasIssues) return null;
            
            return (
              <div 
                key={cat.id} 
                className="absolute z-10 transition-all duration-300" 
                style={position as any}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); handleCategoryPress(cat.id); }}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold text-white transition-all duration-300 cursor-pointer",
                    getStatusColor(status),
                    "shadow-lg hover:scale-110",
                    isSelected ? "ring-2 ring-white scale-110" : "animate-pulse"
                  )}
                  data-testid={`button-category-${cat.id}`}
                >
                  {getStatusIcon(status)}
                </button>
                
                {/* Fault details popup */}
                {isSelected && catItems.length > 0 && (
                  <div 
                    className="absolute top-full mt-2 right-0 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-3 min-w-[200px] max-w-[280px] z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                      <span className="font-bold text-xs text-slate-800 font-arabic">{cat.label}</span>
                      <span className="text-[10px] text-slate-500">{catItems.length}</span>
                    </div>
                    <div className="space-y-2 max-h-[150px] overflow-y-auto">
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
                              "font-bold font-arabic leading-tight",
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
      <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-2">
        {CAR_VIEWS.map((view, idx) => (
          <button
            key={view.angle}
            onClick={(e) => { e.stopPropagation(); setCurrentViewIndex(idx); }}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-all",
              idx === currentViewIndex 
                ? "bg-accent w-8" 
                : "bg-white/30 hover:bg-white/50"
            )}
            data-testid={`button-view-${view.angle}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-0 right-0 space-y-2">
        <div className="flex justify-center gap-6 text-xs font-bold font-arabic text-white/80">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
          </div>
        </div>
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
          <h1 className="text-2xl font-bold text-white mb-2 font-arabic">التقرير مو موجود</h1>
          <p className="text-white/60 font-arabic">اللينك غلط أو انتهت صلاحيته</p>
        </div>
      </div>
    );
  }

  const items = inspection.items || [];
  const issueItems = items.filter(i => i.status === 'fail' || i.status === 'warning');
  const failCount = items.filter(i => i.status === 'fail').length;
  const warningCount = items.filter(i => i.status === 'warning').length;

  const getOverallStatus = () => {
    if (failCount > 0) return { label: 'يوجد ملاحظات', color: 'text-red-400', bg: 'bg-red-500/20', icon: XCircle };
    if (warningCount > 0) return { label: 'يوجد ملاحظات', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: AlertCircle };
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
        
        <div className="relative bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 rounded-3xl p-6 md:p-8 text-white shadow-2xl overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
            <img 
              src={logoPath} 
              alt="" 
              className="w-64 h-64 md:w-80 md:h-80 object-contain opacity-[0.08]"
              style={{ filter: 'brightness(1.5) contrast(0.8)' }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neutral-900/50 to-neutral-950 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
                <ShieldCheck className="w-10 h-10 text-amber-500" />
                <div className="h-px flex-1 bg-gradient-to-l from-transparent via-amber-500/60 to-transparent" />
              </div>
              
              <h1 className="text-2xl md:text-3xl font-black mb-2 font-arabic text-white">
                مركز فحص الأمان العالي الدولي
              </h1>
              <p className="text-amber-400 text-sm md:text-base font-bold tracking-widest mb-4">
                HIGH SAFETY INTERNATIONAL INSPECTION CENTER
              </p>
              
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <div className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              
              <p className="text-white/50 text-sm font-arabic">تقرير الفحص التفاعلي</p>
            </div>

            <div className={cn("flex items-center justify-center gap-3 py-4 rounded-2xl", status.bg)}>
              <status.icon className={cn("w-8 h-8", status.color)} />
              <span className={cn("text-2xl font-black font-arabic", status.color)}>{status.label}</span>
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
          
          {/* VIN Plate */}
          <div className="mb-4">
            <VinPlate 
              vin={inspection.vin}
              make={inspection.make}
              model={inspection.model}
              year={inspection.year}
              vinPhoto={inspection.vinPhoto}
              className="max-w-md mx-auto"
            />
          </div>
          
          <LuxuryOdometer 
            odometer={inspection.odometer || 0} 
            odometerPhoto={inspection.odometerPhoto}
          />
          
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
        <Car3DVisualization items={issueItems} onCategoryClick={handleCategoryClick} />

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
                الأعطال والملاحظات
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
            <h3 className="text-xl font-bold text-emerald-800 font-arabic mb-2">السيارة حالتها ممتازة</h3>
            <p className="text-emerald-600 font-arabic">ما لقينا أي أعطال أو ملاحظات</p>
          </div>
        )}

        {/* Customer Signature */}
        {inspection.customerSignature && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold mb-4 font-arabic text-slate-800 text-center">توقيع العميل</h2>
            <div className="flex justify-center">
              <img 
                src={inspection.customerSignature} 
                alt="توقيع العميل" 
                className="max-h-24 border border-slate-200 rounded-lg bg-white p-2"
              />
            </div>
          </div>
        )}

        <div className="bg-slate-900 rounded-2xl p-8 text-center text-white">
          <img src={logoPath} alt="High Safety" className="h-14 mx-auto mb-4" />
          <h3 className="text-lg font-bold font-arabic mb-2">
            هاي سيفتي انترناشيونال
          </h3>
          <p className="text-white/60 text-sm font-arabic">
            مركز فحص السيارات - الشارقة، الإمارات
          </p>
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-white/70">
              <Phone className="w-4 h-4" />
              <span className="font-mono">0542206000</span>
            </div>
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
