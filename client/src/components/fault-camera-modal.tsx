import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Camera, X, RotateCcw, Zap, ZapOff, Grid, Check, Focus } from 'lucide-react';

interface FaultCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
  title?: string;
}

export const FaultCameraModal: React.FC<FaultCameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'تصوير العطل أو الملاحظة الفنية'
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackInputRef = useRef<HTMLInputElement>(null);

  // Start Camera Stream
  useEffect(() => {
    if (!isOpen || capturedPreview) return;

    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      setCameraError(null);
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        currentStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        console.error('Fault Camera access error:', err);
        setCameraError('تعذر الوصول للكاميرا المباشرة. يمكنك استخدام الكاميرا الافتراضية للجهاز.');
      }
    };

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, facingMode, capturedPreview]);

  // Toggle Torch/Flashlight
  const toggleFlash = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      try {
        const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities.torch) {
          await track.applyConstraints({
            advanced: [{ torch: !isFlashOn } as any]
          });
          setIsFlashOn(!isFlashOn);
        }
      } catch (err) {
        console.warn('Flashlight not supported on this device track', err);
      }
    }
  };

  // Capture Photo
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPreview(dataUrl);

      // Stop camera while reviewing
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  // Confirm and Save
  const handleConfirm = () => {
    if (capturedPreview) {
      onCapture(capturedPreview);
      handleClose();
    }
  };

  // Retake
  const handleRetake = () => {
    setCapturedPreview(null);
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCapturedPreview(null);
    onClose();
  };

  const handleFallbackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        onCapture(result);
        handleClose();
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl p-0 bg-black border-zinc-800 text-white overflow-hidden h-[92vh] max-h-[880px] flex flex-col font-arabic">
        <DialogTitle className="sr-only">{title}</DialogTitle>

        {/* Top Floating Control Bar */}
        <div className="absolute top-0 inset-x-0 z-30 p-3 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-sm font-bold text-white font-arabic">
                {title}
              </h3>
              <p className="text-[10px] text-zinc-300 font-mono">Live Defect Camera</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-full transition-colors cursor-pointer ${showGrid ? 'bg-amber-500 text-black' : 'bg-zinc-900/90 text-white'}`}
              title="شبكة المحاذاة"
            >
              <Grid className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleFlash}
              className={`p-2 rounded-full transition-colors cursor-pointer ${isFlashOn ? 'bg-amber-500 text-black' : 'bg-zinc-900/90 text-white'}`}
              title="الكشاف / فلاش"
            >
              {isFlashOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
              className="p-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-white transition-colors cursor-pointer"
              title="تبديل الكاميرا"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-zinc-200 max-w-md space-y-4">
              <p className="font-bold text-sm text-rose-400 font-arabic">{cameraError}</p>
              <button
                type="button"
                onClick={() => fallbackInputRef.current?.click()}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Camera className="w-5 h-5" />
                <span>فتح كاميرا الجهاز الافتراضية</span>
              </button>
              <input
                type="file"
                ref={fallbackInputRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFallbackFile}
              />
            </div>
          ) : capturedPreview ? (
            /* Review Captured Photo */
            <div className="w-full h-full relative flex items-center justify-center p-2">
              <img
                src={capturedPreview}
                alt="Captured Defect"
                className="max-h-full max-w-full object-contain rounded-2xl"
              />
            </div>
          ) : (
            /* Live Camera Stream */
            <div className="w-full h-full relative flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Composition Grid */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-25 border border-white/40">
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-white" />
                  <div />
                </div>
              )}

              {/* Target Focus Brackets */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 sm:w-64 sm:h-64 border-2 border-dashed border-amber-400/80 rounded-2xl flex items-center justify-center">
                  <Focus className="w-8 h-8 text-amber-400/60 animate-pulse" />
                </div>
              </div>

              {/* Instruction Badge */}
              <div className="absolute bottom-4 inset-x-0 flex justify-center pointer-events-none">
                <div className="bg-black/80 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold text-white font-arabic flex items-center gap-1.5 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>وجّه الكاميرا نحو مكان العطل أو الخدش بوضوح</span>
                </div>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Bottom Shutter Action Bar */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-900 flex items-center justify-center gap-6">
          {capturedPreview ? (
            <div className="flex items-center gap-4 w-full max-w-xs justify-between">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة الالتقاط</span>
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>اعتماد الصورة</span>
              </button>
            </div>
          ) : (
            /* Shutter Button */
            <button
              type="button"
              onClick={handleCapture}
              className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center p-1.5 transition-transform active:scale-90 hover:scale-105 cursor-pointer shadow-2xl"
              title="التقاط صورة العطل"
            >
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center shadow-lg">
                <Camera className="w-6 h-6 text-black" />
              </div>
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
