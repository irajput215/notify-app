"use client";

import type { Appointment } from "@/lib/types";
import { clinicHours } from "@/lib/mock/appointments";
import { formatTime, isSameDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AppointmentBlock, ROW_PX } from "./appointment-block";

export const DAY_START = 8;
export const DAY_END = 18;
const ROWS = (DAY_END - DAY_START) * 2;

export interface GridColumn {
  key: string;
  label: React.ReactNode;
  day: Date;
  /** Sub-lanes inside the column, e.g. one per practitioner. */
  lanes: { key: string; appointments: Appointment[] }[];
}

function offsetFor(iso: string) {
  const d = new Date(iso);
  return ((d.getHours() - DAY_START) * 60 + d.getMinutes()) / 30 * ROW_PX;
}

export function CalendarGrid({
  columns,
  now,
  compact,
  isRecent,
  onOpen,
}: {
  columns: GridColumn[];
  now: Date;
  compact?: boolean;
  isRecent: (a: Appointment) => boolean;
  onOpen: (a: Appointment) => void;
}) {
  const times = Array.from({ length: ROWS }, (_, i) => i);
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="sticky top-0 z-20 grid border-b bg-card" style={{ gridTemplateColumns: `64px repeat(${columns.length}, minmax(0, 1fr))` }}>
          <div />
          {columns.map((c) => (
            <div key={c.key} className={cn("border-l px-2 py-2.5 text-center text-sm", isSameDay(c.day, now) && "text-primary")}>{c.label}</div>
          ))}
        </div>
        <div className="relative grid" style={{ gridTemplateColumns: `64px repeat(${columns.length}, minmax(0, 1fr))` }}>
          <div>
            {times.map((i) => (
              <div key={i} style={{ height: ROW_PX }} className="relative pr-2 text-right text-[11px] text-muted-foreground">
                {i % 2 === 0 && <span className={cn("relative", i === 0 ? "top-0.5" : "-top-2")}>{formatTime(new Date(2026, 0, 1, DAY_START + i / 2))}</span>}
              </div>
            ))}
          </div>
          {columns.map((c) => {
            const hours = clinicHours(c.day.getDay());
            const closedFrom = hours ? (hours[1] - DAY_START) * 2 * ROW_PX : 0;
            const showNow = isSameDay(c.day, now) && now.getHours() >= DAY_START && now.getHours() < DAY_END;
            return (
              <div key={c.key} className="relative border-l">
                {times.map((i) => (
                  <div key={i} style={{ height: ROW_PX }} className={cn("border-b", i % 2 === 0 ? "border-border/70" : "border-dashed border-border/40")} />
                ))}
                {hours && closedFrom < ROWS * ROW_PX && (
                  <div className="absolute inset-x-0 bottom-0 bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,var(--muted)_6px,var(--muted)_8px)] opacity-70" style={{ top: closedFrom }}>
                    <span className="sticky top-12 block p-2 text-center text-[11px] text-muted-foreground">Closed</span>
                  </div>
                )}
                <div className="absolute inset-0 flex">
                  {c.lanes.map((lane) => (
                    <div key={lane.key} className="relative flex-1 border-r border-dashed border-border/30 last:border-r-0">
                      {lane.appointments.map((a) => (
                        <AppointmentBlock key={a.id} appt={a} top={offsetFor(a.start) + 1} compact={compact} recentlyMoved={isRecent(a)} onOpen={() => onOpen(a)} />
                      ))}
                    </div>
                  ))}
                </div>
                {showNow && (
                  <div className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top: ((now.getHours() - DAY_START) * 60 + now.getMinutes()) / 30 * ROW_PX }}>
                    <span className="-ml-1 size-2 rounded-full bg-rose-500" />
                    <span className="h-px flex-1 bg-rose-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
