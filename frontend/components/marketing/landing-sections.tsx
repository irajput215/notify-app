import Link from "next/link";
import {
  ArrowRight, Bot, CalendarClock, ClipboardList, Hand, Inbox, ListRestart, MapPin, PhoneMissed, Plug, ShieldCheck,
  Smartphone, Sparkles, Workflow, FileLock2, ScrollText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BOOK_A_CALL } from "./site-header";

export function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance md:text-4xl">{title}</h2>
      {text && <p className="mt-3 text-muted-foreground text-balance">{text}</p>}
    </div>
  );
}

const STEPS = [
  { icon: Plug, title: "Connect", text: "Link your WhatsApp number and Cliniko in about 15 minutes. Patients and appointments sync automatically." },
  { icon: Workflow, title: "Switch on automations", text: "Reminders, rescheduling, missed-call text-back and pre-visit questions are ready to go. Tweak timing and wording." },
  { icon: Inbox, title: "Work from one inbox", text: "The AI handles the routine. Your team sees everything, steps in any time, and gets anything clinical straight away." },
];

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 md:px-6">
      <SectionHeading eyebrow="How it works" title="Live in an afternoon, not a quarter" />
      <ol className="mt-12 grid gap-6 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="rounded-2xl border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-primary"><s.icon className="size-5" /></span>
              <span className="text-sm font-semibold text-muted-foreground">Step {i + 1}</span>
            </div>
            <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const FEATURES = [
  { icon: Inbox, title: "Shared team inbox", text: "Every conversation in one place, with assignment, internal notes and status tags." },
  { icon: Sparkles, title: "AI replies with guardrails", text: "Answers FAQs and handles bookings in your tone. Never gives clinical advice." },
  { icon: ClipboardList, title: "Approved templates", text: "Build and submit templates with a live preview. Reach people outside the 24-hour window." },
  { icon: Workflow, title: "Ready-made automations", text: "Reminders, waitlist fill, feedback and out-of-hours replies, switched on with a toggle." },
  { icon: Smartphone, title: "Interactive buttons", text: "Patients tap Confirm, Reschedule or a time slot instead of typing." },
  { icon: ShieldCheck, title: "Consent built in", text: "Opt-ins and STOP replies are tracked per contact and respected everywhere." },
];

export function Features() {
  return (
    <section className="border-y bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <SectionHeading eyebrow="Features" title="Everything your front desk does on the phone, now in messages" />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6">
              <f.icon className="size-5 text-primary" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const CLINIC = [
  { icon: CalendarClock, title: "Reminders that do something", text: "Confirm, Reschedule and Cancel buttons update Cliniko instantly. Patients pick a new slot with one tap." },
  { icon: ClipboardList, title: "Know why they're coming in", text: "New patients describe the problem before the visit. The AI writes a short summary into the appointment notes, next to their own words." },
  { icon: PhoneMissed, title: "No more lost callers", text: "Missed a call while with a patient? Notify texts them straight back and books them in." },
  { icon: ListRestart, title: "Fill cancelled slots", text: "When someone cancels, the slot goes to your waitlist automatically. First to reply gets it." },
  { icon: Hand, title: "Clinical questions go to people", text: "“My pain got worse” is never answered by AI. It gets a holding reply and lands with your team, flagged." },
  { icon: Bot, title: "After-hours cover", text: "Patients get answers at 9pm. Your team walks in to a tidy inbox, not a voicemail queue." },
];

export function ClinicSection() {
  return (
    <section id="clinics" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 md:px-6">
      <SectionHeading eyebrow="Built for clinics first" title="A front desk assistant for physio, chiro, dental and allied health" text="Notify comes with a clinic workflow out of the box, connected to Cliniko." />
      <div className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2">
        {CLINIC.map((c) => (
          <div key={c.title} className="flex gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-primary"><c.icon className="size-5" /></span>
            <div><h3 className="font-semibold">{c.title}</h3><p className="mt-1 text-sm text-muted-foreground">{c.text}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

const METRICS = [
  { value: "80%", label: "of reminder replies handled without staff" },
  { value: "3 min", label: "average time for a patient to reschedule" },
  { value: "1 in 3", label: "missed callers booked from the text-back" },
  { value: "6 hrs", label: "of phone time saved per week at the front desk" },
];

export function Metrics() {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <p className="text-center text-sm font-medium opacity-80">Example results for a three-practitioner clinic</p>
        <div className="mt-8 grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((m) => (
            <div key={m.label}>
              <p className="text-4xl font-semibold tracking-tight">{m.value}</p>
              <p className="mt-2 text-sm opacity-85">{m.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs opacity-70">Example figures for illustration only. Not measured results from real customers.</p>
      </div>
    </section>
  );
}

const TRUST = [
  { icon: MapPin, title: "Hosted in Sydney", text: "Messages, contacts and AI processing stay in Australia." },
  { icon: FileLock2, title: "Encrypted in transit and at rest", text: "Modern encryption throughout, and every staff action is logged." },
  { icon: ScrollText, title: "Privacy Act ready", text: "Designed around the Australian Privacy Principles, with consent records per contact." },
  { icon: Hand, title: "Humans for anything clinical", text: "The AI is locked out of clinical advice. It hands over, every time." },
];

export function Trust() {
  return (
    <section id="trust" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 md:px-6">
      <SectionHeading eyebrow="Privacy and trust" title="Patient conversations deserve care" />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST.map((t) => (
          <div key={t.title} className="rounded-2xl border bg-card p-6">
            <t.icon className="size-5 text-primary" />
            <h3 className="mt-3 font-semibold">{t.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{t.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CtaBand() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 md:px-6">
      <div className="rounded-3xl border bg-brand-soft px-6 py-12 text-center md:px-12">
        <h2 className="text-3xl font-semibold tracking-tight text-balance">See a patient reschedule in under a minute</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Open the live demo, play the patient on a simulated phone, and watch the inbox, calendar and dashboard update together.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild><Link href="/app/inbox">View live demo <ArrowRight /></Link></Button>
          <Button size="lg" variant="outline" asChild><a href={BOOK_A_CALL}>Book a call</a></Button>
        </div>
      </div>
    </section>
  );
}
