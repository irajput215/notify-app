"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

/** Two-slice donut with legend + direct percentages so identity is never colour-alone. */
export function HandledSplitChart({ ai, human }: { ai: number; human: number }) {
  const total = ai + human || 1;
  const data = [
    { name: "Resolved by AI", value: ai, color: "var(--chart-1)" },
    { name: "Handled by your team", value: human, color: "var(--chart-2)" },
  ];
  const aiPct = Math.round((ai / total) * 100);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <div className="relative size-44 shrink-0" role="img" aria-label={`${aiPct}% of conversations resolved by AI, ${100 - aiPct}% handled by the team`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius="68%" outerRadius="100%" paddingAngle={2} stroke="var(--card)" strokeWidth={2} startAngle={90} endAngle={-270}>
              {data.map((d) => <Cell key={d.name} fill={d.color} />)}
            </Pie>
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                    <span className="font-medium">{payload[0].name}</span>: {payload[0].value} conversations
                  </div>
                ) : null
              }
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums">{aiPct}%</span>
          <span className="text-xs text-muted-foreground">by AI</span>
        </div>
      </div>
      <ul className="w-full space-y-3 text-sm">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2.5">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
            <span className="flex-1 text-muted-foreground">{d.name}</span>
            <span className="font-semibold tabular-nums">{d.value}</span>
            <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">{Math.round((d.value / total) * 100)}%</span>
          </li>
        ))}
        <li className="border-t pt-3 text-xs text-muted-foreground">This week · {total} conversations. Clinical questions always go to a person.</li>
      </ul>
    </div>
  );
}
