"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarClock, CalendarOff, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import type { Appointment } from "@/lib/types";
import { useDemoStore } from "@/lib/store/demo-store";
import { useNow } from "@/lib/hooks/use-now";
import { formatDate, formatSlot, isSameDay, weekday } from "@/lib/format";
import { addDays, startOfDay, startOfWeek } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { STATUS_META } from "@/components/shared/appointment-status";
import { AppointmentSheet } from "./appointment-sheet";
import { CalendarGrid, type GridColumn } from "./calendar-grid";

const RECENT_MS = 5 * 60_000;

export function AppointmentsView() {
  const params = useSearchParams();
  const now = useNow(30_000);
  const ready = useDemoStore((s) => s.status === "ready");
  const appointments = useDemoStore((s) => s.appointments);
  const practitioners = useDemoStore((s) => s.practitioners);
  const [view, setView] = useState<"day" | "week">("day");
  const [date, setDate] = useState(() => startOfDay(new Date()));
  const [practitionerId, setPractitionerId] = useState<string>("all");
  const [openId, setOpenId] = useState<string | undefined>();

  // Deep link: /app/clinic/appointments?a=<id> jumps to that appointment.
  const linked = params.get("a");
  useEffect(() => {
    if (!ready || !linked) return;
    const a = appointments[linked];
    if (!a) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDate(startOfDay(new Date(a.start)));
    setOpenId(a.id);
    // Only on first arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, linked]);

  const list = useMemo(() => Object.values(appointments), [appointments]);
  const isRecent = (a: Appointment) => Boolean(a.movedAt && now.getTime() - new Date(a.movedAt).getTime() < RECENT_MS);
  const recent = list.filter(isRecent).sort((a, b) => (b.movedAt ?? "").localeCompare(a.movedAt ?? ""))[0];

  const days = view === "day" ? [date] : Array.from({ length: 6 }, (_, i) => addDays(startOfWeek(date), i));
  const shownPractitioners = practitioners.filter((p) => practitionerId === "all" || p.id === practitionerId);

  const columns: GridColumn[] =
    view === "day"
      ? shownPractitioners.map((p) => ({
          key: p.id,
          day: date,
          label: (
            <span className="inline-flex items-center gap-2 font-medium">
              <span className={cn("size-2 rounded-full", p.colorClass)} /> {p.name}
            </span>
          ),
          lanes: [{ key: p.id, appointments: list.filter((a) => a.practitionerId === p.id && isSameDay(new Date(a.start), date)) }],
        }))
      : days.map((d) => ({
          key: d.toISOString(),
          day: d,
          label: (
            <span className="leading-tight">
              <span className="block text-xs text-muted-foreground">{weekday(d)}</span>
              <span className="font-semibold">{formatDate(d).slice(0, 5)}</span>
            </span>
          ),
          lanes: shownPractitioners.map((p) => ({
            key: p.id,
            appointments: list.filter((a) => a.practitionerId === p.id && isSameDay(new Date(a.start), d)),
          })),
        }));

  const visible = columns.flatMap((c) => c.lanes.flatMap((l) => l.appointments));
  const closedDay = view === "day" && date.getDay() === 0;
  const step = view === "day" ? 1 : 7;
  const rangeLabel = view === "day" ? `${weekday(date, true)} ${formatDate(date)}` : `Week of ${formatDate(days[0])}`;

  return (
    <PageContainer>
      <PageHeader
        title="Appointments"
        description={
          <span className="inline-flex items-center gap-1.5"><RefreshCw className="size-3.5 text-primary" /> Synced from Cliniko · changes made in Notify appear here instantly</span>
        }
        actions={
          <Tabs value={view} onValueChange={(v) => setView(v as "day" | "week")}>
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      {recent && (
        <button
          type="button"
          onClick={() => { setDate(startOfDay(new Date(recent.start))); setOpenId(recent.id); }}
          className="flex items-center gap-3 rounded-xl border border-primary/30 bg-brand-soft px-4 py-3 text-left text-sm outline-none animate-in fade-in-0 slide-in-from-top-2 focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <CalendarClock className="size-5 shrink-0 text-primary" />
          <span className="flex-1">
            <strong>{recent.patientName}</strong> {recent.status === "rescheduled" ? "was rescheduled by the AI to" : "was booked by the AI for"} <strong>{formatSlot(recent.start)}</strong>. Cliniko is up to date.
          </span>
          <span className="font-medium text-primary">Show</span>
        </button>
      )}

      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" aria-label="Previous" onClick={() => setDate((d) => addDays(d, -step))}><ChevronLeft /></Button>
            <Button variant="outline" size="sm" onClick={() => setDate(startOfDay(new Date()))}>Today</Button>
            <Button variant="outline" size="icon-sm" aria-label="Next" onClick={() => setDate((d) => addDays(d, step))}><ChevronRight /></Button>
          </div>
          <p className="font-semibold">{rangeLabel}</p>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by practitioner">
            {[{ id: "all", short: "All practitioners", colorClass: "" }, ...practitioners].map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={practitionerId === p.id}
                onClick={() => setPractitionerId(p.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  practitionerId === p.id ? "border-primary bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p.colorClass && <span className={cn("size-2 rounded-full", p.colorClass)} />}
                {p.short}
              </button>
            ))}
          </div>
          <ul className="ml-auto flex flex-wrap gap-3 text-xs text-muted-foreground" aria-label="Status legend">
            {Object.entries(STATUS_META).map(([k, m]) => (
              <li key={k} className="flex items-center gap-1.5"><span className={cn("size-2.5 rounded-sm", m.dot)} /> {m.label}</li>
            ))}
          </ul>
        </div>
        {view === "week" && practitionerId === "all" && (
          <div className="flex gap-4 border-b bg-muted/40 px-4 py-1.5 text-[11px] text-muted-foreground">
            Lanes in each day, left to right:
            {practitioners.map((p) => <span key={p.id} className="inline-flex items-center gap-1"><span className={cn("size-2 rounded-full", p.colorClass)} />{p.short}</span>)}
          </div>
        )}

        <div className="max-h-[calc(100dvh-20rem)] min-h-96 overflow-y-auto">
          {!ready ? (
            <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : closedDay ? (
            <EmptyState icon={CalendarOff} title="Clinic closed on Sundays" description="Patients can still message. The AI handles questions and books them in for the week." />
          ) : (
            <CalendarGrid columns={columns} now={now} compact={view === "week"} isRecent={isRecent} onOpen={(a) => setOpenId(a.id)} />
          )}
        </div>
        {ready && !closedDay && (
          <p className="border-t px-4 py-2 text-xs text-muted-foreground">
            {visible.filter((a) => a.status !== "cancelled").length} appointments · {visible.filter((a) => a.status === "unconfirmed").length} unconfirmed · {visible.filter((a) => a.description).length} with a patient description
          </p>
        )}
      </Card>

      <AppointmentSheet appointmentId={openId} onClose={() => setOpenId(undefined)} />
    </PageContainer>
  );
}
