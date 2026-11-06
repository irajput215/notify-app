import type { Metadata } from "next";
import { SectionHeading } from "@/components/marketing/landing-sections";
import { PricingFaq, PricingTiers } from "@/components/marketing/pricing";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 py-16 md:px-6 md:py-24">
      <SectionHeading eyebrow="Pricing" title="Simple plans in Australian dollars" text="Placeholder pricing for the demo. All plans include the shared inbox, templates, AI replies with clinical guardrails and Australian data hosting." />
      <PricingTiers />
      <div className="space-y-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight">Frequently asked questions</h2>
        <PricingFaq />
      </div>
    </div>
  );
}
