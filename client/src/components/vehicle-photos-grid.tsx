import React, { useState } from "react";
import { Camera, Upload, X, Eye, Maximize2, Sparkles, RefreshCw } from "lucide-react";
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
}: VehiclePhotosGridProps) {
  const [selectedZoomPhoto, setSelectedZoomPhoto] = useState<{
    url: string;
    label: string;
    description: string;
  } | null>(null);

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

  const renderPhotoCard = (
    key: VehiclePhotoKey,
    cardType: "hero" | "grid" | "center"
  ) => {
    const section = getSectionDef(key);
    const photoUrl = getPhotoUrl(key);
    const originalUrl = getOriginalUrl(key);
    const isStudioActive = isProcessed(key);

    return (
      <div
        key={key}
        className={cn(
          "bg-white rounded-2xl border-2 border-zinc-300 hover:border-zinc-500 shadow-xs transition-all duration-200 overflow-hidden relative flex flex-col justify-between group",
          cardType === "hero" && "w-full",
          cardType === "grid" && "w-full",
          cardType === "center" && "w-full"
        )}
        data-testid={`card-vehicle-photo-${key}`}
      >
        {/* Sleek Top Title Pill (Matches Reference Image Exactly) */}
        <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none">
          <div className="bg-zinc-950 text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl font-arabic shadow-md flex items-center gap-1.5 border border-zinc-800">
            <span>{section.label}</span>
            {isStudioActive && <Sparkles className="w-3 h-3 text-white" />}
          </div>
        </div>

        {/* Studio Status Pill (Left Top) */}
        {photoUrl && (
          <div className="absolute top-2.5 left-2.5 z-20">
            {isStudioActive ? (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-zinc-900/90 text-white border border-zinc-700 shadow-xs font-arabic">
                استوديو AI
              </span>
            ) : (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-zinc-100/90 text-zinc-700 border border-zinc-200 font-arabic">
                الأصلية
              </span>
            )}
          </div>
        )}

        {/* Photo Display / Upload Area */}
        <div
          className={cn(
            "relative w-full bg-white flex items-center justify-center p-3 pt-10 sm:pt-11",
            cardType === "hero" ? "h-64 sm:h-80 md:h-[340px]" : "h-48 sm:h-60"
          )}
        >
          {photoUrl ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={photoUrl}
                alt={section.label}
                className="w-full h-full object-contain select-none"
                style={{ imageRendering: "auto" }}
                loading="lazy"
              />

              {/* Action Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2 p-2 backdrop-blur-[2px]">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedZoomPhoto({
                      url: photoUrl,
                      label: section.label,
                      description: section.description,
                    })
                  }
                  className="p-2.5 bg-white hover:bg-zinc-100 text-zinc-900 rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
                  title="تكبير الصورة"
                  data-testid={`btn-zoom-${key}`}
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                {showStudioControls && onTogglePhotoMode && originalUrl && originalUrl !== photoUrl && (
                  <button
                    type="button"
                    onClick={() => onTogglePhotoMode(key)}
                    className="px-3 py-2 bg-zinc-950 text-white text-xs font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer font-arabic"
                    title="التبديل بين الأصلية والمحسنة"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isStudioActive ? "للأصلية" : "للمحسنة"}</span>
                  </button>
                )}

                {showStudioControls && onReprocessPhoto && (
                  <button
                    type="button"
                    onClick={() => onReprocessPhoto(key)}
                    disabled={isProcessing}
                    className="p-2.5 bg-white hover:bg-zinc-100 text-zinc-900 rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="إعادة معالجة الصورة بالذكاء الاصطناعي"
                  >
                    <RefreshCw className={cn("w-4 h-4", isProcessing && "animate-spin")} />
                  </button>
                )}

                {isEditable && onPhotoChange && (
                  <button
                    type="button"
                    onClick={() => onPhotoChange(key, null)}
                    className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
                    title="حذف الصورة"
                    data-testid={`btn-delete-${key}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : isEditable ? (
            /* Upload Buttons in Editable Mode */
            <div className="w-full h-full flex items-center justify-center">
              <div className="flex gap-2 w-full max-w-xs">
                <label className="flex-1 flex flex-col items-center justify-center h-28 sm:h-32 border-2 border-dashed border-zinc-300 rounded-xl cursor-pointer bg-zinc-50 hover:bg-zinc-100 transition-colors p-2 text-center">
                  <Camera className="w-6 h-6 text-zinc-900 mb-1" />
                  <span className="text-xs font-bold text-zinc-900 font-arabic">كاميرا</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFileInput(key, e)}
                    data-testid={`input-camera-${key}`}
                  />
                </label>
                <label className="flex-1 flex flex-col items-center justify-center h-28 sm:h-32 border-2 border-dashed border-zinc-200 rounded-xl cursor-pointer bg-white hover:bg-zinc-50 transition-colors p-2 text-center">
                  <Upload className="w-6 h-6 text-zinc-500 mb-1" />
                  <span className="text-xs font-medium text-zinc-700 font-arabic">معرض</span>
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
            <div className="text-center p-4 text-zinc-400">
              <Camera className="w-8 h-8 mx-auto mb-1 opacity-30" />
              <p className="text-xs font-arabic">لا توجد صورة</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("space-y-4 md:space-y-5 w-full", className)} dir="rtl">
      {/* ── ROW 1: Hero Main Vehicle View (Full Width) ── */}
      <div className="w-full">
        {renderPhotoCard("main_vehicle", "hero")}
      </div>

      {/* ── ROW 2: 3-Column Equal Grid ── */}
      {/* Visual RTL Order: Right Side (Rightmost) -> Front View (Center) -> Left Side (Leftmost) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 w-full">
        <div className="w-full">{renderPhotoCard("right_side", "grid")}</div>
        <div className="w-full">{renderPhotoCard("front_view", "grid")}</div>
        <div className="w-full">{renderPhotoCard("left_side", "grid")}</div>
      </div>

      {/* ── ROW 3: Rear View (Centered Bottom) ── */}
      <div className="flex justify-center w-full">
        <div className="w-full md:w-1/3 max-w-md">
          {renderPhotoCard("rear_view", "center")}
        </div>
      </div>

      {/* High-Resolution Zoom Modal */}
      <Dialog
        open={Boolean(selectedZoomPhoto)}
        onOpenChange={(open) => !open && setSelectedZoomPhoto(null)}
      >
        <DialogContent className="max-w-4xl bg-zinc-950/95 border-zinc-800 text-white p-4 font-arabic">
          {selectedZoomPhoto && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div>
                  <h3 className="text-base font-bold">{selectedZoomPhoto.label}</h3>
                  <p className="text-xs text-zinc-400">{selectedZoomPhoto.description}</p>
                </div>
              </div>
              <div className="relative max-h-[75vh] flex items-center justify-center overflow-hidden rounded-xl bg-black">
                <img
                  src={selectedZoomPhoto.url}
                  alt={selectedZoomPhoto.label}
                  className="max-h-[72vh] w-auto max-w-full object-contain rounded-lg"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
