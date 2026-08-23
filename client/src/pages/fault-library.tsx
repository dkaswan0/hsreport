import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { 
  Search, 
  AlertTriangle, 
  Loader2, 
  Car, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Globe 
} from "lucide-react";
import { PhosphorIcon } from "@/components/phosphor-icon";
import { SearchRouterModal } from "@/components/search-router-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { FaultLibrary } from "@shared/schema";
import { CATEGORY_GROUPS, MAIN_SECTIONS, INSPECTION_CATEGORIES } from "@shared/categories";
import { useLanguage } from "@/contexts/language-context";

export default function FaultLibraryPage() {
  const { lang } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
      toast({ 
        title: lang === 'ar' ? "تم!" : "Done!", 
        description: data.message || (lang === 'ar' ? `تم تحميل ${data.count} عطل` : `${data.count} faults loaded`) 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/fault-library'] });
    },
    onError: (error: any) => {
      toast({ 
        title: lang === 'ar' ? "خطأ" : "Error", 
        description: error.message || (lang === 'ar' ? "فشل تحميل الأعطال" : "Failed to load faults"), 
        variant: "destructive" 
      });
    }
  });

  const deleteFaultMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/fault-library/${id}`);
      if (!response.ok) throw new Error("فشل الحذف");
    },
    onSuccess: () => {
      toast({ 
        title: lang === 'ar' ? "تم!" : "Done!", 
        description: lang === 'ar' ? "تم حذف العطل بنجاح" : "Fault deleted successfully" 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/fault-library'] });
      setDeletingId(null);
    },
    onError: (error: any) => {
      toast({ 
        title: lang === 'ar' ? "خطأ" : "Error", 
        description: error.message || (lang === 'ar' ? "فشل حذف العطل" : "Failed to delete fault"), 
        variant: "destructive" 
      });
      setDeletingId(null);
    }
  });

  const handleDeleteFault = (id: number, faultName: string) => {
    if (confirm(lang === 'ar' ? `هل أنت متأكد من حذف "${faultName}"؟` : `Are you sure you want to delete "${faultName}"?`)) {
      setDeletingId(id);
      deleteFaultMutation.mutate(id);
    }
  };

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

  const stats = {
    total: faults.length,
    mechanic: faults.filter(f => getSectionForCategory(f.category) === 'mechanic').length,
    transmission: faults.filter(f => getSectionForCategory(f.category) === 'transmission').length,
    chassisAndBody: faults.filter(f => getSectionForCategory(f.category) === 'body').length,
    electric: faults.filter(f => getSectionForCategory(f.category) === 'electric').length,
  };

  const filteredFaults = faults.filter(fault => {
    const matchesSearch = searchTerm === "" || 
      fault.faultName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fault.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || fault.category === selectedCategory;
    
    // Filter by section
    let matchesSection = true;
    if (selectedSection) {
      const group = CATEGORY_GROUPS.find(g => g.sectionId === selectedSection);
      if (group) {
        const sectionCategoryLabels = group.categories.map(catId => {
          const cat = CATEGORY_GROUPS.flatMap(g => g.categories).find(c => c === catId);
          return cat;
        });
        matchesSection = sectionCategoryLabels.some(label => fault.category.includes(label || ''));
      }
    }
    
    return matchesSearch && matchesCategory && matchesSection;
  });

  // Group faults by category, then organize by section
  const groupedFaults = filteredFaults.reduce((acc, fault) => {
    if (!acc[fault.category]) {
      acc[fault.category] = [];
    }
    acc[fault.category].push(fault);
    return acc;
  }, {} as Record<string, FaultLibrary[]>);
  
  // Group categories by section for display
  const categoriesBySection = Object.keys(groupedFaults).reduce((acc, categoryName) => {
    const sectionId = getSectionForCategory(categoryName);
    if (!acc[sectionId]) {
      acc[sectionId] = [];
    }
    acc[sectionId].push(categoryName);
    return acc;
  }, {} as Record<string, string[]>);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96" dir="rtl">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-arabic">جارٍ تحميل الأعطال...</p>
      </div>
    );
  }

  if (faults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center" dir="rtl">
        <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
          <Car className="w-10 h-10 text-zinc-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2 font-arabic">لا توجد أعطال مخزنة</h2>
        <p className="text-muted-foreground max-w-md mb-6 font-arabic">
          قاعدة بيانات الأعطال فارغة، اضغط الزر لتحميل كامل بنك الأعطال المعتمد (9,639 عطل وبند فحص)
        </p>
        <Button 
          onClick={() => reseedMutation.mutate()}
          disabled={reseedMutation.isPending}
          size="lg"
          className="font-arabic"
          data-testid="button-reseed-empty"
        >
          {reseedMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              جارٍ التحميل...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 ml-2" />
              تحميل 9,639 عطل
            </>
          )}
        </Button>
      </div>
    );
  }

  const getSectionIconName = (sectionId: string) => {
    switch (sectionId) {
      case 'mechanic': return 'engine';
      case 'transmission': return 'gauge';
      case 'body': return 'car';
      case 'electric': return 'cpu';
      default: return 'wrench';
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shadow-md">
            <PhosphorIcon name="wrench" weight="bold" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black font-arabic text-zinc-950 dark:text-white">بنك الأعطال والملاحظات الفنية</h1>
            <p className="text-muted-foreground text-xs font-arabic">المكتبة الفنية الشاملة ({stats.total.toLocaleString()} عطل وبند فحص معتمد)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stats.total < 5000 && (
            <Button 
              onClick={() => reseedMutation.mutate()}
              disabled={reseedMutation.isPending}
              className="font-arabic"
              data-testid="button-reseed-faults"
            >
              {reseedMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جارٍ التحميل...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 ml-2" />
                  تحميل كامل الأعطال (9,639)
                </>
              )}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setIsSearchModalOpen(true)}
            className="font-arabic bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700"
          >
            <Globe className="w-4 h-4 ml-2 text-zinc-800 dark:text-zinc-200 animate-pulse" />
            البحث الحي الذكي (Search Router)
          </Button>
          <Badge variant="secondary" className="font-arabic">
            {stats.total} عطل
          </Badge>
        </div>
      </div>

      {/* Stats Cards (By Main Technical Sections) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-zinc-950 text-white border-zinc-800">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-black font-mono">{stats.total}</div>
            <div className="text-xs text-zinc-400 font-arabic mt-1">إجمالي بنك الأعطال</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-black font-mono text-foreground">{stats.mechanic}</div>
            <div className="text-xs text-muted-foreground font-arabic mt-1">المحرك والميكانيكا</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-black font-mono text-foreground">{stats.chassisAndBody}</div>
            <div className="text-xs text-muted-foreground font-arabic mt-1">الهيكل والشاصي</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-black font-mono text-foreground">{stats.electric}</div>
            <div className="text-xs text-muted-foreground font-arabic mt-1">الكهرباء والكمبيوتر</div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Section Filter Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن عطل بالاسم أو الوصف الفني..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 font-arabic text-sm"
                data-testid="input-search-faults"
              />
            </div>
            
            <div className="flex gap-1.5 flex-wrap">
              <Button
                variant={selectedSection === null ? "default" : "outline"}
                size="sm"
                onClick={() => { setSelectedSection(null); setSelectedCategory(null); }}
                className="font-arabic text-xs"
                data-testid="button-filter-all-sections"
              >
                جميع الأقسام
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
                  className="font-arabic text-xs"
                  data-testid={`button-filter-section-${section.id}`}
                >
                  {section.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground font-arabic flex items-center justify-between">
        <span>عرض {filteredFaults.length} عطل من أصل {faults.length}</span>
      </div>

      {/* Sections & Fault Categories List */}
      <div className="space-y-4">
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
              <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="py-3.5 px-4 bg-zinc-950 text-white">
                    <CardTitle className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <PhosphorIcon name={getSectionIconName(section.id)} weight="bold" size={22} className="text-white" />
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-zinc-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-400" />
                        )}
                        <span className="font-arabic text-base font-bold text-white">{section.label}</span>
                        <span className="bg-zinc-800 text-zinc-300 font-mono text-xs px-2.5 py-0.5 rounded-full border border-zinc-700">
                          {sectionFaultCount} عطل
                        </span>
                      </div>
                      <span className="text-xs font-mono font-normal text-zinc-400" dir="ltr">
                        {section.labelEn}
                      </span>
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="p-0 divide-y divide-zinc-200 dark:divide-zinc-800">
                    {sectionCategories.sort().map(categoryName => {
                      const categoryFaults = groupedFaults[categoryName] || [];
                      const catInfo = INSPECTION_CATEGORIES.find(c => c.label === categoryName);
                      
                      return (
                        <div key={categoryName}>
                          <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800">
                            <span className="font-bold text-xs font-arabic text-zinc-900 dark:text-zinc-100">{categoryName}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] font-mono">
                                {categoryFaults.length}
                              </Badge>
                              <span className="text-[11px] text-muted-foreground font-mono" dir="ltr">
                                {catInfo?.labelEn || ''}
                              </span>
                            </div>
                          </div>
                          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                            {categoryFaults.map(fault => {
                              return (
                                <div 
                                  key={fault.id} 
                                  className="p-3 sm:p-3.5 flex items-start justify-between gap-3 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors group"
                                  data-testid={`fault-item-${fault.id}`}
                                >
                                  <div className="flex-1 min-w-0 pr-1">
                                    <div className="font-bold text-sm text-zinc-950 dark:text-white font-arabic">
                                      {fault.faultName}
                                    </div>
                                    {fault.description && (
                                      <p className="text-xs text-muted-foreground mt-0.5 font-arabic leading-relaxed">
                                        {fault.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      onClick={() => handleDeleteFault(fault.id, fault.faultName)}
                                      disabled={deletingId === fault.id}
                                      className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 cursor-pointer"
                                      title="حذف العطل"
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
        <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-base font-bold font-arabic">لا توجد نتائج مطابقة للبحث</h3>
          <p className="text-xs text-muted-foreground font-arabic mt-1">حاول البحث بكلمات أخرى أو اختر قسماً مختلفاً</p>
        </div>
      )}

      <SearchRouterModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </div>
  );
}
