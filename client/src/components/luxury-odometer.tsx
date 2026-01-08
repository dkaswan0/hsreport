import { useState } from "react";
import { X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface LuxuryOdometerProps {
  odometer: number;
  odometerPhoto?: string | null;
  className?: string;
}

export function LuxuryOdometer({ odometer, odometerPhoto, className }: LuxuryOdometerProps) {
  const [showPhoto, setShowPhoto] = useState(false);
  
  const formattedOdometer = odometer?.toLocaleString('en-US') || '0';
  const displayNumber = odometer?.toString() || '0';
  
  return (
    <>
      <button
        type="button"
        className={cn(
          "relative w-full text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 rounded-xl",
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
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 p-5 shadow-2xl border border-neutral-800">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/5 via-transparent to-amber-900/5 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="bg-gradient-to-b from-neutral-900 to-black rounded-lg p-4 border border-neutral-800 shadow-inner">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
                  <span className="text-neutral-500 text-[10px] font-medium tracking-[0.2em] uppercase">ODO</span>
                </div>
                <span className="text-neutral-600 text-[10px] tracking-wider">km</span>
              </div>
              
              <div className="relative bg-gradient-to-b from-black via-neutral-950 to-black rounded-md p-3 border border-neutral-800/50">
                <div className="absolute inset-0 bg-gradient-to-t from-white/[0.02] to-transparent pointer-events-none rounded-md" />
                
                <div className="flex items-center justify-end gap-0.5">
                  {displayNumber.padStart(7, ' ').split('').map((char, index) => (
                    <div 
                      key={index}
                      className={cn(
                        "relative flex items-center justify-center",
                        char === ' ' ? "w-5" : "w-7 h-10"
                      )}
                    >
                      {char !== ' ' && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/50 to-transparent rounded-sm" />
                          <span 
                            className="relative text-2xl font-light tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-200 to-neutral-400"
                            style={{ fontFamily: "'SF Pro Display', 'Segoe UI', system-ui, sans-serif" }}
                          >
                            {char}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="absolute bottom-1 right-3 text-neutral-600 text-[8px] tracking-widest">TOTAL</div>
              </div>
              
              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-neutral-700" />
                  <div className="w-1 h-1 rounded-full bg-neutral-700" />
                  <div className="w-1 h-1 rounded-full bg-neutral-700" />
                </div>
                <div className="h-px flex-1 mx-3 bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800" />
                <span className="text-amber-500/80 text-[9px] tracking-wider font-medium">MAYBACH</span>
              </div>
            </div>
            
            {odometerPhoto && (
              <div className="mt-4 pt-3 border-t border-neutral-800">
                <div className="flex items-center justify-center gap-2 text-amber-500/80 group-hover:text-amber-400 transition-colors">
                  <Eye className="w-4 h-4" />
                  <span className="text-xs font-arabic">اضغط لكشف عداد سيارتك</span>
                </div>
                <div className="mt-2 flex justify-center">
                  <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent rounded-full animate-pulse" />
                </div>
              </div>
            )}
          </div>
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
              <p className="text-neutral-400 text-sm font-arabic">Real Odometer Photo</p>
            </div>
            
            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-amber-500/30">
              <img 
                src={odometerPhoto} 
                alt="صورة العداد" 
                className="w-full h-auto object-contain bg-neutral-950"
                data-testid="img-odometer-photo"
              />
            </div>
            
            <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 rounded-xl p-5 border border-neutral-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-500 text-xs font-arabic mb-1">قراءة العداد</p>
                  <p className="text-neutral-600 text-xs">Odometer Reading</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-light text-white tracking-wide">{formattedOdometer}</p>
                  <p className="text-neutral-600 text-xs tracking-wider">KM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
