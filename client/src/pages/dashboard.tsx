import { useInspections, useDeleteInspection, useDeleteMultipleInspections } from "@/hooks/use-inspections";
import { Link } from "wouter";
import {
  Plus, ClipboardCheck, Clock, AlertTriangle,
  Search, Trash2, Loader2, User, Phone,
  CheckSquare, Square, XSquare,
} from "lucide-react";
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
    if (confirm(lang === "ar" ? "هل أنت متأكد من حذف هذا الفحص؟" : "Are you sure you want to delete this inspection?")) {
      setDeletingId(id);
      deleteMutation.mutate(id, {
        onSuccess: () => {
          toast({ title: lang === "ar" ? "تم الحذف" : "Deleted", description: lang === "ar" ? "تم حذف الفحص بنجاح" : "Inspection deleted successfully" });
          setDeletingId(null);
          setSelectedIds((prev) => prev.filter((i) => i !== id));
        },
        onError: () => {
          toast({ title: lang === "ar" ? "خطأ" : "Error", description: lang === "ar" ? "فشل حذف الفحص" : "Failed to delete inspection", variant: "destructive" });
          setDeletingId(null);
        },
      });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(lang === "ar" ? `هل أنت متأكد من حذف ${selectedIds.length} فحص؟` : `Delete ${selectedIds.length} inspections?`)) {
      deleteMultipleMutation.mutate(selectedIds, {
        onSuccess: (result) => {
          toast({ title: lang === "ar" ? "تم الحذف" : "Deleted", description: lang === "ar" ? `تم حذف ${result.deleted} فحص` : `${result.deleted} deleted` });
          setSelectedIds([]);
        },
        onError: () => {
          toast({ title: lang === "ar" ? "خطأ" : "Error", description: lang === "ar" ? "فشل الحذف" : "Failed to delete", variant: "destructive" });
        },
      });
    }
  };

  const toggleSelect = (id: number) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const toggleSelectAll = () => {
    if (!inspections) return;
    setSelectedIds(selectedIds.length === inspections.length ? [] : inspections.map((i) => i.id));
  };

  const total = inspections?.length || 0;
  const completed = inspections?.filter((i) => i.status === "completed").length || 0;
  const drafts = inspections?.filter((i) => i.status === "draft").length || 0;
  const allSelected = !!inspections && inspections.length > 0 && selectedIds.length === inspections.length;

  const stats = [
    {
      label: lang === "ar" ? "إجمالي الفحوصات" : "Total Inspections",
      value: total,
      icon: ClipboardCheck,
      accent: "#C5852C",
    },
    {
      label: lang === "ar" ? "مكتملة" : "Completed",
      value: completed,
      icon: Clock,
      accent: "#16a34a",
    },
    {
      label: lang === "ar" ? "مسودة" : "Drafts",
      value: drafts,
      icon: AlertTriangle,
      accent: "#d97706",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-800">
            {lang === "ar" ? "لوحة التحكم" : "Dashboard"}
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            {lang === "ar" ? "نظرة عامة على الفحوصات" : "Inspection overview"}
          </p>
        </div>
        <Link
          href="/inspections/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "#0C1A28" }}
        >
          <Plus className="w-4 h-4" />
          <span>{t("dashboard.newInspection")}</span>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl p-5 flex items-center justify-between border border-stone-100"
            style={{ borderTop: `3px solid ${s.accent}` }}
          >
            <div>
              <p className="text-xs text-stone-400 font-medium uppercase tracking-wide mb-1">
                {s.label}
              </p>
              <p className="text-4xl font-bold text-stone-800 leading-none">{s.value}</p>
            </div>
            <s.icon className="w-8 h-8 opacity-10 text-stone-800" />
          </div>
        ))}
      </div>

      {/* Inspections table */}
      <div className="bg-white rounded-xl border border-stone-100 overflow-hidden">
        {/* Table header bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-stone-700">
              {lang === "ar" ? "أحدث الفحوصات" : "Recent Inspections"}
            </h2>
            {selectedIds.length > 0 && (
              <Button
                onClick={handleDeleteSelected}
                disabled={deleteMultipleMutation.isPending}
                variant="destructive"
                size="sm"
                className="h-7 text-xs gap-1.5"
                data-testid="button-delete-selected"
              >
                {deleteMultipleMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
                {lang === "ar" ? `حذف (${selectedIds.length})` : `Delete (${selectedIds.length})`}
              </Button>
            )}
          </div>
          <div className="relative">
            <Search
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400"
              style={{ [lang === "ar" ? "left" : "right"]: "10px" }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === "ar" ? "بحث..." : "Search..."}
              className="w-48 text-xs py-1.5 px-3 rounded-lg border border-stone-200 bg-stone-50 focus:outline-none focus:border-stone-400 transition-colors"
              style={{ [lang === "ar" ? "paddingLeft" : "paddingRight"]: "28px" }}
              data-testid="input-search"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="px-5 py-3 w-10 text-center">
                  <button
                    onClick={toggleSelectAll}
                    className="text-stone-400 hover:text-stone-700 transition-colors"
                    data-testid="button-select-all"
                  >
                    {allSelected
                      ? <XSquare className="w-4 h-4 text-[#C5852C]" />
                      : <CheckSquare className="w-4 h-4" />}
                  </button>
                </th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                  {lang === "ar" ? "رقم" : "#"}
                </th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                  {lang === "ar" ? "السيارة" : "Vehicle"}
                </th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                  {lang === "ar" ? "العميل" : "Customer"}
                </th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                  {lang === "ar" ? "التاريخ" : "Date"}
                </th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                  {lang === "ar" ? "الحالة" : "Status"}
                </th>
                <th className="px-5 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-stone-400 text-xs">
                    {lang === "ar" ? "جارٍ التحميل..." : "Loading..."}
                  </td>
                </tr>
              ) : inspections?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-stone-400 text-xs">
                    {lang === "ar" ? "لا توجد فحوصات" : "No inspections found"}
                  </td>
                </tr>
              ) : (
                inspections?.map((inspection) => {
                  const selected = selectedIds.includes(inspection.id);
                  return (
                    <tr
                      key={inspection.id}
                      className={`border-b border-stone-50 transition-colors ${
                        selected ? "bg-amber-50/50" : "hover:bg-stone-50/60"
                      }`}
                    >
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => toggleSelect(inspection.id)}
                          className="text-stone-300 hover:text-stone-600 transition-colors"
                          data-testid={`checkbox-select-${inspection.id}`}
                        >
                          {selected
                            ? <CheckSquare className="w-4 h-4 text-[#C5852C]" />
                            : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-stone-400">
                        #{inspection.id.toString().padStart(4, "0")}
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-stone-800">{inspection.make} {inspection.model}</div>
                        <div className="text-[11px] text-stone-400 font-mono mt-0.5">{inspection.vin}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-stone-800">{inspection.customerName || "—"}</div>
                        {inspection.customerPhone && (
                          <div className="flex items-center gap-1 text-[11px] text-stone-400 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {inspection.customerPhone}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-stone-500">
                        {inspection.createdAt && format(new Date(inspection.createdAt), "yyyy/MM/dd")}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={inspection.status || "draft"} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <Link
                            href={`/inspections/${inspection.id}`}
                            className="text-xs font-medium text-stone-500 hover:text-[#C5852C] transition-colors"
                            data-testid={`link-view-${inspection.id}`}
                          >
                            {lang === "ar" ? "عرض" : "View"}
                          </Link>
                          <button
                            onClick={(e) => handleDelete(inspection.id, e)}
                            disabled={deletingId === inspection.id}
                            className="p-1 text-stone-300 hover:text-red-500 transition-colors disabled:opacity-40"
                            title={lang === "ar" ? "حذف" : "Delete"}
                            data-testid={`button-delete-inspection-${inspection.id}`}
                          >
                            {deletingId === inspection.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
