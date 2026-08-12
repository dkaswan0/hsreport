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
import { Plus, Settings as SettingsIcon, AlertTriangle, CheckCircle2, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import type { FaultLibrary } from "@shared/schema";

const CATEGORIES = [
  { value: "Engine", labelAr: "المحرك" },
  { value: "Transmission", labelAr: "ناقل الحركة" },
  { value: "Chassis", labelAr: "الهيكل" },
  { value: "Body", labelAr: "الهيكل الخارجي" },
  { value: "Tires", labelAr: "الإطارات" },
  { value: "Brakes", labelAr: "الفرامل" },
  { value: "Electrical", labelAr: "الكهرباء" },
  { value: "Wheels", labelAr: "الجنوط" },
  { value: "Suspension", labelAr: "نظام التعليق" },
  { value: "AC", labelAr: "التكييف والتبريد" },
  { value: "Exhaust", labelAr: "العادم" },
  { value: "Safety", labelAr: "السلامة" },
];

const SEVERITIES = [
  { value: "low", labelAr: "منخفض" },
  { value: "medium", labelAr: "متوسط" },
  { value: "high", labelAr: "عالي" },
];

export default function Settings() {
  const { toast } = useToast();

  // ── Fault Library State ──────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [faultNameAr, setFaultNameAr] = useState("");
  const [faultNameEn, setFaultNameEn] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");

  // ── Password Change State ────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Fault Library Query ──────────────────────────────
  const { data: faults = [], isLoading } = useQuery<FaultLibrary[]>({
    queryKey: ["/api/fault-library"],
  });

  const addFaultMutation = useMutation({
    mutationFn: async (data: { category: string; faultName: string; description?: string; severity?: string }) => {
      return apiRequest("POST", "/api/fault-library", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fault-library"] });
      toast({ title: "تم إضافة العطل بنجاح" });
      setFaultNameAr(""); setFaultNameEn(""); setDescription(""); setSeverity("medium");
    },
    onError: () => {
      toast({ title: "خطأ", description: "حدث خطأ أثناء إضافة العطل", variant: "destructive" });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "فشل تغيير كلمة المرور");
      return json;
    },
    onSuccess: () => {
      toast({ title: "✅ تم تغيير كلمة المرور بنجاح" });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const handleAddFault = () => {
    if (!selectedCategory) {
      toast({ title: "خطأ", description: "يرجى اختيار القسم أولاً", variant: "destructive" });
      return;
    }
    if (!faultNameAr.trim() || !faultNameEn.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال اسم العطل بالعربية والإنجليزية", variant: "destructive" });
      return;
    }
    addFaultMutation.mutate({
      category: selectedCategory,
      faultName: `${faultNameAr.trim()} - ${faultNameEn.trim()}`,
      description: description.trim() || undefined,
      severity,
    });
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "خطأ", description: "كلمة المرور الجديدة غير متطابقة", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const categoryFaults = faults.filter((f) => f.category === selectedCategory);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-8 h-8 text-accent" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-arabic">الإعدادات</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">إدارة الأعطال وكلمة المرور</p>
        </div>
      </div>

      {/* ── تغيير كلمة المرور ── */}
      <Card className="border-2 border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-arabic">
            <Lock className="w-5 h-5 text-primary" />
            تغيير كلمة المرور
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* كلمة المرور الحالية */}
            <div className="space-y-2">
              <Label className="font-arabic">كلمة المرور الحالية</Label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* كلمة المرور الجديدة */}
            <div className="space-y-2">
              <Label className="font-arabic">كلمة المرور الجديدة</Label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* تأكيد كلمة المرور */}
            <div className="space-y-2">
              <Label className="font-arabic">تأكيد كلمة المرور</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                  onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-zinc-900 text-sm font-arabic">⚠ كلمتا المرور غير متطابقتين</p>
          )}
          {newPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
            <p className="text-zinc-900 text-sm font-arabic">✓ كلمتا المرور متطابقتان</p>
          )}

          <Button
            onClick={handleChangePassword}
            disabled={changePasswordMutation.isPending}
            className="bg-primary text-white hover:bg-primary/90"
          >
            {changePasswordMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin ml-2" /> جارٍ التغيير...</>
            ) : (
              <><Lock className="w-4 h-4 ml-2" /> تغيير كلمة المرور</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ── مكتبة الأعطال ── */}
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
                      {cat.labelAr} — {cat.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-arabic">اسم العطل بالعربية</Label>
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
                      {sev.labelAr}
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
                placeholder="أضف وصفًا للعطل..."
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
                <p className="text-xs text-slate-500 mb-1 font-arabic">معاينة:</p>
                <p className="text-sm font-medium">{faultNameAr} - {faultNameEn}</p>
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
                <span className="text-sm font-normal text-slate-500">({categoryFaults.length})</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedCategory ? (
              <div className="text-center py-8 text-slate-500">
                <SettingsIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-arabic">اختر قسمًا لعرض الأعطال</p>
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
                    <CheckCircle2 className="w-4 h-4 text-zinc-900 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 dark:text-white truncate">{fault.faultName}</p>
                      {fault.severity && (
                        <span className={`text-xs ${
                          fault.severity === 'high' ? 'text-zinc-900' :
                          fault.severity === 'medium' ? 'text-zinc-700' : 'text-zinc-900'
                        }`}>
                          {fault.severity === 'high' ? 'عالي' : fault.severity === 'medium' ? 'متوسط' : 'منخفض'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {categoryFaults.length > 50 && (
                  <p className="text-center text-xs text-slate-500 py-2">و {categoryFaults.length - 50} عطل آخر...</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
