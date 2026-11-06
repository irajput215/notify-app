import type { Metadata } from "next";
import { Suspense } from "react";
import { AutomationsView } from "@/components/automations/automations-view";

export const metadata: Metadata = { title: "Automations" };

export default function AutomationsPage() {
  return (
    <Suspense>
      <AutomationsView />
    </Suspense>
  );
}
