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
  Palette
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import logoPath from "@assets/logo_1767706304085.png";
import { PdfReportTemplate } from "@/components/pdf-report-template";
import carVisualizationPath from "@assets/generated_images/professional_car_anatomy_diagram.png";
import { INSPECTION_CATEGORIES, CATEGORY_GROUPS } from "@shared/categories";
import { getVehicleColor, calculateInspectionStats } from "@/lib/vehicle-utils";
import { VinPlate } from "@/components/vin-plate";

// Category position mapping for car visualization - organized by car part location
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

// Realistic 3D Car Component with CSS animations and 360 rotation
const Car3DVisualization = ({ items, onCategoryClick }: { items: any[], onCategoryClick: (cat: string) => void }) => {
  const [rotateY, setRotateY] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-rotate effect
  useEffect(() => {
    if (!isAutoRotating || isDragging) return;
    const interval = setInterval(() => {
      setRotateY(prev => (prev + 0.5) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, [isAutoRotating, isDragging]);

  // Drag handlers for manual rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setIsAutoRotating(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - startX;
    setRotateY(prev => prev + delta * 0.5);
    setStartX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setIsAutoRotating(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const delta = e.touches[0].clientX - startX;
    setRotateY(prev => prev + delta * 0.5);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
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
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleAutoRotate}
          className={cn(
            "backdrop-blur-sm text-white",
            isAutoRotating ? "bg-primary/50 hover:bg-primary/70" : "bg-white/10 hover:bg-white/20"
          )}
          data-testid="button-toggle-rotation"
        >
          <RotateCcw className={cn("w-5 h-5", isAutoRotating && "animate-spin")} />
        </Button>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{stats.good}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{stats.warning}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm">
            <XCircle className="w-3.5 h-3.5" />
            <span>{stats.fail}</span>
          </div>
        </div>
      </div>

      {/* 3D Car Container */}
      <div 
        className="relative w-full aspect-square md:aspect-[16/10] flex items-center justify-center"
        style={{ perspective: '1500px' }}
      >
        {/* Ground reflection */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white/5 to-transparent" />
        
        {/* 3D Car Body */}
        <div 
          className="relative w-[85%] h-[75%] transition-transform duration-500 ease-out"
          style={{ 
            transformStyle: 'preserve-3d',
            transform: `rotateY(${rotateY}deg) rotateX(5deg)`
          }}
        >
          {/* Sports Car Image */}
          <img 
            src={carVisualizationPath} 
            alt="Vehicle Visualization" 
            className="w-full h-full object-contain drop-shadow-2xl"
          />

          {/* Category indicators overlaid on car - only show categories with issues */}
          {INSPECTION_CATEGORIES.map(cat => {
            const position = CATEGORY_POSITIONS[cat.id];
            if (!position) return null;
            
            const status = getCategoryStatus(cat.id);
            const hasIssues = status !== 'good';
            const catItems = getCategoryItems(cat.id);
            const isSelected = selectedCategory === cat.id;
            
            // Only show categories that have issues to avoid cluttering
            if (!hasIssues) return null;
            
            return (
              <div 
                key={cat.id} 
                className="absolute z-10" 
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
                {isSelected && catItems.length > 0 && (
                  <div 
                    className="absolute top-full mt-2 right-0 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-3 min-w-[200px] max-w-[280px] z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                      <span className="font-bold text-xs text-slate-800 font-arabic">{cat.label}</span>
                      <span className="text-[10px] text-slate-500">{catItems.length} ملاحظات</span>
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
            {isDragging ? "جاري التدوير..." : "اسحب للتدوير 360° • اضغط على النقاط لعرض التفاصيل"}
          </div>
        </div>
        <div className="flex justify-center gap-6 text-xs font-bold font-arabic text-white/80">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
            <span>جيد</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50" />
            <span>ملاحظات</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
            <span>يحتاج إصلاح</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Company Header Component
const CompanyHeader = () => (
  <div className="bg-gradient-to-l from-primary via-primary to-primary/90 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
    {/* Background pattern */}
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24" />
    </div>
    
    <div className="relative z-10 flex flex-col md:flex-row-reverse items-center justify-between gap-6">
      {/* Logo and Name */}
      <div className="flex items-center gap-4">
        <img 
          src={logoPath} 
          alt="High Safety Logo" 
          className="w-20 h-20 object-contain rounded-2xl bg-white p-1 shadow-lg"
        />
        <div className="text-right">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">مركز الأمان العالي الدولي</h1>
          <p className="text-sm text-white/80 font-bold">HIGH SAFETY INTERNATIONAL</p>
          <p className="text-xs text-white/60 mt-1">لخدمات فحص وتقييم المركبات</p>
        </div>
      </div>

      {/* Contact Info */}
      <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
          <Phone className="w-4 h-4" />
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
const InspectionResults = ({ inspection, highlightedCategory }: { inspection: any, highlightedCategory: string | null }) => {
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
        const catItems = items.filter((i: any) => i.category === cat.id);
        if (catItems.length === 0) return null;
        
        const isHighlighted = highlightedCategory === cat.id;
        
        return (
          <div 
            key={cat.id} 
            id={`category-${cat.id}`}
            className={cn(
              "rounded-3xl overflow-hidden transition-all duration-300",
              isHighlighted && "ring-4 ring-primary ring-offset-4"
            )}
          >
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <span className="text-xs text-white/50">{catItems.length} ملاحظة</span>
              <div className="flex items-center gap-3">
                <span className="font-bold font-arabic">{cat.label}</span>
                <span className="text-white/50 text-sm">{cat.labelEn}</span>
              </div>
            </div>
            
            <div className="bg-white p-4 space-y-3">
              {catItems.map((item: any) => (
                <div 
                  key={item.id}
                  className="flex flex-col md:flex-row-reverse gap-4 p-4 bg-slate-50 rounded-2xl"
                >
                  {item.imageUrl && (
                    <div className="w-full md:w-32 h-32 rounded-xl overflow-hidden shrink-0">
                      <img src={item.imageUrl} className="w-full h-full object-cover" alt="صورة العطل" />
                    </div>
                  )}
                  <div className="flex-1 text-right">
                    <h4 className="font-bold text-slate-900 font-arabic text-lg mb-2">{item.faultName.split(' - ')[0]}</h4>
                    {item.faultName.split(' - ')[1] && (
                      <p className="text-xs text-slate-400 font-mono mb-2">{item.faultName.split(' - ')[1]}</p>
                    )}
                    {item.description && (
                      <p className="text-sm text-slate-600 font-arabic leading-relaxed">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {items.length === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-emerald-800 font-arabic mb-2">السيارة حالتها ممتازة</h3>
          <p className="text-emerald-600 font-arabic">ما لقينا أي أعطال أو ملاحظات</p>
        </div>
      )}
    </div>
  );
};

// Main Report Component
export default function InteractiveReport() {
  const [, params] = useRoute("/reports/:id");
  const id = Number(params?.id);
  const { data: inspection, isLoading } = useInspection(id);
  const { toast } = useToast();
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);

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
    
    toast({ title: "يجهز", description: "يسوي نسخة PDF من التقرير..." });
    
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
      toast({ title: "تم", description: "انحفظ التقرير PDF" });
    } catch (error) {
      toast({ title: "خطأ", description: "صار خطأ في سوي ملف PDF", variant: "destructive" });
    }
  };

  // New professional single-page PDF with html2canvas - high quality
  const handleNewPdfDownload = async () => {
    if (!inspection || !pdfTemplateRef.current) return;
    
    toast({ title: "يجهز", description: "يسوي تقرير PDF احترافي..." });
    
    try {
      const element = pdfTemplateRef.current;
      const A4_WIDTH = 794;
      const A4_HEIGHT = 1123;
      
      // Wait for fonts to load
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      
      // Wait a bit for images to load
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Capture with html2canvas at high quality (scale 3 for clarity)
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: A4_WIDTH,
        height: A4_HEIGHT,
        windowWidth: A4_WIDTH,
        imageTimeout: 15000,
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Single page - fit to A4
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      pdf.save(`Inspection_Report_${inspection.vin}_HS${inspection.id}.pdf`);
      toast({ title: "تم التحميل", description: "تم تحميل ملف PDF بجودة عالية" });
    } catch (error) {
      console.error('PDF error:', error);
      toast({ title: "خطأ", description: "صار خطأ في إنشاء التقرير", variant: "destructive" });
    }
  };

  // Professional single-page PDF generation
  const handleTextPDF = async () => {
    if (!inspection) return;
    
    toast({ title: "يجهز", description: "يسوي تقرير PDF احترافي..." });
    
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
          text: 'المركبة بحالة ممتازة - لا توجد ملاحظات',
          style: 'successText',
          alignment: 'center',
          margin: [0, 20, 0, 20]
        });
      } else {
        // Group by category
        for (const cat of INSPECTION_CATEGORIES) {
          const catItemsWithImages = itemsWithImages.filter(({ item }) => item.category === cat.id);
          if (catItemsWithImages.length === 0) continue;
          
          // Category header
          findingsContent.push({
            text: cat.label,
            style: 'categoryHeader',
            margin: [0, 10, 0, 5]
          });
          
          // Items in this category
          catItemsWithImages.forEach(({ item, imageBase64 }) => {
            const faultAr = item.faultName.split(' - ')[0] || item.faultName;
            const statusSymbol = item.status === 'fail' ? '●' : '◐';
            const statusText = 'ملاحظة';
            const statusColor = item.status === 'fail' ? '#dc2626' : '#d97706';
            const bgColor = item.status === 'fail' ? '#fef2f2' : '#fffbeb';
            
            const itemContent: any = {
              table: {
                widths: imageBase64 ? ['70%', '30%'] : ['100%'],
                body: [[
                  {
                    stack: [
                      { text: faultAr, style: 'faultTitle', margin: [0, 0, 0, 3] },
                      { text: `${statusSymbol} ${statusText}`, color: statusColor, fontSize: 9, bold: true },
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
      
      // Build legacy table for backward compatibility (without images)
      const findingsRows: any[] = [];
      if (issueItems.length === 0) {
        findingsRows.push([
          { text: 'المركبة بحالة ممتازة - لا توجد ملاحظات', style: 'successText', colSpan: 3, alignment: 'center', margin: [0, 10, 0, 10] }, {}, {}
        ]);
      } else {
        for (const cat of INSPECTION_CATEGORIES) {
          const catItems = issueItems.filter((i: any) => i.category === cat.id);
          if (catItems.length === 0) continue;
          
          catItems.forEach((item: any, idx: number) => {
            const faultAr = item.faultName.split(' - ')[0] || item.faultName;
            const statusSymbol = item.status === 'fail' ? '●' : '◐';
            const statusText = 'ملاحظة';
            const statusColor = item.status === 'fail' ? '#dc2626' : '#d97706';
            const rowBg = idx % 2 === 0 ? '#ffffff' : '#fafafa';
            
            findingsRows.push([
              { text: idx === 0 ? cat.label : '', style: 'catLabel', fillColor: idx === 0 ? '#f8fafc' : rowBg, margin: [4, 4, 4, 4] },
              { text: faultAr, style: 'faultText', fillColor: rowBg, margin: [4, 4, 4, 4] },
              { text: `${statusSymbol} ${statusText}`, style: 'statusText', color: statusColor, fillColor: rowBg, margin: [4, 4, 4, 4], alignment: 'center' }
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
                    [{ text: 'رقم الشاصي VIN:', style: 'fieldLabel', margin: [5, 4, 5, 4] }, { text: inspection.vin || '-', style: 'vinValue', margin: [5, 4, 5, 4] }]
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
          
          // Customer Signature Section (if available)
          ...((inspection as any).customerSignature ? [
            { text: '', margin: [0, 10, 0, 0] },
            {
              columns: [
                { text: '', width: '*' },
                { 
                  stack: [
                    { text: 'توقيع العميل', style: 'fieldLabel', alignment: 'center', margin: [0, 0, 0, 5] },
                    { image: (inspection as any).customerSignature, width: 100, height: 40, alignment: 'center' }
                  ],
                  width: 120
                }
              ]
            }
          ] : []),
          
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
      toast({ title: "خطأ", description: "صار خطأ في إنشاء التقرير", variant: "destructive" });
    }
  };

  // OLD: Detailed PDF with images (keeping for reference but not used)
  const handleDetailedPDF = async () => {
    if (!inspection) return;
    
    toast({ title: "يجهز", description: "يسوي التقرير المفصل..." });
    
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
          text: 'المركبة بحالة ممتازة - لم يتم اكتشاف أي ملاحظات',
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
            const statusText = item.status === 'fail' ? 'يحتاج إصلاح' : 'ملاحظة';
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
                  { text: statusText, style: 'statusBadge', color: statusColor, width: 'auto' }
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
                        [{ text: 'رقم الشاصي:', style: 'label' }, { text: inspection.vin || '-', style: 'vinValue' }],
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
              { stack: [{ text: String(passedCount), style: 'statNumber', color: '#16a34a' }, { text: 'سليم', style: 'statLabel' }], alignment: 'center', width: '*' },
              { stack: [{ text: String(warningCount), style: 'statNumber', color: '#d97706' }, { text: 'ملاحظات', style: 'statLabel' }], alignment: 'center', width: '*' },
              { stack: [{ text: String(failCount), style: 'statNumber', color: '#dc2626' }, { text: 'يحتاج إصلاح', style: 'statLabel' }], alignment: 'center', width: '*' }
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
      toast({ title: "خطأ", description: "صار خطأ في سوي ملف PDF", variant: "destructive" });
    }
  };

  const handleShareReport = async () => {
    try {
      // Generate a public share token
      const response = await fetch(`/api/inspections/${id}/share`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to generate share link');
      
      const { token } = await response.json();
      const shareUrl = `${window.location.origin}/view/${token}`;
      
      if (navigator.share) {
        await navigator.share({
          title: `تقرير فحص - ${inspection?.make} ${inspection?.model}`,
          text: `تقرير فحص سيارة من High Safety`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({ 
          title: "انسخ اللينك", 
          description: "لينك للتقرير - الكستمر يقدر يشوفه بدون تسجيل" 
        });
      }
    } catch (err) {
      console.error("Error sharing:", err);
      toast({ 
        title: "خطأ", 
        description: "ما قدر يسوي لينك المشاركة",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50 font-arabic">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-primary font-bold">يحمل التقرير...</span>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 font-arabic">التقرير مو موجود</h2>
        <p className="text-slate-500 font-arabic mt-2">تأكد من اللينك</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <img src={logoPath} alt="Logo" className="w-10 h-10 object-contain rounded-xl" />
            <div className="text-right">
              <h1 className="text-lg font-black text-slate-900 font-arabic">تقرير الفحص التفاعلي</h1>
              <p className="text-xs text-slate-400 font-mono">{inspection.vin}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleShareReport} className="font-arabic">
              <Share2 className="w-4 h-4 ml-1" />
              <span className="hidden md:inline">مشاركة</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.print()} className="font-arabic">
              <Printer className="w-4 h-4 ml-1" />
              <span className="hidden md:inline">طباعة</span>
            </Button>
            <Button variant="default" size="sm" onClick={handleNewPdfDownload} className="font-arabic bg-primary hover:bg-primary/90">
              <Download className="w-4 h-4 ml-1" />
              تحميل PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div id="report-content" className="max-w-6xl mx-auto py-6 px-4 space-y-6 print:py-0">
        {/* Company Header */}
        <CompanyHeader />

        {/* 3D Car Visualization */}
        <Car3DVisualization 
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

        {/* Inspection Results */}
        <InspectionResults inspection={inspection} highlightedCategory={highlightedCategory} />

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
        <div className="bg-slate-900 text-white rounded-3xl p-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src={logoPath} alt="Logo" className="w-8 h-8 object-contain rounded-lg" />
            <span className="font-bold font-arabic">مركز الأمان العالي الدولي</span>
          </div>
          <p className="text-sm text-white/60 font-arabic max-w-2xl mx-auto leading-relaxed">
            هذا التقرير إلكتروني وتفاعلي صادر عن مركز الأمان العالي الدولي لفحص المركبات. 
            النتائج مبنية على حالة المركبة وقت الفحص وقد تتغير مع الاستخدام.
          </p>
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-2 md:gap-6 text-xs text-white/40">
            <a 
              href="https://wa.me/971542206000" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-green-400 transition-colors flex items-center gap-1"
              data-testid="link-whatsapp-footer"
            >
              <span>WhatsApp: 0542206000</span>
            </a>
            <span className="hidden md:inline">|</span>
            <span>highsafety2021@gmail.com</span>
            <span className="hidden md:inline">|</span>
            <span>سيتي بلازا الدراري - الشارقة</span>
          </div>
        </div>
      </div>

      {/* Hidden PDF Template */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, pointerEvents: 'none' }}>
        <PdfReportTemplate ref={pdfTemplateRef} inspection={inspection} />
      </div>
    </div>
  );
}
