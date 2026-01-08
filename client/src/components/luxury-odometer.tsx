import { useState } from "react";
import { X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import odometerBg from "@assets/generated_images/mercedes_maybach_digital_odometer_display.png";

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
        <div className="relative overflow-hidden rounded-xl shadow-2xl">
          <img 
            src={odometerBg} 
            alt="Mercedes Maybach Dashboard" 
            className="w-full h-auto object-cover"
          />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative text-center">
              <div className="flex items-baseline justify-center gap-1">
                {displayNumber.split('').map((digit, index) => (
                  <span 
                    key={index}
                    className="text-4xl md:text-5xl lg:text-6xl font-light text-white drop-shadow-lg"
                    style={{ 
                      fontFamily: "'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif",
                      textShadow: '0 0 20px rgba(255,255,255,0.3), 0 0 40px rgba(255,255,255,0.1)'
                    }}
                  >
                    {digit}
                  </span>
                ))}
                <span 
                  className="text-lg md:text-xl text-white/60 ml-2 font-light"
                  style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif" }}
                >
                  km
                </span>
              </div>
              
              <div className="mt-2 text-white/40 text-xs tracking-[0.3em] uppercase">
                ODO
              </div>
            </div>
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
          
          {odometerPhoto && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
              <div className="flex items-center justify-center gap-2 text-amber-400 group-hover:text-amber-300 transition-colors">
                <Eye className="w-4 h-4" />
                <span className="text-sm font-arabic">اضغط لكشف عداد سيارتك</span>
              </div>
              <div className="mt-2 flex justify-center">
                <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent rounded-full animate-pulse" />
              </div>
            </div>
          )}
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
