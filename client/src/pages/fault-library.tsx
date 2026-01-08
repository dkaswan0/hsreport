import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { 
  Search, 
  AlertTriangle, 
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Car,
  Filter,
  RefreshCw
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { FaultLibrary } from "@shared/schema";

const CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
  // English categories
  engine: { ar: "المحرك", en: "Engine" },
  transmission: { ar: "ناقل الحركة", en: "Transmission" },
  chassis: { ar: "الشاصي", en: "Chassis" },
  body: { ar: "الهيكل", en: "Body" },
  tires: { ar: "الإطارات", en: "Tires" },
  brakes: { ar: "الفرامل", en: "Brakes" },
  electric: { ar: "الكهرباء", en: "Electrical" },
  wheels: { ar: "العجلات", en: "Wheels" },
  suspension: { ar: "التعليق", en: "Suspension" },
  ac: { ar: "التكييف", en: "AC/Cooling" },
  exhaust: { ar: "العادم", en: "Exhaust" },
  safety: { ar: "السلامة", en: "Safety" },
  interior: { ar: "الداخلية", en: "Interior" },
  steering: { ar: "التوجيه", en: "Steering" },
  fuel: { ar: "الوقود", en: "Fuel" },
  // Electrical subcategories
  "ac_electrical": { ar: "كهرباء التكييف", en: "AC Electrical" },
  "battery": { ar: "البطارية", en: "Battery" },
  "charging_system": { ar: "نظام الشحن", en: "Charging System" },
  "driver_assist": { ar: "مساعد السائق", en: "Driver Assist" },
  "ecu_computers": { ar: "كمبيوترات السيارة", en: "ECU & Computers" },
  "entertainment": { ar: "الترفيه", en: "Entertainment" },
  "ignition_system": { ar: "نظام الإشعال", en: "Ignition System" },
  "interior_electrical": { ar: "كهرباء الداخلية", en: "Interior Electrical" },
  "lighting": { ar: "الإضاءة", en: "Lighting" },
  "safety_systems": { ar: "أنظمة السلامة", en: "Safety Systems" },
  "sensors": { ar: "الحساسات", en: "Sensors" },
  "starting_system": { ar: "نظام التشغيل", en: "Starting System" },
  "wiring": { ar: "الأسلاك", en: "Wiring" },
  // Arabic categories (car parts)
  "الدعامية الأمامية": { ar: "الدعامية الأمامية", en: "Front Bumper" },
  "الدعامية الخلفية": { ar: "الدعامية الخلفية", en: "Rear Bumper" },
  "جسر الدعامية الأمامية": { ar: "جسر الدعامية الأمامية", en: "Front Bumper Frame" },
  "جسر الدعامية الخلفية": { ar: "جسر الدعامية الخلفية", en: "Rear Bumper Frame" },
  "صدر السيارة الأمامي": { ar: "صدر السيارة الأمامي", en: "Front Body" },
  "صدر السيارة الامامي": { ar: "صدر السيارة الأمامي", en: "Front Body" },
  "صدر السيارة الخلفي": { ar: "صدر السيارة الخلفي", en: "Rear Body" },
  "البونيت": { ar: "البونيت", en: "Hood" },
  "الشاصي": { ar: "الشاصي", en: "Chassis" },
  "الماكينة": { ar: "الماكينة", en: "Engine" },
  "القير": { ar: "القير", en: "Transmission" },
  "الاكسلات": { ar: "الاكسلات", en: "Axles" },
  "الشافت": { ar: "الشافت", en: "Drive Shaft" },
  "الديفرايشن": { ar: "الديفرايشن", en: "Differential" },
  "البريك": { ar: "البريك", en: "Brakes" },
  "الدرامات": { ar: "الدرامات", en: "Drums" },
  "الفخد": { ar: "الفخد", en: "Fender" },
  "المدقار الأمامي يسار": { ar: "المدقار الأمامي يسار", en: "Front Left Fender" },
  "المدقار الأمامي يمين": { ar: "المدقار الأمامي يمين", en: "Front Right Fender" },
  "المدقار الخلفي يسار": { ar: "المدقار الخلفي يسار", en: "Rear Left Fender" },
  "المدقار الخلفي يمين": { ar: "المدقار الخلفي يمين", en: "Rear Right Fender" },
  "الباب الأمامي يسار": { ar: "الباب الأمامي يسار", en: "Front Left Door" },
  "الباب الأمامي يمين": { ar: "الباب الأمامي يمين", en: "Front Right Door" },
  "الباب الخلفي يسار": { ar: "الباب الخلفي يسار", en: "Rear Left Door" },
  "الباب الخلفي يمين": { ar: "الباب الخلفي يمين", en: "Rear Right Door" },
  "القوائم": { ar: "القوائم", en: "Pillars" },
  "السقف": { ar: "السقف", en: "Roof" },
  "الجامات": { ar: "الجامات", en: "Glass" },
  "الجانبينات": { ar: "الجانبينات", en: "Side Panels" },
  "الشيالات": { ar: "الشيالات", en: "Carriers" },
  "الليتات": { ar: "الليتات", en: "Lights" },
  "الليتات الأمامية": { ar: "الليتات الأمامية", en: "Front Lights" },
  "الليتات الخلفية": { ar: "الليتات الخلفية", en: "Rear Lights" },
  "الرينقات": { ar: "الرينقات", en: "Rims" },
  "التواير": { ar: "التواير", en: "Tires" },
  "الدبل": { ar: "الدبل", en: "Control Arms" },
  "التايررود": { ar: "التايررود", en: "Tie Rods" },
  "الاستبلايزرلينك رود": { ar: "الاستبلايزرلينك رود", en: "Stabilizer Link Rod" },
  "البورستيرنق": { ar: "البورستيرنق", en: "Power Steering" },
  "السفايف": { ar: "السفايف", en: "Belts" },
  "الردياتر": { ar: "الردياتر", en: "Radiator" },
  "المروحة": { ar: "المروحة", en: "Fan" },
  "الوتربمب": { ar: "الوتربمب", en: "Water Pump" },
  "الترموستات": { ar: "الترموستات", en: "Thermostat" },
  "الكوندنسيور": { ar: "الكوندنسيور", en: "Condenser" },
  "الاكزوز": { ar: "الاكزوز", en: "Exhaust" },
  "الدبة": { ar: "الدبة", en: "Muffler" },
  "التيربو": { ar: "التيربو", en: "Turbo" },
  "الفيول بمب": { ar: "الفيول بمب", en: "Fuel Pump" },
  "تانك البترول": { ar: "تانك البترول", en: "Fuel Tank" },
  "الداخلية": { ar: "الداخلية", en: "Interior" },
  "داخلية السيارة": { ar: "داخلية السيارة", en: "Car Interior" },
};

const getSeverityInfo = (severity: string | null) => {
  switch (severity) {
    case 'high':
      return { 
        label: 'خطير', 
        labelEn: 'High',
        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        icon: XCircle
      };
    case 'medium':
      return { 
        label: 'متوسط', 
        labelEn: 'Medium',
        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        icon: AlertCircle
      };
    case 'low':
      return { 
        label: 'بسيط', 
        labelEn: 'Low',
        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        icon: CheckCircle2
      };
    default:
      return { 
        label: 'غير محدد', 
        labelEn: 'Unknown',
        color: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
        icon: AlertTriangle
      };
  }
};

export default function FaultLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: faults = [], isLoading } = useQuery<FaultLibrary[]>({
    queryKey: ['/api/fault-library'],
  });

  const reseedMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/fault-library/reseed");
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "تم!", description: data.message || `تم تحميل ${data.count} عطل` });
      queryClient.invalidateQueries({ queryKey: ['/api/fault-library'] });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message || "فشل تحميل الأعطال", variant: "destructive" });
    }
  });

  const categories = Array.from(new Set(faults.map(f => f.category))).sort();

  const filteredFaults = faults.filter(fault => {
    const matchesSearch = searchTerm === "" || 
      fault.faultName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fault.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || fault.category === selectedCategory;
    const matchesSeverity = !selectedSeverity || fault.severity === selectedSeverity;
    
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const groupedFaults = filteredFaults.reduce((acc, fault) => {
    if (!acc[fault.category]) {
      acc[fault.category] = [];
    }
    acc[fault.category].push(fault);
    return acc;
  }, {} as Record<string, FaultLibrary[]>);

  const stats = {
    total: faults.length,
    high: faults.filter(f => f.severity === 'high').length,
    medium: faults.filter(f => f.severity === 'medium').length,
    low: faults.filter(f => f.severity === 'low').length,
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96" dir="rtl">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-arabic">جاري تحميل مكتبة الأعطال...</p>
      </div>
    );
  }

  if (faults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center" dir="rtl">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <Car className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2 font-arabic">مكتبة الأعطال فارغة</h2>
        <p className="text-muted-foreground max-w-md mb-6 font-arabic">
          اضغط الزر لتحميل كل الأعطال (1040 عطل)
        </p>
        <Button 
          onClick={() => reseedMutation.mutate()}
          disabled={reseedMutation.isPending}
          className="font-arabic"
          size="lg"
          data-testid="button-reseed-faults-empty"
        >
          {reseedMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 ml-2 animate-spin" />
              جاري تحميل الأعطال...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5 ml-2" />
              تحميل كل الأعطال (1040)
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-arabic">مكتبة الأعطال</h1>
          <p className="text-muted-foreground font-arabic">قاعدة بيانات شاملة لجميع أعطال المركبات</p>
        </div>
        <div className="flex items-center gap-2">
          {stats.total < 1000 && (
            <Button 
              onClick={() => reseedMutation.mutate()}
              disabled={reseedMutation.isPending}
              className="font-arabic"
              data-testid="button-reseed-faults"
            >
              {reseedMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري التحميل...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 ml-2" />
                  تحميل كل الأعطال (1040)
                </>
              )}
            </Button>
          )}
          <Badge variant="secondary" className="font-arabic">
            {stats.total} عطل
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-foreground">{stats.total}</div>
            <div className="text-sm text-muted-foreground font-arabic">إجمالي الأعطال</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-red-600">{stats.high}</div>
            <div className="text-sm text-muted-foreground font-arabic">خطير</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-amber-600">{stats.medium}</div>
            <div className="text-sm text-muted-foreground font-arabic">متوسط</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-emerald-600">{stats.low}</div>
            <div className="text-sm text-muted-foreground font-arabic">بسيط</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن عطل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 font-arabic"
                data-testid="input-search-faults"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="font-arabic"
                data-testid="button-filter-all-categories"
              >
                الكل
              </Button>
              {categories.slice(0, 5).map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                  className="font-arabic"
                  data-testid={`button-filter-category-${cat}`}
                >
                  {CATEGORY_LABELS[cat]?.ar || cat}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2 mt-3">
            <Button
              variant={selectedSeverity === null ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedSeverity(null)}
              className="font-arabic"
              data-testid="button-filter-all-severity"
            >
              <Filter className="w-3 h-3 ml-1" />
              كل الخطورة
            </Button>
            <Button
              variant={selectedSeverity === 'high' ? "destructive" : "ghost"}
              size="sm"
              onClick={() => setSelectedSeverity(selectedSeverity === 'high' ? null : 'high')}
              className="font-arabic"
              data-testid="button-filter-severity-high"
            >
              <XCircle className="w-3 h-3 ml-1" />
              خطير
            </Button>
            <Button
              variant={selectedSeverity === 'medium' ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedSeverity(selectedSeverity === 'medium' ? null : 'medium')}
              className="font-arabic"
              data-testid="button-filter-severity-medium"
            >
              <AlertCircle className="w-3 h-3 ml-1" />
              متوسط
            </Button>
            <Button
              variant={selectedSeverity === 'low' ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedSeverity(selectedSeverity === 'low' ? null : 'low')}
              className="font-arabic"
              data-testid="button-filter-severity-low"
            >
              <CheckCircle2 className="w-3 h-3 ml-1" />
              بسيط
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground font-arabic">
        عرض {filteredFaults.length} من {faults.length} عطل
      </div>

      <div className="space-y-6">
        {Object.entries(groupedFaults).sort().map(([category, categoryFaults]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="font-arabic">{CATEGORY_LABELS[category]?.ar || category}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {CATEGORY_LABELS[category]?.en || category}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {categoryFaults.map(fault => {
                  const severityInfo = getSeverityInfo(fault.severity);
                  const SeverityIcon = severityInfo.icon;
                  
                  return (
                    <div 
                      key={fault.id} 
                      className="p-4 flex items-start gap-4 hover-elevate"
                      data-testid={`fault-item-${fault.id}`}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        severityInfo.color
                      )}>
                        <SeverityIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-foreground font-arabic">
                          {fault.faultName}
                        </div>
                        {fault.description && (
                          <p className="text-sm text-muted-foreground mt-1 font-arabic">
                            {fault.description}
                          </p>
                        )}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn("shrink-0", severityInfo.color)}
                      >
                        {severityInfo.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFaults.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold font-arabic">لا توجد نتائج</h3>
          <p className="text-muted-foreground font-arabic">جرب تغيير معايير البحث</p>
        </div>
      )}
    </div>
  );
}
