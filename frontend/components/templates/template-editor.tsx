"use client";

import { useRef, useState } from "react";
import { Braces, CircleX, Loader2, Plus, Save, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { MessageTemplate, TemplateButton, TemplateCategory } from "@/lib/types";
import { templatesApi } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TemplatePreview } from "./template-preview";
import { TemplateStatusBadge } from "./template-status";

type Draft = Omit<MessageTemplate, "id" | "status" | "updatedAt" | "rejectionReason"> & { id?: string };

const EMPTY: Draft = { name: "", category: "Utility", language: "English (AU)", header: "", body: "", footer: "", buttons: [], samples: [] };

function variableCount(body: string) {
  return Math.max(0, ...[...body.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1])));
}

export function TemplateEditor({
  template,
  open,
  onOpenChange,
  onSaved,
}: {
  template?: MessageTemplate;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: (t: MessageTemplate) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => (template ? { ...template } : EMPTY));
  const [busy, setBusy] = useState<"save" | "submit" | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const vars = variableCount(draft.body);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const nameValid = /^[a-z0-9_]{3,}$/.test(draft.name);
  const valid = nameValid && draft.body.trim().length > 0;

  function insertVariable() {
    const n = vars + 1;
    const el = bodyRef.current;
    const pos = el?.selectionStart ?? draft.body.length;
    set("body", `${draft.body.slice(0, pos)}{{${n}}}${draft.body.slice(pos)}`);
  }

  function setButton(i: number, patch: Partial<TemplateButton>) {
    set("buttons", draft.buttons.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  }

  async function save(submit: boolean) {
    setBusy(submit ? "submit" : "save");
    const saved = await templatesApi.saveTemplate({ ...draft, samples: draft.samples.slice(0, vars) });
    const result = submit ? await templatesApi.submitTemplate(saved.id) : saved;
    onSaved(result);
    setBusy(null);
    toast.success(submit ? "Submitted for approval" : "Draft saved", {
      description: submit ? "Review usually takes a few minutes. In the demo it's about 5 seconds." : undefined,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{template ? "Edit template" : "New template"} {template && <TemplateStatusBadge status={template.status} />}</DialogTitle>
          <DialogDescription>Templates are reviewed before they can be sent outside the 24-hour window.</DialogDescription>
        </DialogHeader>

        {template?.status === "Rejected" && template.rejectionReason && (
          <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <CircleX className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p><span className="font-medium">Rejected:</span> {template.rejectionReason}</p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-3">
                <Label htmlFor="tpl-name">Name</Label>
                <Input id="tpl-name" value={draft.name} onChange={(e) => set("name", e.target.value.toLowerCase().replace(/\s+/g, "_"))} placeholder="e.g. appointment_follow_up" aria-invalid={draft.name.length > 0 && !nameValid} />
                <p className="text-xs text-muted-foreground">Lowercase letters, numbers and underscores.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={draft.category} onValueChange={(v) => set("category", v as TemplateCategory)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Utility", "Marketing", "Authentication"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Language</Label>
                <Select value={draft.language} onValueChange={(v) => set("language", v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{["English (AU)", "English (UK)", "Vietnamese", "Arabic", "Simplified Chinese"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tpl-header">Header (optional)</Label>
                <Input id="tpl-header" value={draft.header ?? ""} onChange={(e) => set("header", e.target.value)} maxLength={60} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="tpl-body">Body</Label>
                <Button type="button" variant="ghost" size="sm" onClick={insertVariable}><Braces /> Add variable</Button>
              </div>
              <Textarea id="tpl-body" ref={bodyRef} value={draft.body} onChange={(e) => set("body", e.target.value)} rows={5} className="min-h-28" placeholder="Hi {{1}}, …" />
              <p className="text-right text-xs text-muted-foreground">{draft.body.length} / 1024</p>
            </div>

            {vars > 0 && (
              <div className="space-y-2 rounded-xl bg-muted/50 p-3">
                <p className="text-xs font-medium">Sample values (shown to reviewers and in the preview)</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {Array.from({ length: vars }, (_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-10 font-mono text-xs text-muted-foreground">{`{{${i + 1}}}`}</span>
                      <Input value={draft.samples[i] ?? ""} onChange={(e) => { const s = [...draft.samples]; s[i] = e.target.value; set("samples", s); }} className="h-8" aria-label={`Sample for variable ${i + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="tpl-footer">Footer (optional)</Label>
              <Input id="tpl-footer" value={draft.footer ?? ""} onChange={(e) => set("footer", e.target.value)} placeholder="Reply STOP to opt out" maxLength={60} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Buttons</Label>
                <Button type="button" variant="ghost" size="sm" disabled={draft.buttons.length >= 3} onClick={() => set("buttons", [...draft.buttons, { type: "quick_reply", label: "" }])}><Plus /> Add button</Button>
              </div>
              {draft.buttons.length === 0 && <p className="text-xs text-muted-foreground">Up to 3 buttons. Quick replies work best for confirmations.</p>}
              {draft.buttons.map((b, i) => (
                <div key={i} className="flex gap-2">
                  <Select value={b.type} onValueChange={(v) => setButton(i, { type: v as TemplateButton["type"] })}>
                    <SelectTrigger className="w-36" size="sm" aria-label="Button type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quick_reply">Quick reply</SelectItem>
                      <SelectItem value="url">Visit website</SelectItem>
                      <SelectItem value="phone">Call phone</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input value={b.label} onChange={(e) => setButton(i, { label: e.target.value })} placeholder="Button text" maxLength={25} className="h-8" aria-label="Button text" />
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove button" onClick={() => set("buttons", draft.buttons.filter((_, j) => j !== i))}><Trash2 /></Button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
              <Button variant="outline" disabled={!valid || busy !== null} onClick={() => void save(false)}>
                {busy === "save" ? <Loader2 className="animate-spin" /> : <Save />} Save draft
              </Button>
              <Button disabled={!valid || busy !== null} onClick={() => void save(true)}>
                {busy === "submit" ? <Loader2 className="animate-spin" /> : <Send />} Submit for approval
              </Button>
            </div>
          </div>

          <div className="hidden h-[560px] md:block">
            <TemplatePreview header={draft.header} body={draft.body} footer={draft.footer} buttons={draft.buttons} samples={draft.samples} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
