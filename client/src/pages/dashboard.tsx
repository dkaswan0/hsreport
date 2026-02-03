import { useInspections, useDeleteInspection, useDeleteMultipleInspections } from "@/hooks/use-inspections";
import { Link } from "wouter";
import { Plus, ClipboardCheck, Clock, AlertTriangle, Search, Trash2, Loader2, User, Phone, CheckSquare, Square, XSquare } from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "@/components/ui/status-badge";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";

export default function Dashboard() {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const { data: inspections, isLoading } = useInspections({ search });
  const deleteMutation = useDeleteInspection();
  const deleteMultipleMutation = useDeleteMultipleInspections();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(lang === 'ar' ? "متأكد تبي تمسح هالفحص؟" : "Are you sure you want to delete this inspection?")) {
      setDeletingId(id);
      deleteMutation.mutate(id, {
        onSuccess: () => {
          toast({ title: lang === 'ar' ? "تم الحذف" : "Deleted", description: lang === 'ar' ? "تم حذف الفحص بنجاح" : "Inspection deleted successfully" });
          setDeletingId(null);
          setSelectedIds(prev => prev.filter(i => i !== id));
        },
        onError: () => {
          toast({ title: lang === 'ar' ? "خطأ" : "Error", description: lang === 'ar' ? "فشل حذف الفحص" : "Failed to delete inspection", variant: "destructive" });
          setDeletingId(null);
        }
      });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(lang === 'ar' ? `متأكد تبي تمسح ${selectedIds.length} فحص؟` : `Are you sure you want to delete ${selectedIds.length} inspections?`)) {
      deleteMultipleMutation.mutate(selectedIds, {
        onSuccess: (result) => {
          toast({ title: lang === 'ar' ? "تم الحذف" : "Deleted", description: lang === 'ar' ? `تم حذف ${result.deleted} فحص بنجاح` : `${result.deleted} inspections deleted successfully` });
          setSelectedIds([]);
        },
        onError: () => {
          toast({ title: lang === 'ar' ? "خطأ" : "Error", description: lang === 'ar' ? "فشل حذف الفحوصات" : "Failed to delete inspections", variant: "destructive" });
        }
      });
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (!inspections) return;
    if (selectedIds.length === inspections.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(inspections.map(i => i.id));
    }
  };

  const total = inspections?.length || 0;
  const completed = inspections?.filter(i => i.status === 'completed').length || 0;
  const drafts = inspections?.filter(i => i.status === 'draft').length || 0;
  const allSelected = inspections && inspections.length > 0 && selectedIds.length === inspections.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('nav.dashboard')}</h1>
          <p className="text-slate-500 mt-1">{lang === 'ar' ? 'شوف آخر الفحوصات' : 'View recent inspections'}</p>
        </div>
        <Link href="/inspections/new" className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5">
          <Plus className="w-5 h-5" />
          <span>{t('dashboard.newInspection')}</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ClipboardCheck className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">{lang === 'ar' ? 'كل الفحوصات' : 'All Inspections'}</p>
            <h3 className="text-3xl font-bold text-slate-900">{total}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">{lang === 'ar' ? 'مكتملة' : 'Completed'}</p>
            <h3 className="text-3xl font-bold text-slate-900">{completed}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">{lang === 'ar' ? 'مسودة' : 'Drafts'}</p>
            <h3 className="text-3xl font-bold text-slate-900">{drafts}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold">{lang === 'ar' ? 'الفحوصات الأخيرة' : 'Recent Inspections'}</h3>
            {selectedIds.length > 0 && (
              <Button
                onClick={handleDeleteSelected}
                disabled={deleteMultipleMutation.isPending}
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
                data-testid="button-delete-selected"
              >
                {deleteMultipleMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{lang === 'ar' ? `امسح المحدد (${selectedIds.length})` : `Delete Selected (${selectedIds.length})`}</span>
              </Button>
            )}
          </div>
          <div className="relative w-full md:w-64">
             <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rtl:left-3 rtl:right-auto" />
             <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === 'ar' ? "ابحث بالشاصي أو اسم الكستمر..." : "Search by VIN or customer name..."}
                className="w-full pl-4 pr-10 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-accent focus:ring-0 text-sm rtl:pr-4 rtl:pl-10"
                data-testid="input-search"
             />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-4 py-4 text-center w-12">
                  <button 
                    onClick={toggleSelectAll}
                    className="p-1 hover:bg-slate-200 rounded transition-colors"
                    data-testid="button-select-all"
                    title={allSelected ? (lang === 'ar' ? "الغاء تحديد الكل" : "Deselect All") : (lang === 'ar' ? "تحديد الكل" : "Select All")}
                  >
                    {allSelected ? (
                      <XSquare className="w-5 h-5 text-primary" />
                    ) : (
                      <CheckSquare className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-right">{lang === 'ar' ? 'رقم الفحص' : 'Inspection #'}</th>
                <th className="px-6 py-4 text-right">{lang === 'ar' ? 'السيارة' : 'Vehicle'}</th>
                <th className="px-6 py-4 text-right">{lang === 'ar' ? 'العميل' : 'Customer'}</th>
                <th className="px-6 py-4 text-right">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                <th className="px-6 py-4 text-right">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                <th className="px-6 py-4 text-right">-</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</td>
                </tr>
              ) : inspections?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">{lang === 'ar' ? 'لا توجد فحوصات' : 'No inspections found'}</td>
                </tr>
              ) : (
                inspections?.map((inspection) => (
                  <tr 
                    key={inspection.id} 
                    className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(inspection.id) ? 'bg-primary/5' : ''}`}
                  >
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => toggleSelect(inspection.id)}
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                        data-testid={`checkbox-select-${inspection.id}`}
                      >
                        {selectedIds.includes(inspection.id) ? (
                          <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-600">#{inspection.id.toString().padStart(4, '0')}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{inspection.make} {inspection.model}</div>
                      <div className="text-xs text-slate-500 font-mono">{inspection.vin}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-lg">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{inspection.customerName || '-'}</div>
                          {inspection.customerPhone && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Phone className="w-3 h-3" />
                              {inspection.customerPhone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {inspection.createdAt && format(new Date(inspection.createdAt), 'yyyy/MM/dd')}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={inspection.status || 'draft'} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Link 
                          href={`/inspections/${inspection.id}`}
                          className="text-primary hover:text-accent font-medium text-sm transition-colors"
                          data-testid={`link-view-${inspection.id}`}
                        >
                          شوف
                        </Link>
                        <button
                          onClick={(e) => handleDelete(inspection.id, e)}
                          disabled={deletingId === inspection.id}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                          title="امسح"
                          data-testid={`button-delete-inspection-${inspection.id}`}
                        >
                          {deletingId === inspection.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
