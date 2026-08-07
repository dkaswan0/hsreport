import { useInspection, useCreateInspectionItem, useDeleteInspectionItem, useUpdateInspectionItem, useUpdateInspection, useFaultSuggestions, usePhotoAnalysis } from "@/hooks/use-inspections";
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
  ChevronDown,
  Loader2,
  Camera,
  Sparkles,
  Wand2,
  FileText,
  Search,
  Check,
  Pencil,
  X,
  Monitor,
  Upload,
  Eye,
  EyeOff,
  Download,
  ExternalLink,
  Mic,
  MicOff,
  Volume2,
} from "lucide-react";
import { useState, useRef, useEffect, useMemo, useCallback, useDeferredValue } from "react";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import type { InspectionItem, CreateInspectionItemRequest, FaultLibrary, Inspection } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { INSPECTION_CATEGORIES, CATEGORY_GROUPS, MAIN_SECTIONS, getCategoryLabel } from "@shared/categories";
import { queryClient } from "@/lib/queryClient";

export default function InspectionDetails() {
  const [, params] = useRoute("/inspections/:id");
  const id = Number(params?.id);
  const { data: inspection, isLoading, error } = useInspection(id);
  const [activeCategory, setActiveCategory] = useState("front_bumper");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [prefilledFault, setPrefilledFault] = useState<FaultLibrary | null>(null);
  const globalSearchRef = useRef<HTMLInputElement>(null);
  const globalSearchContainerRef = useRef<HTMLDivElement>(null);
  const updateInspection = useUpdateInspection();
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editInfo, setEditInfo] = useState<Record<string, any>>({});
  const [isObdOpen, setIsObdOpen] = useState(false);
  
  const { toast } = useToast();

  const { data: allFaults = [] } = useQuery<FaultLibrary[]>({ 
    queryKey: ['/api/fault-library'],
  });

  const deferredSearch = useDeferredValue(globalSearch);

  const faultIndex = useMemo(() => {
    return allFaults.map(fault => ({
      fault,
      nameLower: fault.faultName.toLowerCase(),
      descLower: (fault.description || '').toLowerCase(),
      catLower: (fault.category || '').toLowerCase(),
    }));
  }, [allFaults]);

  const globalSearchResults = useMemo(() => {
    if (!deferredSearch.trim()) return [];
    const q = deferredSearch.trim().toLowerCase();
    const words = q.split(/\s+/);
    const scored: Array<{ fault: FaultLibrary; score: number }> = [];
    for (const item of faultIndex) {
      let score = 0;
      if (item.nameLower === q) { score = 100; }
      else if (item.nameLower.startsWith(q)) { score = 80; }
      else {
        let allMatch = true;
        for (const w of words) {
          if (item.nameLower.includes(w)) { score += 30; }
          else if (item.descLower.includes(w)) { score += 15; }
          else if (item.catLower.includes(w)) { score += 10; }
          else { allMatch = false; }
        }
        if (!allMatch) score = 0;
      }
      if (score > 0) scored.push({ fault: item.fault, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 50).map(s => s.fault);
  }, [deferredSearch, faultIndex]);

  useEffect(() => {
    if (!globalSearchOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (globalSearchContainerRef.current && !globalSearchContainerRef.current.contains(e.target as Node)) {
        setGlobalSearchOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setGlobalSearchOpen(false); setGlobalSearch(""); }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('keydown', handleEsc); };
  }, [globalSearchOpen]);

  const handleGlobalFaultSelect = useCallback((fault: FaultLibrary) => {
    setPrefilledFault(fault);
    setGlobalSearch("");
    setGlobalSearchOpen(false);
    setIsAddItemOpen(true);
  }, []);
  
  const getCategoriesForSection = (sectionId: string) => {
    const group = CATEGORY_GROUPS.find(g => g.sectionId === sectionId);
    if (!group) return [];
    return group.categories.map(catId => INSPECTION_CATEGORIES.find(c => c.id === catId)).filter(Boolean);
  };

  const toggleSection = (sectionId: string) => {
    const willExpand = !expandedSections[sectionId];
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: willExpand
    }));
    setActiveSection(sectionId);
    if (willExpand) {
      const cats = getCategoriesForSection(sectionId);
      if (cats.length > 0 && cats[0]) {
        setActiveCategory(cats[0].id);
      }
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-96"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  if (!inspection && error) return (
    <div className="text-center p-12">
      <div className="text-red-500 text-xl mb-4">حدث خطأ أثناء التحميل</div>
      <p className="text-slate-500 mb-4">تأكد من الاتصال بالإنترنت وحاول مرة أخرى</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white rounded-lg">إعادة المحاولة</button>
    </div>
  );
  if (!inspection) return (
    <div className="text-center p-12">
      <div className="text-amber-500 text-xl mb-4">الفحص غير موجود</div>
      <p className="text-slate-500 mb-4">قد يكون قد حُذف أو أن الرابط غير صحيح</p>
      <a href="/" className="px-4 py-2 bg-primary text-white rounded-lg inline-block">العودة للرئيسية</a>
    </div>
  );

  const filteredItems = inspection.items?.filter(item => item.category === activeCategory) || [];

  const handleStatusUpdate = (status: 'completed' | 'draft') => {
    updateInspection.mutate({ id, status }, {
      onSuccess: () => {
        toast({ title: "تم", description: "تم تحديث حالة الفحص" });
        if (status === 'completed') {
          window.location.assign(`/reports/${id}`);
        }
      },
      onError: () => {
        toast({ title: "خطأ", description: "تعذر تحديث الفحص، يرجى المحاولة مرة أخرى", variant: "destructive" });
      }
    });
  };

  const handlePrint = () => {
    // Mock print functionality - would hook into API
    window.print();
  };

  return (
    <div className="min-h-[calc(100vh-100px)] flex flex-col gap-4 animate-in fade-in duration-500 pb-20 md:pb-0">
      
      {/* ── Top Clean Tabs Navigation Bar (Modern & Non-Cluttered) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        
        {/* Main Sections Horizontal Tabs */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-arabic flex items-center justify-between">
            <span>الأقسام الرئيسية للفحص</span>
            <span className="text-slate-400 font-normal">اختر القسـم للتنقّـل السـريع</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {MAIN_SECTIONS.map((section) => {
              const isActive = (activeSection || "mechanic") === section.id;
              const sectionCategories = getCategoriesForSection(section.id);
              const itemCount = inspection?.items?.filter(item => 
                sectionCategories.some(c => c?.id === item.category)
              ).length || 0;

              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    const cats = getCategoriesForSection(section.id);
                    if (cats.length > 0 && cats[0]) {
                      setActiveCategory(cats[0].id);
                    }
                  }}
                  className={cn(
                    "px-4 py-2.5 rounded-xl font-arabic text-xs md:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 border shadow-sm",
                    isActive
                      ? "bg-[#0C1A28] text-white border-[#0C1A28] shadow-md ring-2 ring-[#C5852C]/30"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  )}
                  data-testid={`section-tab-${section.id}`}
                >
                  <span>{section.label}</span>
                  {itemCount > 0 && (
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold",
                      isActive ? "bg-[#C5852C] text-[#0C1A28]" : "bg-slate-200 text-slate-700"
                    )}>
                      {itemCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subcategories Horizontal Pills Bar */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none items-center">
            <span className="text-xs font-bold text-slate-400 font-arabic whitespace-nowrap me-1">الفئات:</span>
            {getCategoriesForSection(activeSection || "mechanic").map((cat) => {
              if (!cat) return null;
              const isCatActive = activeCategory === cat.id;
              const catItemCount = inspection?.items?.filter(item => item.category === cat.id).length || 0;

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 font-arabic border",
                    isCatActive
                      ? "bg-[#C5852C] text-[#0C1A28] border-[#C5852C] shadow-sm font-extrabold"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  )}
                  data-testid={`category-pill-${cat.id}`}
                >
                  <span>{cat.label}</span>
                  {catItemCount > 0 && (
                    <span className={cn(
                      "w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold",
                      isCatActive ? "bg-[#0C1A28] text-white" : "bg-slate-100 text-slate-600"
                    )}>
                      {catItemCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        
        {/* Top Vehicle Info Card */}
        <div className="bg-white rounded-xl p-4 md:p-5 border border-stone-100">
          {isEditingInfo ? (
            <div className="space-y-4" data-testid="edit-info-form">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-primary text-base flex items-center gap-2">
                  <Pencil className="w-4 h-4" />
                  تعديل بيانات الفحص
                </h3>
                <button onClick={() => setIsEditingInfo(false)} className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors" data-testid="btn-cancel-edit-info">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">الشركة المصنعة</label>
                  <input value={editInfo.make || ''} onChange={(e) => setEditInfo(d => ({ ...d, make: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" dir="auto" data-testid="input-edit-make" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">الطراز</label>
                  <input value={editInfo.model || ''} onChange={(e) => setEditInfo(d => ({ ...d, model: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" dir="auto" data-testid="input-edit-model" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">سنة الصنع</label>
                  <input type="number" value={editInfo.year || ''} onChange={(e) => setEditInfo(d => ({ ...d, year: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" data-testid="input-edit-year" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">اللون</label>
                  <input value={editInfo.color || ''} onChange={(e) => setEditInfo(d => ({ ...d, color: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" dir="auto" data-testid="input-edit-color" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">رقم الهيكل (VIN)</label>
                  <input value={editInfo.vin || ''} onChange={(e) => setEditInfo(d => ({ ...d, vin: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" dir="ltr" data-testid="input-edit-vin" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">عداد المسافة</label>
                  <input type="number" value={editInfo.odometer || ''} onChange={(e) => setEditInfo(d => ({ ...d, odometer: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" data-testid="input-edit-odometer" />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="text-xs font-bold text-slate-400 mb-2">بيانات العميل</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">اسم العميل</label>
                    <input value={editInfo.customerName || ''} onChange={(e) => setEditInfo(d => ({ ...d, customerName: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" dir="auto" data-testid="input-edit-customer-name" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">رقم الهاتف</label>
                    <input value={editInfo.customerPhone || ''} onChange={(e) => setEditInfo(d => ({ ...d, customerPhone: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" dir="ltr" data-testid="input-edit-customer-phone" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">نوع الفحص</label>
                    <select value={editInfo.inspectionType || ''} onChange={(e) => setEditInfo(d => ({ ...d, inspectionType: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-primary/30 outline-none bg-white" data-testid="select-edit-inspection-type">
                      <option value="فحص شامل">فحص شامل</option>
                      <option value="ميكانيكا+كومبيوتر">ميكانيكا+كومبيوتر</option>
                      <option value="الأجزاء الأساسية">الأجزاء الأساسية</option>
                      <option value="فحوصات متنوعة">فحوصات متنوعة</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-200">
                <button
                  onClick={() => {
                    const updates: Record<string, any> = {};
                    if (editInfo.make !== inspection.make) updates.make = editInfo.make;
                    if (editInfo.model !== inspection.model) updates.model = editInfo.model;
                    if (editInfo.year !== inspection.year) updates.year = editInfo.year;
                    if (editInfo.color !== inspection.color) updates.color = editInfo.color;
                    if (editInfo.vin !== inspection.vin) updates.vin = editInfo.vin;
                    if (editInfo.odometer !== inspection.odometer) updates.odometer = editInfo.odometer;
                    if (editInfo.customerName !== inspection.customerName) updates.customerName = editInfo.customerName;
                    if (editInfo.customerPhone !== inspection.customerPhone) updates.customerPhone = editInfo.customerPhone;
                    if (editInfo.inspectionType !== inspection.inspectionType) updates.inspectionType = editInfo.inspectionType;
                    
                    if (Object.keys(updates).length === 0) {
                      setIsEditingInfo(false);
                      return;
                    }
                    updateInspection.mutate({ id, ...updates }, {
                      onSuccess: () => {
                        setIsEditingInfo(false);
                        toast({ title: "تم تحديث البيانات بنجاح" });
                      },
                      onError: () => {
                        toast({ title: "خطأ", description: "تعذر تحديث البيانات", variant: "destructive" });
                      }
                    });
                  }}
                  disabled={updateInspection.isPending}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  data-testid="btn-save-edit-info"
                >
                  {updateInspection.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  حفظ التعديلات
                </button>
                <button
                  onClick={() => setIsEditingInfo(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
                  data-testid="btn-discard-edit-info"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div className="flex-1 min-w-0">
              {/* Title row */}
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h2 className="text-xl md:text-2xl font-bold text-stone-900 leading-none">
                  {inspection.make} {inspection.model} {inspection.year}
                </h2>
                <StatusBadge status={inspection.status || 'draft'} />
              </div>
              {/* VIN */}
              <p className="font-mono text-xs tracking-widest text-stone-400 mb-3 pb-3 border-b border-stone-100">
                {inspection.vin}
              </p>
              {/* Data grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {inspection.color && (
                  <div>
                    <div className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold mb-0.5">اللون</div>
                    <div className="text-sm font-semibold text-stone-700">{inspection.color}</div>
                  </div>
                )}
                {inspection.odometer && (
                  <div>
                    <div className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold mb-0.5">العداد</div>
                    <div className="text-sm font-semibold text-stone-700 font-mono">{inspection.odometer?.toLocaleString()} كم</div>
                  </div>
                )}
                {inspection.customerName && (
                  <div>
                    <div className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold mb-0.5">العميل</div>
                    <div className="text-sm font-semibold text-stone-700">{inspection.customerName}</div>
                  </div>
                )}
                {inspection.customerPhone && (
                  <div>
                    <div className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold mb-0.5">الجوال</div>
                    <div className="text-sm font-semibold text-stone-700 font-mono" dir="ltr">{inspection.customerPhone}</div>
                  </div>
                )}
                {inspection.inspectionType && (
                  <div>
                    <div className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold mb-0.5">نوع الفحص</div>
                    <div className="text-sm font-semibold" style={{ color: '#C5852C' }}>{inspection.inspectionType}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-start gap-2">
              <button
                onClick={() => {
                  setEditInfo({
                    make: inspection.make || '',
                    model: inspection.model || '',
                    year: inspection.year || '',
                    color: inspection.color || '',
                    vin: inspection.vin || '',
                    odometer: inspection.odometer || '',
                    customerName: inspection.customerName || '',
                    customerPhone: inspection.customerPhone || '',
                    inspectionType: inspection.inspectionType || 'فحص شامل',
                  });
                  setIsEditingInfo(true);
                }}
                className="p-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
                title="تعديل البيانات"
                data-testid="button-edit-info"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => window.location.href = `/reports/${id}`}
                className="p-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
                title="التقرير"
                data-testid="button-interactive-report"
              >
                <FileText className="w-4 h-4" />
              </button>
              <button
                onClick={handlePrint}
                className="p-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
                title="طباعة"
              >
                <Printer className="w-4 h-4" />
              </button>
              {inspection.status === 'draft' ? (
                <button
                  onClick={() => handleStatusUpdate('completed')}
                  className="px-5 py-2.5 rounded-lg text-white text-sm font-bold transition-opacity hover:opacity-90 flex items-center gap-2"
                  style={{ background: '#16a34a' }}
                >
                  <Save className="w-4 h-4" />
                  خلص الفحص
                </button>
              ) : (
                <button
                  onClick={() => handleStatusUpdate('draft')}
                  className="px-5 py-2.5 rounded-lg text-white text-sm font-bold transition-opacity hover:opacity-90"
                  style={{ background: '#0C1A28' }}
                >
                  رجعه للعمل
                </button>
              )}
            </div>
          </div>
          )}
        </div>

        {/* Category Items */}
        <div className="flex-1 bg-white rounded-xl border border-stone-100 flex flex-col overflow-hidden">
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
                    <div className="text-[10px] text-slate-400 font-arabic">الدفع</div>
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

          <div className="p-3 md:p-4 border-b border-slate-100 bg-white relative" ref={globalSearchContainerRef}>
            <div className="relative">
              <div className="flex items-center border border-stone-200 rounded-xl px-3 bg-stone-50 focus-within:border-[#C5852C] focus-within:ring-2 focus-within:ring-[#C5852C]/10 transition-all">
                <Search className="ml-2 h-5 w-5 text-stone-400 shrink-0" />
                <input
                  ref={globalSearchRef}
                  type="text"
                  placeholder="ابحث في كل الأعطال (9,639 عطل)..."
                  value={globalSearch}
                  onChange={(e) => { setGlobalSearch(e.target.value); setGlobalSearchOpen(true); }}
                  onFocus={() => { if (globalSearch.trim()) setGlobalSearchOpen(true); }}
                  className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-primary/40 text-right font-medium"
                  data-testid="input-global-fault-search"
                />
                {globalSearch && (
                  <button type="button" onClick={() => { setGlobalSearch(""); setGlobalSearchOpen(false); }} className="p-1 text-slate-400 hover:text-slate-600">
                    <XCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
              {globalSearchOpen && globalSearch.trim() && (
                <div className="absolute inset-x-0 top-full mt-1 bg-white border-2 border-primary/20 rounded-xl shadow-2xl z-[100] max-h-[60vh] overflow-y-auto">
                  <div className="sticky top-0 flex items-center justify-between px-4 py-2.5 border-b bg-primary/5 rounded-t-xl z-10">
                    <span className="text-sm font-bold text-primary">{globalSearchResults.length} نتيجة</span>
                    <button type="button" onClick={() => setGlobalSearchOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                  {globalSearchResults.length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-400">لا توجد نتائج مطابقة</div>
                  ) : (
                    globalSearchResults.map(fault => (
                      <button
                        key={fault.id}
                        type="button"
                        onClick={() => handleGlobalFaultSelect(fault)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-primary/5 active:bg-primary/10 transition-colors border-b border-slate-50 last:border-b-0"
                        data-testid={`global-fault-${fault.id}`}
                      >
                        <div className="p-1.5 rounded-lg bg-slate-100 shrink-0">
                          <Plus className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-slate-900 truncate">{fault.faultName}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-400">{getCategoryLabel(fault.category) || fault.category}</span>
                            {fault.severity && (
                              <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                                fault.severity === 'high' ? "bg-red-100 text-red-600" :
                                fault.severity === 'medium' ? "bg-amber-100 text-amber-600" :
                                "bg-green-100 text-green-600"
                              )}>{fault.severity === 'high' ? 'عالي' : fault.severity === 'medium' ? 'متوسط' : 'منخفض'}</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 rtl:rotate-180 shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="px-4 md:px-5 py-3 border-b border-stone-100 flex justify-between items-center bg-stone-50/40">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-stone-800">
                {INSPECTION_CATEGORIES.find(c => c.id === activeCategory)?.label}
              </h3>
              <span className="text-[10px] text-stone-400 tabular-nums">{filteredItems.length}</span>
            </div>
            <button
              onClick={() => { setPrefilledFault(null); setIsAddItemOpen(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-opacity hover:opacity-90"
              style={{ background: '#0C1A28' }}
            >
              <Plus className="w-3.5 h-3.5" />
              إضافة
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <Car className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>لا توجد بيانات</p>
                <button 
                  onClick={() => { setPrefilledFault(null); setIsAddItemOpen(true); }}
                  className="mt-4 text-primary hover:underline"
                >
                  إضافة عنصر
                </button>
              </div>
            ) : (
              filteredItems.map(item => (
                <InspectionItemCard key={item.id} item={item} inspectionId={id} />
              ))
            )}
          </div>
        </div>

        {/* OBD Button */}
        <button
          onClick={() => setIsObdOpen(true)}
          className="w-full flex items-center justify-between p-4 md:p-5 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-300 hover:shadow-md transition-all group mt-2"
          data-testid="btn-open-obd-section"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-sm">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <div className="text-right">
              <div className="font-bold text-slate-900 text-sm">فحص كمبيوتر السيارة OBD</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {(() => {
                  const codes = (inspection.obdCodes as any[] | null) || [];
                  return codes.length > 0 ? `${codes.length} كود مسجل` : 'لم يتم الفحص بعد';
                })()}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
        </button>
      </div>
      </div>

      {/* OBD Full Screen Panel */}
      {isObdOpen && inspection && (
        <ObdCodesSection inspection={inspection} inspectionId={id} onClose={() => setIsObdOpen(false)} />
      )}

      {/* Mobile Fixed Bottom Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-3 z-50 flex gap-2">
        <button
          onClick={() => { setPrefilledFault(null); setIsAddItemOpen(true); }}
          className="flex-1 px-3 py-2.5 rounded-lg text-white text-sm font-bold flex items-center justify-center gap-1.5 active:opacity-80"
          style={{ background: '#0C1A28' }}
          data-testid="button-add-item-mobile"
        >
          <Plus className="w-4 h-4" />
          إضافة
        </button>
        <button
          onClick={() => {
            setEditInfo({
              make: inspection.make || '',
              model: inspection.model || '',
              year: inspection.year || '',
              color: inspection.color || '',
              vin: inspection.vin || '',
              odometer: inspection.odometer || '',
              customerName: inspection.customerName || '',
              customerPhone: inspection.customerPhone || '',
              inspectionType: inspection.inspectionType || 'فحص شامل',
            });
            setIsEditingInfo(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="px-3 py-2.5 rounded-lg text-stone-600 bg-stone-100 hover:bg-stone-200 text-sm font-bold flex items-center justify-center active:opacity-80"
          data-testid="button-edit-info-mobile"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => window.location.href = `/reports/${id}`}
          className="px-3 py-2.5 rounded-lg text-stone-600 bg-stone-100 hover:bg-stone-200 text-sm font-bold flex items-center justify-center gap-1.5 active:opacity-80"
          data-testid="button-report-mobile"
        >
          <FileText className="w-4 h-4" />
          التقرير
        </button>
        {inspection.status === 'draft' && (
          <button
            onClick={() => handleStatusUpdate('completed')}
            className="px-3 py-2.5 rounded-lg text-white text-sm font-bold flex items-center justify-center gap-1.5 active:opacity-80"
            style={{ background: '#16a34a' }}
            data-testid="button-complete-mobile"
          >
            <Save className="w-4 h-4" />
            خلص
          </button>
        )}
      </div>

      <AddItemDialog 
        isOpen={isAddItemOpen} 
        onClose={() => { setIsAddItemOpen(false); setPrefilledFault(null); }} 
        category={activeCategory}
        inspectionId={id}
        prefilledFault={prefilledFault}
        sharedFaults={allFaults}
      />
    </div>
  );
}

function InspectionItemCard({ item, inspectionId }: { item: InspectionItem, inspectionId: number }) {
  const deleteMutation = useDeleteInspectionItem();
  const updateMutation = useUpdateInspectionItem();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    faultName: item.faultName,
    description: item.description || '',
    status: item.status,
    severity: item.severity || 'medium',
    notes: item.notes || '',
    category: item.category,
  });
  const [editPhoto, setEditPhoto] = useState<string | null>(null);
  const editFileRef = useRef<HTMLInputElement>(null);
  const editAiFileRef = useRef<HTMLInputElement>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{faultName: string, severity: string, description?: string}>>([]);
  const [aiDetectedPart, setAiDetectedPart] = useState('');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const photoAnalysis = usePhotoAnalysis();
  
  const [arabic, english] = item.faultName.split(" - ");
  const isGood = item.status === 'pass';
  const isWarning = item.status === 'warning';

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return INSPECTION_CATEGORIES;
    const q = categorySearch.toLowerCase();
    return INSPECTION_CATEGORIES.filter(cat => 
      cat.label.includes(q) || cat.labelEn.toLowerCase().includes(q) || cat.id.includes(q)
    );
  }, [categorySearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const compressImage = (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleEditPhotoWithAI = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setEditPhoto(compressed);
      setAiAnalyzing(true);
      try {
        const result = await photoAnalysis.mutateAsync(compressed);
        setAiDetectedPart(result.detectedPartArabic || result.detectedPart || '');
        setAiSuggestions(result.suggestedFaults || []);
      } catch {
        toast({ title: "تنبيه", description: "تعذر تحليل الصورة، لكن تم حفظ الصورة" });
      }
      setAiAnalyzing(false);
    } catch {
      toast({ title: "خطأ", description: "تعذر تحميل الصورة", variant: "destructive" });
      setAiAnalyzing(false);
    }
    e.target.value = '';
  };

  const handleEditPhotoSimple = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setEditPhoto(compressed);
    } catch {
      toast({ title: "خطأ", description: "تعذر تحميل الصورة", variant: "destructive" });
    }
    e.target.value = '';
  };

  const handleSaveEdit = () => {
    updateMutation.mutate({
      id: item.id,
      inspectionId,
      ...editData,
      ...(editPhoto ? { imageUrl: editPhoto } : {}),
    }, {
      onSuccess: () => {
        setIsEditing(false);
        setEditPhoto(null);
        setAiSuggestions([]);
        setAiDetectedPart('');
        toast({ title: "تم تحديث البند بنجاح" });
      }
    });
  };

  const selectedCatLabel = INSPECTION_CATEGORIES.find(c => c.id === editData.category)?.label || editData.category;

  if (isEditing) {
    return (
      <div className="flex flex-col gap-4 p-5 rounded-2xl border-2 border-primary/40 bg-primary/5 shadow-md" data-testid={`edit-card-${item.id}`}>
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-bold text-base text-primary">تعديل البند</h4>
          <button onClick={() => { setIsEditing(false); setEditPhoto(null); setAiSuggestions([]); setAiDetectedPart(''); }} className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors" data-testid={`btn-cancel-edit-${item.id}`}>
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">اسم العطل</label>
            <input
              value={editData.faultName}
              onChange={(e) => setEditData(d => ({ ...d, faultName: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              dir="auto"
              data-testid={`input-edit-faultname-${item.id}`}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">الوصف</label>
            <textarea
              value={editData.description}
              onChange={(e) => setEditData(d => ({ ...d, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
              rows={2}
              dir="auto"
              data-testid={`input-edit-description-${item.id}`}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">ملاحظات</label>
            <textarea
              value={editData.notes}
              onChange={(e) => setEditData(d => ({ ...d, notes: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
              rows={2}
              dir="auto"
              placeholder="أضف ملاحظات إضافية..."
              data-testid={`input-edit-notes-${item.id}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">الحالة</label>
              <select
                value={editData.status}
                onChange={(e) => setEditData(d => ({ ...d, status: e.target.value }))}
                className="w-full px-2 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-primary/30 outline-none bg-white"
                data-testid={`select-edit-status-${item.id}`}
              >
                <option value="fail">غير مقبول</option>
                <option value="warning">تحذير</option>
                <option value="pass">جيد</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">الخطورة</label>
              <select
                value={editData.severity}
                onChange={(e) => setEditData(d => ({ ...d, severity: e.target.value }))}
                className="w-full px-2 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-primary/30 outline-none bg-white"
                data-testid={`select-edit-severity-${item.id}`}
              >
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">مرتفعة</option>
              </select>
            </div>
          </div>

          <div ref={categoryDropdownRef} className="relative">
            <label className="text-xs font-semibold text-slate-500 mb-1 block">القسم</label>
            <div
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm cursor-pointer bg-white hover:border-primary/50 transition-colors flex items-center justify-between"
              data-testid={`select-edit-category-${item.id}`}
            >
              <span>{selectedCatLabel}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
            {categoryDropdownOpen && (
              <div className="absolute z-50 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-hidden">
                <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      placeholder="ابحث عن القسم..."
                      className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                      dir="auto"
                      autoFocus
                      data-testid={`input-search-category-${item.id}`}
                    />
                  </div>
                </div>
                <div className="overflow-y-auto max-h-48">
                  {MAIN_SECTIONS.map(section => {
                    const sectionCats = filteredCategories.filter(c => c.section === section.id);
                    if (sectionCats.length === 0) return null;
                    return (
                      <div key={section.id}>
                        <div className="px-3 py-1.5 text-xs font-bold text-primary bg-primary/5 sticky top-0">{section.label}</div>
                        {sectionCats.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setEditData(d => ({ ...d, category: cat.id }));
                              setCategoryDropdownOpen(false);
                              setCategorySearch('');
                            }}
                            className={cn(
                              "w-full text-right px-4 py-2 text-sm hover:bg-primary/10 transition-colors flex items-center justify-between",
                              editData.category === cat.id && "bg-primary/10 text-primary font-semibold"
                            )}
                          >
                            <span className="text-xs text-slate-400 font-mono">{cat.labelEn}</span>
                            <span>{cat.label}</span>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                  {filteredCategories.length === 0 && (
                    <div className="p-4 text-center text-sm text-slate-400">لا توجد نتائج</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">الصورة</label>
            <div className="flex items-center gap-2 flex-wrap">
              {(editPhoto || item.imageUrl) && (
                <img src={editPhoto || item.imageUrl!} alt="" className="w-20 h-14 rounded-lg object-cover border border-slate-200" />
              )}
              <input type="file" accept="image/*" ref={editFileRef} className="hidden" onChange={handleEditPhotoSimple} />
              <input type="file" accept="image/*" ref={editAiFileRef} className="hidden" onChange={handleEditPhotoWithAI} />
              <button
                onClick={() => editFileRef.current?.click()}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                data-testid={`btn-edit-photo-${item.id}`}
              >
                <Camera className="w-3.5 h-3.5" />
                تغيير الصورة
              </button>
              <button
                onClick={() => editAiFileRef.current?.click()}
                disabled={aiAnalyzing}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                data-testid={`btn-edit-photo-ai-${item.id}`}
              >
                {aiAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                {aiAnalyzing ? 'جارٍ التحليل...' : 'تحليل بالذكاء'}
              </button>
            </div>
          </div>

          {aiAnalyzing && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-50 border border-purple-200">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              <span className="text-sm text-purple-700">جارٍ تحليل الصورة بالذكاء الاصطناعي...</span>
            </div>
          )}

          {aiDetectedPart && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <div className="text-xs font-semibold text-blue-600 mb-1">الجزء المكتشف:</div>
              <div className="text-sm font-bold text-blue-800">{aiDetectedPart}</div>
            </div>
          )}

          {aiSuggestions.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-purple-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                اقتراحات الذكاء الاصطناعي:
              </div>
              {aiSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setEditData(d => ({
                      ...d,
                      faultName: suggestion.faultName,
                      severity: suggestion.severity || d.severity,
                      description: suggestion.description || d.description,
                    }));
                    toast({ title: "تم تطبيق الاقتراح" });
                  }}
                  className="w-full text-right p-3 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 hover:border-purple-400 transition-all"
                  data-testid={`btn-ai-suggestion-${item.id}-${idx}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      suggestion.severity === 'high' ? 'bg-red-100 text-red-700' :
                      suggestion.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    )}>
                      {suggestion.severity === 'high' ? 'مرتفعة' : suggestion.severity === 'medium' ? 'متوسطة' : 'منخفضة'}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">{suggestion.faultName}</span>
                  </div>
                  {suggestion.description && (
                    <p className="text-xs text-slate-500 mt-1">{suggestion.description}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-200">
          <button
            onClick={handleSaveEdit}
            disabled={updateMutation.isPending}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            data-testid={`btn-save-edit-${item.id}`}
          >
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            حفظ التعديلات
          </button>
          <button
            onClick={() => { setIsEditing(false); setEditPhoto(null); setAiSuggestions([]); setAiDetectedPart(''); }}
            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
            data-testid={`btn-discard-edit-${item.id}`}
          >
            إلغاء
          </button>
        </div>
      </div>
    );
  }

  const statusColor = isGood
    ? { bar: '#16a34a', bg: '#f0fdf4', text: '#15803d' }
    : isWarning
    ? { bar: '#d97706', bg: '#fffbeb', text: '#b45309' }
    : { bar: '#dc2626', bg: '#fef2f2', text: '#b91c1c' };

  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-xl border border-stone-100 bg-white group relative transition-colors hover:border-stone-200"
      style={{ borderInlineStart: `3px solid ${statusColor.bar}` }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-semibold text-stone-800 leading-tight">
              {isGood ? "جيد" : arabic}
            </h4>
            {!isGood && english && (
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">{english}</span>
            )}
          </div>

          {item.description && (
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">{item.description}</p>
          )}
          {item.notes && (
            <p className="text-xs mt-1.5 px-2 py-1.5 rounded-md" style={{ background: statusColor.bg, color: statusColor.text }}>{item.notes}</p>
          )}
        </div>

        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => {
              setEditData({
                faultName: item.faultName,
                description: item.description || '',
                status: item.status,
                severity: item.severity || 'medium',
                notes: item.notes || '',
                category: item.category,
              });
              setIsEditing(true);
            }}
            className="p-1.5 text-stone-300 hover:text-[#C5852C] hover:bg-stone-100 rounded-lg transition-colors"
            data-testid={`btn-edit-item-${item.id}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => deleteMutation.mutate({ id: item.id, inspectionId })}
            className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            data-testid={`btn-delete-item-${item.id}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {item.imageUrl && (
        <div className="overflow-hidden rounded-lg border border-stone-100 aspect-video bg-stone-50">
          <img src={item.imageUrl} alt="Fault Evidence" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}

function AddItemDialog({ isOpen, onClose, category, inspectionId, prefilledFault, sharedFaults }: { isOpen: boolean, onClose: () => void, category: string, inspectionId: number, prefilledFault?: FaultLibrary | null, sharedFaults?: FaultLibrary[] }) {
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

  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsAnalyzingVoice(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const cleanBase64 = base64data.split(',')[1];
        
        const response = await fetch('/api/analyze-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioBase64: cleanBase64, mimeType: file.type || 'audio/webm' })
        });
        
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || "Failed to analyze voice");
        }
        
        const data = await response.json();
        if (data.detectedPartArabic || data.detectedPart) {
          setDetectedPart(data.detectedPartArabic || data.detectedPart);
        }
        if (data.suggestedFaults) {
          setAiSuggestions(data.suggestedFaults);
        }
        if (data.notes || data.transcript) {
          setVoiceTranscript(data.transcript || "");
          setFormData(prev => ({
            ...prev,
            faultName: data.suggestedFaults?.[0]?.faultName || prev.faultName || '',
            description: data.notes || data.suggestedFaults?.[0]?.description || prev.description || '',
            severity: data.suggestedFaults?.[0]?.severity || prev.severity || 'medium'
          }));
        }
        
        toast({
          title: "تم تحليل الصوت بنجاح",
          description: data.transcript ? `النص: "${data.transcript.substring(0, 50)}..."` : "تم تعبئة التقرير بالذكاء الاصطناعي",
        });
      };
    } catch (err: any) {
      console.error(err);
      toast({
        title: "تنبيه",
        description: err.message || "تعذر تحليل الصوت بالذكاء الاصطناعي",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzingVoice(false);
      e.target.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        setIsAnalyzingVoice(true);
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64data = reader.result as string;
            const cleanBase64 = base64data.split(',')[1];
            
            const response = await fetch('/api/analyze-voice', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioBase64: cleanBase64, mimeType: 'audio/webm' })
            });
            
            if (!response.ok) {
              const err = await response.json().catch(() => ({}));
              throw new Error(err.error || "Failed to analyze voice");
            }
            
            const data = await response.json();
            if (data.detectedPartArabic || data.detectedPart) {
              setDetectedPart(data.detectedPartArabic || data.detectedPart);
            }
            if (data.suggestedFaults) {
              setAiSuggestions(data.suggestedFaults);
            }
            if (data.notes || data.transcript) {
              setVoiceTranscript(data.transcript || "");
              setFormData(prev => ({
                ...prev,
                faultName: data.suggestedFaults?.[0]?.faultName || prev.faultName || '',
                description: data.notes || data.suggestedFaults?.[0]?.description || prev.description || '',
                severity: data.suggestedFaults?.[0]?.severity || prev.severity || 'medium'
              }));
            }
            
            toast({
              title: "تم تحليل الصوت بنجاح",
              description: data.transcript ? `النص: "${data.transcript.substring(0, 50)}..."` : "تم تعبئة التقرير بالذكاء الاصطناعي",
            });
          };
        } catch (err: any) {
          console.error(err);
          toast({
            title: "تنبيه",
            description: err.message || "تعذر تحليل الصوت بالذكاء الاصطناعي",
            variant: "destructive"
          });
        } finally {
          setIsAnalyzingVoice(false);
          stream.getTracks().forEach(track => track.stop());
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      toast({
        title: "خطأ في الميكروفون",
        description: "يرجى منح صلاحية الوصول للميكروفون لتفعيل ميزة الفحص الصوتي",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (prefilledFault) {
        setFormData({
          status: 'fail',
          severity: (prefilledFault.severity as any) || 'medium',
          faultName: prefilledFault.faultName,
          description: prefilledFault.description || '',
          category: prefilledFault.category || category
        });
      } else {
        setFormData({ status: 'fail', severity: 'medium', faultName: '', description: '', category });
      }
      setPhoto(null);
      setAiSuggestions([]);
      setDetectedPart("");
      setSearchQuery("");
    }
  }, [isOpen, category, prefilledFault]);

  // Compress image to reduce size
  const compressImage = (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Simple photo upload without AI analysis
  const handleSimplePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setPhoto(compressed);
        setFormData(prev => ({ ...prev, imageUrl: compressed }));
      } catch (err) {
        console.error("Photo compression failed:", err);
        toast({ title: "خطأ", description: "تعذر تحميل الصورة، يرجى المحاولة مرة أخرى", variant: "destructive" });
      }
      // Reset input to allow re-selection
      e.target.value = '';
    }
  };

  // Photo upload with AI analysis
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setPhoto(compressed);
        setFormData(prev => ({ ...prev, imageUrl: compressed }));
        
        // Trigger AI analysis
        try {
          const result = await photoAnalysis.mutateAsync(compressed);
          setDetectedPart(result.detectedPartArabic || result.detectedPart);
          setAiSuggestions(result.suggestedFaults || []);
        } catch (err) {
          console.error("AI analysis failed:", err);
          toast({ title: "تنبيه", description: "تعذر تحليل الصورة، لكن تم حفظ الصورة", variant: "default" });
        }
      } catch (err) {
        console.error("Photo compression failed:", err);
        toast({ title: "خطأ", description: "تعذر تحميل الصورة، يرجى المحاولة مرة أخرى", variant: "destructive" });
      }
      // Reset input to allow re-selection
      e.target.value = '';
    }
  };

  const simplePhotoInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useCreateInspectionItem();
  const { data: fetchedLibrary = [] } = useQuery<FaultLibrary[]>({ 
    queryKey: ['/api/fault-library'],
    enabled: isOpen && (!sharedFaults || sharedFaults.length === 0)
  });
  const library = (sharedFaults && sharedFaults.length > 0) ? sharedFaults : fetchedLibrary;

  const { toast } = useToast();

  // Map category IDs to Arabic fault library categories (23 categories in fault library)
  const categoryToArabicFaultLibrary: Record<string, string[]> = {
    front_bumper: ['الدعامية الأمامية'],
    rear_bumper: ['الدعامية الخلفية'],
    bumper_frame_front: ['جسر الدعامية الأمامية'],
    bumper_frame_rear: ['جسر الدعامية الخلفية'],
    hood: ['غطاء المحرك'],
    front_chest: ['صدر السيارة الأمامي'],
    rear_chest: ['صدر السيارة الخلفي'],
    fender_front_right: ['الرفرف الأمامي الأيمن'],
    fender_front_left: ['الرفرف الأمامي الأيسر'],
    fender_rear_right: ['الرفرف الخلفي الأيمن'],
    fender_rear_left: ['الرفرف الخلفي الأيسر'],
    door_front_right: ['الباب الأمامي يمين'],
    door_front_left: ['الباب الأمامي يسار'],
    door_rear_right: ['الباب الخلفي يمين'],
    door_rear_left: ['الباب الخلفي يسار'],
    trunk: ['صندوق الأمتعة'],
    quarter_panel: ['اللوح الجانبي'],
    roof: ['السقف'],
    pillars: ['القوائم'],
    windows: ['النوافذ'],
    lights_front: ['الأضواء الأمامية'],
    lights_rear: ['الأضواء الخلفية'],
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
      category: formData.category || category,
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
        setAiSuggestions([]);
        setDetectedPart("");
        onClose();
      },
      onError: (error) => {
        console.error("Failed to add item:", error);
        toast({ title: "خطأ", description: "تعذرت إضافة الملاحظة، يرجى المحاولة مرة أخرى", variant: "destructive" });
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
          <Dialog.Title className="text-xl font-bold mb-4 text-slate-900">إضافة ملاحظة جديدة</Dialog.Title>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">اختر العطل</label>
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
                  <div className="absolute inset-x-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-[100] max-h-[300px] md:max-h-[350px] overflow-y-auto">
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
                      <div className="py-4 text-center text-sm text-slate-500">لا توجد نتائج</div>
                    ) : (
                      filteredFaults.slice(0, 200).map(fault => (
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
                <div className="mt-3 p-3 bg-green-50 rounded-xl border-2 border-green-300 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-700 font-bold">العطل المختار - اضغط للتحرير:</span>
                  </div>
                  <input
                    type="text"
                    value={formData.faultName}
                    onChange={(e) => setFormData(prev => ({ ...prev, faultName: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-green-400 bg-white text-base text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all text-right font-medium"
                    placeholder="اكتب أو عدّل اسم العطل..."
                    data-testid="input-fault-name-edit"
                  />
                  <p className="text-xs text-green-600 mt-1">يمكنك تعديل النص أعلاه - إضافة أو حذف كلمات</p>
                </div>
              )}
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

              {/* Voice Recording Assistant */}
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-arabic">الفحص الصوتي الذكي (AI)</label>
                
                {/* Hidden input for audio file upload fallback */}
                <input
                  type="file"
                  ref={audioFileInputRef}
                  onChange={handleAudioFileUpload}
                  accept="audio/*"
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2">
                  {isRecording ? (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-lg p-2.5 flex items-center gap-1.5 transition-all text-xs font-arabic animate-pulse"
                    >
                      <MicOff className="w-4 h-4" />
                      إيقاف التسجيل
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={isAnalyzingVoice}
                      className="bg-[#0C1A28] hover:bg-[#0f2035] text-white rounded-lg p-2.5 flex items-center gap-1.5 transition-all text-xs font-arabic disabled:opacity-50"
                    >
                      <Mic className="w-4 h-4" />
                      ابدأ التسجيل الصوتي
                    </button>
                  )}

                  {!isRecording && (
                    <button
                      type="button"
                      onClick={() => audioFileInputRef.current?.click()}
                      disabled={isAnalyzingVoice}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg p-2.5 flex items-center gap-1.5 transition-all text-xs font-arabic disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      رفع ملف صوتي
                    </button>
                  )}

                  {isAnalyzingVoice && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 font-arabic">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      يحلل الصوت الآن...
                    </div>
                  )}
                  {!isRecording && !isAnalyzingVoice && voiceTranscript && (
                    <div className="flex items-center gap-1.5 text-xs text-green-600 font-arabic">
                      <Volume2 className="w-3.5 h-3.5" />
                      تم التعرف على النص
                    </div>
                  )}
                </div>
                {voiceTranscript && (
                  <p className="mt-2 text-[10px] text-slate-500 font-arabic leading-relaxed italic bg-white p-2 rounded-lg border border-slate-100">
                    "{voiceTranscript}"
                  </p>
                )}
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
                    <span className="text-sm font-bold font-arabic">تم التعرف على: {detectedPart}</span>
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
                {createMutation.isPending ? "جارٍ الحفظ..." : "حفظ"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface ObdCode {
  code: string;
  nameEn: string;
  nameAr: string;
  diagnosis?: string;
  causes?: string;
  solutions?: string;
}

function ObdCodesSection({ inspection, inspectionId, onClose }: { inspection: Inspection; inspectionId: number; onClose: () => void }) {
  const { toast } = useToast();
  const updateInspection = useUpdateInspection();
  const [manualCode, setManualCode] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isImportingAutel, setIsImportingAutel] = useState(false);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const obdImageRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const obdCodes: ObdCode[] = (inspection.obdCodes as ObdCode[] | null) || [];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const saveObdCodes = (newCodes: ObdCode[]) => {
    updateInspection.mutate({ id: inspectionId, obdCodes: newCodes as any }, {
      onSuccess: () => {
        toast({ title: "تم الحفظ" });
      },
      onError: () => {
        toast({ title: "خطأ", description: "تعذر حفظ الأكواد", variant: "destructive" });
      }
    });
  };

  const handleManualAdd = async () => {
    const code = manualCode.trim().toUpperCase();
    if (!code) return;
    if (obdCodes.some(c => c.code === code)) {
      toast({ title: "الكود موجود مسبقاً", variant: "destructive" });
      return;
    }

    setIsLookingUp(true);
    try {
      const res = await fetch('/api/obd/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ codes: [code] })
      });
      const data = await res.json();
      if (data.codes && data.codes.length > 0) {
        const newCodes = [...obdCodes, ...data.codes];
        saveObdCodes(newCodes);
      } else {
        const fallback: ObdCode = { code, nameEn: 'Unknown Code', nameAr: 'كود غير معروف' };
        saveObdCodes([...obdCodes, fallback]);
      }
      setManualCode('');
    } catch {
      toast({ title: "خطأ", description: "تعذر البحث عن الكود", variant: "destructive" });
    }
    setIsLookingUp(false);
  };

  const handleImageExtract = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsExtracting(true);
    try {
      const compressed = await compressImage(file);
      const res = await fetch('/api/obd/extract-from-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ imageBase64: compressed })
      });
      const data = await res.json();
      if (data.codes && data.codes.length > 0) {
        const existingCodes = new Set(obdCodes.map(c => c.code));
        const newOnly = data.codes.filter((c: ObdCode) => !existingCodes.has(c.code));
        if (newOnly.length > 0) {
          saveObdCodes([...obdCodes, ...newOnly]);
          toast({ title: `تم استخراج ${newOnly.length} كود جديد` });
        } else {
          toast({ title: "جميع الأكواد المستخرجة موجودة مسبقاً" });
        }
      } else {
        toast({ title: "لم يتم العثور على أكواد في الصورة", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطأ", description: "تعذر استخراج الأكواد من الصورة", variant: "destructive" });
    }
    setIsExtracting(false);
  };

  const handleDeleteCode = (codeToDelete: string) => {
    const filtered = obdCodes.filter(c => c.code !== codeToDelete);
    saveObdCodes(filtered);
  };

  const handleAutelImport = async () => {
    setIsImportingAutel(true);
    try {
      const res = await fetch(`/api/autel/import/${inspectionId}`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: "تم استيراد تقرير Autel", description: data.filename });
        queryClient.invalidateQueries({ queryKey: ['/api/inspections', inspectionId] });
      } else {
        toast({ title: "خطأ", description: data.error || "فشل الاستيراد", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطأ", description: "فشل الاتصال بالسيرفر", variant: "destructive" });
    }
    setIsImportingAutel(false);
  };

  const hasAutelReport = !!(inspection.autelReportPdf);

  const getSeverityColor = (code: string) => {
    const prefix = code.charAt(0).toUpperCase();
    switch (prefix) {
      case 'P': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-600', label: 'Powertrain', labelAr: 'المحرك' };
      case 'C': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-600', label: 'Chassis', labelAr: 'الشاصي' };
      case 'B': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-600', label: 'Body', labelAr: 'الهيكل' };
      case 'U': return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-600', label: 'Network', labelAr: 'الشبكة' };
      default: return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', badge: 'bg-slate-600', label: 'Other', labelAr: 'أخرى' };
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-white md:bg-slate-900/60 md:backdrop-blur-sm md:flex md:items-center md:justify-center" dir="rtl">
      <div className="w-full h-full md:h-auto md:max-w-2xl md:max-h-[90vh] bg-white md:rounded-2xl md:shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-l from-emerald-600 via-emerald-700 to-emerald-800 text-white px-5 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Monitor className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black">فحص كمبيوتر السيارة</h2>
                <p className="text-emerald-200 text-xs font-mono" dir="ltr">OBD-II Diagnostic Scanner</p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors" data-testid="btn-close-obd">
              <X className="w-5 h-5" />
            </button>
          </div>

          {obdCodes.length > 0 && (
            <div className="mt-3 flex items-center gap-4 bg-white/10 rounded-xl px-4 py-2.5">
              <div className="text-center">
                <div className="text-3xl font-black">{obdCodes.length}</div>
                <div className="text-xs text-emerald-200">أعطال</div>
              </div>
              <div className="h-10 w-px bg-white/20"></div>
              <div className="flex gap-2 flex-wrap">
                {['P', 'C', 'B', 'U'].map(prefix => {
                  const count = obdCodes.filter(c => c.code.startsWith(prefix)).length;
                  if (count === 0) return null;
                  const colors = getSeverityColor(prefix + '0000');
                  return (
                    <span key={prefix} className={`px-3 py-1 rounded-lg text-xs font-bold text-white ${colors.badge}`}>
                      {prefix}: {count}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex gap-2">
            <div className="flex-1 flex gap-2">
              <input
                ref={inputRef}
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === 'Enter') handleManualAdd(); }}
                placeholder="DTC"
                className="flex-1 px-3 py-3 rounded-xl border border-slate-300 text-base font-mono text-center focus:ring-2 focus:ring-emerald-300 focus:border-emerald-500 outline-none bg-white"
                dir="ltr"
                data-testid="input-obd-code"
              />
              <button
                onClick={handleManualAdd}
                disabled={isLookingUp || !manualCode.trim()}
                className="px-5 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap active:scale-95"
                data-testid="btn-add-obd-code"
              >
                {isLookingUp ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                إضافة
              </button>
            </div>
            <div>
              <input type="file" accept="image/*" capture="environment" ref={obdImageRef} className="hidden" onChange={handleImageExtract} />
              <button
                onClick={() => obdImageRef.current?.click()}
                disabled={isExtracting}
                className="h-full px-5 py-3 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap active:scale-95"
                data-testid="btn-obd-scan-image"
              >
                {isExtracting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                {isExtracting ? 'جارٍ التحليل...' : 'تصوير'}
              </button>
            </div>
          </div>
          <button
            onClick={handleAutelImport}
            disabled={isImportingAutel}
            className="w-full mt-2 px-4 py-3 bg-gradient-to-l from-orange-500 to-orange-600 text-white rounded-xl text-sm font-bold hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
            data-testid="btn-import-autel"
          >
            {isImportingAutel ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {isImportingAutel ? 'جارٍ الاستيراد من البريد...' : 'استيراد تقرير Autel من البريد'}
          </button>
          {hasAutelReport && (
            <div className="mt-2 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-sm font-bold text-emerald-800 flex-1">{inspection.autelReportName || 'تقرير Autel'}</span>
              <a
                href={`/api/autel/report/${inspectionId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1"
                data-testid="btn-view-autel-report"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                فتح
              </a>
            </div>
          )}
        </div>

        {/* Codes List */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          {obdCodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] p-8">
              <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mb-3">
                <Monitor className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-base font-bold text-slate-500">لا توجد أكواد أعطال</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {obdCodes.map((obd) => {
                const colors = getSeverityColor(obd.code);
                const isExpanded = expandedCode === obd.code;
                return (
                  <div key={obd.code} className={`rounded-xl border-2 ${colors.border} overflow-hidden bg-white shadow-sm`}>
                    <div className={`flex items-center gap-3 px-4 py-3.5`}>
                      <div className="shrink-0">
                        <span className={`font-mono font-black text-base px-4 py-2 rounded-xl text-white ${colors.badge} shadow-sm inline-block`}>{obd.code}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-bold text-slate-900 leading-snug">{obd.nameAr}</div>
                        <div className="text-sm text-slate-500 font-mono mt-1" dir="ltr">{obd.nameEn}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {obd.diagnosis && (
                          <button
                            onClick={() => setExpandedCode(isExpanded ? null : obd.code)}
                            className={`p-2.5 rounded-xl transition-colors ${isExpanded ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                            data-testid={`btn-toggle-obd-details-${obd.code}`}
                          >
                            {isExpanded ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteCode(obd.code)}
                          className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          data-testid={`btn-delete-obd-${obd.code}`}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    {isExpanded && obd.diagnosis && (
                      <div className="px-4 pb-4 pt-1 space-y-2 border-t border-slate-100">
                        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                          <div className="text-xs font-bold text-blue-600 mb-1">التشخيص</div>
                          <div className="text-sm text-blue-800 leading-relaxed">{obd.diagnosis}</div>
                        </div>
                        {obd.causes && (
                          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                            <div className="text-xs font-bold text-amber-600 mb-1">الأسباب المحتملة</div>
                            <div className="text-sm text-amber-800 leading-relaxed">{obd.causes}</div>
                          </div>
                        )}
                        {obd.solutions && (
                          <div className="p-3 rounded-xl bg-green-50 border border-green-100">
                            <div className="text-xs font-bold text-green-600 mb-1">الحلول المقترحة</div>
                            <div className="text-sm text-green-800 leading-relaxed">{obd.solutions}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


