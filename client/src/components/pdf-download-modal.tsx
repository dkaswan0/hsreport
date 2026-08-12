import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileText, Printer, Share2, CheckCircle, Loader2, QrCode, Copy, Check } from 'lucide-react';

interface PdfDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => Promise<void>;
  onPrint?: () => void;
  reportId: string;
  vehicleInfo: string;
  shareToken?: string | null;
}

export function PdfDownloadModal({
  isOpen,
  onClose,
  onDownload,
  onPrint,
  reportId,
  vehicleInfo,
  shareToken,
}: PdfDownloadModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [copied, setCopied] = useState(false);

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
            مشاركة تقرير الفحص
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          {isComplete ? (
            <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in">
              <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-zinc-950 dark:text-white" />
              </div>
              <p className="text-lg font-semibold text-zinc-950 dark:text-white">تم التحميل بنجاح!</p>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center mb-4 shadow-lg">
                <FileText className="w-12 h-12 text-white" />
              </div>

              <div className="text-center mb-4">
                <p className="text-lg font-bold text-foreground">{vehicleInfo}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Report: HS-{reportId}
                </p>
              </div>

              {shareToken && (
                <div className="w-full mb-4 p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2 font-arabic text-center">رابط المشاركة</p>
                  <div className="flex items-center gap-2">
                    <input 
                      readOnly 
                      value={`${window.location.origin}/handoff/${shareToken}`}
                      className="flex-1 text-xs bg-background p-2 rounded border text-left dir-ltr"
                      dir="ltr"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/handoff/${shareToken}`);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      data-testid="button-copy-link"
                    >
                      {copied ? <Check className="w-4 h-4 text-zinc-950" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}

              <div className="w-full space-y-3">
                <Button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="w-full h-14 text-lg gap-3 bg-gradient-to-r bg-zinc-950 hover:bg-black text-white"
                  data-testid="button-download-pdf"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      جارٍ التحضير...
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
                      const shareUrl = shareToken 
                        ? `${window.location.origin}/handoff/${shareToken}`
                        : window.location.href;
                      if (navigator.share) {
                        navigator.share({
                          title: `تقرير فحص ${vehicleInfo}`,
                          text: `تقرير فحص السيارة - HS-${reportId}`,
                          url: shareUrl,
                        });
                      } else {
                        navigator.clipboard.writeText(shareUrl);
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
