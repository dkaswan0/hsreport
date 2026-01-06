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
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useState, useMemo } from "react";
import logoPath from "@assets/logo_1767706304085.png";

// Category mapping with positions for 3D car visualization
const CATEGORIES = [
  { id: "engine", label: "المكينة", labelEn: "Engine", position: { top: "8%", left: "50%", transform: "translateX(-50%)" } },
  { id: "transmission", label: "ناقل الحركة", labelEn: "Transmission", position: { top: "45%", left: "50%", transform: "translateX(-50%)" } },
  { id: "chassis", label: "الشاصي", labelEn: "Chassis", position: { top: "65%", left: "50%", transform: "translateX(-50%)" } },
  { id: "body", label: "البودي", labelEn: "Body", position: { top: "35%", left: "15%" } },
  { id: "tires", label: "الكوتش", labelEn: "Tires", position: { top: "75%", left: "20%" } },
  { id: "brakes", label: "الفرامل", labelEn: "Brakes", position: { top: "75%", left: "80%" } },
  { id: "electric", label: "الكهرباء", labelEn: "Electrical", position: { top: "25%", left: "85%" } },
  { id: "wheels", label: "الجنوط", labelEn: "Wheels", position: { top: "55%", left: "10%" } },
  { id: "suspension", label: "التعليق", labelEn: "Suspension", position: { top: "55%", left: "90%" } },
  { id: "ac", label: "التكييف", labelEn: "A/C", position: { top: "20%", left: "35%" } },
  { id: "exhaust", label: "العادم", labelEn: "Exhaust", position: { top: "85%", left: "50%", transform: "translateX(-50%)" } },
  { id: "safety", label: "السلامة", labelEn: "Safety", position: { top: "30%", left: "65%" } },
];

// Realistic 3D Car Component with CSS animations
const Car3DVisualization = ({ items, onCategoryClick }: { items: any[], onCategoryClick: (cat: string) => void }) => {
  const [rotateY, setRotateY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const getCategoryStatus = (catId: string) => {
    const catItems = items.filter(i => i.category === catId);
    if (catItems.length === 0) return 'good';
    if (catItems.some(i => i.status === 'fail')) return 'fail';
    if (catItems.some(i => i.status === 'warning')) return 'warning';
    return 'good';
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

  const handleRotate = () => {
    setIsAnimating(true);
    setRotateY(prev => prev + 45);
    setTimeout(() => setIsAnimating(false), 600);
  };

  // Calculate summary stats
  const stats = useMemo(() => {
    let good = 0, warning = 0, fail = 0;
    CATEGORIES.forEach(cat => {
      const status = getCategoryStatus(cat.id);
      if (status === 'good') good++;
      else if (status === 'warning') warning++;
      else fail++;
    });
    return { good, warning, fail, total: CATEGORIES.length };
  }, [items]);

  return (
    <div className="relative w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleRotate}
          className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
        >
          <RotateCcw className={cn("w-5 h-5", isAnimating && "animate-spin")} />
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
        className="relative w-full aspect-[16/10] flex items-center justify-center"
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
          {/* Main car body - SVG based realistic representation */}
          <svg viewBox="0 0 400 180" className="w-full h-full drop-shadow-2xl">
            {/* Car shadow */}
            <ellipse cx="200" cy="175" rx="160" ry="8" fill="rgba(0,0,0,0.3)" />
            
            {/* Car body base */}
            <path 
              d="M50,120 L70,70 Q80,50 120,50 L280,50 Q320,50 330,70 L350,120 Q355,130 350,140 L50,140 Q45,130 50,120" 
              fill="url(#carGradient)" 
              stroke="rgba(255,255,255,0.2)" 
              strokeWidth="1"
            />
            
            {/* Roof */}
            <path 
              d="M100,50 L120,25 Q130,15 160,15 L240,15 Q270,15 280,25 L300,50" 
              fill="url(#roofGradient)" 
              stroke="rgba(255,255,255,0.3)" 
              strokeWidth="1"
            />
            
            {/* Windows */}
            <path 
              d="M110,48 L125,28 Q132,22 155,22 L180,22 L180,48 Z" 
              fill="url(#windowGradient)" 
              opacity="0.9"
            />
            <path 
              d="M185,22 L185,48 L260,48 L260,22 Q250,22 245,28 L232,28 Q220,22 185,22 Z" 
              fill="url(#windowGradient)" 
              opacity="0.9"
            />
            <path 
              d="M265,48 L280,28 Q287,22 290,48 Z" 
              fill="url(#windowGradient)" 
              opacity="0.9"
            />
            
            {/* Headlights */}
            <ellipse cx="60" cy="95" rx="12" ry="10" fill="#fff" opacity="0.9" />
            <ellipse cx="340" cy="95" rx="12" ry="10" fill="#fff" opacity="0.9" />
            
            {/* Taillights */}
            <rect x="345" y="90" width="8" height="20" rx="2" fill="#ef4444" opacity="0.8" />
            <rect x="47" y="90" width="8" height="20" rx="2" fill="#ef4444" opacity="0.8" />
            
            {/* Front/Rear wheels */}
            <circle cx="100" cy="140" r="28" fill="#1e293b" stroke="#374151" strokeWidth="4" />
            <circle cx="100" cy="140" r="15" fill="#475569" />
            <circle cx="100" cy="140" r="8" fill="#1e293b" />
            
            <circle cx="300" cy="140" r="28" fill="#1e293b" stroke="#374151" strokeWidth="4" />
            <circle cx="300" cy="140" r="15" fill="#475569" />
            <circle cx="300" cy="140" r="8" fill="#1e293b" />
            
            {/* Wheel details */}
            <g fill="#64748b">
              <rect x="95" cy="125" width="10" height="3" rx="1" transform="rotate(0 100 140)" />
              <rect x="95" cy="125" width="10" height="3" rx="1" transform="rotate(72 100 140)" />
              <rect x="95" cy="125" width="10" height="3" rx="1" transform="rotate(144 100 140)" />
              <rect x="95" cy="125" width="10" height="3" rx="1" transform="rotate(216 100 140)" />
              <rect x="95" cy="125" width="10" height="3" rx="1" transform="rotate(288 100 140)" />
            </g>
            
            {/* Gradients */}
            <defs>
              <linearGradient id="carGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="roofGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="windowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
            </defs>
          </svg>

          {/* Category indicators overlaid on car */}
          {CATEGORIES.map(cat => {
            const status = getCategoryStatus(cat.id);
            const hasIssues = status !== 'good';
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryClick(cat.id)}
                className={cn(
                  "absolute flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold text-white transition-all duration-300 cursor-pointer z-10",
                  getStatusColor(status),
                  "shadow-lg hover:scale-110",
                  hasIssues && "animate-pulse"
                )}
                style={cat.position as any}
              >
                {getStatusIcon(status)}
                <span className="hidden md:inline">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-6 text-xs font-bold font-arabic text-white/80">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
          <span>سليم</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50" />
          <span>يحتاج متابعة</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
          <span>يحتاج إصلاح</span>
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
  // Parse color to get primary color only
  const primaryColor = useMemo(() => {
    const colorStr = inspection.color || '';
    // If multiple colors separated by comma, take first one
    const colors = colorStr.split(',');
    if (colors.length > 0) {
      const first = colors[0].trim();
      // Simplify long color names
      if (first.length > 25) {
        return first.split(' ').slice(0, 2).join(' ');
      }
      return first;
    }
    return colorStr || 'غير محدد';
  }, [inspection.color]);

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
          <div className="text-xs text-white/50 font-arabic">رقم التقرير</div>
          <div className="font-mono font-bold text-primary-foreground">HS-{inspection.id}-{new Date().getFullYear()}</div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 rounded-2xl p-4 text-right">
          <div className="flex items-center gap-2 justify-end text-slate-400 mb-2">
            <span className="text-xs font-arabic">سنة الصنع</span>
            <Calendar className="w-4 h-4" />
          </div>
          <div className="text-xl font-black text-slate-900">{inspection.year}</div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 text-right">
          <div className="flex items-center gap-2 justify-end text-slate-400 mb-2">
            <span className="text-xs font-arabic">عداد الكيلومتر</span>
            <Gauge className="w-4 h-4" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">{inspection.odometer?.toLocaleString() || '0'} <span className="text-sm text-slate-400">كم</span></div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 text-right">
          <div className="flex items-center gap-2 justify-end text-slate-400 mb-2">
            <span className="text-xs font-arabic">اللون</span>
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-700" />
          </div>
          <div className="text-sm font-bold text-slate-900 font-arabic">{primaryColor}</div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 text-right">
          <div className="flex items-center gap-2 justify-end text-slate-400 mb-2">
            <span className="text-xs font-arabic">نوع الوقود</span>
            <Fuel className="w-4 h-4" />
          </div>
          <div className="text-sm font-bold text-slate-900">بنزين</div>
        </div>
      </div>

      {/* VIN Section */}
      <div className="px-6 pb-6">
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <div className="text-right">
              <div className="text-xs text-slate-500 font-arabic">رقم الشاصي (VIN)</div>
              <div className="font-mono font-black text-lg text-slate-900 tracking-wider">{inspection.vin}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-primary font-arabic">
            <CheckCircle2 className="w-4 h-4" />
            تم التحقق من صحة الرقم
          </div>
        </div>
      </div>
    </div>
  );
};

// Customer Info Card
const CustomerInfoCard = ({ inspection }: { inspection: any }) => (
  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
    <div className="flex items-center gap-4 justify-end">
      <div className="text-right flex-1">
        <div className="text-xs text-slate-400 font-arabic mb-1">معلومات العميل</div>
        <div className="font-bold text-lg text-slate-900 font-arabic">{inspection.customerName || 'عميل زائر'}</div>
        {inspection.customerPhone && (
          <div className="text-sm text-slate-600 font-mono mt-1">{inspection.customerPhone}</div>
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

      {CATEGORIES.map(cat => {
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
                    <div className="flex items-start justify-between gap-2 flex-row-reverse mb-2">
                      <h4 className="font-bold text-slate-900 font-arabic text-lg">{item.faultName.split(' - ')[0]}</h4>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold",
                        item.status === 'fail' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {item.status === 'fail' ? 'يحتاج إصلاح' : 'يحتاج متابعة'}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mb-2">{item.faultName.split(' - ')[1]}</p>
                    <p className="text-sm text-slate-600 font-arabic leading-relaxed">{item.description}</p>
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
          <h3 className="text-xl font-bold text-emerald-800 font-arabic mb-2">المركبة بحالة ممتازة</h3>
          <p className="text-emerald-600 font-arabic">لم يتم اكتشاف أي أعطال أو ملاحظات تستوجب الاهتمام</p>
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
    
    toast({ title: "جاري التحضير", description: "جاري إنشاء نسخة PDF من التقرير..." });
    
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

  const handleShareReport = async () => {
    const shareUrl = `${window.location.origin}/reports/${id}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `تقرير فحص - ${inspection?.make} ${inspection?.model}`,
          text: `تقرير فحص مركبة من مركز الأمان العالي الدولي`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({ 
          title: "تم نسخ الرابط", 
          description: "يمكنك الآن مشاركة رابط التقرير" 
        });
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50 font-arabic">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-primary font-bold">جاري تحميل التقرير...</span>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 font-arabic">التقرير غير موجود</h2>
        <p className="text-slate-500 font-arabic mt-2">تأكد من صحة رابط التقرير</p>
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
            <Button variant="default" size="sm" onClick={handleDownloadPDF} className="font-arabic">
              <Download className="w-4 h-4 ml-1" />
              PDF
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
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center gap-6 text-xs text-white/40">
            <span>WhatsApp: 0542206000</span>
            <span>|</span>
            <span>highsafety2021@gmail.com</span>
            <span>|</span>
            <span>سيتي بلازا الدراري - الشارقة</span>
          </div>
        </div>
      </div>
    </div>
  );
}
