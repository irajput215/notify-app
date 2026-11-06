import { CalendarCheck, Reply, Sparkles } from "lucide-react";

/** Static product illustration for the hero (no third-party UI or branding). */
export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-brand-soft via-transparent to-amber-100/50 blur-2xl dark:to-amber-500/10" />
      <div className="rounded-[2rem] border bg-card p-4 shadow-2xl">
        <div className="flex items-center gap-2.5 border-b pb-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">HP</span>
          <div className="leading-tight"><p className="text-sm font-semibold">Harbourside Physio</p><p className="text-xs text-muted-foreground">Business account</p></div>
        </div>
        <div className="space-y-2 rounded-2xl bg-chat-bg p-3 text-[13px]">
          <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-bubble-in px-3 py-2 shadow-xs">Hi Olivia, a reminder of your appointment with Hannah tomorrow at 10am. Can you make it?</div>
          <div className="flex max-w-[85%] gap-1">
            {["Confirm", "Reschedule", "Cancel"].map((b) => (
              <span key={b} className={`flex flex-1 items-center justify-center gap-1 rounded-lg border bg-card py-1.5 text-[11px] font-medium text-primary ${b === "Reschedule" ? "border-primary/50 bg-brand-soft" : ""}`}><Reply className="size-3" />{b}</span>
            ))}
          </div>
          <div className="ml-auto w-fit rounded-2xl rounded-tr-md bg-bubble-out px-3 py-2 shadow-xs">Reschedule</div>
          <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-bubble-in px-3 py-2 shadow-xs">No problem! Here are the next times with Hannah. Tap one:</div>
          <div className="flex max-w-[85%] flex-col gap-1">
            {["Wed 2:30pm", "Thu 2:30pm", "Fri 11am"].map((b) => (
              <span key={b} className={`rounded-lg border bg-card py-1.5 text-center text-[11px] font-medium text-primary ${b === "Thu 2:30pm" ? "border-primary/50 bg-brand-soft" : ""}`}>{b}</span>
            ))}
          </div>
          <div className="ml-auto w-fit rounded-2xl rounded-tr-md bg-bubble-out px-3 py-2 shadow-xs">Thu 2:30pm</div>
          <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-bubble-in px-3 py-2 shadow-xs">Done! See you Thursday at 2:30pm.</div>
        </div>
      </div>
      <div className="absolute top-[46%] -left-10 hidden items-center gap-2 rounded-xl border bg-card px-3 py-2 text-xs shadow-lg sm:flex">
        <CalendarCheck className="size-4 text-emerald-600" />
        <span><strong>Appointment moved</strong><br /><span className="text-muted-foreground">Practice system updated</span></span>
      </div>
      <div className="absolute -right-4 bottom-16 hidden items-center gap-2 rounded-xl border bg-card px-3 py-2 text-xs shadow-lg sm:flex">
        <Sparkles className="size-4 text-primary" />
        <span><strong>Handled by AI</strong><br /><span className="text-muted-foreground">No phone call needed</span></span>
      </div>
    </div>
  );
}
