import React from 'react';

interface CarBlueprintPinpointProps {
  category: string;
  className?: string;
  dotColor?: string;
}

export function CarBlueprintPinpoint({
  category,
  className = "w-20 h-36",
  dotColor = "#09090b",
}: CarBlueprintPinpointProps) {
  // Map category to relative percentages (x%, y%) on top-down car outline
  const getCoordinates = (cat: string): { x: number; y: number } => {
    const c = (cat || '').toLowerCase();
    
    if (c.includes('front_bumper') || c.includes('front_chest') || c.includes('bumper_frame_front') || c.includes('front') || c.includes('الواجهة الأمامية') || c.includes('الصدام الأمامي')) {
      return { x: 50, y: 14 };
    }
    if (c.includes('hood') || c.includes('engine') || c.includes('radiator') || c.includes('ac_cooling') || c.includes('المحرك') || c.includes('الكبوت')) {
      return { x: 50, y: 26 };
    }
    if (c.includes('front_left') || c.includes('door_front_left') || c.includes('fender_front_left') || c.includes('الأيسر الأمامي') || c.includes('يسار')) {
      return { x: 24, y: 36 };
    }
    if (c.includes('front_right') || c.includes('door_front_right') || c.includes('fender_front_right') || c.includes('الأيمن الأمامي') || c.includes('يمين')) {
      return { x: 76, y: 36 };
    }
    if (c.includes('roof') || c.includes('interior') || c.includes('windows') || c.includes('pillars') || c.includes('السقف') || c.includes('المقصورة')) {
      return { x: 50, y: 50 };
    }
    if (c.includes('rear_left') || c.includes('door_rear_left') || c.includes('fender_rear_left') || c.includes('الأيسر الخلفي')) {
      return { x: 24, y: 64 };
    }
    if (c.includes('rear_right') || c.includes('door_rear_right') || c.includes('fender_rear_right') || c.includes('الأيمن الخلفي')) {
      return { x: 76, y: 64 };
    }
    if (c.includes('trunk') || c.includes('rear_bumper') || c.includes('rear_chest') || c.includes('bumper_frame_rear') || c.includes('rear') || c.includes('صندوق') || c.includes('الخلفي')) {
      return { x: 70, y: 86 };
    }
    if (c.includes('brake') || c.includes('tire') || c.includes('wheel') || c.includes('suspension') || c.includes('الإطارات') || c.includes('الفرامل')) {
      return { x: 22, y: 32 };
    }
    if (c.includes('chassis') || c.includes('transmission') || c.includes('exhaust') || c.includes('fuel') || c.includes('الشاصي') || c.includes('القير')) {
      return { x: 50, y: 68 };
    }
    return { x: 50, y: 84 };
  };

  const { x, y } = getCoordinates(category);

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      {/* Top-down crisp car vector outline */}
      <svg
        viewBox="0 0 100 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-slate-400 stroke-current"
        style={{ strokeWidth: 1.5 }}
      >
        {/* Outer car body */}
        <path
          d="M 30 15 
             C 40 8, 60 8, 70 15 
             C 80 22, 85 45, 85 70 
             C 85 95, 87 135, 87 165 
             C 87 185, 75 192, 50 192 
             C 25 192, 13 185, 13 165 
             C 13 135, 15 95, 15 70 
             C 15 45, 20 22, 30 15 Z"
          fill="#f8fafc"
          stroke="#94a3b8"
          strokeWidth="1.8"
        />

        {/* Front Windshield */}
        <path
          d="M 24 58 C 36 50, 64 50, 76 58 C 74 72, 72 74, 72 74 L 28 74 C 28 74, 26 72, 24 58 Z"
          fill="#e2e8f0"
          stroke="#cbd5e1"
          strokeWidth="1.2"
        />

        {/* Roof */}
        <rect
          x="28"
          y="76"
          width="44"
          height="54"
          rx="4"
          fill="#ffffff"
          stroke="#cbd5e1"
          strokeWidth="1.2"
        />

        {/* Rear Windshield */}
        <path
          d="M 28 132 L 72 132 C 74 132, 76 138, 76 146 C 64 142, 36 142, 24 146 C 24 138, 26 132, 28 132 Z"
          fill="#e2e8f0"
          stroke="#cbd5e1"
          strokeWidth="1.2"
        />

        {/* Side Mirrors */}
        <path d="M 12 52 C 8 50, 7 56, 12 60 Z" fill="#94a3b8" />
        <path d="M 88 52 C 92 50, 93 56, 88 60 Z" fill="#94a3b8" />

        {/* Wheels / Tires */}
        <rect x="9" y="32" width="5" height="18" rx="2" fill="#64748b" />
        <rect x="86" y="32" width="5" height="18" rx="2" fill="#64748b" />
        <rect x="9" y="145" width="5" height="18" rx="2" fill="#64748b" />
        <rect x="86" y="145" width="5" height="18" rx="2" fill="#64748b" />
      </svg>

      {/* Pinpoint Solid & Glowing Indicator (Reliable for Web & PDF Export) */}
      <div
        className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center"
        style={{ left: `${x}%`, top: `${y}%` }}
      >
        <span
          className="absolute inline-flex h-4 w-4 rounded-full opacity-40"
          style={{ backgroundColor: dotColor }}
        />
        <span
          className="relative inline-flex rounded-full h-3 w-3 border-2 border-white shadow-md"
          style={{ backgroundColor: dotColor }}
        />
      </div>
    </div>
  );
}

export default CarBlueprintPinpoint;
