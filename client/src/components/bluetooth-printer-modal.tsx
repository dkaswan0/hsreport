import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Printer, X, Check, Loader2, Bluetooth, AlertCircle, Sparkles } from 'lucide-react';
import { BluetoothThermalPrinter, InspectionPrintData } from '@/lib/bluetooth-printer';
import { useToast } from '@/hooks/use-toast';

interface BluetoothPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspectionData: InspectionPrintData;
}

export const BluetoothPrinterModal: React.FC<BluetoothPrinterModalProps> = ({
  isOpen,
  onClose,
  inspectionData
}) => {
  const { toast } = useToast();
  const [isPrinting, setIsPrinting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handlePrint = async () => {
    setIsPrinting(true);
    setStatusMessage('جارٍ البحث والاتصال بطابعة البلوتوث...');

    try {
      await BluetoothThermalPrinter.printInspectionBadge(inspectionData);
      setStatusMessage('تمت الطباعة بنجاح!');
      toast({
        title: '✨ تمت الطباعة بنجاح',
        description: `تم إرسال بطاقة الفحص HS-${inspectionData.id} إلى الطابعة الحرارية.`
      });
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(null);
      toast({
        title: 'خطأ في الطباعة',
        description: err?.message || 'فشل الاتصال بالطابعة الحرارية عبر البلوتوث.',
        variant: 'destructive'
      });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-white p-5 rounded-3xl font-arabic">
        <DialogTitle className="sr-only">الطباعة اللاسلكية عبر البلوتوث</DialogTitle>
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Printer className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white font-arabic">الطباعة اللاسلكية عبر البلوتوث</h3>
              <p className="text-[10px] text-zinc-400 font-mono">Bluetooth ESC/POS Thermal Badge</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Mockup Preview */}
        <div className="bg-white text-zinc-900 rounded-2xl p-4 my-3 font-mono text-xs shadow-inner space-y-2 border border-zinc-300 select-none">
          <div className="text-center font-bold pb-1 border-b border-zinc-300">
            <div className="text-sm font-black tracking-wider">HIGH SAFETY REPORT</div>
            <div className="text-[10px] text-zinc-600 font-arabic">مركز الأمان العالي الدولي</div>
          </div>

          <div className="flex justify-between font-bold text-xs pt-1">
            <span>HS-{inspectionData.id}</span>
            <span className="font-arabic">{inspectionData.inspectionType || 'فحص شامل'}</span>
          </div>

          <div className="text-[11px] space-y-1 text-zinc-800 pt-1 border-t border-dashed border-zinc-300 font-arabic">
            <div className="flex justify-between">
              <span className="text-zinc-500">المركبة:</span>
              <span className="font-bold">{inspectionData.make} {inspectionData.model} {inspectionData.year || ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">رقم الهيكل:</span>
              <span className="font-bold font-mono text-[10px]" dir="ltr">{inspectionData.vin}</span>
            </div>
            {inspectionData.odometer && (
              <div className="flex justify-between">
                <span className="text-zinc-500">العداد:</span>
                <span>{inspectionData.odometer.toLocaleString()} كم</span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-zinc-300 text-center text-[10px] text-zinc-500 font-arabic">
            [ QR Code - فحص معتمد ]
          </div>
        </div>

        {/* Status Alert */}
        {statusMessage && (
          <div className="bg-zinc-900 border border-amber-500/30 p-2.5 rounded-xl text-xs text-amber-300 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 flex gap-2">
          <button
            type="button"
            disabled={isPrinting}
            onClick={handlePrint}
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            {isPrinting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جارٍ الاتصال والطباعة...</span>
              </>
            ) : (
              <>
                <Bluetooth className="w-4 h-4" />
                <span>طباعة الملصق الحراري فوراً</span>
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
