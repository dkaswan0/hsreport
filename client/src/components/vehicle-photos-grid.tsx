import React, { useState } from "react";
import { Camera, Upload, X, Eye, Maximize2, Sparkles, RefreshCw, CheckCircle2 } from "lucide-react";
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
          "bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between",
          cardType === "hero" && "w-full",
          cardType === "grid" && "w-full",
          cardType === "center" && "w-full md:max-w-md mx-auto"
        )}
        data-testid={`card-vehicle-photo-${key}`}
      >
        {/* Card Header with Label & Badges */}
        <div className="p-3.5 border-b border-zinc-100 flex items-center justify-between gap-2 bg-zinc-50/70">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-950" />
            <h4 className="font-bold text-sm text-zinc-900 font-arabic">{section.label}</h4>
          </div>

          <div className="flex items-center gap-1.5">
            {photoUrl && isStudioActive && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-950 text-white flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                استوديو AI
              </span>
            )}
            {photoUrl && !isStudioActive && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                الأصلية
              </span>
            )}
            {!photoUrl && isEditable && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">
                مطلوب
              </span>
            )}
          </div>
        </div>

        {/* Photo Display / Upload Area */}
        <div
          className={cn(
            "relative bg-white flex items-center justify-center p-2 group",
            cardType === "hero" ? "h-64 sm:h-80 md:h-96" : "h-48 sm:h-56"
          )}
        >
          {photoUrl ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={photoUrl}
                alt={section.label}
                className="w-full h-full object-contain rounded-xl select-none"
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
                  className="p-2 bg-white/90 hover:bg-white text-zinc-900 rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
                  title="تكبير الصورة"
                  data-testid={`btn-zoom-${key}`}
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                {showStudioControls && onTogglePhotoMode && originalUrl && originalUrl !== photoUrl && (
                  <button
                    type="button"
                    onClick={() => onTogglePhotoMode(key)}
                    className="px-2.5 py-1.5 bg-zinc-950 text-white text-xs font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-1 cursor-pointer font-arabic"
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
                    className="p-2 bg-white/90 hover:bg-white text-zinc-900 rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="إعادة معالجة الصورة بالذكاء الاصطناعي"
                  >
                    <RefreshCw className={cn("w-4 h-4", isProcessing && "animate-spin")} />
                  </button>
                )}

                {isEditable && onPhotoChange && (
                  <button
                    type="button"
                    onClick={() => onPhotoChange(key, null)}
                    className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
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
            <div className="w-full h-full flex items-center justify-center p-2">
              <div className="flex gap-2 w-full max-w-xs">
                <label className="flex-1 flex flex-col items-center justify-center h-32 border-2 border-dashed border-zinc-300 rounded-xl cursor-pointer bg-zinc-50 hover:bg-zinc-100 transition-colors p-2 text-center">
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
                <label className="flex-1 flex flex-col items-center justify-center h-32 border-2 border-dashed border-zinc-200 rounded-xl cursor-pointer bg-white hover:bg-zinc-50 transition-colors p-2 text-center">
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
              <Camera className="w-8 h-8 mx-auto mb-1 opacity-40" />
              <p className="text-xs font-arabic">لا توجد صورة</p>
            </div>
          )}
        </div>

        {/* Card Footer Caption */}
        <div className="p-2.5 bg-zinc-50/50 border-t border-zinc-100 text-center">
          <p className="text-[11px] text-zinc-500 font-arabic truncate" title={section.description}>
            {section.description}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("space-y-6 w-full", className)} dir="rtl">
      {/* ── ROW 1: Hero Main Vehicle View (Full Width) ── */}
      <div className="w-full">
        {renderPhotoCard("main_vehicle", "hero")}
      </div>

      {/* ── ROW 2: 3-Column Equal Grid ── */}
      {/* Visual RTL Order: Right Side (Rightmost) -> Front View (Center) -> Left Side (Leftmost) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full">
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
