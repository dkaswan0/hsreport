// ==============================================================================
// Add / Edit Fault Modal - High Safety Inspection System
// Focused ONLY on:
// 1. وصف العطل (Fault Description)
// 2. البحث في مكتبة الأعطال (Search Fault Library)
// 3. التصوير (Live Camera)
// 4. رفع الصورة (Upload Photo)
// 5. تحليل AI بشكل اختياري (Optional AI Analysis)
// 6. حفظ العطل (Save Fault)
// ==============================================================================

import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PhosphorIcon } from "@/components/phosphor-icon";
import { MAIN_SECTIONS, getMainSectionById, mapLegacyCategoryToMainSection } from "@shared/categories";
import { FaultCameraModal } from "@/components/fault-camera-modal";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles, Check, X, Camera, Upload, Trash2, RotateCcw, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AddEditFaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSectionId?: string;
  editItem?: {
    id?: number;
    faultName: string;
    category?: string | null;
    severity?: string | null;
    notes?: string | null;
    imageUrl?: string | null;
  } | null;
  onSave: (faultData: {
    faultName: string;
    sectionId: string;
    severity?: "low" | "medium" | "high" | "critical";
    notes?: string;
    imageUrl?: string | null;
  }) => Promise<void> | void;
}

export const AddEditFaultModal: React.FC<AddEditFaultModalProps> = ({
  isOpen,
  onClose,
  initialSectionId = "mechanical",
  editItem,
  onSave,
}) => {
  const { toast } = useToast();

  const [selectedSection, setSelectedSection] = useState<string>(() =>
    mapLegacyCategoryToMainSection(editItem?.category || initialSectionId)
  );
  const [faultText, setFaultText] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Camera & AI Vision state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset form on open/editItem change
  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setSelectedSection(mapLegacyCategoryToMainSection(editItem.category || initialSectionId));
        setFaultText(editItem.faultName || editItem.notes || "");
        setImageUrl(editItem.imageUrl || null);
      } else {
        setSelectedSection(mapLegacyCategoryToMainSection(initialSectionId));
        setFaultText("");
        setImageUrl(null);
      }
      setSearchQuery("");
      setDebouncedSearch("");
      setAiSuggestion(null);
      setIsSubmitting(false);
    }
  }, [isOpen, editItem, initialSectionId]);

  // Debounce search query (280ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 280);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Search Fault Library Query (9,000+ faults)
  const { data: searchResults, isLoading: isSearchLoading } = useQuery({
    queryKey: ["/api/fault-library", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return [];
      const res = await fetch(`/api/fault-library?q=${encodeURIComponent(debouncedSearch)}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: debouncedSearch.length >= 2,
  });

  const sectionDef = getMainSectionById(selectedSection);

  // Handle Photo Selection from File Input
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImageUrl(dataUrl);
      setAiSuggestion(null);
    };
    reader.readAsDataURL(file);
  };

  // Handle AI Vision Image Analysis (Optional)
  const handleAnalyzeWithAi = async () => {
    if (!imageUrl) return;

    setIsAnalyzingAi(true);
    try {
      const res = await fetch("/api/ai/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageUrl,
          section: selectedSection,
          prompt: "حلل صورة العطل الفني للمركبة واقترح وصفاً فنياً دقيقاً ومختصراً للعطل باللغة العربية.",
        }),
      });

      if (!res.ok) {
        throw new Error("فشل الاتصال بخدمة التحليل الذكي");
      }

      const data = await res.json();
      const suggestedText = data.description || data.text || data.faultName || "ملاحظة فنية تحتاج للمعاينة";

      setAiSuggestion(suggestedText);

      toast({
        title: "✨ تم تحليل الصورة بالذكاء الاصطناعي",
        description: "راجع الاقتراح في الأسفل واعتمد ما يناسبك.",
      });
    } catch (err: any) {
      console.warn("AI analysis error:", err);
      toast({
        title: "تنبيه",
        description: "تعذر التحليل التلقائي للصورة حالياً. يمكنك كتابة الوصف يدوياً.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  // Save Fault Handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanText = faultText.trim();
    if (!cleanText) {
      toast({
        title: "يرجى كتابة وصف العطل",
        description: "اكتب وصف العطل أو الملاحظة الفنية قبل الحفظ.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        faultName: cleanText,
        sectionId: selectedSection,
        severity: (editItem?.severity as any) || "medium",
        notes: cleanText,
        imageUrl,
      });

      toast({
        title: editItem ? "تم تعديل العطل بنجاح" : "✨ تم إضافة العطل بنجاح",
        description: `تم حفظ العطل في قسم: ${sectionDef.label}`,
      });
      onClose();
    } catch (err: any) {
      toast({
        title: "خطأ أثناء الحفظ",
        description: err?.message || "تعذر حفظ العطل.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full bg-zinc-950 text-white p-4 sm:p-6 rounded-3xl border border-zinc-800 shadow-2xl font-arabic max-h-[92vh] overflow-y-auto z-[99990]">
          <DialogTitle className="sr-only">
            {editItem ? "تعديل العطل الفني" : "إضافة عطل فني جديد"}
          </DialogTitle>

          {/* ── Modal Header ── */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-inner"
                style={{
                  backgroundColor: `${sectionDef.color}20`,
                  borderColor: `${sectionDef.color}40`,
                }}
              >
                <PhosphorIcon
                  name={sectionDef.iconName as any}
                  weight="bold"
                  size={22}
                  style={{ color: sectionDef.color }}
                />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg text-white">
                  {editItem ? "تعديل الملاحظة الفنية" : "إضافة عطل فني جديد"}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span>القسم المعتمد:</span>
                  <span className="font-bold text-white" style={{ color: sectionDef.color }}>
                    {sectionDef.label}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">({sectionDef.labelEn})</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-3 text-right" dir="rtl">
            {/* ── 1. Section Selector (Quick Switcher) ── */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                تحديد القسم التابع له العطل:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {MAIN_SECTIONS.map((sec) => {
                  const isSelected = selectedSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setSelectedSection(sec.id)}
                      className={cn(
                        "py-2 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                        isSelected
                          ? "bg-zinc-800 border-white text-white shadow-md scale-[1.01]"
                          : "bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                      )}
                    >
                      <PhosphorIcon
                        name={sec.iconName as any}
                        weight={isSelected ? "fill" : "bold"}
                        size={16}
                        style={{ color: sec.color }}
                      />
                      <span className="truncate">{sec.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── 2. Fault Library Search (Search-First) ── */}
            <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-amber-400" />
                  <span>البحث في مكتبة الأعطال (9,000+ عطل)</span>
                </span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-[11px] text-zinc-400 hover:text-white"
                  >
                    مسح البحث
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث مثل: تهريب زيت، رش تجميلي، كود، صوت، تهريب..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl py-2 px-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                />
                {isSearchLoading && (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                  </div>
                )}
              </div>

              {/* Live Search Suggestions Dropdown */}
              {debouncedSearch.length >= 2 && (
                <div className="max-h-48 overflow-y-auto space-y-1 pt-1 scrollbar-thin scrollbar-thumb-zinc-700">
                  {searchResults && searchResults.length > 0 ? (
                    searchResults.slice(0, 10).map((item: any, idx: number) => (
                      <button
                        key={item.id || idx}
                        type="button"
                        onClick={() => {
                          setFaultText(item.faultName || item.description || "");
                          setSearchQuery("");
                        }}
                        className="w-full p-2 text-right bg-zinc-950/80 hover:bg-zinc-800/90 border border-zinc-800/60 hover:border-zinc-700 rounded-xl transition-all flex items-center justify-between gap-2 cursor-pointer group"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                            {item.faultName}
                          </div>
                          {item.description && (
                            <div className="text-[10px] text-zinc-400 truncate">
                              {item.description}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-amber-400 shrink-0 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          اختيار
                        </span>
                      </button>
                    ))
                  ) : !isSearchLoading ? (
                    <div className="text-center py-2 text-xs text-zinc-500">
                      لا توجد نتائج مطابقة في المكتبة. يمكنك كتابة العطل يدويًا في الأسفل.
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* ── 3. Fault Description / Notes (Manual Comfortable Textarea) ── */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-300">
                  وصف العطل أو الملاحظة الفنية: <span className="text-rose-400">*</span>
                </label>
                {faultText && (
                  <button
                    type="button"
                    onClick={() => setFaultText("")}
                    className="text-[11px] text-zinc-400 hover:text-white"
                  >
                    تفريغ النص
                  </button>
                )}
              </div>
              <textarea
                value={faultText}
                onChange={(e) => setFaultText(e.target.value)}
                placeholder="اكتب العطل أو الملاحظة الفنية هنا بكل وضوح..."
                rows={4}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-white rounded-2xl p-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none transition-all resize-y leading-relaxed shadow-inner"
                required
              />
            </div>

            {/* ── 4. Photo Capture & Upload (Camera / Upload / Optional AI) ── */}
            <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-zinc-400" />
                  <span>صورة العطل التوثيقية (اختياري)</span>
                </label>
                {imageUrl && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    ✓ تم إرفاق صورة
                  </span>
                )}
              </div>

              {!imageUrl ? (
                /* Capture Buttons */
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="py-3 px-3 bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-zinc-700 rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-white transition-all cursor-pointer shadow-sm"
                  >
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>📸 التقاط صورة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-3 px-3 bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-zinc-700 rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-white transition-all cursor-pointer shadow-sm"
                  >
                    <Upload className="w-4 h-4 text-blue-400" />
                    <span>🖼️ رفع صورة</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                /* Photo Preview & AI Options */
                <div className="space-y-3">
                  <div className="relative w-full aspect-video max-h-56 bg-black rounded-2xl overflow-hidden border border-zinc-700 shadow-md flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt="معاينة صورة العطل"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Photo Actions Row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isAnalyzingAi}
                      onClick={handleAnalyzeWithAi}
                      className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-black font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      {isAnalyzingAi ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>جارٍ التحليل بالذكاء الاصطناعي...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>🔍 تحليل بالذكاء الاصطناعي</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold flex items-center gap-1 border border-zinc-700 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>إعادة التقاط</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl(null);
                        setAiSuggestion(null);
                      }}
                      className="py-2 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1 border border-rose-500/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>

                  {/* AI Vision Suggestion Card (Optional Helper) */}
                  {aiSuggestion && (
                    <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span>اقتراح الذكاء الاصطناعي:</span>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed bg-black/40 p-2.5 rounded-xl border border-white/5">
                        {aiSuggestion}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setFaultText(aiSuggestion);
                            setAiSuggestion(null);
                          }}
                          className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-lg transition-all cursor-pointer"
                        >
                          ✓ استخدام الاقتراح
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFaultText((prev) => (prev ? `${prev} - ${aiSuggestion}` : aiSuggestion));
                            setAiSuggestion(null);
                          }}
                          className="py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg transition-all cursor-pointer"
                        >
                          تعديل ودمج
                        </button>
                        <button
                          type="button"
                          onClick={() => setAiSuggestion(null)}
                          className="py-1.5 px-2 text-zinc-400 hover:text-white text-xs"
                        >
                          تجاهل
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── 5. Modal Footer Action (Save Fault) ── */}
            <div className="pt-3 flex gap-2.5 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-2xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !faultText.trim()}
                className="flex-1 py-3 px-5 bg-white hover:bg-zinc-100 disabled:opacity-50 text-zinc-950 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{editItem ? "حفظ التعديلات" : "حفظ العطل في الفحص"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Live Camera Stream Modal */}
      <FaultCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => {
          setImageUrl(dataUrl);
          setIsCameraOpen(false);
          setAiSuggestion(null);
        }}
        title={`تصوير عطل في قسم: ${sectionDef.label}`}
      />
    </>
  );
};
