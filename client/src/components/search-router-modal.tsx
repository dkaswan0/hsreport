import React, { useState } from "react";
import { Search, Globe, Loader2, AlertCircle, ShieldAlert, ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface SearchResultItem {
  title: string;
  url: string;
  domain: string;
  content: string;
  info_context?: string;
}

interface SearchRouterModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMake?: string;
  defaultModel?: string;
  defaultYear?: number;
}

export function SearchRouterModal({
  isOpen,
  onClose,
  defaultMake = "",
  defaultModel = "",
  defaultYear
}: SearchRouterModalProps) {
  const [make, setMake] = useState(defaultMake);
  const [model, setModel] = useState(defaultModel);
  const [year, setYear] = useState<string>(defaultYear ? String(defaultYear) : "");
  const [customQuery, setCustomQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [searchedQuery, setSearchedQuery] = useState("");
  const { toast } = useToast();

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    let query = customQuery.trim();
    if (!query) {
      const activeMake = make.trim() || defaultMake;
      const activeModel = model.trim() || defaultModel;
      const activeYear = year.trim() || (defaultYear ? String(defaultYear) : "");

      if (!activeMake && !activeModel) {
        toast({
          title: "يرجى تحديد الماركة والموديل",
          description: "أدخل ماركة وموديل السيارة للبحث الحي عن الأعطال والاستدعاءات",
          variant: "destructive"
        });
        return;
      }
      query = `أعطال ومشاكل شائعة واستدعاءات سيارة ${activeMake} ${activeModel} ${activeYear}`;
    }

    setIsLoading(true);
    setResults([]);
    setSearchedQuery(query);

    try {
      const res = await fetch("/api/vehicle/search-recalls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });

      if (!res.ok) {
        throw new Error("فشل في إجراء البحث الحقيقي للأعطال");
      }

      const data = await res.json();
      if (data.results && data.results.length > 0) {
        setResults(data.results);
      } else {
        toast({
          title: "لم يتم العثور على نتائج مباشرة",
          description: "حاول تعديل كلمات البحث والتأكد من اسم السيارة"
        });
      }
    } catch (err: any) {
      toast({
        title: "خطأ في البحث الحي",
        description: err.message || "حدث خطأ غير متوقع أثناء الاتصال بالإنترنت",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto font-sans dir-rtl text-right">
        <DialogHeader className="text-right border-b pb-3 mb-2">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
            <Globe className="w-6 h-6 text-blue-600 animate-pulse" />
            البحث الحي عن استدعاءات وعيوب السيارة (Search Router Web AI)
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            ابحث حياً عبر الإنترنت عن أحدث مشاكل ونشرات الصيانة واستدعاءات المصنع الخاصة بأي موديل سيارة.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSearch} className="space-y-4 my-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">الماركة (Make)</label>
              <Input
                placeholder="مثال: Toyota, Nissan"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">الموديل (Model)</label>
              <Input
                placeholder="مثال: Camry, Patrol"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">سنة الصنع (Year)</label>
              <Input
                placeholder="مثال: 2022"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">أو اكتب موضوع أو كود العطل مباشرة:</label>
            <div className="flex gap-2">
              <Input
                placeholder="مثال: مشكلة تكييف كامري أو طرمبة البنزين"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                className="text-sm flex-1"
              />
              <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري البحث...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 ml-2" />
                    بحث حي
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {searchedQuery && (
          <div className="text-xs text-slate-500 bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900 flex items-center justify-between">
            <span>كلمة البحث الحالية: <strong>"{searchedQuery}"</strong></span>
            <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Search Router Live API</Badge>
          </div>
        )}

        <div className="space-y-3 mt-4">
          {isLoading && (
            <div className="py-12 text-center text-slate-500 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              <p className="text-sm font-medium">جاري الاستعلام المباشر عبر محرك Search Router...</p>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  نتائج الاستدعاءات والعيوب المكتشفة ({results.length}):
                </h4>
              </div>

              {results.map((item, idx) => (
                <Card key={idx} className="border border-slate-200 dark:border-slate-800 hover:border-blue-300 transition-colors shadow-sm">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-base font-bold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1.5 leading-snug"
                      >
                        {item.title}
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 inline" />
                      </a>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {item.domain}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.content || item.info_context}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && searchedQuery && results.length === 0 && (
            <div className="py-8 text-center text-slate-500 space-y-2 bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border">
              <AlertCircle className="w-8 h-8 mx-auto text-amber-500" />
              <p className="text-sm font-semibold">لم يتم العثور على استدعاءات معروفة لهذا الاستعلام.</p>
              <p className="text-xs text-slate-400">تأكد من كتابة الماركة باللغة الإنجليزية أو العربية كـ (Toyota أو تويوتا).</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
