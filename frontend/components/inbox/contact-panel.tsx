"use client";

import { useMemo } from "react";
import { CalendarDays, ExternalLink, Mail, MapPin, Phone, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import type { Contact, Conversation } from "@/lib/types";
import { useDemoStore } from "@/lib/store/demo-store";
import { useNow } from "@/lib/hooks/use-now";
import { formatDate, formatLongDateTime, formatPhone } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ContactAvatar } from "@/components/shared/contact-avatar";
import { OptInBadge } from "@/components/shared/opt-in-badge";
import { AppointmentStatusBadge } from "@/components/shared/appointment-status";
import { PatientDescriptionCard } from "./patient-description";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5 px-5 py-4">
      <h3 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  );
}

function Row({ icon: Icon, children }: { icon: typeof Phone; children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2.5 text-sm">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}

export function ContactPanel({ contact, conversation }: { contact: Contact; conversation: Conversation }) {
  const appointments = useDemoStore((s) => s.appointments);
  const practitioners = useDemoStore((s) => s.practitioners);
  const team = useDemoStore((s) => s.team);
  const assignee = team.find((t) => t.id === conversation.assignedTo);
  const nowDate = useNow(60_000);

  const { next, withDescription } = useMemo(() => {
    const now = nowDate.getTime();
    const mine = Object.values(appointments)
      .filter((a) => a.contactId === contact.id)
      .sort((a, b) => a.start.localeCompare(b.start));
    const upcoming = mine.filter((a) => new Date(a.start).getTime() > now && a.status !== "cancelled");
    return { next: upcoming[0], withDescription: [...upcoming, ...mine].find((a) => a.description) };
  }, [appointments, contact.id, nowDate]);
  const practitioner = practitioners.find((p) => p.id === next?.practitionerId);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex flex-col items-center gap-2 px-5 pt-6 pb-4 text-center">
        <ContactAvatar name={contact.name} className="size-16 text-lg" />
        <div>
          <p className="font-semibold">{contact.name}</p>
          <p className="text-xs text-muted-foreground">{contact.isPatient ? `Patient · ${contact.clinikoPatientId}` : "Enquiry"}</p>
        </div>
        <OptInBadge status={contact.optIn} />
      </div>
      <Separator />
      <Section title="Details">
        <Row icon={Phone}>{formatPhone(contact.phone)}</Row>
        {contact.email && <Row icon={Mail}>{contact.email}</Row>}
        {contact.suburb && <Row icon={MapPin}>{contact.suburb}</Row>}
        {contact.dateOfBirth && <Row icon={CalendarDays}>DOB {contact.dateOfBirth}</Row>}
      </Section>
      <Separator />
      <Section title="Tags">
        <div className="flex flex-wrap gap-1.5">
          {contact.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
        </div>
      </Section>
      <Separator />
      <Section title="Consent & owner">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Opt-in source</p>
            <p className="font-medium">{contact.optInSource}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Opted in</p>
            <p className="font-medium">{contact.optInAt ? formatDate(contact.optInAt) : "Not yet"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground">Assigned to</p>
            <p className="font-medium">{assignee ? `${assignee.name} · ${assignee.title}` : "Unassigned"}</p>
          </div>
        </div>
      </Section>
      {contact.isPatient && (
        <>
          <Separator />
          <Section title="Clinic">
            {next ? (
              <div className="space-y-2 rounded-xl border bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">Next appointment</p>
                  <AppointmentStatusBadge status={next.status} />
                </div>
                <p className="text-sm font-medium">{formatLongDateTime(next.start)}</p>
                <Row icon={Stethoscope}>{practitioner?.name} · {next.type}</Row>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming appointment.</p>
            )}
            {withDescription?.description && (
              <div className="pt-1">
                <p className="mb-2 text-xs font-medium">Patient&apos;s description</p>
                <PatientDescriptionCard description={withDescription.description} />
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => toast.info("Opens this patient in Cliniko", { description: "Links are disabled in the demo." })}
            >
              View in Cliniko <ExternalLink />
            </Button>
          </Section>
        </>
      )}
    </div>
  );
}
