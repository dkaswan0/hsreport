import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useState, useMemo } from "react";
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
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import logoPath from "@assets/logo_1767706304085.png";
import carVisualizationPath from "@assets/generated_images/professional_car_anatomy_diagram.png";
import type { Inspection, InspectionItem } from "@shared/schema";
import { INSPECTION_CATEGORIES, CATEGORY_GROUPS } from "@shared/categories";

type InspectionWithItems = Inspection & { items: InspectionItem[] };

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
  const [rotateY, setRotateY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const getCategoryStatus = (catId: string) => {
    const catItems = items.filter(i => i.category === catId);
    if (catItems.length === 0) return 'none';
    if (catItems.some(i => i.status === 'fail')) return 'fail';
    if (catItems.some(i => i.status === 'warning')) return 'warning';
    return 'none';
  };

  const getStatusStyles = (status: string, isHovered: boolean) => {
    const base = isHovered ? 'scale-110' : '';
    switch (status) {
      case 'fail': return `bg-red-500 border-red-300 shadow-red-500/60 ${base}`;
      case 'warning': return `bg-amber-500 border-amber-300 shadow-amber-500/60 ${base}`;
      default: return '';
    }
  };

  const handleRotate = () => {
    setIsAnimating(true);
    setRotateY(prev => prev + 45);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const stats = useMemo(() => {
    let warning = 0, fail = 0;
    const categoriesWithItems = new Set(items.map(i => i.category));
    INSPECTION_CATEGORIES.forEach(cat => {
      if (categoriesWithItems.has(cat.id)) {
        const status = getCategoryStatus(cat.id);
        if (status === 'warning') warning++;
        else if (status === 'fail') fail++;
      }
    });
    return { warning, fail };
  }, [items]);

  const categoriesWithIssues = useMemo(() => {
    return INSPECTION_CATEGORIES.filter(cat => {
      const position = CATEGORY_POSITIONS[cat.id];
      if (!position) return false;
      const status = getCategoryStatus(cat.id);
      return status !== 'none';
    });
  }, [items]);

  return (
    <div className="relative w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-3xl overflow-hidden">
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
        <button 
          onClick={handleRotate}
          className="p-2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm rounded-xl transition-colors"
        >
          <RotateCcw className={cn("w-5 h-5", isAnimating && "animate-spin")} />
        </button>
        <div className="flex gap-2">
          {stats.warning > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{stats.warning} تحذير</span>
            </div>
          )}
          {stats.fail > 0 && (
            <div className="flex items-center gap-1.5 bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm">
              <XCircle className="w-3.5 h-3.5" />
              <span>{stats.fail} خطير</span>
            </div>
          )}
        </div>
      </div>

      <div 
        className="relative w-full aspect-square md:aspect-[16/10] flex items-center justify-center"
        style={{ perspective: '1500px' }}
      >
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white/5 to-transparent" />
        
        <div 
          className="relative w-[85%] h-[75%] transition-transform duration-500 ease-out"
          style={{ 
            transformStyle: 'preserve-3d',
            transform: `rotateY(${rotateY}deg) rotateX(5deg)`
          }}
        >
          <img 
            src={carVisualizationPath} 
            alt="Vehicle Visualization" 
            className="w-full h-full object-contain drop-shadow-2xl"
          />

          {categoriesWithIssues.map(cat => {
            const position = CATEGORY_POSITIONS[cat.id];
            const status = getCategoryStatus(cat.id);
            const isHovered = hoveredCategory === cat.id;
            
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryClick(cat.id)}
                onMouseEnter={() => setHoveredCategory(cat.id)}
                onMouseLeave={() => setHoveredCategory(null)}
                onTouchStart={() => setHoveredCategory(cat.id)}
                className={cn(
                  "absolute flex flex-col items-center justify-center rounded-xl text-white transition-all duration-300 cursor-pointer z-10 border-2",
                  getStatusStyles(status, isHovered),
                  "shadow-lg min-w-[32px] min-h-[32px] p-1.5",
                  !isHovered && "animate-pulse"
                )}
                style={position as any}
              >
                {status === 'fail' ? <XCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {isHovered && (
                  <div className="absolute top-full mt-2 bg-slate-900/95 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap z-50 border border-white/20 shadow-xl">
                    <div className="font-arabic mb-1">{cat.label}</div>
                    <div className="text-[10px] text-white/70 font-arabic">اضغط لمعرفة العطل</div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 text-center space-y-3">
        <div className="flex justify-center gap-4 text-xs font-bold font-arabic text-white/80">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50 border border-amber-300" />
            <span>تحذير</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50 border border-red-300" />
            <span>خطير</span>
          </div>
        </div>
        {categoriesWithIssues.length > 0 && (
          <div className="text-white/50 text-xs font-arabic flex items-center justify-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>اضغط على أي علامة لمعرفة تفاصيل العطل</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function PublicReport() {
  const [, params] = useRoute("/view/:token");
  const token = params?.token;
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null);
  
  const { data: inspection, isLoading, error } = useQuery<InspectionWithItems>({
    queryKey: ['/api/public/report', token],
    queryFn: async () => {
      const res = await fetch(`/api/public/report/${token}`);
      if (!res.ok) throw new Error('Report not found');
      return res.json();
    },
    enabled: !!token
  });

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
          <p className="text-white/70 font-arabic">يحمل التقرير...</p>
        </div>
      </div>
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
    if (failCount > 0) return { label: 'يبي تصليح عاجل', color: 'text-red-400', bg: 'bg-red-500/20', icon: XCircle };
    if (warningCount > 0) return { label: 'يبي متابعة', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: AlertCircle };
    return { label: 'ممتازة', color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: CheckCircle2 };
  };

  const status = getOverallStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" dir="rtl">
      {selectedImage && (
        <ImageModal 
          imageUrl={selectedImage.url} 
          faultName={selectedImage.name} 
          onClose={() => setSelectedImage(null)} 
        />
      )}
      
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <img src={logoPath} alt="High Safety" className="h-16 md:h-20" />
            <div className="text-left">
              <div className="text-xs text-white/50 font-arabic">رقم التقرير</div>
              <div className="text-lg font-mono font-bold">HS-{inspection.id}-{new Date().getFullYear()}</div>
            </div>
          </div>
          
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-4xl font-black mb-2 font-arabic">
              {inspection.make} {inspection.model} {inspection.year}
            </h1>
            <p className="text-white/60 font-mono tracking-widest">{inspection.vin}</p>
          </div>

          <div className={cn("flex items-center justify-center gap-3 py-4 rounded-2xl", status.bg)}>
            <status.icon className={cn("w-8 h-8", status.color)} />
            <span className={cn("text-2xl font-black font-arabic", status.color)}>{status.label}</span>
          </div>
        </div>

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

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 font-arabic text-slate-800">
            <Car className="w-6 h-6 text-primary" />
            معلومات السيارة
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
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
              <div className="text-xs md:text-sm text-slate-500 font-arabic mb-1">عداد الكيلومترات</div>
              <div className="font-bold text-base md:text-lg text-slate-800">{inspection.odometer?.toLocaleString() || '0'} كم</div>
            </div>
          </div>
          {inspection.customerName && (
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
              <div className="bg-slate-50 rounded-lg md:rounded-xl p-2 md:p-3">
                <div className="text-xs md:text-sm text-slate-500 font-arabic mb-1 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  اسم العميل
                </div>
                <div className="font-bold text-base md:text-lg text-slate-800">{inspection.customerName}</div>
              </div>
              {inspection.customerPhone && (
                <div className="bg-slate-50 rounded-lg md:rounded-xl p-2 md:p-3">
                  <div className="text-xs md:text-sm text-slate-500 font-arabic mb-1 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    رقم الهاتف
                  </div>
                  <div className="font-bold text-base md:text-lg text-slate-800 font-mono">{inspection.customerPhone}</div>
                </div>
              )}
            </div>
          )}
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

        <div className="bg-slate-900 rounded-2xl p-8 text-center text-white">
          <img src={logoPath} alt="High Safety" className="h-14 mx-auto mb-4" />
          <h3 className="text-lg font-bold font-arabic mb-2">
            هاي سيفتي انترناشيونال
          </h3>
          <p className="text-white/60 text-sm font-arabic">
            مركز فحص السيارات المعتمد - الشارقة، الإمارات
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
