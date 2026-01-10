import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInspectionSchema } from "@shared/schema";
import { useCreateInspection, useVinDecoder } from "@/hooks/use-inspections";
import { useLocation } from "wouter";
import { z } from "zod";
import { Loader2, ArrowLeft, Search, Camera, Car, Fuel, Gauge, Settings, MapPin, CheckCircle2, ScanLine, Upload, X, Image } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { VinScannerModal } from "@/components/vin-scanner-modal";
import { Button } from "@/components/ui/button";

const formSchema = insertInspectionSchema.extend({
  vin: z.string().min(17, "رقم الشاصي يجب أن يكون 17 حرفاً").max(17),
  odometer: z.coerce.number().min(0, "المسافة المقطوعة يجب أن تكون رقم موجب"),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewInspection() {
  const [, setLocation] = useLocation();
  const { mutate, isPending } = useCreateInspection();
  const [vinQuery, setVinQuery] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [odometerPhoto, setOdometerPhoto] = useState<string | null>(null);
  const [odometerPhotoPreview, setOdometerPhotoPreview] = useState<string | null>(null);
  const odometerPhotoRef = useRef<HTMLInputElement>(null);
  
  const { data: vinData, isFetching: isDecoding } = useVinDecoder(vinQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vin: "",
      make: "",
      model: "",
      year: new Date().getFullYear(),
      color: "",
      odometer: 0,
      customerName: "",
      customerPhone: "",
      notes: "",
      status: "draft"
    }
  });

  const handleVinScanned = (vin: string) => {
    form.setValue("vin", vin);
    setVinQuery(vin);
  };

  const handleOdometerPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setOdometerPhoto(result);
      setOdometerPhotoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const removeOdometerPhoto = () => {
    setOdometerPhoto(null);
    setOdometerPhotoPreview(null);
    if (odometerPhotoRef.current) {
      odometerPhotoRef.current.value = "";
    }
  };

  // Auto-fill form when VIN data arrives
  const [vinError, setVinError] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState("");
  const [vehicleSpecs, setVehicleSpecs] = useState<any>(null);
  
  useEffect(() => {
    if (vinData) {
      // Check for error in response
      if ((vinData as any).error) {
        setVinError((vinData as any).message || "ما قدر يقرأ الشاصي");
        return;
      }
      setVinError(null);
      
      if (vinData.make) form.setValue("make", vinData.make);
      if (vinData.model) form.setValue("model", vinData.model);
      if (vinData.year) form.setValue("year", vinData.year);
      if (vinData.color) form.setValue("color", vinData.color);
      
      // Parse and store vehicle specs for display
      // @ts-ignore
      if (vinData.notes) {
        try {
          // @ts-ignore
          const specs = typeof vinData.notes === 'string' ? JSON.parse(vinData.notes) : vinData.notes;
          setVehicleSpecs(specs);
          // Store JSON in notes field for database
          // @ts-ignore
          form.setValue("notes", vinData.notes);
        } catch (e) {
          // @ts-ignore
          form.setValue("notes", vinData.notes);
        }
      }
    }
  }, [vinData, form]);
  
  // Combine user notes with vehicle specs for submission
  const onSubmit = (data: FormValues) => {
    // If user added notes, append them to the stored data
    if (userNotes.trim()) {
      try {
        const existingNotes = data.notes ? JSON.parse(data.notes) : {};
        existingNotes.userNotes = userNotes;
        data.notes = JSON.stringify(existingNotes);
      } catch {
        data.notes = userNotes;
      }
    }
    
    // Add odometer photo to submission
    const submissionData = {
      ...data,
      odometerPhoto: odometerPhoto || undefined
    };
    
    mutate(submissionData as any, {
      onSuccess: (newInspection) => {
        setLocation(`/inspections/${newInspection.id}`);
      }
    });
  };

  const handleVinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    form.setValue("vin", value);
    if (value.length === 17) {
      setVinQuery(value);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={() => history.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-500 rtl:rotate-180" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-arabic">فحص يديد</h1>
          <p className="text-slate-500 font-arabic">حط بيانات السيارة والكستمر</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Vehicle Information Section */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary border-b pb-2 font-arabic">
              <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm">1</span>
              بيانات السيارة
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-full">
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-medium text-slate-700 font-arabic">رقم الشاصي (VIN)</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowScanner(true)}
                    className="flex items-center gap-2"
                    data-testid="button-open-scanner"
                  >
                    <ScanLine className="w-4 h-4" />
                    سكان بالكاميرا
                  </Button>
                </div>
                <div className="relative">
                  <input
                    {...form.register("vin")}
                    onChange={handleVinChange}
                    className={cn(
                      "w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all font-mono tracking-widest uppercase rtl:pr-4 rtl:pl-10",
                      form.formState.errors.vin && "border-red-300 focus:border-red-500 focus:ring-red-100"
                    )}
                    placeholder="WBA..."
                    maxLength={17}
                    data-testid="input-vin"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 rtl:right-auto rtl:left-3">
                    {isDecoding ? <Loader2 className="w-5 h-5 animate-spin text-accent" /> : <Search className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>
                {isDecoding && <p className="text-accent text-xs mt-1 font-arabic">يحمل بيانات السيارة...</p>}
                {vinError && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-600 text-sm font-arabic">{vinError}</p>
                    <p className="text-red-500 text-xs mt-1 font-arabic">حط البيانات يدوي أو تأكد من رقم الشاصي</p>
                  </div>
                )}
                {form.formState.errors.vin && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.vin.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">الماركة</label>
                <input
                  {...form.register("make")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                  placeholder="Toyota, BMW..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">الموديل</label>
                <input
                  {...form.register("model")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                  placeholder="Camry, X5..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">السنة</label>
                <input
                  type="number"
                  {...form.register("year")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">اللون</label>
                <input
                  {...form.register("color")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                  placeholder="أبيض، أسود..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">العداد (كم)</label>
                <input
                  type="number"
                  {...form.register("odometer")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                  data-testid="input-odometer"
                />
              </div>

              {/* Odometer Photo Upload */}
              <div className="col-span-full">
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary" />
                  صورة العداد
                </label>
                <div className="space-y-3">
                  {odometerPhotoPreview ? (
                    <div className="relative inline-block">
                      <img 
                        src={odometerPhotoPreview} 
                        alt="صورة العداد" 
                        className="w-full max-w-md h-48 object-cover rounded-xl border-2 border-primary/20"
                      />
                      <button
                        type="button"
                        onClick={removeOdometerPhoto}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg"
                        data-testid="button-remove-odometer-photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      {/* Camera Capture Button */}
                      <label className="flex-1 flex flex-col items-center justify-center h-40 border-2 border-dashed border-primary/50 rounded-xl cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors">
                        <div className="flex flex-col items-center justify-center py-6">
                          <div className="p-3 bg-primary/20 rounded-full mb-3">
                            <Camera className="w-8 h-8 text-primary" />
                          </div>
                          <p className="text-sm text-primary font-arabic font-bold mb-1">صور بالكاميرا</p>
                          <p className="text-xs text-slate-400">التقط صورة مباشرة</p>
                        </div>
                        <input 
                          type="file" 
                          accept="image/*"
                          capture="environment"
                          className="hidden" 
                          onChange={handleOdometerPhotoChange}
                          data-testid="input-odometer-camera"
                        />
                      </label>
                      
                      {/* File Upload Button */}
                      <label className="flex-1 flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex flex-col items-center justify-center py-6">
                          <div className="p-3 bg-slate-200 rounded-full mb-3">
                            <Upload className="w-8 h-8 text-slate-500" />
                          </div>
                          <p className="text-sm text-slate-600 font-arabic mb-1">ارفع من الجهاز</p>
                          <p className="text-xs text-slate-400">PNG, JPG</p>
                        </div>
                        <input 
                          ref={odometerPhotoRef}
                          type="file" 
                          accept="image/*"
                          className="hidden" 
                          onChange={handleOdometerPhotoChange}
                          data-testid="input-odometer-photo"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information Section */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary border-b pb-2">
              <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm">2</span>
              بيانات الكستمر
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">اسم الكستمر</label>
                <input
                  {...form.register("customerName")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                  placeholder="الاسم الكامل"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">رقم الهاتف</label>
                <input
                  {...form.register("customerPhone")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                  placeholder="05xxxxxxxx"
                />
              </div>
              
              {/* Vehicle Specs Display - Arabic formatted */}
              {vehicleSpecs && (
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    بيانات السيارة من الشاصي
                  </label>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                    {/* Arabic Summary */}
                    {vehicleSpecs.arabicSummary && (
                      <p className="text-sm text-green-800 font-arabic leading-relaxed border-b border-green-200 pb-3">
                        {vehicleSpecs.arabicSummary}
                      </p>
                    )}
                    
                    {/* Detailed Specs Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-right" dir="rtl">
                      {vehicleSpecs.engine && (
                        <div className="bg-white p-2 rounded-lg border border-green-100">
                          <div className="text-[10px] text-slate-400 font-arabic">الماكينة</div>
                          <div className="text-xs font-bold text-slate-700 truncate">{vehicleSpecs.engine}</div>
                        </div>
                      )}
                      {vehicleSpecs.transmission && (
                        <div className="bg-white p-2 rounded-lg border border-green-100">
                          <div className="text-[10px] text-slate-400 font-arabic">القير</div>
                          <div className="text-xs font-bold text-slate-700 truncate">{vehicleSpecs.transmission}</div>
                        </div>
                      )}
                      {vehicleSpecs.drivetrain && (
                        <div className="bg-white p-2 rounded-lg border border-green-100">
                          <div className="text-[10px] text-slate-400 font-arabic">الدفع</div>
                          <div className="text-xs font-bold text-slate-700 truncate">{vehicleSpecs.drivetrain}</div>
                        </div>
                      )}
                      {vehicleSpecs.made_in && (
                        <div className="bg-white p-2 rounded-lg border border-green-100">
                          <div className="text-[10px] text-slate-400 font-arabic">بلد الصنع</div>
                          <div className="text-xs font-bold text-slate-700 truncate">{vehicleSpecs.made_in}</div>
                        </div>
                      )}
                      {vehicleSpecs.fuel_capacity && (
                        <div className="bg-white p-2 rounded-lg border border-green-100">
                          <div className="text-[10px] text-slate-400 font-arabic">تانكي البترول</div>
                          <div className="text-xs font-bold text-slate-700 truncate">{vehicleSpecs.fuel_capacity}</div>
                        </div>
                      )}
                      {vehicleSpecs.tires && (
                        <div className="bg-white p-2 rounded-lg border border-green-100">
                          <div className="text-[10px] text-slate-400 font-arabic">مقاس التواير</div>
                          <div className="text-xs font-bold text-slate-700 truncate">{vehicleSpecs.tires}</div>
                        </div>
                      )}
                      {vehicleSpecs.curb_weight && (
                        <div className="bg-white p-2 rounded-lg border border-green-100">
                          <div className="text-[10px] text-slate-400 font-arabic">الوزن</div>
                          <div className="text-xs font-bold text-slate-700 truncate">{vehicleSpecs.curb_weight}</div>
                        </div>
                      )}
                      {vehicleSpecs.standard_seating && (
                        <div className="bg-white p-2 rounded-lg border border-green-100">
                          <div className="text-[10px] text-slate-400 font-arabic">عدد المقاعد</div>
                          <div className="text-xs font-bold text-slate-700 truncate">{vehicleSpecs.standard_seating}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Hidden field to store JSON */}
                  <input type="hidden" {...form.register("notes")} />
                </div>
              )}
              
              {/* User Notes - Separate field */}
              <div className="col-span-full">
                <label className="block text-sm font-medium text-slate-700 mb-2">ملاحظات</label>
                <textarea
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all min-h-[100px]"
                  placeholder="أي ملاحظات عن حالة السيارة..."
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="px-8 py-3 rounded-xl font-semibold bg-accent text-slate-900 shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> يحفظ...
                </span>
              ) : (
                "بدء الفحص"
              )}
            </button>
          </div>
        </form>
      </div>

      <VinScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onVinScanned={handleVinScanned}
      />
    </div>
  );
}
