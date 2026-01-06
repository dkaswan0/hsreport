import { useVinDecoder } from "@/hooks/use-inspections";
import { 
  Car, 
  Info, 
  Settings as SettingsIcon,
  Search,
  AlertCircle,
  Activity,
  History,
  ShieldAlert,
  DollarSign,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function VehicleData() {
  const [vin, setVin] = useState("");
  const [searchVin, setSearchVin] = useState("");
  const { data: vinData, isFetching: isDecoding } = useVinDecoder(searchVin);

  const handleSearch = () => {
    if (vin.length === 17) {
      setSearchVin(vin);
    }
  };

  const specs = (vinData as any)?.specs || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-right" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900 font-arabic">بيانات السيارة الشاملة</h1>
        <Car className="w-10 h-10 text-primary" />
      </div>

      <Card className="rounded-3xl border-none shadow-sm bg-white border border-slate-100">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                value={vin} 
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                placeholder="أدخل رقم الشاصي (VIN)..." 
                className="pr-10 h-12 rounded-xl text-left font-mono"
                maxLength={17}
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isDecoding || vin.length !== 17}
              className="h-12 px-8 rounded-xl bg-primary text-white"
            >
              {isDecoding ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : null}
              بحث وجلب البيانات
            </Button>
          </div>
          {vin.length > 0 && vin.length < 17 && (
            <p className="text-amber-600 text-xs mt-2 font-arabic text-right">يرجى إدخال 17 حرفاً لرقم الشاصي</p>
          )}
        </CardContent>
      </Card>

      {vinData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-3xl border-none shadow-sm bg-white border border-slate-100">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2 font-arabic justify-end">
                المواصفات الفنية | Specifications
                <Info className="w-5 h-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-1">
                  <p className="text-slate-400 font-arabic">الماركة</p>
                  <p className="font-bold">{vinData.make}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 font-arabic">الموديل</p>
                  <p className="font-bold">{vinData.model}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 font-arabic">السنة</p>
                  <p className="font-bold">{vinData.year}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 font-arabic">المحرك</p>
                  <p className="font-bold">{specs.engine || specs.engine_displacement || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 font-arabic">ناقل الحركة</p>
                  <p className="font-bold">{specs.transmission || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 font-arabic">دفع العجلات</p>
                  <p className="font-bold">{specs.drivetrain || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 font-arabic">نوع الوقود</p>
                  <p className="font-bold">{specs.fuel_type || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 font-arabic">بلد المنشأ</p>
                  <p className="font-bold">{specs.manufacturer_address || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-sm bg-white border border-slate-100">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2 font-arabic justify-end">
                تاريخ المركبة | History & Alerts
                <History className="w-5 h-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
               <div className="space-y-4">
                 <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                   <span className="text-red-700 font-bold">تحقق من تقرير الحوادث</span>
                   <ShieldAlert className="w-5 h-5 text-red-600" />
                 </div>
                 <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                   <span className="text-amber-700 font-bold">تحقق من الاستدعاءات (Recalls)</span>
                   <AlertCircle className="w-5 h-5 text-amber-600" />
                 </div>
                 <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                   <span className="text-green-700 font-bold">نظام الأمان مفعل</span>
                   <SettingsIcon className="w-5 h-5 text-green-600" />
                 </div>
               </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-sm bg-white border border-slate-100">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2 font-arabic justify-end">
                القيمة السوقية | Market Value
                <DollarSign className="w-5 h-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
               <div className="text-center">
                 <div className="text-4xl font-black text-primary mb-2">
                   {specs.msrp ? `$${specs.msrp}` : "قيد التقدير"}
                 </div>
                 <p className="text-sm text-slate-400 font-arabic">القيمة التقديرية بناءً على البيانات المتوفرة</p>
               </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-sm bg-white border border-slate-100">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2 font-arabic justify-end">
                الأبعاد والمواصفات | Dimensions
                <Car className="w-5 h-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
               <div className="grid grid-cols-2 gap-4 text-sm">
                 <div className="space-y-1">
                   <p className="text-slate-400 font-arabic">الوزن</p>
                   <p className="font-bold">{specs.curb_weight || "N/A"}</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-slate-400 font-arabic">قاعدة العجلات</p>
                   <p className="font-bold">{specs.wheelbase || "N/A"}</p>
                 </div>
               </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="bg-slate-900 text-white rounded-3xl p-8 text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-accent" />
          <h3 className="text-xl font-bold mb-2 font-arabic">بيانات CarsXE المتكاملة</h3>
          <p className="text-slate-400 max-w-lg mx-auto font-arabic text-sm">
            أدخل رقم الشاصي (VIN) المكون من 17 حرفاً للبحث عن بيانات السيارة مباشرة من قواعد البيانات العالمية.
          </p>
        </div>
      )}
    </div>
  );
}
