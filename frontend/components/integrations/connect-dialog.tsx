"use client";

import { useState } from "react";
import { CircleCheck, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { Integration } from "@/lib/types";
import { integrationsApi } from "@/lib/services";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ConnectDialog({ integration, onClose, onChanged }: { integration: Integration; onClose: () => void; onChanged: (i: Integration) => void }) {
  const [busy, setBusy] = useState(false);
  const connected = integration.status === "connected";

  async function run(status: Integration["status"]) {
    setBusy(true);
    const updated = await integrationsApi.setIntegrationStatus(integration.id, status);
    setBusy(false);
    onChanged(updated);
    toast.success(status === "connected" ? `${integration.name} connected` : `${integration.name} disconnected`);
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader className="flex-row items-center gap-3">
          <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold", integration.monogramClass)}>{integration.monogram}</span>
          <div>
            <DialogTitle>{connected ? `Manage ${integration.name}` : `Connect ${integration.name}`}</DialogTitle>
            <DialogDescription>{integration.category}</DialogDescription>
          </div>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{integration.description}</p>
        {connected ? (
          <div className="space-y-2 rounded-xl border p-4 text-sm">
            <p className="flex items-center gap-2 font-medium"><CircleCheck className="size-4 text-emerald-600" /> Connected and healthy</p>
            {integration.detail && <p className="text-muted-foreground">{integration.detail}</p>}
          </div>
        ) : (
          <ol className="space-y-2 rounded-xl bg-muted/50 p-4 text-sm">
            <li>1. You&apos;ll sign in to {integration.name} and approve access.</li>
            <li>2. Notify reads only what it needs for messaging.</li>
            <li>3. You can disconnect at any time.</li>
          </ol>
        )}
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="size-3.5 text-primary" /> Demo only. No real account is connected.</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {connected ? (
            <Button variant="destructive" disabled={busy} onClick={() => void run("available")}>{busy && <Loader2 className="animate-spin" />} Disconnect</Button>
          ) : (
            <Button disabled={busy} onClick={() => void run("connected")}>{busy && <Loader2 className="animate-spin" />} {busy ? "Connecting…" : `Connect ${integration.name}`}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
