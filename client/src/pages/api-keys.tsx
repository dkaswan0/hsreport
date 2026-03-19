import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Key, Plus, Trash2, Copy, CheckCheck, AlertTriangle,
  Code2, Globe, Clock, Eye, EyeOff
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

type ApiKey = {
  id: number;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-AE", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

export default function ApiKeysPage() {
  const { toast } = useToast();
  const [newName, setNewName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const { data: keys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/keys"],
  });

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      apiRequest("POST", "/api/keys", { name }).then(r => r.json()),
    onSuccess: (data) => {
      setCreatedKey(data.rawKey);
      setNewName("");
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل إنشاء المفتاح", variant: "destructive" });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/keys/${id}`).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      toast({ title: "تم الحذف", description: "تم إلغاء المفتاح بنجاح" });
    },
  });

  async function copyKey(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-arabic">مفاتيح API</h1>
          <p className="text-sm text-slate-500 font-arabic mt-0.5">
            أنشئ مفاتيح للربط مع تطبيقات خارجية بدون تسجيل دخول
          </p>
        </div>
        <Key className="w-8 h-8 text-primary opacity-60" />
      </div>

      {/* How to use */}
      <Card className="rounded-2xl border border-blue-200 bg-blue-50">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-600 shrink-0" />
            <p className="font-bold text-blue-800 font-arabic">كيفية الاستخدام</p>
          </div>
          <p className="text-sm text-blue-700 font-arabic">
            أضف المفتاح في كل طلب عبر الـ header التالي:
          </p>
          <code className="block bg-blue-900 text-green-300 rounded-xl px-4 py-3 text-xs ltr font-mono select-all">
            X-API-Key: hs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
          </code>
          <p className="text-xs text-blue-600 font-arabic">
            أو بديلاً: <code className="bg-blue-100 px-1 rounded">Authorization: Bearer hs_xxx...</code>
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-white rounded-xl p-3 border border-blue-200">
              <Globe className="w-4 h-4 text-blue-500 mb-1" />
              <p className="text-xs font-bold text-slate-700 font-arabic">Base URL</p>
              <code className="text-xs text-slate-500 ltr">https://your-app.replit.app</code>
            </div>
            <div className="bg-white rounded-xl p-3 border border-blue-200">
              <Key className="w-4 h-4 text-blue-500 mb-1" />
              <p className="text-xs font-bold text-slate-700 font-arabic">المسارات المحمية</p>
              <code className="text-xs text-slate-500 ltr">/api/*</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create new key */}
      <Card className="rounded-2xl border border-slate-200 shadow-sm">
        <CardHeader className="px-5 pt-5 pb-3">
          <p className="font-bold text-slate-800 font-arabic">إنشاء مفتاح جديد</p>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex gap-3">
            <Button
              onClick={() => newName.trim() && createMutation.mutate(newName)}
              disabled={createMutation.isPending || !newName.trim()}
              className="h-11 px-5 rounded-xl font-arabic shrink-0"
              data-testid="button-create-api-key"
            >
              {createMutation.isPending ? (
                <span className="animate-spin mr-2">⏳</span>
              ) : (
                <Plus className="w-4 h-4 ml-2" />
              )}
              إنشاء
            </Button>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && newName.trim() && createMutation.mutate(newName)}
              placeholder="مثال: تطبيق الموبايل"
              className="h-11 rounded-xl text-right font-arabic"
              data-testid="input-api-key-name"
            />
          </div>
        </CardContent>
      </Card>

      {/* Keys list */}
      <Card className="rounded-2xl border border-slate-200 shadow-sm">
        <CardHeader className="px-5 pt-5 pb-3 flex flex-row items-center justify-between">
          <p className="font-bold text-slate-800 font-arabic">المفاتيح الحالية</p>
          <Badge variant="outline" className="font-arabic">{keys.length} مفتاح</Badge>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {isLoading ? (
            <div className="text-center py-8 text-slate-400 font-arabic">جاري التحميل...</div>
          ) : keys.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Key className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-arabic">لا توجد مفاتيح بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                  data-testid={`api-key-row-${k.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Key className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 font-arabic text-sm truncate">{k.name}</p>
                      <code className="text-xs text-slate-500 ltr">{k.keyPrefix}</code>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1 text-slate-400 text-xs font-arabic">
                        <Clock className="w-3 h-3" />
                        آخر استخدام: {formatDate(k.lastUsedAt)}
                      </div>
                      <p className="text-xs text-slate-400 font-arabic">
                        أُنشئ: {formatDate(k.createdAt)}
                      </p>
                    </div>
                    <Badge className={k.isActive ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700"}>
                      {k.isActive ? "نشط" : "ملغى"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg h-8 w-8"
                      onClick={() => revokeMutation.mutate(k.id)}
                      disabled={revokeMutation.isPending}
                      data-testid={`button-revoke-key-${k.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Example endpoints */}
      <Card className="rounded-2xl border border-slate-200">
        <CardContent className="p-5">
          <p className="font-bold text-slate-700 font-arabic mb-3">أمثلة على الاستخدام</p>
          <div className="space-y-2 text-xs font-mono ltr text-slate-600">
            {[
              ["GET", "/api/inspections", "جلب كل الفحوصات"],
              ["GET", "/api/inspections/{id}", "جلب فحص محدد"],
              ["POST", "/api/inspections", "إنشاء فحص جديد"],
              ["GET", "/api/vin/{vin}", "فك رمز الهيكل"],
              ["POST", "/api/obd/lookup", "بحث عن كود OBD"],
              ["GET", "/api/fault-library", "قاعدة العطول"],
            ].map(([method, path, desc]) => (
              <div key={path} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2">
                <span className={`w-12 text-center font-bold text-xs rounded px-1 py-0.5 ${
                  method === "GET" ? "bg-blue-100 text-blue-700" :
                  method === "POST" ? "bg-green-100 text-green-700" :
                  "bg-red-100 text-red-700"
                }`}>{method}</span>
                <span className="flex-1 text-slate-700">{path}</span>
                <span className="text-slate-400 font-arabic text-xs">{desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog: show newly created key */}
      <Dialog open={!!createdKey} onOpenChange={() => { setCreatedKey(null); setShowKey(false); }}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-arabic text-right flex items-center gap-2">
              <CheckCheck className="w-5 h-5 text-green-500" />
              تم إنشاء المفتاح بنجاح
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 font-arabic">
                <strong>انتبه:</strong> هذا المفتاح يظهر مرة واحدة فقط. احفظه في مكان آمن الآن.
              </p>
            </div>
            <div className="relative">
              <div className="bg-slate-900 rounded-xl p-4 ltr font-mono text-sm break-all select-all">
                {showKey
                  ? <span className="text-green-300">{createdKey}</span>
                  : <span className="text-slate-500">{"•".repeat(50)}</span>
                }
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  className="flex-1 rounded-xl font-arabic"
                  onClick={() => copyKey(createdKey!)}
                  variant={copied ? "outline" : "default"}
                >
                  {copied
                    ? <><CheckCheck className="w-4 h-4 ml-2 text-green-500" />تم النسخ</>
                    : <><Copy className="w-4 h-4 ml-2" />نسخ المفتاح</>
                  }
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setShowKey(v => !v)}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
