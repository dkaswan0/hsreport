import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Key, Plus, Trash2, Copy, CheckCheck, AlertTriangle,
  Eye, EyeOff, Play, ChevronDown, ChevronUp, Loader2,
  Circle, CheckCircle2,
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
    hour: "2-digit", minute: "2-digit",
  });
}

function CopyButton({ text, label = "نسخ" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors"
    >
      {done ? <CheckCheck className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      {done ? "تم" : label}
    </button>
  );
}

export default function ApiKeysPage() {
  const { toast } = useToast();
  const [newName, setNewName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [showCode, setShowCode] = useState<"js" | "python" | "curl" | null>(null);
  const [testKey, setTestKey] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const { data: keys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/keys"],
  });

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      apiRequest("POST", "/api/keys", { name }).then(r => r.json()),
    onSuccess: (data) => {
      setCreatedKey(data.rawKey);
      setTestKey(data.rawKey);
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
      toast({ title: "تم الحذف", description: "تم حذف المفتاح بنجاح" });
    },
  });

  async function runTest() {
    if (!testKey.trim()) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/inspections", {
        headers: { "X-API-Key": testKey.trim() },
      });
      const data = await res.json();
      setTestResult({ ok: res.ok, status: res.status, data });
    } catch (e: any) {
      setTestResult({ ok: false, status: 0, data: { error: e.message } });
    } finally {
      setTestLoading(false);
    }
  }

  const baseUrl = window.location.origin;

  const codeSnippets: Record<string, string> = {
    js: `// JavaScript / Node.js
const API_KEY = "${testKey || "hs_xxxx..."}";
const BASE_URL = "${baseUrl}";

// مثال: جلب كل الفحوصات
const response = await fetch(\`\${BASE_URL}/api/inspections\`, {
  headers: { "X-API-Key": API_KEY }
});
const inspections = await response.json();
console.log(inspections);

// مثال: فك رمز هيكل
const vin = await fetch(\`\${BASE_URL}/api/vin/1HGBH41JXMN109186\`, {
  headers: { "X-API-Key": API_KEY }
}).then(r => r.json());
console.log(vin.make, vin.model, vin.year);`,

    python: `# Python
import requests

API_KEY = "${testKey || "hs_xxxx..."}"
BASE_URL = "${baseUrl}"
HEADERS = {"X-API-Key": API_KEY}

# جلب كل الفحوصات
resp = requests.get(f"{BASE_URL}/api/inspections", headers=HEADERS)
inspections = resp.json()
print(inspections)

# فك رمز هيكل
vin = requests.get(f"{BASE_URL}/api/vin/1HGBH41JXMN109186", headers=HEADERS).json()
print(vin["make"], vin["model"], vin["year"])`,

    curl: `# cURL (Terminal)
API_KEY="${testKey || "hs_xxxx..."}"
BASE_URL="${baseUrl}"

# جلب كل الفحوصات
curl "$BASE_URL/api/inspections" \\
  -H "X-API-Key: $API_KEY"

# فك رمز هيكل
curl "$BASE_URL/api/vin/1HGBH41JXMN109186" \\
  -H "X-API-Key: $API_KEY"`,
  };

  const steps = [
    {
      num: 1,
      title: "أنشئ مفتاح API",
      desc: "اكتب اسم التطبيق الخارجي واضغط إنشاء",
      done: keys.length > 0,
    },
    {
      num: 2,
      title: "احفظ المفتاح",
      desc: "المفتاح يظهر مرة واحدة فقط — انسخه الآن",
      done: false,
    },
    {
      num: 3,
      title: "استخدمه في تطبيقك",
      desc: `أضف X-API-Key: <مفتاحك> في كل طلب لـ ${baseUrl}/api/...`,
      done: false,
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-500" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-arabic">مفاتيح API</h1>
          <p className="text-sm text-slate-500 font-arabic mt-0.5">
            اربط أي تطبيق أو موقع خارجي بنظامك بدون تسجيل دخول
          </p>
        </div>
        <Key className="w-8 h-8 text-primary opacity-60" />
      </div>

      {/* Steps */}
      <div className="grid grid-cols-3 gap-3">
        {steps.map((s) => (
          <div
            key={s.num}
            className={`rounded-2xl border p-4 text-right transition-all cursor-pointer ${
              activeStep === s.num
                ? "border-primary bg-primary/5"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
            onClick={() => setActiveStep(activeStep === s.num ? null : s.num)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                s.done ? "bg-green-500 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                {s.done ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </span>
            </div>
            <p className="font-bold text-sm text-slate-800 font-arabic">{s.title}</p>
            <p className="text-xs text-slate-500 font-arabic mt-1 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Create key + Keys list side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Create */}
        <Card className="rounded-2xl border border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <p className="font-bold text-slate-800 font-arabic mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              إنشاء مفتاح جديد
            </p>
            <div className="space-y-3">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && newName.trim() && createMutation.mutate(newName)}
                placeholder="اسم التطبيق — مثال: موبايل العميل"
                className="h-11 rounded-xl text-right font-arabic"
                data-testid="input-api-key-name"
              />
              <Button
                onClick={() => newName.trim() && createMutation.mutate(newName)}
                disabled={createMutation.isPending || !newName.trim()}
                className="w-full h-11 rounded-xl font-arabic"
                data-testid="button-create-api-key"
              >
                {createMutation.isPending
                  ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري الإنشاء...</>
                  : <><Key className="w-4 h-4 ml-2" />إنشاء المفتاح</>
                }
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="rounded-2xl border border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <p className="font-bold text-slate-800 font-arabic mb-3 flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              مفاتيحك الحالية
              <Badge variant="outline" className="font-arabic mr-auto">{keys.length}</Badge>
            </p>
            {isLoading ? (
              <div className="py-6 text-center text-slate-400 text-sm font-arabic">جاري التحميل...</div>
            ) : keys.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Key className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm font-arabic">لا توجد مفاتيح بعد</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {keys.map((k) => (
                  <div
                    key={k.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
                    data-testid={`api-key-row-${k.id}`}
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm font-arabic truncate">{k.name}</p>
                      <code className="text-xs text-slate-400 ltr">{k.keyPrefix}</code>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-xs text-slate-400 font-arabic hidden sm:block">
                        {k.lastUsedAt ? `استُخدم ${formatDate(k.lastUsedAt)}` : "لم يُستخدم"}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg"
                        onClick={() => revokeMutation.mutate(k.id)}
                        disabled={revokeMutation.isPending}
                        data-testid={`button-revoke-key-${k.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live Tester */}
      <Card className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-slate-50 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <p className="font-bold text-violet-800 font-arabic flex items-center gap-2">
            <Play className="w-4 h-4" />
            جرّب المفتاح الآن — مباشرة من هنا
          </p>
          <div className="flex gap-3">
            <Button
              onClick={runTest}
              disabled={testLoading || !testKey.trim()}
              className="h-11 px-6 rounded-xl font-arabic shrink-0 bg-violet-600 hover:bg-violet-700"
            >
              {testLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><Play className="w-4 h-4 ml-2" />تجربة</>
              }
            </Button>
            <Input
              value={testKey}
              onChange={(e) => setTestKey(e.target.value)}
              placeholder="الصق مفتاحك هنا — hs_..."
              className="h-11 rounded-xl font-mono text-sm ltr"
              dir="ltr"
              data-testid="input-test-api-key"
            />
          </div>

          {testResult && (
            <div className={`rounded-xl border p-4 ${
              testResult.ok
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <Badge className={testResult.ok
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
                }>
                  {testResult.ok ? "✓ نجح" : "✗ فشل"} — {testResult.status}
                </Badge>
                <CopyButton text={JSON.stringify(testResult.data, null, 2)} label="نسخ النتيجة" />
              </div>
              <pre className="text-xs font-mono ltr text-slate-700 overflow-auto max-h-40 whitespace-pre-wrap">
                {JSON.stringify(
                  Array.isArray(testResult.data)
                    ? { count: testResult.data.length, sample: testResult.data[0] }
                    : testResult.data,
                  null, 2
                )}
              </pre>
            </div>
          )}

          {!testKey && (
            <p className="text-xs text-slate-400 font-arabic text-center">
              أنشئ مفتاحاً أعلاه وسيظهر هنا تلقائياً، أو الصقه يدوياً
            </p>
          )}
        </CardContent>
      </Card>

      {/* Code Snippets */}
      <Card className="rounded-2xl border border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <p className="font-bold text-slate-800 font-arabic mb-3">كود جاهز — انسخ واستخدم مباشرة</p>
          <div className="flex gap-2 mb-4">
            {(["js", "python", "curl"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setShowCode(showCode === lang ? null : lang)}
                className={`px-4 py-1.5 rounded-lg text-sm font-mono font-bold transition-colors ${
                  showCode === lang
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {lang === "js" ? "JavaScript" : lang === "python" ? "Python" : "cURL"}
              </button>
            ))}
          </div>
          {showCode && (
            <div className="relative">
              <div className="absolute top-3 left-3 z-10">
                <CopyButton text={codeSnippets[showCode]} label="نسخ الكود" />
              </div>
              <pre className="bg-slate-900 text-green-300 rounded-xl p-4 pt-8 text-xs font-mono ltr overflow-auto max-h-64 whitespace-pre">
                {codeSnippets[showCode]}
              </pre>
            </div>
          )}
          {!showCode && (
            <p className="text-sm text-slate-400 font-arabic text-center py-4">
              اختر لغة البرمجة لعرض الكود الجاهز
            </p>
          )}
        </CardContent>
      </Card>

      {/* API Reference quick */}
      <Card className="rounded-2xl border border-slate-200">
        <CardContent className="p-5">
          <p className="font-bold text-slate-700 font-arabic mb-3">الروابط المتاحة</p>
          <div className="space-y-1.5">
            {[
              ["GET", "/api/inspections", "كل الفحوصات"],
              ["GET", "/api/inspections/:id", "فحص واحد برقمه"],
              ["POST", "/api/inspections", "إنشاء فحص جديد"],
              ["PUT", "/api/inspections/:id", "تحديث فحص"],
              ["DELETE", "/api/inspections/:id", "حذف فحص"],
              ["GET", "/api/vin/:vin", "فك رمز الشاصي"],
              ["POST", "/api/obd/lookup", "بحث عن كود OBD"],
              ["GET", "/api/fault-library", "قاعدة العطول (9,639)"],
            ].map(([method, path, desc]) => (
              <div key={path} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50">
                <span className={`w-14 text-center font-bold text-xs rounded-md px-1.5 py-0.5 shrink-0 ${
                  method === "GET" ? "bg-blue-100 text-blue-700" :
                  method === "POST" ? "bg-green-100 text-green-700" :
                  method === "PUT" ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }`}>{method}</span>
                <code className="flex-1 text-xs text-slate-600 ltr">{path}</code>
                <span className="text-xs text-slate-400 font-arabic shrink-0">{desc}</span>
                <CopyButton text={`${window.location.origin}${path}`} label="" />
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
              مفتاحك الجديد جاهز!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 font-arabic leading-relaxed">
                <strong>مهم جداً:</strong> هذا المفتاح يظهر <strong>مرة واحدة فقط</strong>.
                انسخه الآن واحفظه في مكان آمن. لو نسيته لازم تنشئ مفتاح جديد.
              </p>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 ltr font-mono text-sm break-all select-all relative">
              {showKey
                ? <span className="text-green-300">{createdKey}</span>
                : <span className="text-slate-500">{"•".repeat(createdKey?.length || 50)}</span>
              }
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1 rounded-xl font-arabic h-11"
                onClick={async () => {
                  await navigator.clipboard.writeText(createdKey!);
                  toast({ title: "تم النسخ", description: "المفتاح في الحافظة" });
                }}
              >
                <Copy className="w-4 h-4 ml-2" />
                نسخ المفتاح
              </Button>
              <Button
                variant="outline"
                className="rounded-xl h-11 px-4"
                onClick={() => setShowKey(v => !v)}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                className="rounded-xl h-11 font-arabic px-4"
                onClick={() => { setCreatedKey(null); setShowKey(false); }}
              >
                حسناً
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
