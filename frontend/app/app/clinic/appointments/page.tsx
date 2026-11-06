import type { Metadata } from "next";
import { Suspense } from "react";
import { AppointmentsView } from "@/components/appointments/appointments-view";

export const metadata: Metadata = { title: "Appointments" };

export default function AppointmentsPage() {
  return (
    <Suspense>
      <AppointmentsView />
    </Suspense>
  );
}
