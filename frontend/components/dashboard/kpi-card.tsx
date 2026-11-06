"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  href,
  tone = "default",
}: {
  label: string;
  value?: number;
  icon: LucideIcon;
  hint: string;
  href?: string;
  tone?: "default" | "warning";
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={cn("flex size-8 items-center justify-center rounded-lg", tone === "warning" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" : "bg-brand-soft text-primary")}>
          <Icon className="size-4" />
        </span>
      </div>
      {value === undefined ? (
        <Skeleton className="mt-3 h-8 w-16" />
      ) : (
        <p key={value} className="mt-2 w-fit rounded-md text-3xl font-semibold tracking-tight tabular-nums animate-in fade-in-0 slide-in-from-bottom-1 duration-500">
          {formatNumber(value)}
        </p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </>
  );
  const cls = cn(
    "block rounded-xl border bg-card p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.04)] transition-shadow outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
    href && "hover:shadow-md",
    tone === "warning" && value ? "border-amber-200 dark:border-amber-500/30" : "",
  );
  return href ? <Link href={href} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}
