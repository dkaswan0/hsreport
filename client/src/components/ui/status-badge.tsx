import { cn } from "@/lib/utils";

type Status = 'draft' | 'completed' | 'pass' | 'fail' | 'warning';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    draft: "bg-zinc-100 text-zinc-600 border-zinc-200",
    completed: "bg-zinc-950 text-white border-zinc-900",
    pass: "bg-zinc-100 text-zinc-950 border-zinc-300 font-bold",
    fail: "bg-zinc-900 text-white border-zinc-950 font-bold",
    warning: "bg-zinc-200 text-zinc-900 border-zinc-400 font-bold",
  };

  const labels: Record<string, string> = {
    draft: "ما خلص",
    completed: "خلص",
    pass: "ناجح",
    fail: "فاشل",
    warning: "تحذير",
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
