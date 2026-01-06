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
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import type { InspectionItem, CreateInspectionItemRequest, FaultLibrary } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

const CATEGORIES = [
  { id: "engine", label: "المكينة", icon: "⚙️" },
  { id: "transmission", label: "ناقل الحركة", icon: "🕹️" },
  { id: "chassis", label: "الشاصي", icon: "🔧" },
  { id: "body", label: "البودي", icon: "🚗" },
  { id: "tires", label: "الكوتش", icon: "🛞" },
  { id: "brakes", label: "الفرامل", icon: "🛑" },
  { id: "electric", label: "الكهرباء", icon: "⚡" },
  { id: "wheels", label: "الجنوط", icon: "🔘" },
  { id: "suspension", label: "التعليق والتوجيه", icon: "🛣️" },
  { id: "ac", label: "التبريد والتكييف", icon: "❄️" },
  { id: "exhaust", label: "العادم", icon: "💨" },
  { id: "safety", label: "السلامة", icon: "🛡️" },
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
      onSuccess: () => {
        toast({ title: "تم التحديث", description: "تم تحديث حالة الفحص بنجاح" });
        if (status === 'completed') {
          window.location.href = `/reports/${id}`;
        }
      }
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
          {/* Vehicle Data Section (CarsXE Specs) */}
          {inspection.notes && (() => {
            let specs: any = null;
            try {
              specs = JSON.parse(inspection.notes);
            } catch (e) {}

            if (!specs || typeof specs !== 'object') return null;

            return (
              <div className="p-6 bg-slate-50 border-b border-slate-100">
                <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2 font-arabic">
                  <span className="w-1.5 h-4 bg-primary rounded-full" />
                  بيانات السيارة الفنية | Technical Specs
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-right" dir="rtl">
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-arabic">المحرك</div>
                    <div className="text-xs font-bold truncate">{specs.engine || specs.engine_cylinders || "N/A"}</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-arabic">ناقل الحركة</div>
                    <div className="text-xs font-bold truncate">{specs.transmission || specs.transmission_type || "N/A"}</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-arabic">نظام الدفع</div>
                    <div className="text-xs font-bold truncate">{specs.drivetrain || specs.drive_type || "N/A"}</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-arabic">بلد الصنع</div>
                    <div className="text-xs font-bold truncate">{specs.manufacturer_address || specs.assembly_country || "N/A"}</div>
                  </div>
                </div>
              </div>
            );
          })()}

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

  const [arabic, english] = item.faultName.split(" - ");

  return (
    <div className="flex flex-col gap-4 p-5 rounded-2xl border bg-white hover:border-primary/20 transition-all group relative shadow-sm">
      <div className="flex items-start gap-4">
        <div className={cn("p-2.5 rounded-xl shrink-0", statusColors[item.status as keyof typeof statusColors])}>
          {statusIcons[item.status as keyof typeof statusIcons]}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-0.5">
            <h4 className="font-bold text-lg text-slate-900 leading-tight">{arabic}</h4>
            {english && <span className="text-sm font-medium text-slate-400 font-mono tracking-tight uppercase">{english}</span>}
          </div>
          
          <div className="mt-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-sm text-slate-700 font-medium">التشخيص / Diagnosis:</p>
            <p className="text-sm text-slate-600 mt-1">{item.description || "لا يوجد وصف إضافي"}</p>
          </div>
        </div>

        <button 
          onClick={() => deleteMutation.mutate({ id: item.id, inspectionId })}
          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 shrink-0"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {item.imageUrl && (
        <div className="relative group/img overflow-hidden rounded-xl border border-slate-200 aspect-video bg-slate-100">
          <img src={item.imageUrl} alt="Fault Evidence" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
        </div>
      )}
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

  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const createMutation = useCreateInspectionItem();
  const { data: library = [] } = useQuery<FaultLibrary[]>({ 
    queryKey: ['/api/fault-library'],
    enabled: isOpen
  });

  const { toast } = useToast();

  const categoryFaults = library.filter(f => f.category === CATEGORIES.find(c => c.id === category)?.label || f.category === category);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.faultName) return;

    // Fix: Pass the base64 image data directly to the mutation
    createMutation.mutate({
      inspectionId,
      category,
      faultName: formData.faultName!,
      status: formData.status as any,
      description: formData.description,
      severity: formData.severity,
      imageUrl: formData.imageUrl || photo || undefined // Ensure photo is passed if imageUrl is not set
    }, {
      onSuccess: () => {
        toast({ title: "تمت الإضافة", description: "تمت إضافة الملاحظة بنجاح" });
        setFormData({ status: 'fail', severity: 'medium', faultName: '', description: '', category });
        setPhoto(null);
        onClose();
      }
    });
  };

  const handleFaultSelect = (name: string) => {
    const fault = categoryFaults.find(f => f.faultName === name);
    if (fault) {
      setFormData(prev => ({
        ...prev,
        faultName: fault.faultName,
        description: fault.description || '',
        severity: (fault.severity as any) || 'medium'
      }));
    } else {
      setFormData(prev => ({ ...prev, faultName: name }));
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
              <label className="block text-sm font-medium text-slate-700 mb-1">اختيار العطل</label>
              <select
                value={formData.faultName}
                onChange={(e) => handleFaultSelect(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white"
              >
                <option value="">اختر العطل من القائمة...</option>
                {categoryFaults.map(f => (
                  <option key={f.id} value={f.faultName}>{f.faultName}</option>
                ))}
              </select>
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
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                capture="environment"
                className="hidden"
              />
              <button 
                type="button"
                className={cn(
                  "w-full py-3 border-2 border-dashed rounded-xl transition-colors flex items-center justify-center gap-2",
                  photo ? "border-primary text-primary bg-primary/5" : "border-slate-300 text-slate-500 hover:border-primary hover:text-primary"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-5 h-5" />
                {photo ? "تم إرفاق الصورة" : "إرفاق صورة العطل"}
              </button>
              {photo && (
                <div className="mt-2 relative w-full aspect-video rounded-xl overflow-hidden border border-slate-200">
                  <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => { setPhoto(null); setFormData(prev => ({ ...prev, imageUrl: undefined })); }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
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
