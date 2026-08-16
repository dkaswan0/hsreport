import React, { useState, useRef, useMemo } from "react";
import { PhosphorIcon } from "@/components/phosphor-icon";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useUpdateInspection } from "@/hooks/use-inspections";
import type { Inspection, InspectionMediaItem } from "@shared/schema";

export interface ReportMediaManagerProps {
  inspection?: Inspection;
  videoUrl?: string | null;
  onVideoChange?: (url: string | null) => void;
  mediaGallery?: InspectionMediaItem[];
  onMediaGalleryChange?: (items: InspectionMediaItem[]) => void;
  className?: string;
}

// Quick preset names for inspectors in Arabic
const PRESET_PHOTO_NAMES = [
  "صورة الواجهة الأمامية",
  "صورة الجانب الأيمن كامل",
  "صورة الخلفية والشنطة",
  "صورة الجانب الأيسر كامل",
  "صورة السقف",
  "صورة حوض المحرك",
  "صورة المقصورة والفرش الداخلي",
  "صورة المقاعد الخلفية",
  "صورة الشاصي وأسفل المركبة",
  "صورة الإطار الأمامي يمين",
  "صورة الإطار الأمامي يسار",
  "صورة الإطار الخلفي يمين",
  "صورة الإطار الخلفي يسار",
  "صورة فتحة السقف",
  "صورة لوحة المفاتيح والكونسول",
];

// Helper to compress image in browser
async function compressImageFile(file: File, maxWidth = 1800, quality = 0.88): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// Helper to upload media file to backend storage (/api/upload-media)
async function uploadMediaToStorage(base64Data: string, type: "image" | "video", filename?: string): Promise<string> {
  try {
    const res = await fetch("/api/upload-media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64: base64Data, type, filename }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.url) return data.url;
    }
  } catch (err) {
    console.warn("Storage upload warning, fallback to data url:", err);
  }
  return base64Data;
}

export const ReportMediaManager: React.FC<ReportMediaManagerProps> = ({
  inspection,
  videoUrl: controlledVideoUrl,
  onVideoChange,
  mediaGallery: controlledMediaGallery,
  onMediaGalleryChange,
  className,
}) => {
  const { toast } = useToast();
  const updateInspection = useUpdateInspection();

  const [isOpen, setIsOpen] = useState(true);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  // For Single Photo addition dialog / rename
  const [pendingPhotoUrl, setPendingPhotoUrl] = useState<string | null>(null);
  const [pendingPhotoName, setPendingPhotoName] = useState<string>("");
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);

  // For Lightbox Zoom Preview
  const [zoomPhoto, setZoomPhoto] = useState<{ url: string; name: string } | null>(null);

  // For In-place Edit Name
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState<string>("");

  // For Replacing a specific photo
  const [replacingItemId, setReplacingItemId] = useState<string | null>(null);

  // Refs for camera and file pickers
  const videoCameraInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const photoCameraInputRef = useRef<HTMLInputElement>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const replacePhotoInputRef = useRef<HTMLInputElement>(null);

  // Controlled vs Inspection mode determination
  const isControlled = onMediaGalleryChange !== undefined || onVideoChange !== undefined;

  const currentVideoUrl = useMemo(() => {
    if (controlledVideoUrl !== undefined) return controlledVideoUrl;
    if (inspection) return (inspection as any).videoUrl || null;
    return null;
  }, [controlledVideoUrl, inspection]);

  const currentGallery: InspectionMediaItem[] = useMemo(() => {
    let raw: any[] = [];
    if (controlledMediaGallery !== undefined) {
      raw = controlledMediaGallery;
    } else if (inspection) {
      raw = (inspection as any).mediaGallery || [];
    }
    if (Array.isArray(raw)) {
      return [...raw].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return [];
  }, [controlledMediaGallery, inspection]);

  // Save gallery helper
  const saveMediaGallery = (updatedList: InspectionMediaItem[], successMessage?: string) => {
    // Re-index sortOrder sequentially starting at 1
    const normalized: InspectionMediaItem[] = updatedList.map((item, idx) => ({
      ...item,
      sortOrder: idx + 1,
      inspectionId: inspection?.id,
    }));

    if (onMediaGalleryChange) {
      onMediaGalleryChange(normalized);
      if (successMessage) {
        toast({ title: "تم التحديث", description: successMessage });
      }
    }

    if (inspection?.id) {
      updateInspection.mutate(
        {
          id: inspection.id,
          mediaGallery: normalized,
        } as any,
        {
          onSuccess: () => {
            if (successMessage && !onMediaGalleryChange) {
              toast({ title: "تم الحفظ بنجاح", description: successMessage });
            }
          },
          onError: (err: any) => {
            toast({
              title: "خطأ في الحفظ",
              description: err?.message || "تعذر حفظ الوسائط في قاعدة البيانات",
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  // Video Save helper
  const saveVideoUrl = (url: string | null, successMessage?: string) => {
    if (onVideoChange) {
      onVideoChange(url);
      if (successMessage) {
        toast({ title: "تم التحديث", description: successMessage });
      }
    }

    if (inspection?.id) {
      updateInspection.mutate(
        {
          id: inspection.id,
          videoUrl: url,
        } as any,
        {
          onSuccess: () => {
            if (successMessage && !onVideoChange) {
              toast({ title: "تم الحفظ", description: successMessage });
            }
          },
          onError: (err: any) => {
            toast({
              title: "خطأ في حفظ الفيديو",
              description: err?.message || "تعذر حفظ الفيديو",
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  // Video Upload Handlers
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 150 * 1024 * 1024) {
      toast({
        title: "حجم الفيديو كبير",
        description: "يرجى اختيار فيديو بحجم أقل من 150 ميغابايت",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingVideo(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const videoDataUrl = event.target?.result as string;
      try {
        const permanentUrl = await uploadMediaToStorage(videoDataUrl, "video", file.name);
        saveVideoUrl(permanentUrl, "تم حفظ ورفع فيديو الفحص بنجاح (العنصر رقم 0)");
      } catch (err: any) {
        toast({
          title: "خطأ في رفع الفيديو",
          description: err?.message || "تعذر رفع الفيديو إلى التخزين",
          variant: "destructive",
        });
      } finally {
        setIsUploadingVideo(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveVideo = () => {
    if (!confirm("هل أنت متأكد من حذف فيديو الفحص؟")) return;
    saveVideoUrl(null, "تم حذف الفيديو بنجاح");
  };

  // Single Photo Camera/File Handlers
  const handleSinglePhotoCaptured = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file);
      setPendingPhotoUrl(compressed);
      const nextNum = currentGallery.length + 1;
      setPendingPhotoName(`صورة ${nextNum}`);
      setIsNameDialogOpen(true);
    } catch (err: any) {
      toast({ title: "خطأ في قراءة الصورة", description: err?.message, variant: "destructive" });
    }
    e.target.value = "";
  };

  const handleConfirmAddPhoto = async () => {
    if (!pendingPhotoUrl) return;

    const photoToUpload = pendingPhotoUrl;
    const finalName = pendingPhotoName.trim() || `صورة ${currentGallery.length + 1}`;
    setPendingPhotoUrl(null);
    setPendingPhotoName("");
    setIsNameDialogOpen(false);

    try {
      const permanentUrl = await uploadMediaToStorage(photoToUpload, "image", `${finalName}.jpg`);
      const newItem: InspectionMediaItem = {
        id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: "image",
        url: permanentUrl,
        thumbnailUrl: permanentUrl,
        name: finalName,
        sortOrder: currentGallery.length + 1,
        inspectionId: inspection?.id,
      };

      saveMediaGallery([...currentGallery, newItem], `تمت إضافة ${newItem.name}`);
    } catch (err: any) {
      toast({ title: "خطأ في حفظ الصورة", description: err?.message, variant: "destructive" });
    }
  };

  // Bulk Photos Multi-Select Handler
  const handleBulkPhotosSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhotos(true);
    try {
      const newItems: InspectionMediaItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await compressImageFile(file);
        const itemNumber = currentGallery.length + i + 1;
        const permanentUrl = await uploadMediaToStorage(compressed, "image", `photo_${itemNumber}.jpg`);

        newItems.push({
          id: `media-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
          type: "image",
          url: permanentUrl,
          thumbnailUrl: permanentUrl,
          name: `صورة ${itemNumber}`,
          sortOrder: itemNumber,
          inspectionId: inspection?.id,
        });
      }

      saveMediaGallery([...currentGallery, ...newItems], `تمت إضافة ${newItems.length} صورة للمعرض`);
    } catch (err: any) {
      toast({ title: "خطأ في إضافة الصور", description: err?.message, variant: "destructive" });
    } finally {
      setIsUploadingPhotos(false);
      e.target.value = "";
    }
  };

  // Replace a specific photo
  const handleReplacePhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingItemId) return;

    try {
      const compressed = await compressImageFile(file);
      const permanentUrl = await uploadMediaToStorage(compressed, "image", file.name);
      const updated = currentGallery.map((item) =>
        item.id === replacingItemId ? { ...item, url: permanentUrl, thumbnailUrl: permanentUrl } : item
      );
      saveMediaGallery(updated, "تم استبدال الصورة بنجاح");
    } catch (err: any) {
      toast({ title: "خطأ في استبدال الصورة", description: err?.message, variant: "destructive" });
    } finally {
      setReplacingItemId(null);
      e.target.value = "";
    }
  };

  // Reorder Handlers
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const items = [...currentGallery];
    const temp = items[index - 1];
    items[index - 1] = items[index];
    items[index] = temp;
    saveMediaGallery(items, "تم تحديث ترتيب الصور");
  };

  const handleMoveDown = (index: number) => {
    if (index >= currentGallery.length - 1) return;
    const items = [...currentGallery];
    const temp = items[index + 1];
    items[index + 1] = items[index];
    items[index] = temp;
    saveMediaGallery(items, "تم تحديث ترتيب الصور");
  };

  // Delete Item Handler
  const handleDeleteItem = (itemId: string, itemName: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${itemName}"؟`)) return;
    const filtered = currentGallery.filter((item) => item.id !== itemId);
    saveMediaGallery(filtered, "تم حذف الصورة من المعرض");
  };

  // Inline Rename Handlers
  const handleSaveRename = (itemId: string) => {
    if (!editingItemName.trim()) return;
    const updated = currentGallery.map((item) =>
      item.id === itemId ? { ...item, name: editingItemName.trim() } : item
    );
    saveMediaGallery(updated, "تم تغيير اسم الصورة");
    setEditingItemId(null);
    setEditingItemName("");
  };

  return (
    <div
      className={cn(
        "bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm mb-6",
        className
      )}
      data-testid="report-media-manager-section"
      dir="rtl"
    >
      {/* ── Section Header ── */}
      <div
        className="bg-zinc-950 px-4 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between cursor-pointer select-none text-white border-b border-zinc-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shrink-0 shadow-inner">
            <PhosphorIcon name="film-strip" weight="bold" size={22} className="text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg font-arabic flex items-center gap-2 text-white">
              <span>1. صور وفيديو التقرير</span>
              <span className="text-xs font-normal text-zinc-400 font-mono hidden sm:inline">
                | Unified Media & Video Gallery
              </span>
            </h3>
            <p className="text-xs text-zinc-400 font-arabic">
              إضافة فيديو الفحص والصور العامة التي تظهر في معرض التقرير بأعلى صفحة العميل
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Counter */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            {currentVideoUrl && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <PhosphorIcon name="play" weight="fill" size={10} />
                <span>1 فيديو</span>
              </span>
            )}
            <span className="bg-zinc-900 border border-zinc-800 text-zinc-200 px-3 py-1 rounded-full text-xs font-bold">
              {currentGallery.length} صورة
            </span>
          </div>

          <button className="text-zinc-400 hover:text-white p-1 cursor-pointer">
            <PhosphorIcon name={isOpen ? "caret-down" : "caret-left"} weight="bold" size={20} />
          </button>
        </div>
      </div>

      {/* ── Section Content ── */}
      {isOpen && (
        <div className="p-4 sm:p-6 bg-zinc-50/50 space-y-6">
          {/* Hidden File / Camera Inputs */}
          <input
            ref={videoCameraInputRef}
            type="file"
            accept="video/*"
            capture="environment"
            className="hidden"
            onChange={handleVideoSelect}
          />
          <input
            ref={videoFileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleVideoSelect}
          />
          <input
            ref={photoCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleSinglePhotoCaptured}
          />
          <input
            ref={photoFileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleBulkPhotosSelect}
          />
          <input
            ref={replacePhotoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleReplacePhotoFile}
          />

          {/* ── 1. قسم فيديو الفحص (+ إضافة فيديو) ── */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0 font-bold font-mono text-sm">
                  #0
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-zinc-950 font-arabic flex items-center gap-1.5">
                    <PhosphorIcon name="video-camera" weight="bold" size={18} className="text-amber-600" />
                    <span>فيديو التقرير (Video Element #0)</span>
                  </h4>
                  <p className="text-xs text-zinc-500 font-arabic">
                    يظهر كأول عنصر في المعرض بأعلى التقرير بدون تشغيل تلقائي
                  </p>
                </div>
              </div>

              {/* Video Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Shoot Video via Camera */}
                <button
                  type="button"
                  onClick={() => videoCameraInputRef.current?.click()}
                  disabled={isUploadingVideo}
                  className="px-3.5 py-2 bg-zinc-950 hover:bg-black text-white rounded-xl text-xs font-bold font-arabic flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                  data-testid="btn-camera-video"
                >
                  <PhosphorIcon
                    name={isUploadingVideo ? "spinner-gap" : "camera"}
                    className={isUploadingVideo ? "animate-spin" : ""}
                    weight="bold"
                    size={15}
                  />
                  <span>{isUploadingVideo ? "جاري الرفع..." : "تصوير فيديو بالكاميرا"}</span>
                </button>

                {/* Choose Video File */}
                <button
                  type="button"
                  onClick={() => videoFileInputRef.current?.click()}
                  disabled={isUploadingVideo}
                  className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-300 rounded-xl text-xs font-bold font-arabic flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  data-testid="btn-upload-video-file"
                >
                  <PhosphorIcon name="folder-open" weight="bold" size={15} />
                  <span>اختيار ملف فيديو</span>
                </button>
              </div>
            </div>

            {/* Video Preview Card (if present) */}
            {currentVideoUrl ? (
              <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-3 sm:p-4 text-white flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-full sm:w-72 aspect-video rounded-xl bg-black overflow-hidden border border-zinc-800 shrink-0">
                  <video
                    src={currentVideoUrl}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-1.5 text-right w-full">
                  <div className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-md text-xs font-bold">
                    <PhosphorIcon name="check-circle" weight="fill" size={13} />
                    <span>فيديو معتمد وجاهز للتقرير</span>
                  </div>
                  <h5 className="font-bold text-sm sm:text-base text-white font-arabic">فيديو الفحص الشامل للمركبة</h5>
                  <p className="text-xs text-zinc-400 font-arabic">
                    الترتيب: العنصر رقم 0 (يظهر دائماً كأول عنصر في المعرض)
                  </p>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => videoCameraInputRef.current?.click()}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-bold font-arabic flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <PhosphorIcon name="arrows-clockwise" weight="bold" size={13} />
                      <span>إعادة التصوير / استبدال</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRemoveVideo}
                      className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded-lg text-xs font-bold font-arabic flex items-center gap-1 transition-colors cursor-pointer"
                      data-testid="btn-delete-video"
                    >
                      <PhosphorIcon name="trash" weight="bold" size={13} />
                      <span>حذف الفيديو</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl border-2 border-dashed border-zinc-200 text-center bg-zinc-50/50 space-y-2">
                <div className="w-10 h-10 rounded-full bg-zinc-200 text-zinc-500 flex items-center justify-center mx-auto">
                  <PhosphorIcon name="video-camera" weight="bold" size={20} />
                </div>
                <p className="text-xs font-bold text-zinc-700 font-arabic">لم يتم تصوير أو إرفاق فيديو بعد</p>
                <p className="text-[11px] text-zinc-400 font-arabic">
                  يمكنك تصوير فيديو للمركبة عبر زر الكاميرا ليظهر مباشرة كأول عنصر في تقرير العميل
                </p>
              </div>
            )}
          </div>

          {/* ── 2. قسم صور التقرير (+ إضافة صورة / إضافة صور دفعة واحدة) ── */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3">
              <div>
                <h4 className="font-bold text-sm sm:text-base text-zinc-950 font-arabic flex items-center gap-1.5">
                  <PhosphorIcon name="images" weight="bold" size={18} className="text-zinc-800" />
                  <span>صور التقرير العامة (Media List)</span>
                </h4>
                <p className="text-xs text-zinc-500 font-arabic">
                  قائمة موحدة لجميع صور الفحص (تدعم 70 إلى أكثر من 100 صورة) بتسلسل الحفظ
                </p>
              </div>

              {/* Photo Action Buttons */}
              <div className="flex items-center gap-2">
                {/* 1. Capture from Camera */}
                <button
                  type="button"
                  onClick={() => photoCameraInputRef.current?.click()}
                  className="px-3.5 py-2 bg-zinc-950 hover:bg-black text-white rounded-xl text-xs font-bold font-arabic flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                  data-testid="btn-camera-single-photo"
                >
                  <PhosphorIcon name="camera" weight="bold" size={15} />
                  <span>+ تصوير بالكاميرا</span>
                </button>

                {/* 2. Choose Multiple Photos from Gallery */}
                <button
                  type="button"
                  onClick={() => photoFileInputRef.current?.click()}
                  disabled={isUploadingPhotos}
                  className="px-3.5 py-2 bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-950 rounded-xl text-xs font-bold font-arabic flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                  data-testid="btn-upload-multiple-photos"
                >
                  <PhosphorIcon
                    name={isUploadingPhotos ? "spinner-gap" : "folder-plus"}
                    className={isUploadingPhotos ? "animate-spin" : ""}
                    weight="bold"
                    size={15}
                  />
                  <span>{isUploadingPhotos ? "جاري الإضافة والحفظ..." : "+ اختيار مجموعة صور"}</span>
                </button>
              </div>
            </div>

            {/* Photos Grid List */}
            {currentGallery.length === 0 ? (
              <div className="p-8 rounded-2xl border-2 border-dashed border-zinc-200 text-center bg-zinc-50/50 space-y-2">
                <div className="w-12 h-12 rounded-full bg-zinc-200 text-zinc-500 flex items-center justify-center mx-auto">
                  <PhosphorIcon name="camera" weight="bold" size={24} />
                </div>
                <h5 className="text-sm font-bold text-zinc-800 font-arabic">لا توجد صور في المعرض الموحد حالياً</h5>
                <p className="text-xs text-zinc-400 font-arabic max-w-md mx-auto">
                  استخدم زر "+ تصوير بالكاميرا" لالتقاط صور الفحص وتسميتها، أو زر "+ اختيار مجموعة صور" لرفع 10، 20، 50، 70+ صورة دفعة واحدة
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                {currentGallery.map((item, idx) => {
                  const isEditingThis = editingItemId === item.id;

                  return (
                    <div
                      key={item.id || idx}
                      className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 flex flex-col justify-between shadow-xs group transition-transform duration-150 hover:shadow-md"
                      data-testid={`media-item-card-${idx}`}
                    >
                      {/* Image Thumbnail Container */}
                      <div
                        className="relative w-full aspect-[4/3] bg-black flex items-center justify-center overflow-hidden cursor-pointer"
                        onClick={() => setZoomPhoto({ url: item.url, name: item.name })}
                        title="انقر للمعاينة بحجم كبير"
                      >
                        <img
                          src={item.thumbnailUrl || item.url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />

                        {/* Top Overlays: Index Badge */}
                        <div className="absolute top-2 right-2 bg-black/85 backdrop-blur-xs text-white font-mono text-[11px] font-black px-2.5 py-0.5 rounded-lg border border-white/10 shadow-sm">
                          #{idx + 1}
                        </div>

                        {/* Top Overlays: Retake / Replace Quick Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReplacingItemId(item.id);
                            replacePhotoInputRef.current?.click();
                          }}
                          className="absolute top-2 left-2 p-1.5 bg-black/80 hover:bg-black text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-white/10 shadow-sm"
                          title="استبدال / إعادة التقاط الصورة"
                        >
                          <PhosphorIcon name="arrows-clockwise" weight="bold" size={13} />
                        </button>
                      </div>

                      {/* Info & Action Controls */}
                      <div className="p-3 bg-zinc-950 text-white space-y-2.5">
                        {/* Name or Rename Input */}
                        {isEditingThis ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editingItemName}
                              onChange={(e) => setEditingItemName(e.target.value)}
                              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white outline-none font-arabic"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveRename(item.id);
                                if (e.key === "Escape") setEditingItemId(null);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveRename(item.id)}
                              className="p-1.5 bg-white text-zinc-950 rounded-lg hover:bg-zinc-200 cursor-pointer shrink-0"
                              title="حفظ الاسم"
                            >
                              <PhosphorIcon name="check" weight="bold" size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold font-arabic text-zinc-200 truncate" title={item.name}>
                              {item.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItemId(item.id);
                                setEditingItemName(item.name);
                              }}
                              className="text-zinc-400 hover:text-white p-1 transition-colors cursor-pointer shrink-0"
                              title="تعديل اسم الصورة"
                            >
                              <PhosphorIcon name="pencil-simple" weight="bold" size={13} />
                            </button>
                          </div>
                        )}

                        {/* Order & Delete Buttons */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-zinc-800/80">
                          {/* Reorder Up/Down */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveUp(idx)}
                              disabled={idx === 0}
                              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-300 rounded-lg transition-colors cursor-pointer"
                              title="تحريك للأمام (تقديم الترتيب)"
                            >
                              <PhosphorIcon name="caret-right" weight="bold" size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveDown(idx)}
                              disabled={idx === currentGallery.length - 1}
                              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-300 rounded-lg transition-colors cursor-pointer"
                              title="تحريك للخلف (تأخير الترتيب)"
                            >
                              <PhosphorIcon name="caret-left" weight="bold" size={13} />
                            </button>
                          </div>

                          {/* Delete Photo Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            className="p-1.5 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="حذف الصورة"
                            data-testid={`btn-delete-media-${idx}`}
                          >
                            <PhosphorIcon name="trash" weight="bold" size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Dialog for Naming Captured Single Photo ── */}
      {isNameDialogOpen && pendingPhotoUrl && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
          onClick={() => setIsNameDialogOpen(false)}
          dir="rtl"
        >
          <div
            className="bg-zinc-950 text-white border border-zinc-800 rounded-3xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <PhosphorIcon name="camera" weight="bold" size={22} className="text-amber-400" />
                <h4 className="font-bold text-base sm:text-lg font-arabic">معاينة وتسمية صورة الفحص</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsNameDialogOpen(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
              >
                <PhosphorIcon name="x" weight="bold" size={20} />
              </button>
            </div>

            {/* Clear Large Photo Preview */}
            <div className="w-full aspect-[16/10] rounded-2xl bg-black overflow-hidden border border-zinc-800 flex items-center justify-center">
              <img src={pendingPhotoUrl} alt="Captured preview" className="w-full h-full object-contain" />
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 font-arabic block">
                اسم الصورة في التقرير:
              </label>
              <input
                type="text"
                value={pendingPhotoName}
                onChange={(e) => setPendingPhotoName(e.target.value)}
                placeholder="أدخل اسم الصورة (مثال: الصدام الأمامي)..."
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded-xl px-3.5 py-2.5 text-sm text-white outline-none font-arabic"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirmAddPhoto();
                }}
              />

              {/* Quick Preset Buttons */}
              <div className="pt-1">
                <span className="text-[11px] text-zinc-400 font-arabic block mb-1.5">أسماء مقترحة سريعة:</span>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {PRESET_PHOTO_NAMES.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setPendingPhotoName(name)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-arabic transition-colors cursor-pointer border",
                        pendingPhotoName === name
                          ? "bg-white text-zinc-950 border-white font-bold"
                          : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700"
                      )}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleConfirmAddPhoto}
                className="flex-1 py-3 bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl font-bold font-arabic text-sm transition-all shadow-md cursor-pointer active:scale-95"
                data-testid="btn-confirm-add-photo"
              >
                حفظ وإضافة للمعرض
              </button>
              <button
                type="button"
                onClick={() => setIsNameDialogOpen(false)}
                className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold font-arabic text-sm transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox Zoom Preview Modal for Large View ── */}
      {zoomPhoto && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-[999999] flex items-center justify-center p-4"
          onClick={() => setZoomPhoto(null)}
          dir="rtl"
        >
          <div
            className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col p-4 sm:p-6 shadow-2xl text-white space-y-3 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <PhosphorIcon name="image" weight="bold" size={20} className="text-zinc-300" />
                <h4 className="font-bold text-base font-arabic">{zoomPhoto.name}</h4>
              </div>
              <button
                type="button"
                onClick={() => setZoomPhoto(null)}
                className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
              >
                <PhosphorIcon name="x" weight="bold" size={20} />
              </button>
            </div>

            <div className="flex-1 min-h-0 bg-black/80 rounded-2xl overflow-hidden flex items-center justify-center p-2 border border-zinc-800">
              <img src={zoomPhoto.url} alt={zoomPhoto.name} className="max-w-full max-h-[72vh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
