"use client";

import { useState } from "react";
import { Megaphone, Plus } from "lucide-react";
import type { CampaignStatus } from "@/lib/types";
import { campaignsApi, templatesApi } from "@/lib/services";
import { useAsync } from "@/lib/hooks/use-async";
import { formatDate, formatTime } from "@/lib/format";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { CampaignWizard } from "./campaign-wizard";

const STATUS: Record<CampaignStatus, BadgeVariant> = { Draft: "muted", Scheduled: "info", Sending: "warning", Sent: "success" };

const loadAll = () => Promise.all([campaignsApi.listCampaigns(), templatesApi.listTemplates(), campaignsApi.listSegments()]);

export function CampaignsView() {
  const { data, setData, loading } = useAsync(loadAll);
  const [wizardKey, setWizardKey] = useState(0);
  const [open, setOpen] = useState(false);
  const [campaigns, templates, segments] = data ?? [[], [], []];

  const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "–");

  return (
    <PageContainer>
      <PageHeader
        title="Campaigns"
        description="Occasional broadcasts to opted-in contacts, like new class times or seasonal check-ins."
        actions={<Button onClick={() => { setWizardKey((k) => k + 1); setOpen(true); }}><Plus /> New campaign</Button>}
      />
      <Card className="gap-0 py-0">
        {loading ? (
          <div className="space-y-3 p-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : campaigns.length === 0 ? (
          <EmptyState icon={Megaphone} title="No campaigns yet" description="Create your first campaign to reach opted-in contacts." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Audience</TableHead>
                <TableHead>Send date</TableHead>
                <TableHead className="text-right">Recipients</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Read</TableHead>
                <TableHead className="hidden pr-4 text-right lg:table-cell">Replied</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="pl-4">
                    <p className="font-medium">{c.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{templates.find((t) => t.id === c.templateId)?.name}</p>
                  </TableCell>
                  <TableCell><Badge variant={STATUS[c.status]}>{c.status}</Badge></TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{segments.find((s) => s.id === c.segmentId)?.name}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(c.scheduledAt)} {formatTime(c.scheduledAt)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.recipients}
                    {c.excluded > 0 && <span className="block text-xs text-muted-foreground">{c.excluded} excluded (consent)</span>}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums lg:table-cell">{c.status === "Sent" ? pct(c.read, c.delivered) : "–"}</TableCell>
                  <TableCell className="hidden pr-4 text-right tabular-nums lg:table-cell">{c.status === "Sent" ? pct(c.replied, c.delivered) : "–"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      <p className="text-xs text-muted-foreground">
        Marketing messages are only sent to contacts who opted in. Every message includes an opt-out, and STOP replies are honoured immediately.
      </p>
      <CampaignWizard
        key={wizardKey}
        open={open}
        onOpenChange={setOpen}
        onCreated={(c) => setData((d) => (d ? [[c, ...d[0]], d[1], d[2]] : d))}
      />
    </PageContainer>
  );
}
