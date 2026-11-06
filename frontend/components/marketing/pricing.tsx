import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BOOK_A_CALL } from "./site-header";

const TIERS = [
  {
    name: "Starter", price: "$99", period: "/ month", blurb: "For solo practitioners getting off the phone.",
    features: ["2 team members", "500 conversations / month", "1,000 AI replies / month", "Shared inbox and templates", "Appointment reminders"],
    cta: "Start with Starter",
  },
  {
    name: "Growth", price: "$249", period: "/ month", blurb: "For busy clinics with a front desk team.", popular: true,
    features: ["5 team members", "1,500 conversations / month", "5,000 AI replies / month", "Cliniko integration", "All clinic automations", "Campaigns with consent checks"],
    cta: "Start with Growth",
  },
  {
    name: "Multi-site", price: "Let's talk", period: "", blurb: "For groups with several locations.",
    features: ["Unlimited team members", "Pooled usage across sites", "Per-location inboxes and numbers", "SSO and audit exports", "Priority onboarding"],
    cta: "Book a call",
  },
];

const FAQ = [
  { q: "What counts as a conversation?", a: "A 24-hour thread with one contact, whoever started it. Multiple messages inside that window count once." },
  { q: "Do I need a new phone number?", a: "You can use an existing landline or mobile, as long as it isn't already on the WhatsApp app. We'll help you move it." },
  { q: "Does the AI give medical advice?", a: "No. Clinical questions always get a holding reply and go to your team. This guardrail can't be switched off." },
  { q: "Where is our data stored?", a: "In Australia (Sydney). Clinical records stay in your practice software; Notify keeps message history for the period you choose." },
  { q: "Which practice software do you support?", a: "Cliniko today, with more on the roadmap. Businesses without practice software can use Google Calendar." },
  { q: "Are prices in AUD?", a: "Yes, all prices are in Australian dollars and include GST. These are placeholder prices for the demo." },
];

export function PricingTiers() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {TIERS.map((t) => (
        <div key={t.name} className={cn("relative flex flex-col rounded-2xl border bg-card p-6 shadow-xs", t.popular && "border-primary shadow-lg ring-1 ring-primary")}>
          {t.popular && <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Most popular</span>}
          <h2 className="text-lg font-semibold">{t.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.blurb}</p>
          <p className="mt-5"><span className="text-4xl font-semibold tracking-tight">{t.price}</span><span className="text-muted-foreground">{t.period}</span></p>
          <ul className="mt-6 flex-1 space-y-2.5 text-sm">
            {t.features.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" /> {f}</li>)}
          </ul>
          <Button className="mt-8" variant={t.popular ? "default" : "outline"} asChild>
            {t.name === "Multi-site" ? <a href={BOOK_A_CALL}>{t.cta}</a> : <Link href="/app/inbox">{t.cta}</Link>}
          </Button>
        </div>
      ))}
    </div>
  );
}

export function PricingFaq() {
  return (
    <div className="mx-auto max-w-3xl divide-y rounded-2xl border bg-card">
      {FAQ.map((f) => (
        <details key={f.q} className="group px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
            {f.q}
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
