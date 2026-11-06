"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Automation, AutomationSetting } from "@/lib/types";
import { automationsApi } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export function AutomationSettingsDialog({
  automation,
  onClose,
  onSaved,
}: {
  automation: Automation;
  onClose: () => void;
  onSaved: (a: Automation) => void;
}) {
  const [settings, setSettings] = useState<AutomationSetting[]>(automation.settings);
  const [saving, setSaving] = useState(false);
  const update = (key: string, value: AutomationSetting["value"]) => setSettings((s) => s.map((x) => (x.key === key ? { ...x, value } : x)));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{automation.name}</DialogTitle>
          <DialogDescription>{automation.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {settings.map((s) => {
            const id = `set-${automation.id}-${s.key}`;
            return (
              <div key={s.key} className="space-y-1.5">
                {s.type === "toggle" ? (
                  <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                    <div>
                      <Label htmlFor={id}>{s.label}</Label>
                      {s.help && <p className="mt-1 text-xs text-muted-foreground">{s.help}</p>}
                    </div>
                    <Switch id={id} checked={Boolean(s.value)} onCheckedChange={(v) => update(s.key, v)} />
                  </div>
                ) : s.type === "select" ? (
                  <>
                    <Label htmlFor={id}>{s.label}</Label>
                    <Select value={String(s.value)} onValueChange={(v) => update(s.key, v)}>
                      <SelectTrigger id={id} className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>{s.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </>
                ) : (
                  <>
                    <Label htmlFor={id}>{s.label}</Label>
                    <Input id={id} value={String(s.value)} onChange={(e) => update(s.key, e.target.value)} />
                  </>
                )}
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              const a = await automationsApi.updateAutomation(automation.id, { settings });
              setSaving(false);
              onSaved(a);
              toast.success("Automation settings saved");
              onClose();
            }}
          >
            {saving && <Loader2 className="animate-spin" />} Save settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
