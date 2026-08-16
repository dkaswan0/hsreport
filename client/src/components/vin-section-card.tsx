// ==============================================================================
// VIN Section Card Component - High Safety Inspection System
// Dedicated Card: LTR 17-char Input, Camera Capture, File Upload, and Scan / OCR
// ==============================================================================

import React, { useState, useRef } from "react";
import { Camera, Upload, Scan, Trash2, RotateCcw, Check, Sparkles, Loader2, Copy } from "lucide-react";
import { PhosphorIcon } from "@/components/phosphor-icon";
import { FaultCameraModal } from "@/components/fault-camera-modal";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface VinSectionCardProps {
  vin: string;
  vinPhoto?: string | null;
  onVinChange: (newVin: string) => void;
  onVinPhotoChange: (newPhotoUrl: string | null) => void;
  isSaving?: boolean;
}

export const VinSectionCard: React.FC<VinSectionCardProps> = ({
  vin,
  vinPhoto,
  onVinChange,
  onVinPhotoChange,
  isSaving = false,
}) => {
  const { toast } = useToast();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean and format VIN as user types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/\s+/g, "");
    onVinChange(raw);
  };

  // Handle Photo Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onVinPhotoChange(dataUrl);
      // Auto-trigger OCR extraction on upload
      handleOcrExtraction(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // OCR Extraction Logic
  const handleOcrExtraction = async (imageDataUrl?: string) => {
    const targetImage = imageDataUrl || vinPhoto;
    if (!targetImage) {
      toast({
        title: "يرجى تصوير أو رفع صورة VIN أولاً",
        description: "التقط صورة للوحة الشاصي أو استمارة السيارة لتشغيل المسح الذكي.",
        variant: "destructive",
      });
      return;
    }

    setIsScanningOcr(true);
    try {
      const res = await fetch("/api/ai/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: targetImage,
          prompt: "استخرج رقم الهيكل / الشاصي (Vehicle Identification Number - VIN) المكون من 17 حرفاً ورقماً إنجليزياً من هذه الصورة. أعد رقم الـ VIN فقط بدون أي نصوص أخرى.",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const extracted = (data.vin || data.description || data.text || "")
          .toUpperCase()
          .replace(/[^A-HJ-NPR-Z0-9]/g, "");

        if (extracted && extracted.length >= 10) {
          const finalVin = extracted.substring(0, 17);
          onVinChange(finalVin);
          toast({
            title: "✨ تم استخراج رقم الهيكل تلقائيًا",
            description: `الرقم المستخرج: ${finalVin} (يمكنك تعديله يدوياً إن رغبت).`,
          });
          return;
        }
      }

      toast({
        title: "تنبيه المسح الذكي",
        description: "تعذر استخراج رقم VIN بدقة عالية من الصورة، يمكنك كتابته يدوياً.",
      });
    } catch (err) {
      console.warn("VIN OCR error:", err);
    } finally {
      setIsScanningOcr(false);
    }
  };

  const handleCopyVin = () => {
    if (!vin) return;
    navigator.clipboard?.writeText(vin);
    toast({ title: "تم نسخ رقم الهيكل" });
  };

  return (
    <div
      className="bg-zinc-950 text-white rounded-3xl p-4 sm:p-5 border border-zinc-800 shadow-xl space-y-3 font-arabic"
      data-testid="vin-section-card"
      dir="rtl"
    >
      {/* ── Card Header ── */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <PhosphorIcon name="barcode" weight="bold" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white">رقم الهيكل (الشاصي) — VIN</h3>
            <p className="text-[10px] sm:text-xs text-zinc-400 font-mono" dir="ltr">
              Vehicle Identification Number (17 Chars)
            </p>
          </div>
        </div>

        {vin && (
          <span
            className={cn(
              "font-mono text-xs font-bold px-2 py-0.5 rounded-full border",
              vin.length === 17
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : "bg-amber-500/20 text-amber-300 border-amber-500/30"
            )}
          >
            {vin.length}/17 حرف
          </span>
        )}
      </div>

      {/* ── Large LTR Monospace Input Field ── */}
      <div className="space-y-1.5">
        <div className="relative">
          <input
            type="text"
            value={vin || ""}
            onChange={handleInputChange}
            placeholder="1HGCM82633A123456"
            maxLength={17}
            dir="ltr"
            className="w-full bg-zinc-900 border-2 border-zinc-700 focus:border-amber-400 rounded-2xl py-3 px-4 text-base sm:text-lg font-mono font-black text-white tracking-widest text-left placeholder-zinc-600 focus:outline-none transition-all shadow-inner uppercase selection:bg-amber-500 selection:text-black"
          />

          {vin && (
            <button
              type="button"
              onClick={handleCopyVin}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="نسخ رقم VIN"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-[11px] text-zinc-400 text-right">
          اكتب رقم الهيكل المكون من 17 حرفاً ورقم باللغة الإنجليزية أو التقط صورته للمسح التلقائي.
        </p>
      </div>

      {/* ── Action Buttons & Camera / OCR Controls ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
        {/* Button 1: Live Camera */}
        <button
          type="button"
          onClick={() => setIsCameraOpen(true)}
          className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 active:scale-95 border border-zinc-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Camera className="w-4 h-4 text-amber-400" />
          <span>📷 تصوير VIN</span>
        </button>

        {/* Button 2: Upload Photo */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 active:scale-95 border border-zinc-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Upload className="w-4 h-4 text-blue-400" />
          <span>🖼️ رفع صورة</span>
        </button>

        {/* Button 3: Scan / OCR */}
        <button
          type="button"
          disabled={isScanningOcr || !vinPhoto}
          onClick={() => handleOcrExtraction()}
          className="col-span-2 sm:col-span-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
        >
          {isScanningOcr ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جارٍ المسح الذكي...</span>
            </>
          ) : (
            <>
              <Scan className="w-4 h-4" />
              <span>🔍 Scan VIN (OCR)</span>
            </>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* ── VIN Image Preview Box ── */}
      {vinPhoto && (
        <div className="pt-2 border-t border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span className="font-bold">صورة لوحة رقم الهيكل المرفقة:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>إعادة تصوير</span>
              </button>
              <button
                type="button"
                onClick={() => onVinPhotoChange(null)}
                className="text-[11px] text-rose-400 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>حذف الصورة</span>
              </button>
            </div>
          </div>

          <div className="relative w-full aspect-[21/9] max-h-44 bg-black rounded-2xl overflow-hidden border border-zinc-700 shadow-md flex items-center justify-center">
            <img src={vinPhoto} alt="صورة رقم الهيكل VIN" className="w-full h-full object-contain" />
          </div>
        </div>
      )}

      {/* Live Camera Modal */}
      <FaultCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => {
          onVinPhotoChange(dataUrl);
          setIsCameraOpen(false);
          // Auto OCR scan on capture
          handleOcrExtraction(dataUrl);
        }}
        title="تصوير لوحة رقم الهيكل (VIN)"
      />
    </div>
  );
};
