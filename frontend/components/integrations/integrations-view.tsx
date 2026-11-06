"use client";

import { useState } from "react";
import { CircleCheck } from "lucide-react";
import { toast } from "sonner";
import type { Integration } from "@/lib/types";
import { integrationsApi } from "@/lib/services";
import { useAsync } from "@/lib/hooks/use-async";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { ConnectDialog } from "./connect-dialog";

function IntegrationCard({ item, onAction }: { item: Integration; onAction: () => void }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs">
      <div className="flex items-start gap-3">
        <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold", item.monogramClass)} aria-hidden="true">{item.monogram}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-muted-foreground">{item.category}</p>
        </div>
        {item.status === "connected" ? (
          <Badge variant="success"><CircleCheck /> Connected</Badge>
        ) : item.status === "available" ? (
          <Badge variant="outline">Available</Badge>
        ) : (
          <Badge variant="muted">Coming soon</Badge>
        )}
      </div>
      <p className="flex-1 text-sm text-muted-foreground">{item.description}</p>
      {item.detail && <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">{item.detail}</p>}
      <Button variant={item.status === "available" ? "default" : "outline"} size="sm" onClick={onAction} className="w-full">
        {item.status === "connected" ? "Manage" : item.status === "available" ? "Connect" : "Notify me"}
      </Button>
    </div>
  );
}

export function IntegrationsView() {
  const { data, setData, loading } = useAsync(integrationsApi.listIntegrations);
  const [open, setOpen] = useState<Integration | null>(null);
  const onAction = (i: Integration) =>
    i.status === "coming_soon" ? toast.success(`We'll let you know when ${i.name} is ready`) : setOpen(i);
  const section = (kind: Integration["kind"], title: string, description: string) => (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)
          : data?.filter((i) => i.kind === kind).map((i) => <IntegrationCard key={i.id} item={i} onAction={() => onAction(i)} />)}
      </div>
    </section>
  );

  return (
    <PageContainer>
      <PageHeader title="Integrations" description="Connect your practice software and messaging channels. Integration names are shown for reference only." />
      {section("app", "Apps", "Practice management, calendars, accounting and automation")}
      {section("channel", "Channels", "Where your customers message you")}
      {open && (
        <ConnectDialog integration={open} onClose={() => setOpen(null)} onChanged={(u) => setData((l) => l?.map((x) => (x.id === u.id ? u : x)))} />
      )}
    </PageContainer>
  );
}
