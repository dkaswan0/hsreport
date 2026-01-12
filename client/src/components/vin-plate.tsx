import { cn } from "@/lib/utils";
import { useState } from "react";
import { X, ZoomIn } from "lucide-react";

interface VinPlateProps {
  vin: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  vinPhoto?: string | null;
  className?: string;
}

export function VinPlate({ vin, make, model, year, vinPhoto, className }: VinPlateProps) {
  const displayVin = vin || "XXXXXXXXXXXXXXXXX";
  const [showPhoto, setShowPhoto] = useState(false);
  
  return (
    <>
    <div 
      className={cn(
        "relative overflow-hidden rounded-lg",
        vinPhoto && "cursor-pointer group",
        className
      )}
      style={{
        background: 'linear-gradient(145deg, #d4d4d8 0%, #a1a1aa 25%, #d4d4d8 50%, #a1a1aa 75%, #d4d4d8 100%)',
        boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.15)',
      }}
      onClick={() => vinPhoto && setShowPhoto(true)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && vinPhoto) {
          setShowPhoto(true);
        }
      }}
      role={vinPhoto ? "button" : undefined}
      tabIndex={vinPhoto ? 0 : undefined}
      aria-label={vinPhoto ? "اضغط لعرض صورة لوحة الشاصي" : "لوحة الشاصي"}
    >
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      <div className="relative px-4 py-3 space-y-2">
        <div className="flex items-center justify-between border-b border-zinc-500/30 pb-2">
          <div 
            className="text-[10px] font-bold tracking-widest uppercase"
            style={{ 
              color: '#3f3f46',
              textShadow: '0 1px 0 rgba(255,255,255,0.5)',
            }}
          >
            {make ? make.toUpperCase() : 'MANUFACTURER'}
          </div>
          <div 
            className="text-[10px] font-bold"
            style={{ 
              color: '#3f3f46',
              textShadow: '0 1px 0 rgba(255,255,255,0.5)',
            }}
          >
            {year || '----'}
          </div>
        </div>

        {model && (
          <div 
            className="text-[11px] font-bold text-center tracking-wide"
            style={{ 
              color: '#27272a',
              textShadow: '0 1px 0 rgba(255,255,255,0.4)',
            }}
          >
            {model.toUpperCase()}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <div 
            className="text-[9px] font-bold uppercase shrink-0"
            style={{ 
              color: '#52525b',
              textShadow: '0 1px 0 rgba(255,255,255,0.5)',
            }}
          >
            VIN
          </div>
          
          <div 
            className="flex-1 py-1.5 px-2 rounded"
            style={{
              background: 'linear-gradient(180deg, #fafafa 0%, #e4e4e7 100%)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15), 0 1px 0 rgba(255,255,255,0.5)',
            }}
          >
            <div 
              className="font-mono font-black text-sm tracking-[0.15em] text-center"
              style={{ 
                color: '#18181b',
                textShadow: '0 0.5px 0 rgba(0,0,0,0.3)',
                letterSpacing: '0.12em',
              }}
              data-testid="vin-number"
            >
              {displayVin}
            </div>
          </div>
        </div>

        <div 
          className="text-[8px] text-center tracking-wide pt-1 border-t border-zinc-500/20"
          style={{ 
            color: '#52525b',
            textShadow: '0 1px 0 rgba(255,255,255,0.4)',
          }}
        >
          MANUFACTURED IN COMPLIANCE WITH MOTOR VEHICLE STANDARDS
        </div>
      </div>

      <div 
        className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #a1a1aa, #52525b)',
          boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.3), 0 1px 1px rgba(255,255,255,0.3)',
        }}
      />
      <div 
        className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #a1a1aa, #52525b)',
          boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.3), 0 1px 1px rgba(255,255,255,0.3)',
        }}
      />

      {/* Photo indicator */}
      {vinPhoto && (
        <div className="absolute bottom-2 right-2 p-1.5 bg-primary/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="w-3 h-3 text-white" />
        </div>
      )}
    </div>

    {/* Photo Modal */}
    {showPhoto && vinPhoto && (
      <div 
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
        onClick={() => setShowPhoto(false)}
      >
        <button
          onClick={() => setShowPhoto(false)}
          className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          data-testid="button-close-vin-photo"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        <img
          src={vinPhoto}
          alt="صورة لوحة الشاصي الأصلية"
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
        />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-arabic">
          صورة لوحة الشاصي الأصلية
        </div>
      </div>
    )}
    </>
  );
}

export function VinPlatePdf({ vin, make, model, year }: VinPlateProps) {
  const displayVin = vin || "XXXXXXXXXXXXXXXXX";
  
  return (
    <div 
      style={{
        background: 'linear-gradient(145deg, #d4d4d8, #a1a1aa, #d4d4d8)',
        borderRadius: '8px',
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        position: 'relative',
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        borderBottom: '1px solid rgba(82, 82, 91, 0.3)',
        paddingBottom: '6px',
        marginBottom: '6px',
      }}>
        <span style={{ 
          fontSize: '9px', 
          fontWeight: 'bold', 
          color: '#3f3f46',
          letterSpacing: '1px',
        }}>
          {make ? make.toUpperCase() : 'MANUFACTURER'}
        </span>
        <span style={{ 
          fontSize: '9px', 
          fontWeight: 'bold', 
          color: '#3f3f46',
        }}>
          {year || '----'}
        </span>
      </div>

      {model && (
        <div style={{ 
          fontSize: '10px', 
          fontWeight: 'bold', 
          color: '#27272a',
          textAlign: 'center',
          marginBottom: '6px',
        }}>
          {model.toUpperCase()}
        </div>
      )}

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
      }}>
        <span style={{ 
          fontSize: '8px', 
          fontWeight: 'bold', 
          color: '#52525b',
        }}>
          VIN
        </span>
        <div style={{
          flex: 1,
          background: 'linear-gradient(180deg, #fafafa, #e4e4e7)',
          borderRadius: '4px',
          padding: '6px 8px',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15)',
        }}>
          <div style={{ 
            fontFamily: 'monospace',
            fontWeight: 900,
            fontSize: '11px',
            color: '#18181b',
            letterSpacing: '2px',
            textAlign: 'center',
          }}>
            {displayVin}
          </div>
        </div>
      </div>

      <div style={{ 
        fontSize: '7px', 
        color: '#52525b',
        textAlign: 'center',
        marginTop: '6px',
        borderTop: '1px solid rgba(82, 82, 91, 0.2)',
        paddingTop: '4px',
      }}>
        MANUFACTURED IN COMPLIANCE WITH MOTOR VEHICLE STANDARDS
      </div>

      <div style={{
        position: 'absolute',
        top: '8px',
        left: '8px',
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: 'radial-gradient(circle at 30% 30%, #a1a1aa, #52525b)',
      }} />
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: 'radial-gradient(circle at 30% 30%, #a1a1aa, #52525b)',
      }} />
    </div>
  );
}
