import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInspectionSchema } from "@shared/schema";
import { useCreateInspection } from "@/hooks/use-inspections";
import { useLocation } from "wouter";
import { z } from "zod";
import { Loader2, ArrowLeft, Camera, Car, FileCheck, Upload, X, Image, Sparkles, Globe } from "lucide-react";
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
  { id: 'full', label: 'فحص شامل', description: 'فحص كامل لجميع أجزاء المركبة' },
  { id: 'mechanical', label: 'فحص ميكانيكي وإلكتروني', description: 'فحص الأجزاء الميكانيكية والحاسوبية' },
  { id: 'basic', label: 'الأجزاء الأساسية', description: 'فحص الأجزاء الأساسية فقط' },
  { id: 'custom', label: 'فحوصات متنوعة', description: 'اختيار فحوصات محددة' }
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
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const vinPhotoRef = useRef<HTMLInputElement>(null);

  const handleVinPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningVin(true);
    toast({
      title: "جاري تحليل الصورة",
      description: "جاري استخراج رقم الشاصي (VIN) بالذكاء الاصطناعي..."
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
              title: "تم استخراج رقم الشاصي بنجاح",
              description: `رقم الشاصي: ${data.vin}`
            });
            // Automatically decode VIN to fetch specs!
            await decodeVin(data.vin);
          } else {
            throw new Error("لم يتم العثور على رقم شاصي في الصورة");
          }
        } catch (error: any) {
          toast({
            title: "خطأ في استخراج رقم الشاصي",
            description: error.message || "حدث خطأ غير متوقع",
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

  const decodeVin = async (vinCode: string) => {
    setIsDecodingVin(true);
    try {
      const response = await fetch(`/api/vin/${vinCode}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to decode VIN");
      }
      const data = await response.json();
      if (data.success) {
        if (data.make) form.setValue("make", data.make);
        if (data.model) form.setValue("model", data.model);
        if (data.year) form.setValue("year", data.year);

        toast({
          title: "تم استخراج بيانات المركبة تلقائياً",
          description: `الماركة: ${data.make} | الموديل: ${data.model} | سنة الصنع: ${data.year}`,
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "لم يتم التعرف على رقم الهيكل تلقائياً",
        description: "يرجى تعبئة بيانات السيارة يدوياً",
        variant: "destructive",
      });
    } finally {
      setIsDecodingVin(false);
    }
  };

  const handleOdometerPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      const compressed = await compressImage(result);
      setOdometerPhoto(compressed);
      setOdometerPhotoPreview(compressed);
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
    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={() => history.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-500 rtl:rotate-180" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-arabic">فحص جديد</h1>
          <p className="text-slate-500 font-arabic">أدخل بيانات المركبة والعميل</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-8">

          {/* ── 1. بيانات السيارة ── */}
          <div>
            <div className="flex items-center justify-between border-b pb-2 mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-primary font-arabic">
                <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm">1</span>
                بيانات السيارة
              </h3>
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(true)}
                className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all font-medium shadow-sm"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                بحث عيوب واستدعاءات الموديل حياً (Search Router)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* 1. رقم الهيكل VIN (أول خانة في الأعلى مع جلب البيانات تلقائياً) */}
              <div className="col-span-full bg-primary/5 p-4 rounded-2xl border border-primary/20">
                <label className="block text-sm font-bold text-primary mb-2 font-arabic flex items-center justify-between">
                  <span>رقم الهيكل (VIN) <span className="text-xs font-normal text-slate-500">(أدخل 17 رقم/حرف لجلب بيانات المركبة تلقائياً)</span></span>
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
                    className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-300 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all font-mono text-lg tracking-widest uppercase pl-12"
                    placeholder="WBA3A5C50DF..."
                    maxLength={17}
                    data-testid="input-vin"
                  />
                  {isScanningVin ? (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-[#C5852C]" />
                    </div>
                  ) : isDecodingVin ? (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => vinPhotoRef.current?.click()}
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-accent transition-colors"
                      title="مسح رقم الشاصي من ملصق أو باركود بالذكاء الاصطناعي"
                      data-testid="button-scan-vin"
                    >
                      <Sparkles className="w-5 h-5 text-[#C5852C] animate-pulse" />
                    </button>
                  )}
                  <input
                    ref={vinPhotoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleVinPhotoChange}
                  />
                </div>
              </div>

              {/* الماركة */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-arabic">الماركة <span className="text-red-500">*</span></label>
                <input
                  {...form.register("make")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                  placeholder="Toyota, BMW, Nissan..."
                  data-testid="input-make"
                />
                {form.formState.errors.make && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.make.message}</p>
                )}
              </div>

              {/* الموديل */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-arabic">الموديل <span className="text-red-500">*</span></label>
                <input
                  {...form.register("model")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
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
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                  data-testid="input-year"
                />
              </div>

              {/* اللون (قائمة منسدلة قائمة بالألوان + اختيار أو كتابة يدوية) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-arabic">لون المركبة (اختر أو اكتب يدويًا)</label>
                <input
                  list="car-colors-list"
                  {...form.register("color")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all font-arabic"
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
                <label className="block text-sm font-medium text-slate-700 mb-2 font-arabic">العداد (كم)</label>
                <input
                  type="number"
                  {...form.register("odometer")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                  data-testid="input-odometer"
                />
              </div>

              {/* صورة العداد */}
              <div className="col-span-full">
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2 font-arabic">
                  <Camera className="w-4 h-4 text-primary" />
                  صورة العداد (تصوير كاميرا مباشر أو رفع من الجهاز)
                </label>
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
                    <label className="flex-1 flex flex-col items-center justify-center h-36 border-2 border-dashed border-primary/50 rounded-xl cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors">
                      <Camera className="w-7 h-7 text-primary mb-2" />
                      <p className="text-sm text-primary font-arabic font-bold">التقاط بالكاميرا</p>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleOdometerPhotoChange} data-testid="input-odometer-camera" />
                    </label>
                    <label className="flex-1 flex flex-col items-center justify-center h-36 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                      <Upload className="w-7 h-7 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-600 font-arabic">ارفع من الجهاز</p>
                      <input ref={odometerPhotoRef} type="file" accept="image/*" className="hidden" onChange={handleOdometerPhotoChange} data-testid="input-odometer-photo" />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── 2. بيانات العميل ── */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary border-b pb-2 font-arabic">
              <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm">2</span>
              بيانات العميل (خاصة بالفاحص الداخلي فقط - لا تظهر بالتقرير العام أو PDF)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-arabic">اسم العميل</label>
                <input
                  {...form.register("customerName")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                  placeholder="الاسم الكامل"
                  data-testid="input-customer-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-arabic">رقم الهاتف</label>
                <input
                  {...form.register("customerPhone")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                  placeholder="05xxxxxxxx"
                  data-testid="input-customer-phone"
                />
              </div>
              <div className="col-span-full">
                <label className="block text-sm font-medium text-slate-700 mb-2 font-arabic">ملاحظات إضافية</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all min-h-[90px]"
                  placeholder="معلومات إضافية عن المركبة أو العميل..."
                />
              </div>
            </div>
          </div>

          {/* ── 3. صور أقسام السيارة ── */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary border-b pb-2 font-arabic">
              <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm">3</span>
              <Camera className="w-5 h-5" />
              صور المركبة (يدعم تصوير كاميرا الجوال مباشر أو الرفع من الجهاز)
            </h3>
            <p className="text-sm text-slate-500 mb-4 font-arabic">تظهر بالتقرير فقط الصور المرفقة دون ترك خانات فارغة للمركبات ذات البابين</p>

            {/* الصورة الرئيسية */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2 font-arabic flex items-center gap-2">
                <Car className="w-4 h-4 text-primary" />
                صورة السيارة الرئيسية
              </label>
              {mainCarPhoto ? (
                <div className="relative inline-block">
                  <img src={mainCarPhoto} alt="صورة السيارة" className="w-full max-w-lg h-56 object-cover rounded-xl border-4 border-primary/30 shadow-lg" />
                  <button type="button" onClick={() => setMainCarPhoto(null)} className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg" data-testid="button-remove-main-photo">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-3 max-w-lg">
                  <label className="flex-1 flex flex-col items-center justify-center h-44 border-2 border-dashed border-primary/50 rounded-xl cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors">
                    <Camera className="w-8 h-8 text-primary mb-2" />
                    <p className="text-xs text-primary font-arabic font-bold">التقاط كاميرا الجوال</p>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleMainCarPhotoChange} data-testid="input-main-car-camera" />
                  </label>
                  <label className="flex-1 flex flex-col items-center justify-center h-44 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-xs text-slate-600 font-arabic">رفع من الجهاز</p>
                    <input type="file" accept="image/*" className="hidden" onChange={handleMainCarPhotoChange} data-testid="input-main-car-photo" />
                  </label>
                </div>
              )}
            </div>

            {/* أقسام السيارة */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key: 'frontLeftDoor', label: 'الباب الأمامي يسار' },
                { key: 'frontRightDoor', label: 'الباب الأمامي يمين' },
                { key: 'rearLeftDoor', label: 'الباب الخلفي يسار (اختياري للبابين)' },
                { key: 'rearRightDoor', label: 'الباب الخلفي يمين (اختياري للبابين)' },
                { key: 'hood', label: 'غطاء المحرك' },
                { key: 'trunk', label: 'صندوق الأمتعة' },
              ].map((section) => {
                const photo = carSectionPhotos[section.key as keyof typeof carSectionPhotos];
                return (
                  <div key={section.key} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <p className="text-xs font-bold text-slate-700 mb-2 font-arabic text-center">{section.label}</p>
                    {photo ? (
                      <div className="relative">
                        <img src={photo} alt={section.label} className="w-full h-28 object-cover rounded-lg border border-slate-300" />
                        <button type="button" onClick={() => removeCarSectionPhoto(section.key as keyof typeof carSectionPhotos)} className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full shadow" data-testid={`button-remove-${section.key}`}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <label className="flex-1 flex flex-col items-center justify-center h-28 border border-dashed border-primary/40 rounded-lg cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors p-1 text-center">
                          <Camera className="w-4 h-4 text-primary mb-1" />
                          <span className="text-[10px] font-bold text-primary font-arabic">كاميرا</span>
                          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleCarSectionPhotoChange(section.key as keyof typeof carSectionPhotos, e)} data-testid={`input-camera-${section.key}`} />
                        </label>
                        <label className="flex-1 flex flex-col items-center justify-center h-28 border border-dashed border-slate-300 rounded-lg cursor-pointer bg-white hover:bg-slate-50 transition-colors p-1 text-center">
                          <Upload className="w-4 h-4 text-slate-400 mb-1" />
                          <span className="text-[10px] text-slate-500 font-arabic">معرض</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleCarSectionPhotoChange(section.key as keyof typeof carSectionPhotos, e)} data-testid={`input-${section.key}`} />
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 4. نوع الفحص ── */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary border-b pb-2 font-arabic">
              <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm">4</span>
              <FileCheck className="w-5 h-5" />
              نوع الفحص
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {INSPECTION_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setInspectionType(type.id)}
                  className={cn(
                    "p-4 rounded-xl border-2 text-center transition-all",
                    inspectionType === type.id
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-slate-200 bg-slate-50 hover:border-primary/50"
                  )}
                  data-testid={`button-inspection-type-${type.id}`}
                >
                  <div className={cn("font-bold font-arabic mb-1 text-sm", inspectionType === type.id ? "text-primary" : "text-slate-700")}>{type.label}</div>
                  <div className="text-xs text-slate-500">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* زر الإرسال */}
          <div className="pt-6 border-t border-slate-100 flex justify-end">
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
              className="px-8 py-3 rounded-xl font-semibold bg-accent text-slate-900 shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all touch-manipulation font-arabic"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> جارٍ الحفظ...
                </span>
              ) : "بدء الفحص"}
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
