"use client";

import { Reply, Settings2, Sparkles } from "lucide-react";
import type { Automation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AUTOMATION_ICONS } from "./automation-icon";

export function AutomationCard({
  automation,
  onToggle,
  onSettings,
}: {
  automation: Automation;
  onToggle: (enabled: boolean) => void;
  onSettings: () => void;
}) {
  const Icon = AUTOMATION_ICONS[automation.key];
  const summary = automation.settings.find((s) => s.type === "select");
  return (
    <div className={cn("flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs transition-opacity", !automation.enabled && "opacity-75")}>
      <div className="flex items-start gap-3">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", automation.enabled ? "bg-brand-soft text-primary" : "bg-muted text-muted-foreground")}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{automation.name}</h3>
            <Badge variant={automation.enabled ? "success" : "muted"}>{automation.enabled ? "On" : "Off"}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{automation.description}</p>
        </div>
        <Switch checked={automation.enabled} onCheckedChange={onToggle} aria-label={`Turn ${automation.name} ${automation.enabled ? "off" : "on"}`} />
      </div>

      <div className="rounded-xl bg-chat-bg p-3">
        <p className="mb-1.5 flex items-center gap-1 text-[11px] font-medium text-muted-foreground"><Sparkles className="size-3" /> Message preview</p>
        <div className="max-w-[90%] rounded-2xl rounded-tl-md bg-bubble-in px-3 py-2 text-[13px] shadow-xs">{automation.previewMessage}</div>
        {automation.previewButtons && (
          <div className="mt-1 flex max-w-[90%] flex-wrap gap-1">
            {automation.previewButtons.map((b) => (
              <span key={b} className="inline-flex items-center gap-1 rounded-lg border bg-card px-2.5 py-1 text-xs font-medium text-primary"><Reply className="size-3" /> {b}</span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        {automation.stats.map((s) => (
          <div key={s.label}>
            <p className="font-semibold tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {summary && <span className="hidden text-xs text-muted-foreground sm:inline">{String(summary.value)}</span>}
          <Button variant="outline" size="sm" onClick={onSettings}><Settings2 /> Settings</Button>
        </div>
      </div>
    </div>
  );
}
