import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, CloudUpload } from 'lucide-react';
import { OfflineSyncService } from '@/lib/offline-sync';
import { useToast } from '@/hooks/use-toast';

export const OfflineStatusBanner: React.FC = () => {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = OfflineSyncService.subscribe((online, count) => {
      setIsOnline(online);
      setQueueCount(count);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) {
      toast({
        title: 'لا يوجد اتصال بالإنترنت',
        description: 'يرجى الاتصال بالشبكة أولاً لبدء مزامنة الفحوصات المحفوظة محلياً.',
        variant: 'destructive'
      });
      return;
    }

    setIsSyncing(true);
    try {
      const res = await OfflineSyncService.syncPendingQueue();
      if (res.syncedCount > 0) {
        toast({
          title: '✨ تمت المزامنة بنجاح',
          description: `تم رفع ${res.syncedCount} فحص/مسودة إلى السيرفر الرئيسي.`
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline && queueCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-in slide-in-from-bottom-2 font-arabic" dir="rtl">
      {!isOnline ? (
        <div className="bg-rose-950/90 border border-rose-600/50 text-white px-3.5 py-2 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-2.5 text-xs">
          <WifiOff className="w-4 h-4 text-rose-400 animate-pulse" />
          <div>
            <span className="font-bold">وضع بدون إنترنت</span>
            {queueCount > 0 && (
              <span className="text-rose-200 text-[11px] block font-mono">
                {queueCount} فحص محفوظ محلياً
              </span>
            )}
          </div>
        </div>
      ) : queueCount > 0 ? (
        <button
          type="button"
          onClick={handleManualSync}
          disabled={isSyncing}
          className="bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer"
        >
          {isSyncing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <CloudUpload className="w-4 h-4" />
          )}
          <span>جارٍ مزامنة ({queueCount}) فحص مع السيرفر</span>
        </button>
      ) : null}
    </div>
  );
};
