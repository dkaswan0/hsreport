import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, Barcode, Zap, ZapOff, CheckCircle2, RotateCcw, ScanLine } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (detectedCode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onDetected
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<any>(null);

  // Start Camera
  useEffect(() => {
    if (!isOpen) return;

    setScannedResult(null);
    setIsProcessing(false);
    setCameraError(null);

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        // Start scanning loop
        startScanningLoop(mediaStream);
      } catch (err: any) {
        console.error('Barcode camera error:', err);
        setCameraError('فشل تشغيل كاميرا ماسح الباركود. يرجى التأكد من منح صلاحية الكاميرا.');
      }
    };

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  };

  // Scanning Loop via Native BarcodeDetector or Canvas OCR
  const startScanningLoop = (mediaStream: MediaStream) => {
    const hasBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;
    let detector: any = null;

    if (hasBarcodeDetector) {
      try {
        const BarcodeDetectorClass = (window as any).BarcodeDetector;
        detector = new BarcodeDetectorClass({
          formats: ['code_128', 'code_39', 'qr_code', 'data_matrix', 'ean_13', 'upc_a']
        });
      } catch (e) {
        console.warn('BarcodeDetector init fallback', e);
      }
    }

    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || isProcessing) return;

      const video = videoRef.current;
      if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

      try {
        if (detector) {
          const barcodes = await detector.detect(video);
          if (barcodes && barcodes.length > 0) {
            const rawVal = barcodes[0].rawValue;
            handleSuccessfulScan(rawVal);
            return;
          }
        }
      } catch {
        // Continue loop
      }
    }, 250);
  };

  const handleSuccessfulScan = (rawCode: string) => {
    if (!rawCode || isProcessing) return;

    // Clean up VIN formatting
    let cleanVin = rawCode.trim().toUpperCase()
      .replace(/[\s-]/g, '')
      .replace(/O/g, '0')
      .replace(/I/g, '1')
      .replace(/Q/g, '0');

    // Match 17-char VIN if present inside longer string
    const vinMatch = cleanVin.match(/[A-HJ-NPR-Z0-9]{17}/);
    if (vinMatch) {
      cleanVin = vinMatch[0];
    }

    setIsProcessing(true);
    setScannedResult(cleanVin);

    // Play vibration feedback if available
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(80);
    }

    stopCamera();

    setTimeout(() => {
      onDetected(cleanVin);
      handleClose();
    }, 600);
  };

  // Toggle Flashlight
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
        console.warn('Torch toggle failed', err);
      }
    }
  };

  // Fallback: Snap image for AI OCR Analysis
  const handleSnapForAiOcr = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      setIsProcessing(true);
      try {
        const res = await fetch('/api/vin/extract-from-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: dataUrl })
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.vin) {
            handleSuccessfulScan(data.vin);
            return;
          }
        }
        throw new Error('لم يتم التعرف على الباركود، يرجى المحاولة بزاوية أخرى');
      } catch (err: any) {
        setIsProcessing(false);
        alert(err.message || 'فشل مسح الباركود');
      }
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md p-0 bg-zinc-950 border-zinc-800 text-white overflow-hidden flex flex-col font-arabic">
        <DialogTitle className="sr-only">ماسح الباركود ورقم الهيكل</DialogTitle>
        {/* Top Header */}
        <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white font-arabic">ماسح الباركود والشاصي</h3>
              <p className="text-[10px] text-zinc-400 font-mono">Fast Barcode & VIN Scanner</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFlash}
              className={`p-2 rounded-full transition-colors ${isFlashOn ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-white'}`}
            >
              {isFlashOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Camera Viewport with Laser Target */}
        <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-rose-400">
              <p className="font-bold text-xs mb-3">{cameraError}</p>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-1.5 bg-white text-black rounded-xl font-bold text-xs"
              >
                إغلاق
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Target Scan Box */}
              <div className="absolute inset-x-8 inset-y-12 border-2 border-amber-400/80 rounded-2xl pointer-events-none flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                {/* Red Laser Scanning Line Animation */}
                <div className="w-full h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-bounce" />
              </div>

              {/* Success Result Overlay */}
              {scannedResult && (
                <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in zoom-in-90">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
                  <p className="text-xs text-zinc-300 font-arabic mb-1">تم مسح رقم الهيكل بنجاح:</p>
                  <p className="text-base font-black text-amber-400 font-mono tracking-widest bg-zinc-900 border border-zinc-800 px-4 py-1.5 rounded-xl">
                    {scannedResult}
                  </p>
                </div>
              )}
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Bottom Helper Bar */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-900 flex flex-col items-center gap-2">
          <p className="text-[11px] text-zinc-400 text-center font-arabic">
            وجّه الكاميرا نحو باركود الشاصي أو استمارة المركبة لمسحه فورياً
          </p>

          <button
            type="button"
            disabled={isProcessing}
            onClick={handleSnapForAiOcr}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ScanLine className="w-4 h-4 text-amber-400" />
            <span>مسح ذكي بالذكاء الاصطناعي (AI OCR)</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
