"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { billingApi } from "@/lib/services";
import { useAsync } from "@/lib/hooks/use-async";
import { formatAUD, formatDate, formatNumber } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function Meter({ label, used, included }: { label: string; used: number; included: number }) {
  const pct = Math.round((used / included) * 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm"><span>{label}</span><span className="tabular-nums text-muted-foreground">{formatNumber(used)} / {formatNumber(included)}</span></div>
      <Progress value={pct} aria-label={`${label}: ${pct}% used`} />
      <p className="text-xs text-muted-foreground">{pct}% of included usage</p>
    </div>
  );
}

export function BillingSettings() {
  const usage = useAsync(billingApi.getUsage);
  const invoices = useAsync(billingApi.listInvoices);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Growth plan</CardTitle>
            <CardDescription>Billed monthly in AUD, GST included</CardDescription>
            <CardAction><Badge variant="brand">Current plan</Badge></CardAction>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-semibold">{formatAUD(249)}<span className="text-base font-normal text-muted-foreground"> / month</span></p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Up to 5 team members · 1 location</li>
              <li>1,500 conversations and 5,000 AI replies included</li>
              <li>Cliniko integration and all clinic automations</li>
            </ul>
            <div className="flex gap-2 pt-1"><Button variant="outline" size="sm" onClick={() => toast.info("Plan changes are disabled in the demo")}>Change plan</Button><Button variant="ghost" size="sm" onClick={() => toast.info("Card ending 4242 (demo)")}>Payment method</Button></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Usage this month</CardTitle>
            <CardDescription>{usage.data?.periodLabel ?? "…"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {usage.data ? (
              <>
                <Meter label="Conversations" used={usage.data.conversationsUsed} included={usage.data.conversationsIncluded} />
                <Meter label="AI replies" used={usage.data.aiRepliesUsed} included={usage.data.aiRepliesIncluded} />
              </>
            ) : (
              <Skeleton className="h-28 w-full" />
            )}
          </CardContent>
        </Card>
      </div>
      <Card className="gap-0 pb-0">
        <CardHeader className="pb-4"><CardTitle>Invoices</CardTitle><CardDescription>Example invoices for the demo</CardDescription></CardHeader>
        {invoices.data ? (
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="pl-5">Invoice</TableHead><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead className="pr-5 text-right">PDF</TableHead></TableRow></TableHeader>
            <TableBody>
              {invoices.data.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="pl-5 font-medium">{i.number}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(i.date)}</TableCell>
                  <TableCell className="tabular-nums">{formatAUD(i.amountAud)}</TableCell>
                  <TableCell><Badge variant={i.status === "Paid" ? "success" : "warning"}>{i.status}</Badge></TableCell>
                  <TableCell className="pr-5 text-right"><Button variant="ghost" size="icon-sm" aria-label={`Download ${i.number}`} onClick={() => toast.info("Downloads are disabled in the demo")}><Download /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-5"><Skeleton className="h-32 w-full" /></div>
        )}
      </Card>
    </div>
  );
}
