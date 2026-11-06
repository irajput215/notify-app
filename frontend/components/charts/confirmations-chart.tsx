"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyPoint } from "@/lib/types";
import { formatDate } from "@/lib/format";

interface Point extends DailyPoint {
  isToday?: boolean;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const rate = p.reminders ? Math.round((p.confirmations / p.reminders) * 100) : 0;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{p.isToday ? "Today" : p.label} · {formatDate(p.date)}</p>
      <p className="mt-1 text-muted-foreground"><span className="font-semibold text-foreground tabular-nums">{p.confirmations}</span> confirmations</p>
      <p className="text-muted-foreground">{p.reminders} reminders sent · {rate}% confirmed</p>
    </div>
  );
}

/** Single-series bar chart: appointments confirmed via messaging, last 7 days. */
export function ConfirmationsChart({ data }: { data: Point[] }) {
  return (
    <div className="h-64 w-full" role="img" aria-label={`Confirmations over the last 7 days: ${data.map((d) => `${d.label} ${d.confirmations}`).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -20 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.6 }} content={<ChartTooltip />} />
          <Bar dataKey="confirmations" radius={[4, 4, 0, 0]} isAnimationActive>
            {data.map((d) => (
              <Cell key={d.date} fill="var(--chart-1)" fillOpacity={d.isToday ? 1 : 0.55} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
