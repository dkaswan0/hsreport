import { useState } from "react";
import { cn } from "@/lib/utils";
import type { InspectionItem } from "@shared/schema";

interface Car3DDiagramProps {
  items: InspectionItem[];
  onPartClick?: (partId: string) => void;
  activeCategory?: string;
}

interface CarPart {
  id: string;
  label: string;
  labelEn: string;
  path: string;
  category: string;
}

const CAR_PARTS: CarPart[] = [
  // Front
  { id: "front_bumper", label: "الدعامية الأمامية", labelEn: "Front Bumper", category: "front_bumper", path: "M 80 120 Q 150 100 220 120 L 230 140 Q 150 130 70 140 Z" },
  { id: "hood", label: "غطاء المحرك", labelEn: "Hood", category: "hood", path: "M 75 140 Q 150 125 225 140 L 220 200 Q 150 185 80 200 Z" },
  { id: "front_left_fender", label: "الرفرف الأمامي أيسر", labelEn: "Front Left Fender", category: "front_left_fender", path: "M 60 140 L 75 140 L 80 200 L 60 210 Q 50 175 60 140" },
  { id: "front_right_fender", label: "الرفرف الأمامي أيمن", labelEn: "Front Right Fender", category: "front_right_fender", path: "M 240 140 L 225 140 L 220 200 L 240 210 Q 250 175 240 140" },
  { id: "front_left_headlight", label: "الأنوار الأمامية يسار", labelEn: "Left Headlight", category: "front_lights", path: "M 85 115 L 110 110 L 115 130 L 85 135 Z" },
  { id: "front_right_headlight", label: "الأنوار الأمامية يمين", labelEn: "Right Headlight", category: "front_lights", path: "M 215 115 L 190 110 L 185 130 L 215 135 Z" },
  { id: "grille", label: "الشبك", labelEn: "Grille", category: "grille", path: "M 115 115 L 185 115 L 185 135 L 115 135 Z" },
  
  // Windshield & Roof
  { id: "windshield", label: "الزجاج الأمامي", labelEn: "Windshield", category: "windshield", path: "M 85 200 Q 150 190 215 200 L 200 240 Q 150 230 100 240 Z" },
  { id: "roof", label: "السقف", labelEn: "Roof", category: "roof", path: "M 95 240 Q 150 230 205 240 L 200 320 Q 150 310 100 320 Z" },
  { id: "rear_windshield", label: "الزجاج الخلفي", labelEn: "Rear Windshield", category: "rear_windshield", path: "M 100 320 Q 150 310 200 320 L 210 355 Q 150 345 90 355 Z" },
  
  // Doors
  { id: "front_left_door", label: "الباب الأمامي أيسر", labelEn: "Front Left Door", category: "front_left_door", path: "M 55 210 L 80 200 L 95 280 L 65 290 Q 50 250 55 210" },
  { id: "front_right_door", label: "الباب الأمامي أيمن", labelEn: "Front Right Door", category: "front_right_door", path: "M 245 210 L 220 200 L 205 280 L 235 290 Q 250 250 245 210" },
  { id: "rear_left_door", label: "الباب الخلفي أيسر", labelEn: "Rear Left Door", category: "rear_left_door", path: "M 65 290 L 95 280 L 100 360 L 70 370 Q 60 330 65 290" },
  { id: "rear_right_door", label: "الباب الخلفي أيمن", labelEn: "Rear Right Door", category: "rear_right_door", path: "M 235 290 L 205 280 L 200 360 L 230 370 Q 240 330 235 290" },
  
  // Rear
  { id: "trunk", label: "الصندوق", labelEn: "Trunk", category: "trunk", path: "M 85 355 Q 150 340 215 355 L 220 400 Q 150 390 80 400 Z" },
  { id: "rear_bumper", label: "الدعامية الخلفية", labelEn: "Rear Bumper", category: "rear_bumper", path: "M 75 400 Q 150 390 225 400 L 230 420 Q 150 430 70 420 Z" },
  { id: "rear_left_taillight", label: "الأنوار الخلفية يسار", labelEn: "Left Taillight", category: "rear_lights", path: "M 80 395 L 105 390 L 105 415 L 80 420 Z" },
  { id: "rear_right_taillight", label: "الأنوار الخلفية يمين", labelEn: "Right Taillight", category: "rear_lights", path: "M 220 395 L 195 390 L 195 415 L 220 420 Z" },
  
  // Quarter Panels
  { id: "rear_left_quarter", label: "الرفرف الخلفي أيسر", labelEn: "Rear Left Quarter", category: "rear_left_quarter", path: "M 70 370 L 100 360 L 90 395 L 75 400 Q 65 385 70 370" },
  { id: "rear_right_quarter", label: "الرفرف الخلفي أيمن", labelEn: "Rear Right Quarter", category: "rear_right_quarter", path: "M 230 370 L 200 360 L 210 395 L 225 400 Q 235 385 230 370" },
  
  // Wheels
  { id: "front_left_wheel", label: "الإطار الأمامي أيسر", labelEn: "Front Left Wheel", category: "wheels", path: "M 45 185 A 25 25 0 1 1 45 235 A 25 25 0 1 1 45 185" },
  { id: "front_right_wheel", label: "الإطار الأمامي أيمن", labelEn: "Front Right Wheel", category: "wheels", path: "M 255 185 A 25 25 0 1 1 255 235 A 25 25 0 1 1 255 185" },
  { id: "rear_left_wheel", label: "الإطار الخلفي أيسر", labelEn: "Rear Left Wheel", category: "wheels", path: "M 45 335 A 25 25 0 1 1 45 385 A 25 25 0 1 1 45 335" },
  { id: "rear_right_wheel", label: "الإطار الخلفي أيمن", labelEn: "Rear Right Wheel", category: "wheels", path: "M 255 335 A 25 25 0 1 1 255 385 A 25 25 0 1 1 255 335" },
  
  // Mirrors
  { id: "left_mirror", label: "المرآة اليسرى", labelEn: "Left Mirror", category: "mirrors", path: "M 48 215 L 35 210 L 35 225 L 48 230 Z" },
  { id: "right_mirror", label: "المرآة اليمنى", labelEn: "Right Mirror", category: "mirrors", path: "M 252 215 L 265 210 L 265 225 L 252 230 Z" },
];

function getSeverityColor(severity: string): { fill: string; stroke: string; glow: string } {
  switch (severity) {
    case "high":
      return { fill: "#ef444480", stroke: "#dc2626", glow: "0 0 15px #ef4444" };
    case "medium":
      return { fill: "#f9731680", stroke: "#ea580c", glow: "0 0 15px #f97316" };
    case "low":
      return { fill: "#eab30880", stroke: "#ca8a04", glow: "0 0 15px #eab308" };
    default:
      return { fill: "#22c55e30", stroke: "#16a34a", glow: "none" };
  }
}

function getPartSeverity(partId: string, items: InspectionItem[]): string | null {
  const partItems = items.filter(item => item.category === partId);
  if (partItems.length === 0) return null;
  
  if (partItems.some(i => i.severity === "high")) return "high";
  if (partItems.some(i => i.severity === "medium")) return "medium";
  if (partItems.some(i => i.severity === "low")) return "low";
  return null;
}

export function Car3DDiagram({ items, onPartClick, activeCategory }: Car3DDiagramProps) {
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-700/50 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent"></div>
      
      <div className="absolute top-4 right-4 flex flex-col gap-2 text-xs z-10">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500/80 shadow-lg shadow-red-500/50"></div>
          <span className="text-slate-300">خطير - High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-orange-500/80 shadow-lg shadow-orange-500/50"></div>
          <span className="text-slate-300">متوسط - Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-yellow-500/80 shadow-lg shadow-yellow-500/50"></div>
          <span className="text-slate-300">بسيط - Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500/30 border border-green-500"></div>
          <span className="text-slate-300">سليم - OK</span>
        </div>
      </div>

      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        خريطة الفحص التفاعلية
      </h3>

      <svg 
        viewBox="0 0 300 480" 
        className="w-full max-w-sm mx-auto"
        style={{ filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.5))" }}
      >
        <defs>
          <linearGradient id="carBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="50%" stopColor="#475569" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="wheelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="innerShadow">
            <feOffset dx="0" dy="2"/>
            <feGaussianBlur stdDeviation="2" result="offset-blur"/>
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse"/>
            <feFlood floodColor="black" floodOpacity="0.3" result="color"/>
            <feComposite operator="in" in="color" in2="inverse" result="shadow"/>
            <feComposite operator="over" in="shadow" in2="SourceGraphic"/>
          </filter>
        </defs>

        <g transform="translate(0, 20)">
          {CAR_PARTS.map((part) => {
            const severity = getPartSeverity(part.id, items);
            const colors = severity ? getSeverityColor(severity) : getSeverityColor("ok");
            const isHovered = hoveredPart === part.id;
            const isActive = activeCategory === part.id;
            const isGlass = part.id.includes("windshield");
            const isWheel = part.id.includes("wheel");

            return (
              <g key={part.id}>
                <path
                  d={part.path}
                  fill={severity ? colors.fill : isGlass ? "url(#glassGradient)" : isWheel ? "url(#wheelGradient)" : "url(#carBodyGradient)"}
                  stroke={severity ? colors.stroke : isActive ? "#3b82f6" : isHovered ? "#60a5fa" : "#475569"}
                  strokeWidth={isActive || isHovered ? 3 : 1.5}
                  className={cn(
                    "cursor-pointer transition-all duration-300",
                    isHovered && "brightness-125",
                    isActive && "brightness-110"
                  )}
                  style={{
                    filter: severity ? `drop-shadow(${colors.glow})` : isActive ? "drop-shadow(0 0 10px #3b82f6)" : "none",
                    transform: isHovered ? "scale(1.02)" : "scale(1)",
                    transformOrigin: "center",
                  }}
                  onMouseEnter={() => setHoveredPart(part.id)}
                  onMouseLeave={() => setHoveredPart(null)}
                  onClick={() => onPartClick?.(part.id)}
                  data-testid={`car-part-${part.id}`}
                />
                {severity && (
                  <circle
                    cx={part.path.includes("wheel") ? (part.id.includes("left") ? 45 : 255) : 150}
                    cy={parseInt(part.path.match(/\d+/g)?.[1] || "200") + 20}
                    r="8"
                    fill={colors.stroke}
                    className="animate-pulse"
                    style={{ filter: `drop-shadow(${colors.glow})` }}
                  />
                )}
              </g>
            );
          })}
        </g>

        <text x="150" y="470" textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="sans-serif">
          اضغط على أي جزء لعرض التفاصيل
        </text>
      </svg>

      {hoveredPart && (
        <div className="absolute bottom-4 left-4 bg-slate-800/95 backdrop-blur-sm rounded-lg px-4 py-2 border border-slate-600 shadow-xl">
          <p className="text-white font-medium">
            {CAR_PARTS.find(p => p.id === hoveredPart)?.label}
          </p>
          <p className="text-slate-400 text-sm">
            {CAR_PARTS.find(p => p.id === hoveredPart)?.labelEn}
          </p>
        </div>
      )}
    </div>
  );
}

export { CAR_PARTS };
