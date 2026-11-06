"use client";

import Link from "next/link";
import { CalendarCheck, CalendarX, Clock, ExternalLink, MessagesSquare, Stethoscope, UserRound } from "lucide-react";
import { toast } from "sonner";
import type { Appointment } from "@/lib/types";
import { appointmentsApi } from "@/lib/services";
import { useDemoStore } from "@/lib/store/demo-store";
import { formatDate, formatLongDateTime, formatPhone, formatTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AppointmentStatusBadge } from "@/components/shared/appointment-status";
import { PatientDescriptionCard } from "@/components/inbox/patient-description";

export function AppointmentSheet({ appointmentId, onClose }: { appointmentId?: string; onClose: () => void }) {
  const appt = useDemoStore((s) => (appointmentId ? s.appointments[appointmentId] : undefined));
  const practitioners = useDemoStore((s) => s.practitioners);
  const contact = useDemoStore((s) => (appt?.contactId ? s.contacts[appt.contactId] : undefined));
  const conversationId = useDemoStore((s) => (appt?.contactId ? Object.values(s.conversations).find((c) => c.contactId === appt.contactId)?.id : undefined));
  const practitioner = practitioners.find((p) => p.id === appt?.practitionerId);

  async function setStatus(a: Appointment, status: Appointment["status"]) {
    await appointmentsApi.setAppointmentStatus(a.id, status);
    toast.success(status === "confirmed" ? "Marked as confirmed in Cliniko" : "Appointment cancelled in Cliniko");
  }

  return (
    <Sheet open={Boolean(appt)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        {appt && (
          <>
            <SheetHeader>
              <AppointmentStatusBadge status={appt.status} />
              <SheetTitle className="text-xl">{appt.patientName}</SheetTitle>
              <SheetDescription>{appt.type} · {appt.durationMin} min</SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-5 pb-6">
              <div className="space-y-2.5 rounded-xl border p-4 text-sm">
                <p className="flex items-center gap-2.5"><Clock className="size-4 text-muted-foreground" /> {formatLongDateTime(appt.start)}</p>
                <p className="flex items-center gap-2.5"><Stethoscope className="size-4 text-muted-foreground" /> {practitioner?.name} · {practitioner?.title}</p>
                {contact && <p className="flex items-center gap-2.5"><UserRound className="size-4 text-muted-foreground" /> {formatPhone(contact.phone)} · {contact.clinikoPatientId}</p>}
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold">Patient&apos;s description</h3>
                {appt.description ? (
                  <PatientDescriptionCard description={appt.description} />
                ) : (
                  <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">No description yet. The pre-visit request is sent 2 days before new patient appointments.</p>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold">History</h3>
                <ol className="space-y-2.5 border-l pl-4">
                  {appt.history.map((h, i) => (
                    <li key={i} className="relative text-sm">
                      <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-card bg-primary" />
                      <p>{h.text}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(h.at)} at {formatTime(h.at)}</p>
                    </li>
                  ))}
                </ol>
              </div>

              <Separator />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" disabled={appt.status === "confirmed" || appt.status === "cancelled"} onClick={() => void setStatus(appt, "confirmed")}>
                  <CalendarCheck /> Mark confirmed
                </Button>
                <Button variant="outline" disabled={appt.status === "cancelled"} onClick={() => void setStatus(appt, "cancelled")}>
                  <CalendarX /> Cancel
                </Button>
                {conversationId && (
                  <Button asChild className="col-span-2">
                    <Link href={`/app/inbox?c=${conversationId}`}><MessagesSquare /> Open conversation</Link>
                  </Button>
                )}
                <Button variant="ghost" className="col-span-2" onClick={() => toast.info("Opens the appointment in Cliniko", { description: "Links are disabled in the demo." })}>
                  View in Cliniko <ExternalLink />
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
