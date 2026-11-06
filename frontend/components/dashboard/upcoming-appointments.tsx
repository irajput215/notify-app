"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { useDemoStore } from "@/lib/store/demo-store";
import { formatTime, weekday, formatDate } from "@/lib/format";
import { useNow } from "@/lib/hooks/use-now";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentStatusBadge } from "@/components/shared/appointment-status";
import { EmptyState } from "@/components/shared/empty-state";

export function UpcomingAppointments() {
  const now = useNow();
  const ready = useDemoStore((s) => s.status === "ready");
  const appointments = useDemoStore((s) => s.appointments);
  const practitioners = useDemoStore((s) => s.practitioners);
  const upcoming = Object.values(appointments)
    .filter((a) => new Date(a.start) > now)
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 6);

  if (!ready) return <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;
  if (!upcoming.length) return <EmptyState icon={CalendarDays} title="No upcoming appointments" className="py-8" />;

  return (
    <ul className="space-y-1">
      {upcoming.map((a) => (
        <li key={a.id}>
          <Link href={`/app/clinic/appointments?a=${a.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2 outline-none hover:bg-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <span className="w-16 shrink-0 text-xs leading-tight">
              <span className="block font-semibold">{formatTime(a.start)}</span>
              <span className="text-muted-foreground">{weekday(a.start)} {formatDate(a.start).slice(0, 5)}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{a.patientName}</span>
              <span className="block truncate text-xs text-muted-foreground">{practitioners.find((p) => p.id === a.practitionerId)?.short} · {a.type}</span>
            </span>
            <AppointmentStatusBadge status={a.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
