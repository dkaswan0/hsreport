import { CameraOverlayModal } from "@/components/camera-overlay-modal";
import React, { useState } from "react";
import { Camera, Upload, X, Eye, Maximize2, RefreshCw } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  VEHICLE_PHOTO_SECTIONS,
  VehiclePhotoKey,
  VehiclePhotoSectionDef,
  resolveVehiclePhotoByKey,
} from "@shared/vehicle-photos";
import { cn } from "@/lib/utils";

export interface VehiclePhotosGridProps {
  inspection?: any;
  photos?: Record<VehiclePhotoKey, string | null>;
  onPhotoChange?: (key: VehiclePhotoKey, fileOrDataUrl: string | null) => void;
  isEditable?: boolean;
  onReprocessPhoto?: (key: VehiclePhotoKey) => void;
  onTogglePhotoMode?: (key: VehiclePhotoKey) => void;
  isProcessing?: boolean;
  className?: string;
  showStudioControls?: boolean;
  layoutMode?: "stacked" | "grid";
}

export function VehiclePhotosGrid({
  inspection,
  photos,
  onPhotoChange,
  isEditable = false,
  onReprocessPhoto,
  onTogglePhotoMode,
  isProcessing = false,
  className,
  showStudioControls = false,
  layoutMode = "stacked",
}: VehiclePhotosGridProps) {
  const [activeCameraSlot, setActiveCameraSlot] = useState<VehiclePhotoKey | null>(null);
  const [selectedZoomPhoto, setSelectedZoomPhoto] = useState<{
    url: string;
    label: string;
    description: string;
  } | null>(null);

  const [imageOrientations, setImageOrientations] = useState<Record<string, "landscape" | "portrait" | "square">>({});

  const getSectionDef = (key: VehiclePhotoKey): VehiclePhotoSectionDef => {
    return VEHICLE_PHOTO_SECTIONS.find((s) => s.key === key)!;
  };

  const getPhotoUrl = (key: VehiclePhotoKey): string | null => {
    if (photos && photos[key] !== undefined) {
      return photos[key];
    }
    if (inspection) {
      return resolveVehiclePhotoByKey(inspection, key);
    }
    return null;
  };

  const getOriginalUrl = (key: VehiclePhotoKey): string | null => {
    if (inspection) {
      return resolveVehiclePhotoByKey(inspection, key, true);
    }
    return null;
  };

  const isProcessed = (key: VehiclePhotoKey): boolean => {
    if (!inspection?.vehiclePhotosMeta) return false;
    const meta = inspection.vehiclePhotosMeta[key];
    return meta?.activeMode === "processed" && Boolean(meta?.processedUrl);
  };

  const handleImageLoad = (key: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      const ratio = img.naturalWidth / img.naturalHeight;
      let orientation: "landscape" | "portrait" | "square" = "landscape";
      if (ratio < 0.88) {
        orientation = "portrait";
      } else if (ratio >= 0.88 && ratio <= 1.12) {
        orientation = "square";
      } else {
        orientation = "landscape";
      }
      setImageOrientations((prev) => ({ ...prev, [key]: orientation }));
    }
  };

  const handleFileInput = (key: VehiclePhotoKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result && onPhotoChange) {
        onPhotoChange(key, result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const renderPhotoCard = (key: VehiclePhotoKey) => {
    const section = getSectionDef(key);
    const photoUrl = getPhotoUrl(key);
    const originalUrl = getOriginalUrl(key);
    const isStudioActive = isProcessed(key);
    const orientation = imageOrientations[key] || "landscape";

    return (
      <div
        key={key}
        className="w-full bg-white rounded-2xl sm:rounded-3xl border border-zinc-200/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden relative flex flex-col group select-none"
        data-testid={`card-vehicle-photo-${key}`}
      >
        {/* ── 1. Clean Title Badge (Top-Right Pill, strictly NO stars/sparkles) ── */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 pointer-events-none">
          <div className="bg-zinc-950/95 backdrop-blur-sm text-white text-xs sm:text-sm font-black px-3.5 sm:px-4 py-1.5 rounded-xl sm:rounded-2xl font-arabic shadow-lg border border-zinc-800 tracking-wide">
            <span>{section.label}</span>
          </div>
        </div>

        {/* ── 2. Studio Controls (ONLY in Examiner Studio Editing Mode, NEVER in Public Report) ── */}
        {isEditable && showStudioControls && photoUrl && (
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
            {onTogglePhotoMode && originalUrl && originalUrl !== photoUrl && (
              <button
                type="button"
                onClick={() => onTogglePhotoMode(key)}
                className="px-2.5 py-1 bg-zinc-950/90 text-white text-[11px] font-bold rounded-xl shadow-md border border-zinc-700 font-arabic hover:bg-black transition-colors"
                title="التبديل بين الأصلية والمحسنة"
              >
                <span>{isStudioActive ? "للأصلية" : "للمحسنة"}</span>
              </button>
            )}
            {onReprocessPhoto && (
              <button
                type="button"
                onClick={() => onReprocessPhoto(key)}
                disabled={isProcessing}
                className="p-1.5 bg-zinc-950/90 text-white rounded-xl shadow-md border border-zinc-700 hover:bg-black disabled:opacity-50 transition-colors"
                title="إعادة المعالجة"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isProcessing && "animate-spin")} />
              </button>
            )}
          </div>
        )}

        {/* ── 3. Edge-to-Edge Smart Photo Frame ── */}
        <div
          className={cn(
            "relative w-full bg-zinc-100/70 overflow-hidden flex items-center justify-center transition-all",
            orientation === "landscape"
              ? "aspect-[16/10] sm:aspect-[16/9] min-h-[220px] sm:min-h-[280px] md:min-h-[340px]"
              : orientation === "portrait"
              ? "aspect-[4/5] sm:aspect-[3/4] max-h-[480px]"
              : "aspect-square max-h-[380px]"
          )}
        >
          {photoUrl ? (
            <div
              className="relative w-full h-full flex items-center justify-center cursor-pointer overflow-hidden"
              onClick={() =>
                setSelectedZoomPhoto({
                  url: photoUrl,
                  label: section.label,
                  description: section.description,
                })
              }
            >
              {/* Background ambient fill for non-standard aspect ratios to eliminate harsh white borders */}
              <div
                className="absolute inset-0 bg-cover bg-center blur-2xl opacity-20 scale-110 pointer-events-none"
                style={{ backgroundImage: `url(${photoUrl})` }}
              />

              {/* Main Crisp Image */}
              <img
                src={photoUrl}
                alt={section.label}
                onLoad={(e) => handleImageLoad(key, e)}
                className={cn(
                  "relative z-10 w-full h-full select-none transition-transform duration-300 group-hover:scale-[1.015]",
                  orientation === "landscape"
                    ? "object-cover sm:object-contain object-center"
                    : "object-contain"
                )}
                loading="lazy"
              />

              {/* Hover Zoom Indicator */}
              <div className="absolute inset-0 z-20 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <div className="bg-white/95 text-zinc-950 px-3.5 py-1.5 rounded-full text-xs font-bold font-arabic shadow-xl flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-zinc-900" />
                  <span>تكبير الصورة</span>
                </div>
              </div>

              {/* Editable Delete Action */}
              {isEditable && onPhotoChange && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPhotoChange(key, null);
                  }}
                  className="absolute bottom-3 left-3 z-30 p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
                  title="حذف الصورة"
                  data-testid={`btn-delete-${key}`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : isEditable ? (
            /* Upload Buttons in Editable Mode */
            <div className="w-full h-full flex items-center justify-center p-4">
              <div className="flex gap-2.5 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => setActiveCameraSlot(key)}
                  className="flex-1 flex flex-col items-center justify-center h-24 sm:h-28 border-2 border-dashed border-zinc-800 rounded-2xl cursor-pointer bg-zinc-950 text-white hover:bg-black transition-all p-2 text-center shadow-md active:scale-95"
                  title="فتح الكاميرا مع دليل الإطار الشفاف"
                  data-testid={`btn-camera-overlay-${key}`}
                >
                  <Camera className="w-5 h-5 text-amber-400 mb-1" />
                  <span className="text-[11px] font-bold font-arabic">كاميرا مع إطار</span>
                </button>

                <label className="flex-1 flex flex-col items-center justify-center h-24 sm:h-28 border-2 border-dashed border-zinc-300 rounded-2xl cursor-pointer bg-white hover:bg-zinc-50 text-zinc-800 transition-all p-2 text-center shadow-xs active:scale-95">
                  <Upload className="w-5 h-5 text-zinc-600 mb-1" />
                  <span className="text-[11px] font-bold font-arabic">من المعرض</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileInput(key, e)}
                    data-testid={`input-gallery-${key}`}
                  />
                </label>
              </div>
            </div>
          ) : (
            /* Empty State in View Mode */
            <div className="text-center p-6 text-zinc-400">
              <Camera className="w-8 h-8 mx-auto mb-1.5 opacity-30 text-zinc-400" />
              <p className="text-xs font-arabic text-zinc-400">لا توجد صورة</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Order matching Reference Image exactly:
  // 1. السيارة الرئيسية (Hero)
  // 2. الجانب الأيمن
  // 3. الجانب الأيسر
  // 4. الواجهة الأمامية
  // 5. الواجهة الخلفية
  const photoKeysOrder: VehiclePhotoKey[] = [
    "main_vehicle",
    "right_side",
    "left_side",
    "front_view",
    "rear_view",
  ];

  return (
    <div className={cn("w-full space-y-3.5 sm:space-y-4 md:space-y-5", className)} dir="rtl">
      {photoKeysOrder.map((key) => renderPhotoCard(key))}

      {/* High-Resolution Zoom Modal */}
      <Dialog
        open={Boolean(selectedZoomPhoto)}
        onOpenChange={(open) => !open && setSelectedZoomPhoto(null)}
      >
        <DialogContent className="max-w-4xl bg-zinc-950/98 border-zinc-800 text-white p-3 sm:p-4 font-arabic">
          {selectedZoomPhoto && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedZoomPhoto.label}</h3>
                  {selectedZoomPhoto.description && (
                    <p className="text-xs text-zinc-400">{selectedZoomPhoto.description}</p>
                  )}
                </div>
              </div>
              <div className="relative max-h-[78vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black p-1">
                <img
                  src={selectedZoomPhoto.url}
                  alt={selectedZoomPhoto.label}
                  className="max-h-[74vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Live Camera Silhouette Framing Overlay */}
      <CameraOverlayModal
        isOpen={Boolean(activeCameraSlot)}
        onClose={() => setActiveCameraSlot(null)}
        photoKey={activeCameraSlot}
        onCapture={(key, dataUrl) => {
          if (onPhotoChange) {
            onPhotoChange(key, dataUrl);
          }
        }}
      />
    </div>
  );
}
