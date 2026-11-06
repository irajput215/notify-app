"use client";

import { Sparkles } from "lucide-react";
import type { Appointment } from "@/lib/types";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { STATUS_META } from "@/components/shared/appointment-status";

export const ROW_PX = 40; // height of a 30-minute row

function shortName(name: string) {
  const [first, ...rest] = name.split(" ");
  return rest.length ? `${first} ${rest[rest.length - 1][0]}.` : first;
}

export function AppointmentBlock({
  appt,
  top,
  compact,
  recentlyMoved,
  onOpen,
}: {
  appt: Appointment;
  top: number;
  compact?: boolean;
  recentlyMoved: boolean;
  onOpen: () => void;
}) {
  const meta = STATUS_META[appt.status];
  const height = (appt.durationMin / 30) * ROW_PX - 3;
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{ top, height }}
      aria-label={`${appt.patientName}, ${formatTime(appt.start)}, ${appt.type}, ${meta.label}`}
      className={cn(
        "absolute inset-x-0.5 overflow-hidden rounded-md border-l-[3px] px-1.5 py-1 text-left text-[11px] leading-tight shadow-xs transition-all outline-none hover:z-10 hover:shadow-md focus-visible:z-10 focus-visible:ring-[3px] focus-visible:ring-ring/50",
        meta.block,
        recentlyMoved && "z-10 animate-pulse-ring ring-2 ring-primary",
      )}
    >
      <span className="flex items-center gap-1 font-semibold">
        <span className="truncate">{compact ? shortName(appt.patientName) : appt.patientName}</span>
        {appt.description && !compact && <Sparkles className="size-3 shrink-0 opacity-70" aria-label="Has patient description" />}
      </span>
      {!compact && (
        <span className="block truncate opacity-80">
          {formatTime(appt.start)} · {appt.type}
        </span>
      )}
      {recentlyMoved && (
        <span className="mt-0.5 inline-block rounded bg-primary px-1 text-[9px] font-semibold text-primary-foreground no-underline">Just moved</span>
      )}
    </button>
  );
}
