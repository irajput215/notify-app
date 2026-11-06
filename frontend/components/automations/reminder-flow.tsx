import { ArrowDown, BellRing, CalendarCheck, CalendarClock, CalendarX, Clock, Filter, Hand, ListRestart, MessageSquareReply, Send, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Kind = "trigger" | "condition" | "action" | "wait";

const KIND: Record<Kind, { label: string; cls: string }> = {
  trigger: { label: "Trigger", cls: "border-sky-300 bg-sky-50 dark:border-sky-500/40 dark:bg-sky-500/10" },
  condition: { label: "Condition", cls: "border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10" },
  action: { label: "Action", cls: "border-primary/40 bg-brand-soft" },
  wait: { label: "Wait for", cls: "border-violet-300 bg-violet-50 dark:border-violet-500/40 dark:bg-violet-500/10" },
};

function Node({ kind, icon: Icon, title, detail, className }: { kind: Kind; icon: LucideIcon; title: string; detail?: string; className?: string }) {
  return (
    <div className={cn("w-full max-w-64 rounded-xl border px-3 py-2.5 shadow-xs", KIND[kind].cls, className)}>
      <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{KIND[kind].label}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium"><Icon className="size-4 shrink-0 text-primary" /> {title}</p>
      {detail && <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}

function Arrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center py-1 text-muted-foreground" aria-hidden="true">
      <span className="h-3 w-px bg-border" />
      {label && <span className="rounded-full border bg-card px-2 py-0.5 text-[10px] font-medium">{label}</span>}
      <ArrowDown className="size-3.5" />
    </div>
  );
}

const BRANCHES: { label: string; steps: { kind: Kind; icon: LucideIcon; title: string; detail?: string }[] }[] = [
  { label: "Confirm", steps: [{ kind: "action", icon: CalendarCheck, title: "Mark confirmed", detail: "Status updated in Cliniko" }] },
  {
    label: "Reschedule",
    steps: [
      { kind: "action", icon: CalendarClock, title: "Offer 3 free slots", detail: "Same practitioner, next 14 days" },
      { kind: "action", icon: CalendarCheck, title: "Move appointment", detail: "Cliniko updated, toast to team" },
    ],
  },
  {
    label: "Cancel",
    steps: [
      { kind: "action", icon: CalendarX, title: "Confirm & cancel", detail: "Offer reschedule first" },
      { kind: "action", icon: ListRestart, title: "Start waitlist fill", detail: "Offer slot to 3 patients" },
    ],
  },
  {
    label: "No reply · 20h",
    steps: [
      { kind: "action", icon: BellRing, title: "Second reminder", detail: "4 hours before" },
      { kind: "action", icon: Hand, title: "Flag for front desk", detail: "Shows in Needs attention" },
    ],
  },
];

/** Read-only visual of the appointment reminder automation. */
export function ReminderFlow() {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[760px] flex-col items-center py-2">
        <Node kind="trigger" icon={Clock} title="24 hours before appointment" detail="Any practitioner, any appointment type in Cliniko" />
        <Arrow />
        <Node kind="condition" icon={Filter} title="Patient has opted in" detail="Opted-out or pending contacts are skipped and logged" />
        <Arrow label="Yes" />
        <Node kind="action" icon={Send} title="Send appointment_reminder" detail="Template with Confirm, Reschedule, Cancel" />
        <Arrow />
        <Node kind="wait" icon={MessageSquareReply} title="Patient reply" detail="Free text is read by the AI with the same rules" />
        <div className="relative mt-1 grid w-full grid-cols-4 gap-4 pt-5">
          <span className="absolute top-0 right-[12.5%] left-[12.5%] h-px bg-border" aria-hidden="true" />
          <span className="absolute top-[-4px] left-1/2 h-1 w-px bg-border" aria-hidden="true" />
          {BRANCHES.map((b) => (
            <div key={b.label} className="relative flex flex-col items-center">
              <span className="absolute -top-5 h-5 w-px bg-border" aria-hidden="true" />
              <span className="mb-1 rounded-full border bg-card px-2 py-0.5 text-[10px] font-semibold">{b.label}</span>
              {b.steps.map((s, i) => (
                <div key={s.title} className="flex w-full flex-col items-center">
                  {i > 0 && <Arrow />}
                  <Node {...s} className="mt-1" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
