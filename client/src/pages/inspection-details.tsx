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
import { INSPECTION_CATEGORIES, CATEGORY_GROUPS } from "@shared/categories";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function InspectionDetails() {
  const [, params] = useRoute("/inspections/:id");
  const id = Number(params?.id);
  const { data: inspection, isLoading, error } = useInspection(id);
  const [activeCategory, setActiveCategory] = useState("front_bumper");
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
  const [aiSuggestions, setAiSuggestions] = useState<Array<{faultName: string, severity: string, description: string}>>([]);
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
  
  // Get faults for the current category, or show all if no mapping exists
  const arabicCategories = categoryToArabicFaultLibrary[category] || [];
  const categoryFaults = useMemo(() => {
    if (library.length === 0) return [];
    // If no specific mapping for this category, show all faults for selection
    if (arabicCategories.length === 0) return library;
    const filtered = library.filter(f => arabicCategories.includes(f.category));
    // If filtered list is empty, show all faults as fallback
    return filtered.length > 0 ? filtered : library;
  }, [library, arabicCategories]);

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
      setSearchOpen(false);
      // Auto-open camera after fault selection
      setTimeout(() => {
        fileInputRef.current?.click();
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
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg z-50 animate-in zoom-in-95 duration-200">
          <Dialog.Title className="text-xl font-bold mb-4 text-slate-900">إضافة ملاحظة جديدة</Dialog.Title>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">اختيار العطل</label>
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    data-testid="button-fault-selector"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white text-right flex items-center justify-between gap-2"
                  >
                    <span className={cn("flex-1 text-right", !formData.faultName && "text-slate-400")}>
                      {formData.faultName || "ابحث واختر العطل..."}
                    </span>
                    <Search className="w-4 h-4 text-slate-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="اكتب للبحث عن العطل..." 
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      data-testid="input-fault-search"
                    />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>لا توجد نتائج</CommandEmpty>
                      <CommandGroup heading={`الأعطال المتاحة (${filteredFaults.length})`}>
                        {filteredFaults.map(fault => (
                          <CommandItem
                            key={fault.id}
                            value={fault.faultName}
                            onSelect={() => handleFaultSelect(fault.faultName)}
                            className="flex items-center justify-between gap-2 cursor-pointer"
                            data-testid={`fault-item-${fault.id}`}
                          >
                            <div className="flex-1 text-right">
                              <div className="font-medium">{fault.faultName}</div>
                              {fault.description && (
                                <div className="text-xs text-slate-500 truncate max-w-[300px]">{fault.description}</div>
                              )}
                            </div>
                            {formData.faultName === fault.faultName && (
                              <Check className="w-4 h-4 text-primary" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {formData.faultName && (
                <div className="mt-2 p-2 bg-primary/5 rounded-lg border border-primary/20 text-sm text-primary flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>تم اختيار: {formData.faultName}</span>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">الوصف</label>
              <textarea 
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all min-h-[80px]"
                placeholder="تفاصيل إضافية..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" />
                صورة العطل + تحليل ذكي
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                capture="environment"
                className="hidden"
                data-testid="input-photo-capture"
              />
              <button 
                type="button"
                className={cn(
                  "w-full border-2 border-dashed rounded-xl transition-colors flex items-center justify-center gap-2",
                  photo ? "border-primary text-primary bg-primary/5" : "border-primary/50 text-primary bg-primary/5 hover:border-primary hover:bg-primary/10"
                )}
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-photo-capture"
              >
                <Camera className="w-5 h-5" />
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-bold">
                  {photo ? "تم إرفاق الصورة" : "التقط صورة + تحليل ذكي"}
                </span>
              </button>
              {photo && (
                <div className="mt-2 relative w-full aspect-video rounded-xl overflow-hidden border border-slate-200">
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
                <div className="mt-2 p-3 bg-primary/5 rounded-xl border border-primary/20 flex items-center gap-2 text-primary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-arabic">جاري تحليل الصورة بالذكاء الاصطناعي...</span>
                </div>
              )}
              
              {detectedPart && !photoAnalysis.isPending && (
                <div className="mt-2 p-3 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-bold font-arabic">تم التعرف على: {detectedPart}</span>
                  </div>
                  {aiSuggestions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-green-600 font-arabic">الأعطال المقترحة:</p>
                      {aiSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              faultName: suggestion.faultName,
                              description: suggestion.description,
                              severity: suggestion.severity
                            }));
                          }}
                          className="w-full text-right p-2 bg-white rounded-lg border border-green-100 hover:border-green-300 transition-all text-sm"
                        >
                          <div className="font-medium text-slate-800 font-arabic">{suggestion.faultName}</div>
                          <div className="text-xs text-slate-500 font-arabic">{suggestion.description}</div>
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
