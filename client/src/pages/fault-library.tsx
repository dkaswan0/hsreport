import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { 
  Search, 
  AlertTriangle, 
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Car,
  Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FaultLibrary } from "@shared/schema";

const CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
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

  const { data: faults = [], isLoading } = useQuery<FaultLibrary[]>({
    queryKey: ['/api/faults'],
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
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <Car className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2 font-arabic">مكتبة الأعطال فارغة</h2>
        <p className="text-slate-500 max-w-md font-arabic">
          لم يتم إضافة أي أعطال بعد. ستظهر الأعطال هنا بعد إجراء عمليات الفحص.
        </p>
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
