import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Camera, X, RotateCcw, Zap, ZapOff, Grid, Check, Smartphone, Info } from 'lucide-react';
import { VehiclePhotoKey, VEHICLE_PHOTO_SECTIONS } from '@shared/vehicle-photos';

interface CameraOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoKey: VehiclePhotoKey | null;
  onCapture: (photoKey: VehiclePhotoKey, dataUrl: string) => void;
}

export const CameraOverlayModal: React.FC<CameraOverlayModalProps> = ({
  isOpen,
  onClose,
  photoKey,
  onCapture
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showOrientationTip, setShowOrientationTip] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const meta = photoKey ? VEHICLE_PHOTO_SECTIONS.find(p => p.key === photoKey) : null;

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
        console.error('Camera access error:', err);
        setCameraError('فشل تشغيل الكاميرا. يرجى التحقق من إعطاء الصلاحية في المتصفح أو التطبيق.');
      }
    };

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, facingMode, capturedPreview]);

  // Auto hide orientation tip after 6 seconds
  useEffect(() => {
    if (isOpen) {
      setShowOrientationTip(true);
      const timer = setTimeout(() => setShowOrientationTip(false), 7000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, photoKey]);

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
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
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
    if (capturedPreview && photoKey) {
      onCapture(photoKey, capturedPreview);
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

  // Render Silhouette Overlay SVG based on vehicle photo key
  const renderSilhouette = () => {
    if (!photoKey) return null;

    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none stroke-white/80 drop-shadow-[0_0_10px_rgba(0,0,0,0.9)]"
        viewBox="0 0 1000 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Corner alignment brackets */}
        <path d="M 120 180 L 120 120 L 180 120" strokeWidth="4" stroke="rgba(251, 191, 36, 0.9)" fill="none" />
        <path d="M 880 180 L 880 120 L 820 120" strokeWidth="4" stroke="rgba(251, 191, 36, 0.9)" fill="none" />
        <path d="M 120 420 L 120 480 L 180 480" strokeWidth="4" stroke="rgba(251, 191, 36, 0.9)" fill="none" />
        <path d="M 880 420 L 880 480 L 820 480" strokeWidth="4" stroke="rgba(251, 191, 36, 0.9)" fill="none" />

        {photoKey === 'main_vehicle' && (
          // Perspective 3/4 Outline
          <g strokeWidth="3" strokeDasharray="8 6" className="animate-pulse">
            <path d="M 180 380 L 260 270 L 450 210 L 720 220 L 860 300 L 880 400 L 820 450 L 220 450 Z" />
            <path d="M 330 260 L 460 215 L 680 225 L 650 310 L 300 310 Z" />
            <circle cx="310" cy="450" r="45" />
            <circle cx="760" cy="450" r="45" />
          </g>
        )}

        {photoKey === 'front_view' && (
          // Front Symmetrical View
          <g strokeWidth="3" strokeDasharray="8 6" className="animate-pulse">
            <path d="M 280 200 L 720 200 L 830 320 L 850 460 L 150 460 L 170 320 Z" />
            <path d="M 320 210 L 680 210 L 740 310 L 260 310 Z" />
            <rect x="360" y="360" width="280" height="70" rx="10" />
            <circle cx="230" cy="350" r="28" />
            <circle cx="770" cy="350" r="28" />
            <circle cx="200" cy="460" r="40" />
            <circle cx="800" cy="460" r="40" />
          </g>
        )}

        {(photoKey === 'right_side' || photoKey === 'left_side') && (
          // Side Profile
          <g strokeWidth="3" strokeDasharray="8 6" className="animate-pulse">
            <path d="M 120 410 L 150 350 L 300 320 L 420 210 L 680 210 L 850 330 L 920 370 L 920 430 L 120 430 Z" />
            <path d="M 440 225 L 660 225 L 780 320 L 340 320 Z" />
            <line x1="550" y1="225" x2="550" y2="410" />
            <circle cx="260" cy="430" r="50" />
            <circle cx="780" cy="430" r="50" />
          </g>
        )}

        {photoKey === 'rear_view' && (
          // Rear Symmetrical View
          <g strokeWidth="3" strokeDasharray="8 6" className="animate-pulse">
            <path d="M 290 210 L 710 210 L 820 320 L 840 460 L 160 460 L 180 320 Z" />
            <path d="M 320 220 L 680 220 L 750 320 L 250 320 Z" />
            <rect x="380" y="380" width="240" height="50" rx="6" />
            <rect x="200" y="340" width="80" height="30" rx="5" />
            <rect x="720" y="340" width="80" height="30" rx="5" />
            <circle cx="210" cy="460" r="40" />
            <circle cx="790" cy="460" r="40" />
          </g>
        )}
      </svg>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl p-0 bg-black border-zinc-800 text-white overflow-hidden h-[92vh] max-h-[880px] flex flex-col font-arabic">
        <DialogTitle className="sr-only">كاميرا دليل الإطار الشفاف للسيارة</DialogTitle>
        
        {/* Top Floating Control Bar */}
        <div className="absolute top-0 inset-x-0 z-30 p-3 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-sm font-bold text-white font-arabic">
                {meta ? meta.label : 'كاميرا تصوير المركبة'}
              </h3>
              <p className="text-[10px] text-amber-300 font-mono">Landscape Framing Mode</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-full transition-colors ${showGrid ? 'bg-amber-500 text-black' : 'bg-zinc-900/90 text-white'}`}
              title="شبكة المحاذاة"
            >
              <Grid className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleFlash}
              className={`p-2 rounded-full transition-colors ${isFlashOn ? 'bg-amber-500 text-black' : 'bg-zinc-900/90 text-white'}`}
              title="الكشاف / الفلاش"
            >
              {isFlashOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
              className="p-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-white transition-colors"
              title="تبديل الكاميرا"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-rose-400 max-w-md">
              <p className="font-bold text-sm mb-3 font-arabic">{cameraError}</p>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-white text-black rounded-xl font-bold text-xs"
              >
                إغلاق
              </button>
            </div>
          ) : capturedPreview ? (
            /* Review Captured Photo */
            <div className="w-full h-full relative flex items-center justify-center p-2">
              <img
                src={capturedPreview}
                alt="Captured Vehicle"
                className="max-h-full max-w-full object-contain rounded-2xl"
              />
            </div>
          ) : (
            /* Live Camera Stream with Framing Overlay */
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
                  <div className="border-r border-b border-white" />
                  <div />
                </div>
              )}

              {/* Silhouette Overlay */}
              {renderSilhouette()}

              {/* Orientation Recommended Tip Banner (Top Overlay) */}
              {showOrientationTip && (
                <div className="absolute top-16 inset-x-4 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="bg-zinc-950/90 backdrop-blur-md border border-amber-400/50 text-amber-300 px-4 py-2 rounded-2xl text-xs font-bold font-arabic flex items-center gap-2 shadow-2xl">
                    <Info className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>يفضل تصوير السيارة بالعرض (Landscape) للحصول على أفضل نتيجة في التقرير</span>
                  </div>
                </div>
              )}

              {/* Centering Instruction Badge (Bottom Overlay) */}
              <div className="absolute bottom-4 inset-x-0 flex justify-center pointer-events-none">
                <div className="bg-black/80 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold text-white font-arabic flex items-center gap-1.5 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>طابق أبعاد السيارة داخل الإطار الإرشادي</span>
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
              title="التقاط الصورة"
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
