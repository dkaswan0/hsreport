import { useState, useRef, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Camera, X, ScanLine, Loader2, CheckCircle2, RefreshCw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Tesseract from 'tesseract.js';

interface VinScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVinScanned: (vin: string) => void;
}

export function VinScannerModal({ isOpen, onClose, onVinScanned }: VinScannerModalProps) {
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [scannedVin, setScannedVin] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateVin = (vin: string): boolean => {
    const cleanVin = vin.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase();
    if (cleanVin.length !== 17) return false;
    if (/[IOQ]/i.test(cleanVin)) return false;
    return true;
  };

  const extractVin = (text: string): string | null => {
    const cleanText = text.replace(/\s+/g, '').toUpperCase();
    const vinPattern = /[A-HJ-NPR-Z0-9]{17}/g;
    const matches = cleanText.match(vinPattern);
    
    if (matches) {
      for (const match of matches) {
        if (validateVin(match)) {
          return match;
        }
      }
    }
    
    const almostMatches = cleanText.match(/[A-Z0-9]{15,19}/g);
    if (almostMatches) {
      for (const match of almostMatches) {
        const corrected = match
          .replace(/O/g, '0')
          .replace(/I/g, '1')
          .replace(/Q/g, '0');
        if (corrected.length === 17 && validateVin(corrected)) {
          return corrected;
        }
      }
    }
    
    return null;
  };

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraActive(true);
      setError(null);
    } catch (err) {
      console.error('Camera access error:', err);
      setError('تعذر فتح الكاميرا - يرجى السماح بالوصول أو رفع صورة');
      setMode('upload');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const processImage = async (imageData: string) => {
    setIsScanning(true);
    setProgress(0);
    setError(null);

    try {
      const result = await Tesseract.recognize(imageData, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const vin = extractVin(result.data.text);
      
      if (vin) {
        setScannedVin(vin);
        setError(null);
      } else {
        setError('لم يتم العثور على رقم الهيكل - حاول مرة أخرى');
      }
    } catch (err) {
      console.error('OCR error:', err);
      setError('تعذرت قراءة الصورة');
    } finally {
      setIsScanning(false);
    }
  };

  const captureFromCamera = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    ctx.filter = 'contrast(1.5) brightness(1.1)';
    ctx.drawImage(canvas, 0, 0);

    const imageData = canvas.toDataURL('image/png');
    await processImage(imageData);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const imageData = reader.result as string;
      await processImage(imageData);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (scannedVin) {
      onVinScanned(scannedVin);
      handleClose();
    }
  };

  const handleRetry = () => {
    setScannedVin(null);
    setError(null);
    setProgress(0);
  };

  const handleClose = () => {
    stopCamera();
    setScannedVin(null);
    setError(null);
    setProgress(0);
    setCameraActive(false);
    onClose();
  };

  useEffect(() => {
    if (isOpen && mode === 'camera') {
      setCameraActive(false);
      const timer = setTimeout(() => startCamera(), 200);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else if (!isOpen) {
      stopCamera();
      setMode('camera');
    }
  }, [isOpen, mode, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg z-50 animate-in zoom-in-95 duration-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
            <Dialog.Title className="text-xl font-bold flex items-center gap-2">
              <ScanLine className="w-6 h-6" />
              مسح رقم الهيكل
            </Dialog.Title>
            <p className="text-blue-100 text-sm mt-1">
              وجّه الكاميرا نحو رقم الهيكل أو ارفع صورة
            </p>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex gap-2">
              <Button
                variant={mode === 'camera' ? 'default' : 'outline'}
                onClick={() => {
                  setMode('camera');
                  handleRetry();
                }}
                className="flex-1"
                data-testid="button-camera-mode"
              >
                <Camera className="w-4 h-4 ml-2" />
                كاميرا
              </Button>
              <Button
                variant={mode === 'upload' ? 'default' : 'outline'}
                onClick={() => {
                  setMode('upload');
                  stopCamera();
                  handleRetry();
                }}
                className="flex-1"
                data-testid="button-upload-mode"
              >
                <Upload className="w-4 h-4 ml-2" />
                رفع صورة
              </Button>
            </div>

            {scannedVin ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-sm text-green-600 dark:text-green-400 mb-2">تم العثور على رقم الهيكل</p>
                <p className="text-2xl font-mono font-bold text-green-700 dark:text-green-300 tracking-wider" dir="ltr">
                  {scannedVin}
                </p>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={handleRetry} className="flex-1" data-testid="button-retry-scan">
                    <RefreshCw className="w-4 h-4 ml-2" />
                    مسح مرة أخرى
                  </Button>
                  <Button onClick={handleConfirm} className="flex-1 bg-green-600 hover:bg-green-700" data-testid="button-confirm-vin">
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                    تأكيد
                  </Button>
                </div>
              </div>
            ) : mode === 'camera' ? (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-16 border-2 border-blue-400 rounded-lg">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500 rounded-tl"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500 rounded-tr"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500 rounded-bl"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500 rounded-br"></div>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5">
                      <div className={cn(
                        "h-0.5 bg-blue-500 animate-pulse",
                        isScanning && "animate-[scan_1.5s_ease-in-out_infinite]"
                      )} style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.8)' }} />
                    </div>
                  </div>

                  {!cameraActive && !error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                  )}
                </div>

                {isScanning && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">يسكن...</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-600 dark:text-red-400 text-sm text-center">
                    {error}
                  </div>
                )}

                <Button
                  onClick={captureFromCamera}
                  disabled={!cameraActive || isScanning}
                  className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700"
                  data-testid="button-capture-vin"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                      يسكن...
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5 ml-2" />
                      التقاط ومسح
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                  data-testid="input-vin-image"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  className="w-full aspect-video border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors"
                  data-testid="button-select-image"
                >
                  <Upload className="w-12 h-12 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">اضغط عشان تختار صورة</span>
                </button>

                {isScanning && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">يسكن...</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-600 dark:text-red-400 text-sm text-center">
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute top-4 left-4 p-2 text-white/80 hover:text-white transition-colors"
              aria-label="Close"
              data-testid="button-close-scanner"
            >
              <X className="w-5 h-5" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
