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
  className?: string;
  layoutMode?: "stacked" | "grid";
}

interface ImageDimension {
  width: number;
  height: number;
  aspectRatio: number;
  orientation: "landscape" | "portrait" | "square" | "panoramic";
}

export function VehiclePhotosGrid({
  inspection,
  photos,
  onPhotoChange,
  isEditable = false,
  className,
  layoutMode = "stacked",
}: VehiclePhotosGridProps) {
  const [activeCameraSlot, setActiveCameraSlot] = useState<VehiclePhotoKey | null>(null);
  const [selectedZoomPhoto, setSelectedZoomPhoto] = useState<{
    url: string;
    label: string;
    description: string;
  } | null>(null);

  // Store smart detected dimensions for each photo key
  const [imageDimensions, setImageDimensions] = useState<Record<string, ImageDimension>>({});

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

  // Smart natural dimension handler
  const handleImageLoad = (key: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const aspectRatio = width / height;

      let orientation: "landscape" | "portrait" | "square" | "panoramic" = "landscape";
      if (aspectRatio > 1.8) {
        orientation = "panoramic";
      } else if (aspectRatio >= 1.15) {
        orientation = "landscape";
      } else if (aspectRatio <= 0.85) {
        orientation = "portrait";
      } else {
        orientation = "square";
      }

      setImageDimensions((prev) => ({
        ...prev,
        [key]: { width, height, aspectRatio, orientation },
      }));
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
    const dim = imageDimensions[key];
    const orientation = dim?.orientation || "landscape";

    return (
      <div
        key={key}
        className="w-full bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden relative flex flex-col group select-none"
        data-testid={`card-vehicle-photo-${key}`}
      >
        {/* ── 1. Clean Title Badge ── */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 pointer-events-none">
          <div className="bg-zinc-950/95 backdrop-blur-md text-white text-xs sm:text-sm font-black px-3.5 sm:px-4 py-1.5 rounded-xl sm:rounded-2xl font-arabic shadow-lg border border-zinc-800 tracking-wide">
            <span>{section.label}</span>
          </div>
        </div>

        {/* ── 2. Smart Responsive Image Display Container (No Rotation, No Stretching, No Distortion) ── */}
        <div
          className={cn(
            "relative w-full bg-zinc-900/5 overflow-hidden flex items-center justify-center transition-all duration-300",
            // For landscape photos (preferred): wide natural aspect ratio filling mobile width
            orientation === "landscape" && "aspect-[16/10] sm:aspect-[16/9] min-h-[220px] sm:min-h-[280px] md:min-h-[340px]",
            // For panoramic/super wide: 21:9 ratio
            orientation === "panoramic" && "aspect-[21/9] min-h-[200px] sm:min-h-[260px]",
            // For portrait: elegant containment without huge white gaps, natural height up to 500px
            orientation === "portrait" && "aspect-[3/4] sm:aspect-[4/5] max-h-[520px]",
            // For square: balanced 1:1 ratio
            orientation === "square" && "aspect-square max-h-[400px]"
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
              {/* Subtle ambient blurred background fill for non-standard image aspect ratios */}
              <div
                className="absolute inset-0 bg-cover bg-center blur-2xl opacity-20 scale-110 pointer-events-none"
                style={{ backgroundImage: `url(${photoUrl})` }}
              />

              {/* Main Vehicle Image (Clean Natural Proportions) */}
              <img
                src={photoUrl}
                alt={section.label}
                onLoad={(e) => handleImageLoad(key, e)}
                className={cn(
                  "relative z-10 w-full h-full select-none transition-transform duration-300 group-hover:scale-[1.015]",
                  orientation === "landscape" || orientation === "panoramic"
                    ? "object-cover sm:object-contain object-center"
                    : "object-contain object-center"
                )}
                loading="lazy"
              />

              {/* Hover Zoom Hint */}
              <div className="absolute inset-0 z-20 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
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

  // Order matching Reference Image:
  // 1. السيارة الرئيسية (Hero / 3/4 Perspective)
  // 2. الجانب الأيمن (Right Side)
  // 3. الجانب الأيسر (Left Side)
  // 4. الواجهة الأمامية (Front View)
  // 5. الواجهة الخلفية (Rear View)
  const photoKeysOrder: VehiclePhotoKey[] = [
    "main_vehicle",
    "right_side",
    "left_side",
    "front_view",
    "rear_view",
  ];

  return (
    <div className={cn("w-full space-y-3 sm:space-y-4 md:space-y-5", className)} dir="rtl">
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
