import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInspectionSchema } from "@shared/schema";
import { useCreateInspection, useVinDecoder } from "@/hooks/use-inspections";
import { useLocation } from "wouter";
import { z } from "zod";
import { Loader2, ArrowLeft, Search, Camera } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import Tesseract from 'tesseract.js';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  
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

  const handleScanVin = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng');
      const vinMatch = text.replace(/[^A-Z0-9]/g, '').match(/[A-HJ-NPR-Z0-9]{17}/);
      if (vinMatch) {
        const vin = vinMatch[0];
        form.setValue("vin", vin);
        setVinQuery(vin);
      }
    } catch (err) {
      console.error("Scanning failed:", err);
    } finally {
      setIsScanning(false);
    }
  };

  // Auto-fill form when VIN data arrives
  useEffect(() => {
    if (vinData) {
      if (vinData.make) form.setValue("make", vinData.make);
      if (vinData.model) form.setValue("model", vinData.model);
      if (vinData.year) form.setValue("year", vinData.year);
      if (vinData.color) form.setValue("color", vinData.color);
      // Ensure notes is set so it persists to database
      // @ts-ignore
      if (vinData.notes) form.setValue("notes", vinData.notes);
    }
  }, [vinData, form]);

  const onSubmit = (data: FormValues) => {
    mutate(data, {
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
          <h1 className="text-3xl font-bold text-slate-900 font-arabic">فحص جديد</h1>
          <p className="text-slate-500 font-arabic">أدخل بيانات المركبة والعميل للبدء</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Vehicle Information Section */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary border-b pb-2 font-arabic">
              <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm">1</span>
              بيانات المركبة
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-full">
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-medium text-slate-700 font-arabic">رقم الشاصي (VIN)</label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-arabic"
                  >
                    <Camera className="w-4 h-4" />
                    مسح رقم الشاصي (Scan)
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleScanVin}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                  />
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
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 rtl:right-auto rtl:left-3">
                    {isDecoding || isScanning ? <Loader2 className="w-5 h-5 animate-spin text-accent" /> : <Search className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>
                {isScanning && <p className="text-accent text-xs mt-1 font-arabic">جاري استخراج رقم الشاصي...</p>}
                {form.formState.errors.vin && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.vin.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">الشركة المصنعة</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-2">سنة الصنع</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-2">المسافة المقطوعة (كم)</label>
                <input
                  type="number"
                  {...form.register("odometer")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Customer Information Section */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary border-b pb-2">
              <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm">2</span>
              بيانات العميل
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">اسم العميل</label>
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
              
              <div className="col-span-full">
                <label className="block text-sm font-medium text-slate-700 mb-2">ملاحظات إضافية</label>
                <textarea
                  {...form.register("notes")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all min-h-[100px]"
                  placeholder="أي ملاحظات أولية..."
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
                  <Loader2 className="w-5 h-5 animate-spin" /> جاري الإنشاء...
                </span>
              ) : (
                "بدء الفحص"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
