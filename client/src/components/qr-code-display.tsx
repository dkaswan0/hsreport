import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';
import newLogoPath from "@assets/2d686a58-6e3c-4416-ab74-162301834ccb_1768145790398.jpg";

const BRAND = {
  navy: '#0C1A28',
  gold: '#C5852C',
  goldLight: '#FFD700'
};

interface QRCodeDisplayProps {
  token: string;
  inspectionId: number;
  vehicleName?: string;
  size?: number;
  showActions?: boolean;
}

export function QRCodeDisplay({ 
  token, 
  inspectionId,
  vehicleName,
  size = 200,
  showActions = true 
}: QRCodeDisplayProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  
  const handoffUrl = `${window.location.origin}/handoff/${token}`;

  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    canvas.width = size + 80;
    canvas.height = size + 140;
    
    img.onload = () => {
      if (!ctx) return;
      
      ctx.fillStyle = BRAND.navy;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = 'white';
      ctx.fillRect(30, 30, size + 20, size + 20);
      
      ctx.drawImage(img, 40, 40, size, size);
      
      ctx.fillStyle = BRAND.gold;
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('HIGH SAFETY', canvas.width / 2, size + 75);
      
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.fillText(`Report #${inspectionId}`, canvas.width / 2, size + 95);
      
      if (vehicleName) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '10px Arial';
        ctx.fillText(vehicleName, canvas.width / 2, size + 115);
      }
      
      const link = document.createElement('a');
      link.download = `qr-report-${inspectionId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `تقرير فحص السيارة - High Safety`,
          text: vehicleName ? `تقرير فحص ${vehicleName}` : 'تقرير فحص السيارة',
          url: handoffUrl
        });
      } catch (err) {
        navigator.clipboard.writeText(handoffUrl);
      }
    } else {
      navigator.clipboard.writeText(handoffUrl);
    }
  };

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* QR Code Container */}
      <div 
        ref={qrRef}
        className="relative p-4 rounded-2xl shadow-xl"
        style={{ 
          background: `linear-gradient(135deg, ${BRAND.navy} 0%, #1a2d3d 100%)`,
          border: `2px solid ${BRAND.gold}30`
        }}
      >
        {/* Corner decorations */}
        <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2" style={{ borderColor: BRAND.gold }} />
        <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2" style={{ borderColor: BRAND.gold }} />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2" style={{ borderColor: BRAND.gold }} />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2" style={{ borderColor: BRAND.gold }} />
        
        {/* QR Code with white background */}
        <div className="bg-white p-3 rounded-xl">
          <QRCodeSVG
            value={handoffUrl}
            size={size}
            level="H"
            includeMargin={false}
            bgColor="#FFFFFF"
            fgColor={BRAND.navy}
            imageSettings={{
              src: newLogoPath,
              height: size * 0.22,
              width: size * 0.22,
              excavate: true,
            }}
          />
        </div>

        {/* Label */}
        <div className="mt-3 text-center">
          <p className="font-bold text-sm" style={{ color: BRAND.gold }}>HIGH SAFETY</p>
          <p className="text-white/60 text-xs">امسح للوصول للتقرير</p>
          <p className="text-white/40 text-[10px] mt-1">Scan to access report</p>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadQR}
            className="gap-2"
            data-testid="button-download-qr"
          >
            <Download className="w-4 h-4" />
            <span className="font-arabic text-xs">تحميل QR</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-2"
            data-testid="button-share-qr"
          >
            <Share2 className="w-4 h-4" />
            <span className="font-arabic text-xs">مشاركة</span>
          </Button>
        </div>
      )}
    </motion.div>
  );
}

export function QRCodeMini({ token, size = 80 }: { token: string; size?: number }) {
  const handoffUrl = `${window.location.origin}/handoff/${token}`;
  
  return (
    <div className="bg-white p-2 rounded-lg inline-block">
      <QRCodeSVG
        value={handoffUrl}
        size={size}
        level="M"
        bgColor="#FFFFFF"
        fgColor={BRAND.navy}
      />
    </div>
  );
}
