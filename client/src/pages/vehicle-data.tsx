import { useVinDecoder } from "@/hooks/use-inspections";
import {
  Car, Info, Search, AlertCircle, Activity, History,
  ShieldAlert, DollarSign, Loader2, Image as ImageIcon,
  AlertTriangle, Zap, Globe, MapPin, Wrench, Fuel,
  Gauge, Scale, Ruler, Settings2, Award, TriangleAlert
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function SpecRow({ label, labelAr, value }: { label: string; labelAr: string; value: string | number }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 text-sm text-left ltr">{label}</span>
      <span className="font-semibold text-slate-800 text-right text-sm max-w-[60%]">{labelAr} — {value}</span>
    </div>
  );
}

function SectionCard({ title, titleAr, icon: Icon, color = "blue", children }: any) {
  const colors: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    amber: "text-amber-600 bg-amber-50",
    red: "text-red-600 bg-red-50",
    violet: "text-violet-600 bg-violet-50",
    slate: "text-slate-600 bg-slate-50",
  };
  return (
    <Card className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <CardHeader className="py-4 px-5 border-b border-slate-100 bg-white">
        <CardTitle className="flex items-center gap-2.5 justify-end text-base font-bold font-arabic">
          {titleAr}
          <span className={`p-1.5 rounded-lg ${colors[color]}`}><Icon className="w-4 h-4" /></span>
        </CardTitle>
        <p className="text-xs text-slate-400 text-left ltr">{title}</p>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

export default function VehicleData() {
  const [vin, setVin] = useState("");
  const [searchVin, setSearchVin] = useState("");
  const { data: vinData, isFetching } = useVinDecoder(searchVin);

  const handleSearch = () => {
    if (vin.trim().length === 17) setSearchVin(vin.trim().toUpperCase());
  };

  const specs = (vinData as any)?.specs || {};
  const hasData = vinData && !(vinData as any).error && (vinData as any).make;

  const recalls: any[] = specs.recalls || [];
  const salvage: any[] = specs.salvage || [];
  const images: any[] = specs.images || [];
  const mv = specs.marketValue;

  const fuelAr = (f: string) =>
    !f ? "—" :
    f.includes("Gasoline") ? "بنزين" :
    f.includes("Diesel") ? "ديزل" :
    f.includes("Electric") ? "كهربائي" :
    f.includes("Hybrid") ? "هجين" : f;

  const driveAr = (d: string) =>
    !d ? "—" :
    d.includes("AWD") || d.includes("4WD") ? "دفع رباعي كامل" :
    d.includes("FWD") || d.includes("Front") ? "دفع أمامي" :
    d.includes("RWD") || d.includes("Rear") ? "دفع خلفي" : d;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-right" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center">
          <Globe className="w-5 h-5 text-slate-400" />
          <Car className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-arabic">نظام فك رموز الهيكل</h1>
          <p className="text-sm text-slate-500 font-arabic">VIN Decoder — Powered by CarsXE & NHTSA</p>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="rounded-2xl border border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <p className="text-sm text-slate-500 font-arabic mb-3">
            أدخل رقم الهيكل (VIN) للحصول على مواصفات السيارة الكاملة — يدعم السيارات الأمريكية والأوروبية واليابانية والكورية والخليجية
          </p>
          <div className="flex gap-3">
            <Button
              onClick={handleSearch}
              disabled={isFetching || vin.trim().length !== 17}
              className="h-12 px-6 rounded-xl font-arabic shrink-0"
              data-testid="button-vin-search"
            >
              {isFetching ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <Search className="w-4 h-4 ml-2" />}
              تحليل
            </Button>
            <div className="flex-1 relative">
              <Input
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="1HGBH41JXMN109186"
                className="h-12 rounded-xl text-left font-mono tracking-widest text-base text-center"
                maxLength={17}
                dir="ltr"
                data-testid="input-vin"
              />
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono ${vin.length === 17 ? "text-green-500" : "text-slate-400"}`}>
                {vin.length}/17
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {vinData && (vinData as any).error && (
        <Card className="rounded-2xl border-red-200 bg-red-50">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="w-10 h-10 text-red-500 shrink-0" />
            <div className="text-right">
              <p className="font-bold text-red-700 font-arabic">{(vinData as any).message}</p>
              <p className="text-sm text-red-500 mt-1">تأكد من رقم الهيكل وأعد المحاولة</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── RESULTS ─────────────────────────────────────────────────────────── */}
      {hasData && (
        <div className="space-y-5">

          {/* ── Hero bar ── */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex flex-col gap-2 items-start ltr">
              <div className="flex gap-2 flex-wrap">
                {salvage.length > 0 && (
                  <Badge variant="destructive" className="font-arabic">⚠️ سجل خردة</Badge>
                )}
                {recalls.length > 0 && (
                  <Badge className="bg-amber-500 text-white font-arabic">{recalls.length} استدعاء</Badge>
                )}
                {salvage.length === 0 && recalls.length === 0 && (
                  <Badge className="bg-green-500 text-white font-arabic">✓ سجل نظيف</Badge>
                )}
                {specs.ai_decoded && (
                  <Badge className="bg-violet-600 text-white font-arabic">✦ ذكاء اصطناعي</Badge>
                )}
              </div>
              {specs.ai_notes && (
                <p className="text-violet-300 text-xs font-arabic text-right max-w-[200px]">{specs.ai_notes}</p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-xl font-black font-arabic">{vinData.year} {vinData.make} {specs.model}</h2>
              {specs.trim && <p className="text-slate-400 text-sm font-arabic">{specs.trim}</p>}
              <p className="text-slate-500 text-xs ltr mt-1">{searchVin}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            {/* ── 1. Core Specs ── */}
            <SectionCard title="Core Specifications" titleAr="المواصفات الأساسية" icon={Car} color="blue">
              <div className="px-5 py-1">
                <SpecRow label="Make" labelAr="الماركة" value={vinData.make} />
                <SpecRow label="Model" labelAr="الموديل" value={specs.model} />
                <SpecRow label="Year" labelAr="السنة" value={vinData.year} />
                <SpecRow label="Trim / Series" labelAr="الفئة" value={specs.trim} />
                <SpecRow label="Body Style" labelAr="نوع الهيكل" value={specs.style} />
                <SpecRow label="Vehicle Type" labelAr="نوع المركبة" value={specs.type} />
                <SpecRow label="Doors" labelAr="الأبواب" value={specs.doors} />
                <SpecRow label="Seats" labelAr="المقاعد" value={specs.seats} />
              </div>
            </SectionCard>

            {/* ── 2. Engine & Drivetrain ── */}
            <SectionCard title="Engine & Drivetrain" titleAr="المحرك ونظام الدفع" icon={Wrench} color="violet">
              <div className="px-5 py-1">
                <SpecRow label="Engine" labelAr="المحرك" value={specs.engine} />
                <SpecRow label="Fuel Type" labelAr="نوع الوقود" value={fuelAr(specs.fuel_type)} />
                <SpecRow label="Transmission" labelAr="ناقل الحركة" value={specs.transmission} />
                <SpecRow label="Drivetrain" labelAr="نظام الدفع" value={driveAr(specs.drivetrain)} />
                <SpecRow label="Emission Std" labelAr="معيار الانبعاث" value={specs.emission} />
                {specs.battery_kwh && <SpecRow label="Battery (kWh)" labelAr="البطارية" value={`${specs.battery_kwh} kWh`} />}
                {specs.ev_drive_unit && <SpecRow label="EV Drive Unit" labelAr="وحدة الدفع الكهربائي" value={specs.ev_drive_unit} />}
              </div>
            </SectionCard>

            {/* ── 3. Dimensions & Weight ── */}
            <SectionCard title="Dimensions & Weight" titleAr="الأبعاد والأوزان" icon={Ruler} color="slate">
              <div className="px-5 py-1">
                <SpecRow label="Length (mm)" labelAr="الطول" value={specs.length_mm ? `${specs.length_mm} mm` : ""} />
                <SpecRow label="Width (mm)" labelAr="العرض" value={specs.width_mm ? `${specs.width_mm} mm` : ""} />
                <SpecRow label="Height (mm)" labelAr="الارتفاع" value={specs.height_mm ? `${specs.height_mm} mm` : ""} />
                <SpecRow label="Wheelbase (mm)" labelAr="قاعدة العجلات" value={specs.wheelbase_mm ? `${specs.wheelbase_mm} mm` : ""} />
                <SpecRow label="Curb Weight (kg)" labelAr="الوزن الفارغ" value={specs.weight_empty_kg ? `${specs.weight_empty_kg} kg` : ""} />
                <SpecRow label="Max Weight (kg)" labelAr="الحمولة القصوى" value={specs.max_weight_kg ? `${specs.max_weight_kg} kg` : ""} />
                <SpecRow label="Max Speed (km/h)" labelAr="السرعة القصوى" value={specs.max_speed_kmh ? `${specs.max_speed_kmh} km/h` : ""} />
                <SpecRow label="Trunk (L)" labelAr="حجم الشنطة" value={specs.trunk_capacity ? `${specs.trunk_capacity} L` : ""} />
              </div>
            </SectionCard>

            {/* ── 4. Market Value ── */}
            <SectionCard title="Market Value" titleAr="القيمة السوقية" icon={DollarSign} color="green">
              <div className="p-5">
                {mv && (mv.tradeIn?.length > 0 || Object.keys(mv.auction || {}).length > 0) ? (
                  <div className="space-y-4">
                    {mv.tradeIn?.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 font-arabic mb-2">قيم التبادل التجاري — Trade-in Values</p>
                        <div className="space-y-2">
                          {mv.tradeIn.slice(0, 5).map((v: any, i: number) => (
                            <div key={i} className="flex items-center justify-between bg-green-50 rounded-xl p-3">
                              <span className="text-green-700 font-bold text-lg">${v.value?.toLocaleString() || v.price?.toLocaleString() || "—"}</span>
                              <span className="text-green-600 text-xs font-arabic">{v.mileage ? `${v.mileage?.toLocaleString()} ميل` : v.condition || v.grade || ""}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {mv.auction && Object.keys(mv.auction).length > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 font-arabic mb-2">قيم المزاد — Auction Values</p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(mv.auction).slice(0, 4).map(([k, v]: any) => (
                            <div key={k} className="bg-slate-50 rounded-xl p-3 text-center">
                              <p className="text-slate-700 font-bold">${v?.toLocaleString?.() || v || "—"}</p>
                              <p className="text-xs text-slate-400 capitalize">{k}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <DollarSign className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm font-arabic">لا تتوفر بيانات قيمة سوقية لهذه السيارة</p>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* ── 5. Manufacturing ── */}
            <SectionCard title="Manufacturer Info" titleAr="معلومات المصنّع" icon={Globe} color="slate">
              <div className="px-5 py-1">
                <SpecRow label="Manufacturer" labelAr="الشركة المصنعة" value={specs.manufacturer} />
                <SpecRow label="Country" labelAr="بلد التصنيع" value={specs.made_in} />
                <SpecRow label="City" labelAr="مدينة المصنع" value={specs.made_in_city} />
                <SpecRow label="Plant Address" labelAr="عنوان المصنع" value={specs.manufacturer_address} />
              </div>
            </SectionCard>

            {/* ── 6. Safety Systems ── */}
            <SectionCard title="Safety & Active Systems" titleAr="السلامة والأنظمة النشطة" icon={ShieldAlert} color="green">
              <div className="px-5 py-1">
                <SpecRow label="ABS" labelAr="نظام ABS" value={specs.abs} />
                <SpecRow label="Front Airbags" labelAr="وسادات هوائية أمامية" value={specs.air_bag_front} />
                <SpecRow label="Side Airbags" labelAr="وسادات هوائية جانبية" value={specs.air_bag_side} />
              </div>
            </SectionCard>

          </div>

          {/* ── Salvage / Junk History ── */}
          <SectionCard
            title="Junk & Salvage History"
            titleAr={`سجل الخردة والحوادث الكبرى${salvage.length > 0 ? ` — ${salvage.length} سجل` : ""}`}
            icon={TriangleAlert}
            color={salvage.length > 0 ? "red" : "green"}
          >
            {salvage.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {salvage.map((s, i) => (
                  <div key={i} className="p-4 flex items-start gap-3">
                    <div className="p-2 bg-red-50 rounded-lg shrink-0">
                      <TriangleAlert className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1 text-right">
                      <div className="flex items-center gap-2 justify-end flex-wrap">
                        <Badge variant="destructive" className="text-[10px]">{s.disposition}</Badge>
                        <p className="font-bold text-slate-800 text-sm">{s.entity}</p>
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5 font-arabic">
                        {s.city}{s.state ? `, ${s.state}` : ""} — {s.category}
                      </p>
                      {s.date && <p className="text-xs text-slate-400 mt-0.5 ltr">{s.date}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 flex items-center gap-4">
                <ShieldAlert className="w-8 h-8 text-green-500 shrink-0" />
                <div className="text-right">
                  <p className="font-bold text-green-700 font-arabic">لا يوجد سجل خردة أو حوادث كبرى</p>
                  <p className="text-xs text-green-500 ltr">No junk/salvage records found in NMVTIS database</p>
                </div>
              </div>
            )}
          </SectionCard>

          {/* ── NHTSA Recalls ── */}
          <SectionCard
            title="NHTSA Safety Recalls"
            titleAr={`الاستدعاءات الأمنية الرسمية${recalls.length > 0 ? ` — ${recalls.length} استدعاء` : ""}`}
            icon={AlertCircle}
            color={recalls.length > 0 ? "amber" : "green"}
          >
            {recalls.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recalls.map((r, i) => (
                  <div key={i} className="p-4 text-right">
                    <div className="flex items-center gap-2 justify-end flex-wrap mb-1">
                      <Badge className="bg-amber-100 text-amber-700 text-[10px]">{r.date?.substring(0, 10)}</Badge>
                      <p className="font-bold text-amber-800 text-sm font-arabic">{r.component}</p>
                    </div>
                    {r.summary && <p className="text-sm text-slate-600 font-arabic mb-1">{r.summary}</p>}
                    {r.consequence && <p className="text-xs text-red-600 font-arabic mb-1">⚠️ {r.consequence}</p>}
                    {r.remedy && <p className="text-xs text-green-700 font-arabic">✓ الحل: {r.remedy}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 flex items-center gap-4">
                <Activity className="w-8 h-8 text-green-500 shrink-0" />
                <div className="text-right">
                  <p className="font-bold text-green-700 font-arabic">لا توجد استدعاءات أمنية نشطة</p>
                  <p className="text-xs text-green-500 ltr">No active NHTSA recalls for this vehicle</p>
                </div>
              </div>
            )}
          </SectionCard>

          {/* ── Vehicle Images ── */}
          {images.length > 0 && (
            <SectionCard title="Official Vehicle Images" titleAr="صور السيارة الرسمية" icon={ImageIcon} color="blue">
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                {images.map((img, i) => (
                  <a key={i} href={img.link} target="_blank" rel="noopener noreferrer"
                    className="block rounded-xl overflow-hidden border border-slate-100 hover:border-blue-300 transition-colors shadow-sm">
                    <img
                      src={img.link}
                      alt={`${vinData.make} ${specs.model} ${i + 1}`}
                      className="w-full h-40 object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = img.thumbnail; }}
                    />
                  </a>
                ))}
              </div>
            </SectionCard>
          )}

        </div>
      )}

      {/* ── Empty State ── */}
      {!hasData && !isFetching && !((vinData as any)?.error) && (
        <div className="bg-slate-900 text-white rounded-2xl p-12 text-center">
          <Activity className="w-14 h-14 mx-auto mb-5 text-primary animate-pulse" />
          <h3 className="text-xl font-black mb-3 font-arabic">نظام فك الرموز العالمي المتكامل</h3>
          <p className="text-slate-400 max-w-xl mx-auto font-arabic text-sm leading-loose">
            أدخل رقم الهيكل (VIN) للوصول إلى تقارير القيمة السوقية، سجل الخردة والحوادث، الاستدعاءات الأمنية NHTSA، والمواصفات الفنية التفصيلية المزودة من CarsXE.
          </p>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-500">
            {[
              ["🔍", "فك الرموز العالمي"],
              ["💰", "القيمة السوقية"],
              ["⚠️", "سجل الخردة NMVTIS"],
              ["🛡️", "استدعاءات NHTSA"],
            ].map(([icon, label]) => (
              <div key={label} className="p-3 border border-slate-800 rounded-xl font-arabic">
                <div className="text-lg mb-1">{icon}</div>
                {label}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
