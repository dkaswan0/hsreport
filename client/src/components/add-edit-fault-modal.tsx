// ==============================================================================
// Add / Edit Fault Modal - High Safety Inspection System
// Visual Theme: Strictly BLACK, WHITE & GRAY (Monochrome Luxury Aesthetic)
// Section is Fixed (NO Section Switcher inside Modal)
// Features: 9000+ Deep Library Search, Live Camera, Upload, Multi-Suggestion AI
// ==============================================================================

import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PhosphorIcon } from "@/components/phosphor-icon";
import { getMainSectionById, mapLegacyCategoryToMainSection } from "@shared/categories";
import { FaultCameraModal } from "@/components/fault-camera-modal";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles, Check, X, Camera, Upload, Trash2, RotateCcw, Search, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AddEditFaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string; // The active section is fixed from caller
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
    notes?: string;
    imageUrl?: string | null;
  }) => Promise<void> | void;
}

export const AddEditFaultModal: React.FC<AddEditFaultModalProps> = ({
  isOpen,
  onClose,
  sectionId = "mechanical",
  editItem,
  onSave,
}) => {
  const { toast } = useToast();

  const canonicalSectionId = mapLegacyCategoryToMainSection(editItem?.category || sectionId);
  const sectionDef = getMainSectionById(canonicalSectionId);

  const [faultText, setFaultText] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Camera & AI Vision state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset/Initialize state
  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setFaultText(editItem.faultName || editItem.notes || "");
        setImageUrl(editItem.imageUrl || null);
      } else {
        setFaultText("");
        setImageUrl(null);
      }
      setSearchQuery("");
      setDebouncedSearch("");
      setAiSuggestions([]);
      setIsSubmitting(false);
    }
  }, [isOpen, editItem]);

  // Debounce search query (250ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Search Fault Library (9,000+ faults with section priority)
  const { data: searchResults, isLoading: isSearchLoading } = useQuery({
    queryKey: ["/api/fault-library", debouncedSearch, canonicalSectionId],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return [];
      const res = await fetch(
        `/api/fault-library?q=${encodeURIComponent(debouncedSearch)}&section=${encodeURIComponent(canonicalSectionId)}`
      );
      if (!res.ok) return [];
      return res.json();
    },
    enabled: debouncedSearch.length >= 2,
  });

  // Handle Photo Selection from File Input
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImageUrl(dataUrl);
      setAiSuggestions([]);
    };
    reader.readAsDataURL(file);
  };

  // Handle AI Vision Analysis (Optional)
  const handleAnalyzeWithAi = async () => {
    if (!imageUrl) return;

    setIsAnalyzingAi(true);
    try {
      const res = await fetch("/api/ai/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageUrl,
          section: canonicalSectionId,
          prompt: "حلل صورة العطل الفني للمركبة واقترح وصفاً دقيقاً ومختصراً للعطل باللغة العربية.",
        }),
      });

      if (!res.ok) {
        throw new Error("فشل الاتصال بخدمة التحليل الذكي");
      }

      const data = await res.json();
      const list: string[] = [];

      if (data.suggestions && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        data.suggestions.forEach((s: string) => {
          if (s && !list.includes(s)) list.push(s);
        });
      } else if (data.description || data.text) {
        list.push(data.description || data.text);
      }

      if (list.length === 0) {
        list.push("يوجد ملاحظة فنية تحتاج للمعاينة");
      }

      setAiSuggestions(list);

      toast({
        title: "✨ تم تحليل الصورة",
        description: `تم استخراج ${list.length} اقتراحات فنية، اختر الأنسب منها.`,
      });
    } catch (err: any) {
      console.warn("AI analysis error:", err);
      toast({
        title: "تنبيه",
        description: "تعذر التحليل التلقائي للصورة حالياً. يمكنك كتابة الوصف يدوياً.",
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
        sectionId: canonicalSectionId,
        notes: cleanText,
        imageUrl,
      });

      toast({
        title: editItem ? "تم حفظ التعديلات بنجاح" : "✨ تم إضافة العطل بنجاح",
        description: `تم تسجيل العطل تحت قسم: ${sectionDef.label}`,
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
            {editItem ? `تعديل عطل — ${sectionDef.label}` : `إضافة عطل — ${sectionDef.label}`}
          </DialogTitle>

          {/* ── Modal Header (Strict Monochrome) ── */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white shadow-inner">
                <PhosphorIcon name={sectionDef.iconName as any} weight="bold" size={22} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg text-white">
                  {editItem ? "تعديل الملاحظة الفنية" : "إضافة عطل فني"}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span>القسم المعتمد:</span>
                  <span className="font-bold text-white bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-700">
                    {sectionDef.label}
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono" dir="ltr">
                    ({sectionDef.labelEn})
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-3 text-right" dir="rtl">
            {/* ── 1. Fault Library Search (Search-First on 9,000+ faults) ── */}
            <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-zinc-400" />
                  <span>البحث في مكتبة الأعطال (9,000+ عطل)</span>
                </span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer"
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
                  placeholder="ابحث مثل: تهريب زيت، رش، خدش، كود، صوت، ترشيح، لحام..."
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-white rounded-xl py-2.5 px-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                />
                {isSearchLoading && (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                  </div>
                )}
              </div>

              {/* Live Search Suggestions Dropdown */}
              {debouncedSearch.length >= 2 && (
                <div className="max-h-52 overflow-y-auto space-y-1.5 pt-1 scrollbar-thin scrollbar-thumb-zinc-700">
                  {searchResults && searchResults.length > 0 ? (
                    searchResults.map((item: any, idx: number) => (
                      <button
                        key={item.id || idx}
                        type="button"
                        onClick={() => {
                          setFaultText(item.faultName || item.description || "");
                          setSearchQuery("");
                        }}
                        className="w-full p-2.5 text-right bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-xl transition-all flex items-center justify-between gap-2 cursor-pointer group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm font-bold text-white group-hover:text-white transition-colors truncate">
                            {item.faultName}
                          </div>
                          {item.description && item.description !== item.faultName && (
                            <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                              {item.description}
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-white shrink-0 bg-zinc-800 group-hover:bg-white group-hover:text-black px-2.5 py-1 rounded-lg border border-zinc-700 transition-colors">
                          + اختيار
                        </span>
                      </button>
                    ))
                  ) : !isSearchLoading ? (
                    <div className="text-center py-3 text-xs text-zinc-400 bg-zinc-950/60 rounded-xl border border-zinc-800">
                      لا توجد نتائج مطابقة في المكتبة. يمكنك كتابة العطل يدويًا في الأسفل.
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* ── 2. Fault Description / Notes (Spacious Textarea) ── */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-200">
                  وصف العطل أو الملاحظة الفنية: <span className="text-zinc-400">*</span>
                </label>
                {faultText && (
                  <button
                    type="button"
                    onClick={() => setFaultText("")}
                    className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer"
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
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded-2xl p-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none transition-all resize-y leading-relaxed shadow-inner"
                required
              />
            </div>

            {/* ── 3. Photo Capture & Upload (Camera / Upload / AI) ── */}
            <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-zinc-400" />
                  <span>صورة العطل التوثيقية (اختياري)</span>
                </label>
                {imageUrl && (
                  <span className="text-[10px] bg-zinc-800 text-zinc-200 border border-zinc-700 px-2 py-0.5 rounded-full font-bold">
                    ✓ تم إرفاق صورة
                  </span>
                )}
              </div>

              {!imageUrl ? (
                /* Capture & Upload Buttons */
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="py-3 px-3 bg-zinc-900 hover:bg-zinc-800 active:scale-95 border border-zinc-700 rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-white transition-all cursor-pointer shadow-sm"
                  >
                    <Camera className="w-4 h-4 text-zinc-300" />
                    <span>📸 التقاط صورة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-3 px-3 bg-zinc-900 hover:bg-zinc-800 active:scale-95 border border-zinc-700 rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-white transition-all cursor-pointer shadow-sm"
                  >
                    <Upload className="w-4 h-4 text-zinc-300" />
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
                /* Photo Preview & Actions */
                <div className="space-y-3">
                  <div className="relative w-full aspect-video max-h-56 bg-black rounded-2xl overflow-hidden border border-zinc-700 shadow-md flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt="معاينة صورة العطل"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Photo Actions Row (Strict Monochrome) */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isAnalyzingAi}
                      onClick={handleAnalyzeWithAi}
                      className="flex-1 py-2.5 px-3 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      {isAnalyzingAi ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>جارٍ التحليل بالذكاء الاصطناعي...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>🔍 تحليل الصورة بالذكاء الاصطناعي</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold flex items-center gap-1 border border-zinc-700 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>إعادة التقاط</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl(null);
                        setAiSuggestions([]);
                      }}
                      className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1 border border-zinc-800 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>

                  {/* Multiple AI Vision Suggestions (Optional Helper) */}
                  {aiSuggestions.length > 0 && (
                    <div className="bg-zinc-900 border border-zinc-700 p-3.5 rounded-2xl space-y-2.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-xs font-bold text-white border-b border-zinc-800 pb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-zinc-300" />
                          <span>اقتراحات الذكاء الاصطناعي ({aiSuggestions.length}):</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setAiSuggestions([])}
                          className="text-[11px] text-zinc-400 hover:text-white"
                        >
                          إغلاق
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {aiSuggestions.map((suggestion, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between gap-2 text-xs"
                          >
                            <p className="text-zinc-200 leading-relaxed min-w-0 flex-1">
                              <span className="font-bold text-zinc-400 ml-1">#{sIdx + 1}</span>
                              {suggestion}
                            </p>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setFaultText(suggestion);
                                  setAiSuggestions([]);
                                }}
                                className="py-1 px-2.5 bg-white hover:bg-zinc-200 text-black font-bold rounded-lg transition-all cursor-pointer"
                              >
                                ✓ استخدام
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFaultText((prev) => (prev ? `${prev} - ${suggestion}` : suggestion));
                                  setAiSuggestions([]);
                                }}
                                className="py-1 px-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-all cursor-pointer"
                              >
                                دمج
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── 4. Modal Footer Actions (Save Fault) ── */}
            <div className="pt-3 flex gap-2.5 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="py-3 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-2xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !faultText.trim()}
                className="flex-1 py-3 px-5 bg-white hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{editItem ? "حفظ التعديلات" : `حفظ العطل في ${sectionDef.label}`}</span>
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
          setAiSuggestions([]);
        }}
        title={`تصوير عطل في قسم: ${sectionDef.label}`}
      />
    </>
  );
};
