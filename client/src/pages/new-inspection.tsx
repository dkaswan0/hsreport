import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInspectionSchema } from "@shared/schema";
import { useCreateInspection, useVinDecoder } from "@/hooks/use-inspections";
import { useLocation } from "wouter";
import { z } from "zod";
import { Loader2, ArrowLeft, Search, Camera, Car, Fuel, Gauge, Settings, MapPin, CheckCircle2, ScanLine, Upload, X, Image, PenTool, FileCheck } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { VinScannerModal } from "@/components/vin-scanner-modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Inspection types
const INSPECTION_TYPES = [
  { id: 'full', label: 'فحص شامل', description: 'فحص كامل لجميع أجزاء السيارة' },
  { id: 'mechanical', label: 'ميكانيكا + كومبيوتر', description: 'فحص الأجزاء الميكانيكية والإلكترونية' },
  { id: 'basic', label: 'الأجزاء الأساسية', description: 'فحص الأجزاء الأساسية فقط' },
  { id: 'custom', label: 'فحوصات متنوعة', description: 'اختيار فحوصات محددة' }
];

const formSchema = insertInspectionSchema.extend({
  vin: z.string().min(17, "رقم الشاصي يجب أن يكون 17 حرفاً").max(17),
  odometer: z.coerce.number().min(0, "المسافة المقطوعة يجب أن تكون رقم موجب"),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewInspection() {
  const [, setLocation] = useLocation();
  const { mutate, isPending } = useCreateInspection();
  const { toast } = useToast();
  const [vinQuery, setVinQuery] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [odometerPhoto, setOdometerPhoto] = useState<string | null>(null);
  const [odometerPhotoPreview, setOdometerPhotoPreview] = useState<string | null>(null);
  const odometerPhotoRef = useRef<HTMLInputElement>(null);
  const [vinPhoto, setVinPhoto] = useState<string | null>(null);
  const [vinPhotoPreview, setVinPhotoPreview] = useState<string | null>(null);
  const vinPhotoRef = useRef<HTMLInputElement>(null);
  const [inspectionType, setInspectionType] = useState('full');
  const [customerSignature, setCustomerSignature] = useState<string | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
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
  
  // Car section photos (interior)
  const [carSectionInteriorPhotos, setCarSectionInteriorPhotos] = useState<{
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

  const handleVinPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setVinPhoto(result);
      setVinPhotoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const removeVinPhoto = () => {
    setVinPhoto(null);
    setVinPhotoPreview(null);
    if (vinPhotoRef.current) {
      vinPhotoRef.current.value = "";
    }
  };

  // Car section photo handlers
  const handleMainCarPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setMainCarPhoto(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCarSectionPhotoChange = (section: keyof typeof carSectionPhotos, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCarSectionPhotos(prev => ({
        ...prev,
        [section]: event.target?.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeCarSectionPhoto = (section: keyof typeof carSectionPhotos) => {
    setCarSectionPhotos(prev => ({
      ...prev,
      [section]: null
    }));
  };

  // Interior photo handlers
  const handleCarSectionInteriorPhotoChange = (section: keyof typeof carSectionInteriorPhotos, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCarSectionInteriorPhotos(prev => ({
        ...prev,
        [section]: event.target?.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeCarSectionInteriorPhoto = (section: keyof typeof carSectionInteriorPhotos) => {
    setCarSectionInteriorPhotos(prev => ({
      ...prev,
      [section]: null
    }));
  };

  // Signature canvas functions
  const initCanvas = useCallback(() => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = signatureCanvasRef.current;
      if (canvas) {
        setCustomerSignature(canvas.toDataURL('image/png'));
      }
    }
  };

  const clearSignature = () => {
    initCanvas();
    setCustomerSignature(null);
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
    
    // Add photos, inspection type, and signature to submission
    const inspectionTypeLabel = INSPECTION_TYPES.find(t => t.id === inspectionType)?.label || 'فحص شامل';
    const submissionData = {
      ...data,
      odometerPhoto: odometerPhoto || undefined,
      vinPhoto: vinPhoto || undefined,
      inspectionType: inspectionTypeLabel,
      customerSignature: customerSignature || undefined,
      // Car section photos
      mainCarPhoto: mainCarPhoto || undefined,
      rearLeftDoorPhoto: carSectionPhotos.rearLeftDoor || undefined,
      rearRightDoorPhoto: carSectionPhotos.rearRightDoor || undefined,
      frontLeftDoorPhoto: carSectionPhotos.frontLeftDoor || undefined,
      frontRightDoorPhoto: carSectionPhotos.frontRightDoor || undefined,
      hoodPhoto: carSectionPhotos.hood || undefined,
      trunkPhoto: carSectionPhotos.trunk || undefined,
      // Interior photos
      rearLeftDoorInteriorPhoto: carSectionInteriorPhotos.rearLeftDoor || undefined,
      rearRightDoorInteriorPhoto: carSectionInteriorPhotos.rearRightDoor || undefined,
      frontLeftDoorInteriorPhoto: carSectionInteriorPhotos.frontLeftDoor || undefined,
      frontRightDoorInteriorPhoto: carSectionInteriorPhotos.frontRightDoor || undefined,
      hoodInteriorPhoto: carSectionInteriorPhotos.hood || undefined,
      trunkInteriorPhoto: carSectionInteriorPhotos.trunk || undefined,
    };
    
    mutate(submissionData as any, {
      onSuccess: (newInspection) => {
        if (newInspection && newInspection.id) {
          toast({
            title: "تم حفظ الفحص بنجاح",
            description: "جاري الانتقال لصفحة الفحص...",
          });
          setTimeout(() => {
            setLocation(`/inspections/${newInspection.id}`);
          }, 100);
        } else {
          toast({
            title: "خطأ غير متوقع",
            description: "تم الحفظ لكن لم يتم استلام معرف الفحص",
            variant: "destructive",
          });
        }
      },
      onError: (error) => {
        toast({
          title: "خطأ في حفظ الفحص",
          description: error instanceof Error ? error.message : "حدث خطأ أثناء حفظ بيانات الفحص. حاول مرة أخرى.",
          variant: "destructive",
        });
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
        <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
            const errorMessages = Object.entries(errors).map(([field, error]) => {
              const fieldNames: Record<string, string> = {
                vin: 'رقم الشاصي',
                make: 'الشركة المصنعة',
                model: 'الموديل',
                year: 'سنة الصنع',
                color: 'اللون',
                odometer: 'المسافة المقطوعة',
                customerName: 'اسم العميل',
                customerPhone: 'رقم الجوال'
              };
              return `${fieldNames[field] || field}: ${error?.message || 'خطأ'}`;
            });
            toast({
              title: "يرجى التحقق من البيانات",
              description: errorMessages.join('\n') || "بعض الحقول المطلوبة غير مكتملة",
              variant: "destructive",
            });
          })} className="space-y-8">
          
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

              {/* VIN Photo Upload */}
              <div className="col-span-full">
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Image className="w-4 h-4 text-primary" />
                  صورة لوحة الشاصي
                </label>
                <div className="space-y-3">
                  {vinPhotoPreview ? (
                    <div className="relative inline-block">
                      <img 
                        src={vinPhotoPreview} 
                        alt="صورة لوحة الشاصي" 
                        className="w-full max-w-md h-48 object-cover rounded-xl border-2 border-primary/20"
                      />
                      <button
                        type="button"
                        onClick={removeVinPhoto}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg"
                        data-testid="button-remove-vin-photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      {/* Camera Capture Button */}
                      <label className="flex-1 flex flex-col items-center justify-center h-40 border-2 border-dashed border-accent/50 rounded-xl cursor-pointer bg-accent/5 hover:bg-accent/10 transition-colors">
                        <div className="flex flex-col items-center justify-center py-6">
                          <div className="p-3 bg-accent/20 rounded-full mb-3">
                            <Camera className="w-8 h-8 text-accent" />
                          </div>
                          <p className="text-sm text-accent font-arabic font-bold mb-1">صور لوحة الشاصي</p>
                          <p className="text-xs text-slate-400">التقط صورة مباشرة</p>
                        </div>
                        <input 
                          type="file" 
                          accept="image/*"
                          capture="environment"
                          className="hidden" 
                          onChange={handleVinPhotoChange}
                          data-testid="input-vin-camera"
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
                          ref={vinPhotoRef}
                          type="file" 
                          accept="image/*"
                          className="hidden" 
                          onChange={handleVinPhotoChange}
                          data-testid="input-vin-photo"
                        />
                      </label>
                    </div>
                  )}
                </div>
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
                <label className="block text-sm font-medium text-slate-700 mb-2">معلومات إضافية</label>
                <textarea
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all min-h-[100px]"
                  placeholder="معلومات إضافية عن السيارة..."
                />
              </div>
            </div>
          </div>

          {/* Car Section Photos */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary border-b pb-2 font-arabic">
              <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm">3</span>
              <Camera className="w-5 h-5" />
              صور أقسام السيارة
            </h3>
            <p className="text-sm text-slate-500 mb-4 font-arabic">ارفع صور لأجزاء السيارة - تظهر في التقرير التفاعلي والـ PDF</p>
            
            {/* Main Car Photo */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2 font-arabic flex items-center gap-2">
                <Car className="w-4 h-4 text-primary" />
                صورة السيارة الرئيسية (للـ PDF)
              </label>
              {mainCarPhoto ? (
                <div className="relative inline-block">
                  <img 
                    src={mainCarPhoto} 
                    alt="صورة السيارة" 
                    className="w-full max-w-lg h-56 object-cover rounded-xl border-4 border-primary/30 shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setMainCarPhoto(null)}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg"
                    data-testid="button-remove-main-photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-48 max-w-lg border-2 border-dashed border-primary/50 rounded-xl cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors">
                  <div className="p-4 bg-primary/20 rounded-full mb-3">
                    <Car className="w-10 h-10 text-primary" />
                  </div>
                  <p className="text-sm text-primary font-arabic font-bold mb-1">ارفع صورة السيارة الرئيسية</p>
                  <p className="text-xs text-slate-400 font-arabic">ستظهر بشكل احترافي في تقرير PDF</p>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden" 
                    onChange={handleMainCarPhotoChange}
                    data-testid="input-main-car-photo"
                  />
                </label>
              )}
            </div>

            {/* Car Section Photos Grid - Each section has 2 photos (exterior + interior) */}
            <div className="space-y-6">
              {[
                { key: 'rearLeftDoor', label: 'الباب الخلفي يسار', labelEn: 'Rear Left Door' },
                { key: 'rearRightDoor', label: 'الباب الخلفي يمين', labelEn: 'Rear Right Door' },
                { key: 'frontLeftDoor', label: 'الباب الأمامي يسار', labelEn: 'Front Left Door' },
                { key: 'frontRightDoor', label: 'الباب الأمامي يمين', labelEn: 'Front Right Door' },
                { key: 'hood', label: 'الكبوت / حجرة المحرك', labelEn: 'Hood / Engine Bay' },
                { key: 'trunk', label: 'الشنطة / الشاصي', labelEn: 'Trunk / Chassis' },
              ].map((section) => (
                <div key={section.key} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-3 font-arabic text-center border-b pb-2">
                    {section.label}
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Exterior Photo */}
                    <div className="relative">
                      <label className="block text-xs font-medium text-slate-600 mb-2 font-arabic text-center">
                        صورة خارجية
                      </label>
                      {carSectionPhotos[section.key as keyof typeof carSectionPhotos] ? (
                        <div className="relative">
                          <img 
                            src={carSectionPhotos[section.key as keyof typeof carSectionPhotos]!} 
                            alt={`${section.label} - خارجية`}
                            className="w-full h-28 object-cover rounded-xl border-2 border-blue-300"
                          />
                          <button
                            type="button"
                            onClick={() => removeCarSectionPhoto(section.key as keyof typeof carSectionPhotos)}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg"
                            data-testid={`button-remove-exterior-${section.key}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-blue-300 rounded-xl cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors">
                          <Camera className="w-5 h-5 text-blue-400 mb-1" />
                          <p className="text-xs text-blue-500 font-arabic">رفع صورة</p>
                          <input 
                            type="file" 
                            accept="image/*"
                            className="hidden" 
                            onChange={(e) => handleCarSectionPhotoChange(section.key as keyof typeof carSectionPhotos, e)}
                            data-testid={`input-exterior-${section.key}`}
                          />
                        </label>
                      )}
                    </div>
                    
                    {/* Interior Photo */}
                    <div className="relative">
                      <label className="block text-xs font-medium text-slate-600 mb-2 font-arabic text-center">
                        صورة داخلية
                      </label>
                      {carSectionInteriorPhotos[section.key as keyof typeof carSectionInteriorPhotos] ? (
                        <div className="relative">
                          <img 
                            src={carSectionInteriorPhotos[section.key as keyof typeof carSectionInteriorPhotos]!} 
                            alt={`${section.label} - داخلية`}
                            className="w-full h-28 object-cover rounded-xl border-2 border-green-300"
                          />
                          <button
                            type="button"
                            onClick={() => removeCarSectionInteriorPhoto(section.key as keyof typeof carSectionInteriorPhotos)}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg"
                            data-testid={`button-remove-interior-${section.key}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-green-300 rounded-xl cursor-pointer bg-green-50 hover:bg-green-100 transition-colors">
                          <Camera className="w-5 h-5 text-green-400 mb-1" />
                          <p className="text-xs text-green-500 font-arabic">رفع صورة</p>
                          <input 
                            type="file" 
                            accept="image/*"
                            className="hidden" 
                            onChange={(e) => handleCarSectionInteriorPhotoChange(section.key as keyof typeof carSectionInteriorPhotos, e)}
                            data-testid={`input-interior-${section.key}`}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inspection Type Section */}
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
                  <div className={cn(
                    "font-bold font-arabic mb-1",
                    inspectionType === type.id ? "text-primary" : "text-slate-700"
                  )}>{type.label}</div>
                  <div className="text-xs text-slate-500">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Customer Signature Section */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary border-b pb-2 font-arabic">
              <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm">5</span>
              <PenTool className="w-5 h-5" />
              توقيع العميل
            </h3>
            
            <div className="space-y-3">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-2 bg-white">
                <canvas
                  ref={signatureCanvasRef}
                  width={400}
                  height={150}
                  className="w-full max-w-md mx-auto cursor-crosshair touch-none rounded-lg"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  data-testid="canvas-signature"
                />
              </div>
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearSignature}
                  className="text-slate-600"
                  data-testid="button-clear-signature"
                >
                  <X className="w-4 h-4 ml-1" />
                  مسح التوقيع
                </Button>
              </div>
              <p className="text-xs text-slate-400 text-center font-arabic">
                وقع هنا باستخدام الإصبع أو الماوس - التوقيع يظهر في التقرير
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              data-testid="button-start-inspection"
              className="px-8 py-3 rounded-xl font-semibold bg-accent text-slate-900 shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}
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
