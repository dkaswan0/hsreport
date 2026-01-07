import { useInspection, useCreateInspectionItem, useDeleteInspectionItem, useUpdateInspection, useFaultSuggestions, usePhotoAnalysis } from "@/hooks/use-inspections";
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
  Camera,
  Sparkles,
  Wand2,
  FileText,
  Search,
  Check
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import type { InspectionItem, CreateInspectionItemRequest, FaultLibrary } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { INSPECTION_CATEGORIES, CATEGORY_GROUPS, getCategoryLabel } from "@shared/categories";

export default function InspectionDetails() {
  const [, params] = useRoute("/inspections/:id");
  const id = Number(params?.id);
  const { data: inspection, isLoading, error } = useInspection(id);
  const [activeCategory, setActiveCategory] = useState("front_bumper");
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const updateInspection = useUpdateInspection();
  
  const { toast } = useToast();

  if (isLoading) return <div className="flex justify-center items-center h-96"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  if (!inspection && error) return (
    <div className="text-center p-12">
      <div className="text-red-500 text-xl mb-4">حدث خطأ أثناء تحميل الفحص</div>
      <p className="text-slate-500 mb-4">تأكد من اتصالك بالإنترنت وحاول مرة أخرى</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white rounded-lg">إعادة المحاولة</button>
    </div>
  );
  if (!inspection) return (
    <div className="text-center p-12">
      <div className="text-amber-500 text-xl mb-4">الفحص غير موجود</div>
      <p className="text-slate-500 mb-4">قد يكون تم حذف هذا الفحص أو الرابط غير صحيح</p>
      <a href="/" className="px-4 py-2 bg-primary text-white rounded-lg inline-block">العودة للرئيسية</a>
    </div>
  );

  const filteredItems = inspection.items?.filter(item => item.category === activeCategory) || [];

  const handleStatusUpdate = (status: 'completed' | 'draft') => {
    updateInspection.mutate({ id, status }, {
      onSuccess: () => {
        toast({ title: "تم التحديث", description: "تم تحديث حالة الفحص بنجاح" });
        if (status === 'completed') {
          window.location.assign(`/reports/${id}`);
        }
      },
      onError: () => {
        toast({ title: "خطأ", description: "فشل في تحديث حالة الفحص، حاول مرة أخرى", variant: "destructive" });
      }
    });
  };

  const handlePrint = () => {
    // Mock print functionality - would hook into API
    window.print();
  };

  return (
    <div className="min-h-[calc(100vh-100px)] flex flex-col gap-4 animate-in fade-in duration-500 pb-20 md:pb-0">
      
      {/* Mobile Horizontal Categories - Scrollable */}
      <div className="md:hidden bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 text-sm">أقسام الفحص</div>
        <div className="overflow-x-auto overscroll-x-contain">
          <div className="flex gap-2 p-3 min-w-max">
            {INSPECTION_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-4 py-2.5 rounded-xl transition-all whitespace-nowrap text-sm font-medium",
                  activeCategory === cat.id 
                    ? "bg-primary text-white shadow-md shadow-primary/20" 
                    : "bg-slate-100 text-slate-600 active:bg-slate-200"
                )}
                data-testid={`category-mobile-${cat.id}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 flex-1">
        {/* Desktop Sidebar Categories */}
        <div className="hidden md:flex w-64 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-col">
          <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700">أقسام الفحص</div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {INSPECTION_CATEGORIES.map(cat => (
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
                  <span className="font-medium">{cat.label}</span>
                </div>
                <ChevronRight className={cn("w-4 h-4 transition-transform rtl:rotate-180", activeCategory === cat.id ? "text-white" : "text-slate-300")} />
              </button>
            ))}
          </div>
        </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        
        {/* Top Vehicle Info Card - Mobile Optimized */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-lg md:text-2xl font-bold text-slate-900">{inspection.make} {inspection.model} {inspection.year}</h2>
                <StatusBadge status={inspection.status || 'draft'} />
              </div>
              <p className="text-slate-500 font-mono tracking-wider text-sm">{inspection.vin}</p>
            </div>
            {/* Desktop Action Buttons - Hidden on mobile (moved to bottom bar) */}
            <div className="hidden md:flex gap-3">
              <button 
                onClick={() => window.location.href = `/reports/${id}`}
                className="p-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                title="التقرير التفاعلي"
                data-testid="button-interactive-report"
              >
                <FileText className="w-5 h-5" />
              </button>
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
        </div>

        {/* Category Items */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          {/* Vehicle Data Section (CarsXE Specs) */}
          {(() => {
            const rawNotes = inspection.notes;
            if (!rawNotes) return null;
            
            let specs: any = null;
            try {
              if (rawNotes.startsWith('{')) {
                specs = JSON.parse(rawNotes);
              }
            } catch (e) {}

            if (!specs || typeof specs !== 'object') return null;

            return (
              <div className="p-4 md:p-6 bg-slate-50 border-b border-slate-100">
                <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2 font-arabic">
                  <span className="w-1.5 h-4 bg-primary rounded-full" />
                  بيانات السيارة الفنية
                </h3>
                {specs.arabicSummary && (
                  <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-xl text-sm text-slate-700 font-arabic leading-relaxed">
                    {specs.arabicSummary}
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-right" dir="rtl">
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-arabic">المحرك</div>
                    <div className="text-xs font-bold truncate">{specs.engine || "N/A"}</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-arabic">ناقل الحركة</div>
                    <div className="text-xs font-bold truncate">{specs.transmission || "N/A"}</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-arabic">نظام الدفع</div>
                    <div className="text-xs font-bold truncate">{specs.drivetrain || "N/A"}</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-arabic">بلد الصنع</div>
                    <div className="text-xs font-bold truncate">{specs.made_in || "N/A"}</div>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                {INSPECTION_CATEGORIES.find(c => c.id === activeCategory)?.label}
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
      </div>

      {/* Mobile Fixed Bottom Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 z-50 flex gap-2 safe-area-pb">
        <button 
          onClick={() => setIsAddItemOpen(true)}
          className="flex-1 px-4 py-3 bg-primary text-white rounded-xl flex items-center justify-center gap-2 text-sm font-bold active:scale-95 transition-transform"
          data-testid="button-add-item-mobile"
        >
          <Plus className="w-5 h-5" />
          إضافة ملاحظة
        </button>
        {inspection.status === 'draft' && (
          <button 
            onClick={() => handleStatusUpdate('completed')}
            className="px-4 py-3 bg-green-600 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-bold active:scale-95 transition-transform"
            data-testid="button-complete-mobile"
          >
            <Save className="w-5 h-5" />
          </button>
        )}
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
  
  const [arabic, english] = item.faultName.split(" - ");
  const isGood = item.status === 'pass';
  const isWarning = item.status === 'warning';

  return (
    <div className="flex flex-col gap-4 p-5 rounded-2xl border bg-white hover:border-primary/20 transition-all group relative shadow-sm">
      <div className="flex items-start gap-4">
        {isGood ? (
          <div className="p-2.5 rounded-xl shrink-0 border-green-200 bg-green-50">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
        ) : isWarning ? (
          <div className="p-2.5 rounded-xl shrink-0 border-amber-200 bg-amber-50">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
        ) : (
          <div className="p-2.5 rounded-xl shrink-0 border-red-200 bg-red-50">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-0.5">
            <h4 className="font-bold text-lg text-slate-900 leading-tight">
              {isGood ? "جيد" : arabic}
            </h4>
            {!isGood && english && <span className="text-sm font-medium text-slate-400 font-mono tracking-tight uppercase">{english}</span>}
          </div>
          
          {item.description && (
            <div className="mt-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-sm text-slate-600">{item.description}</p>
            </div>
          )}
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
  const [aiSuggestions, setAiSuggestions] = useState<Array<{faultName: string, severity: string, cause?: string, description?: string}>>([]);
  const [detectedPart, setDetectedPart] = useState<string>("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const photoAnalysis = usePhotoAnalysis();

  // Reset state when dialog opens/closes or category changes
  useEffect(() => {
    if (isOpen) {
      setFormData({ status: 'fail', severity: 'medium', faultName: '', description: '', category });
      setPhoto(null);
      setAiSuggestions([]);
      setDetectedPart("");
      setSearchQuery("");
    }
  }, [isOpen, category]);

  // Simple photo upload without AI analysis
  const handleSimplePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhoto(base64);
        setFormData(prev => ({ ...prev, imageUrl: base64 }));
        // No AI analysis - just attach the photo
      };
      reader.readAsDataURL(file);
    }
  };

  // Photo upload with AI analysis
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setPhoto(base64);
        setFormData(prev => ({ ...prev, imageUrl: base64 }));
        
        // Trigger AI analysis
        try {
          const result = await photoAnalysis.mutateAsync(base64);
          setDetectedPart(result.detectedPartArabic || result.detectedPart);
          setAiSuggestions(result.suggestedFaults || []);
        } catch (err) {
          console.error("AI analysis failed:", err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const simplePhotoInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useCreateInspectionItem();
  const { data: library = [] } = useQuery<FaultLibrary[]>({ 
    queryKey: ['/api/fault-library'],
    enabled: isOpen
  });

  const { toast } = useToast();

  // Map category IDs to Arabic fault library categories (23 categories in fault library)
  const categoryToArabicFaultLibrary: Record<string, string[]> = {
    front_bumper: ['الدعامية الأمامية'],
    rear_bumper: ['الدعامية الخلفية'],
    bumper_frame_front: ['جسر الدعامية الأمامية'],
    bumper_frame_rear: ['جسر الدعامية الخلفية'],
    hood: ['البونيت'],
    front_chest: ['صدر السيارة الأمامي'],
    rear_chest: ['صدر السيارة الخلفي'],
    fender_front_right: ['المدقار الأمامي يمين'],
    fender_front_left: ['المدقار الأمامي يسار'],
    fender_rear_right: ['المدقار الخلفي يمين'],
    fender_rear_left: ['المدقار الخلفي يسار'],
    door_front_right: ['الباب الأمامي يمين'],
    door_front_left: ['الباب الأمامي يسار'],
    door_rear_right: ['الباب الخلفي يمين'],
    door_rear_left: ['الباب الخلفي يسار'],
    trunk: ['الدبة'],
    quarter_panel: ['الفخد'],
    roof: ['السقف'],
    pillars: ['القوائم'],
    windows: ['الجامات'],
    lights_front: ['الليتات الأمامية'],
    lights_rear: ['الليتات الخلفية'],
    interior: ['الداخلية'],
  };
  
  // Always show ALL faults for selection (user requested this)
  const categoryFaults = useMemo(() => {
    return library;
  }, [library]);

  // Filter faults based on search query
  const filteredFaults = useMemo(() => {
    if (!searchQuery.trim()) return categoryFaults;
    const query = searchQuery.toLowerCase();
    return categoryFaults.filter(f => 
      f.faultName.toLowerCase().includes(query) || 
      f.description?.toLowerCase().includes(query)
    );
  }, [categoryFaults, searchQuery]);

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
      imageUrl: formData.imageUrl || photo || undefined
    }, {
      onSuccess: () => {
        toast({ title: "تم", description: "انضافت الملاحظة بنجاح" });
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
      setSearchOpen(false);
      // Auto-open simple camera after fault selection (no AI analysis needed)
      setTimeout(() => {
        simplePhotoInputRef.current?.click();
      }, 300);
    } else {
      setFormData(prev => ({ ...prev, faultName: name }));
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm animate-in fade-in" />
        <Dialog.Content className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white rounded-t-3xl md:rounded-2xl shadow-2xl p-4 md:p-6 w-full md:max-w-lg z-50 animate-in slide-in-from-bottom md:zoom-in-95 duration-200 overflow-y-auto max-h-[85vh] md:max-h-[90vh]">
          <Dialog.Title className="text-xl font-bold mb-4 text-slate-900">زيد ملاحظة يديدة</Dialog.Title>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">اختار العطل</label>
              <div className="relative">
                <div className="flex items-center border border-slate-200 rounded-xl px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  <input
                    type="text"
                    placeholder="دور على العطل..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchOpen(true)}
                    className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-400 text-right"
                    data-testid="input-fault-search"
                  />
                </div>
                {searchOpen && (
                  <div className="absolute inset-x-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-[100] max-h-[200px] overflow-y-auto">
                    <div className="sticky top-0 flex items-center justify-between px-3 py-2 border-b bg-white rounded-t-xl z-10">
                      <span className="text-sm font-medium text-slate-700">الأعطال ({filteredFaults.length})</span>
                      <button
                        type="button"
                        onClick={() => setSearchOpen(false)}
                        className="p-1 text-slate-500 hover:text-slate-700"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                    {filteredFaults.length === 0 ? (
                      <div className="py-4 text-center text-sm text-slate-500">ما لقينا شي</div>
                    ) : (
                      filteredFaults.slice(0, 50).map(fault => (
                        <button
                          key={fault.id}
                          type="button"
                          onClick={() => {
                            handleFaultSelect(fault.faultName);
                            setSearchOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between gap-2 px-3 py-2 text-right hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer border-b border-slate-100",
                            formData.faultName === fault.faultName && "bg-primary/10"
                          )}
                          data-testid={`fault-item-${fault.id}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{fault.faultName}</div>
                            <div className="text-xs text-slate-400">{getCategoryLabel(fault.category) || fault.category}</div>
                          </div>
                          {formData.faultName === fault.faultName && (
                            <Check className="w-5 h-5 text-primary shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {formData.faultName && (
                <div className="mt-2 p-2 bg-primary/5 rounded-lg border border-primary/20 text-sm text-primary flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>تم الاختيار: {formData.faultName}</span>
                </div>
              )}
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
                    {status === 'pass' ? 'جيد' : status === 'fail' ? 'معيب' : 'تنبيه'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">التفاصيل</label>
              <textarea 
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all min-h-[60px] md:min-h-[80px]"
                placeholder="زيد تفاصيل..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" />
                صورة العطل
              </label>
              
              {/* Hidden inputs for both photo types */}
              <input
                type="file"
                ref={simplePhotoInputRef}
                onChange={handleSimplePhotoUpload}
                accept="image/*"
                capture="environment"
                className="hidden"
                data-testid="input-simple-photo"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                capture="environment"
                className="hidden"
                data-testid="input-ai-photo"
              />
              
              {/* Two buttons: Simple photo (left) and AI analysis (right) */}
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  className={cn(
                    "border-2 border-dashed rounded-xl py-3 transition-colors flex flex-col items-center justify-center gap-1",
                    photo && !detectedPart ? "border-primary text-primary bg-primary/5" : "border-slate-300 text-slate-600 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
                  )}
                  onClick={() => simplePhotoInputRef.current?.click()}
                  data-testid="button-simple-photo"
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-xs font-medium">صورة بس</span>
                  <span className="text-[10px] text-slate-400">بدون تحليل</span>
                </button>
                
                <button 
                  type="button"
                  className={cn(
                    "border-2 border-dashed rounded-xl py-3 transition-colors flex flex-col items-center justify-center gap-1",
                    photo && detectedPart ? "border-amber-500 text-amber-600 bg-amber-50" : "border-amber-300 text-amber-600 bg-amber-50 hover:border-amber-400 hover:bg-amber-100"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-ai-photo"
                >
                  <div className="flex items-center gap-1">
                    <Camera className="w-5 h-5" />
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium">تحليل ذكي</span>
                  <span className="text-[10px] text-amber-500">يكتشف العطل</span>
                </button>
              </div>
              {photo && (
                <div className="mt-2 relative w-full h-32 md:h-40 rounded-xl overflow-hidden border border-slate-200">
                  <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => { setPhoto(null); setFormData(prev => ({ ...prev, imageUrl: undefined })); setAiSuggestions([]); setDetectedPart(""); }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {/* AI Analysis Results */}
              {photoAnalysis.isPending && (
                <div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-2 text-amber-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-arabic">يحلل الصورة... لحظة</span>
                </div>
              )}
              
              {detectedPart && !photoAnalysis.isPending && (
                <div className="mt-2 p-2 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-2 text-green-700">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-bold font-arabic">لقينا: {detectedPart}</span>
                  </div>
                  {aiSuggestions.length > 0 && (
                    <div className="mt-2 space-y-1 max-h-[120px] overflow-y-auto">
                      {aiSuggestions.slice(0, 3).map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              faultName: suggestion.faultName,
                              description: suggestion.cause || suggestion.description || '',
                              severity: suggestion.severity
                            }));
                          }}
                          className="w-full text-right p-2 bg-white rounded-lg border border-green-100 hover:border-green-300 transition-all text-sm"
                        >
                          <div className="font-medium text-slate-800 font-arabic text-xs">{suggestion.faultName}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                لا خلاص
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
