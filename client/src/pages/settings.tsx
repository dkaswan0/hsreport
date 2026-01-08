import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Settings as SettingsIcon, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import type { FaultLibrary } from "@shared/schema";

const CATEGORIES = [
  { value: "Engine", labelEn: "Engine", labelAr: "المحرك" },
  { value: "Transmission", labelEn: "Transmission", labelAr: "ناقل الحركة" },
  { value: "Chassis", labelEn: "Chassis", labelAr: "الهيكل" },
  { value: "Body", labelEn: "Body", labelAr: "الهيكل الخارجي" },
  { value: "Tires", labelEn: "Tires", labelAr: "الإطارات" },
  { value: "Brakes", labelEn: "Brakes", labelAr: "الفرامل" },
  { value: "Electrical", labelEn: "Electrical", labelAr: "الكهرباء" },
  { value: "Wheels", labelEn: "Wheels", labelAr: "الجنوط" },
  { value: "Suspension", labelEn: "Suspension", labelAr: "نظام التعليق" },
  { value: "AC", labelEn: "AC/Cooling", labelAr: "التكييف والتبريد" },
  { value: "Exhaust", labelEn: "Exhaust", labelAr: "العادم" },
  { value: "Safety", labelEn: "Safety", labelAr: "السلامة" },
];

const SEVERITIES = [
  { value: "low", labelEn: "Low", labelAr: "منخفض" },
  { value: "medium", labelEn: "Medium", labelAr: "متوسط" },
  { value: "high", labelEn: "High", labelAr: "عالي" },
];

export default function Settings() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [faultNameAr, setFaultNameAr] = useState("");
  const [faultNameEn, setFaultNameEn] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");

  const { data: faults = [], isLoading } = useQuery<FaultLibrary[]>({
    queryKey: ["/api/fault-library"],
  });

  const addFaultMutation = useMutation({
    mutationFn: async (data: { category: string; faultName: string; description?: string; severity?: string }) => {
      return apiRequest("POST", "/api/fault-library", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fault-library"] });
      toast({
        title: "تم إضافة العطل بنجاح",
        description: "تمت إضافة العطل إلى مكتبة الأعطال",
      });
      setFaultNameAr("");
      setFaultNameEn("");
      setDescription("");
      setSeverity("medium");
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة العطل",
        variant: "destructive",
      });
    },
  });

  const handleAddFault = () => {
    if (!selectedCategory) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار القسم أولاً",
        variant: "destructive",
      });
      return;
    }

    if (!faultNameAr.trim() || !faultNameEn.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم العطل بالعربية والإنجليزية",
        variant: "destructive",
      });
      return;
    }

    const faultName = `${faultNameAr.trim()} - ${faultNameEn.trim()}`;

    addFaultMutation.mutate({
      category: selectedCategory,
      faultName,
      description: description.trim() || undefined,
      severity,
    });
  };

  const categoryFaults = faults.filter((f) => f.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-8 h-8 text-accent" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-arabic">
            الإعدادات
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Settings - إضافة أعطال جديدة لمكتبة الأعطال
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-arabic">
              <Plus className="w-5 h-5" />
              إضافة عطل جديد
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="font-arabic">اختر القسم</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="اختر القسم..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.labelAr} - {cat.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-arabic">اسم العطل بالعربية (اللهجة الإماراتية)</Label>
              <Input
                value={faultNameAr}
                onChange={(e) => setFaultNameAr(e.target.value)}
                placeholder="مثال: البطارية ضعيفة"
                dir="rtl"
                data-testid="input-fault-name-ar"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-arabic">اسم العطل بالإنجليزية</Label>
              <Input
                value={faultNameEn}
                onChange={(e) => setFaultNameEn(e.target.value)}
                placeholder="Example: Battery is weak"
                dir="ltr"
                data-testid="input-fault-name-en"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-arabic">درجة الخطورة</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger data-testid="select-severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((sev) => (
                    <SelectItem key={sev.value} value={sev.value}>
                      {sev.labelAr} - {sev.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-arabic">وصف إضافي (اختياري)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="أضف وصفاً للعطل..."
                rows={3}
                data-testid="input-fault-description"
              />
            </div>

            <Button
              onClick={handleAddFault}
              disabled={addFaultMutation.isPending}
              className="w-full"
              data-testid="button-add-fault"
            >
              {addFaultMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <Plus className="w-4 h-4 ml-2" />
              )}
              إضافة العطل
            </Button>

            {faultNameAr && faultNameEn && (
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-arabic">معاينة:</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {faultNameAr} - {faultNameEn}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-arabic">
              <AlertTriangle className="w-5 h-5" />
              الأعطال في القسم المختار
              {selectedCategory && (
                <span className="text-sm font-normal text-slate-500">
                  ({categoryFaults.length} عطل)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedCategory ? (
              <div className="text-center py-8 text-slate-500">
                <SettingsIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-arabic">اختر قسماً لعرض الأعطال</p>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : categoryFaults.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-arabic">لا توجد أعطال في هذا القسم</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {categoryFaults.slice(0, 50).map((fault) => (
                  <div
                    key={fault.id}
                    className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800"
                    data-testid={`fault-item-${fault.id}`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 dark:text-white truncate">
                        {fault.faultName}
                      </p>
                      {fault.severity && (
                        <span className={`text-xs ${
                          fault.severity === 'high' ? 'text-red-500' :
                          fault.severity === 'medium' ? 'text-amber-500' :
                          'text-green-500'
                        }`}>
                          {fault.severity === 'high' ? 'عالي' :
                           fault.severity === 'medium' ? 'متوسط' : 'منخفض'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {categoryFaults.length > 50 && (
                  <p className="text-center text-xs text-slate-500 py-2">
                    و {categoryFaults.length - 50} عطل آخر...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
