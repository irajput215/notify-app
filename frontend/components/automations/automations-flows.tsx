"use client";

import { useState } from "react";
import { Workflow } from "lucide-react";
import { toast } from "sonner";
import type { Automation } from "@/lib/types";
import { automationsApi } from "@/lib/services";
import { useAsync } from "@/lib/hooks/use-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { AutomationCard } from "./automation-card";
import { AutomationSettingsDialog } from "./automation-settings-dialog";
import { ReminderFlow } from "./reminder-flow";

export function AutomationsFlows() {
  const { data, setData, loading } = useAsync(automationsApi.listAutomations);
  const [editing, setEditing] = useState<Automation | null>(null);
  const replace = (a: Automation) => setData((list) => list?.map((x) => (x.id === a.id ? a : x)));

  async function toggle(a: Automation, enabled: boolean) {
    replace({ ...a, enabled });
    await automationsApi.updateAutomation(a.id, { enabled });
    toast.success(`${a.name} turned ${enabled ? "on" : "off"}`);
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}</div>
      ) : !data?.length ? (
        <EmptyState icon={Workflow} title="No automations" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.map((a) => (
            <AutomationCard key={a.id} automation={a} onToggle={(v) => void toggle(a, v)} onSettings={() => setEditing(a)} />
          ))}
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>How appointment reminders work</CardTitle>
          <CardDescription>Read-only view of the flow. Every branch writes back to Cliniko and anything clinical goes to a person.</CardDescription>
        </CardHeader>
        <CardContent><ReminderFlow /></CardContent>
      </Card>
      {editing && <AutomationSettingsDialog automation={editing} onClose={() => setEditing(null)} onSaved={replace} />}
    </div>
  );
}
