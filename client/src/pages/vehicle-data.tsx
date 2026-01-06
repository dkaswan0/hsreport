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
  Loader2,
  Image as ImageIcon,
  AlertTriangle,
  Zap,
  Globe,
  MapPin
} from "lucide-react";
import { useState } from "react";
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
        <h1 className="text-3xl font-bold text-slate-900 font-arabic">مركز فك رموز الشاصي (VIN) العالمي</h1>
        <div className="flex gap-2">
          <Globe className="w-6 h-6 text-primary" />
          <Car className="w-10 h-10 text-primary" />
        </div>
      </div>

      <Card className="rounded-3xl border-none shadow-sm bg-white border border-slate-100">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                value={vin} 
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                placeholder="أدخل رقم الشاصي (VIN) المكون من 17 حرفاً..." 
                className="pr-10 h-12 rounded-xl text-left font-mono"
                maxLength={17}
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isDecoding || vin.length !== 17}
              className="h-12 px-8 rounded-xl bg-primary text-white font-arabic"
            >
              {isDecoding ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : null}
              تحليل شامل وفك الرموز
            </Button>
          </div>
        </CardContent>
      </Card>

      {vinData ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Specifications Section */}
          <Card className="rounded-3xl border-none shadow-sm bg-white border border-slate-100 md:col-span-2">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2 font-arabic justify-end">
                المواصفات الفنية الكاملة | Full Specifications
                <Info className="w-5 h-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                <div className="space-y-1">
                  <p className="text-slate-400 font-arabic">الماركة | Make</p>
                  <p className="font-bold">{vinData.make}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 font-arabic">الموديل | Model</p>
                  <p className="font-bold">{vinData.model}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 font-arabic">السنة | Year</p>
                  <p className="font-bold">{vinData.year}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 font-arabic">المحرك | Engine</p>
                  <p className="font-bold">{specs.engine || specs.engine_displacement || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 font-arabic">ناقل الحركة | Transmission</p>
                  <p className="font-bold">{specs.transmission || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 font-arabic">دفع العجلات | Drivetrain</p>
                  <p className="font-bold">{specs.drivetrain || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 font-arabic">نوع الوقود | Fuel</p>
                  <p className="font-bold">{specs.fuel_type || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 font-arabic">بلد التصنيع | Origin</p>
                  <p className="font-bold">{specs.manufacturer_address || specs.made_in || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 font-arabic">نوع المركبة | Type</p>
                  <p className="font-bold">{specs.vehicle_type || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Value Section */}
          <Card className="rounded-3xl border-none shadow-sm bg-white border border-slate-100">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2 font-arabic justify-end">
                القيمة السوقية | Market Value
                <DollarSign className="w-5 h-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="text-4xl font-black text-primary mb-2">
                {specs.msrp ? `$${specs.msrp}` : "قيد التحليل"}
              </div>
              <p className="text-sm text-slate-400 font-arabic">تقدير القيمة بناءً على مواصفات CarsXE</p>
            </CardContent>
          </Card>

          {/* History & Recalls Section */}
          <Card className="rounded-3xl border-none shadow-sm bg-white border border-slate-100 md:col-span-2">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2 font-arabic justify-end">
                سجل الحوادث والاستدعاءات | Accident History & Recalls
                <History className="w-5 h-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Accident History */}
              {specs.history && specs.history.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="font-bold text-red-600 font-arabic flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    سجل الحوادث المسجلة | Recorded Accidents
                  </h4>
                  {specs.history.map((accident: any, idx: number) => (
                    <div key={idx} className="bg-red-50 rounded-xl border border-red-200 p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="text-right flex-1">
                          <p className="text-red-700 font-bold font-arabic">{accident.type || "حادث مروري"}</p>
                          <p className="text-sm text-red-600 font-arabic">{accident.description}</p>
                          {accident.date && (
                            <p className="text-xs text-red-500 mt-1 font-arabic">التاريخ: {accident.date}</p>
                          )}
                          {accident.location && (
                            <p className="text-xs text-red-500 font-arabic flex items-center gap-1 justify-end">
                              <MapPin className="w-3 h-3" />
                              الموقع: {accident.location}
                            </p>
                          )}
                        </div>
                        <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
                      </div>
                      {/* Accident Photos */}
                      {accident.photos && accident.photos.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                          {accident.photos.map((photo: string, pIdx: number) => (
                            <img 
                              key={pIdx} 
                              src={photo} 
                              alt={`Accident ${idx + 1} Photo ${pIdx + 1}`}
                              className="rounded-lg w-full h-24 object-cover border border-red-200"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="text-right">
                    <p className="text-green-700 font-bold text-sm font-arabic">لا توجد حوادث مسجلة</p>
                    <p className="text-[10px] text-green-600">No accidents found in database</p>
                  </div>
                  <ShieldAlert className="w-6 h-6 text-green-600" />
                </div>
              )}

              {/* Recalls Section */}
              {specs.recalls && specs.recalls.length > 0 ? (
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h4 className="font-bold text-amber-600 font-arabic flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    استدعاءات الشركة المصنعة | Manufacturer Recalls
                  </h4>
                  {specs.recalls.map((recall: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-right flex-1">
                        <p className="text-amber-800 font-bold text-sm font-arabic">{recall.component || "استدعاء فني"}</p>
                        <p className="text-xs text-amber-700 font-arabic mt-1">{recall.description}</p>
                        {recall.remedy && (
                          <p className="text-xs text-amber-600 font-arabic mt-1">الحل: {recall.remedy}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                  <div className="text-right">
                    <p className="text-green-700 font-bold text-sm font-arabic">خالية من الاستدعاءات</p>
                    <p className="text-[10px] text-green-600">No active recalls</p>
                  </div>
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
              )}

              {/* Ownership/Sales History */}
              {specs.ownership && specs.ownership.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h4 className="font-bold text-blue-600 font-arabic flex items-center gap-2">
                    <History className="w-4 h-4" />
                    سجل الملكية والبيع | Ownership History
                  </h4>
                  {specs.ownership.map((record: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="text-right">
                        <p className="text-blue-700 font-bold text-sm font-arabic">{record.type || "انتقال ملكية"}</p>
                        <p className="text-xs text-blue-600">{record.date} - {record.location}</p>
                      </div>
                      <Info className="w-5 h-5 text-blue-600" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Technical Diagnosis Section */}
          <Card className="rounded-3xl border-none shadow-sm bg-white border border-slate-100">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2 font-arabic justify-end">
                فحص الكمبيوتر | OBD Decoding
                <Zap className="w-5 h-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <p className="text-slate-400 font-arabic text-sm mb-4">نظام تحليل أكواد الأعطال OBD-II متصل بقاعدة بيانات CarsXE</p>
              <Button variant="outline" className="w-full rounded-xl font-arabic">تحليل الكود التقني</Button>
            </CardContent>
          </Card>

          {/* Official Images Section */}
          <Card className="rounded-3xl border-none shadow-sm bg-white border border-slate-100">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2 font-arabic justify-end">
                الصور الرسمية | Vehicle Images
                <ImageIcon className="w-5 h-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-4">
                {specs.images && specs.images.length > 0 ? (
                  specs.images.map((img: string, idx: number) => (
                    <img key={idx} src={img} alt="Vehicle" className="rounded-2xl w-full object-cover shadow-sm" />
                  ))
                ) : (
                  <div className="aspect-video bg-slate-50 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200">
                    <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-slate-400 text-xs font-arabic">لا توجد صور رسمية متاحة حالياً</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recognition Section */}
          <Card className="rounded-3xl border-none shadow-sm bg-white border border-slate-100 md:col-span-3">
            <CardContent className="p-6 flex items-center justify-between gap-8">
              <div className="flex-1 space-y-2">
                <h4 className="font-bold font-arabic text-lg">تقنيات التعرف الذكي | Smart Recognition</h4>
                <p className="text-slate-500 text-sm font-arabic">نستخدم تقنيات OCR لاستخراج رقم الشاصي من الصور والتعرف على لوحات الأرقام (Plate Recognition) بدقة عالية.</p>
              </div>
              <div className="flex gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center gap-2">
                  <MapPin className="w-6 h-6 text-slate-400" />
                  <span className="text-[10px] font-bold">Plate OCR</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center gap-2">
                  <Search className="w-6 h-6 text-slate-400" />
                  <span className="text-[10px] font-bold">VIN OCR</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="bg-slate-900 text-white rounded-3xl p-12 text-center shadow-xl">
          <Activity className="w-16 h-16 mx-auto mb-6 text-accent animate-pulse" />
          <h3 className="text-2xl font-bold mb-4 font-arabic">نظام فك الرموز العالمي المتكامل</h3>
          <p className="text-slate-400 max-w-2xl mx-auto font-arabic text-lg leading-relaxed">
            أدخل رقم الشاصي (VIN) للوصول إلى تقارير القيمة السوقية، سجل الحوادث، الاستدعاءات الأمنية، والمواصفات الفنية التفصيلية المزودة من CarsXE.
          </p>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] text-slate-500">
            <div className="p-2 border border-slate-800 rounded-lg">Decode worldwide</div>
            <div className="p-2 border border-slate-800 rounded-lg">Market Value Specs</div>
            <div className="p-2 border border-slate-800 rounded-lg">Lien & Theft Check</div>
            <div className="p-2 border border-slate-800 rounded-lg">Recall Information</div>
          </div>
        </div>
      )}
    </div>
  );
}
