import { useState, useRef, useCallback, useEffect } from 'react';
import Tesseract from 'tesseract.js';

interface VinScannerState {
  isScanning: boolean;
  scannedVin: string | null;
  error: string | null;
  progress: number;
  isProcessing: boolean;
}

export function useVinScanner() {
  const [state, setState] = useState<VinScannerState>({
    isScanning: false,
    scannedVin: null,
    error: null,
    progress: 0,
    isProcessing: false,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<Tesseract.Worker | null>(null);

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

  const startCamera = useCallback(async (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    videoRef.current = video;
    canvasRef.current = canvas;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();

      setState(prev => ({ ...prev, isScanning: true, error: null }));
    } catch (err) {
      console.error('Camera access error:', err);
      setState(prev => ({
        ...prev,
        error: 'لا يمكن الوصول للكاميرا - Camera access denied',
      }));
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setState(prev => ({ ...prev, isScanning: false }));
  }, []);

  const captureAndScan = useCallback(async (): Promise<string | null> => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    ctx.filter = 'contrast(1.5) brightness(1.1)';
    ctx.drawImage(canvas, 0, 0);

    const imageData = canvas.toDataURL('image/png');

    setState(prev => ({ ...prev, isProcessing: true, progress: 0 }));

    try {
      const result = await Tesseract.recognize(imageData, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setState(prev => ({ ...prev, progress: Math.round(m.progress * 100) }));
          }
        },
      });

      const vin = extractVin(result.data.text);
      
      if (vin) {
        setState(prev => ({
          ...prev,
          scannedVin: vin,
          isProcessing: false,
          error: null,
        }));
        return vin;
      } else {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: 'لم يتم العثور على رقم شاصي - VIN not found, try again',
        }));
        return null;
      }
    } catch (err) {
      console.error('OCR error:', err);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: 'فشل في قراءة الصورة - OCR failed',
      }));
      return null;
    }
  }, []);

  const scanFromImage = useCallback(async (imageDataUrl: string): Promise<string | null> => {
    setState(prev => ({ ...prev, isProcessing: true, progress: 0, error: null }));

    try {
      const result = await Tesseract.recognize(imageDataUrl, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setState(prev => ({ ...prev, progress: Math.round(m.progress * 100) }));
          }
        },
      });

      const vin = extractVin(result.data.text);
      
      if (vin) {
        setState(prev => ({
          ...prev,
          scannedVin: vin,
          isProcessing: false,
          error: null,
        }));
        return vin;
      } else {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: 'لم يتم العثور على رقم شاصي - VIN not found',
        }));
        return null;
      }
    } catch (err) {
      console.error('OCR error:', err);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: 'فشل في قراءة الصورة - OCR failed',
      }));
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isScanning: false,
      scannedVin: null,
      error: null,
      progress: 0,
      isProcessing: false,
    });
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [stopCamera]);

  return {
    ...state,
    startCamera,
    stopCamera,
    captureAndScan,
    scanFromImage,
    reset,
    validateVin,
  };
}
