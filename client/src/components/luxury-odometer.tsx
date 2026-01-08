import { useState } from "react";
import { Gauge, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface LuxuryOdometerProps {
  odometer: number;
  odometerPhoto?: string | null;
  className?: string;
}

export function LuxuryOdometer({ odometer, odometerPhoto, className }: LuxuryOdometerProps) {
  const [showPhoto, setShowPhoto] = useState(false);
  
  const formattedOdometer = odometer?.toLocaleString('en-US') || '0';
  const digits = formattedOdometer.replace(/,/g, '').padStart(7, '0').split('');
  
  return (
    <>
      <button
        type="button"
        className={cn(
          "relative w-full text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 rounded-2xl",
          odometerPhoto && "cursor-pointer",
          className
        )}
        onClick={() => odometerPhoto && setShowPhoto(true)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && odometerPhoto) {
            e.preventDefault();
            setShowPhoto(true);
          }
        }}
        aria-label={odometerPhoto ? "اضغط لعرض صورة العداد" : "عداد السيارة"}
        data-testid="button-odometer-reveal"
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl border border-slate-700/50">
          <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Gauge className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-cyan-400 text-xs font-medium tracking-wider uppercase">Odometer</span>
              </div>
              <span className="text-slate-500 text-xs">KM</span>
            </div>
            
            <div className="flex items-center justify-center gap-1 py-4">
              {digits.map((digit, index) => (
                <div 
                  key={index}
                  className="relative w-10 h-14 bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg border border-slate-700/50 flex items-center justify-center shadow-inner overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent h-1/2 pointer-events-none" />
                  <span className="text-2xl font-bold text-white font-mono tracking-tight drop-shadow-lg">
                    {digit}
                  </span>
                  <div className="absolute inset-x-0 top-1/2 h-px bg-slate-700/50" />
                </div>
              ))}
            </div>
            
            {odometerPhoto && (
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <div className="flex items-center justify-center gap-2 text-cyan-400 group-hover:text-cyan-300 transition-colors">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm font-arabic">اضغط لكشف عداد سيارتك</span>
                </div>
                <div className="mt-2 flex justify-center">
                  <div className="h-1 w-16 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent rounded-full animate-pulse" />
                </div>
              </div>
            )}
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        </div>
      </button>

      {showPhoto && odometerPhoto && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setShowPhoto(false)}
          data-testid="modal-odometer-photo"
        >
          <button 
            className="absolute top-4 right-4 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
            onClick={() => setShowPhoto(false)}
            data-testid="button-close-odometer-photo"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="max-w-2xl w-full space-y-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <h3 className="text-white text-xl font-bold font-arabic mb-2">صورة العداد الحقيقية</h3>
              <p className="text-slate-400 text-sm font-arabic">Real Odometer Photo</p>
            </div>
            
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-cyan-500/30">
              <img 
                src={odometerPhoto} 
                alt="صورة العداد" 
                className="w-full h-auto object-contain bg-slate-900"
                data-testid="img-odometer-photo"
              />
            </div>
            
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <Gauge className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs font-arabic">قراءة العداد</p>
                    <p className="text-white text-sm">Odometer Reading</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-cyan-400 font-mono">{formattedOdometer}</p>
                  <p className="text-slate-500 text-xs">KM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
