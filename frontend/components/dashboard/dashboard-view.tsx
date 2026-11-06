"use client";

import Link from "next/link";
import { CalendarCheck, CalendarClock, Hand, MessagesSquare, PhoneMissed, Send, Smartphone } from "lucide-react";
import { useDemoStore, useCurrentUser } from "@/lib/store/demo-store";
import { formatDate, weekday } from "@/lib/format";
import { useNow } from "@/lib/hooks/use-now";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { ConfirmationsChart } from "@/components/charts/confirmations-chart";
import { HandledSplitChart } from "@/components/charts/handled-split-chart";
import { KpiCard } from "./kpi-card";
import { NeedsAttention } from "./needs-attention";
import { UpcomingAppointments } from "./upcoming-appointments";

function greeting(d: Date) {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function DashboardView() {
  const now = useNow(60_000);
  const user = useCurrentUser();
  const counters = useDemoStore((s) => s.counters);
  const history = useDemoStore((s) => s.history);
  const setSimulatorOpen = useDemoStore((s) => s.setSimulatorOpen);
  const needsHuman = useDemoStore((s) => (s.status === "ready" ? Object.values(s.conversations).filter((c) => c.tags.includes("needs_human")).length : undefined));
  const series = counters
    ? [...history, { date: now.toISOString(), label: weekday(now), confirmations: counters.confirmations, reminders: counters.remindersSent, isToday: true }]
    : [];

  return (
    <PageContainer>
      <PageHeader
        title={user ? `${greeting(now)}, ${user.name.split(" ")[0]}` : "Dashboard"}
        description={`Here's what Notify handled for Harbourside Physio today · ${weekday(now, true)} ${formatDate(now)}`}
        actions={
          <>
            <Button variant="outline" asChild><Link href="/app/inbox"><MessagesSquare /> Open inbox</Link></Button>
            <Button asChild onClick={() => setSimulatorOpen(true)}><Link href="/app/inbox?c=cv_olivia"><Smartphone /> Run live demo</Link></Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Conversations today" value={counters?.conversationsToday} icon={MessagesSquare} hint="Across WhatsApp and SMS" />
        <KpiCard label="Reminders sent" value={counters?.remindersSent} icon={Send} hint="24h before appointments" />
        <KpiCard label="Confirmations" value={counters?.confirmations} icon={CalendarCheck} hint="Updated in Cliniko" />
        <KpiCard label="Reschedules by AI" value={counters?.reschedulesByAi} icon={CalendarClock} hint="No phone call needed" />
        <KpiCard label="Missed calls recovered" value={counters?.missedCallsRecovered} icon={PhoneMissed} hint="Text-back led to a booking" />
        <KpiCard label="Needs human" value={needsHuman} icon={Hand} hint="Waiting for your team" tone="warning" href="/app/inbox?filter=needs_human" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Confirmations, last 7 days</CardTitle>
            <CardDescription>Appointments confirmed by patients tapping Confirm. Today updates live.</CardDescription>
          </CardHeader>
          <CardContent>{series.length ? <ConfirmationsChart data={series} /> : <Skeleton className="h-64 w-full" />}</CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>AI vs human handled</CardTitle>
            <CardDescription>Conversations resolved this week</CardDescription>
          </CardHeader>
          <CardContent>
            {counters ? <HandledSplitChart ai={counters.aiHandled} human={counters.humanHandled} /> : <Skeleton className="h-44 w-full" />}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
            <CardDescription>Escalations and unread messages, most urgent first</CardDescription>
            <CardAction><Button variant="ghost" size="sm" asChild><Link href="/app/inbox?filter=needs_human">View all</Link></Button></CardAction>
          </CardHeader>
          <CardContent><NeedsAttention /></CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Coming up</CardTitle>
            <CardDescription>Next appointments from Cliniko</CardDescription>
            <CardAction><Button variant="ghost" size="sm" asChild><Link href="/app/clinic/appointments">Calendar</Link></Button></CardAction>
          </CardHeader>
          <CardContent><UpcomingAppointments /></CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
