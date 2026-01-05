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
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function InteractiveReport() {
  const [, params] = useRoute("/reports/:id");
  const id = Number(params?.id);
  const { data: inspection, isLoading } = useInspection(id);
  const { toast } = useToast();

  if (isLoading) return <div className="flex justify-center items-center h-screen font-arabic text-primary">جاري تحميل التقرير...</div>;
  if (!inspection) return <div className="text-center p-12 text-red-500 font-arabic">التقرير غير موجود</div>;

  const handleDownloadPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    toast({ title: "جاري التحضير", description: "جاري إنشاء نسخة PDF للتقرير..." });
    
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`HS_Report_${inspection.vin}.pdf`);
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
           
           <div className="flex flex-col items-center md:items-end text-center md:text-right z-10">
             <div className="text-3xl font-black text-primary tracking-tighter mb-2 font-arabic uppercase text-right">High Safety International</div>
             <div className="text-xl font-bold text-slate-700 font-arabic text-right">مركز الأمان العالي الدولي</div>
             <div className="text-sm text-slate-500 font-arabic text-right">لخدمات فحص وتسجيل السيارات | Car Inspection & Registration</div>
           </div>

           <div className="hidden md:block w-px h-24 bg-slate-100" />

           <div className="flex flex-col gap-2 text-sm text-slate-600 font-arabic z-10 text-right">
             <div className="flex items-center gap-2 justify-end">
               الشارقة - الصناعية 13 - طريق المدينة الجامعية
               <MapPin className="w-4 h-4 text-primary" />
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-primary to-primary/90 text-white">
            <CardContent className="p-6 text-right">
              <div className="flex items-center justify-end gap-4 mb-4">
                <div>
                  <div className="text-xs text-white/70 font-arabic">المركبة | Vehicle</div>
                  <div className="text-xl font-bold">{inspection.make} {inspection.model}</div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Car className="w-6 h-6" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-white/60 font-arabic text-right">سنة الصنع</div>
                  <div className="font-bold text-right">{inspection.year}</div>
                </div>
                <div>
                  <div className="text-white/60 font-arabic text-right">اللون</div>
                  <div className="font-bold text-right">{inspection.color}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-sm bg-white border border-slate-100">
            <CardContent className="p-6 text-right">
              <div className="flex items-center justify-end gap-4 mb-4">
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-arabic">رقم الشاصي | VIN</div>
                  <div className="text-lg font-bold font-mono tracking-wider">{inspection.vin}</div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[100%]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-sm bg-white border border-slate-100">
            <CardContent className="p-6 text-right">
              <div className="flex items-center justify-end gap-4 mb-4">
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-arabic">العميل | Customer</div>
                  <div className="text-lg font-bold font-arabic">{inspection.customerName || "عميل زائر"}</div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="text-sm text-slate-600 font-arabic text-right">{inspection.customerPhone}</div>
            </CardContent>
          </Card>
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
                     <div key={item.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
                        <div className="flex flex-row-reverse gap-4">
                          {item.imageUrl && (
                            <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                               <img src={item.imageUrl} className="w-full h-full object-cover" alt="Fault" />
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
                            <p className="text-sm text-slate-600 font-arabic leading-relaxed text-right">{item.description}</p>
                          </div>
                        </div>
                     </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

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
