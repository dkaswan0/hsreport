import { useInspection } from "@/hooks/use-inspections";
import { useRoute } from "wouter";
import { 
  Printer, 
  Download,
  Car,
  Phone,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  Gauge,
  Share2,
  Mail,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Fuel,
  RotateCcw,
  Palette,
  ZoomIn,
  Monitor,
  ExternalLink,
  Stethoscope,
  Wrench,
  Sparkles,
  Search,
  X,
} from "lucide-react";
import { PhosphorIcon } from "@/components/phosphor-icon";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import logoPath from "@assets/hs-logo.png";
import hsBannerPath from "@assets/hs-banner.jpeg";
import { PdfCoverPage, PdfReportTemplate, PdfCarPhotosPage, PdfSignaturesPage } from "@/components/pdf-report-template";
import carVisualizationPath from "@assets/generated_images/professional_car_anatomy_diagram.png";
import carFrontView from "@assets/generated_images/car_front_view_diagram.png";
import carRightView from "@assets/generated_images/car_right_side_view.png";
import carRearView from "@assets/generated_images/car_rear_view_diagram.png";
import carLeftView from "@assets/generated_images/car_left_side_view.png";
import { INSPECTION_CATEGORIES, CATEGORY_GROUPS } from "@shared/categories";
import { getVehicleColor, calculateInspectionStats } from "@/lib/vehicle-utils";
import { VinPlate } from "@/components/vin-plate";

// Car views configuration
type ViewAngle = 'front' | 'right' | 'rear' | 'left';
const CAR_VIEWS: { angle: ViewAngle; image: string; label: string; labelEn: string }[] = [
  { angle: 'front', image: carFrontView, label: 'الأمام', labelEn: 'Front' },
  { angle: 'right', image: carRightView, label: 'الجانب الأيمن', labelEn: 'Right' },
  { angle: 'rear', image: carRearView, label: 'الخلف', labelEn: 'Rear' },
  { angle: 'left', image: carLeftView, label: 'الجانب الأيسر', labelEn: 'Left' },
];

// Category positions for each viewing angle - comprehensive coverage for all categories
const CATEGORY_POSITIONS_BY_VIEW: Record<ViewAngle, Record<string, { top: string; left: string }>> = {
  front: {
    // Mechanical
    engine: { top: "55%", left: "50%" },
    suspension_system: { top: "85%", left: "30%" },
    steering_system: { top: "65%", left: "50%" },
    misc_mechanical: { top: "70%", left: "35%" },
    brake_system: { top: "88%", left: "25%" },
    fuel_exhaust: { top: "75%", left: "65%" },
    ac_cooling: { top: "60%", left: "40%" },
    // Body
    hood: { top: "35%", left: "50%" },
    front_bumper: { top: "78%", left: "50%" },
    bumper_frame_front: { top: "82%", left: "50%" },
    front_chest: { top: "70%", left: "50%" },
    fender_front_right: { top: "50%", left: "20%" },
    fender_front_left: { top: "50%", left: "80%" },
    // Electric
    exterior_lighting: { top: "45%", left: "25%" },
    battery: { top: "58%", left: "65%" },
    electrical_system: { top: "52%", left: "35%" },
    wire_harness: { top: "48%", left: "45%" },
    // Other
    windows: { top: "25%", left: "50%" },
    tires_rims: { top: "88%", left: "75%" },
    glass_mirrors: { top: "30%", left: "35%" },
    safety_systems: { top: "42%", left: "50%" },
  },
  right: {
    // Body
    door_front_right: { top: "40%", left: "35%" },
    door_rear_right: { top: "40%", left: "60%" },
    fender_front_right: { top: "50%", left: "18%" },
    fender_rear_right: { top: "50%", left: "82%" },
    quarter_panel: { top: "45%", left: "75%" },
    pillars: { top: "30%", left: "45%" },
    trunk: { top: "35%", left: "88%" },
    roof: { top: "20%", left: "50%" },
    // Mechanical
    engine: { top: "60%", left: "15%" },
    suspension_system: { top: "75%", left: "30%" },
    steering_system: { top: "72%", left: "22%" },
    brake_system: { top: "82%", left: "25%" },
    fuel_exhaust: { top: "85%", left: "85%" },
    ac_cooling: { top: "55%", left: "18%" },
    misc_mechanical: { top: "68%", left: "40%" },
    // Transmission
    transmission_system: { top: "70%", left: "45%" },
    // Chassis
    chassis_frame: { top: "78%", left: "55%" },
    // Other
    windows: { top: "25%", left: "50%" },
    tires_rims: { top: "85%", left: "22%" },
    interior: { top: "35%", left: "45%" },
    glass_mirrors: { top: "32%", left: "28%" },
    accessories: { top: "38%", left: "55%" },
  },
  rear: {
    // Body
    trunk: { top: "35%", left: "50%" },
    rear_bumper: { top: "78%", left: "50%" },
    bumper_frame_rear: { top: "82%", left: "50%" },
    rear_chest: { top: "55%", left: "50%" },
    fender_rear_right: { top: "50%", left: "20%" },
    fender_rear_left: { top: "50%", left: "80%" },
    quarter_panel: { top: "45%", left: "25%" },
    roof: { top: "20%", left: "50%" },
    // Electric
    lights_rear: { top: "45%", left: "25%" },
    exterior_lighting: { top: "45%", left: "75%" },
    electrical_system: { top: "60%", left: "65%" },
    // Mechanical
    fuel_exhaust: { top: "85%", left: "40%" },
    suspension_system: { top: "75%", left: "30%" },
    brake_system: { top: "80%", left: "70%" },
    // Chassis
    chassis_frame: { top: "70%", left: "50%" },
    // Other
    tires_rims: { top: "88%", left: "20%" },
    windows: { top: "28%", left: "50%" },
    safety_systems: { top: "62%", left: "35%" },
  },
  left: {
    // Body
    door_front_left: { top: "40%", left: "35%" },
    door_rear_left: { top: "40%", left: "60%" },
    fender_front_left: { top: "50%", left: "18%" },
    fender_rear_left: { top: "50%", left: "82%" },
    quarter_panel: { top: "45%", left: "75%" },
    pillars: { top: "30%", left: "55%" },
    trunk: { top: "35%", left: "88%" },
    roof: { top: "20%", left: "50%" },
    // Mechanical
    engine: { top: "60%", left: "15%" },
    suspension_system: { top: "75%", left: "70%" },
    steering_system: { top: "72%", left: "78%" },
    brake_system: { top: "82%", left: "75%" },
    fuel_exhaust: { top: "85%", left: "15%" },
    ac_cooling: { top: "55%", left: "82%" },
    misc_mechanical: { top: "68%", left: "60%" },
    // Transmission
    transmission_system: { top: "70%", left: "55%" },
    // Chassis
    chassis_frame: { top: "78%", left: "45%" },
    // Other
    windows: { top: "25%", left: "50%" },
    tires_rims: { top: "85%", left: "78%" },
    interior: { top: "35%", left: "55%" },
    glass_mirrors: { top: "32%", left: "72%" },
    accessories: { top: "38%", left: "45%" },
  },
};

// Default positions for unmapped categories (ensures all categories are visible)
const DEFAULT_CATEGORY_POSITIONS: Record<string, { top: string; left: string }> = {
  // Electric categories
  mirror_controls: { top: "35%", left: "50%" },
  // Documentation
  documentation: { top: "20%", left: "85%" },
  // Any remaining categories get a visible default position
};

// Get category position with fallback to legacy positions then default
const getCategoryPosition = (catId: string, currentView: ViewAngle): { top: string; left: string } => {
  const viewPositions = CATEGORY_POSITIONS_BY_VIEW[currentView];
  if (viewPositions[catId]) return viewPositions[catId];
  if (CATEGORY_POSITIONS[catId]) return CATEGORY_POSITIONS[catId];
  if (DEFAULT_CATEGORY_POSITIONS[catId]) return DEFAULT_CATEGORY_POSITIONS[catId];
  // Ultimate fallback - position at a visible location based on category section
  return { top: "50%", left: "50%" };
};

// Legacy position mapping (fallback for top-down view)
const CATEGORY_POSITIONS: Record<string, { top: string; left: string; transform?: string }> = {
  front_bumper: { top: "42%", left: "8%" },
  rear_bumper: { top: "42%", left: "92%" },
  bumper_frame_front: { top: "52%", left: "5%" },
  bumper_frame_rear: { top: "52%", left: "95%" },
  hood: { top: "25%", left: "15%" },
  front_chest: { top: "60%", left: "12%" },
  rear_chest: { top: "60%", left: "88%" },
  fender_front_right: { top: "35%", left: "20%" },
  fender_front_left: { top: "65%", left: "20%" },
  fender_rear_right: { top: "35%", left: "80%" },
  fender_rear_left: { top: "65%", left: "80%" },
  door_front_right: { top: "30%", left: "35%" },
  door_front_left: { top: "70%", left: "35%" },
  door_rear_right: { top: "30%", left: "55%" },
  door_rear_left: { top: "70%", left: "55%" },
  trunk: { top: "25%", left: "85%" },
  quarter_panel: { top: "45%", left: "75%" },
  roof: { top: "15%", left: "50%", transform: "translateX(-50%)" },
  pillars: { top: "20%", left: "45%" },
  windows: { top: "22%", left: "55%" },
  lights_front: { top: "38%", left: "5%" },
  lights_rear: { top: "38%", left: "95%" },
  interior: { top: "45%", left: "50%", transform: "translateX(-50%)" },
  chassis: { top: "85%", left: "50%", transform: "translateX(-50%)" },
  engine: { top: "55%", left: "18%" },
  transmission: { top: "65%", left: "35%" },
  transfer_case: { top: "75%", left: "45%" },
  differential: { top: "75%", left: "70%" },
  driveshaft: { top: "80%", left: "55%" },
  condenser: { top: "48%", left: "10%" },
  radiator: { top: "50%", left: "15%" },
  cooling_fan: { top: "55%", left: "12%" },
  turbo: { top: "58%", left: "22%" },
  water_pump: { top: "62%", left: "18%" },
  thermostat: { top: "52%", left: "20%" },
  control_arms: { top: "78%", left: "28%" },
  exhaust: { top: "88%", left: "65%" },
  tires: { top: "92%", left: "25%" },
  rims: { top: "92%", left: "75%" },
  brake_pads: { top: "88%", left: "30%" },
  brake_drums: { top: "88%", left: "70%" },
  brakes: { top: "85%", left: "35%" },
  suspension_arms: { top: "82%", left: "40%" },
  axles: { top: "82%", left: "60%" },
  fuel_tank: { top: "78%", left: "80%" },
  power_steering: { top: "68%", left: "25%" },
  fuel_pump: { top: "72%", left: "78%" },
  tie_rod: { top: "90%", left: "40%" },
  stabilizer_link: { top: "90%", left: "60%" },
};

const ImageModal = ({ imageUrl, faultName, onClose }: { imageUrl: string; faultName: string; onClose: () => void }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in"
      onClick={onClose}
      data-testid="image-lightbox-overlay"
      dir="rtl"
    >
      {/* Top Bar with Title and Close Button */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/60 to-transparent">
        <h3 className="text-white font-bold font-arabic text-base md:text-lg truncate max-w-[70%] text-right">{faultName}</h3>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="w-11 h-11 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-full flex items-center justify-center border border-white/20 transition-all cursor-pointer shadow-lg"
          title="إغلاق"
          data-testid="btn-close-lightbox"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Image Container */}
      <div className="relative max-w-5xl max-h-[80vh] w-full flex items-center justify-center animate-in scale-in duration-300" onClick={e => e.stopPropagation()}>
        <img 
          src={imageUrl} 
          alt={faultName} 
          className="max-w-full max-h-[80vh] object-contain rounded-2xl border border-white/10 shadow-2xl"
        />
      </div>

      {/* Dismiss Hint at the bottom */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <span className="bg-black/60 text-slate-300 text-xs px-4 py-2 rounded-full font-arabic backdrop-blur-sm border border-white/5">
          اضغط في أي مكان خارج الصورة أو على زر (X) للإغلاق
        </span>
      </div>
    </div>
  );
};

// Realistic 360° Car Visualization with 4 viewing angles
const Car360Visualization = ({ items, onCategoryClick }: { items: any[], onCategoryClick: (cat: string) => void }) => {
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragDistance, setDragDistance] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentView = CAR_VIEWS[currentViewIndex];

  // Auto-rotate through views (pause when popup is open)
  useEffect(() => {
    if (!isAutoRotating || isDragging || selectedCategory) return;
    const interval = setInterval(() => {
      setCurrentViewIndex(prev => (prev + 1) % CAR_VIEWS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isAutoRotating, isDragging, selectedCategory]);

  // Navigate to next/previous view
  const goToView = (direction: 'next' | 'prev') => {
    setCurrentViewIndex(prev => {
      if (direction === 'next') return (prev + 1) % CAR_VIEWS.length;
      return prev === 0 ? CAR_VIEWS.length - 1 : prev - 1;
    });
  };

  // Drag handlers for manual rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setDragDistance(0);
    setIsAutoRotating(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - startX;
    setDragDistance(delta);
  };

  const handleMouseUp = () => {
    if (isDragging && Math.abs(dragDistance) > 50) {
      goToView(dragDistance > 0 ? 'prev' : 'next');
    }
    setIsDragging(false);
    setDragDistance(0);
    // Resume auto-rotation after drag
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
    const delta = e.touches[0].clientX - startX;
    setDragDistance(delta);
  };

  const handleTouchEnd = () => {
    if (isDragging && Math.abs(dragDistance) > 50) {
      goToView(dragDistance > 0 ? 'prev' : 'next');
    }
    setIsDragging(false);
    setDragDistance(0);
    // Resume auto-rotation after touch
    setTimeout(() => setIsAutoRotating(true), 500);
  };

  const getCategoryStatus = (catId: string) => {
    const catItems = items.filter(i => i.category === catId);
    if (catItems.length === 0) return 'good';
    if (catItems.some(i => i.status === 'fail')) return 'fail';
    if (catItems.some(i => i.status === 'warning')) return 'warning';
    return 'good';
  };

  const getCategoryItems = (catId: string) => {
    return items.filter(i => i.category === catId);
  };

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

  const toggleAutoRotate = () => {
    setIsAutoRotating(!isAutoRotating);
  };

  // Calculate summary stats based on actual items count
  const stats = useMemo(() => {
    const pass = items.filter(i => i.status === 'pass').length;
    const warning = items.filter(i => i.status === 'warning').length;
    const fail = items.filter(i => i.status === 'fail').length;
    return { good: pass, warning, fail, total: items.length };
  }, [items]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-3xl overflow-hidden select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex flex-col md:flex-row justify-between items-center gap-3 z-20">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => { e.stopPropagation(); toggleAutoRotate(); }}
            className={cn(
              "backdrop-blur-sm text-white",
              isAutoRotating ? "bg-primary/50 hover:bg-primary/70" : "bg-white/10 hover:bg-white/20"
            )}
            data-testid="button-toggle-rotation"
          >
            <RotateCcw className={cn("w-5 h-5", isAutoRotating && "animate-spin")} />
          </Button>
          <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-bold text-white font-arabic">
            {currentView.label}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 bg-[#C5852C]/20 text-[#C5852C] border border-[#C5852C]/30 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm font-arabic">
            <span>الملاحظات المسجلة: {stats.total}</span>
          </div>
        </div>
      </div>

      {/* View Navigation Arrows */}
      <>
        <button
          onClick={(e) => { e.stopPropagation(); goToView('prev'); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-all"
          data-testid="button-prev-view"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); goToView('next'); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-all"
          data-testid="button-next-view"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </>

      {/* Car View Container */}
      <div className="relative w-full aspect-square md:aspect-[16/10] flex items-center justify-center pt-16">
        {/* Ground reflection */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white/5 to-transparent" />
        
        {/* Car Image with transition */}
        <div 
          className="relative w-[85%] h-[75%] transition-all duration-500 ease-out"
          style={{ 
            transform: `translateX(${isDragging ? dragDistance * 0.1 : 0}px)`,
            opacity: isDragging ? 0.8 : 1
          }}
        >
          <img 
            src={currentView.image} 
            alt={`Vehicle - ${currentView.labelEn}`} 
            className="w-full h-full object-contain drop-shadow-2xl"
          />

          {/* Category indicators for current view */}
          {INSPECTION_CATEGORIES.map(cat => {
            const position = getCategoryPosition(cat.id, currentView.angle);
            if (!position) return null;
            
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCategoryPress(cat.id);
                  }}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold text-white transition-all duration-300 cursor-pointer",
                    getStatusColor(status),
                    "shadow-lg hover:scale-110",
                    isSelected ? "ring-2 ring-white scale-110" : "animate-pulse"
                  )}
                  data-testid={`button-category-${cat.id}`}
                >
                  {getStatusIcon(status)}
                  <span className="hidden md:inline truncate max-w-[80px]">{cat.label}</span>
                </button>
                
                {/* Fault details popup */}
                {isSelected && (
                  <div 
                    className="absolute bottom-full mb-2 -translate-x-1/2 left-1/2 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-3 min-w-[200px] max-w-[280px] z-50 border border-slate-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                      <span className="font-bold text-xs text-slate-800 font-arabic">{cat.label}</span>
                      <span className="text-[10px] text-slate-500">{catItems.length} ملاحظة</span>
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
                            <div>
                              <p className={cn(
                                "font-bold font-arabic leading-tight",
                                item.status === 'fail' ? "text-red-700" : "text-amber-700"
                              )}>
                                {item.faultName.split(' - ')[0]}
                              </p>
                              {item.notes && (
                                <p className="text-slate-500 text-[10px] mt-1 font-arabic">{item.notes}</p>
                              )}
                            </div>
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

      {/* Legend and Instructions */}
      <div className="absolute bottom-4 left-0 right-0 space-y-2">
        <div className="flex justify-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-[10px] text-white/60 font-arabic">
            {isDragging ? "جارٍ التدوير..." : "اسحب أو استخدم الأسهم للتدوير 360° - اضغط على النقاط لعرض التفاصيل"}
          </div>
        </div>
      </div>
    </div>
  );
};

// Company Header Component
const CompanyHeader = () => (
  <div className="rounded-3xl overflow-hidden shadow-2xl border border-[#C5852C]/30">
    {/* Professional Banner Image */}
    <div className="bg-[#0C1A28] relative">
      <img 
        src={hsBannerPath} 
        alt="High Safety International Center" 
        className="w-full object-cover"
        style={{ maxHeight: '130px', objectPosition: 'center' }}
      />
    </div>
    {/* Contact Info Bar */}
    <div className="bg-gradient-to-l from-[#0C1A28] to-[#0f2035] text-white px-6 py-3 flex flex-wrap justify-center md:justify-between items-center gap-3 border-t border-[#C5852C]/40">
      <div className="flex flex-wrap justify-center gap-4 text-sm">
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
          <Phone className="w-4 h-4 text-[#C5852C]" />
          <span className="font-mono font-bold">0542206000</span>
        </div>
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
          <Mail className="w-4 h-4" />
          <span className="text-xs">highsafety2021@gmail.com</span>
        </div>
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
          <MapPin className="w-4 h-4" />
          <span>سيتي بلازا الدراري - الشارقة</span>
        </div>
      </div>
    </div>
  </div>
);

// Vehicle Info Card
const VehicleInfoCard = ({ inspection }: { inspection: any }) => {
  const vehicleColor = useMemo(() => getVehicleColor(inspection.color), [inspection.color]);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
            <Car className="w-6 h-6" />
          </div>
          <div className="text-right">
            <h2 className="text-xl font-black">{inspection.make} {inspection.model}</h2>
            <p className="text-white/60 text-sm">{inspection.year}</p>
          </div>
        </div>
        <div className="text-left">
          <div className="text-xs text-white/50 font-arabic">رقم التقرير / Report No.</div>
          <div className="font-mono font-bold text-primary-foreground">HS-{inspection.id}-{new Date().getFullYear()}</div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 rounded-2xl p-4 text-right">
          <div className="flex items-center gap-2 justify-end text-slate-400 mb-1">
            <span className="text-xs font-arabic">سنة الصنع</span>
            <Calendar className="w-4 h-4" />
          </div>
          <div className="text-[10px] text-slate-400 mb-1">Model Year</div>
          <div className="text-xl font-black text-slate-900">{inspection.year}</div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 text-right">
          <div className="flex items-center gap-2 justify-end text-slate-400 mb-1">
            <span className="text-xs font-arabic">عداد الكيلومتر</span>
            <Gauge className="w-4 h-4" />
          </div>
          <div className="text-[10px] text-slate-400 mb-1">Odometer</div>
          <div className="text-xl font-black text-slate-900 font-mono">{inspection.odometer?.toLocaleString() || '0'} <span className="text-sm text-slate-400">km</span></div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 text-right">
          <div className="flex items-center gap-2 justify-end text-slate-400 mb-1">
            <span className="text-xs font-arabic">اللون</span>
            <Palette className="w-4 h-4" />
          </div>
          <div className="text-[10px] text-slate-400 mb-1">Color</div>
          <div className="flex items-center gap-2">
            <span 
              className="w-5 h-5 rounded-full border border-slate-200" 
              style={{ backgroundColor: vehicleColor.hex }}
            />
            <span className="text-sm font-bold text-slate-900 font-arabic">{vehicleColor.ar}</span>
            <span className="text-xs text-slate-500">({vehicleColor.en})</span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 text-right">
          <div className="flex items-center gap-2 justify-end text-slate-400 mb-1">
            <span className="text-xs font-arabic">نوع الوقود</span>
            <Fuel className="w-4 h-4" />
          </div>
          <div className="text-[10px] text-slate-400 mb-1">Fuel Type</div>
          <div className="text-sm font-bold text-slate-900">بنزين / Gasoline</div>
        </div>
      </div>

      {/* VIN Section - Professional Metal Plate */}
      <div className="px-6 pb-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <VinPlate 
            vin={inspection.vin}
            make={inspection.make}
            model={inspection.model}
            year={inspection.year}
            vinPhoto={inspection.vinPhoto}
            className="w-full md:w-auto md:min-w-[320px]"
          />
          <div className="flex items-center gap-2 text-xs text-primary font-arabic bg-primary/5 px-4 py-2 rounded-full">
            <CheckCircle2 className="w-4 h-4" />
            تم التحقق من صحة الرقم
          </div>
        </div>
      </div>
    </div>
  );
};

// Car Section Photos Component - Interactive gallery for door/hood/trunk photos
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
                  {(section.exteriorPhoto || section.interiorPhoto) && (
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

      {/* Section Photos Modal - Shows both exterior and interior photos */}
      {selectedSection && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSection(null)}
        >
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedSection(null)}
              className="absolute -top-12 right-0 text-white hover:text-primary transition-colors"
              data-testid="button-close-photo-modal"
            >
              <XCircle className="w-8 h-8" />
            </button>
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-primary text-white px-4 py-3 text-center">
                <p className="font-bold font-arabic text-lg">{selectedSection.label}</p>
                <p className="text-white/70 text-sm">{selectedSection.labelEn}</p>
              </div>
              <div className="p-4 bg-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Exterior Photo */}
                  <div className="text-center">
                    <h4 className="font-bold text-slate-700 mb-2 font-arabic flex items-center justify-center gap-2">
                      <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                      صورة خارجية
                    </h4>
                    {selectedSection.exteriorPhoto ? (
                      <img 
                        src={selectedSection.exteriorPhoto} 
                        alt={`${selectedSection.label} - خارجية`}
                        className="w-full max-h-[50vh] object-contain rounded-xl border-2 border-blue-300 bg-white"
                      />
                    ) : (
                      <div className="w-full h-48 bg-slate-200 rounded-xl flex items-center justify-center">
                        <p className="text-slate-400 font-arabic">لا توجد صورة</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Interior Photo */}
                  <div className="text-center">
                    <h4 className="font-bold text-slate-700 mb-2 font-arabic flex items-center justify-center gap-2">
                      <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                      صورة داخلية
                    </h4>
                    {selectedSection.interiorPhoto ? (
                      <img 
                        src={selectedSection.interiorPhoto} 
                        alt={`${selectedSection.label} - داخلية`}
                        className="w-full max-h-[50vh] object-contain rounded-xl border-2 border-green-300 bg-white"
                      />
                    ) : (
                      <div className="w-full h-48 bg-slate-200 rounded-xl flex items-center justify-center">
                        <p className="text-slate-400 font-arabic">لا توجد صورة</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Helper to format phone number for WhatsApp
const formatWhatsAppLink = (phone: string) => {
  const cleaned = phone.replace(/[^0-9+]/g, '');
  const normalized = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
  return `https://wa.me/${normalized}`;
};

// Customer Info Card
const CustomerInfoCard = ({ inspection }: { inspection: any }) => (
  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
    <div className="flex items-center gap-4 justify-end">
      <div className="text-right flex-1">
        <div className="text-xs text-slate-400 font-arabic mb-1">معلومات العميل</div>
        <div className="font-bold text-lg text-slate-900 font-arabic">{inspection.customerName || 'عميل زائر'}</div>
        {inspection.customerPhone && (
          <a 
            href={formatWhatsAppLink(inspection.customerPhone)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-mono mt-1 transition-colors"
            data-testid="link-whatsapp-customer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {inspection.customerPhone}
          </a>
        )}
      </div>
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
        <User className="w-7 h-7 text-primary" />
      </div>
    </div>
    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-slate-400">
        <Calendar className="w-4 h-4" />
        <span className="font-arabic">تاريخ الفحص</span>
      </div>
      <div className="font-bold text-slate-700">
        {inspection.createdAt ? new Date(inspection.createdAt).toLocaleDateString('ar-AE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : '-'}
      </div>
    </div>
  </div>
);

// Inspection Results Section
const InspectionResults = ({ 
  inspection, 
  highlightedCategory, 
  onImageClick 
}: { 
  inspection: any; 
  highlightedCategory: string | null; 
  onImageClick?: (url: string, name: string) => void;
}) => {
  const items = inspection.items || [];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-primary rounded-full" />
          <h2 className="text-2xl font-black text-slate-900 font-arabic">نتائج الفحص التفصيلية</h2>
        </div>
        <div className="text-sm text-slate-400 font-arabic">
          {items.length} ملاحظة
        </div>
      </div>

      {INSPECTION_CATEGORIES.map(cat => {
        const catItems = items.filter((i: any) => 
          i.category === cat.id || 
          i.category === cat.label || 
          (i.category && cat.label && i.category.includes(cat.label)) ||
          (i.category && cat.id && i.category.toLowerCase().includes(cat.id.toLowerCase()))
        );
        if (catItems.length === 0) return null;
        
        const isHighlighted = highlightedCategory === cat.id;
        
        return (
          <div 
            key={cat.id} 
            id={`category-${cat.id}`}
            className={cn(
              "rounded-3xl overflow-hidden transition-all duration-300 border border-slate-200/80 shadow-sm",
              isHighlighted && "ring-4 ring-primary ring-offset-4"
            )}
          >
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <span className="text-xs text-white/70 bg-white/10 px-2.5 py-1 rounded-full font-arabic">{catItems.length} ملاحظة</span>
              <div className="flex items-center gap-3">
                <span className="font-bold font-arabic text-base">{cat.label}</span>
                <span className="text-white/50 text-xs font-mono">{cat.labelEn}</span>
              </div>
            </div>
            
            <div className="bg-white p-4 space-y-3">
              {catItems.map((item: any) => (
                <div 
                  key={item.id}
                  className="flex flex-col md:flex-row-reverse gap-4 p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 transition-colors"
                >
                  {item.imageUrl && (
                    <button
                      onClick={() => onImageClick?.(item.imageUrl!, item.faultName.split(' - ')[0])}
                      className="relative w-full md:w-36 h-36 rounded-xl overflow-hidden shrink-0 group cursor-pointer border border-slate-200 shadow-sm bg-slate-900"
                    >
                      <img src={item.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="صورة العطل" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex flex-col items-center justify-center gap-1">
                        <ZoomIn className="w-6 h-6 text-white drop-shadow-md opacity-90 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] text-white font-arabic bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm">تكبير الصورة</span>
                      </div>
                    </button>
                  )}
                  <div className="flex-1 text-right flex flex-col justify-center">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={cn(
                        "text-xs px-2.5 py-0.5 rounded-full font-arabic font-bold",
                        item.severity === 'high' ? "bg-red-100 text-red-700" :
                        item.severity === 'medium' ? "bg-amber-100 text-amber-700" :
                        "bg-blue-100 text-blue-700"
                      )}>
                        {item.severity === 'high' ? 'عالية' : item.severity === 'medium' ? 'متوسطة' : 'ملاحظة'}
                      </span>
                      <h4 className="font-bold text-slate-900 font-arabic text-lg">{item.faultName.split(' - ')[0]}</h4>
                    </div>
                    {item.faultName.split(' - ')[1] && (
                      <p className="text-xs text-slate-400 font-mono mb-2">{item.faultName.split(' - ')[1]}</p>
                    )}
                    {item.description && (
                      <p className="text-sm text-slate-600 font-arabic leading-relaxed mt-1">{item.description}</p>
                    )}
                    {item.notes && (
                      <div className="mt-2 bg-amber-50/80 border border-amber-200/60 rounded-xl p-2.5 text-xs text-amber-900 font-arabic">
                        <span className="font-bold ml-1">📝 ملاحظة الفاحص:</span> {item.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Render unclassified items so NO photo is ever missed */}
      {(() => {
        const unclassifiedItems = items.filter((i: any) => 
          !INSPECTION_CATEGORIES.some(cat => 
            i.category === cat.id || 
            i.category === cat.label || 
            (i.category && cat.label && i.category.includes(cat.label)) ||
            (i.category && cat.id && i.category.toLowerCase().includes(cat.id.toLowerCase()))
          )
        );
        if (unclassifiedItems.length === 0) return null;

        return (
          <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
            <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
              <span className="text-xs text-white/70 bg-white/10 px-2.5 py-1 rounded-full font-arabic">{unclassifiedItems.length} ملاحظة</span>
              <span className="font-bold font-arabic text-base">ملاحظات وأعطال إضافية</span>
            </div>
            <div className="bg-white p-4 space-y-3">
              {unclassifiedItems.map((item: any) => (
                <div key={item.id} className="flex flex-col md:flex-row-reverse gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  {item.imageUrl && (
                    <button
                      onClick={() => onImageClick?.(item.imageUrl!, item.faultName.split(' - ')[0])}
                      className="relative w-full md:w-36 h-36 rounded-xl overflow-hidden shrink-0 group cursor-pointer border border-slate-200 bg-slate-900"
                    >
                      <img src={item.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="صورة العطل" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 flex flex-col items-center justify-center gap-1">
                        <ZoomIn className="w-6 h-6 text-white drop-shadow-md" />
                        <span className="text-[10px] text-white font-arabic bg-black/60 px-2 py-0.5 rounded-full">تكبير الصورة</span>
                      </div>
                    </button>
                  )}
                  <div className="flex-1 text-right flex flex-col justify-center">
                    <h4 className="font-bold text-slate-900 font-arabic text-lg mb-1">{item.faultName}</h4>
                    {item.description && <p className="text-sm text-slate-600 font-arabic leading-relaxed">{item.description}</p>}
                    {item.notes && <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 font-arabic"><span className="font-bold">📝 ملاحظة:</span> {item.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {items.length === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-emerald-800 font-arabic mb-2">المركبة في حالة ممتازة</h3>
          <p className="text-emerald-600 font-arabic">لا توجد ملاحظات على المركبة</p>
        </div>
      )}
    </div>
  );
};

// Main Report Component
export default function InteractiveReport() {
  const [matchReports, paramsReports] = useRoute("/reports/:id");
  const [matchReport, paramsReport] = useRoute("/report/:id");
  
  const paramVal = paramsReports?.id || paramsReport?.id || window.location.pathname.split('/').filter(Boolean).pop();
  const numericId = Number(paramVal);
  const isNumeric = !isNaN(numericId) && numericId > 0;

  const { data: idInspection, isLoading: isIdLoading } = useInspection(isNumeric ? numericId : 0);

  const { data: tokenInspection, isLoading: isTokenLoading } = useQuery<any>({
    queryKey: ['/api/public/report', paramVal],
    queryFn: async () => {
      const res = await fetch(`/api/public/report/${paramVal}`);
      if (!res.ok) throw new Error('Report not found');
      return res.json();
    },
    enabled: !isNumeric && !!paramVal
  });

  const inspection = isNumeric ? idInspection : tokenInspection;
  const isLoading = isNumeric ? isIdLoading : isTokenLoading;
  const { toast } = useToast();
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);
  const pdfPhotosPageRef = useRef<HTMLDivElement>(null);
  const pdfTemplateEnRef = useRef<HTMLDivElement>(null);
  const pdfPhotosPageEnRef = useRef<HTMLDivElement>(null);
  const pdfCoverRef = useRef<HTMLDivElement>(null);
  const pdfCoverEnRef = useRef<HTMLDivElement>(null);
  const pdfSignaturesRef = useRef<HTMLDivElement>(null);
  const pdfSignaturesEnRef = useRef<HTMLDivElement>(null);

  const handleCategoryClick = (catId: string) => {
    setHighlightedCategory(catId);
    const element = document.getElementById(`category-${catId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setHighlightedCategory(null), 3000);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    toast({ title: "جارٍ التحضير", description: "جارٍ إنشاء نسخة PDF من التقرير..." });
    
    try {
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc',
        windowWidth: 1200
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
      
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      
      pdf.save(`تقرير_الفحص_${inspection?.vin || 'HS'}.pdf`);
      toast({ title: "تم بنجاح", description: "تم حفظ التقرير بصيغة PDF" });
    } catch (error) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء إنشاء ملف PDF", variant: "destructive" });
    }
  };

  // Helper function to wait for all images to load
  const waitForImages = async (element: HTMLElement): Promise<void> => {
    const images = element.querySelectorAll('img');
    const imagePromises = Array.from(images).map((img) => {
      if (img.complete && img.naturalHeight !== 0) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Continue even if image fails
        // Timeout fallback
        setTimeout(resolve, 5000);
      });
    });
    await Promise.all(imagePromises);
  };

  const dataUrlToArrayBuffer = (dataUrl: string): ArrayBuffer => {
    const base64 = dataUrl.split(',')[1];
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const handleNewPdfDownload = async (pdfLang: 'ar' | 'en' = 'ar') => {
    if (!inspection) return;
    
    const isAr = pdfLang === 'ar';
    const coverRef = isAr ? pdfCoverRef : pdfCoverEnRef;
    const reportRef = isAr ? pdfTemplateRef : pdfTemplateEnRef;
    const photosRef = isAr ? pdfPhotosPageRef : pdfPhotosPageEnRef;
    const signaturesRef = isAr ? pdfSignaturesRef : pdfSignaturesEnRef;
    
    if (!reportRef.current) return;
    
    toast({ 
      title: isAr ? "جارٍ التحضير" : "Preparing",
      description: isAr ? "جارٍ إنشاء تقرير PDF احترافي..." : "Creating professional PDF report..."
    });
    
    try {
      const A4_WIDTH = 794;
      const A4_HEIGHT = 1123;
      
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      
      const canvasOpts = {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: A4_WIDTH,
        height: A4_HEIGHT,
        windowWidth: A4_WIDTH,
        imageTimeout: 30000,
        onclone: (clonedDoc: Document) => {
          const clonedImages = clonedDoc.querySelectorAll('img');
          clonedImages.forEach((img) => {
            if (img.style.width) img.setAttribute('width', img.style.width);
            if (img.style.height) img.setAttribute('height', img.style.height);
          });
        },
      };

      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();

      const addPageFromRef = async (pageRef: React.RefObject<HTMLDivElement>, description: string) => {
        if (!pageRef.current) return;
        toast({
          title: isAr ? "معالجة الصفحات" : "Processing pages",
          description: isAr ? `جارٍ إضافة ${description}...` : `Adding ${description}...`
        });
        await waitForImages(pageRef.current);
        await new Promise(resolve => setTimeout(resolve, 500));
        const canvas = await html2canvas(pageRef.current, canvasOpts);
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgBytes = dataUrlToArrayBuffer(imgData);
        const pdfImg = await pdfDoc.embedJpg(imgBytes);
        const page = pdfDoc.addPage([595.27, 841.89]);
        page.drawImage(pdfImg, { x: 0, y: 0, width: 595.27, height: 841.89 });
      };

      // 1. Cover Page
      await addPageFromRef(coverRef, isAr ? "صفحة الغلاف" : "Cover Page");

      // 2. Main Report Page
      await addPageFromRef(reportRef, isAr ? "صفحة الملاحظات والعيوب" : "Inspection Report Page");

      // 3. Section Photos Page (If has photos)
      const hasAnyPhotos = inspection.rearLeftDoorPhoto || inspection.rearRightDoorPhoto || 
        inspection.frontLeftDoorPhoto || inspection.frontRightDoorPhoto || 
        inspection.hoodPhoto || inspection.trunkPhoto;
      if (hasAnyPhotos) {
        await addPageFromRef(photosRef, isAr ? "صفحة صور الأقسام" : "Section Photos Page");
      }

      // 4. Signatures & OBD Page
      await addPageFromRef(signaturesRef, isAr ? "صفحة فحص الكمبيوتر والتواقيع" : "OBD Diagnostics & Signatures Page");

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      
      const fileName = isAr 
        ? `تقرير_فحص_${inspection.vin}_HS${inspection.id}.pdf`
        : `Inspection_Report_${inspection.vin}_HS${inspection.id}.pdf`;
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.click();
      
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);

      toast({ 
        title: isAr ? "تم التحميل" : "Downloaded",
        description: isAr ? "تم تحميل تقرير PDF الفخم بنجاح" : "Premium PDF report downloaded successfully"
      });
    } catch (error) {
      console.error('PDF error:', error);
      toast({ 
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "حدث خطأ أثناء إنشاء التقرير" : "Error generating PDF report",
        variant: "destructive"
      });
    }
  };

  // Professional single-page PDF generation
  const handleTextPDF = async () => {
    if (!inspection) return;
    
    toast({ title: "جارٍ التحضير", description: "جارٍ إنشاء تقرير PDF احترافي..." });
    
    try {
      // Load pdfmake and fonts
      const pdfMakeModule = await import('pdfmake/build/pdfmake');
      const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
      const { amiriFonts } = await import('@/lib/arabic-fonts');
      
      // Get pdfMake instance
      const pdfMake = pdfMakeModule.default || pdfMakeModule;
      const pdfFonts = pdfFontsModule.default || pdfFontsModule;
      
      // Check if fonts are loaded
      if (!amiriFonts || !amiriFonts['Amiri-Regular'] || !amiriFonts['Amiri-Bold']) {
        console.error('Arabic fonts not loaded');
        throw new Error('Arabic fonts not loaded');
      }
      
      // Setup VFS with both default and custom fonts
      const vfs: Record<string, string> = { ...((pdfFonts as any).pdfMake?.vfs || {}) };
      vfs['Amiri-Regular.ttf'] = amiriFonts['Amiri-Regular'];
      vfs['Amiri-Bold.ttf'] = amiriFonts['Amiri-Bold'];
      
      // Custom VFS for createPdf
      const customVfs = vfs;
      
      // Font definitions
      const customFonts = {
        Amiri: {
          normal: 'Amiri-Regular.ttf',
          bold: 'Amiri-Bold.ttf',
          italics: 'Amiri-Regular.ttf',
          bolditalics: 'Amiri-Bold.ttf'
        }
      };
      
      const items = inspection.items || [];
      const failCount = items.filter((i: any) => i.status === 'fail').length;
      const warningCount = items.filter((i: any) => i.status === 'warning').length;
      const totalCategories = INSPECTION_CATEGORIES.length;
      // Count only categories with FAIL or WARNING items (not PASS)
      const categoriesWithIssues = new Set(
        items.filter((i: any) => i.status === 'fail' || i.status === 'warning')
          .map((i: any) => i.category)
      ).size;
      const passedCount = totalCategories - categoriesWithIssues;
      const primaryColor = inspection.color?.split(',')[0]?.trim() || 'غير محدد';
      const inspectionDate = inspection.createdAt ? new Date(inspection.createdAt) : new Date();
      const reportDate = inspectionDate.toLocaleDateString('ar-AE', { year: 'numeric', month: 'long', day: 'numeric' });
      const reportTime = inspectionDate.toLocaleTimeString('ar-AE', { hour: '2-digit', minute: '2-digit', hour12: false });
      const fullDateTime = `${reportDate} - الساعة ${reportTime}`;
      
      // Convert logo to base64
      let logoBase64 = '';
      try {
        const response = await fetch(logoPath);
        const blob = await response.blob();
        logoBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (e) {}
      
      // Helper function to convert image URL to base64
      const imageToBase64 = async (url: string): Promise<string> => {
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          return '';
        }
      };

      // Filter only items with issues (fail or warning)
      const issueItems = items.filter((i: any) => i.status === 'fail' || i.status === 'warning');
      
      // Convert fault images to base64 (parallel for better performance)
      const itemsWithImages = await Promise.all(
        issueItems.map(async (item: any) => ({
          item,
          imageBase64: item.imageUrl ? await imageToBase64(item.imageUrl) : ''
        }))
      );

      // Build findings content with images
      const findingsContent: any[] = [];
      
      if (issueItems.length === 0) {
        findingsContent.push({
          text: 'لا توجد ملاحظات على المركبة',
          style: 'successText',
          alignment: 'center',
          margin: [0, 20, 0, 20]
        });
      } else {
        // Group by category
        for (const cat of INSPECTION_CATEGORIES) {
          const catItemsWithImages = itemsWithImages.filter(({ item }: any) => item.category === cat.id);
          if (catItemsWithImages.length === 0) continue;
          
          // Category header
          findingsContent.push({
            text: cat.label,
            style: 'categoryHeader',
            margin: [0, 10, 0, 5]
          });
          
          // Items in this category
          catItemsWithImages.forEach(({ item, imageBase64 }: any) => {
            const faultAr = item.faultName.split(' - ')[0] || item.faultName;
            const statusSymbol = item.status === 'fail' ? '●' : '◐';
            const statusColor = item.status === 'fail' ? '#dc2626' : '#d97706';
            const bgColor = item.status === 'fail' ? '#fef2f2' : '#fffbeb';
            
            const itemContent: any = {
              table: {
                widths: imageBase64 ? ['70%', '30%'] : ['100%'],
                body: [[
                  {
                    stack: [
                      { text: faultAr, style: 'faultTitle', margin: [0, 0, 0, 3] },
                      { text: statusSymbol, color: statusColor, fontSize: 9, bold: true },
                      ...(item.description ? [{ text: item.description, style: 'faultDesc', margin: [0, 3, 0, 0] }] : [])
                    ],
                    fillColor: bgColor,
                    margin: [8, 8, 8, 8]
                  },
                  ...(imageBase64 ? [{
                    image: imageBase64,
                    width: 100,
                    height: 70,
                    fillColor: bgColor,
                    margin: [5, 5, 5, 5]
                  }] : [])
                ]]
              },
              layout: {
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                hLineColor: () => '#e2e8f0',
                vLineColor: () => '#e2e8f0'
              },
              margin: [0, 3, 0, 3]
            };
            
            findingsContent.push(itemContent);
          });
        }
      }

      // Add Computer Diagnostics & OBD Codes to PDF
      const obdList = (inspection.obdCodes as Array<{code: string; nameEn: string; nameAr: string; diagnosis?: string; causes?: string; solutions?: string}> | null) || [];
      if (obdList.length > 0) {
        findingsContent.push({
          table: {
            widths: ['*'],
            body: [[{ text: 'تقرير فحص أعطال كمبيوتر السيارة (OBD-II Diagnostic Trouble Codes)', style: 'sectionTitle', alignment: 'center', fillColor: '#0C1A28', color: '#ffffff', margin: [0, 8, 0, 8] }]]
          },
          layout: 'noBorders',
          margin: [0, 15, 0, 6]
        });

        obdList.forEach((obd: any) => {
          findingsContent.push({
            table: {
              widths: ['22%', '78%'],
              body: [
                [
                  { text: obd.code || 'OBD', style: 'statNumber', color: '#dc2626', alignment: 'center', fillColor: '#fef2f2', margin: [0, 6, 0, 6] },
                  {
                    stack: [
                      { text: obd.nameAr || '', style: 'faultTitle', margin: [0, 0, 0, 2] },
                      { text: obd.nameEn || '', style: 'faultDesc', margin: [0, 0, 0, 2] },
                      ...(obd.diagnosis ? [{ text: `التشخيص: ${obd.diagnosis}`, style: 'faultDesc', color: '#4338ca', margin: [0, 2, 0, 0] }] : []),
                      ...(obd.causes ? [{ text: `الأسباب المحتملة: ${obd.causes}`, style: 'faultDesc', color: '#b45309', margin: [0, 2, 0, 0] }] : []),
                      ...(obd.solutions ? [{ text: `خطوات الإصلاح: ${obd.solutions}`, style: 'faultDesc', color: '#047857', margin: [0, 2, 0, 0] }] : [])
                    ],
                    margin: [6, 6, 6, 6]
                  }
                ]
              ]
            },
            layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#e2e8f0', vLineColor: () => '#e2e8f0' },
            margin: [0, 3, 0, 3]
          });
        });
      }

      if (inspection.autelReportPdf) {
        findingsContent.push({
          table: {
            widths: ['*'],
            body: [[{ text: `مرفق مع التقرير الإلكتروني: تقرير فحص كمبيوتر Autel الشامل (${inspection.autelReportName || 'Autel Report'})`, style: 'sectionTitle', alignment: 'center', fillColor: '#ea580c', color: '#ffffff', margin: [0, 8, 0, 8] }]]
          },
          layout: 'noBorders',
          margin: [0, 15, 0, 6]
        });
      }
      
      // Build legacy table for backward compatibility (without images)
      const findingsRows: any[] = [];
      if (issueItems.length === 0) {
        findingsRows.push([
          { text: 'لا توجد ملاحظات على المركبة', style: 'successText', colSpan: 3, alignment: 'center', margin: [0, 10, 0, 10] }, {}, {}
        ]);
      } else {
        for (const cat of INSPECTION_CATEGORIES) {
          const catItems = issueItems.filter((i: any) => i.category === cat.id);
          if (catItems.length === 0) continue;
          
          catItems.forEach((item: any, idx: number) => {
            const faultAr = item.faultName.split(' - ')[0] || item.faultName;
            const statusSymbol = item.status === 'fail' ? '●' : '◐';
            const statusColor = item.status === 'fail' ? '#dc2626' : '#d97706';
            const rowBg = idx % 2 === 0 ? '#ffffff' : '#fafafa';
            
            findingsRows.push([
              { text: idx === 0 ? cat.label : '', style: 'catLabel', fillColor: idx === 0 ? '#f8fafc' : rowBg, margin: [4, 4, 4, 4] },
              { text: faultAr, style: 'faultText', fillColor: rowBg, margin: [4, 4, 4, 4] },
              { text: statusSymbol, style: 'statusText', color: statusColor, fillColor: rowBg, margin: [4, 4, 4, 4], alignment: 'center' }
            ]);
          });
        }
      }
      
      const docDefinition: any = {
        pageSize: 'A4',
        pageMargins: [20, 20, 20, 20],
        defaultStyle: {
          font: 'Amiri',
          fontSize: 10,
          alignment: 'right'
        },
        content: [
          // Professional Header with Logo
          {
            columns: [
              { text: fullDateTime, style: 'dateLabel', width: 120, alignment: 'left', margin: [0, 15, 0, 0] },
              { 
                stack: [
                  { text: 'مركز الأمان العالي الدولي', style: 'companyName', alignment: 'center' },
                  { text: 'HIGH SAFETY INTERNATIONAL', style: 'companyNameEn', alignment: 'center' },
                  { text: 'لفحص وتقييم المركبات', style: 'tagline', alignment: 'center' }
                ],
                width: '*'
              },
              logoBase64 ? { image: logoBase64, width: 55, height: 55, alignment: 'right' } : { text: '', width: 55 }
            ],
            margin: [0, 0, 0, 10]
          },
          
          // Professional Divider
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 555, y2: 0, lineWidth: 3, lineColor: '#1e3a5f' }], margin: [0, 0, 0, 5] },
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 555, y2: 0, lineWidth: 1, lineColor: '#94a3b8' }], margin: [0, 0, 0, 10] },
          
          // Report Number Badge
          {
            table: {
              widths: ['*'],
              body: [[
                { text: `تقرير فحص رقم: HS-${inspection.id}-${new Date().getFullYear()}`, style: 'reportBadge', alignment: 'center', fillColor: '#1e3a5f', color: '#ffffff', margin: [0, 8, 0, 8] }
              ]]
            },
            layout: 'noBorders',
            margin: [0, 0, 0, 12]
          },
          
          // Two Column Layout: Vehicle Info + Customer/Stats
          {
            columns: [
              // Vehicle Info
              {
                width: '52%',
                table: {
                  widths: ['32%', '68%'],
                  body: [
                    [{ text: 'بيانات المركبة', style: 'sectionTitle', colSpan: 2, fillColor: '#f1f5f9', margin: [5, 6, 5, 6] }, {}],
                    [{ text: 'الشركة المصنعة:', style: 'fieldLabel', margin: [5, 4, 5, 4] }, { text: inspection.make || '-', style: 'fieldValue', margin: [5, 4, 5, 4] }],
                    [{ text: 'الموديل:', style: 'fieldLabel', margin: [5, 4, 5, 4] }, { text: inspection.model || '-', style: 'fieldValue', margin: [5, 4, 5, 4] }],
                    [{ text: 'سنة الصنع:', style: 'fieldLabel', margin: [5, 4, 5, 4] }, { text: String(inspection.year || '-'), style: 'fieldValue', margin: [5, 4, 5, 4] }],
                    [{ text: 'اللون:', style: 'fieldLabel', margin: [5, 4, 5, 4] }, { text: primaryColor, style: 'fieldValue', margin: [5, 4, 5, 4] }],
                    [{ text: 'عداد الكيلومتر:', style: 'fieldLabel', margin: [5, 4, 5, 4] }, { text: `${inspection.odometer?.toLocaleString() || '-'} كم`, style: 'fieldValue', margin: [5, 4, 5, 4] }],
                    [{ text: 'رقم الهيكل VIN:', style: 'fieldLabel', margin: [5, 4, 5, 4] }, { text: inspection.vin || '-', style: 'vinValue', margin: [5, 4, 5, 4] }]
                  ]
                },
                layout: { hLineWidth: () => 0.5, vLineWidth: () => 0, hLineColor: () => '#e2e8f0', paddingLeft: () => 0, paddingRight: () => 0 }
              },
              { width: 12, text: '' },
              // Inspection Type + Stats (Customer data hidden from shared report)
              {
                width: '46%',
                stack: [
                  {
                    table: {
                      widths: ['35%', '65%'],
                      body: [
                        [{ text: 'نوع الفحص', style: 'sectionTitle', colSpan: 2, fillColor: '#f1f5f9', margin: [5, 6, 5, 6] }, {}],
                        [{ text: 'الفحص:', style: 'fieldLabel', margin: [5, 4, 5, 4] }, { text: (inspection as any).inspectionType || 'فحص شامل', style: 'fieldValue', margin: [5, 4, 5, 4] }]
                      ]
                    },
                    layout: { hLineWidth: () => 0.5, vLineWidth: () => 0, hLineColor: () => '#e2e8f0' }
                  },
                  { text: '', margin: [0, 8, 0, 0] },
                  // Summary Stats - Larger and clearer
                  {
                    table: {
                      widths: ['33%', '34%', '33%'],
                      body: [[
                        { stack: [{ text: String(passedCount), style: 'statNumber', color: '#16a34a' }, { text: 'سليم', style: 'statLabel' }], alignment: 'center', fillColor: '#f0fdf4', margin: [0, 8, 0, 8] },
                        { stack: [{ text: String(warningCount), style: 'statNumber', color: '#d97706' }, { text: 'متابعة', style: 'statLabel' }], alignment: 'center', fillColor: '#fffbeb', margin: [0, 8, 0, 8] },
                        { stack: [{ text: String(failCount), style: 'statNumber', color: '#dc2626' }, { text: 'إصلاح', style: 'statLabel' }], alignment: 'center', fillColor: '#fef2f2', margin: [0, 8, 0, 8] }
                      ]]
                    },
                    layout: { hLineWidth: () => 0, vLineWidth: () => 1, vLineColor: () => '#e2e8f0' }
                  }
                ]
              }
            ],
            margin: [0, 0, 0, 15]
          },
          
          // Results Section Header
          {
            table: {
              widths: ['*'],
              body: [[{ text: 'نتائج الفحص التفصيلية', style: 'sectionTitle', alignment: 'center', fillColor: '#1e3a5f', color: '#ffffff', margin: [0, 8, 0, 8] }]]
            },
            layout: 'noBorders',
            margin: [0, 0, 0, 8]
          },
          
          // Findings with images
          ...findingsContent,
          
          // Footer with contact info
          { text: '', margin: [0, 10, 0, 0] },
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 555, y2: 0, lineWidth: 1, lineColor: '#1e3a5f' }] },
          { 
            columns: [
              { text: 'واتساب: 0542206000', style: 'footerContact', alignment: 'left' },
              { text: 'highsafety2021@gmail.com', style: 'footerContact', alignment: 'center' },
              { text: 'سيتي بلازا الدراري - الشارقة', style: 'footerContact', alignment: 'right' }
            ],
            margin: [0, 8, 0, 0]
          },
          { text: 'مركز فحص السيارات - الشارقة، الإمارات', style: 'centerBrand', alignment: 'center', margin: [0, 6, 0, 2] },
          { text: 'هذا التقرير الإلكتروني صادر عن مركز الأمان العالي الدولي ويعكس حالة المركبة وقت الفحص فقط', style: 'disclaimer', alignment: 'center', margin: [0, 2, 0, 0] }
        ],
        styles: {
          companyName: { fontSize: 18, bold: true, color: '#1e3a5f' },
          companyNameEn: { fontSize: 10, color: '#475569', margin: [0, 2, 0, 0] },
          tagline: { fontSize: 9, color: '#64748b', margin: [0, 2, 0, 0] },
          dateLabel: { fontSize: 9, color: '#64748b' },
          reportBadge: { fontSize: 13, bold: true },
          sectionTitle: { fontSize: 11, bold: true, color: '#1e293b' },
          fieldLabel: { fontSize: 9, color: '#64748b' },
          fieldValue: { fontSize: 10, bold: true, color: '#1e293b' },
          vinValue: { fontSize: 9, bold: true, color: '#1e293b' },
          statNumber: { fontSize: 22, bold: true },
          statLabel: { fontSize: 9, color: '#64748b', margin: [0, 2, 0, 0] },
          tableHeader: { fontSize: 10, bold: true, color: '#1e293b' },
          catLabel: { fontSize: 9, bold: true, color: '#1e3a5f' },
          faultText: { fontSize: 9, color: '#1e293b' },
          statusText: { fontSize: 9, bold: true },
          successText: { fontSize: 12, bold: true, color: '#16a34a' },
          categoryHeader: { fontSize: 11, bold: true, color: '#1e3a5f', decoration: 'underline' },
          faultTitle: { fontSize: 10, bold: true, color: '#1e293b' },
          faultDesc: { fontSize: 8, color: '#64748b' },
          footerContact: { fontSize: 8, color: '#475569' },
          centerBrand: { fontSize: 9, bold: true, color: '#1e3a5f' },
          disclaimer: { fontSize: 7, color: '#94a3b8', italics: true }
        }
      };
      
      // Use getBlob for reliable download across all browsers
      const pdfDocGenerator = pdfMake.createPdf(docDefinition, undefined, customFonts, customVfs);
      pdfDocGenerator.getBlob((blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `تقرير_فحص_${inspection.vin}_HS${inspection.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: "تم التحميل", description: "تم تحميل ملف PDF على جهازك" });
      });
    } catch (error) {
      console.error('PDF error:', error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء إنشاء التقرير", variant: "destructive" });
    }
  };

  // OLD: Detailed PDF with images (keeping for reference but not used)
  const handleDetailedPDF = async () => {
    if (!inspection) return;
    
    toast({ title: "جارٍ التحضير", description: "جارٍ إنشاء التقرير المفصل..." });
    
    try {
      // Load pdfmake and fonts
      const pdfMakeModule = await import('pdfmake/build/pdfmake');
      const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
      const { amiriFonts } = await import('@/lib/arabic-fonts');
      
      // Get pdfMake instance
      const pdfMake = pdfMakeModule.default || pdfMakeModule;
      const pdfFonts = pdfFontsModule.default || pdfFontsModule;
      
      // Check if fonts are loaded
      if (!amiriFonts || !amiriFonts['Amiri-Regular'] || !amiriFonts['Amiri-Bold']) {
        console.error('Arabic fonts not loaded');
        throw new Error('Arabic fonts not loaded');
      }
      
      // Setup VFS with both default and custom fonts
      const vfs: Record<string, string> = { ...((pdfFonts as any).pdfMake?.vfs || {}) };
      vfs['Amiri-Regular.ttf'] = amiriFonts['Amiri-Regular'];
      vfs['Amiri-Bold.ttf'] = amiriFonts['Amiri-Bold'];
      
      // Custom VFS for createPdf
      const customVfs = vfs;
      
      // Font definitions
      const customFonts = {
        Amiri: {
          normal: 'Amiri-Regular.ttf',
          bold: 'Amiri-Bold.ttf',
          italics: 'Amiri-Regular.ttf',
          bolditalics: 'Amiri-Bold.ttf'
        }
      };
      
      const items = inspection.items || [];
      const failCount = items.filter((i: any) => i.status === 'fail').length;
      const warningCount = items.filter((i: any) => i.status === 'warning').length;
      const passedCount = 12 - (new Set(items.map((i: any) => i.category))).size;
      const primaryColor = inspection.color?.split(',')[0]?.trim() || 'غير محدد';
      
      let logoBase64 = '';
      try {
        const response = await fetch(logoPath);
        const blob = await response.blob();
        logoBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (e) {}
      
      const imageCache: { [url: string]: string } = {};
      const convertImageToBase64 = async (url: string): Promise<string> => {
        if (imageCache[url]) return imageCache[url];
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          imageCache[url] = base64;
          return base64;
        } catch (e) {
          return '';
        }
      };
      
      const findingsContent: any[] = [];
      
      if (items.length === 0) {
        findingsContent.push({
          text: 'لا توجد ملاحظات على المركبة',
          style: 'success',
          alignment: 'center',
          margin: [0, 10, 0, 10]
        });
      } else {
        for (const cat of INSPECTION_CATEGORIES) {
          const catItems = items.filter((i: any) => i.category === cat.id);
          if (catItems.length === 0) continue;
          
          findingsContent.push({
            text: `${cat.label} - ${cat.labelEn}`,
            style: 'categoryHeader',
            margin: [0, 10, 0, 5]
          });
          
          for (const item of catItems) {
            const faultAr = item.faultName.split(' - ')[0] || item.faultName;
            const faultEn = item.faultName.split(' - ')[1] || '';
            const statusSymbol = item.status === 'fail' ? '●' : '◐';
            const statusColor = item.status === 'fail' ? '#dc2626' : '#d97706';
            
            // Convert image to base64 if exists
            let imageBase64 = '';
            if (item.imageUrl) {
              imageBase64 = await convertImageToBase64(item.imageUrl);
            }
            
            const textContent: any[] = [
              { 
                columns: [
                  { text: faultAr, style: 'faultName', width: '*' },
                  { text: statusSymbol, style: 'statusBadge', color: statusColor, width: 'auto' }
                ]
              }
            ];
            
            if (faultEn) {
              textContent.push({ text: faultEn, style: 'faultNameEn' });
            }
            if (item.description) {
              textContent.push({ text: item.description, style: 'description' });
            }
            
            const rowContent: any[] = [];
            
            // Add image if available
            if (imageBase64) {
              rowContent.push({
                columns: [
                  { image: imageBase64, width: 70, height: 70, margin: [0, 0, 10, 0] },
                  { stack: textContent, width: '*' }
                ],
                margin: [5, 5, 5, 5]
              });
            } else {
              rowContent.push({
                stack: textContent,
                margin: [5, 5, 5, 5]
              });
            }
            
            findingsContent.push({
              table: {
                widths: ['*'],
                body: [[rowContent[0]]]
              },
              layout: {
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                hLineColor: () => '#e2e8f0',
                vLineColor: () => '#e2e8f0'
              },
              margin: [0, 2, 0, 2]
            });
          }
        }
      }
      
      const docDefinition: any = {
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60],
        defaultStyle: {
          font: 'Amiri',
          fontSize: 11,
          alignment: 'right'
        },
        content: [
          // Header
          {
            columns: [
              logoBase64 ? {
                image: logoBase64,
                width: 60,
                height: 60
              } : {},
              {
                stack: [
                  { text: 'مركز الأمان العالي الدولي', style: 'header' },
                  { text: 'HIGH SAFETY INTERNATIONAL', style: 'subheader' },
                  { text: 'مركز فحص وتسجيل المركبات', style: 'tagline' }
                ],
                width: '*',
                alignment: 'right'
              }
            ],
            margin: [0, 0, 0, 15]
          },
          { text: 'واتساب: 0542206000 | highsafety2021@gmail.com | سيتي بلازا الدراري - الشارقة', style: 'contact', alignment: 'center' },
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#1e293b' }], margin: [0, 10, 0, 15] },
          
          // Report Title
          { text: 'تقرير فحص المركبة', style: 'title', alignment: 'center' },
          { text: `رقم التقرير: HS-${inspection.id}-${new Date().getFullYear()} | التاريخ: ${inspection.createdAt ? new Date(inspection.createdAt).toLocaleDateString('ar-AE') : '-'}`, style: 'reportInfo', alignment: 'center', margin: [0, 5, 0, 20] },
          
          // Vehicle & Customer Info
          {
            columns: [
              {
                width: '55%',
                stack: [
                  { text: 'بيانات المركبة', style: 'sectionHeader' },
                  {
                    table: {
                      widths: ['40%', '60%'],
                      body: [
                        [{ text: 'الشركة المصنعة:', style: 'label' }, { text: inspection.make || '-', style: 'value' }],
                        [{ text: 'الموديل:', style: 'label' }, { text: inspection.model || '-', style: 'value' }],
                        [{ text: 'سنة الصنع:', style: 'label' }, { text: String(inspection.year || '-'), style: 'value' }],
                        [{ text: 'رقم الهيكل:', style: 'label' }, { text: inspection.vin || '-', style: 'vinValue' }],
                        [{ text: 'العداد:', style: 'label' }, { text: `${inspection.odometer?.toLocaleString() || '-'} كم`, style: 'value' }],
                        [{ text: 'اللون:', style: 'label' }, { text: primaryColor, style: 'value' }]
                      ]
                    },
                    layout: 'noBorders'
                  }
                ]
              },
              {
                width: '45%',
                stack: [
                  { text: 'بيانات العميل', style: 'sectionHeader' },
                  {
                    table: {
                      widths: ['40%', '60%'],
                      body: [
                        [{ text: 'الاسم:', style: 'label' }, { text: inspection.customerName || 'زبون بدون حجز', style: 'value' }],
                        [{ text: 'الهاتف:', style: 'label' }, { text: inspection.customerPhone || '-', style: 'vinValue' }]
                      ]
                    },
                    layout: 'noBorders'
                  }
                ]
              }
            ],
            margin: [0, 0, 0, 20]
          },
          
          // Summary Stats
          {
            columns: [
              { stack: [{ text: String(passedCount), style: 'statNumber', color: '#16a34a' }, { text: '✓', style: 'statLabel' }], alignment: 'center', width: '*' },
              { stack: [{ text: String(warningCount), style: 'statNumber', color: '#d97706' }, { text: '◐', style: 'statLabel' }], alignment: 'center', width: '*' },
              { stack: [{ text: String(failCount), style: 'statNumber', color: '#dc2626' }, { text: '●', style: 'statLabel' }], alignment: 'center', width: '*' }
            ],
            margin: [0, 0, 0, 20]
          },
          
          // Findings
          { text: 'نتائج الفحص التفصيلية', style: 'sectionHeader', margin: [0, 0, 0, 10] },
          ...findingsContent,
          
          // Terms and Conditions
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#e2e8f0' }], margin: [0, 20, 0, 10] },
          { text: 'الأحكام والشروط | Terms & Conditions', style: 'termsHeader', alignment: 'center', margin: [0, 0, 0, 8] },
          {
            ol: [
              { text: [{ text: 'المركز غير مسئول عن أي أعطال تحدث أثناء الفحص أو بعده.\n', style: 'termsAr' }, { text: 'The center is not responsible for any malfunctions occurring during or after inspection.', style: 'termsEn' }] },
              { text: [{ text: 'المركز مسئول عن نتيجة الفحص وقت الفحص فقط وغير مسئول بعد خروج المركبة من الفحص.\n', style: 'termsAr' }, { text: 'The center is only responsible for inspection results at the time of inspection.', style: 'termsEn' }] },
              { text: [{ text: 'هذا الفحص غير معتمد لدى إدارة التراخيص.\n', style: 'termsAr' }, { text: 'This inspection is not approved by the Licensing Authority.', style: 'termsEn' }] },
              { text: [{ text: 'المركز غير مسئول عن أي أغراض شخصية داخل السيارة أثناء الفحص.\n', style: 'termsAr' }, { text: 'The center is not responsible for any personal belongings inside the vehicle.', style: 'termsEn' }] },
              { text: [{ text: 'يعتبر هذا التقرير لحالة المركبة حسب قراءة الأجهزة في وقت الفحص.\n', style: 'termsAr' }, { text: 'This report reflects the vehicle condition based on device readings at inspection time.', style: 'termsEn' }] }
            ],
            margin: [20, 0, 20, 15]
          },
          
          // Footer
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#94a3b8' }], margin: [0, 10, 0, 10] },
          { text: 'للاستفسارات: واتساب 0542206000 | highsafety2021@gmail.com | سيتي بلازا الدراري - الشارقة', style: 'footer', alignment: 'center' }
        ],
        styles: {
          header: { fontSize: 22, bold: true, color: '#1e293b' },
          subheader: { fontSize: 12, color: '#64748b' },
          tagline: { fontSize: 10, color: '#94a3b8' },
          contact: { fontSize: 9, color: '#64748b' },
          title: { fontSize: 18, bold: true, color: '#1e293b' },
          reportInfo: { fontSize: 10, color: '#64748b' },
          sectionHeader: { fontSize: 14, bold: true, color: '#1e293b', margin: [0, 0, 0, 8] },
          label: { fontSize: 10, color: '#64748b' },
          value: { fontSize: 11, bold: true, color: '#1e293b' },
          vinValue: { fontSize: 10, bold: true, color: '#1e293b' },
          statNumber: { fontSize: 28, bold: true },
          statLabel: { fontSize: 10, color: '#64748b' },
          categoryHeader: { fontSize: 12, bold: true, color: '#ffffff', fillColor: '#1e293b', margin: [5, 5, 5, 5] },
          faultName: { fontSize: 12, bold: true, color: '#1e293b' },
          faultNameEn: { fontSize: 9, color: '#64748b' },
          statusBadge: { fontSize: 9, bold: true },
          description: { fontSize: 10, color: '#475569', margin: [0, 3, 0, 0] },
          success: { fontSize: 14, bold: true, color: '#16a34a' },
          footer: { fontSize: 8, color: '#94a3b8' },
          termsHeader: { fontSize: 11, bold: true, color: '#1e293b' },
          termsAr: { fontSize: 9, color: '#374151' },
          termsEn: { fontSize: 8, color: '#6b7280', italics: true }
        }
      };
      
      // Use getBlob for reliable download
      const pdfDocGenerator = pdfMake.createPdf(docDefinition, undefined, customFonts, customVfs);
      pdfDocGenerator.getBlob((blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `تقرير_فحص_${inspection.vin}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: "تم التحميل", description: "تم تحميل ملف PDF على جهازك" });
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء إنشاء ملف PDF", variant: "destructive" });
    }
  };

  const handleShareReport = async () => {
    try {
      // Generate a public share token
      const response = await fetch(`/api/inspections/${inspection?.id || paramVal}/share`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to generate share link');
      
      const { token } = await response.json();
      const shareUrl = `${window.location.origin}/view/${token}`;
      
      let shared = false;
      if (navigator.share) {
        try {
          await navigator.share({
            title: `تقرير فحص - ${inspection?.make} ${inspection?.model}`,
            text: `تقرير فحص سيارة من High Safety`,
            url: shareUrl,
          });
          shared = true;
        } catch (shareErr) {
          console.log("Navigator share failed, falling back to clipboard:", shareErr);
        }
      }
      
      if (!shared) {
        await navigator.clipboard.writeText(shareUrl);
        toast({ 
          title: "نسخ الرابط", 
          description: "تم نسخ رابط التقرير إلى الحافظة بنجاح - يمكن للعميل عرضه بدون تسجيل دخول" 
        });
      }
    } catch (err) {
      console.error("Error sharing:", err);
      toast({ 
        title: "خطأ", 
        description: "تعذر إنشاء رابط المشاركة",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50 font-arabic">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-primary font-bold">جارٍ تحميل التقرير...</span>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 font-arabic">التقرير غير موجود</h2>
        <p className="text-slate-500 font-arabic mt-2">تأكد من صحة الرابط</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <img src={logoPath} alt="Logo" className="w-10 h-10 object-contain" style={{ filter: 'drop-shadow(0 0 6px rgba(197,133,44,0.7))' }} />
            <div className="text-right">
              <h1 className="text-lg font-black text-slate-900 font-arabic">تقرير الفحص التفاعلي</h1>
              <p className="text-xs text-slate-400 font-mono">{inspection.vin}</p>
            </div>
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            <Button variant="ghost" size="sm" onClick={handleShareReport} className="font-arabic text-xs px-2 sm:px-3 h-8 sm:h-9">
              <PhosphorIcon name="share-network" weight="duotone" size={16} className="sm:ml-1 text-[#C5852C]" />
              <span className="hidden sm:inline">مشاركة</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.print()} className="font-arabic text-xs px-2 sm:px-3 h-8 sm:h-9">
              <PhosphorIcon name="printer" weight="duotone" size={16} className="sm:ml-1 text-slate-700" />
              <span className="hidden sm:inline">طباعة</span>
            </Button>
            <Button variant="default" size="sm" onClick={() => handleNewPdfDownload('ar')} className="font-arabic text-xs px-2.5 sm:px-4 h-8 sm:h-9" data-testid="button-download-pdf-ar">
              <PhosphorIcon name="file-pdf" weight="duotone" size={16} className="sm:ml-1 text-white" />
              <span className="hidden sm:inline">PDF عربي</span>
              <span className="inline sm:hidden">عربي</span>
            </Button>
            <Button variant="default" size="sm" onClick={() => handleNewPdfDownload('en')} className="text-xs px-2.5 sm:px-4 h-8 sm:h-9" data-testid="button-download-pdf-en">
              <PhosphorIcon name="file-pdf" weight="duotone" size={16} className="sm:ml-1 text-white" />
              <span className="hidden sm:inline">English PDF</span>
              <span className="inline sm:hidden">EN</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div id="report-content" className="max-w-6xl mx-auto py-6 px-4 space-y-6 print:py-0">
        {/* Company Header */}
        <CompanyHeader />

        {/* 360 Car Visualization */}
        <Car360Visualization 
          items={inspection.items || []} 
          onCategoryClick={handleCategoryClick}
        />

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <VehicleInfoCard inspection={inspection} />
          </div>
          <CustomerInfoCard inspection={inspection} />
        </div>

        {/* Car Section Photos Gallery */}
        <CarSectionPhotosGallery inspection={inspection} />

        {/* Inspection Results */}
        <InspectionResults 
          inspection={inspection} 
          highlightedCategory={highlightedCategory} 
          onImageClick={(url, name) => setSelectedImage({ url, name })}
        />

        {/* OBD Codes Section - Professional HS Report */}
        {(() => {
          const obdCodes = (inspection.obdCodes as Array<{code: string; nameEn: string; nameAr: string; diagnosis?: string; causes?: string; solutions?: string}> | null) || [];
          if (obdCodes.length === 0 && !inspection.autelReportPdf) return null;
          const getCodeType = (code: string) => {
            const p = code.charAt(0).toUpperCase();
            if (p === 'P') return { color: 'bg-red-600', labelAr: 'المحرك وناقل الحركة' };
            if (p === 'C') return { color: 'bg-amber-600', labelAr: 'الشاصي' };
            if (p === 'B') return { color: 'bg-blue-600', labelAr: 'الهيكل' };
            if (p === 'U') return { color: 'bg-purple-600', labelAr: 'شبكة الاتصال' };
            return { color: 'bg-slate-600', labelAr: 'أخرى' };
          };
          return (
            <div className="bg-white rounded-3xl overflow-hidden shadow-xl border-2 border-slate-200" data-testid="obd-report-section">
              <div className="bg-gradient-to-l from-slate-800 via-slate-900 to-black text-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-black text-sm">HS</span>
                    </div>
                    <div>
                      <div className="text-xs text-slate-300 font-mono font-bold tracking-wider" dir="ltr">HIGH SAFETY</div>
                      <div className="text-xs text-slate-400 font-mono tracking-wider" dir="ltr">DIAGNOSTIC REPORT</div>
                    </div>
                  </div>
                  <div className="text-left bg-white/10 rounded-xl px-4 py-2" dir="ltr">
                    <div className="text-xs text-slate-400 font-mono">CODES FOUND</div>
                    <div className="text-3xl font-black text-emerald-400">{obdCodes.length}</div>
                  </div>
                </div>
                <div className="text-center border-t border-white/10 pt-4">
                  <h3 className="text-xl font-black font-arabic">تقرير فحص كمبيوتر السيارة</h3>
                  <p className="text-slate-400 text-sm font-mono mt-1" dir="ltr">OBD-II Diagnostic Trouble Codes Report</p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 px-2 pb-2">
                <Accordion type="single" collapsible className="w-full">
                  {obdCodes.map((obd, idx) => {
                    const type = getCodeType(obd.code);
                    const hasAiDetails = obd.diagnosis || obd.causes || obd.solutions;
                    
                    return (
                      <AccordionItem value={`item-${idx}`} key={idx} className="border-b-0 mb-2 bg-slate-50/50 rounded-2xl overflow-hidden data-[state=open]:bg-white data-[state=open]:shadow-md data-[state=open]:ring-1 data-[state=open]:ring-slate-200 transition-all">
                        <AccordionTrigger className="px-4 py-4 hover:no-underline [&[data-state=open]>div>div>div.ai-badge]:opacity-0 [&[data-state=open]>div>div>div.ai-badge]:scale-95">
                          <div className="flex items-center gap-4 w-full text-right">
                            <div className="shrink-0">
                              <div className={`font-mono font-black text-white text-lg px-4 py-2 rounded-xl ${type.color} shadow-md min-w-[85px] text-center`}>{obd.code}</div>
                              <div className="text-[10px] text-center text-slate-500 mt-1.5 font-arabic font-medium">{type.labelAr}</div>
                            </div>
                            <div className="flex-1 min-w-0 flex justify-between items-center pr-2">
                              <div>
                                <div className="text-base font-bold text-slate-900 font-arabic leading-snug text-right">{obd.nameAr}</div>
                                <div className="text-sm text-slate-500 font-mono mt-1 text-right" dir="ltr">{obd.nameEn}</div>
                              </div>
                              {hasAiDetails && (
                                <div className="ai-badge shrink-0 flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100 transition-all duration-300">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span className="text-xs font-bold font-arabic">شرح العطل</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        {hasAiDetails && (
                          <AccordionContent className="px-4 pb-4 text-right" dir="rtl">
                            <div className="pt-2 border-t border-slate-100 space-y-4">
                              
                              {obd.diagnosis && (
                                <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50">
                                  <div className="flex items-center gap-2 mb-2 text-indigo-700">
                                    <Stethoscope className="w-5 h-5" />
                                    <h4 className="font-black font-arabic text-sm">التشخيص الذكي (AI Diagnosis)</h4>
                                  </div>
                                  <p className="text-slate-700 text-sm font-arabic leading-relaxed">
                                    {obd.diagnosis}
                                  </p>
                                </div>
                              )}

                              {obd.causes && (
                                <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100/50">
                                  <div className="flex items-center gap-2 mb-2 text-amber-700">
                                    <Search className="w-5 h-5" />
                                    <h4 className="font-black font-arabic text-sm">الأسباب المحتملة (Possible Causes)</h4>
                                  </div>
                                  <ul className="list-disc list-inside text-slate-700 text-sm font-arabic leading-relaxed space-y-1 pr-1">
                                    {obd.causes.split(',').map((cause, i) => (
                                      <li key={i}>{cause.trim()}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {obd.solutions && (
                                <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100/50">
                                  <div className="flex items-center gap-2 mb-2 text-emerald-700">
                                    <Wrench className="w-5 h-5" />
                                    <h4 className="font-black font-arabic text-sm">خطوات الإصلاح (Solutions)</h4>
                                  </div>
                                  <ul className="list-disc list-inside text-slate-700 text-sm font-arabic leading-relaxed space-y-1 pr-1">
                                    {obd.solutions.split(',').map((solution, i) => (
                                      <li key={i}>{solution.trim()}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                            </div>
                          </AccordionContent>
                        )}
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>

              <div className="bg-slate-100 border-t-2 border-slate-200 px-5 py-3 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono font-bold" dir="ltr">HIGH SAFETY INSPECTION CENTER</span>
                <span className="text-xs text-slate-400 font-mono" dir="ltr">HS-OBD-{String(inspection.id).padStart(4, '0')}</span>
              </div>
            </div>
          );
        })()}

        {/* Autel Computer Report Section */}
        {inspection.autelReportPdf && (
          <div className="bg-white rounded-3xl overflow-hidden shadow-xl border-2 border-orange-200" data-testid="autel-report-section">
            <div className="bg-gradient-to-l from-orange-600 to-orange-700 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-white font-arabic">تقرير فحص الكمبيوتر</h3>
                  <p className="text-orange-200 text-sm font-mono mt-1" dir="ltr">Autel Computer Diagnostic Report</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Monitor className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="p-6 text-center">
              <p className="text-slate-600 font-arabic mb-4">تقرير فحص الكمبيوتر الشامل من جهاز Autel</p>
              <a
                href={`/api/autel/report/${inspection.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-md"
                data-testid="btn-open-autel-pdf"
              >
                <ExternalLink className="w-5 h-5" />
                فتح تقرير Autel
              </a>
            </div>
            <div className="bg-orange-50 border-t-2 border-orange-200 px-5 py-3 flex items-center justify-between">
              <span className="text-xs text-orange-600 font-mono font-bold" dir="ltr">HIGH SAFETY INSPECTION CENTER</span>
              <span className="text-xs text-orange-400 font-mono" dir="ltr">AUTEL-{String(inspection.id).padStart(4, '0')}</span>
            </div>
          </div>
        )}

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
                <p className="text-slate-500 text-xs">The center is only responsible for inspection results at the time of inspection and not after the vehicle leaves.</p>
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
                <p className="text-slate-500 text-xs">The center is not responsible for any personal belongings inside the vehicle during inspection.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-primary font-bold min-w-[24px]">5.</span>
              <div>
                <p className="text-slate-700 font-arabic">يعتبر هذا التقرير لحالة المركبة حسب قراءة الأجهزة في وقت الفحص.</p>
                <p className="text-slate-500 text-xs">This report reflects the vehicle condition based on device readings at the time of inspection.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-8 text-center relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-40 h-40 bg-accent rounded-full -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary rounded-full -ml-16 -mb-16" />
          </div>
          
          <div className="relative z-10">
            {/* Logo and Name */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src={logoPath} alt="Logo" className="w-12 h-12 object-contain" style={{ filter: 'drop-shadow(0 0 8px rgba(197,133,44,0.8))' }} />
              <div className="text-right">
                <span className="font-bold font-arabic text-lg block">مركز الأمان العالي الدولي</span>
                <span className="text-xs text-white/50">HIGH SAFETY INTERNATIONAL</span>
              </div>
            </div>
            
            {/* Description */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 mb-6 max-w-2xl mx-auto">
              <p className="text-sm text-white/70 font-arabic leading-relaxed">
                تقرير إلكتروني تفاعلي صادر عن مركز الأمان العالي الدولي لفحص المركبات
              </p>
              <p className="text-xs text-white/40 mt-2 font-arabic">
                النتائج مبنية على حالة المركبة وقت الفحص وقد تتغير مع الاستخدام
              </p>
            </div>
            
            {/* WhatsApp CTA Button */}
            <a 
              href="https://wa.me/971542206000" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-bold transition-all duration-300 shadow-lg hover:shadow-green-500/30 hover:scale-105 mb-6"
              data-testid="link-whatsapp-footer"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="font-arabic">تواصل معنا واتساب</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">0542206000</span>
            </a>
            
            {/* Contact Info */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-xs text-white/50">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>highsafety2021@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="font-arabic">سيتي بلازا الدراري - الشارقة</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedImage && (
        <ImageModal 
          imageUrl={selectedImage.url} 
          faultName={selectedImage.name} 
          onClose={() => setSelectedImage(null)} 
        />
      )}

      {/* Hidden PDF Templates */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, pointerEvents: 'none' }}>
        <PdfCoverPage ref={pdfCoverRef} inspection={inspection} lang="ar" />
        <PdfReportTemplate ref={pdfTemplateRef} inspection={inspection} lang="ar" pageNum={2} totalPages={inspection ? (!!(inspection.rearLeftDoorPhoto || inspection.rearRightDoorPhoto || inspection.frontLeftDoorPhoto || inspection.frontRightDoorPhoto || inspection.hoodPhoto || inspection.trunkPhoto) ? 4 : 3) : 4} />
        <PdfCarPhotosPage ref={pdfPhotosPageRef} inspection={inspection} lang="ar" pageNum={3} totalPages={4} />
        <PdfSignaturesPage ref={pdfSignaturesRef} inspection={inspection} lang="ar" pageNum={inspection ? (!!(inspection.rearLeftDoorPhoto || inspection.rearRightDoorPhoto || inspection.frontLeftDoorPhoto || inspection.frontRightDoorPhoto || inspection.hoodPhoto || inspection.trunkPhoto) ? 4 : 3) : 4} totalPages={inspection ? (!!(inspection.rearLeftDoorPhoto || inspection.rearRightDoorPhoto || inspection.frontLeftDoorPhoto || inspection.frontRightDoorPhoto || inspection.hoodPhoto || inspection.trunkPhoto) ? 4 : 3) : 4} />
        
        <PdfCoverPage ref={pdfCoverEnRef} inspection={inspection} lang="en" />
        <PdfReportTemplate ref={pdfTemplateEnRef} inspection={inspection} lang="en" pageNum={2} totalPages={inspection ? (!!(inspection.rearLeftDoorPhoto || inspection.rearRightDoorPhoto || inspection.frontLeftDoorPhoto || inspection.frontRightDoorPhoto || inspection.hoodPhoto || inspection.trunkPhoto) ? 4 : 3) : 4} />
        <PdfCarPhotosPage ref={pdfPhotosPageEnRef} inspection={inspection} lang="en" pageNum={3} totalPages={4} />
        <PdfSignaturesPage ref={pdfSignaturesEnRef} inspection={inspection} lang="en" pageNum={inspection ? (!!(inspection.rearLeftDoorPhoto || inspection.rearRightDoorPhoto || inspection.frontLeftDoorPhoto || inspection.frontRightDoorPhoto || inspection.hoodPhoto || inspection.trunkPhoto) ? 4 : 3) : 4} totalPages={inspection ? (!!(inspection.rearLeftDoorPhoto || inspection.rearRightDoorPhoto || inspection.frontLeftDoorPhoto || inspection.frontRightDoorPhoto || inspection.hoodPhoto || inspection.trunkPhoto) ? 4 : 3) : 4} />
      </div>
    </div>
  );
}
