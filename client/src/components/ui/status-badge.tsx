import { cn } from "@/lib/utils";

type Status = 'draft' | 'completed' | 'pass' | 'fail' | 'warning';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600 border-slate-200",
    completed: "bg-blue-100 text-blue-700 border-blue-200",
    pass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    fail: "bg-red-100 text-red-700 border-red-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
  };

  const labels: Record<string, string> = {
    draft: "مسودة",
    completed: "مكتمل",
    pass: "جيد",
    fail: "معيب",
    warning: "تنبيه",
  };
  
  // Fallback for English logic if needed, or stick to Arabic default per requirements
  const englishLabels: Record<string, string> = {
    draft: "Draft",
    completed: "Completed",
    pass: "Pass",
    fail: "Fail",
    warning: "Warning",
  };

  const isRtl = document.documentElement.dir === 'rtl';
  const label = isRtl ? (labels[status] || status) : (englishLabels[status] || status);

  return (
    <span className={cn(
      "px-2.5 py-0.5 rounded-full text-xs font-semibold border inline-flex items-center",
      styles[status] || "bg-slate-100 text-slate-600",
      className
    )}>
      {label}
    </span>
  );
}
