import type { AppointmentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const STATUS_META: Record<AppointmentStatus, { label: string; chip: string; block: string; dot: string }> = {
  confirmed: {
    label: "Confirmed",
    chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    block: "border-l-emerald-500 bg-emerald-50 text-emerald-950 dark:bg-emerald-500/15 dark:text-emerald-50",
    dot: "bg-emerald-500",
  },
  unconfirmed: {
    label: "Unconfirmed",
    chip: "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
    block: "border-l-amber-500 bg-amber-50 text-amber-950 dark:bg-amber-500/15 dark:text-amber-50",
    dot: "bg-amber-500",
  },
  rescheduled: {
    label: "Rescheduled by patient",
    chip: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    block: "border-l-violet-500 bg-violet-50 text-violet-950 dark:bg-violet-500/15 dark:text-violet-50",
    dot: "bg-violet-500",
  },
  cancelled: {
    label: "Cancelled",
    chip: "bg-muted text-muted-foreground",
    block: "border-l-slate-400 bg-muted/70 text-muted-foreground line-through decoration-1",
    dot: "bg-slate-400",
  },
};

export function AppointmentStatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap", meta.chip, className)}>
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}
