import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Palette, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaintDepthHeatmapProps {
  paintReadings?: Record<string, number> | null;
  className?: string;
}

// Map database keys to SVG labels
const PANEL_MAP: Record<string, { labelAr: string; labelEn: string; defaultThickness: number }> = {
  hood: { labelAr: "الكبوت", labelEn: "Hood", defaultThickness: 0 },
  roof: { labelAr: "السقف", labelEn: "Roof", defaultThickness: 0 },
  trunk: { labelAr: "الشنطة", labelEn: "Trunk", defaultThickness: 0 },
  fender_front_left: { labelAr: "رفرف أمامي يسار", labelEn: "Front L Fender", defaultThickness: 0 },
  fender_front_right: { labelAr: "رفرف أمامي يمين", labelEn: "Front R Fender", defaultThickness: 0 },
  door_front_left: { labelAr: "باب أمامي يسار", labelEn: "Front L Door", defaultThickness: 0 },
  door_front_right: { labelAr: "باب أمامي يمين", labelEn: "Front R Door", defaultThickness: 0 },
  door_rear_left: { labelAr: "باب خلفي يسار", labelEn: "Rear L Door", defaultThickness: 0 },
  door_rear_right: { labelAr: "باب خلفي يمين", labelEn: "Rear R Door", defaultThickness: 0 },
  fender_rear_left: { labelAr: "رفرف خلفي يسار", labelEn: "Rear L Fender", defaultThickness: 0 },
  fender_rear_right: { labelAr: "رفرف خلفي يمين", labelEn: "Rear R Fender", defaultThickness: 0 },
};

// Thresholds for colors
const getColorForThickness = (thickness?: number) => {
  if (!thickness || thickness === 0) return "fill-slate-200 dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-700"; // No data
  if (thickness < 131) return "fill-green-500/80 stroke-green-600 dark:fill-green-600/80 dark:stroke-green-500"; // Factory
  if (thickness <= 300) return "fill-yellow-500/80 stroke-yellow-600 dark:fill-yellow-600/80 dark:stroke-yellow-500"; // Repainted
  return "fill-red-500/80 stroke-red-600 dark:fill-red-600/80 dark:stroke-red-500"; // Bondo/Filler
};

const getStatusText = (thickness?: number) => {
  if (!thickness || thickness === 0) return "لا توجد قراءة";
  if (thickness < 131) return "طلاء أصلي (وكالة)";
  if (thickness <= 300) return "مرشوش (بدون معجون)";
  return "يوجد معجون / صدمة";
};

// Simple SVG Path for a Car Top-Down View
// Using generic rects/polygons to form a car shape
const CarSvg = ({ readings }: { readings: Record<string, number> }) => {
  const getPanelProps = (key: string) => {
    const thickness = readings?.[key] || 0;
    const colorClass = getColorForThickness(thickness);
    return {
      className: cn("transition-all duration-300 hover:opacity-80 cursor-pointer stroke-[3px]", colorClass),
      "data-thickness": thickness,
      "data-panel": key
    };
  };

  const renderTooltip = (key: string, children: React.ReactNode) => {
    const thickness = readings?.[key];
    const info = PANEL_MAP[key];
    
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            {children}
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 text-white p-3 rounded-lg border-slate-800 z-50">
            <div className="font-bold text-lg mb-1">{info?.labelAr || key}</div>
            <div className="text-sm opacity-90 mb-2">{info?.labelEn}</div>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 px-2 py-1 rounded text-sm font-mono">
                {thickness ? `${thickness} μm` : "N/A"}
              </span>
              <span className="text-sm font-medium">
                {getStatusText(thickness)}
              </span>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <svg viewBox="0 0 400 800" className="w-full h-full max-h-[500px] mx-auto drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
      {/* Background shadow/base */}
      <rect x="70" y="40" width="260" height="720" rx="40" className="fill-slate-100 dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700 stroke-[4px]" />
      
      {/* Front Bumper Area (Visual only) */}
      <path d="M 90 60 Q 200 20 310 60 L 310 90 L 90 90 Z" className="fill-slate-200 dark:fill-slate-800" />
      
      {/* Rear Bumper Area (Visual only) */}
      <path d="M 90 740 Q 200 780 310 740 L 310 710 L 90 710 Z" className="fill-slate-200 dark:fill-slate-800" />

      {/* Hood */}
      {renderTooltip("hood", <path d="M 120 100 L 280 100 L 290 250 Q 200 260 110 250 Z" {...getPanelProps("hood")} />)}
      
      {/* Roof */}
      {renderTooltip("roof", <rect x="130" y="320" width="140" height="200" rx="10" {...getPanelProps("roof")} />)}
      
      {/* Trunk */}
      {renderTooltip("trunk", <path d="M 120 590 Q 200 580 280 590 L 290 700 L 110 700 Z" {...getPanelProps("trunk")} />)}

      {/* Windshield (Visual) */}
      <path d="M 110 260 Q 200 270 290 260 L 270 310 L 130 310 Z" className="fill-sky-100/50 dark:fill-sky-900/30 stroke-sky-200 dark:stroke-sky-800 stroke-[2px]" />
      
      {/* Rear Glass (Visual) */}
      <path d="M 130 530 L 270 530 L 290 580 Q 200 570 110 580 Z" className="fill-sky-100/50 dark:fill-sky-900/30 stroke-sky-200 dark:stroke-sky-800 stroke-[2px]" />

      {/* FENDERS */}
      {/* Front Left Fender */}
      {renderTooltip("fender_front_left", <path d="M 75 100 L 110 100 L 100 250 L 75 250 Z" {...getPanelProps("fender_front_left")} />)}
      {/* Front Right Fender */}
      {renderTooltip("fender_front_right", <path d="M 290 100 L 325 100 L 325 250 L 300 250 Z" {...getPanelProps("fender_front_right")} />)}
      
      {/* DOORS */}
      {/* Front Left Door */}
      {renderTooltip("door_front_left", <rect x="75" y="260" width="35" height="150" {...getPanelProps("door_front_left")} />)}
      {/* Front Right Door */}
      {renderTooltip("door_front_right", <rect x="290" y="260" width="35" height="150" {...getPanelProps("door_front_right")} />)}
      
      {/* Rear Left Door */}
      {renderTooltip("door_rear_left", <rect x="75" y="420" width="35" height="120" {...getPanelProps("door_rear_left")} />)}
      {/* Rear Right Door */}
      {renderTooltip("door_rear_right", <rect x="290" y="420" width="35" height="120" {...getPanelProps("door_rear_right")} />)}

      {/* REAR FENDERS */}
      {/* Rear Left Fender */}
      {renderTooltip("fender_rear_left", <path d="M 75 550 L 110 550 L 120 700 L 75 700 Z" {...getPanelProps("fender_rear_left")} />)}
      {/* Rear Right Fender */}
      {renderTooltip("fender_rear_right", <path d="M 290 550 L 325 550 L 325 700 L 280 700 Z" {...getPanelProps("fender_rear_right")} />)}

      {/* Wheels (Visual) */}
      <rect x="60" y="120" width="15" height="60" rx="5" className="fill-slate-800 dark:fill-slate-200" />
      <rect x="325" y="120" width="15" height="60" rx="5" className="fill-slate-800 dark:fill-slate-200" />
      <rect x="60" y="580" width="15" height="60" rx="5" className="fill-slate-800 dark:fill-slate-200" />
      <rect x="325" y="580" width="15" height="60" rx="5" className="fill-slate-800 dark:fill-slate-200" />
    </svg>
  );
};

export function PaintDepthHeatmap({ paintReadings, className }: PaintDepthHeatmapProps) {
  // Always render the component, even if no data, to show the blank state professionally
  const readings = paintReadings || {};
  const hasData = Object.keys(readings).length > 0;

  return (
    <Card className={cn("overflow-hidden border-2", className)}>
      <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <CardTitle>الخريطة الحرارية لسماكة الطلاء</CardTitle>
          </div>
          {!hasData && (
            <span className="text-xs font-medium px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-full">
              لا توجد قراءات
            </span>
          )}
        </div>
        <CardDescription>
          مؤشر مرئي لحالة البودي وطلاء السيارة بناءً على السماكة (ميكرون)
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 md:p-10 flex flex-col md:flex-row gap-8 items-center bg-white dark:bg-slate-950">
        <div className="flex-1 w-full max-w-sm">
          <CarSvg readings={readings} />
        </div>
        
        <div className="w-full md:w-64 flex flex-col gap-4">
          <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            دليل الألوان
          </h3>
          
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50 dark:bg-slate-900">
            <div className="w-6 h-6 rounded-full bg-green-500 shadow-inner shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-sm">طلاء أصلي (وكالة)</span>
              <span className="text-xs text-muted-foreground">أقل من 130 μm</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50 dark:bg-slate-900">
            <div className="w-6 h-6 rounded-full bg-yellow-500 shadow-inner shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-sm">تم الرش (Repainted)</span>
              <span className="text-xs text-muted-foreground">131 μm - 300 μm</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50 dark:bg-slate-900">
            <div className="w-6 h-6 rounded-full bg-red-500 shadow-inner shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-sm">يوجد معجون / صدمة</span>
              <span className="text-xs text-muted-foreground">أكثر من 300 μm</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50 dark:bg-slate-900 opacity-60">
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 shadow-inner shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-sm">لا توجد قراءة</span>
              <span className="text-xs text-muted-foreground">لم يتم الفحص</span>
            </div>
          </div>

          {hasData && (
            <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs leading-relaxed text-muted-foreground text-center">
                مرر مؤشر الماوس (أو اضغط) على أي جزء من السيارة في الخريطة لرؤية سماكة الطلاء بدقة.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
