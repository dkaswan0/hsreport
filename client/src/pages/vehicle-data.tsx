import { useLocation } from "wouter";
import { Car, ArrowLeft } from "lucide-react";

export default function VehicleData() {
  const [, setLocation] = useLocation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
        <Car className="w-10 h-10 text-slate-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-700 font-arabic mb-2">بيانات المركبة</h2>
        <p className="text-slate-500 font-arabic text-sm max-w-xs">
          أدخل بيانات المركبة مباشرة عند إنشاء فحص جديد
        </p>
      </div>
      <button
        onClick={() => setLocation("/new-inspection")}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-arabic font-semibold hover:bg-primary/90 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 rotate-180" />
        إنشاء فحص جديد
      </button>
    </div>
  );
}
