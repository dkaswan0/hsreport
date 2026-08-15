import { BluetoothPrinterModal } from "@/components/bluetooth-printer-modal";
import { Bluetooth } from "lucide-react";
import { api } from "@shared/routes";
import { useQueryClient } from "@tanstack/react-query";
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
  GripVertical,
  X,
  Monitor,
  Upload,
  Eye,
  EyeOff,
  Download,
  ExternalLink,
  Lock,
} from "lucide-react";
import { PhosphorIcon } from "@/components/phosphor-icon";
import { useState, useRef, useEffect, useMemo, useCallback, useDeferredValue } from "react";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import type { InspectionItem, CreateInspectionItemRequest, FaultLibrary, Inspection } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { INSPECTION_CATEGORIES, CATEGORY_GROUPS, MAIN_SECTIONS, getCategoryLabel } from "@shared/categories";
import { useInspectionStructure } from "@/hooks/use-inspection-structure";
import { AddEditSectionModal, AddEditCategoryModal } from "@/components/section-category-manager-modal";
import { queryClient } from "@/lib/queryClient";
import { VehiclePhotosGrid } from "@/components/vehicle-photos-grid";
import { VEHICLE_PHOTO_SECTIONS, VehiclePhotoKey, resolveVehiclePhotoByKey } from "@shared/vehicle-photos";
import { FaultCameraModal } from "@/components/fault-camera-modal";

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
  const [isBluetoothModalOpen, setIsBluetoothModalOpen] = useState(false);

  // Dynamic Sections and Categories Structure
  const {
    sections,
    allCategories,
    getCategoriesForSection,
    getCategoryLabel: getDynamicCategoryLabel,
    getSectionLabel,
    createSection,
    updateSection,
    deleteSection,
    reorderSections,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
  } = useInspectionStructure();

  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [isEditSectionOpen, setIsEditSectionOpen] = useState(false);
  const [sectionToEdit, setSectionToEdit] = useState<any>(null);

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<any>(null);

  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);
  const [dragOverSectionIndex, setDragOverSectionIndex] = useState<number | null>(null);
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);
  const [dragOverCategoryIndex, setDragOverCategoryIndex] = useState<number | null>(null);

  // Sync initial selection
  useEffect(() => {
    if (sections.length > 0 && !activeSection) {
      setActiveSection(sections[0].id);
      const initialCats = getCategoriesForSection(sections[0].id);
      if (initialCats.length > 0 && initialCats[0]) {
        setActiveCategory(initialCats[0].id);
      }
    }
  }, [sections]);

  const handleSectionDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSectionIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleSectionDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverSectionIndex !== index) {
      setDragOverSectionIndex(index);
    }
  };

  const handleSectionDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedSectionIndex === null || draggedSectionIndex === targetIndex) {
      setDraggedSectionIndex(null);
      setDragOverSectionIndex(null);
      return;
    }
    const reordered = [...sections];
    const [moved] = reordered.splice(draggedSectionIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setDraggedSectionIndex(null);
    setDragOverSectionIndex(null);
    await reorderSections(reordered.map(s => s.id));
  };

  const handleCategoryDragStart = (e: React.DragEvent, index: number) => {
    setDraggedCategoryIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleCategoryDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCategoryIndex !== index) {
      setDragOverCategoryIndex(index);
    }
  };

  const handleCategoryDrop = async (e: React.DragEvent, currentSectionCats: any[], targetIndex: number) => {
    e.preventDefault();
    if (draggedCategoryIndex === null || draggedCategoryIndex === targetIndex) {
      setDraggedCategoryIndex(null);
      setDragOverCategoryIndex(null);
      return;
    }
    const reordered = [...currentSectionCats];
    const [moved] = reordered.splice(draggedCategoryIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setDraggedCategoryIndex(null);
    setDragOverCategoryIndex(null);
    await reorderCategories(reordered.map(c => c.id));
  };
  
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
      <div className="text-zinc-700 text-xl mb-4">حدث خطأ أثناء التحميل</div>
      <p className="text-slate-500 mb-4">تأكد من الاتصال بالإنترنت وحاول مرة أخرى</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white rounded-lg">إعادة المحاولة</button>
    </div>
  );
  if (!inspection) return (
    <div className="text-center p-12">
      <div className="text-zinc-950 text-xl mb-4">الفحص غير موجود</div>
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
      
      {/* ── Top Clean Tabs Navigation Bar (Dynamic Section & Category Builder) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        
        {/* Main Sections Horizontal Tabs */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-arabic flex items-center justify-between">
            <span>الأقسام الرئيسية للفحص</span>
            <span className="text-slate-400 font-normal">اسحب المقبض (⠿) لإعادة الترتيب أو اضغط للتنقّل</span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none items-center">
            {sections.map((section, idx) => {
              const currentActiveSecId = activeSection || (sections[0]?.id || "mechanic");
              const isActive = currentActiveSecId === section.id;
              const sectionCategories = getCategoriesForSection(section.id);
              const itemCount = inspection?.items?.filter(item => 
                sectionCategories.some(c => c?.id === item.category)
              ).length || 0;

              return (
                <div
                  key={section.id}
                  draggable
                  onDragStart={(e) => handleSectionDragStart(e, idx)}
                  onDragOver={(e) => handleSectionDragOver(e, idx)}
                  onDrop={(e) => handleSectionDrop(e, idx)}
                  onDragEnd={() => {
                    setDraggedSectionIndex(null);
                    setDragOverSectionIndex(null);
                  }}
                  className={cn(
                    "relative group shrink-0 flex items-stretch rounded-xl border transition-all select-none shadow-xs overflow-hidden",
                    isActive
                      ? "bg-[#09090b] text-white border-[#09090b] shadow-md ring-2 ring-[#18181b]/30"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900",
                    dragOverSectionIndex === idx && "ring-2 ring-zinc-500 scale-105 opacity-80",
                    draggedSectionIndex === idx && "opacity-40"
                  )}
                >
                  {/* Dedicated Drag Handle */}
                  <div
                    className={cn(
                      "px-2 py-2 flex items-center justify-center cursor-grab active:cursor-grabbing border-l border-zinc-200/50 transition-colors",
                      isActive ? "text-zinc-400 hover:text-white border-zinc-800 bg-zinc-900/50" : "text-zinc-400 hover:text-zinc-700 bg-slate-100/60"
                    )}
                    title="اسحب لتغيير ترتيب القسم"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>

                  {/* Section Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection(section.id);
                      const cats = getCategoriesForSection(section.id);
                      if (cats.length > 0 && cats[0]) {
                        setActiveCategory(cats[0].id);
                      }
                    }}
                    className="px-3.5 py-2.5 font-arabic text-xs md:text-sm font-bold whitespace-nowrap flex items-center gap-2 cursor-pointer"
                    data-testid={`section-tab-${section.id}`}
                  >
                    <span>{section.label}</span>
                    {itemCount > 0 && (
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold",
                        isActive ? "bg-[#18181b] text-white" : "bg-slate-200 text-slate-700"
                      )}>
                        {itemCount}
                      </span>
                    )}
                  </button>

                  {/* Quick Edit/Delete on Hover */}
                  <div className="absolute top-1 left-1 hidden group-hover:flex items-center gap-1 bg-white/95 backdrop-blur-xs border border-zinc-300 rounded-lg p-0.5 shadow-md z-20">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSectionToEdit(section);
                        setIsEditSectionOpen(true);
                      }}
                      className="p-1 hover:bg-zinc-100 text-zinc-700 rounded transition-colors cursor-pointer"
                      title="تعديل اسم القسم"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    {!section.isDefault && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`هل أنت متأكد من حذف قسم "${section.label}"؟`)) {
                            deleteSection(section.id);
                          }
                        }}
                        className="p-1 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 rounded transition-colors cursor-pointer"
                        title="حذف القسم"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* + إضافة قسم Button */}
            <button
              type="button"
              onClick={() => setIsAddSectionOpen(true)}
              className="px-3.5 py-2.5 rounded-xl font-arabic text-xs md:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border border-dashed border-zinc-400 bg-zinc-50 hover:bg-zinc-100 text-zinc-900 shadow-xs cursor-pointer shrink-0"
              data-testid="btn-add-section"
            >
              <Plus className="w-4 h-4 text-zinc-900" />
              <span>+ إضافة قسم</span>
            </button>
          </div>
        </div>

        {/* Subcategories Horizontal Pills Bar */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none items-center">
            <span className="text-xs font-bold text-slate-400 font-arabic whitespace-nowrap me-1">الفئات:</span>
            {(() => {
              const currentSecId = activeSection || (sections[0]?.id || "mechanic");
              const currentSectionCats = getCategoriesForSection(currentSecId);

              return (
                <>
                  {currentSectionCats.map((cat, idx) => {
                    if (!cat) return null;
                    const isCatActive = activeCategory === cat.id;
                    const catItemCount = inspection?.items?.filter(item => item.category === cat.id).length || 0;

                    return (
                      <div
                        key={cat.id}
                        draggable
                        onDragStart={(e) => handleCategoryDragStart(e, idx)}
                        onDragOver={(e) => handleCategoryDragOver(e, idx)}
                        onDrop={(e) => handleCategoryDrop(e, currentSectionCats, idx)}
                        onDragEnd={() => {
                          setDraggedCategoryIndex(null);
                          setDragOverCategoryIndex(null);
                        }}
                        className={cn(
                          "relative group shrink-0 flex items-stretch rounded-full border transition-all select-none shadow-xs overflow-hidden",
                          isCatActive
                            ? "bg-[#18181b] text-white border-[#18181b] shadow-sm font-extrabold"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900",
                          dragOverCategoryIndex === idx && "ring-2 ring-zinc-500 scale-105 opacity-80",
                          draggedCategoryIndex === idx && "opacity-40"
                        )}
                      >
                        {/* Drag Handle */}
                        <div
                          className={cn(
                            "pr-2 pl-1 py-1 flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors",
                            isCatActive ? "text-zinc-400 hover:text-white" : "text-zinc-400 hover:text-zinc-700"
                          )}
                          title="اسحب لتغيير ترتيب الفئة"
                        >
                          <GripVertical className="w-3 h-3" />
                        </div>

                        {/* Category Button */}
                        <button
                          type="button"
                          onClick={() => setActiveCategory(cat.id)}
                          className="pl-3.5 pr-1 py-1.5 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 font-arabic cursor-pointer"
                          data-testid={`category-pill-${cat.id}`}
                        >
                          <span>{cat.label}</span>
                          {catItemCount > 0 && (
                            <span className={cn(
                              "w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold",
                              isCatActive ? "bg-[#09090b] text-white" : "bg-slate-100 text-slate-600"
                            )}>
                              {catItemCount}
                            </span>
                          )}
                        </button>

                        {/* Quick Edit/Delete on Hover */}
                        <div className="absolute top-0.5 left-0.5 hidden group-hover:flex items-center gap-1 bg-white/95 backdrop-blur-xs border border-zinc-300 rounded-lg p-0.5 shadow-md z-20">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategoryToEdit(cat);
                              setIsEditCategoryOpen(true);
                            }}
                            className="p-0.5 hover:bg-zinc-100 text-zinc-700 rounded transition-colors cursor-pointer"
                            title="تعديل اسم الفئة"
                          >
                            <Pencil className="w-2.5 h-2.5" />
                          </button>
                          {!cat.isDefault && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`هل أنت متأكد من حذف فئة "${cat.label}"؟`)) {
                                  deleteCategory(cat.id);
                                }
                              }}
                              className="p-0.5 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 rounded transition-colors cursor-pointer"
                              title="حذف الفئة"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* + إضافة فئة Button */}
                  <button
                    type="button"
                    onClick={() => setIsAddCategoryOpen(true)}
                    className="px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 font-arabic border border-dashed border-zinc-400 bg-zinc-50 hover:bg-zinc-100 text-zinc-900 cursor-pointer shrink-0"
                    data-testid="btn-add-category"
                  >
                    <Plus className="w-3.5 h-3.5 text-zinc-900" />
                    <span>+ إضافة فئة</span>
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Modals for Dynamic Sections and Categories */}
      <AddEditSectionModal
        isOpen={isAddSectionOpen}
        onClose={() => setIsAddSectionOpen(false)}
        mode="add"
        onSave={async (data) => {
          const newSec = await createSection(data);
          if (newSec?.id) {
            setActiveSection(newSec.id);
          }
        }}
      />

      <AddEditSectionModal
        isOpen={isEditSectionOpen}
        onClose={() => {
          setIsEditSectionOpen(false);
          setSectionToEdit(null);
        }}
        mode="edit"
        initialData={sectionToEdit}
        onSave={async (data) => {
          if (sectionToEdit?.id) {
            await updateSection({ id: sectionToEdit.id, updates: data });
          }
        }}
      />

      <AddEditCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        mode="add"
        sectionId={activeSection || (sections[0]?.id || "mechanic")}
        sectionLabel={getSectionLabel(activeSection || (sections[0]?.id || "mechanic"))}
        onSave={async (data) => {
          const newCat = await createCategory(data);
          if (newCat?.id) {
            setActiveCategory(newCat.id);
          }
        }}
      />

      <AddEditCategoryModal
        isOpen={isEditCategoryOpen}
        onClose={() => {
          setIsEditCategoryOpen(false);
          setCategoryToEdit(null);
        }}
        mode="edit"
        sectionId={categoryToEdit?.sectionId || activeSection || (sections[0]?.id || "mechanic")}
        sectionLabel={getSectionLabel(categoryToEdit?.sectionId || activeSection || (sections[0]?.id || "mechanic"))}
        initialData={categoryToEdit}
        onSave={async (data) => {
          if (categoryToEdit?.id) {
            await updateCategory({ id: categoryToEdit.id, updates: data });
          }
        }}
      />

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
                    <div className="text-sm font-semibold" style={{ color: '#18181b' }}>{inspection.inspectionType}</div>
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
                type="button"
                onClick={() => setIsBluetoothModalOpen(true)}
                className="p-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all shadow-xs flex items-center gap-1.5 text-xs font-arabic cursor-pointer"
                title="طباعة لاسلكية عبر البلوتوث للطابعة الحرارية"
              >
                <Bluetooth className="w-4 h-4" />
                <span className="hidden lg:inline">طابعة حرارية بلوتوث</span>
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
                  style={{ background: '#18181b' }}
                >
                  <Save className="w-4 h-4" />
                  خلص الفحص
                </button>
              ) : (
                <button
                  onClick={() => handleStatusUpdate('draft')}
                  className="px-5 py-2.5 rounded-lg text-white text-sm font-bold transition-opacity hover:opacity-90"
                  style={{ background: '#09090b' }}
                >
                  رجعه للعمل
                </button>
              )}
            </div>
          </div>
          )}
        </div>

        {/* Vehicle & Section Photos Manager */}
        {inspection && <VehiclePhotosManager inspection={inspection} />}

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
              <div className="flex items-center border border-stone-200 rounded-xl px-3 bg-stone-50 focus-within:border-[#18181b] focus-within:ring-2 focus-within:ring-[#18181b]/10 transition-all">
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
                                fault.severity === 'high' ? "bg-zinc-900 text-white" :
                                fault.severity === 'medium' ? "bg-zinc-200 text-zinc-900" :
                                "bg-zinc-100 text-zinc-900"
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
              style={{ background: '#09090b' }}
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
          className="w-full flex items-center justify-between p-4 md:p-5 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-zinc-800 hover:shadow-md transition-all group mt-2"
          data-testid="btn-open-obd-section"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shadow-inner group-hover:bg-zinc-100 transition-colors">
              <PhosphorIcon name="cpu" weight="duotone" size={28} className="text-zinc-950 group-hover:text-zinc-800 transition-colors" />
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
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#18181b] transition-colors" />
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
          style={{ background: '#09090b' }}
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
            style={{ background: '#18181b' }}
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
// =========================================================================
// VEHICLE & SECTION PHOTOS MANAGER - EVIDENCE SOURCE-OF-TRUTH & STUDIO AI
// =========================================================================
function VehiclePhotosManager({ inspection }: { inspection: Inspection }) {
  const [isOpen, setIsOpen] = useState(true);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [processingSlots, setProcessingSlots] = useState<Record<string, boolean>>({});
  const [isGeneratingSheet, setIsGeneratingSheet] = useState(false);
  const [scanningSlot, setScanningSlot] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string; meta?: any } | null>(null);
  const [compareSlot, setCompareSlot] = useState<{ slotKey: string; labelAr: string; originalUrl: string; processedUrl: string; activeMode: string } | null>(null);
  const updateInspection = useUpdateInspection();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const compressSlotImage = (file: File, maxDim = 1600, quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadedCount = useMemo(() => {
    return VEHICLE_PHOTO_SECTIONS.filter((sec) => {
      return !!resolveVehiclePhotoByKey(inspection, sec.key);
    }).length;
  }, [inspection]);

  // Generate full synchronized Professional Vehicle Photo Sheet
  const handleGeneratePhotoSheet = async () => {
    setIsGeneratingSheet(true);
    try {
      const res = await fetch("/api/generate-vehicle-photo-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inspectionId: inspection.id }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.inspection) {
          queryClient.setQueryData([api.inspections.get.path, inspection.id], data.inspection);
        }
        queryClient.invalidateQueries({ queryKey: [api.inspections.get.path, inspection.id] });
        queryClient.invalidateQueries({ queryKey: [api.inspections.list.path] });
        toast({
          title: "تم إنشاء طقم زوايا الاستوديو",
          description: "تم تجهيز كافة زوايا المركبة بالخلفية البيضاء النقية والظلال الاحترافية",
        });
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast({
          title: "تنبيه",
          description: errorData.error || "تعذر توليد طقم الاستوديو، يرجى التأكد من رفع صور للمركبة أولاً",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "خطأ في المعالجة",
        description: "حدث خطأ أثناء إنشاء طقم الاستوديو",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSheet(false);
    }
  };

  // Non-blocking background AI image processing
  const triggerBackgroundProcessing = async (slotKey: string, compressedImage: string, slotTitle: string) => {
    setProcessingSlots(prev => ({ ...prev, [slotKey]: true }));
    try {
      const res = await fetch("/api/process-vehicle-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inspectionId: inspection.id,
          slotKey,
          imageUrl: compressedImage,
          enablePerspectiveCorrection: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.inspection) {
          queryClient.setQueryData([api.inspections.get.path, inspection.id], data.inspection);
        }
        queryClient.invalidateQueries({ queryKey: [api.inspections.get.path, inspection.id] });
        queryClient.invalidateQueries({ queryKey: [api.inspections.list.path] });
        if (data.activeMode === 'processed') {
          toast({
            title: "تم تحسين الصورة",
            description: `تم تجهيز خلفية الاستوديو البيضاء وإضاءة ${slotTitle}`,
          });
        }
      }
    } catch (err) {
      console.warn("Background photo processing warning:", err);
    } finally {
      setProcessingSlots(prev => ({ ...prev, [slotKey]: false }));
    }
  };

  const handleSlotUpload = async (slotKey: string, file: File, ocrType?: string, canProcess = true) => {
    if (!file) return;
    setUploadingSlot(slotKey);
    try {
      const compressed = await compressSlotImage(file, 1600, 0.85);

      // Save original immediately and update slot column
      updateInspection.mutate({
        id: inspection.id,
        [slotKey]: compressed,
        vehiclePhotosMeta: {
          ...((inspection as any).vehiclePhotosMeta || {}),
          [slotKey]: {
            originalUrl: compressed,
            activeMode: 'original',
            processingStatus: 'idle',
            processedAt: new Date().toISOString(),
          }
        }
      }, {
        onSuccess: () => {
          const s = VEHICLE_PHOTO_SECTIONS.find((slot) => slot.key === slotKey);
          toast({
            title: "تم حفظ الصورة بنجاح",
            description: `تم حفظ ${s?.label || 'الصورة'} كأصل دائم ومحفوظ`,
          });
        },
        onError: () => {
          toast({
            title: "خطأ في الحفظ",
            description: "تعذر حفظ الصورة، يرجى المحاولة مرة أخرى",
            variant: "destructive",
          });
        },
      });

      // OCR Execution for VIN / Odometer
      if (ocrType === 'vin') {
        setScanningSlot(slotKey);
        try {
          const res = await fetch("/api/vin/extract-from-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: compressed })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.vin) {
              updateInspection.mutate({ id: inspection.id, vin: data.vin });
              toast({ title: "تم استخراج رقم الهيكل", description: `رقم الشاصي: ${data.vin}` });
            }
          }
        } catch (err) {
          console.warn("VIN OCR error:", err);
        } finally {
          setScanningSlot(null);
        }
      } else if (ocrType === 'odometer') {
        setScanningSlot(slotKey);
        try {
          const res = await fetch("/api/analyze-odometer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: compressed })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.odometer && data.odometer > 0) {
              updateInspection.mutate({ id: inspection.id, odometer: data.odometer });
              toast({ title: "تمت قراءة العداد", description: `قراءة العداد: ${data.odometer.toLocaleString()} كم` });
            }
          }
        } catch (err) {
          console.warn("Odometer OCR error:", err);
        } finally {
          setScanningSlot(null);
        }
      }
    } catch (err) {
      toast({ title: "خطأ أثناء معالجة الصورة", variant: "destructive" });
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleToggleMode = async (slotKey: string, targetMode: 'original' | 'processed', labelAr: string) => {
    try {
      const res = await fetch("/api/toggle-vehicle-photo-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inspectionId: inspection.id,
          slotKey,
          mode: targetMode,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.inspection) {
          queryClient.setQueryData([api.inspections.get.path, inspection.id], data.inspection);
        }
        queryClient.invalidateQueries({ queryKey: [api.inspections.get.path, inspection.id] });
        queryClient.invalidateQueries({ queryKey: [api.inspections.list.path] });
        toast({
          title: targetMode === 'original' ? "تمت استعادة الصورة الأصلية" : "تم اعتماد الصورة المعالجة",
          description: `تم تحديث وضع عرض ${labelAr} بالتقرير`,
        });
      }
    } catch (err) {
      toast({ title: "تعذر تغيير وضع الصورة", variant: "destructive" });
    }
  };

  const handleReprocess = async (slotKey: string, labelAr: string) => {
    setProcessingSlots(prev => ({ ...prev, [slotKey]: true }));
    try {
      const res = await fetch("/api/reprocess-vehicle-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inspectionId: inspection.id,
          slotKey,
          enablePerspectiveCorrection: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.inspection) {
          queryClient.setQueryData([api.inspections.get.path, inspection.id], data.inspection);
        }
        queryClient.invalidateQueries({ queryKey: [api.inspections.get.path, inspection.id] });
        queryClient.invalidateQueries({ queryKey: [api.inspections.list.path] });
        toast({ title: "تمت إعادة المعالجة", description: `تم تحديث المعالجة لـ ${labelAr}` });
      }
    } catch (err) {
      toast({ title: "تعذر إعادة المعالجة", variant: "destructive" });
    } finally {
      setProcessingSlots(prev => ({ ...prev, [slotKey]: false }));
    }
  };

  const handleRemovePhoto = (photoKey: string, labelAr: string) => {
    const section = VEHICLE_PHOTO_SECTIONS.find((s) => s.key === photoKey || s.legacyDbField === photoKey);
    const key = section?.key || photoKey;
    const legacyField = section?.legacyDbField || photoKey;

    const currentMeta = { ...((inspection as any).vehiclePhotosMeta || {}) };
    delete currentMeta[key];
    delete currentMeta[legacyField];
    if (section) {
      for (const alias of section.legacyAliases) {
        delete currentMeta[alias];
      }
    }

    const payload: Record<string, any> = {
      id: inspection.id,
      [legacyField]: null,
      [key]: null,
      vehiclePhotosMeta: currentMeta,
    };

    if (section) {
      for (const alias of section.legacyAliases) {
        payload[alias] = null;
      }
    }

    updateInspection.mutate(payload as any, {
      onSuccess: () => {
        toast({ title: "تم حذف الصورة بنجاح", description: `تم مسح ${labelAr || 'الصورة'} بالكامل` });
      },
      onError: (err) => {
        toast({ title: "خطأ في الحذف", description: err.message || "تعذر مسح الصورة", variant: "destructive" });
      }
    });
  };

  const videoInputRef = useRef<HTMLInputElement>(null);
  const bulkPhotosInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingBulkPhotos, setIsUploadingBulkPhotos] = useState(false);

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 80 * 1024 * 1024) {
      toast({
        title: "حجم الفيديو كبير",
        description: "يرجى اختيار فيديو لا يتجاوز 80 ميغابايت للحفاظ على سرعة التقرير",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingVideo(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const videoData = event.target?.result as string;
        updateInspection.mutate({
          id: inspection.id,
          videoUrl: videoData,
        } as any, {
          onSuccess: () => {
            toast({ title: "تم حفظ فيديو الفحص بنجاح", description: "سيظهر الفيديو كأول عنصر في تقرير الفحص" });
            setIsUploadingVideo(false);
          },
          onError: (err) => {
            toast({ title: "تعذر حفظ الفيديو", description: err.message || "حدث خطأ أثناء الرفع", variant: "destructive" });
            setIsUploadingVideo(false);
          }
        });
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast({ title: "خطأ في قراءة الفيديو", description: err?.message, variant: "destructive" });
      setIsUploadingVideo(false);
    }
  };

  const handleRemoveVideo = () => {
    updateInspection.mutate({
      id: inspection.id,
      videoUrl: null,
    } as any, {
      onSuccess: () => {
        toast({ title: "تم حذف الفيديو بنجاح" });
      }
    });
  };

  const handleBulkPhotosChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingBulkPhotos(true);
    try {
      const currentGallery: any[] = Array.isArray((inspection as any).mediaGallery) ? [...(inspection as any).mediaGallery] : [];
      const newItems: any[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await compressSlotImage(file, 1600, 0.85);
        newItems.push({
          id: `media-gallery-${Date.now()}-${i}`,
          type: "image",
          url: compressed,
          name: `صورة فحص ${currentGallery.length + newItems.length + 1}`,
          sortOrder: currentGallery.length + newItems.length + 1,
        });
      }

      const updatedGallery = [...currentGallery, ...newItems];

      updateInspection.mutate({
        id: inspection.id,
        mediaGallery: updatedGallery,
      } as any, {
        onSuccess: () => {
          toast({
            title: "تمت إضافة الصور بنجاح",
            description: `تمت إضافة ${newItems.length} صورة إلى معرض الفحص الموحد`,
          });
          setIsUploadingBulkPhotos(false);
        },
        onError: (err) => {
          toast({ title: "خطأ في حفظ الصور", description: err.message, variant: "destructive" });
          setIsUploadingBulkPhotos(false);
        }
      });
    } catch (err: any) {
      toast({ title: "خطأ في معالجة الصور", description: err?.message, variant: "destructive" });
      setIsUploadingBulkPhotos(false);
    }
  };

  const handleRemoveGalleryItem = (itemId: string) => {
    const currentGallery: any[] = Array.isArray((inspection as any).mediaGallery) ? [...(inspection as any).mediaGallery] : [];
    const updated = currentGallery.filter(item => item.id !== itemId);

    updateInspection.mutate({
      id: inspection.id,
      mediaGallery: updated,
    } as any, {
      onSuccess: () => {
        toast({ title: "تم حذف الصورة من المعرض" });
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs mb-4" data-testid="vehicle-photos-manager">
      {/* Header Bar */}
      <div 
        className="bg-zinc-950 px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between cursor-pointer select-none text-white border-b border-zinc-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shrink-0">
            <PhosphorIcon name="camera" weight="bold" size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base font-arabic flex items-center gap-2 text-white">
              <span>طقم صور فحص المركبة الاحترافي</span>
              <span className="text-[11px] font-normal text-zinc-400 font-mono hidden sm:inline">| Professional Photo Sheet</span>
            </h3>
            <p className="text-[11px] text-zinc-400 font-arabic">استوديو التصوير الاحترافي بزوايا متناسقة مع الحفاظ الدائم على الأصل كمرجع نهائي</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Photo Sheet Action Button */}
          <button
            type="button"
            disabled={uploadedCount === 0 || isGeneratingSheet}
            onClick={(e) => {
              e.stopPropagation();
              handleGeneratePhotoSheet();
            }}
            className="px-3 py-1.5 bg-white text-zinc-950 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-bold font-arabic flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="تجهيز طقم زوايا الاستوديو لجميع الصور المرفوعة"
          >
            <PhosphorIcon name={isGeneratingSheet ? "spinner-gap" : "magic-wand"} className={isGeneratingSheet ? "animate-spin" : ""} weight="bold" size={14} />
            <span className="hidden sm:inline">{isGeneratingSheet ? "جاري تجهيز الطقم..." : "تجهيز طقم الاستوديو"}</span>
            <span className="sm:hidden">{isGeneratingSheet ? "جاري..." : "الاستوديو"}</span>
          </button>

          <div className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-xs font-bold font-mono text-zinc-200">
            {uploadedCount} / 5 مرفوعة
          </div>
          <button className="text-zinc-400 hover:text-white p-1">
            <PhosphorIcon name={isOpen ? "caret-down" : "caret-left"} weight="bold" size={16} />
          </button>
        </div>
      </div>

      {/* Content Grid */}
      {isOpen && (
        <div className="p-4 sm:p-5 bg-zinc-50/50 space-y-4">
          <VehiclePhotosGrid
            inspection={inspection}
            isEditable={true}
            showStudioControls={true}
            isProcessing={isGeneratingSheet}
            onPhotoChange={async (key, fileOrDataUrl) => {
              const section = VEHICLE_PHOTO_SECTIONS.find((s) => s.key === key);
              if (!fileOrDataUrl) {
                handleRemovePhoto(key, section?.label || 'الصورة');
              } else {
                setUploadingSlot(key);
                try {
                  const compressed = fileOrDataUrl.length > 200000 
                    ? await compressSlotImage(await (await fetch(fileOrDataUrl)).blob() as File, 1600, 0.85)
                    : fileOrDataUrl;

                  const currentMeta = { ...((inspection as any).vehiclePhotosMeta || {}) };
                  currentMeta[key] = {
                    originalUrl: compressed,
                    activeMode: 'original',
                    processingStatus: 'idle',
                    processedAt: new Date().toISOString(),
                  };
                  if (section?.legacyDbField) {
                    currentMeta[section.legacyDbField] = currentMeta[key];
                  }

                  const payload: Record<string, any> = {
                    id: inspection.id,
                    [section?.legacyDbField || key]: compressed,
                    [key]: compressed,
                    vehiclePhotosMeta: currentMeta,
                  };

                  updateInspection.mutate(payload as any, {
                    onSuccess: () => {
                      toast({
                        title: "تم حفظ الصورة بنجاح",
                        description: `تم حفظ ${section?.label || 'الصورة'} كأصل دائم ومحفوظ`,
                      });
                    },
                    onError: (err) => {
                      toast({ title: "خطأ في الحفظ", description: err.message || "تعذر حفظ الصورة", variant: "destructive" });
                    },
                  });
                } catch (err: any) {
                  updateInspection.mutate({
                    id: inspection.id,
                    [section?.legacyDbField || key]: fileOrDataUrl,
                    [key]: fileOrDataUrl,
                  } as any, {
                    onSuccess: () => {
                      toast({
                        title: "تم حفظ الصورة بنجاح",
                        description: `تم حفظ ${section?.label || 'الصورة'} كأصل دائم ومحفوظ`,
                      });
                    },
                    onError: (err) => {
                      toast({ title: "خطأ في الحفظ", description: err.message || "تعذر حفظ الصورة", variant: "destructive" });
                    },
                  });
                } finally {
                  setUploadingSlot(null);
                }
              }
            }}
            onReprocessPhoto={(key) => {
              const section = VEHICLE_PHOTO_SECTIONS.find((s) => s.key === key);
              handleReprocess(key, section?.label || 'الصورة');
            }}
            onTogglePhotoMode={(key) => {
              const section = VEHICLE_PHOTO_SECTIONS.find((s) => s.key === key);
              const meta = (inspection as any)?.vehiclePhotosMeta?.[key];
              const isProcessedActive = meta?.activeMode === 'processed';
              handleToggleMode(key, isProcessedActive ? 'original' : 'processed', section?.label || 'الصورة');
            }}
          />

          {/* Video & Bulk Media Gallery Management for Unified Top Media Gallery */}
          <div className="pt-4 border-t border-zinc-200/80 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-zinc-950 text-white flex items-center justify-center">
                  <PhosphorIcon name="film-strip" weight="bold" size={15} />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-zinc-950 font-arabic">فيديو وصور المعرض الموحد</h4>
                  <p className="text-[11px] text-zinc-500 font-arabic">إضافة فيديو الفحص الشامل وصور غير محدودة (70-100+ صورة) للمعرض بأعلى التقرير</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Video Upload Button */}
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoFileChange}
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={isUploadingVideo}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-bold font-arabic rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  data-testid="btn-upload-inspection-video"
                >
                  <PhosphorIcon name={isUploadingVideo ? "spinner-gap" : "video-camera"} className={isUploadingVideo ? "animate-spin" : ""} weight="bold" size={14} />
                  <span>{isUploadingVideo ? "جاري رفع الفيديو..." : (inspection as any).videoUrl ? "تغيير الفيديو" : "رفع فيديو الفحص"}</span>
                </button>

                {/* Bulk Photos Upload Button */}
                <input
                  ref={bulkPhotosInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleBulkPhotosChange}
                />
                <button
                  type="button"
                  onClick={() => bulkPhotosInputRef.current?.click()}
                  disabled={isUploadingBulkPhotos}
                  className="px-3 py-1.5 bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-950 text-xs font-bold font-arabic rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  data-testid="btn-upload-bulk-photos"
                >
                  <PhosphorIcon name={isUploadingBulkPhotos ? "spinner-gap" : "plus-circle"} className={isUploadingBulkPhotos ? "animate-spin" : ""} weight="bold" size={14} />
                  <span>{isUploadingBulkPhotos ? "جاري إضافة الصور..." : "إضافة صور للمعرض (+)"}</span>
                </button>
              </div>
            </div>

            {/* Video Preview if exists */}
            {(inspection as any).videoUrl && (
              <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 text-white flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <PhosphorIcon name="play" weight="fill" size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold font-arabic truncate">فيديو الفحص الشامل المعتمد</div>
                    <div className="text-[10px] text-zinc-400 font-mono" dir="ltr">Video Element #0 (First in Gallery)</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    className="p-1.5 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="حذف الفيديو"
                  >
                    <PhosphorIcon name="trash" weight="bold" size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Additional Gallery Items Grid (if any items uploaded via bulk) */}
            {Array.isArray((inspection as any).mediaGallery) && (inspection as any).mediaGallery.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-zinc-700 font-arabic flex items-center justify-between">
                  <span>الصور الإضافية في المعرض ({(inspection as any).mediaGallery.length} صورة)</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {(inspection as any).mediaGallery.map((gItem: any, gIdx: number) => (
                    <div key={gItem.id || gIdx} className="relative aspect-video rounded-xl bg-zinc-900 overflow-hidden border border-zinc-200 group">
                      <img src={gItem.thumbnailUrl || gItem.url} alt="" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white font-mono text-[9px] px-1 rounded">
                        #{gIdx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryItem(gItem.id)}
                        className="absolute top-1 left-1 p-1 bg-red-600/90 hover:bg-red-700 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                        title="حذف الصورة"
                      >
                        <PhosphorIcon name="trash" weight="bold" size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compare Modal: Side-by-Side Original vs Processed */}
      {compareSlot && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
          onClick={() => setCompareSlot(null)}
        >
          <div 
            className="bg-zinc-950 text-white border border-zinc-800 rounded-3xl max-w-4xl w-full p-4 sm:p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <PhosphorIcon name="git-compare" weight="bold" size={20} className="text-zinc-300" />
                <h4 className="font-bold text-sm sm:text-base font-arabic">
                  مقارنة صورة: {compareSlot.labelAr}
                </h4>
              </div>
              <button 
                onClick={() => setCompareSlot(null)} 
                className="p-1.5 rounded-xl hover:bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer"
              >
                <PhosphorIcon name="x" weight="bold" size={18} />
              </button>
            </div>

            {/* Two Columns: Original vs Processed */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original Card */}
              <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300 font-arabic flex items-center gap-1.5">
                    <PhosphorIcon name="image" weight="bold" size={14} />
                    <span>الصورة الأصلية (مرجع الفحص النهائي)</span>
                  </span>
                  {compareSlot.activeMode === 'original' && (
                    <span className="text-[10px] bg-white text-zinc-950 font-bold px-2 py-0.5 rounded-full">
                      المعتمدة حالياً
                    </span>
                  )}
                </div>
                <div className="w-full h-64 sm:h-72 rounded-xl overflow-hidden bg-black/40 border border-zinc-800 flex items-center justify-center">
                  <img src={compareSlot.originalUrl} alt="Original" className="w-full h-full object-contain" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleToggleMode(compareSlot.slotKey, 'original', compareSlot.labelAr);
                    setCompareSlot(prev => prev ? { ...prev, activeMode: 'original' } : null);
                  }}
                  disabled={compareSlot.activeMode === 'original'}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold font-arabic flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    compareSlot.activeMode === 'original'
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                >
                  <PhosphorIcon name="arrow-counter-clockwise" weight="bold" size={14} />
                  <span>اعتماد الصورة الأصلية بالتقرير</span>
                </button>
              </div>

              {/* Processed Card */}
              <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-arabic flex items-center gap-1.5">
                    <PhosphorIcon name="magic-wand" weight="bold" size={14} />
                    <span>صورة الاستوديو الأبيض النقي</span>
                  </span>
                  {compareSlot.activeMode === 'processed' && (
                    <span className="text-[10px] bg-white text-zinc-950 font-bold px-2 py-0.5 rounded-full">
                      المعتمدة حالياً
                    </span>
                  )}
                </div>
                <div className="w-full h-64 sm:h-72 rounded-xl overflow-hidden bg-black/40 border border-zinc-800 flex items-center justify-center">
                  <img src={compareSlot.processedUrl} alt="Processed" className="w-full h-full object-contain" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleToggleMode(compareSlot.slotKey, 'processed', compareSlot.labelAr);
                    setCompareSlot(prev => prev ? { ...prev, activeMode: 'processed' } : null);
                  }}
                  disabled={compareSlot.activeMode === 'processed'}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold font-arabic flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    compareSlot.activeMode === 'processed'
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-white text-zinc-950 hover:bg-zinc-100'
                  }`}
                >
                  <PhosphorIcon name="check-circle" weight="bold" size={14} />
                  <span>اعتماد صورة الاستوديو بالتقرير</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {previewPhoto && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div 
            className="bg-zinc-950 border border-zinc-800 rounded-3xl p-4 sm:p-6 max-w-4xl max-h-[90vh] overflow-auto text-white space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <PhosphorIcon name="image" weight="bold" size={18} />
                <h4 className="font-bold text-sm sm:text-base font-arabic">{previewPhoto.title}</h4>
              </div>
              <button 
                onClick={() => setPreviewPhoto(null)} 
                className="p-1.5 rounded-xl hover:bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer"
              >
                <PhosphorIcon name="x" weight="bold" size={18} />
              </button>
            </div>
            <div className="flex items-center justify-center bg-black/60 rounded-2xl p-2 border border-zinc-800">
              <img src={previewPhoto.url} alt={previewPhoto.title} className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg" />
            </div>
          </div>
        </div>
      )}
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
  const [isEditCameraOpen, setIsEditCameraOpen] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const editFileRef = useRef<HTMLInputElement>(null);
  const editAiFileRef = useRef<HTMLInputElement>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{faultName: string, severity: string, description?: string}>>([]);
  const [aiDetectedPart, setAiDetectedPart] = useState('');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const photoAnalysis = usePhotoAnalysis();

  const handleEnhanceText = async () => {
    if (!editData.faultName?.trim() && !editData.description?.trim()) {
      toast({
        title: "اكتب الملاحظة أولاً",
        description: "يرجى كتابة اسم العطل أو الوصف لتحسين الصياغة الفنية",
      });
      return;
    }
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/enhance-finding-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faultName: editData.faultName || '',
          description: editData.description || '',
          category: getCategoryLabel(editData.category) || editData.category
        })
      });
      if (!res.ok) throw new Error("تعذر تحسين النص");
      const data = await res.json();
      if (data.enhancedFaultName || data.enhancedDescription) {
        setEditData(prev => ({
          ...prev,
          faultName: data.enhancedFaultName || prev.faultName,
          description: data.enhancedDescription || prev.description
        }));
        toast({
          title: "تم تحسين الصياغة بنجاح ✨",
          description: "تمت إعادة صياغة الملاحظة بأسلوب تقارير فحص السيارات المعتمدة",
        });
      }
    } catch (err: any) {
      toast({
        title: "خطأ في تحسين الصياغة",
        description: "تعذر الاتصال بالخدمة حالياً",
        variant: "destructive"
      });
    } finally {
      setIsEnhancing(false);
    }
  };
  
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

  const runAiAnalysisForEdit = async (imgData: string) => {
    if (!imgData) return;
    setEditPhoto(imgData);
    setEditData(prev => ({ ...prev, imageUrl: imgData }));
    setAiAnalyzing(true);
    try {
      const result = await photoAnalysis.mutateAsync(imgData);
      setAiAnalysisResult(result);
      const part = result.detectedPartArabic || result.detectedPart || '';
      setAiDetectedPart(part);
      setAiSuggestions(result.suggestedFaults || []);

      if (result.category && !editData.category) {
        setEditData(prev => ({ ...prev, category: result.category }));
      }

      if (result.suggestedFaults && result.suggestedFaults.length > 0 && !editData.faultName) {
        const top = result.suggestedFaults[0];
        setEditData(prev => ({
          ...prev,
          faultName: top.faultName,
          description: top.description || '',
          severity: (top.severity as any) || 'medium'
        }));
      }

      toast({
        title: result.defectStatusText || "تم فحص الصورة بالذكاء الاصطناعي ⚡",
        description: result.conditionSummary || result.detectedPartArabic || part,
      });
    } catch (err: any) {
      toast({ title: "تنبيه", description: "تعذر التحليل التلقائي، يمكنك اختيار العطل يدوياً" });
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleEditPhotoSimple = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      await runAiAnalysisForEdit(compressed);
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
        setAiAnalysisResult(null);
        toast({ title: "تم تحديث البند بنجاح" });
      }
    });
  };

  const selectedCatLabel = INSPECTION_CATEGORIES.find(c => c.id === editData.category)?.label || editData.category;

  if (isEditing) {
    return (
      <div className="flex flex-col gap-4 p-5 rounded-2xl border-2 border-primary/40 bg-primary/5 shadow-md" data-testid={`edit-card-${item.id}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-base text-primary">تعديل البند</h4>
            <button
              type="button"
              onClick={handleEnhanceText}
              disabled={isEnhancing || (!editData.faultName && !editData.description)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-lg transition-all shadow-sm disabled:opacity-50"
              title="تحسين الصياغة بأسلوب تقارير الفحص الفنية"
            >
              {isEnhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-700" /> : <Pencil className="w-3.5 h-3.5 text-zinc-700" />}
              <span>تحسين الصياغة ✨</span>
            </button>
          </div>
          <button onClick={() => { setIsEditing(false); setEditPhoto(null); setAiSuggestions([]); setAiDetectedPart(''); setAiAnalysisResult(null); }} className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors" data-testid={`btn-cancel-edit-${item.id}`}>
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-600 block">اسم العطل</label>
              <button
                type="button"
                onClick={handleEnhanceText}
                disabled={isEnhancing || !editData.faultName}
                className="p-1 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200 rounded transition-colors"
                title="تحسين صياغة اسم العطل"
              >
                {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pencil className="w-3 h-3" />}
              </button>
            </div>
            <input
              value={editData.faultName}
              onChange={(e) => setEditData(d => ({ ...d, faultName: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              dir="auto"
              data-testid={`input-edit-faultname-${item.id}`}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-600 block">الوصف والتفاصيل</label>
              <button
                type="button"
                onClick={handleEnhanceText}
                disabled={isEnhancing || !editData.description}
                className="p-1 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200 rounded transition-colors"
                title="تحسين صياغة التفاصيل"
              >
                {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pencil className="w-3 h-3" />}
              </button>
            </div>
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
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">صورة العطل</label>
            <div className="flex items-center gap-2 flex-wrap">
              {(editPhoto || item.imageUrl) && (
                <div className="relative">
                  <img src={editPhoto || item.imageUrl!} alt="" className="w-20 h-14 rounded-xl object-cover border border-slate-200 shadow-xs" />
                  <button
                    type="button"
                    onClick={() => {
                      setEditPhoto(null);
                      setEditData(prev => ({ ...prev, imageUrl: null }));
                      setAiAnalysisResult(null);
                      setAiDetectedPart('');
                      setAiSuggestions([]);
                    }}
                    className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors shadow-md cursor-pointer"
                    title="حذف الصورة"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <input type="file" accept="image/*" ref={editFileRef} className="hidden" onChange={handleEditPhotoSimple} />
              
              <button
                type="button"
                onClick={() => setIsEditCameraOpen(true)}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-zinc-950 text-white hover:bg-black transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                data-testid={`btn-edit-camera-${item.id}`}
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>التقاط بالكاميرا 📸</span>
              </button>

              <button
                type="button"
                onClick={() => editFileRef.current?.click()}
                className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                data-testid={`btn-edit-photo-${item.id}`}
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>من المعرض 🖼️</span>
              </button>

              {(editPhoto || item.imageUrl) && (
                <button
                  type="button"
                  onClick={() => runAiAnalysisForEdit(editPhoto || item.imageUrl!)}
                  disabled={aiAnalyzing}
                  className="px-3 py-2 text-xs font-bold rounded-xl bg-amber-500/10 text-amber-900 border border-amber-500/30 hover:bg-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="إعادة فحص وتحليل الصورة بالذكاء الاصطناعي"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>تحليل عميق ⚡</span>
                </button>
              )}
            </div>

            {/* Direct Edit Fault Camera Modal */}
            <FaultCameraModal
              isOpen={isEditCameraOpen}
              onClose={() => setIsEditCameraOpen(false)}
              onCapture={(dataUrl) => {
                runAiAnalysisForEdit(dataUrl);
              }}
              title={`تصوير عطل: ${item.faultName || 'الملاحظة الفنية'}`}
            />
          </div>

          {/* AI Analysis Loading State */}
          {aiAnalyzing && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-amber-700 shrink-0" />
              <div className="text-xs">
                <span className="font-bold block">جارٍ الفحص البصري العميق للقطعة والكشف عن الأعطال... ⚡</span>
                <span className="text-[10px] text-amber-700/80">يتم تحديد حالة القطعة واستخراج خيارات التشخيص الفوري</span>
              </div>
            </div>
          )}

          {/* AI Visual Diagnosis Card */}
          {!aiAnalyzing && (aiAnalysisResult || aiDetectedPart || aiSuggestions.length > 0) && (
            <div className="p-3.5 rounded-2xl bg-zinc-900 text-white border border-zinc-800 shadow-md space-y-2.5 font-arabic">
              <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>{aiAnalysisResult?.defectStatusText || aiSuggestions[0]?.faultName || "ملاحظة فنية"}</span>
                  </div>
                </div>

                {aiDetectedPart && (
                  <div className="text-xs font-bold text-amber-400 bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700">
                    {aiDetectedPart}
                  </div>
                )}
              </div>

              {aiSuggestions.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] text-zinc-400 font-semibold flex items-center justify-between">
                    <span>اختر العطل لتطبيقه فوراً بضغطة زر:</span>
                    <span className="text-amber-400 font-mono text-[10px]">{aiSuggestions.length} خيارات</span>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {aiSuggestions.map((suggestion, idx) => {
                      const isSelected = editData.faultName === suggestion.faultName;
                      const severityColor = suggestion.severity === 'high' 
                        ? 'border-rose-500/50 bg-rose-500/10 text-rose-300' 
                        : suggestion.severity === 'low' 
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' 
                        : 'border-amber-500/50 bg-amber-500/10 text-amber-300';
                      const severityLabel = suggestion.severity === 'high' ? 'عالي' : suggestion.severity === 'low' ? 'خفيف' : 'متوسط';

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setEditData(d => ({
                              ...d,
                              faultName: suggestion.faultName,
                              severity: (suggestion.severity as any) || d.severity,
                              description: suggestion.description || d.description,
                            }));
                            toast({ title: "تم اختيار وتعبئة العطل ⚡", description: suggestion.faultName });
                          }}
                          className={cn(
                            "w-full text-right p-2 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer",
                            isSelected
                              ? "bg-amber-500 text-black border-amber-400 font-bold"
                              : "bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border-zinc-700/80"
                          )}
                          data-testid={`btn-ai-suggestion-${item.id}-${idx}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold truncate">{suggestion.faultName}</span>
                              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-mono shrink-0", isSelected ? "bg-black text-amber-400" : severityColor)}>
                                {severityLabel}
                              </span>
                            </div>
                            {suggestion.description && (
                              <p className={cn("text-[11px] truncate mt-0.5", isSelected ? "text-black/80" : "text-zinc-400")}>
                                {suggestion.description}
                              </p>
                            )}
                          </div>

                          <div className={cn(
                            "w-4 h-4 rounded-full flex items-center justify-center shrink-0 border",
                            isSelected ? "bg-black text-amber-400 border-black" : "border-zinc-600 text-transparent"
                          )}>
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
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
    ? { bar: '#18181b', bg: '#f4f4f5', text: '#09090b' }
    : isWarning
    ? { bar: '#71717a', bg: '#f4f4f5', text: '#27272a' }
    : { bar: '#09090b', bg: '#e4e4e7', text: '#09090b' };

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
            className="p-1.5 text-stone-300 hover:text-[#18181b] hover:bg-stone-100 rounded-lg transition-colors"
            data-testid={`btn-edit-item-${item.id}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => deleteMutation.mutate({ id: item.id, inspectionId })}
            className="p-1.5 text-stone-300 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-colors"
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
  const [isFaultCameraOpen, setIsFaultCameraOpen] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const simplePhotoInputRef = useRef<HTMLInputElement>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{faultName: string, severity: string, cause?: string, description?: string}>>([]);
  const [detectedPart, setDetectedPart] = useState<string>("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const photoAnalysis = usePhotoAnalysis();
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhanceText = async () => {
    if (!formData.faultName?.trim() && !formData.description?.trim()) {
      toast({
        title: "اكتب الملاحظة أولاً",
        description: "يرجى كتابة اسم العطل أو الوصف لتحسين الصياغة الفنية",
      });
      return;
    }
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/enhance-finding-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faultName: formData.faultName || '',
          description: formData.description || '',
          category: getCategoryLabel(formData.category || category) || (formData.category || category)
        })
      });
      if (!res.ok) throw new Error("تعذر تحسين النص");
      const data = await res.json();
      if (data.enhancedFaultName || data.enhancedDescription) {
        setFormData(prev => ({
          ...prev,
          faultName: data.enhancedFaultName || prev.faultName,
          description: data.enhancedDescription || prev.description
        }));
        toast({
          title: "تم تحسين الصياغة بنجاح ✨",
          description: "تمت إعادة صياغة الملاحظة بأسلوب تقارير فحص السيارات المعتمدة",
        });
      }
    } catch (err: any) {
      toast({
        title: "خطأ في تحسين الصياغة",
        description: "تعذر الاتصال بالخدمة حالياً",
        variant: "destructive"
      });
    } finally {
      setIsEnhancing(false);
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
      setAiAnalysisResult(null);
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

  // Deep AI Photo Analysis & Diagnosis
  const handleProcessPhotoWithAi = async (dataUrl: string) => {
    if (!dataUrl) return;
    setPhoto(dataUrl);
    setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
    try {
      const result = await photoAnalysis.mutateAsync(dataUrl);
      setAiAnalysisResult(result);
      const part = result.detectedPartArabic || result.detectedPart || "";
      setDetectedPart(part);
      setAiSuggestions(result.suggestedFaults || []);

      if (result.category && !formData.category) {
        setFormData(prev => ({
          ...prev,
          category: result.category
        }));
      }

      if (result.suggestedFaults && result.suggestedFaults.length > 0 && !formData.faultName) {
        const top = result.suggestedFaults[0];
        setFormData(prev => ({
          ...prev,
          faultName: top.faultName,
          description: top.description || '',
          severity: (top.severity as any) || 'medium'
        }));
      }

      toast({
        title: result.defectStatusText || "تم فحص الصورة بالذكاء الاصطناعي ⚡",
        description: result.conditionSummary || result.detectedPartArabic || part,
      });
    } catch (err: any) {
      console.warn("AI Analysis error:", err);
      toast({ title: "تنبيه", description: "تعذر التحليل التلقائي، يمكنك اختيار العطل يدوياً" });
    }
  };

  const handleSimplePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        await handleProcessPhotoWithAi(compressed);
      } catch (err) {
        console.error("Photo compression failed:", err);
        toast({ title: "خطأ", description: "تعذر تحميل الصورة، يرجى المحاولة مرة أخرى", variant: "destructive" });
      }
      e.target.value = '';
    }
  };

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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-bold text-slate-800">اسم العطل</label>
                <button
                  type="button"
                  onClick={handleEnhanceText}
                  disabled={isEnhancing || (!formData.faultName && !formData.description)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 border border-zinc-300 rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title="تحسين الصياغة بأسلوب تقارير الفحص الفنية المعتمدة"
                >
                  {isEnhancing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-700" />
                  ) : (
                    <Pencil className="w-3.5 h-3.5 text-zinc-700" />
                  )}
                  <span>تحسين الصياغة ✨</span>
                </button>
              </div>

              {/* Manual Input + Library Search */}
              <div className="relative">
                <div className="flex items-center border-2 border-slate-200 rounded-xl px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 bg-white">
                  <input
                    type="text"
                    placeholder="اكتب اسم العطل يدويًا أو ابحث في القائمة..."
                    value={formData.faultName || ''}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, faultName: e.target.value }));
                      setSearchQuery(e.target.value);
                      if (!searchOpen && e.target.value.length > 0) setSearchOpen(true);
                    }}
                    onFocus={() => setSearchOpen(true)}
                    className="flex h-11 w-full bg-transparent py-3 text-sm font-medium outline-none placeholder:text-slate-400 text-right"
                    data-testid="input-fault-name"
                    dir="auto"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(!searchOpen)}
                    className="p-1.5 text-slate-400 hover:text-primary transition-colors shrink-0"
                    title="استعراض قائمة الأعطال الجاهزة"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>

                {searchOpen && (
                  <div className="absolute inset-x-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[100] max-h-[280px] md:max-h-[320px] overflow-y-auto">
                    <div className="sticky top-0 flex items-center justify-between px-3 py-2 border-b bg-slate-50 rounded-t-xl z-10">
                      <span className="text-xs font-bold text-slate-700">الأعطال الجاهزة ({filteredFaults.length})</span>
                      <button
                        type="button"
                        onClick={() => setSearchOpen(false)}
                        className="p-1 text-slate-400 hover:text-slate-700"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                    {filteredFaults.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-500">لا توجد نتائج مطابقة - يمكنك كتابة العطل يدويًا مباشرة</div>
                    ) : (
                      filteredFaults.slice(0, 150).map(fault => (
                        <button
                          key={fault.id}
                          type="button"
                          onClick={() => {
                            handleFaultSelect(fault.faultName);
                            setSearchOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between gap-2 px-3 py-2 text-right hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer border-b border-slate-100 text-sm",
                            formData.faultName === fault.faultName && "bg-primary/10 font-bold text-primary"
                          )}
                          data-testid={`fault-item-${fault.id}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-slate-800">{fault.faultName}</div>
                            <div className="text-[11px] text-slate-400">{getCategoryLabel(fault.category) || fault.category}</div>
                          </div>
                          {formData.faultName === fault.faultName && (
                            <Check className="w-4 h-4 text-primary shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-bold text-slate-800">التفاصيل والتشخيص</label>
                <button
                  type="button"
                  onClick={handleEnhanceText}
                  disabled={isEnhancing || (!formData.faultName && !formData.description)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 border border-zinc-300 rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title="تحسين صياغة التفاصيل بأسلوب تقارير الفحص"
                >
                  {isEnhancing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-700" />
                  ) : (
                    <Pencil className="w-3.5 h-3.5 text-zinc-700" />
                  )}
                  <span>تحسين الصياغة الفنية</span>
                </button>
              </div>
              <textarea 
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all min-h-[70px] md:min-h-[85px] text-sm text-slate-800"
                placeholder="اكتب تفاصيل وملاحظات الفحص يدويًا... (اضغط على علامة القلم لتحسين الصياغة أوتوماتيكياً)"
                dir="auto"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Camera className="w-4 h-4 text-zinc-950" />
                <span>صورة العطل أو الملاحظة</span>
              </label>
              
              {/* Hidden file input for gallery */}
              <input
                type="file"
                ref={simplePhotoInputRef}
                onChange={handleSimplePhotoUpload}
                accept="image/*"
                className="hidden"
                data-testid="input-simple-photo"
              />
              
              {/* Two prominent buttons: Direct Live Camera & Gallery */}
              <div className="grid grid-cols-2 gap-2.5">
                <button 
                  type="button"
                  onClick={() => setIsFaultCameraOpen(true)}
                  className="py-3 px-3 bg-zinc-950 hover:bg-black text-white rounded-2xl shadow-md flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-zinc-800"
                  data-testid="button-live-camera"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Camera className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-xs font-bold font-arabic">التقاط بالكاميرا 📸</span>
                  <span className="text-[10px] text-zinc-400 font-arabic">فتح الكاميرا المباشرة</span>
                </button>

                <button 
                  type="button"
                  onClick={() => simplePhotoInputRef.current?.click()}
                  className="py-3 px-3 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl border border-slate-300 shadow-xs flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  data-testid="button-gallery-photo"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <Upload className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-xs font-bold font-arabic">من المعرض / المجلد 🖼️</span>
                  <span className="text-[10px] text-slate-400 font-arabic">اختيار صورة محفوظة</span>
                </button>
              </div>

              {/* Photo preview */}
              {photo && (
                <div className="mt-3 relative w-full h-36 md:h-44 rounded-2xl overflow-hidden border border-slate-300 shadow-sm bg-zinc-950 flex items-center justify-center">
                  <img src={photo} alt="Preview" className="max-h-full max-w-full object-contain" />
                  <button 
                    type="button"
                    onClick={() => {
                      setPhoto(null);
                      setFormData(prev => ({ ...prev, imageUrl: undefined }));
                      setAiSuggestions([]);
                      setDetectedPart("");
                      setAiAnalysisResult(null);
                    }}
                    className="absolute top-2.5 right-2.5 p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors shadow-lg cursor-pointer"
                    title="حذف الصورة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleProcessPhotoWithAi(photo)}
                    disabled={photoAnalysis.isPending}
                    className="absolute bottom-2.5 left-2.5 px-3 py-1.5 bg-black/80 hover:bg-black text-amber-400 border border-amber-400/50 rounded-xl text-xs font-bold font-arabic flex items-center gap-1.5 shadow-lg backdrop-blur-md cursor-pointer transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>إعادة التحليل الذكي ⚡</span>
                  </button>
                </div>
              )}

              {/* Direct Fault Live Camera Modal */}
              <FaultCameraModal
                isOpen={isFaultCameraOpen}
                onClose={() => setIsFaultCameraOpen(false)}
                onCapture={(dataUrl) => {
                  handleProcessPhotoWithAi(dataUrl);
                }}
                title={`تصوير عطل: ${formData.faultName || 'الملاحظة الفنية'}`}
              />
              
              {/* AI Analysis Loading State */}
              {photoAnalysis.isPending && (
                <div className="mt-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex items-center gap-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-700 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold block">جارٍ الفحص البصري العميق للقطعة والكشف عن الأعطال والخدوش... ⚡</span>
                    <span className="text-[10px] text-amber-700/80">يتم تحديد حالة القطعة ومطابقتها مع مكتبة الفحص المعتمدة</span>
                  </div>
                </div>
              )}
              
              {/* AI Visual Diagnosis Card */}
              {!photoAnalysis.isPending && (aiAnalysisResult || detectedPart || aiSuggestions.length > 0) && (
                <div className="mt-3 p-3.5 rounded-2xl bg-zinc-900 text-white border border-zinc-800 shadow-md space-y-3 font-arabic">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2.5 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>{aiAnalysisResult?.defectStatusText || aiSuggestions[0]?.faultName || "ملاحظة فنية"}</span>
                      </div>
                    </div>

                    {detectedPart && (
                      <div className="text-xs font-bold text-amber-400 bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700">
                        {detectedPart}
                      </div>
                    )}
                  </div>

                  {aiAnalysisResult?.conditionSummary && (
                    <p className="text-xs text-zinc-300 font-arabic">
                      {aiAnalysisResult.conditionSummary}
                    </p>
                  )}

                  {/* 1-Click Interactive Defect Choices */}
                  {aiSuggestions.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] text-zinc-400 font-semibold flex items-center justify-between">
                        <span>اختر العطل المناسب بضغطة زر واحدة (تعبئة فورية):</span>
                        <span className="text-amber-400 font-mono text-[10px]">{aiSuggestions.length} خيارات متاحة</span>
                      </div>

                      <div className="grid grid-cols-1 gap-1.5 max-h-[190px] overflow-y-auto pr-1">
                        {aiSuggestions.map((suggestion, idx) => {
                          const isSelected = formData.faultName === suggestion.faultName;
                          const severityColor = suggestion.severity === 'high' 
                            ? 'border-rose-500/50 bg-rose-500/10 text-rose-300' 
                            : suggestion.severity === 'low' 
                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' 
                            : 'border-amber-500/50 bg-amber-500/10 text-amber-300';
                          const severityLabel = suggestion.severity === 'high' ? 'عالي' : suggestion.severity === 'low' ? 'خفيف' : 'متوسط';

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  faultName: suggestion.faultName,
                                  description: suggestion.description || suggestion.cause || '',
                                  severity: (suggestion.severity as any) || 'medium'
                                }));
                                toast({
                                  title: "تم اختيار وتعبئة العطل ⚡",
                                  description: suggestion.faultName
                                });
                              }}
                              className={cn(
                                "w-full text-right p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer",
                                isSelected
                                  ? "bg-amber-500 text-black border-amber-400 shadow-md font-bold"
                                  : "bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border-zinc-700/80"
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold truncate">{suggestion.faultName}</span>
                                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-mono shrink-0", isSelected ? "bg-black text-amber-400" : severityColor)}>
                                    {severityLabel}
                                  </span>
                                </div>
                                {suggestion.description && (
                                  <p className={cn("text-[11px] truncate mt-0.5", isSelected ? "text-black/80" : "text-zinc-400")}>
                                    {suggestion.description}
                                  </p>
                                )}
                              </div>

                              <div className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center shrink-0 border",
                                isSelected ? "bg-black text-amber-400 border-black" : "border-zinc-600 text-transparent"
                              )}>
                                <Check className="w-3 h-3" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
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
        toast({ title: "خطأ", description: "تعذر استخراج الأكواد من الصورة", variant: "destructive" });
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

  const autelPdfInputRef = useRef<HTMLInputElement>(null);

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
        toast({ 
          title: "خطأ في استيراد البريد", 
          description: data.error || "يرجى التأكد من تهيئة EMAIL_USER و EMAIL_PASS في ملف .env", 
          variant: "destructive" 
        });
      }
    } catch {
      toast({ title: "خطأ", description: "فشل الاتصال بالسيرفر", variant: "destructive" });
    }
    setIsImportingAutel(false);
  };

  const handleAutelPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "خطأ", description: "يرجى اختيار ملف PDF فقط من جهاز Autel", variant: "destructive" });
      return;
    }

    setIsImportingAutel(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const res = await fetch(`/api/autel/upload/${inspectionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            pdfBase64: base64,
            filename: file.name
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast({ title: "تم رفع تقرير Autel بنجاح", description: data.filename });
          queryClient.invalidateQueries({ queryKey: ['/api/inspections', inspectionId] });
        } else {
          toast({ title: "خطأ في الرفع", description: data.error || "فشل رفع الملف", variant: "destructive" });
        }
        setIsImportingAutel(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast({ title: "خطأ", description: "فشل قراءة الملف", variant: "destructive" });
      setIsImportingAutel(false);
    }
  };

  const hasAutelReport = !!(inspection.autelReportPdf);

  const getSeverityColor = (code: string) => {
    const prefix = code.charAt(0).toUpperCase();
    switch (prefix) {
      case 'P': return { bg: 'bg-zinc-100', border: 'border-zinc-300', text: 'text-zinc-950', badge: 'bg-zinc-950', label: 'Powertrain', labelAr: 'المحرك' };
      case 'C': return { bg: 'bg-zinc-100', border: 'border-zinc-300', text: 'text-zinc-950', badge: 'bg-zinc-800', label: 'Chassis', labelAr: 'الشاصي' };
      case 'B': return { bg: 'bg-zinc-100', border: 'border-zinc-300', text: 'text-zinc-950', badge: 'bg-zinc-700', label: 'Body', labelAr: 'الهيكل' };
      case 'U': return { bg: 'bg-zinc-100', border: 'border-zinc-300', text: 'text-zinc-950', badge: 'bg-zinc-600', label: 'Network', labelAr: 'الشبكة' };
      default: return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', badge: 'bg-slate-600', label: 'Other', labelAr: 'أخرى' };
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-white md:bg-slate-900/60 md:backdrop-blur-sm md:flex md:items-center md:justify-center" dir="rtl">
      <div className="w-full h-full md:h-auto md:max-w-2xl md:max-h-[90vh] bg-white md:rounded-2xl md:shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#09090b] text-white px-5 py-4 shrink-0 border-b border-[#18181b]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <PhosphorIcon name="cpu" weight="duotone" size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black font-arabic">فحص كمبيوتر السيارة</h2>
                <p className="text-zinc-400 text-xs font-mono" dir="ltr">OBD-II Diagnostic Scanner</p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors" data-testid="btn-close-obd">
              <X className="w-5 h-5" />
            </button>
          </div>

          {obdCodes.length > 0 && (
            <div className="mt-3 flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2">
              <div className="text-center">
                <div className="text-xl font-black">{obdCodes.length}</div>
                <div className="text-[10px] text-zinc-300 font-arabic">إجمالي أكواد الأعطال المسجلة</div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 shrink-0 space-y-2.5">
          <div className="flex gap-2">
            <div className="flex-1 flex gap-2">
              <input
                ref={inputRef}
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === 'Enter') handleManualAdd(); }}
                placeholder="DTC كود العطل"
                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 text-base font-mono text-center focus:ring-2 focus:ring-zinc-400 focus:border-zinc-900 outline-none bg-white font-bold"
                dir="ltr"
                data-testid="input-obd-code"
              />
              <button
                onClick={handleManualAdd}
                disabled={isLookingUp || !manualCode.trim()}
                className="px-4 py-2.5 bg-zinc-950 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap active:scale-95 shadow-sm font-arabic"
                data-testid="btn-add-obd-code"
              >
                {isLookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                إضافة
              </button>
            </div>
            <div>
              <input type="file" accept="image/*" capture="environment" ref={obdImageRef} className="hidden" onChange={handleImageExtract} />
              <button
                onClick={() => obdImageRef.current?.click()}
                disabled={isExtracting}
                className="h-full px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-colors disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap active:scale-95 shadow-sm font-arabic"
                data-testid="btn-obd-scan-image"
              >
                {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhosphorIcon name="camera" weight="duotone" size={18} className="text-white" />}
                {isExtracting ? 'جارٍ التحليل...' : 'تصوير'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200">
            <button
              onClick={handleAutelImport}
              disabled={isImportingAutel}
              className="w-full px-4 py-2.5 bg-gradient-to-l from-orange-500 to-orange-600 text-white rounded-xl text-xs font-bold hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm font-arabic"
              data-testid="btn-import-autel"
            >
              {isImportingAutel ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhosphorIcon name="envelope-open" weight="duotone" size={18} className="text-white" />}
              {isImportingAutel ? 'جارٍ المطابقة والسحب...' : 'سحب من البريد تلقائياً'}
            </button>

            <div>
              <input
                ref={autelPdfInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={handleAutelPdfUpload}
              />
              <button
                onClick={() => autelPdfInputRef.current?.click()}
                disabled={isImportingAutel}
                className="w-full px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm font-arabic border border-slate-700"
                data-testid="btn-upload-autel-pdf"
              >
                <PhosphorIcon name="file-pdf" weight="duotone" size={18} className="text-white" />
                رفع تقرير PDF من الجهاز
              </button>
            </div>
          </div>
          {hasAutelReport && (
            <div className="flex items-center gap-2 bg-zinc-100 border border-zinc-300 rounded-xl px-4 py-2">
              <PhosphorIcon name="check-circle" weight="duotone" size={20} className="text-zinc-900 shrink-0" />
              <span className="text-xs font-bold text-zinc-950 flex-1">{inspection.autelReportName || 'تقرير Autel'}</span>
              <a
                href={`/api/autel/report/${inspectionId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-zinc-950 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors flex items-center gap-1"
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
              <p className="text-base font-bold text-slate-500 font-arabic">لا توجد أكواد أعطال</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {obdCodes.map((obd) => {
                const colors = getSeverityColor(obd.code);
                const isExpanded = expandedCode === obd.code;
                return (
                  <div key={obd.code} className={`rounded-xl border-2 ${colors.border} overflow-hidden bg-white shadow-sm`}>
                    <div className={`flex items-center gap-3 px-4 py-3`}>
                      <div className="shrink-0">
                        <span className={`font-mono font-black text-sm px-3 py-1.5 rounded-xl text-white ${colors.badge} shadow-sm inline-block`}>{obd.code}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-900 leading-snug">{obd.nameAr}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5" dir="ltr">{obd.nameEn}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {obd.diagnosis && (
                          <button
                            onClick={() => setExpandedCode(isExpanded ? null : obd.code)}
                            className={`p-2 rounded-xl transition-colors ${isExpanded ? 'bg-zinc-900 text-white' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                            data-testid={`btn-toggle-obd-details-${obd.code}`}
                          >
                            {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteCode(obd.code)}
                          className="p-2 rounded-xl text-slate-400 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
                          data-testid={`btn-delete-obd-${obd.code}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {isExpanded && obd.diagnosis && (
                      <div className="px-4 pb-4 pt-1 space-y-2 border-t border-slate-100 font-arabic text-right" dir="rtl">
                        <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                          <div className="text-xs font-bold text-zinc-700 mb-1">التشخيص</div>
                          <div className="text-sm text-zinc-950 leading-relaxed">{obd.diagnosis}</div>
                        </div>
                        {obd.causes && (
                          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                            <div className="text-xs font-bold text-zinc-700 mb-1">الأسباب المحتملة</div>
                            <div className="text-sm text-zinc-950 leading-relaxed">{obd.causes}</div>
                          </div>
                        )}
                        {obd.solutions && (
                          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                            <div className="text-xs font-bold text-zinc-700 mb-1">الحلول المقترحة</div>
                            <div className="text-sm text-zinc-950 leading-relaxed">{obd.solutions}</div>
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


