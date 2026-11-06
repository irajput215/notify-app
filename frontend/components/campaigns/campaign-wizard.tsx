"use client";

import { useEffect, useState } from "react";
import { Ban, Check, Clock, Loader2, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import type { Campaign, MessageTemplate, Segment } from "@/lib/types";
import { campaignsApi, templatesApi } from "@/lib/services";
import { formatLongDateTime } from "@/lib/format";
import { at } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryBadge } from "@/components/templates/template-status";

type Audience = Awaited<ReturnType<typeof campaignsApi.getAudience>>;
const STEPS = ["Template", "Audience", "Schedule"] as const;

function toLocalInput(d: Date) {
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn("w-full rounded-xl border p-3 text-left transition-colors outline-none hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50", selected && "border-primary bg-accent")}
    >
      {children}
    </button>
  );
}

export function CampaignWizard({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (c: Campaign) => void }) {
  const [step, setStep] = useState(0);
  const [templates, setTemplates] = useState<MessageTemplate[]>();
  const [segments, setSegments] = useState<Segment[]>();
  const [templateId, setTemplateId] = useState<string>();
  const [segmentId, setSegmentId] = useState<string>();
  const [audience, setAudience] = useState<Audience>();
  const [when, setWhen] = useState<"now" | "later">("later");
  const [scheduled, setScheduled] = useState(() => toLocalInput(new Date(at(1, 10, 0))));
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    void templatesApi.listTemplates().then((l) => setTemplates(l.filter((t) => t.status === "Approved" && t.category !== "Authentication")));
    void campaignsApi.listSegments().then(setSegments);
  }, [open]);

  useEffect(() => {
    if (!segmentId) return;
    let cancelled = false;
    void campaignsApi.getAudience(segmentId).then((a) => !cancelled && setAudience(a));
    return () => { cancelled = true; };
  }, [segmentId]);

  const template = templates?.find((t) => t.id === templateId);
  const canNext = step === 0 ? Boolean(templateId) : step === 1 ? Boolean(audience && segmentId) : name.trim().length > 0;
  const excluded = audience ? audience.optedOut.length + audience.pending.length : 0;

  async function create() {
    if (!templateId || !segmentId || !audience) return;
    setSaving(true);
    const c = await campaignsApi.createCampaign({
      name: name.trim(), templateId, segmentId,
      status: when === "now" ? "Sending" : "Scheduled",
      scheduledAt: when === "now" ? new Date().toISOString() : new Date(scheduled).toISOString(),
      recipients: audience.eligible, excluded,
    });
    setSaving(false);
    onCreated(c);
    toast.success(when === "now" ? "Campaign sending" : "Campaign scheduled", { description: `${audience.eligible} recipients · ${excluded} excluded by the consent check` });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New campaign</DialogTitle>
          <DialogDescription>Send an approved template to a segment. Only contacts who have opted in are included.</DialogDescription>
        </DialogHeader>
        <ol className="flex items-center gap-2 text-xs" aria-label="Steps">
          {STEPS.map((s, i) => (
            <li key={s} className={cn("flex flex-1 items-center gap-2", i <= step ? "text-foreground" : "text-muted-foreground")}>
              <span className={cn("flex size-6 items-center justify-center rounded-full border text-[11px] font-semibold", i < step && "border-primary bg-primary text-primary-foreground", i === step && "border-primary text-primary")}>
                {i < step ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className="font-medium">{s}</span>
              {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
            </li>
          ))}
        </ol>

        <div className="max-h-[55vh] min-h-64 overflow-y-auto">
          {step === 0 && (
            <div className="space-y-2">
              {!templates ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />) : templates.map((t) => (
                <Choice key={t.id} selected={t.id === templateId} onClick={() => setTemplateId(t.id)}>
                  <span className="flex items-center justify-between gap-2"><span className="font-mono text-[13px] font-medium">{t.name}</span><CategoryBadge category={t.category} /></span>
                  <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">{t.body}</span>
                </Choice>
              ))}
            </div>
          )}
          {step === 1 && (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {!segments ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />) : segments.map((s) => (
                  <Choice key={s.id} selected={s.id === segmentId} onClick={() => { setAudience(undefined); setSegmentId(s.id); }}>
                    <span className="block text-sm font-medium">{s.name}</span>
                    <span className="block text-xs text-muted-foreground">{s.description}</span>
                  </Choice>
                ))}
              </div>
              {segmentId && (
                <div className="rounded-xl border bg-muted/40 p-4">
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4 text-primary" /> Consent check</p>
                  {!audience ? <Skeleton className="h-16 w-full" /> : (
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center gap-2"><Users className="size-4 text-muted-foreground" /> <span className="flex-1">Contacts in segment</span> <strong>{audience.total}</strong></p>
                      <p className="flex items-center gap-2"><Ban className="size-4 text-muted-foreground" /> <span className="flex-1">Opted out, excluded</span> <strong>{audience.optedOut.length}</strong></p>
                      <p className="flex items-center gap-2"><Clock className="size-4 text-muted-foreground" /> <span className="flex-1">No consent yet, excluded</span> <strong>{audience.pending.length}</strong></p>
                      <p className="flex items-center gap-2 border-t pt-2 font-medium"><Check className="size-4 text-emerald-600" /> <span className="flex-1">Will receive this campaign</span> <strong className="text-primary">{audience.eligible}</strong></p>
                      {excluded > 0 && <p className="text-xs text-muted-foreground">Excluded: {[...audience.optedOut, ...audience.pending].join(", ")}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cp-name">Campaign name</Label>
                <Input id="cp-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Summer Pilates intake" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Choice selected={when === "now"} onClick={() => setWhen("now")}><span className="text-sm font-medium">Send now</span></Choice>
                <Choice selected={when === "later"} onClick={() => setWhen("later")}><span className="text-sm font-medium">Schedule</span></Choice>
              </div>
              {when === "later" && (
                <div className="space-y-1.5">
                  <Label htmlFor="cp-when">Send at</Label>
                  <Input id="cp-when" type="datetime-local" value={scheduled} onChange={(e) => setScheduled(e.target.value)} />
                  <p className="text-xs text-muted-foreground">{formatLongDateTime(new Date(scheduled))} (Sydney time). Messages pause between 8pm and 8am.</p>
                </div>
              )}
              <div className="rounded-xl border p-3 text-sm">
                <p className="text-xs text-muted-foreground">Summary</p>
                <p className="mt-1"><span className="font-mono text-[13px]">{template?.name}</span> to <strong>{audience?.eligible}</strong> contacts</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => (step === 0 ? onOpenChange(false) : setStep(step - 1))}>{step === 0 ? "Cancel" : "Back"}</Button>
          {step < 2 ? (
            <Button disabled={!canNext} onClick={() => setStep(step + 1)}>Continue</Button>
          ) : (
            <Button disabled={!canNext || saving} onClick={() => void create()}>{saving && <Loader2 className="animate-spin" />} {when === "now" ? "Send campaign" : "Schedule campaign"}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
