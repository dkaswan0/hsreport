import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileText, Printer, Share2, CheckCircle, Loader2 } from 'lucide-react';

interface PdfDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => Promise<void>;
  onPrint?: () => void;
  reportId: string;
  vehicleInfo: string;
}

export function PdfDownloadModal({
  isOpen,
  onClose,
  onDownload,
  onPrint,
  reportId,
  vehicleInfo,
}: PdfDownloadModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownload();
      setIsComplete(true);
      setTimeout(() => {
        setIsComplete(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            تحميل تقرير الفحص
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-6">
          {isComplete ? (
            <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <p className="text-lg font-semibold text-green-600">تم التحميل بنجاح!</p>
            </div>
          ) : (
            <>
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-4 shadow-lg">
                <FileText className="w-14 h-14 text-white" />
              </div>

              <div className="text-center mb-6">
                <p className="text-lg font-bold text-foreground">{vehicleInfo}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Report: HS-{reportId}
                </p>
              </div>

              <div className="w-full space-y-3">
                <Button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="w-full h-14 text-lg gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  data-testid="button-download-pdf"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      جاري التحضير...
                    </>
                  ) : (
                    <>
                      <Download className="w-6 h-6" />
                      تحميل PDF
                    </>
                  )}
                </Button>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handlePrint}
                    className="flex-1 h-12 gap-2"
                    data-testid="button-print-report"
                  >
                    <Printer className="w-5 h-5" />
                    طباعة
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `تقرير فحص ${vehicleInfo}`,
                          text: `تقرير فحص السيارة - HS-${reportId}`,
                          url: window.location.href,
                        });
                      }
                    }}
                    className="flex-1 h-12 gap-2"
                    data-testid="button-share-report"
                  >
                    <Share2 className="w-5 h-5" />
                    مشاركة
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
