import { useInspections, useDeleteInspection, useDeleteMultipleInspections } from "@/hooks/use-inspections";
import { Link } from "wouter";
import {
  Plus, Trash2, Loader2, Phone,
  CheckSquare, Square, XSquare, Search,
} from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "@/components/ui/status-badge";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";

export default function Dashboard() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
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
    if (!confirm(ar ? "حذف هذا الفحص؟" : "Delete this inspection?")) return;
    setDeletingId(id);
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: ar ? "تم الحذف" : "Deleted" });
        setDeletingId(null);
        setSelectedIds((p) => p.filter((i) => i !== id));
      },
      onError: () => {
        toast({ title: ar ? "خطأ" : "Error", variant: "destructive" });
        setDeletingId(null);
      },
    });
  };

  const handleDeleteSelected = () => {
    if (!selectedIds.length) return;
    if (!confirm(ar ? `حذف ${selectedIds.length} فحص؟` : `Delete ${selectedIds.length} inspections?`)) return;
    deleteMultipleMutation.mutate(selectedIds, {
      onSuccess: (r) => {
        toast({ title: ar ? `حُذف ${r.deleted}` : `Deleted ${r.deleted}` });
        setSelectedIds([]);
      },
      onError: () => toast({ title: ar ? "خطأ" : "Error", variant: "destructive" }),
    });
  };

  const toggle = (id: number) =>
    setSelectedIds((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]));

  const toggleAll = () => {
    if (!inspections) return;
    setSelectedIds(selectedIds.length === inspections.length ? [] : inspections.map((i) => i.id));
  };

  const total     = inspections?.length ?? 0;
  const completed = inspections?.filter((i) => i.status === "completed").length ?? 0;
  const drafts    = inspections?.filter((i) => i.status === "draft").length ?? 0;
  const allSel    = !!inspections?.length && selectedIds.length === inspections.length;
  const today     = new Date().toLocaleDateString(ar ? "ar-SA" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="h-full flex flex-col gap-0" style={{ fontFamily: "inherit" }}>

      {/* ── PAGE MASTHEAD ── */}
      <div className="flex items-end justify-between pb-6 border-b border-zinc-200">
        <div>
          <p className="text-[11px] tracking-widest uppercase text-zinc-400 mb-1">
            {ar ? "مركز الأمان العالي الدولي · لوحة التحكم" : "High Safety Int'l · Dashboard"}
          </p>
          <h1 className="text-2xl font-bold text-zinc-950 leading-none">
            {ar ? "الفحوصات" : "Inspections"}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">{today}</p>
        </div>
        <Link
          href="/inspections/new"
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white tracking-wide transition-opacity hover:opacity-80"
          style={{ background: "#09090b", borderRadius: 6 }}
        >
          <Plus className="w-3.5 h-3.5" />
          {ar ? "فحص جديد" : "New Inspection"}
        </Link>
      </div>

      {/* ── SCORELINE ── */}
      <div className="flex divide-x divide-stone-200/70 py-5" dir="ltr">
        {[
          { n: total,     label: ar ? "إجمالي" : "Total",     sub: ar ? "جميع الفحوصات" : "all records"   },
          { n: completed, label: ar ? "مكتملة" : "Completed",  sub: ar ? "فحوصات مكتملة" : "finished"     },
          { n: drafts,    label: ar ? "مسودة"  : "Drafts",     sub: ar ? "قيد الإنجاز"   : "in progress"  },
        ].map((s) => (
          <div key={s.label} className="flex-1 px-6 first:pl-0 last:pr-0">
            <span
              className="block font-black leading-none"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", color: "#09090b", letterSpacing: "-0.03em" }}
            >
              {s.n.toLocaleString()}
            </span>
            <span className="block text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mt-1">
              {s.label}
            </span>
            <span className="block text-[10px] text-zinc-400 mt-0.5">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* ── TABLE AREA ── */}
      <div className="flex-1 flex flex-col border-t border-zinc-200">

        {/* toolbar */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            {selectedIds.length > 0 ? (
              <button
                onClick={handleDeleteSelected}
                disabled={deleteMultipleMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white bg-zinc-900 hover:bg-black transition-colors disabled:opacity-50"
                data-testid="button-delete-selected"
              >
                {deleteMultipleMutation.isPending
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <Trash2 className="w-3 h-3" />}
                {ar ? `حذف ${selectedIds.length}` : `Delete ${selectedIds.length}`}
              </button>
            ) : (
              <span className="text-[11px] text-zinc-400">
                {isLoading ? (ar ? "جارٍ التحميل…" : "Loading…") : `${total.toLocaleString()} ${ar ? "سجل" : "records"}`}
              </span>
            )}
          </div>
          <div className="relative">
            <Search
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400"
              style={{ [ar ? "left" : "right"]: 9 }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={ar ? "بحث…" : "Search…"}
              className="text-xs py-1.5 rounded border border-zinc-200 bg-white focus:outline-none focus:border-zinc-400 transition-colors"
              style={{
                width: 180,
                [ar ? "paddingLeft" : "paddingRight"]: 24,
                [ar ? "paddingRight" : "paddingLeft"]: 10,
              }}
              data-testid="input-search"
            />
          </div>
        </div>

        {/* table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr style={{ borderBottom: "2px solid #09090b" }}>
                <th className="pb-2 w-8 text-center">
                  <button
                    onClick={toggleAll}
                    className="text-zinc-400 hover:text-zinc-800"
                    data-testid="button-select-all"
                  >
                    {allSel
                      ? <XSquare className="w-4 h-4 text-zinc-950" />
                      : <CheckSquare className="w-4 h-4" />}
                  </button>
                </th>
                {[
                  ar ? "رقم" : "#",
                  ar ? "المركبة" : "Vehicle",
                  ar ? "العميل" : "Customer",
                  ar ? "التاريخ" : "Date",
                  ar ? "الحالة" : "Status",
                  "",
                ].map((h, i) => (
                  <th
                    key={i}
                    className="pb-2 text-right text-[10px] font-black uppercase tracking-widest text-zinc-950"
                    style={{ paddingInlineEnd: i === 5 ? 0 : 16, paddingInlineStart: 0 }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-zinc-400 text-xs">
                    {ar ? "جارٍ التحميل…" : "Loading…"}
                  </td>
                </tr>
              ) : !inspections?.length ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-zinc-400 text-xs">
                    {ar ? "لا توجد نتائج" : "No records found"}
                  </td>
                </tr>
              ) : (
                inspections.map((ins) => {
                  const sel = selectedIds.includes(ins.id);
                  return (
                    <tr
                      key={ins.id}
                      className="transition-colors"
                      style={{
                        borderBottom: "1px solid #e7e5e4",
                        background: sel ? "rgba(0,0,0,0.04)" : "transparent",
                      }}
                    >
                      <td className="py-3 text-center">
                        <button
                          onClick={() => toggle(ins.id)}
                          className="text-zinc-300 hover:text-zinc-700 transition-colors"
                          data-testid={`checkbox-select-${ins.id}`}
                        >
                          {sel
                            ? <CheckSquare className="w-4 h-4 text-zinc-950" />
                            : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="py-3 pe-4 font-mono text-[11px] text-zinc-400">
                        {ins.id.toString().padStart(4, "0")}
                      </td>
                      <td className="py-3 pe-4">
                        <span className="font-semibold text-zinc-950">{ins.make} {ins.model}</span>
                        <span className="block font-mono text-[10px] text-zinc-400 mt-0.5">{ins.vin}</span>
                      </td>
                      <td className="py-3 pe-4">
                        <span className="text-zinc-800">{ins.customerName || "—"}</span>
                        {ins.customerPhone && (
                          <span className="flex items-center gap-1 text-[10px] text-zinc-400 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {ins.customerPhone}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pe-4 text-[11px] text-zinc-600 tabular-nums">
                        {ins.createdAt ? format(new Date(ins.createdAt), "yyyy/MM/dd") : "—"}
                      </td>
                      <td className="py-3 pe-4">
                        <StatusBadge status={ins.status || "draft"} />
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/inspections/${ins.id}`}
                            className="text-[11px] font-semibold text-zinc-600 hover:text-zinc-950 transition-colors"
                            data-testid={`link-view-${ins.id}`}
                          >
                            {ar ? "عرض" : "View"}
                          </Link>
                          <button
                            onClick={(e) => handleDelete(ins.id, e)}
                            disabled={deletingId === ins.id}
                            className="text-zinc-300 hover:text-zinc-950 transition-colors disabled:opacity-40"
                            data-testid={`button-delete-inspection-${ins.id}`}
                          >
                            {deletingId === ins.id
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
