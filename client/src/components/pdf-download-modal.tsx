import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileText, Printer, Share2, CheckCircle, Loader2, QrCode } from 'lucide-react';
import { QRCodeDisplay } from '@/components/qr-code-display';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [activeTab, setActiveTab] = useState<string>(shareToken ? 'qr' : 'download');

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
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <p className="text-lg font-semibold text-green-600">تم التحميل بنجاح!</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="qr" className="gap-2" data-testid="tab-qr">
                  <QrCode className="w-4 h-4" />
                  <span className="font-arabic">باركود</span>
                </TabsTrigger>
                <TabsTrigger value="download" className="gap-2" data-testid="tab-download">
                  <Download className="w-4 h-4" />
                  <span className="font-arabic">تحميل</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="qr" className="mt-0">
                {shareToken ? (
                  <div className="flex flex-col items-center">
                    <div className="text-center mb-4">
                      <p className="text-lg font-bold text-foreground">{vehicleInfo}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Report: HS-{reportId}
                      </p>
                    </div>
                    <QRCodeDisplay 
                      token={shareToken} 
                      inspectionId={parseInt(reportId)}
                      vehicleName={vehicleInfo}
                      size={180}
                    />
                    <p className="text-xs text-muted-foreground mt-4 text-center font-arabic">
                      العميل يصور الباركود ويختار طريقة العرض
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <QrCode className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground font-arabic">
                      لم يتم إنشاء رابط مشاركة بعد
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="download" className="mt-0">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-4 shadow-lg">
                    <FileText className="w-12 h-12 text-white" />
                  </div>

                  <div className="text-center mb-4">
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
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
