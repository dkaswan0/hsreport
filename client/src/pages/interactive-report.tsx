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
  AlertCircle,
  ShieldCheck,
  Image as ImageIcon,
  X,
  Gauge
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useState } from "react";

// Mock Logo (in real app, use @assets/logo.png)
const LogoPlaceholder = () => (
  <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-primary/20">
    HS
  </div>
);

const CarVisual = ({ items }: { items: any[] }) => {
  const getCategoryStatus = (cat: string) => {
    const catItems = items.filter(i => i.category === cat);
    if (catItems.some(i => i.status === 'fail')) return 'bg-red-500';
    if (catItems.some(i => i.status === 'warning')) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto aspect-[2/1] bg-slate-50 rounded-3xl border border-slate-100 p-8 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <Car className="w-64 h-64" />
      </div>
      
      {/* Schematic Car Representation */}
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="w-4/5 h-2/3 border-4 border-slate-200 rounded-[60px] relative">
          {/* Front (Engine) */}
          <div className={cn("absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-8 rounded-full flex items-center justify-center text-[10px] text-white font-bold transition-colors", getCategoryStatus('engine'))}>المكينة</div>
          
          {/* Wheels */}
          <div className={cn("absolute -top-6 -left-4 w-12 h-16 rounded-xl border-2 border-white transition-colors", getCategoryStatus('tires'))}></div>
          <div className={cn("absolute -top-6 -right-4 w-12 h-16 rounded-xl border-2 border-white transition-colors", getCategoryStatus('tires'))}></div>
          <div className={cn("absolute -bottom-6 -left-4 w-12 h-16 rounded-xl border-2 border-white transition-colors", getCategoryStatus('tires'))}></div>
          <div className={cn("absolute -bottom-6 -right-4 w-12 h-16 rounded-xl border-2 border-white transition-colors", getCategoryStatus('tires'))}></div>

          {/* Body Parts */}
          <div className={cn("absolute top-1/2 left-0 -translate-y-1/2 w-4 h-32 rounded-full transition-colors", getCategoryStatus('body'))}></div>
          <div className={cn("absolute top-1/2 right-0 -translate-y-1/2 w-4 h-32 rounded-full transition-colors", getCategoryStatus('body'))}></div>
          
          {/* Chassis/Transmission Central Area */}
          <div className="absolute inset-8 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center gap-4">
             <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center text-[8px] text-white font-bold", getCategoryStatus('transmission'))}>القير</div>
             <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center text-[8px] text-white font-bold", getCategoryStatus('chassis'))}>الشاصي</div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-4 right-6 flex gap-4 text-[10px] font-bold font-arabic">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> سليم</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> تنبيه</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> معيب</div>
      </div>
    </div>
  );
};

export default function InteractiveReport() {
  const [, params] = useRoute("/reports/:id");
  const id = Number(params?.id);
  const { data: inspection, isLoading } = useInspection(id);
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<{ url: string, name: string, description: string } | null>(null);

  if (isLoading) return <div className="flex justify-center items-center h-screen font-arabic text-primary">جاري تحميل التقرير...</div>;
  if (!inspection) return <div className="text-center p-12 text-red-500 font-arabic">التقرير غير موجود</div>;

  const handleDownloadPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    toast({ title: "جاري التحضير", description: "جاري إنشاء نسخة PDF للتقرير..." });
    
    // Hide buttons for PDF
    const canvas = await html2canvas(element, { 
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.85);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // Multi-page PDF logic if needed, but for now single page or fit
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`HS_Report_${inspection.vin}.pdf`);
    toast({ title: "تم التحميل", description: "تم حفظ التقرير بصيغة PDF" });
  };

  const categories = ["المكينة", "البودي", "الكوتش", "الفرامل", "الكهرباء", "التعليق والتوجيه", "التبريد والتكييف", "العادم", "السلامة", "الجنوط", "ناقل الحركة", "الشاصي"];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12" dir="rtl">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-900 font-arabic text-right">تقرير فحص تفاعلي | Interactive Report</h1>
            <StatusBadge status={inspection.status || 'draft'} />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="font-arabic">
              <Printer className="w-4 h-4 ml-2" />
              طباعة
            </Button>
            <Button variant="default" size="sm" onClick={handleDownloadPDF} className="bg-primary font-arabic">
              <Download className="w-4 h-4 ml-2" />
              تحميل PDF
            </Button>
          </div>
        </div>
      </div>

      <div id="report-content" className="max-w-5xl mx-auto mt-8 px-6 space-y-8 print:mt-0 print:px-0">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row-reverse justify-between items-center gap-8 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-br-[100px] -ml-8 -mt-8" />
           
           <div className="flex items-center gap-6 z-10">
             <div className="flex flex-col items-end text-right">
               <div className="text-3xl font-black text-primary tracking-tighter mb-1 font-arabic uppercase">High Safety International</div>
               <div className="text-xl font-bold text-slate-700 font-arabic">مركز الأمان العالي الدولي</div>
               <div className="text-xs text-slate-400 font-arabic">لخدمات فحص وتسجيل السيارات | Car Inspection & Registration</div>
             </div>
             <LogoPlaceholder />
           </div>

           <div className="hidden md:block w-px h-24 bg-slate-100" />

           <div className="flex flex-col gap-2 text-sm text-slate-600 font-arabic z-10 text-right">
             <div className="flex items-center gap-2 justify-end font-bold text-primary">
               CITY PLAZA Al darari - الشارقة
               <MapPin className="w-4 h-4" />
             </div>
             <div className="flex items-center gap-2 justify-end">
               0542206000
               <Phone className="w-4 h-4 text-primary" />
             </div>
             <div className="flex items-center gap-2 justify-end">
               تاريخ الفحص: {inspection.createdAt ? new Date(inspection.createdAt).toLocaleDateString('ar-AE') : '-'}
               <Calendar className="w-4 h-4 text-primary" />
             </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-primary to-primary/90 text-white">
            <CardContent className="p-5 text-right">
              <div className="flex items-center justify-end gap-3 mb-3">
                <div className="text-right">
                  <div className="text-[10px] text-white/70 font-arabic">المركبة | Vehicle</div>
                  <div className="text-base font-bold leading-tight">{inspection.make} {inspection.model}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-white/10 p-2 rounded-xl">
                  <div className="text-white/60 font-arabic">سنة الصنع</div>
                  <div className="font-bold">{inspection.year}</div>
                </div>
                <div className="bg-white/10 p-2 rounded-xl">
                  <div className="text-white/60 font-arabic">اللون</div>
                  <div className="font-bold">{inspection.color}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-sm bg-white border border-slate-100">
            <CardContent className="p-5 text-right">
              <div className="flex items-center justify-end gap-3 mb-3">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-arabic">عداد المسافة | Odometer</div>
                  <div className="text-base font-bold font-mono">{inspection.odometer?.toLocaleString()} KM</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  <Gauge className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="text-[11px] text-slate-500 font-arabic bg-slate-50 p-2 rounded-xl">
                حالة المحرك تعتمد على المسافة
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-sm bg-white border border-slate-100">
            <CardContent className="p-5 text-right">
              <div className="flex items-center justify-end gap-3 mb-3">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-arabic">رقم الشاصي | VIN</div>
                  <div className="text-sm font-bold font-mono tracking-tighter">{inspection.vin}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="text-[11px] text-slate-500 font-arabic bg-slate-50 p-2 rounded-xl overflow-hidden text-ellipsis whitespace-nowrap">
                مرجع تقرير: HS-{inspection.id}-{new Date().getFullYear()}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-sm bg-white border border-slate-100">
            <CardContent className="p-5 text-right">
              <div className="flex items-center justify-end gap-3 mb-3">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-arabic">العميل | Customer</div>
                  <div className="text-base font-bold font-arabic">{inspection.customerName || "عميل زائر"}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="text-[11px] text-slate-600 font-arabic bg-slate-50 p-2 rounded-xl">{inspection.customerPhone}</div>
            </CardContent>
          </Card>
        </div>

        {/* CarsXE Technical Specifications Section */}
        {(inspection.notes || (inspection as any).specs) && (() => {
          let specs = (inspection as any).specs;
          if (!specs && inspection.notes) {
            try {
              specs = JSON.parse(inspection.notes);
            } catch (e) {
              return null;
            }
          }
          if (!specs) return null;

          return (
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-slate-900 font-arabic px-2 flex items-center gap-3 justify-end">
                بيانات السيارة من مركز الأمان | Technical Specifications
                <div className="w-2 h-8 bg-primary rounded-full" />
              </h2>
              <Card className="rounded-3xl border-none shadow-sm bg-white border border-slate-100 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse border-b">
                  <div className="p-6 text-right">
                    <div className="text-xs text-slate-400 font-arabic mb-1">المحرك | Engine</div>
                    <div className="font-bold text-slate-900">{specs.engine || specs.engine_cylinders || "N/A"}</div>
                  </div>
                  <div className="p-6 text-right">
                    <div className="text-xs text-slate-400 font-arabic mb-1">ناقل الحركة | Transmission</div>
                    <div className="font-bold text-slate-900">{specs.transmission || specs.transmission_type || "N/A"}</div>
                  </div>
                  <div className="p-6 text-right">
                    <div className="text-xs text-slate-400 font-arabic mb-1">نظام الدفع | Drivetrain</div>
                    <div className="font-bold text-slate-900">{specs.drivetrain || specs.drive_type || "N/A"}</div>
                  </div>
                </div>
                <div className="p-6 bg-slate-50/50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-right" dir="rtl">
                    <div>
                      <div className="text-[10px] text-slate-400 font-arabic uppercase">بلد الصنع | Origin</div>
                      <div className="text-sm font-bold">{specs.manufacturer_address || specs.assembly_country || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-arabic uppercase">نوع الوقود | Fuel</div>
                      <div className="text-sm font-bold">{specs.fuel_type || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-arabic uppercase">سعة المحرك | Displacement</div>
                      <div className="text-sm font-bold">{specs.displacement || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-arabic uppercase">القوة الحصانية | HP</div>
                      <div className="text-sm font-bold">{specs.horsepower || "N/A"}</div>
                    </div>
                    {specs.market_value && (
                      <div className="col-span-2 md:col-span-4 mt-4 pt-4 border-t border-slate-200">
                        <div className="text-[10px] text-slate-400 font-arabic uppercase">القيمة السوقية التقريبية | Market Value</div>
                        <div className="text-lg font-bold text-primary">{specs.market_value}</div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          );
        })()}

        <div className="space-y-4">
           <h2 className="text-xl font-black text-slate-900 font-arabic px-2 flex items-center gap-3 justify-end">
             توزيع الأعطال على جسم المركبة
             <div className="w-2 h-6 bg-primary rounded-full" />
           </h2>
           <CarVisual items={inspection.items || []} />
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-black text-slate-900 font-arabic px-2 flex items-center gap-3 justify-end">
             نتائج الفحص التفصيلية | Inspection Details
             <div className="w-2 h-8 bg-primary rounded-full" />
          </h2>

          {categories.map(cat => {
            const items = inspection.items?.filter(i => i.category === cat) || [];
            if (items.length === 0) return null;
            
            return (
              <div key={cat} className="space-y-4">
                <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold font-arabic flex justify-between items-center">
                  <span className="text-xs text-white/50">{items.length} ملاحظات</span>
                  <span>{cat}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map(item => (
                     <div 
                       key={item.id} 
                       onClick={() => item.imageUrl && setSelectedImage({ url: item.imageUrl, name: item.faultName, description: item.description || '' })}
                       className={cn(
                         "bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 group",
                         item.imageUrl && "cursor-pointer active:scale-[0.98]"
                       )}
                     >
                        <div className="flex flex-row-reverse gap-4">
                          {item.imageUrl && (
                            <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-slate-100 relative">
                               <img src={item.imageUrl} className="w-full h-full object-cover" alt="Fault" />
                               <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                 <ImageIcon className="w-6 h-6 text-white" />
                               </div>
                            </div>
                          )}
                          <div className="flex-1 text-right">
                            <div className="flex justify-between items-start mb-1 gap-2 flex-row-reverse">
                               <div className={cn(
                                 "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0",
                                 item.status === 'fail' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                               )}>
                                 {item.status === 'fail' ? 'معيب' : 'تنبيه'}
                               </div>
                               <h4 className="font-bold text-slate-900 font-arabic text-base">{item.faultName.split(' - ')[0]}</h4>
                            </div>
                            <p className="text-xs text-slate-400 font-mono uppercase mb-2 text-right">{item.faultName.split(' - ')[1]}</p>
                            <p className="text-sm text-slate-600 font-arabic leading-relaxed text-right line-clamp-2">{item.description}</p>
                          </div>
                        </div>
                        
                        {/* PDF View Images - Visible only in PDF/Print */}
                        {item.imageUrl && (
                          <div className="hidden print:block mt-4 border-t pt-4">
                             <div className="aspect-video rounded-2xl overflow-hidden border">
                               <img src={item.imageUrl} className="w-full h-full object-cover" alt="Full view" />
                             </div>
                          </div>
                        )}
                     </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal for Interactive Image Viewing */}
        {selectedImage && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedImage(null)}
          >
            <div 
              className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="aspect-square md:aspect-auto bg-slate-900 flex items-center justify-center">
                  <img src={selectedImage.url} alt="Fault" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="p-8 flex flex-col justify-center text-right" dir="rtl">
                  <h3 className="text-2xl font-black text-slate-900 font-arabic mb-4">{selectedImage.name.split(' - ')[0]}</h3>
                  <p className="text-sm text-slate-400 font-mono uppercase mb-6">{selectedImage.name.split(' - ')[1]}</p>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-lg text-slate-700 font-arabic leading-relaxed">
                      {selectedImage.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 text-center text-sm text-slate-500 font-arabic">
           <AlertCircle className="w-5 h-5 mx-auto mb-2 text-slate-400" />
           هذا التقرير إلكتروني وتفاعلي صادر عن مركز الأمان العالي الدولي. الأخطاء التقنية المكتشفة بناءً على حالة السيارة وقت الفحص.
           <br/>
           Interactive electronic report issued by High Safety International Center.
        </div>
      </div>
    </div>
  );
}