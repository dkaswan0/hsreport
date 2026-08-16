// ==============================================================================
// Inspection Details Page - High Safety Modern 6-Main-Section Workspace
// Workflow: 6 Main Sections -> Select Section -> Quick Add Fault (Manual/Search/Camera)
// Dedicated VIN Section Card (LTR 17-char, Camera, Upload, OCR Scan)
// ==============================================================================

import React, { useState, useMemo } from "react";
import { useRoute } from "wouter";
import { useInspection, useCreateInspectionItem, useDeleteInspectionItem, useUpdateInspectionItem, useUpdateInspection } from "@/hooks/use-inspections";
import { MAIN_SECTIONS, getMainSectionById, mapLegacyCategoryToMainSection } from "@shared/categories";
import { AddEditFaultModal } from "@/components/add-edit-fault-modal";
import { VinSectionCard } from "@/components/vin-section-card";
import { PhosphorIcon } from "@/components/phosphor-icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { InspectionItem } from "@shared/schema";
import { 
  Car, 
  FileText, 
  Printer, 
  Save, 
  Plus, 
  Trash2, 
  Pencil, 
  Camera, 
  Eye, 
  EyeOff, 
  Monitor, 
  Check, 
  X, 
  Loader2, 
  AlertTriangle,
  ArrowRight,
  Sparkles
} from "lucide-react";

export default function InspectionDetails() {
  const [, params] = useRoute("/inspections/:id");
  const id = Number(params?.id);
  const { data: inspection, isLoading, error } = useInspection(id);
  const { toast } = useToast();

  const updateInspection = useUpdateInspection();
  const createItem = useCreateInspectionItem();
  const updateItem = useUpdateInspectionItem();
  const deleteItem = useDeleteInspectionItem();

  // Active Main Section (Default: "mechanical")
  const [activeSectionId, setActiveSectionId] = useState<string>("mechanical");

  // Fault Modal State
  const [isAddFaultModalOpen, setIsAddFaultModalOpen] = useState(false);
  const [editingFaultItem, setEditingFaultItem] = useState<InspectionItem | null>(null);

  // Lightbox State
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  // OBD Manager State
  const [isObdOpen, setIsObdOpen] = useState(false);
  const [newObdCode, setNewObdCode] = useState("");
  const [newObdNameAr, setNewObdNameAr] = useState("");
  const [newObdNameEn, setNewObdNameEn] = useState("");
  const [newObdDiagnosis, setNewObdDiagnosis] = useState("");
  const [newObdCauses, setNewObdCauses] = useState("");
  const [newObdSolutions, setNewObdSolutions] = useState("");
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  // Inline Vehicle Specs Edit State
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);
  const [specsForm, setSpecsForm] = useState({
    make: "",
    model: "",
    year: 0,
    color: "",
    odometer: 0,
    customerName: "",
    customerPhone: "",
    inspectionType: "",
    notes: "",
  });

  const activeSectionDef = getMainSectionById(activeSectionId);

  // Map all inspection items safely to the 6 canonical sections
  const itemsBySection = useMemo(() => {
    const map: Record<string, InspectionItem[]> = {
      mechanical: [],
      exterior_body: [],
      electrical_electronics: [],
      transmission: [],
      chassis: [],
      other: [],
    };

    if (inspection?.items && Array.isArray(inspection.items)) {
      inspection.items.forEach((item: InspectionItem) => {
        const canonical = mapLegacyCategoryToMainSection(item.category);
        if (map[canonical]) {
          map[canonical].push(item);
        } else {
          map.other.push(item);
        }
      });
    }

    return map;
  }, [inspection?.items]);

  const activeSectionItems = itemsBySection[activeSectionId] || [];
  const totalFaultsCount = (inspection?.items || []).length;

  // Handle Status Toggle (draft <-> completed)
  const handleStatusUpdate = async (newStatus: "draft" | "completed") => {
    if (!inspection) return;
    try {
      await updateInspection.mutateAsync({
        id: inspection.id,
        status: newStatus,
      });
      toast({
        title: newStatus === "completed" ? "✨ تم اعتماد وإنهاء الفحص" : "تم إعادة الفحص لوضع التعديل",
        description: `حالة الفحص الآن: ${newStatus === "completed" ? "معتمد" : "مسودة"}`,
      });
    } catch (err: any) {
      toast({
        title: "خطأ في تحديث الحالة",
        description: err?.message || "تعذر تحديث حالة الفحص.",
        variant: "destructive",
      });
    }
  };

  // Handle Save / Update Fault Item
  const handleSaveFault = async (faultData: {
    faultName: string;
    sectionId: string;
    severity: "low" | "medium" | "high" | "critical";
    notes?: string;
    imageUrl?: string | null;
  }) => {
    if (!inspection) return;

    if (editingFaultItem && editingFaultItem.id) {
      // Update existing item
      await updateItem.mutateAsync({
        id: editingFaultItem.id,
        inspectionId: inspection.id,
        category: faultData.sectionId, // Authoritative section
        faultName: faultData.faultName,
        severity: faultData.severity,
        notes: faultData.notes || faultData.faultName,
        imageUrl: faultData.imageUrl || null,
      });
    } else {
      // Create new item
      await createItem.mutateAsync({
        inspectionId: inspection.id,
        category: faultData.sectionId, // Authoritative section
        faultName: faultData.faultName,
        status: "fail",
        severity: faultData.severity,
        notes: faultData.notes || faultData.faultName,
        imageUrl: faultData.imageUrl || null,
      });
    }

    setEditingFaultItem(null);
  };

  // Handle Delete Fault Item
  const handleDeleteFault = async (itemId: number) => {
    if (!inspection) return;
    if (!confirm("هل أنت متأكد من حذف هذه الملاحظة الفنية؟")) return;

    try {
      await deleteItem.mutateAsync({ id: itemId, inspectionId: inspection.id });
      toast({ title: "تم حذف الملاحظة بنجاح" });
    } catch (err: any) {
      toast({
        title: "خطأ في الحذف",
        description: err?.message || "تعذر حذف الملاحظة.",
        variant: "destructive",
      });
    }
  };

  // Open Add Fault Modal for current or selected section
  const handleOpenAddFault = (sectionId?: string) => {
    if (sectionId) setActiveSectionId(sectionId);
    setEditingFaultItem(null);
    setIsAddFaultModalOpen(true);
  };

  // Open Edit Fault Modal
  const handleOpenEditFault = (item: InspectionItem) => {
    setEditingFaultItem(item);
    setIsAddFaultModalOpen(true);
  };

  // Handle OBD Codes
  const obdCodes = (inspection?.obdCodes as Array<{
    code: string;
    nameEn: string;
    nameAr: string;
    diagnosis?: string;
    causes?: string;
    solutions?: string;
  }> | null) || [];

  const handleAddObdCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspection || !newObdCode.trim()) return;

    const newEntry = {
      code: newObdCode.toUpperCase().trim(),
      nameAr: newObdNameAr.trim() || `كود العطل ${newObdCode.toUpperCase().trim()}`,
      nameEn: newObdNameEn.trim() || newObdCode.toUpperCase().trim(),
      diagnosis: newObdDiagnosis.trim() || undefined,
      causes: newObdCauses.trim() || undefined,
      solutions: newObdSolutions.trim() || undefined,
    };

    const updatedList = [...obdCodes.filter((c) => c.code !== newEntry.code), newEntry];

    try {
      await updateInspection.mutateAsync({
        id: inspection.id,
        obdCodes: updatedList,
      });
      setNewObdCode("");
      setNewObdNameAr("");
      setNewObdNameEn("");
      setNewObdDiagnosis("");
      setNewObdCauses("");
      setNewObdSolutions("");
      toast({ title: "تمت إضافة كود العطل بنجاح" });
    } catch (err: any) {
      toast({
        title: "خطأ في إضافة كود العطل",
        description: err?.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteObdCode = async (codeToDelete: string) => {
    if (!inspection) return;
    const updatedList = obdCodes.filter((c) => c.code !== codeToDelete);
    try {
      await updateInspection.mutateAsync({
        id: inspection.id,
        obdCodes: updatedList,
      });
      toast({ title: "تم حذف كود العطل" });
    } catch (err: any) {
      toast({ title: "خطأ في حذف الكود", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-amber-400 mb-3" />
        <p className="font-bold text-sm font-arabic">جارٍ تحميل بيانات الفحص...</p>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-white font-arabic">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-xl font-bold mb-1">الفحص غير موجود</h2>
        <p className="text-zinc-400 text-sm mb-4">تعذر العثور على تقرير الفحص المطلوب.</p>
        <button
          onClick={() => (window.location.href = "/")}
          className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24 font-arabic" dir="rtl">
      {/* ── Top Floating Action Header ── */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-3 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Right: Back & Inspection ID */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => (window.location.href = "/")}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors shrink-0"
              title="العودة للقائمة"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-sm sm:text-base text-white tracking-wider">
                  HS-{inspection.id}
                </span>
                <StatusBadge status={inspection.status as any} />
              </div>
              <p className="text-xs text-zinc-400 truncate max-w-[180px] sm:max-w-xs">
                {inspection.make} {inspection.model} {inspection.year || ""} — {inspection.customerName || "عميل"}
              </p>
            </div>
          </div>

          {/* Left: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => (window.location.href = `/reports/${id}`)}
              className="py-2 px-3 sm:px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="معاينة التقرير الرقمي"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">التقرير المعتمد</span>
            </button>

            <button
              onClick={() => window.print()}
              className="p-2 sm:p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="طباعة"
            >
              <Printer className="w-4 h-4" />
            </button>

            {inspection.status === "draft" ? (
              <button
                onClick={() => handleStatusUpdate("completed")}
                className="py-2 px-3 sm:px-5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all shadow-lg cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4 text-emerald-600" />
                <span>خلص الفحص</span>
              </button>
            ) : (
              <button
                onClick={() => handleStatusUpdate("draft")}
                className="py-2 px-3 sm:px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs sm:text-sm font-bold transition-all cursor-pointer"
              >
                إعادة للعمل
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6">
        {/* ── 1. Top Section: Dedicated VIN Card & Vehicle Info Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* VIN Section Card (Cols 1-6 on Desktop) */}
          <div className="lg:col-span-6">
            <VinSectionCard
              vin={inspection.vin}
              vinPhoto={inspection.vinPhoto}
              onVinChange={(newVin) => {
                updateInspection.mutate({
                  id: inspection.id,
                  vin: newVin,
                });
              }}
              onVinPhotoChange={(newPhotoUrl) => {
                updateInspection.mutate({
                  id: inspection.id,
                  vinPhoto: newPhotoUrl,
                });
              }}
            />
          </div>

          {/* Vehicle & Customer Specs Summary (Cols 7-12 on Desktop) */}
          <div className="lg:col-span-6 bg-zinc-950 text-white rounded-3xl p-4 sm:p-5 border border-zinc-800 shadow-xl flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base">بيانات المركبة والعميل</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isEditingSpecs) {
                    setSpecsForm({
                      make: inspection.make || "",
                      model: inspection.model || "",
                      year: inspection.year || 0,
                      color: inspection.color || "",
                      odometer: inspection.odometer || 0,
                      customerName: inspection.customerName || "",
                      customerPhone: inspection.customerPhone || "",
                      inspectionType: inspection.inspectionType || "فحص شامل",
                      notes: inspection.notes || "",
                    });
                  }
                  setIsEditingSpecs(!isEditingSpecs);
                }}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-bold"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>{isEditingSpecs ? "إلغاء التعديل" : "تعديل البيانات"}</span>
              </button>
            </div>

            {!isEditingSpecs ? (
              /* Specs Display Mode */
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-zinc-900/80 p-2.5 rounded-2xl border border-zinc-800/80">
                  <div className="text-zinc-500 text-[10px]">المركبة</div>
                  <div className="font-bold text-white mt-0.5 truncate">
                    {inspection.make} {inspection.model}
                  </div>
                </div>
                <div className="bg-zinc-900/80 p-2.5 rounded-2xl border border-zinc-800/80">
                  <div className="text-zinc-500 text-[10px]">سنة الصنع / اللون</div>
                  <div className="font-bold text-white mt-0.5">
                    {inspection.year || "-"} / {inspection.color || "-"}
                  </div>
                </div>
                <div className="bg-zinc-900/80 p-2.5 rounded-2xl border border-zinc-800/80">
                  <div className="text-zinc-500 text-[10px]">قراءة العداد</div>
                  <div className="font-bold text-white font-mono mt-0.5">
                    {inspection.odometer ? `${inspection.odometer.toLocaleString()} كم` : "-"}
                  </div>
                </div>
                <div className="bg-zinc-900/80 p-2.5 rounded-2xl border border-zinc-800/80">
                  <div className="text-zinc-500 text-[10px]">العميل</div>
                  <div className="font-bold text-white mt-0.5 truncate">
                    {inspection.customerName || "-"}
                  </div>
                </div>
                <div className="bg-zinc-900/80 p-2.5 rounded-2xl border border-zinc-800/80">
                  <div className="text-zinc-500 text-[10px]">جوال العميل</div>
                  <div className="font-bold text-white font-mono mt-0.5" dir="ltr">
                    {inspection.customerPhone || "-"}
                  </div>
                </div>
                <div className="bg-zinc-900/80 p-2.5 rounded-2xl border border-zinc-800/80">
                  <div className="text-zinc-500 text-[10px]">نوع الفحص</div>
                  <div className="font-bold text-amber-400 mt-0.5 truncate">
                    {inspection.inspectionType || "فحص شامل"}
                  </div>
                </div>
              </div>
            ) : (
              /* Specs Inline Edit Form */
              <div className="space-y-2.5 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={specsForm.make}
                    onChange={(e) => setSpecsForm({ ...specsForm, make: e.target.value })}
                    placeholder="الشركة (مثال: تويوتا)"
                    className="bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-white focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="text"
                    value={specsForm.model}
                    onChange={(e) => setSpecsForm({ ...specsForm, model: e.target.value })}
                    placeholder="الموديل (مثال: كامري)"
                    className="bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-white focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="number"
                    value={specsForm.year || ""}
                    onChange={(e) => setSpecsForm({ ...specsForm, year: Number(e.target.value) })}
                    placeholder="سنة الصنع"
                    className="bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-white focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="text"
                    value={specsForm.color}
                    onChange={(e) => setSpecsForm({ ...specsForm, color: e.target.value })}
                    placeholder="اللون"
                    className="bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-white focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="number"
                    value={specsForm.odometer || ""}
                    onChange={(e) => setSpecsForm({ ...specsForm, odometer: Number(e.target.value) })}
                    placeholder="العداد (كم)"
                    className="bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-white focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="text"
                    value={specsForm.customerName}
                    onChange={(e) => setSpecsForm({ ...specsForm, customerName: e.target.value })}
                    placeholder="اسم العميل"
                    className="bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await updateInspection.mutateAsync({
                      id: inspection.id,
                      ...specsForm,
                    });
                    setIsEditingSpecs(false);
                    toast({ title: "تم حفظ بيانات المركبة بنجاح" });
                  }}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── 2. The 6 Main Sections Navigation Bar ── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <span>أقسام الفحص الرئيسية</span>
              <span className="bg-zinc-800 text-zinc-300 font-mono text-xs px-2.5 py-0.5 rounded-full border border-zinc-700">
                {totalFaultsCount} ملاحظة مسجلة
              </span>
            </h2>
            <span className="text-xs text-zinc-400 font-arabic hidden sm:inline">
              اختر القسم لعرض وتدوين الملاحظات التابعة له
            </span>
          </div>

          {/* 6 Section Tabs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
            {MAIN_SECTIONS.map((sec) => {
              const isSelected = activeSectionId === sec.id;
              const sectionFaults = itemsBySection[sec.id] || [];
              const count = sectionFaults.length;

              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSectionId(sec.id)}
                  className={cn(
                    "p-3 sm:p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between gap-2.5 cursor-pointer relative overflow-hidden group",
                    isSelected
                      ? "bg-zinc-900 border-white ring-2 ring-white/60 shadow-xl scale-[1.02]"
                      : "bg-zinc-950/80 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/60"
                  )}
                >
                  {/* Top: Icon & Count Badge */}
                  <div className="flex items-center justify-between">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center border shadow-inner"
                      style={{
                        backgroundColor: `${sec.color}20`,
                        borderColor: `${sec.color}40`,
                      }}
                    >
                      <PhosphorIcon
                        name={sec.iconName as any}
                        weight={isSelected ? "fill" : "bold"}
                        size={18}
                        style={{ color: sec.color }}
                      />
                    </div>

                    <span
                      className={cn(
                        "font-mono text-[11px] font-bold px-2 py-0.5 rounded-full border",
                        count > 0
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-black"
                          : "bg-zinc-900 text-zinc-500 border-zinc-800"
                      )}
                    >
                      {count}
                    </span>
                  </div>

                  {/* Bottom: Label */}
                  <div>
                    <div className="font-black text-xs sm:text-sm text-white group-hover:text-white transition-colors truncate">
                      {sec.label}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono font-medium truncate" dir="ltr">
                      {sec.labelEn}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 3. Active Section Workspace ── */}
        <div
          className="bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl p-4 sm:p-6 space-y-4 animate-in fade-in duration-300"
          data-testid="active-section-workspace"
        >
          {/* Active Section Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/90 border border-zinc-800/80 p-3.5 sm:p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border shadow-md shrink-0"
                style={{
                  backgroundColor: `${activeSectionDef.color}20`,
                  borderColor: `${activeSectionDef.color}40`,
                }}
              >
                <PhosphorIcon
                  name={activeSectionDef.iconName as any}
                  weight="bold"
                  size={24}
                  style={{ color: activeSectionDef.color }}
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base sm:text-lg text-white">
                    قسم: {activeSectionDef.label}
                  </h3>
                  <span className="text-xs font-mono text-zinc-400">
                    ({activeSectionDef.labelEn})
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-arabic mt-0.5">
                  {activeSectionDef.description}
                </p>
              </div>
            </div>

            {/* Prominent "+ إضافة عطل" Button */}
            <button
              type="button"
              onClick={() => handleOpenAddFault(activeSectionId)}
              className="py-3 px-5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer shrink-0"
              data-testid="btn-add-fault-active-section"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>+ إضافة عطل في {activeSectionDef.label}</span>
            </button>
          </div>

          {/* List of Faults in this Section */}
          <div className="space-y-2.5">
            {activeSectionItems.length === 0 ? (
              /* Empty State */
              <div className="text-center py-10 px-4 bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto text-zinc-600 border border-zinc-800">
                  <PhosphorIcon name={activeSectionDef.iconName as any} weight="light" size={26} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-300 font-arabic">
                    لا توجد ملاحظات أو أعطال مسجلة في {activeSectionDef.label}
                  </h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    اضغط على زر "إضافة عطل" لكتابة ملاحظة يدوياً أو البحث في المكتبة أو التقاط صورة.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAddFault(activeSectionId)}
                  className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>+ إضافة أول عطل في {activeSectionDef.label}</span>
                </button>
              </div>
            ) : (
              /* Fault Cards Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeSectionItems.map((item: InspectionItem) => {
                  const severityConfig = {
                    low: { label: "منخفض", bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
                    medium: { label: "متوسط", bg: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
                    high: { label: "عالي", bg: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
                    critical: { label: "حرج", bg: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
                  }[item.severity || "medium"] || {
                    label: "متوسط",
                    bg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
                  };

                  return (
                    <div
                      key={item.id}
                      className="bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800/90 hover:border-zinc-700 p-3.5 sm:p-4 rounded-2xl transition-all shadow-md flex flex-col justify-between gap-3 group"
                    >
                      {/* Fault Header & Name */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                              severityConfig.bg
                            )}
                          >
                            {severityConfig.label}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditFault(item)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                              title="تعديل العطل"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFault(item.id)}
                              className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 transition-colors cursor-pointer"
                              title="حذف العطل"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h4 className="font-black text-sm sm:text-base text-white leading-snug">
                          {item.faultName}
                        </h4>
                        {item.notes && item.notes !== item.faultName && (
                          <p className="text-xs text-zinc-400 leading-relaxed font-arabic">
                            {item.notes}
                          </p>
                        )}
                      </div>

                      {/* Attached Defect Photo (Isolated in this defect card) */}
                      {item.imageUrl && (
                        <div
                          className="relative w-full aspect-[16/9] max-h-40 bg-black rounded-xl overflow-hidden border border-zinc-800 cursor-pointer group/img shadow-inner"
                          onClick={() =>
                            setLightboxImage({
                              url: item.imageUrl!,
                              title: item.faultName,
                            })
                          }
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.faultName}
                            className="w-full h-full object-contain group-hover/img:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-black/80 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border border-white/20">
                              <Eye className="w-3.5 h-3.5" />
                              <span>تكبير الصورة</span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── 4. OBD Diagnostic Fault Codes Manager ── */}
        <div className="bg-zinc-950 rounded-3xl border border-zinc-800 shadow-xl overflow-hidden">
          <div
            className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none bg-zinc-900/60 hover:bg-zinc-900 transition-colors"
            onClick={() => setIsObdOpen(!isObdOpen)}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400">
                <Monitor className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white">
                  أكواد فحص الكمبيوتر (OBD-II Diagnostic Codes)
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  {obdCodes.length} كود مسجل
                </p>
              </div>
            </div>
            <button className="text-xs text-amber-400 font-bold">
              {isObdOpen ? "إخفاء" : "عرض وإضافة أكواد"}
            </button>
          </div>

          {isObdOpen && (
            <div className="p-4 sm:p-5 border-t border-zinc-800 space-y-4">
              {/* Add Code Form */}
              <form onSubmit={handleAddObdCode} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newObdCode}
                  onChange={(e) => setNewObdCode(e.target.value.toUpperCase())}
                  placeholder="كود العطل (مثال: P0300)"
                  className="bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 text-xs text-white font-mono font-bold uppercase focus:outline-none focus:border-amber-400"
                  required
                />
                <input
                  type="text"
                  value={newObdNameAr}
                  onChange={(e) => setNewObdNameAr(e.target.value)}
                  placeholder="وصف الكود بالعربية"
                  className="bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة الكود</span>
                </button>
              </form>

              {/* Codes List */}
              {obdCodes.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {obdCodes.map((obd) => (
                    <div
                      key={obd.code}
                      className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-mono font-black text-amber-400 mr-2">{obd.code}</span>
                        <span className="font-bold text-white truncate">{obd.nameAr}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteObdCode(obd.code)}
                        className="p-1 text-zinc-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── Add / Edit Fault Modal ── */}
      <AddEditFaultModal
        isOpen={isAddFaultModalOpen}
        onClose={() => {
          setIsAddFaultModalOpen(false);
          setEditingFaultItem(null);
        }}
        initialSectionId={activeSectionId}
        editItem={editingFaultItem}
        onSave={handleSaveFault}
      />

      {/* ── Image Lightbox Modal ── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/95 z-[999999] flex flex-col items-center justify-center p-4 select-none animate-in fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div className="fixed top-4 right-4 left-4 flex items-center justify-between z-10 text-white max-w-4xl mx-auto">
            <h4 className="font-bold text-sm sm:text-base truncate">{lightboxImage.title}</h4>
            <button
              onClick={() => setLightboxImage(null)}
              className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative max-w-4xl max-h-[85vh] flex items-center justify-center my-auto">
            <img
              src={lightboxImage.url}
              alt={lightboxImage.title}
              className="max-w-[95vw] max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-zinc-800"
            />
          </div>
        </div>
      )}
    </div>
  );
}
