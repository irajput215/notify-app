import Link from "next/link";
import { ArrowRight, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { ClinicSection, CtaBand, Features, HowItWorks, Metrics, Trust } from "@/components/marketing/landing-sections";
import { BOOK_A_CALL } from "@/components/marketing/site-header";

export default function Landing() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-20 md:px-6 lg:grid-cols-2 lg:pt-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" /> Now for Australian health clinics
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance md:text-6xl">Your front desk, on WhatsApp.</h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Notify runs patient conversations from one shared inbox. Reminders patients can act on, rescheduling with a tap, AI answers to everyday questions, and a person for anything clinical.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild><Link href="/app/inbox">View live demo <ArrowRight /></Link></Button>
            <Button size="lg" variant="outline" asChild><a href={BOOK_A_CALL}>Book a call</a></Button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {["Connects to Cliniko", "Data hosted in Australia", "No clinical advice from AI"].map((t) => (
              <li key={t} className="flex items-center gap-1.5"><CircleCheck className="size-4 text-primary" /> {t}</li>
            ))}
          </ul>
        </div>
        <HeroVisual />
      </section>
      <HowItWorks />
      <Features />
      <ClinicSection />
      <Metrics />
      <Trust />
      <CtaBand />
    </>
  );
}
