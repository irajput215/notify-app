"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import type { MessageTemplate } from "@/lib/types";
import { templatesApi } from "@/lib/services";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export function TemplatePicker({
  open,
  onOpenChange,
  firstName,
  onSend,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  firstName: string;
  onSend: (templateId: string) => Promise<void>;
}) {
  const [templates, setTemplates] = useState<MessageTemplate[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    templatesApi.listTemplates().then((list) => {
      if (cancelled) return;
      const approved = list.filter((t) => t.status === "Approved" && t.category !== "Authentication");
      setTemplates(approved);
      setSelected((s) => s ?? approved[0]?.id ?? null);
    });
    return () => { cancelled = true; };
  }, [open]);

  const current = templates?.find((t) => t.id === selected);
  const preview = current?.body.replace(/\{\{(\d+)\}\}/g, (_, n: string) => (n === "1" ? firstName : current.samples[Number(n) - 1] ?? ""));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send a template</DialogTitle>
          <DialogDescription>Only approved templates can be sent outside the 24-hour window. Variables are filled from the contact and appointment.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-[1fr_1.1fr]">
          <ul className="max-h-80 space-y-1 overflow-y-auto pr-1" aria-label="Approved templates">
            {!templates
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
              : templates.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(t.id)}
                      className={cn(
                        "w-full rounded-lg border px-3 py-2 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50",
                        selected === t.id && "border-primary bg-accent",
                      )}
                    >
                      <span className="block truncate font-mono text-xs font-medium">{t.name}</span>
                      <span className="mt-1 flex gap-1"><Badge variant={t.category === "Marketing" ? "violet" : "info"}>{t.category}</Badge></span>
                    </button>
                  </li>
                ))}
          </ul>
          <div className="rounded-xl bg-chat-bg p-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Preview</p>
            {current ? (
              <div className="rounded-2xl rounded-tr-md bg-bubble-out p-3 text-sm whitespace-pre-wrap shadow-xs">
                {current.header && <p className="mb-1 font-semibold">{current.header}</p>}
                {preview}
                {current.footer && <p className="mt-2 text-xs text-muted-foreground">{current.footer}</p>}
              </div>
            ) : (
              <Skeleton className="h-28 w-full rounded-2xl" />
            )}
            {current?.buttons.map((b) => (
              <div key={b.label} className="mt-1 rounded-xl border bg-card py-1.5 text-center text-[13px] font-medium text-primary">{b.label}</div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!current || sending}
            onClick={async () => {
              if (!current) return;
              setSending(true);
              await onSend(current.id);
              setSending(false);
              onOpenChange(false);
            }}
          >
            {sending ? <Loader2 className="animate-spin" /> : <FileText />} Send template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
