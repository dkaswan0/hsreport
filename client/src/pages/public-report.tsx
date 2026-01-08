import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
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
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import logoPath from "@assets/logo_1767706304085.png";
import type { Inspection, InspectionItem } from "@shared/schema";
import { INSPECTION_CATEGORIES } from "@shared/categories";

type InspectionWithItems = Inspection & { items: InspectionItem[] };

export default function PublicReport() {
  const [, params] = useRoute("/view/:token");
  const token = params?.token;
  
  const { data: inspection, isLoading, error } = useQuery<InspectionWithItems>({
    queryKey: ['/api/public/report', token],
    queryFn: async () => {
      const res = await fetch(`/api/public/report/${token}`);
      if (!res.ok) throw new Error('Report not found');
      return res.json();
    },
    enabled: !!token
  });

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
  const failCount = items.filter(i => i.status === 'fail').length;
  const warningCount = items.filter(i => i.status === 'warning').length;
  const passCount = items.filter(i => i.status === 'pass').length;

  const getOverallStatus = () => {
    if (failCount > 0) return { label: 'يبي تصليح عاجل', color: 'text-red-400', bg: 'bg-red-500/20', icon: XCircle };
    if (warningCount > 0) return { label: 'يبي متابعة', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: AlertCircle };
    return { label: 'ممتازة', color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: CheckCircle2 };
  };

  const status = getOverallStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" dir="rtl">
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <img src={logoPath} alt="High Safety" className="h-16 md:h-20" />
            <div className="text-left">
              <div className="text-xs text-white/50 font-arabic">رقم التقرير</div>
              <div className="text-lg font-mono font-bold">#{inspection.id}</div>
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

        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 text-center shadow-sm border border-slate-100">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-emerald-600">{passCount}</div>
            <div className="text-xs md:text-sm text-slate-600 font-arabic font-semibold">سليم</div>
          </div>
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

        {items.length > 0 && (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold flex items-center gap-2 font-arabic text-slate-800">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                تفاصيل الفحص الكامل
              </h2>
              <p className="text-slate-500 text-sm mt-1 font-arabic">جميع الملاحظات والأعطال المكتشفة أثناء الفحص</p>
            </div>
            
            <div className="divide-y divide-slate-100">
              {INSPECTION_CATEGORIES.map(cat => {
                const catItems = items.filter(i => i.category === cat.id);
                if (catItems.length === 0) return null;
                
                return (
                  <div key={cat.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-slate-700 font-arabic">{cat.label}</h3>
                      <span className="text-xs text-slate-400">{cat.labelEn}</span>
                    </div>
                    <div className="space-y-2">
                      {catItems.map(item => (
                        <div 
                          key={item.id} 
                          className={cn(
                            "p-3 rounded-xl flex items-start gap-3",
                            item.status === 'fail' ? 'bg-red-50' : 
                            item.status === 'warning' ? 'bg-amber-50' : 'bg-emerald-50'
                          )}
                        >
                          {item.status === 'fail' ? <XCircle className="w-5 h-5 text-red-500 shrink-0" /> :
                           item.status === 'warning' ? <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" /> :
                           <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                          <div className="flex-1">
                            <div className="font-bold text-slate-800 font-arabic">{item.faultName.split(' - ')[0]}</div>
                            {item.description && (
                              <p className="text-sm text-slate-600 mt-1 font-arabic">{item.description}</p>
                            )}
                          </div>
                          {item.imageUrl && (
                            <img 
                              src={item.imageUrl} 
                              alt="صورة العطل" 
                              className="w-16 h-16 rounded-lg object-cover shrink-0"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
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
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-white/50 text-sm font-arabic">
              تقرير فحص رسمي صادر من نظام الفحص الإلكتروني
            </p>
            <p className="text-white/40 text-sm mt-2 font-arabic">
              تاريخ التقرير: {new Date().toLocaleDateString('ar-AE', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
