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
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Trash2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { FaultLibrary } from "@shared/schema";
import { CATEGORY_GROUPS, MAIN_SECTIONS, INSPECTION_CATEGORIES } from "@shared/categories";

const CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
  // الفئات الأساسية - لهجة إماراتية
  engine: { ar: "الماكينة", en: "Engine" },
  transmission: { ar: "القير", en: "Transmission" },
  chassis: { ar: "الشاصي", en: "Chassis" },
  body: { ar: "البودي", en: "Body" },
  tires: { ar: "التواير", en: "Tires" },
  brakes: { ar: "البريك", en: "Brakes" },
  electric: { ar: "الكهرباء", en: "Electrical" },
  wheels: { ar: "الرنقات", en: "Wheels" },
  suspension: { ar: "السسبنشن", en: "Suspension" },
  ac: { ar: "المكيف", en: "AC/Cooling" },
  exhaust: { ar: "الاكزوز", en: "Exhaust" },
  safety: { ar: "السيفتي", en: "Safety" },
  interior: { ar: "الداخلية", en: "Interior" },
  steering: { ar: "الستيرنق", en: "Steering" },
  fuel: { ar: "البترول", en: "Fuel" },
  // الكهرباء - فئات فرعية
  "ac_electrical": { ar: "كهرباء المكيف", en: "AC Electrical" },
  "battery": { ar: "البطارية", en: "Battery" },
  "charging_system": { ar: "الشارجنق سيستم", en: "Charging System" },
  "driver_assist": { ar: "مساعدات السواقة", en: "Driver Assist" },
  "ecu_computers": { ar: "الكمبيوتر", en: "ECU & Computers" },
  "entertainment": { ar: "السيستم والشاشة", en: "Entertainment" },
  "ignition_system": { ar: "الاشتعال", en: "Ignition System" },
  "interior_electrical": { ar: "كهرباء الداخلية", en: "Interior Electrical" },
  "lighting": { ar: "الليتات", en: "Lighting" },
  "safety_systems": { ar: "السيفتي سيستم", en: "Safety Systems" },
  "sensors": { ar: "السنسرات", en: "Sensors" },
  "starting_system": { ar: "السلف", en: "Starting System" },
  "wiring": { ar: "الوايرات", en: "Wiring" },
  // قطع السيارة - لهجة إماراتية
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
  "الرينقات": { ar: "الرنقات", en: "Rims" },
  "التواير": { ar: "التواير", en: "Tires" },
  "الدبل": { ar: "الدبل", en: "Control Arms" },
  "التايررود": { ar: "التايررود", en: "Tie Rods" },
  "الاستبلايزرلينك رود": { ar: "الاستبلايزر لينك", en: "Stabilizer Link Rod" },
  "البورستيرنق": { ar: "البورستيرنق", en: "Power Steering" },
  "السفايف": { ar: "السفايف", en: "Belts" },
  "الردياتر": { ar: "الردياتر", en: "Radiator" },
  "المروحة": { ar: "المروحة", en: "Fan" },
  "الوتربمب": { ar: "الوتربمب", en: "Water Pump" },
  "الترموستات": { ar: "الترموستات", en: "Thermostat" },
  "الكوندنسيور": { ar: "الكوندنسر", en: "Condenser" },
  "الاكزوز": { ar: "الاكزوز", en: "Exhaust" },
  "الدبة": { ar: "الدبة", en: "Muffler" },
  "التيربو": { ar: "التيربو", en: "Turbo" },
  "الفيول بمب": { ar: "طرمبة البترول", en: "Fuel Pump" },
  "تانك البترول": { ar: "تانكي البترول", en: "Fuel Tank" },
  "الداخلية": { ar: "الداخلية", en: "Interior" },
  "داخلية السيارة": { ar: "الداخلية", en: "Car Interior" },
  // الكهرباء - فئات إضافية
  "تيب الوايرات": { ar: "تيب الوايرات", en: "Wire Harness" },
  "زر تحكم المرايا": { ar: "زر تحكم المرايا", en: "Mirror Controls" },
  "النظام الكهربائي": { ar: "النظام الكهربائي", en: "Electrical System" },
  "البطارية": { ar: "البطارية", en: "Battery" },
  "الإضاءة الخارجية": { ar: "الإضاءة الخارجية", en: "Exterior Lighting" },
  // الفئات المضافة
  "المحرك": { ar: "المحرك", en: "Engine" },
  "نظام التعليق": { ar: "نظام التعليق", en: "Suspension System" },
  "نظام التوجيه": { ar: "نظام التوجيه", en: "Steering System" },
  "نظام الفرامل": { ar: "نظام الفرامل", en: "Brake System" },
  "نظام التكييف": { ar: "نظام التكييف", en: "AC System" },
  "نظام الوقود والعادم": { ar: "نظام الوقود والعادم", en: "Fuel & Exhaust" },
  "ناقل الحركة": { ar: "ناقل الحركة", en: "Transmission" },
  "الهيكل والشاصي": { ar: "الهيكل والشاصي", en: "Chassis & Frame" },
  "أنظمة السلامة": { ar: "أنظمة السلامة", en: "Safety Systems" },
  "الإطارات والجنوط": { ar: "الإطارات والجنوط", en: "Tires & Rims" },
  "الزجاج والمرايا": { ar: "الزجاج والمرايا", en: "Glass & Mirrors" },
  "الملحقات والإكسسوارات": { ar: "الملحقات والإكسسوارات", en: "Accessories" },
  "الوثائق والتوثيق": { ar: "الوثائق والتوثيق", en: "Documentation" },
  "أعطال متنوعة": { ar: "أعطال متنوعة", en: "Misc" },
  // السوائل
  "زيت المحرك": { ar: "زيت المحرك", en: "Engine Oil" },
  "زيت القير": { ar: "زيت القير", en: "Transmission Oil" },
  "زيت الفرامل": { ar: "زيت الفرامل", en: "Brake Fluid" },
  "زيت الباور": { ar: "زيت الباور", en: "Power Steering Fluid" },
  "سائل التبريد": { ar: "سائل التبريد", en: "Coolant" },
  "سائل المساحات": { ar: "سائل المساحات", en: "Washer Fluid" },
  "سوائل إضافية": { ar: "سوائل إضافية", en: "Other Fluids" },
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
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const { data: faults = [], isLoading } = useQuery<FaultLibrary[]>({
    queryKey: ['/api/fault-library'],
  });

  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const deleteFaultMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/fault-library/${id}`);
      if (!response.ok) throw new Error("فشل الحذف");
    },
    onSuccess: () => {
      toast({ title: "تم!", description: "تم حذف العطل بنجاح" });
      queryClient.invalidateQueries({ queryKey: ['/api/fault-library'] });
      setDeletingId(null);
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message || "فشل حذف العطل", variant: "destructive" });
      setDeletingId(null);
    }
  });

  const handleDeleteFault = (id: number, faultName: string) => {
    if (confirm(`متأكد تبي تمسح "${faultName}"؟`)) {
      setDeletingId(id);
      deleteFaultMutation.mutate(id);
    }
  };

  const categories = Array.from(new Set(faults.map(f => f.category))).sort();

  const filteredFaults = faults.filter(fault => {
    const matchesSearch = searchTerm === "" || 
      fault.faultName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fault.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || fault.category === selectedCategory;
    const matchesSeverity = !selectedSeverity || fault.severity === selectedSeverity;
    
    // Filter by section
    let matchesSection = true;
    if (selectedSection) {
      const group = CATEGORY_GROUPS.find(g => g.sectionId === selectedSection);
      if (group) {
        // Check if fault category matches any category label in this section
        const sectionCategoryLabels = group.categories.map(catId => {
          const cat = CATEGORY_GROUPS.flatMap(g => g.categories).find(c => c === catId);
          return cat;
        });
        matchesSection = sectionCategoryLabels.some(label => fault.category.includes(label || ''));
      }
    }
    
    return matchesSearch && matchesCategory && matchesSeverity && matchesSection;
  });

  // Group faults by category, then organize by section
  const groupedFaults = filteredFaults.reduce((acc, fault) => {
    if (!acc[fault.category]) {
      acc[fault.category] = [];
    }
    acc[fault.category].push(fault);
    return acc;
  }, {} as Record<string, FaultLibrary[]>);
  
  // Organize categories by their main section
  const getSectionForCategory = (categoryName: string): string => {
    for (const group of CATEGORY_GROUPS) {
      for (const catId of group.categories) {
        const catInfo = INSPECTION_CATEGORIES.find(c => c.id === catId);
        if (catInfo && categoryName === catInfo.label) {
          return group.sectionId;
        }
      }
    }
    return 'other';
  };
  
  // Group categories by section for display
  const categoriesBySection = Object.keys(groupedFaults).reduce((acc, categoryName) => {
    const sectionId = getSectionForCategory(categoryName);
    if (!acc[sectionId]) {
      acc[sectionId] = [];
    }
    acc[sectionId].push(categoryName);
    return acc;
  }, {} as Record<string, string[]>);

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
        <p className="text-muted-foreground font-arabic">يحمل الأعطال...</p>
      </div>
    );
  }

  if (faults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center" dir="rtl">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <Car className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2 font-arabic">ما في أعطال</h2>
        <p className="text-muted-foreground max-w-md mb-6 font-arabic">
          اضغط الزر عشان تحمل كل الأعطال (1040 عطل)
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
              يحمل الأعطال...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5 ml-2" />
              حمل كل الأعطال (1040)
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
          <h1 className="text-2xl font-bold font-arabic">الأعطال</h1>
          <p className="text-muted-foreground font-arabic">كل أعطال السيارات في مكان واحد</p>
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
                  يحمل...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 ml-2" />
                  حمل كل الأعطال (1040)
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
            <div className="text-sm text-muted-foreground font-arabic">كل الأعطال</div>
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
                variant={selectedSection === null ? "default" : "outline"}
                size="sm"
                onClick={() => { setSelectedSection(null); setSelectedCategory(null); }}
                className="font-arabic"
                data-testid="button-filter-all-sections"
              >
                الكل
              </Button>
              {MAIN_SECTIONS.map(section => (
                <Button
                  key={section.id}
                  variant={selectedSection === section.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => { 
                    setSelectedSection(section.id === selectedSection ? null : section.id);
                    setSelectedCategory(null);
                  }}
                  className="font-arabic"
                  data-testid={`button-filter-section-${section.id}`}
                >
                  {section.label}
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
              الكل
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
        {MAIN_SECTIONS.map(section => {
          const sectionCategories = categoriesBySection[section.id] || [];
          if (sectionCategories.length === 0) return null;
          
          const sectionFaultCount = sectionCategories.reduce(
            (sum, cat) => sum + (groupedFaults[cat]?.length || 0), 0
          );
          const isExpanded = expandedSections[section.id] !== false;
          
          return (
            <Collapsible 
              key={section.id} 
              open={isExpanded} 
              onOpenChange={() => toggleSection(section.id)}
            >
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                        <span className="font-arabic text-lg">{section.label}</span>
                        <Badge variant="secondary" className="font-arabic">
                          {sectionFaultCount} عطل
                        </Badge>
                      </div>
                      <span className="text-sm font-normal text-muted-foreground">
                        {section.labelEn}
                      </span>
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="p-0">
                    {sectionCategories.sort().map(categoryName => {
                      const categoryFaults = groupedFaults[categoryName] || [];
                      const catInfo = INSPECTION_CATEGORIES.find(c => c.label === categoryName);
                      
                      return (
                        <div key={categoryName} className="border-t">
                          <div className="px-4 py-3 bg-muted/50 flex items-center justify-between gap-2">
                            <span className="font-semibold font-arabic">{categoryName}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {categoryFaults.length}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {catInfo?.labelEn || ''}
                              </span>
                            </div>
                          </div>
                          <div className="divide-y divide-border">
                            {categoryFaults.map(fault => {
                              const severityInfo = getSeverityInfo(fault.severity);
                              const SeverityIcon = severityInfo.icon;
                              
                              return (
                                <div 
                                  key={fault.id} 
                                  className="p-4 flex items-start gap-4 hover-elevate group"
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
                                  <div className="flex items-center gap-2 shrink-0">
                                    <Badge 
                                      variant="outline" 
                                      className={cn(severityInfo.color)}
                                    >
                                      {severityInfo.label}
                                    </Badge>
                                    <button
                                      onClick={() => handleDeleteFault(fault.id, fault.faultName)}
                                      disabled={deletingId === fault.id}
                                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                      title="امسح"
                                      data-testid={`button-delete-fault-${fault.id}`}
                                    >
                                      {deletingId === fault.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      {filteredFaults.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold font-arabic">ما لقينا شي</h3>
          <p className="text-muted-foreground font-arabic">جرب تغير البحث</p>
        </div>
      )}
    </div>
  );
}
