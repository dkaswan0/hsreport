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
          "relative w-full text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 rounded-2xl",
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
        <svg 
          viewBox="0 0 800 280" 
          className="w-full h-auto"
          style={{ filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.5))' }}
        >
          <defs>
            <linearGradient id="panelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1a1a1a" />
              <stop offset="50%" stopColor="#0d0d0d" />
              <stop offset="100%" stopColor="#0a0a0a" />
            </linearGradient>
            
            <linearGradient id="glassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.02)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
            </linearGradient>
            
            <linearGradient id="lcdGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0a0a0a" />
              <stop offset="100%" stopColor="#050505" />
            </linearGradient>
            
            <linearGradient id="digitGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#e0e0e0" />
              <stop offset="100%" stopColor="#b0b0b0" />
            </linearGradient>
            
            <linearGradient id="blueGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e40af" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1e40af" />
            </linearGradient>
            
            <radialGradient id="speedometerGradient" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#0d0d0d" />
              <stop offset="100%" stopColor="#1a1a1a" />
            </radialGradient>
            
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            <filter id="lcdGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            <clipPath id="panelClip">
              <rect x="10" y="10" width="780" height="260" rx="20" />
            </clipPath>
          </defs>
          
          <rect x="0" y="0" width="800" height="280" rx="25" fill="url(#panelGradient)" />
          <rect x="2" y="2" width="796" height="276" rx="23" fill="none" stroke="#2a2a2a" strokeWidth="1" />
          
          <g clipPath="url(#panelClip)">
            <circle cx="120" cy="140" r="110" fill="url(#speedometerGradient)" />
            <circle cx="120" cy="140" r="108" fill="none" stroke="#333" strokeWidth="1" />
            
            {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260].map((speed, i) => {
              const angle = -225 + (i * 19.3);
              const rad = (angle * Math.PI) / 180;
              const x1 = 120 + 85 * Math.cos(rad);
              const y1 = 140 + 85 * Math.sin(rad);
              const x2 = 120 + 95 * Math.cos(rad);
              const y2 = 140 + 95 * Math.sin(rad);
              const textX = 120 + 70 * Math.cos(rad);
              const textY = 140 + 70 * Math.sin(rad);
              return (
                <g key={speed}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#666" strokeWidth="2" />
                  <text x={textX} y={textY} fill="#888" fontSize="10" textAnchor="middle" dominantBaseline="middle">
                    {speed}
                  </text>
                </g>
              );
            })}
            
            <text x="120" y="100" fill="#666" fontSize="8" textAnchor="middle">km/h</text>
            
            <circle cx="680" cy="140" r="110" fill="url(#speedometerGradient)" />
            <circle cx="680" cy="140" r="108" fill="none" stroke="#333" strokeWidth="1" />
            
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((rpm, i) => {
              const angle = -225 + (i * 33.75);
              const rad = (angle * Math.PI) / 180;
              const x1 = 680 + 85 * Math.cos(rad);
              const y1 = 140 + 85 * Math.sin(rad);
              const x2 = 680 + 95 * Math.cos(rad);
              const y2 = 140 + 95 * Math.sin(rad);
              const textX = 680 + 70 * Math.cos(rad);
              const textY = 140 + 70 * Math.sin(rad);
              const isRedZone = rpm >= 6;
              return (
                <g key={rpm}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={isRedZone ? "#ef4444" : "#666"} strokeWidth="2" />
                  <text x={textX} y={textY} fill={isRedZone ? "#ef4444" : "#888"} fontSize="10" textAnchor="middle" dominantBaseline="middle">
                    {rpm}
                  </text>
                </g>
              );
            })}
            
            <text x="680" y="100" fill="#666" fontSize="8" textAnchor="middle">x1000/min</text>
            
            <rect x="230" y="50" width="340" height="180" rx="10" fill="url(#lcdGradient)" />
            <rect x="232" y="52" width="336" height="176" rx="8" fill="none" stroke="#1a1a1a" strokeWidth="1" />
            <rect x="230" y="50" width="340" height="180" rx="10" fill="url(#glassGradient)" />
            
            <line x1="250" y1="75" x2="550" y2="75" stroke="url(#blueGlow)" strokeWidth="1" opacity="0.5" />
            
            <text x="400" y="95" fill="#3b82f6" fontSize="11" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="3">
              MERCEDES-MAYBACH
            </text>
            
            <g filter="url(#lcdGlow)">
              <text 
                x="400" 
                y="155" 
                fill="url(#digitGradient)" 
                fontSize="52" 
                textAnchor="middle" 
                fontFamily="'SF Pro Display', 'Segoe UI', Arial, sans-serif"
                fontWeight="300"
                letterSpacing="4"
              >
                {displayNumber}
              </text>
            </g>
            
            <text x="400" y="180" fill="#666" fontSize="12" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="2">
              km
            </text>
            
            <rect x="340" y="195" width="120" height="22" rx="3" fill="#0a0a0a" stroke="#222" strokeWidth="1" />
            <text x="400" y="210" fill="#555" fontSize="9" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="1">
              ODOMETER
            </text>
            
            <circle cx="260" cy="210" r="4" fill="#22c55e" filter="url(#glow)" />
            <text x="272" y="213" fill="#555" fontSize="8">ECO</text>
            
            <circle cx="520" cy="210" r="4" fill="#3b82f6" filter="url(#glow)" />
            <text x="532" y="213" fill="#555" fontSize="8">READY</text>
            
            <text x="400" y="65" fill="#444" fontSize="9" textAnchor="middle">
              21°C
            </text>
            
            <line x1="250" y1="225" x2="550" y2="225" stroke="#222" strokeWidth="1" />
          </g>
          
          <rect x="0" y="0" width="800" height="280" rx="25" fill="url(#glassGradient)" />
        </svg>
        
        {odometerPhoto && (
          <div className="absolute bottom-3 left-0 right-0 flex flex-col items-center">
            <div className="bg-black/80 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 text-amber-400 group-hover:text-amber-300 transition-colors">
              <Eye className="w-4 h-4" />
              <span className="text-xs font-arabic">اضغط لكشف عداد سيارتك</span>
            </div>
          </div>
        )}
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
