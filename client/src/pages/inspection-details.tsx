import { useInspection, useCreateInspectionItem, useDeleteInspectionItem, useUpdateInspection, useFaultSuggestions } from "@/hooks/use-inspections";
import { useRoute } from "wouter";
import { 
  Car, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Printer, 
  Save, 
  Plus, 
  Trash2,
  ChevronRight,
  Loader2,
  Camera
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import type { InspectionItem, CreateInspectionItemRequest } from "@shared/schema";

const CATEGORIES = [
  { id: "engine", label: "المحرك", icon: "⚙️" },
  { id: "transmission", label: "ناقل الحركة", icon: "🕹️" },
  { id: "chassis", label: "الشاصي", icon: "🔧" },
  { id: "body", label: "الهيكل الخارجي", icon: "🚗" },
  { id: "brakes", label: "الفرامل", icon: "🛑" },
  { id: "electric", label: "الكهرباء", icon: "⚡" },
  { id: "interior", label: "الداخلية", icon: "💺" },
  { id: "ac", label: "التكييف", icon: "❄️" },
];

export default function InspectionDetails() {
  const [, params] = useRoute("/inspections/:id");
  const id = Number(params?.id);
  const { data: inspection, isLoading, error } = useInspection(id);
  const [activeCategory, setActiveCategory] = useState("engine");
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const updateInspection = useUpdateInspection();
  
  const { toast } = useToast();

  if (isLoading) return <div className="flex justify-center items-center h-96"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  if (error || !inspection) return <div className="text-center p-12 text-red-500">حدث خطأ أثناء تحميل الفحص</div>;

  const filteredItems = inspection.items?.filter(item => item.category === activeCategory) || [];

  const handleStatusUpdate = (status: 'completed' | 'draft') => {
    updateInspection.mutate({ id, status }, {
      onSuccess: () => toast({ title: "تم التحديث", description: "تم تحديث حالة الفحص بنجاح" })
    });
  };

  const handlePrint = () => {
    // Mock print functionality - would hook into API
    window.print();
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-500">
      
      {/* Sidebar Categories */}
      <div className="w-full md:w-64 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700">أقسام الفحص</div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-right",
                activeCategory === cat.id 
                  ? "bg-primary text-white shadow-md shadow-primary/20" 
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <div className="flex items-center gap-3">
                <span>{cat.icon}</span>
                <span className="font-medium">{cat.label}</span>
              </div>
              <ChevronRight className={cn("w-4 h-4 transition-transform rtl:rotate-180", activeCategory === cat.id ? "text-white" : "text-slate-300")} />
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        
        {/* Top Vehicle Info Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-slate-900">{inspection.make} {inspection.model} {inspection.year}</h2>
              <StatusBadge status={inspection.status || 'draft'} />
            </div>
            <p className="text-slate-500 font-mono tracking-wider">{inspection.vin}</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handlePrint}
              className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="طباعة التقرير"
            >
              <Printer className="w-5 h-5" />
            </button>
            {inspection.status === 'draft' ? (
              <button 
                onClick={() => handleStatusUpdate('completed')}
                className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg shadow-green-600/20 transition-all flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                <span>إنهاء الفحص</span>
              </button>
            ) : (
              <button 
                onClick={() => handleStatusUpdate('draft')}
                className="px-6 py-3 rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-semibold shadow-lg transition-all"
              >
                إعادة للعمل
              </button>
            )}
          </div>
        </div>

        {/* Category Items */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                {CATEGORIES.find(c => c.id === activeCategory)?.label}
                <span className="text-sm font-normal text-slate-400 bg-white px-2 py-0.5 rounded-full border">
                  {filteredItems.length} عنصر
                </span>
              </h3>
            </div>
            <button 
              onClick={() => setIsAddItemOpen(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              إضافة ملاحظة
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <Car className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>لا توجد ملاحظات مسجلة في هذا القسم</p>
                <button 
                  onClick={() => setIsAddItemOpen(true)}
                  className="mt-4 text-primary hover:underline"
                >
                  إضافة ملاحظة جديدة
                </button>
              </div>
            ) : (
              filteredItems.map(item => (
                <InspectionItemCard key={item.id} item={item} inspectionId={id} />
              ))
            )}
          </div>
        </div>
      </div>

      <AddItemDialog 
        isOpen={isAddItemOpen} 
        onClose={() => setIsAddItemOpen(false)} 
        category={activeCategory}
        inspectionId={id}
      />
    </div>
  );
}

function InspectionItemCard({ item, inspectionId }: { item: InspectionItem, inspectionId: number }) {
  const deleteMutation = useDeleteInspectionItem();
  
  const statusColors = {
    pass: "border-green-200 bg-green-50 text-green-700",
    fail: "border-red-200 bg-red-50 text-red-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
  };
  
  const statusIcons = {
    pass: <CheckCircle2 className="w-5 h-5 text-green-600" />,
    fail: <XCircle className="w-5 h-5 text-red-600" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600" />,
  };

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border bg-white hover:border-primary/20 transition-all group relative">
      <div className={cn("p-2 rounded-lg", statusColors[item.status as keyof typeof statusColors])}>
        {statusIcons[item.status as keyof typeof statusIcons]}
      </div>
      
      <div className="flex-1">
        <h4 className="font-bold text-slate-900">{item.faultName}</h4>
        {item.description && <p className="text-sm text-slate-600 mt-1">{item.description}</p>}
        {item.imageUrl && (
          <div className="mt-3">
            <img src={item.imageUrl} alt="Fault" className="h-20 w-auto rounded-lg border border-slate-200" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 left-4 rtl:right-auto rtl:left-4">
        <button 
          onClick={() => deleteMutation.mutate({ id: item.id, inspectionId })}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function AddItemDialog({ isOpen, onClose, category, inspectionId }: { isOpen: boolean, onClose: () => void, category: string, inspectionId: number }) {
  const [formData, setFormData] = useState<Partial<CreateInspectionItemRequest>>({
    status: 'fail',
    severity: 'medium',
    faultName: '',
    description: '',
    category
  });

  const createMutation = useCreateInspectionItem();
  const suggestions = useFaultSuggestions();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.faultName) return;

    createMutation.mutate({
      inspectionId,
      category,
      faultName: formData.faultName!,
      status: formData.status as any,
      description: formData.description,
      severity: formData.severity,
      imageUrl: formData.imageUrl
    }, {
      onSuccess: () => {
        toast({ title: "تمت الإضافة", description: "تمت إضافة الملاحظة بنجاح" });
        setFormData({ status: 'fail', severity: 'medium', faultName: '', description: '', category });
        onClose();
      }
    });
  };

  const handleSuggestion = (query: string) => {
    setFormData(prev => ({ ...prev, faultName: query }));
    if (query.length > 2) {
      suggestions.mutate(query, {
        onSuccess: (data) => {
          if (data) {
             // If exact match found or AI returns structure
             setFormData(prev => ({
               ...prev,
               description: data.description,
               severity: data.severity,
             }));
          }
        }
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg z-50 animate-in zoom-in-95 duration-200">
          <Dialog.Title className="text-xl font-bold mb-4 text-slate-900">إضافة ملاحظة جديدة</Dialog.Title>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">اسم العطل</label>
              <div className="relative">
                <input 
                  value={formData.faultName}
                  onChange={(e) => handleSuggestion(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  placeholder="مثال: تسريب زيت..."
                  autoFocus
                />
                {suggestions.isPending && (
                  <Loader2 className="absolute left-3 top-2.5 w-4 h-4 animate-spin text-slate-400 rtl:right-auto rtl:left-3" />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
              <div className="flex gap-2">
                {(['pass', 'warning', 'fail'] as const).map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({ ...formData, status })}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium border transition-all",
                      formData.status === status 
                        ? status === 'pass' ? "bg-green-100 border-green-300 text-green-700"
                        : status === 'fail' ? "bg-red-100 border-red-300 text-red-700"
                        : "bg-amber-100 border-amber-300 text-amber-700"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {status === 'pass' ? 'سليم' : status === 'fail' ? 'معيب' : 'تنبيه'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">الوصف</label>
              <textarea 
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all min-h-[80px]"
                placeholder="تفاصيل إضافية..."
              />
            </div>
            
            <div>
              <button 
                type="button"
                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                onClick={() => {
                   // Mock upload logic
                   const url = "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=200&h=200&fit=crop";
                   setFormData({ ...formData, imageUrl: url });
                   toast({ title: "صورة تجريبية", description: "تم إرفاق صورة تجريبية (الخادم يحتاج إعداد رفع الملفات)" });
                }}
              >
                <Camera className="w-5 h-5" />
                {formData.imageUrl ? "تم إرفاق الصورة" : "إرفاق صورة"}
              </button>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
              <button 
                type="submit"
                disabled={createMutation.isPending || !formData.faultName}
                className="flex-1 py-3 rounded-xl font-medium bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? "جاري الحفظ..." : "حفظ الملاحظة"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
