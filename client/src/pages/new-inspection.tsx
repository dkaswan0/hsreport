import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInspectionSchema } from "@shared/schema";
import { useCreateInspection } from "@/hooks/use-inspections";
import { useLocation } from "wouter";
import { z } from "zod";
import { Loader2, ArrowLeft, Camera, Car, FileCheck, Upload, X, Sparkles, Globe, ShieldCheck, UserCheck, Wrench, Cpu, CheckCircle2 } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { SearchRouterModal } from "@/components/search-router-modal";

const compressImage = (dataUrl: string, maxWidth = 1200, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) {
        h = Math.round((h * maxWidth) / w);
        w = maxWidth;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

// Inspection types
const INSPECTION_TYPES = [
  { id: 'full', label: 'فحص شامل', description: 'فحص كامل وشامل لجميع أجزاء المركبة والهيكل والميكانيكا', icon: ShieldCheck, badge: 'الأكثر طلباً' },
  { id: 'mechanical', label: 'فحص ميكانيكي وإلكتروني', description: 'فحص المحرك والجير والكمبيوتر والأعطال الإلكترونية', icon: Cpu, badge: 'موصى به' },
  { id: 'basic', label: 'الأجزاء الأساسية', description: 'فحص الهيكل الخارجي والشاصي والمكينة والجير فقط', icon: Wrench, badge: 'سريع' },
  { id: 'custom', label: 'فحوصات متنوعة', description: 'تحديد نقاط وفحوصات مخصصة بناءً على طلب العميل', icon: CheckCircle2, badge: 'مخصص' }
];

const formSchema = insertInspectionSchema.extend({
  vin: z.string().max(17).optional().or(z.literal("")),
  odometer: z.coerce.number().min(0, "يجب أن تكون المسافة المقطوعة رقمًا موجبًا"),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewInspection() {
  const [, setLocation] = useLocation();
  const { mutate, isPending } = useCreateInspection();
  const { toast } = useToast();

  const [odometerPhoto, setOdometerPhoto] = useState<string | null>(null);
  const [odometerPhotoPreview, setOdometerPhotoPreview] = useState<string | null>(null);
  const odometerPhotoRef = useRef<HTMLInputElement>(null);
  const [inspectionType, setInspectionType] = useState('full');
  const [notes, setNotes] = useState("");

  // Car section photos (exterior)
  const [mainCarPhoto, setMainCarPhoto] = useState<string | null>(null);
  const [carSectionPhotos, setCarSectionPhotos] = useState<{
    rearLeftDoor: string | null;
    rearRightDoor: string | null;
    frontLeftDoor: string | null;
    frontRightDoor: string | null;
    hood: string | null;
    trunk: string | null;
  }>({
    rearLeftDoor: null,
    rearRightDoor: null,
    frontLeftDoor: null,
    frontRightDoor: null,
    hood: null,
    trunk: null,
  });

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

  const [isDecodingVin, setIsDecodingVin] = useState(false);
  const [isScanningVin, setIsScanningVin] = useState(false);
  const [isAnalyzingOdometer, setIsAnalyzingOdometer] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const vinPhotoRef = useRef<HTMLInputElement>(null);

  const watchMake = form.watch("make");
  const watchModel = form.watch("model");
  const watchYear = form.watch("year");

  // Handle VIN photo OCR scanning
  const handleVinPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningVin(true);
    toast({
      title: "جاري تحليل صورة الشاصي",
      description: "يقوم الذكاء الاصطناعي باستخراج رقم الهيكل (VIN)..."
    });

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const rawBase64 = reader.result as string;
          const compressedBase64 = await compressImage(rawBase64, 1800, 0.9);

          const response = await fetch("/api/vin/extract-from-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: compressedBase64 })
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || "فشل استخراج رقم الشاصي من الصورة");
          }

          const data = await response.json();
          if (data.vin) {
            form.setValue("vin", data.vin);
            toast({
              title: "تم استخراج رقم الشاصي بنجاح ✨",
              description: `رقم الشاصي: ${data.vin}`
            });
            await decodeVin(data.vin);
          } else {
            throw new Error("لم يتم العثور على رقم شاصي واضح في الصورة");
          }
        } catch (error: any) {
          toast({
            title: "خطأ في استخراج رقم الشاصي",
            description: error.message || "حدث خطأ أثناء فحص الصورة",
            variant: "destructive"
          });
        } finally {
          setIsScanningVin(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast({
        title: "خطأ",
        description: "فشل في قراءة ملف الصورة",
        variant: "destructive"
      });
      setIsScanningVin(false);
    }
  };

  // Decode VIN via NHTSA + CarAPI fallback
  const decodeVin = async (vinCode: string) => {
    setIsDecodingVin(true);
    try {
      const response = await fetch(`/api/vin/${vinCode}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "فشل التعرف على رقم الهيكل");
      }
      const data = await response.json();
      if (data.success) {
        if (data.make) form.setValue("make", data.make);
        if (data.model) form.setValue("model", data.model);
        if (data.year) form.setValue("year", data.year);

        toast({
          title: "تم استخراج بيانات المركبة تلقائياً ✨",
          description: `الماركة: ${data.make} | الموديل: ${data.model} | سنة الصنع: ${data.year}`,
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "لم يتم التعرف التلقائي على رقم الهيكل",
        description: "يرجى تعبئة بيانات الماركة والموديل يدوياً",
        variant: "destructive",
      });
    } finally {
      setIsDecodingVin(false);
    }
  };

  // Handle Odometer photo + AI OCR Reading
  const handleOdometerPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      const compressed = await compressImage(result);
      setOdometerPhoto(compressed);
      setOdometerPhotoPreview(compressed);

      // Auto AI Odometer Reading
      setIsAnalyzingOdometer(true);
      toast({
        title: "جاري تحليل صورة العداد",
        description: "يقوم الذكاء الاصطناعي بقراءة أرقام العداد..."
      });

      try {
        const response = await fetch("/api/analyze-odometer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: compressed })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.odometer && data.odometer > 0) {
            form.setValue("odometer", data.odometer);
            toast({
              title: "تمت قراءة العداد بالذكاء الاصطناعي بنجاح ✨",
              description: `قراءة العداد المقروءة: ${data.odometer.toLocaleString('ar-SA')} كم`
            });
          }
        }
      } catch (err) {
        console.warn("Odometer AI reading skipped:", err);
      } finally {
        setIsAnalyzingOdometer(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeOdometerPhoto = () => {
    setOdometerPhoto(null);
    setOdometerPhotoPreview(null);
    if (odometerPhotoRef.current) odometerPhotoRef.current.value = "";
  };

  const handleMainCarPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const compressed = await compressImage(event.target?.result as string);
      setMainCarPhoto(compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleCarSectionPhotoChange = (section: keyof typeof carSectionPhotos, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const compressed = await compressImage(event.target?.result as string);
      setCarSectionPhotos(prev => ({ ...prev, [section]: compressed }));
    };
    reader.readAsDataURL(file);
  };

  const removeCarSectionPhoto = (section: keyof typeof carSectionPhotos) => {
    setCarSectionPhotos(prev => ({ ...prev, [section]: null }));
  };

  const onSubmit = (data: FormValues) => {
    const inspectionTypeLabel = INSPECTION_TYPES.find(t => t.id === inspectionType)?.label || 'فحص شامل';
    const submissionData = {
      ...data,
      notes: notes.trim() || undefined,
      odometerPhoto: odometerPhoto || undefined,
      inspectionType: inspectionTypeLabel,
      mainCarPhoto: mainCarPhoto || undefined,
      rearLeftDoorPhoto: carSectionPhotos.rearLeftDoor || undefined,
      rearRightDoorPhoto: carSectionPhotos.rearRightDoor || undefined,
      frontLeftDoorPhoto: carSectionPhotos.frontLeftDoor || undefined,
      frontRightDoorPhoto: carSectionPhotos.frontRightDoor || undefined,
      hoodPhoto: carSectionPhotos.hood || undefined,
      trunkPhoto: carSectionPhotos.trunk || undefined,
    };

    mutate(submissionData as any, {
      onSuccess: (newInspection) => {
        if (newInspection && newInspection.id) {
          toast({ title: "تم حفظ الفحص بنجاح", description: "جارٍ الانتقال إلى صفحة الفحص..." });
          setTimeout(() => setLocation(`/inspections/${newInspection.id}`), 100);
        }
      },
      onError: (error) => {
        toast({
          title: "خطأ في حفظ الفحص",
          description: error instanceof Error ? error.message : "حدث خطأ أثناء حفظ بيانات الفحص",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between bg-gradient-to-r from-[#0C1A28] to-[#162A3E] p-6 rounded-3xl border border-[#C5852C]/30 shadow-xl text-white">
        <div className="flex items-center gap-4">
          <button onClick={() => history.back()} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors text-white">
            <ArrowLeft className="w-6 h-6 rtl:rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#C5852C] text-[#0C1A28] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                فحص موثق جديد
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-arabic mt-1">إدخال بيانات المركبة والعميل</h1>
            <p className="text-slate-300 text-xs md:text-sm font-arabic">منظومة الفحص الميداني الذكية - High Safety Report</p>
          </div>
        </div>
        <Car className="w-12 h-12 text-[#C5852C] hidden sm:block opacity-90" />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 md:p-8 space-y-8">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-8">

          {/* ── 1. بيانات السيارة ── */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-3">
              <h3 className="text-lg font-bold flex items-center gap-2 text-[#0C1A28] font-arabic">
                <span className="w-8 h-8 rounded-xl bg-[#0C1A28] text-[#C5852C] flex items-center justify-center text-sm font-bold shadow">1</span>
                بيانات السيارة واستخراج الهيكل (VIN)
              </h3>
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(true)}
                className="text-xs bg-[#0C1A28] text-[#C5852C] hover:bg-[#162A3E] border border-[#C5852C]/40 px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all font-medium shadow-md font-arabic"
              >
                <Globe className="w-4 h-4 text-[#C5852C] animate-pulse" />
                بحث عيوب واستدعاءات الموديل حياً (Search Router)
              </button>
            </div>

            {/* 1. رقم الهيكل VIN (أول خانة في الأعلى) */}
            <div className="bg-gradient-to-br from-[#0C1A28]/5 to-[#C5852C]/10 p-5 rounded-2xl border-2 border-[#C5852C]/40 shadow-sm relative">
              <label className="block text-sm font-bold text-[#0C1A28] mb-2 font-arabic flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C5852C]" />
                  رقم الهيكل (VIN)
                  <span className="text-xs font-normal text-slate-500">(أدخل 17 رقم/حرف لجلب بيانات المركبة تلقائياً)</span>
                </span>
              </label>
              <div className="relative">
                <input
                  {...form.register("vin")}
                  onChange={async (e) => {
                    const val = e.target.value.toUpperCase()
                      .replace(/O/g, "0")
                      .replace(/I/g, "1")
                      .replace(/Q/g, "0");
                    form.setValue("vin", val);
                    if (val.length === 17) {
                      await decodeVin(val);
                    }
                  }}
                  className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-300 focus:border-[#C5852C] focus:ring-4 focus:ring-[#C5852C]/20 transition-all font-mono text-lg tracking-widest uppercase pl-24 shadow-inner"
                  placeholder="WBA3A5C50DF..."
                  maxLength={17}
                  data-testid="input-vin"
                />
                <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {isScanningVin || isDecodingVin ? (
                    <div className="flex items-center gap-1 bg-[#0C1A28] text-[#C5852C] px-3 py-1.5 rounded-lg text-xs font-bold shadow">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جارٍ الجلب...</span>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => vinPhotoRef.current?.click()}
                        className="bg-[#0C1A28] hover:bg-[#162A3E] text-[#C5852C] text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold shadow transition-all font-arabic"
                        title="مسح رقم الشاصي من ملصق أو باركود بالذكاء الاصطناعي"
                        data-testid="button-scan-vin"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>كاميرا VIN</span>
                      </button>
                    </>
                  )}
                </div>
                <input
                  ref={vinPhotoRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleVinPhotoChange}
                />
              </div>

              {/* Decoded VIN Summary Badge */}
              {(watchMake || watchModel) && (
                <div className="mt-3 bg-white p-3 rounded-xl border border-[#C5852C]/30 flex items-center gap-3 shadow-sm font-arabic">
                  <div className="w-8 h-8 rounded-lg bg-[#C5852C]/20 text-[#0C1A28] flex items-center justify-center font-bold">🚘</div>
                  <div className="text-xs text-slate-700">
                    <span className="font-bold text-[#0C1A28]">الماركة:</span> {watchMake || "غير محدد"} | <span className="font-bold text-[#0C1A28]">الموديل:</span> {watchModel || "غير محدد"} | <span className="font-bold text-[#0C1A28]">السنة:</span> {watchYear || "غير محدد"}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* الماركة */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-arabic">الماركة <span className="text-red-500">*</span></label>
                <input
                  {...form.register("make")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#C5852C] focus:ring-4 focus:ring-[#C5852C]/10 transition-all font-arabic"
                  placeholder="Toyota, BMW, Nissan..."
                  data-testid="input-make"
                />
                {form.formState.errors.make && (
                  <p className="text-red-500 text-xs mt-1 font-arabic">{form.formState.errors.make.message}</p>
                )}
              </div>

              {/* الموديل */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-arabic">الموديل <span className="text-red-500">*</span></label>
                <input
                  {...form.register("model")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#C5852C] focus:ring-4 focus:ring-[#C5852C]/10 transition-all font-arabic"
                  placeholder="Camry, X5, Patrol..."
                  data-testid="input-model"
                />
              </div>

              {/* السنة */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-arabic">سنة الصنع <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  {...form.register("year")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#C5852C] focus:ring-4 focus:ring-[#C5852C]/10 transition-all font-arabic"
                  data-testid="input-year"
                />
              </div>

              {/* اللون (قائمة منسدلة قائمة بالألوان + اختيار أو كتابة يدوية) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-arabic">لون المركبة (اختر أو اكتب يدويًا)</label>
                <input
                  list="car-colors-list"
                  {...form.register("color")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#C5852C] focus:ring-4 focus:ring-[#C5852C]/10 transition-all font-arabic"
                  placeholder="اختر لوناً أو اكتب لون جديد..."
                  data-testid="input-color"
                />
                <datalist id="car-colors-list">
                  {[
                    "أبيض", "أبيض لؤلؤي", "أبيض عاجي", "أبيض كريمي", "أسود", "أسود لؤلؤي", "أسود مطفي", 
                    "فضي", "فضي معدني", "رمادي", "رمادي فاتح", "رمادي غامق", "رمادي فحمي", "رمادي معدني", 
                    "أزرق", "أزرق فاتح", "أزرق غامق", "أزرق سماوي", "أزرق بحري", "أزرق ملكي", "أزرق معدني", 
                    "أحمر", "أحمر غامق", "أحمر كرزي", "أحمر عنابي", "أحمر نبيذي", "أحمر معدني", 
                    "برتقالي", "برتقالي محروق", "أصفر", "أصفر ذهبي", "أصفر ليموني", "ذهبي", "ذهبي شامبانيا", 
                    "ذهبي رملي", "بني", "بني فاتح", "بني غامق", "بني شوكولاتة", "بني نحاسي", "بيج", "بيج رملي", 
                    "كريمي", "عاجي", "أخضر", "أخضر فاتح", "أخضر غامق", "أخضر زيتوني", "أخضر زمردي", 
                    "أخضر ليموني", "تركواز", "فيروزي", "بنفسجي", "بنفسجي غامق", "بنفسجي فاتح", "وردي", 
                    "وردي فاتح", "نحاسي", "برونزي", "خمري", "عنابي", "موف", "زيتي", "كاكي", "فستقي", 
                    "نعناعي", "ليلكي", "شامبانيا", "كستنائي", "مرجاني", "كهرماني", "دخاني", "رصاصي", 
                    "جرافيت", "فحمي", "لؤلؤي", "معدني", "مطفي", "متعدد الألوان", "لونين (ثنائي)"
                  ].map((color) => (
                    <option key={color} value={color} />
                  ))}
                </datalist>
              </div>

              {/* العداد */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-arabic flex items-center justify-between">
                  <span>العداد (كم)</span>
                  {isAnalyzingOdometer && (
                    <span className="text-xs text-[#C5852C] font-bold flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> قراءة العداد بالذكاء الاصطناعي...
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  {...form.register("odometer")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#C5852C] focus:ring-4 focus:ring-[#C5852C]/10 transition-all font-arabic text-lg font-bold"
                  data-testid="input-odometer"
                />
              </div>

              {/* صورة العداد مع الكاميرا والذكاء الاصطناعي */}
              <div className="col-span-full">
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center justify-between font-arabic">
                  <span className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#0C1A28]" />
                    صورة العداد (التقاط كاميرا مباشر أو رفع وقراءة تلقائية)
                  </span>
                  <span className="text-xs text-[#C5852C] font-bold">✨ OCR الذكاء الاصطناعي لقراءة العداد</span>
                </label>
                {odometerPhotoPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={odometerPhotoPreview}
                      alt="صورة العداد"
                      className="w-full max-w-md h-48 object-cover rounded-2xl border-2 border-[#C5852C]/40 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={removeOdometerPhoto}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                      data-testid="button-remove-odometer-photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <label className="flex-1 flex flex-col items-center justify-center h-36 border-2 border-dashed border-[#0C1A28]/40 rounded-2xl cursor-pointer bg-[#0C1A28]/5 hover:bg-[#0C1A28]/10 transition-colors shadow-sm">
                      <Camera className="w-7 h-7 text-[#0C1A28] mb-2" />
                      <p className="text-xs md:text-sm text-[#0C1A28] font-arabic font-bold">التقاط بالكاميرا مباشرة</p>
                      <span className="text-[10px] text-slate-500 font-arabic">يقوم بقراءة العداد تلقائياً</span>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleOdometerPhotoChange} data-testid="input-odometer-camera" />
                    </label>
                    <label className="flex-1 flex flex-col items-center justify-center h-36 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                      <Upload className="w-7 h-7 text-slate-400 mb-2" />
                      <p className="text-xs md:text-sm text-slate-600 font-arabic font-medium">ارفع من الجهاز</p>
                      <input ref={odometerPhotoRef} type="file" accept="image/*" className="hidden" onChange={handleOdometerPhotoChange} data-testid="input-odometer-photo" />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── 2. بيانات العميل (خاصة بالمركز الداخلي) ── */}
          <div className="space-y-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
              <h3 className="text-lg font-bold flex items-center gap-2 text-[#0C1A28] font-arabic">
                <span className="w-8 h-8 rounded-xl bg-[#0C1A28] text-[#C5852C] flex items-center justify-center text-sm font-bold shadow">2</span>
                بيانات العميل
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 font-arabic font-medium">
                <UserCheck className="w-4 h-4 text-amber-600" />
                <span>خاصة بالفاحص الداخلي فقط - مخفية تماماً عن رابط المشاركة والـ PDF</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-arabic">اسم العميل</label>
                <input
                  {...form.register("customerName")}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-[#C5852C] focus:ring-4 focus:ring-[#C5852C]/10 transition-all font-arabic"
                  placeholder="الاسم الكامل"
                  data-testid="input-customer-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-arabic">رقم الهاتف</label>
                <input
                  {...form.register("customerPhone")}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-[#C5852C] focus:ring-4 focus:ring-[#C5852C]/10 transition-all font-arabic"
                  placeholder="05xxxxxxxx"
                  data-testid="input-customer-phone"
                />
              </div>
              <div className="col-span-full">
                <label className="block text-sm font-medium text-slate-700 mb-2 font-arabic">ملاحظات إضافية عن الفحص أو المركبة</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-[#C5852C] focus:ring-4 focus:ring-[#C5852C]/10 transition-all min-h-[80px] font-arabic text-sm"
                  placeholder="معلومات إضافية أو طلبات خاصة من العميل..."
                />
              </div>
            </div>
          </div>

          {/* ── 3. نوع الفحص ── */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-[#0C1A28] border-b border-slate-200 pb-3 font-arabic">
              <span className="w-8 h-8 rounded-xl bg-[#0C1A28] text-[#C5852C] flex items-center justify-center text-sm font-bold shadow">3</span>
              <FileCheck className="w-5 h-5 text-[#0C1A28]" />
              نوع وباقة الفحص
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {INSPECTION_TYPES.map((type) => {
                const IconComponent = type.icon;
                const isSelected = inspectionType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setInspectionType(type.id)}
                    className={cn(
                      "p-4 rounded-2xl border-2 text-right transition-all flex flex-col justify-between relative overflow-hidden",
                      isSelected
                        ? "border-[#C5852C] bg-gradient-to-br from-[#0C1A28] to-[#162A3E] text-white shadow-xl translate-y-[-2px]"
                        : "border-slate-200 bg-white hover:border-[#C5852C]/50 hover:bg-slate-50 text-slate-800"
                    )}
                    data-testid={`button-inspection-type-${type.id}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <IconComponent className={cn("w-6 h-6", isSelected ? "text-[#C5852C]" : "text-slate-500")} />
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full font-arabic", isSelected ? "bg-[#C5852C] text-[#0C1A28]" : "bg-slate-100 text-slate-600")}>
                          {type.badge}
                        </span>
                      </div>
                      <div className={cn("font-bold font-arabic mb-1 text-sm md:text-base", isSelected ? "text-white" : "text-slate-900")}>
                        {type.label}
                      </div>
                      <p className={cn("text-xs leading-relaxed font-arabic", isSelected ? "text-slate-300" : "text-slate-500")}>
                        {type.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 4. صور المركبة والأجزاء الخارجية ── */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
              <h3 className="text-lg font-bold flex items-center gap-2 text-[#0C1A28] font-arabic">
                <span className="w-8 h-8 rounded-xl bg-[#0C1A28] text-[#C5852C] flex items-center justify-center text-sm font-bold shadow">4</span>
                <Camera className="w-5 h-5 text-[#0C1A28]" />
                صور أجزاء المركبة الخارجية (كاميرا مباشر أو معرض)
              </h3>
              <span className="text-xs text-slate-500 font-arabic">تدعم المركبات ذات البابين دون ترك خانات فارغة بالتقرير</span>
            </div>

            {/* الصورة الرئيسية للمركبة */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6">
              <label className="block text-sm font-bold text-slate-800 mb-2 font-arabic flex items-center gap-2">
                <Car className="w-4 h-4 text-[#0C1A28]" />
                صورة السيارة الرئيسية (تظهر في غلاف تقرير الـ PDF)
              </label>
              {mainCarPhoto ? (
                <div className="relative inline-block">
                  <img src={mainCarPhoto} alt="صورة السيارة" className="w-full max-w-lg h-56 object-cover rounded-2xl border-4 border-[#0C1A28]/30 shadow-lg" />
                  <button type="button" onClick={() => setMainCarPhoto(null)} className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors" data-testid="button-remove-main-photo">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-3 max-w-lg">
                  <label className="flex-1 flex flex-col items-center justify-center h-40 border-2 border-dashed border-[#0C1A28]/40 rounded-2xl cursor-pointer bg-[#0C1A28]/5 hover:bg-[#0C1A28]/10 transition-colors shadow-sm">
                    <Camera className="w-8 h-8 text-[#0C1A28] mb-2" />
                    <p className="text-xs font-bold text-[#0C1A28] font-arabic">التقاط كاميرا الجوال</p>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleMainCarPhotoChange} data-testid="input-main-car-camera" />
                  </label>
                  <label className="flex-1 flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer bg-white hover:bg-slate-100 transition-colors">
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-xs text-slate-600 font-arabic font-medium">رفع من الجهاز</p>
                    <input type="file" accept="image/*" className="hidden" onChange={handleMainCarPhotoChange} data-testid="input-main-car-photo" />
                  </label>
                </div>
              )}
            </div>

            {/* أقسام السيارة 6 جهات */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key: 'frontLeftDoor', label: 'الباب الأمامي يسار' },
                { key: 'frontRightDoor', label: 'الباب الأمامي يمين' },
                { key: 'rearLeftDoor', label: 'الباب الخلفي يسار (اختياري للبابين)' },
                { key: 'rearRightDoor', label: 'الباب الخلفي يمين (اختياري للبابين)' },
                { key: 'hood', label: 'غطاء المحرك (الكبوت)' },
                { key: 'trunk', label: 'صندوق الأمتعة (الشنطة)' },
              ].map((section) => {
                const photo = carSectionPhotos[section.key as keyof typeof carSectionPhotos];
                return (
                  <div key={section.key} className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 shadow-sm flex flex-col justify-between">
                    <p className="text-xs font-bold text-[#0C1A28] mb-2 font-arabic text-center">{section.label}</p>
                    {photo ? (
                      <div className="relative">
                        <img src={photo} alt={section.label} className="w-full h-32 object-cover rounded-xl border border-slate-300 shadow-inner" />
                        <button type="button" onClick={() => removeCarSectionPhoto(section.key as keyof typeof carSectionPhotos)} className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full shadow hover:bg-red-600 transition-colors" data-testid={`button-remove-${section.key}`}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <label className="flex-1 flex flex-col items-center justify-center h-28 border border-dashed border-[#0C1A28]/40 rounded-xl cursor-pointer bg-[#0C1A28]/5 hover:bg-[#0C1A28]/10 transition-colors p-1 text-center">
                          <Camera className="w-5 h-5 text-[#0C1A28] mb-1" />
                          <span className="text-[11px] font-bold text-[#0C1A28] font-arabic">كاميرا</span>
                          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleCarSectionPhotoChange(section.key as keyof typeof carSectionPhotos, e)} data-testid={`input-camera-${section.key}`} />
                        </label>
                        <label className="flex-1 flex flex-col items-center justify-center h-28 border border-dashed border-slate-300 rounded-xl cursor-pointer bg-white hover:bg-slate-50 transition-colors p-1 text-center">
                          <Upload className="w-5 h-5 text-slate-400 mb-1" />
                          <span className="text-[11px] text-slate-600 font-arabic">معرض</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleCarSectionPhotoChange(section.key as keyof typeof carSectionPhotos, e)} data-testid={`input-${section.key}`} />
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* زر حفظ وبدء الفحص */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 font-arabic text-center sm:text-right">
              سيتم إنشاء التقرير وحفظه كـ مسودة للانتقال المباشر إلى شاشة الفحص التفاعلي 3D.
            </div>
            <button
              type="button"
              disabled={isPending}
              data-testid="button-start-inspection"
              onClick={(e) => {
                e.preventDefault();
                form.handleSubmit(onSubmit, (errors) => {
                  const fieldNames: Record<string, string> = {
                    make: 'الماركة', model: 'الموديل', year: 'سنة الصنع',
                    color: 'اللون', odometer: 'العداد',
                    customerName: 'اسم العميل', customerPhone: 'رقم الجوال'
                  };
                  const msgs = Object.entries(errors).map(([f, e]) => `${fieldNames[f] || f}: ${e?.message || 'خطأ'}`);
                  toast({ title: "يرجى التحقق من البيانات", description: msgs.join('\n') || "بعض الحقول المطلوبة غير مكتملة", variant: "destructive" });
                })();
              }}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-[#C5852C] to-[#DF9B3A] text-[#0C1A28] shadow-lg shadow-[#C5852C]/30 hover:shadow-xl hover:shadow-[#C5852C]/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all touch-manipulation font-arabic flex items-center justify-center gap-2"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[#0C1A28]" /> جارٍ الحفظ وبدء الفحص...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  بدء الفحص التفاعلي 🚀
                </span>
              )}
            </button>
          </div>
        </form>
      </div>

      <SearchRouterModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        defaultMake={form.watch("make") || undefined}
        defaultModel={form.watch("model") || undefined}
        defaultYear={form.watch("year") || undefined}
      />
    </div>
  );
}
