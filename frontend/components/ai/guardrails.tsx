"use client";

import { useState } from "react";
import { Lock, ShieldAlert, X } from "lucide-react";
import type { AiSettings } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function Guardrails({ settings, onChange }: { settings: AiSettings; onChange: (patch: Partial<AiSettings>) => void }) {
  const [keyword, setKeyword] = useState("");
  const add = () => {
    const k = keyword.trim().toLowerCase();
    if (k && !settings.escalationKeywords.includes(k)) onChange({ escalationKeywords: [...settings.escalationKeywords, k] });
    setKeyword("");
  };
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4 rounded-xl border bg-muted/40 p-3">
        <div>
          <Label htmlFor="g-clinical" className="flex items-center gap-1.5"><Lock className="size-3.5 text-primary" /> Never give clinical advice</Label>
          <p className="mt-1 text-xs text-muted-foreground">Always on. Symptom, treatment and medication questions get a holding reply and go to a person.</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
              <Switch id="g-clinical" checked disabled aria-readonly />
            </span>
          </TooltipTrigger>
          <TooltipContent>This guardrail can&apos;t be turned off</TooltipContent>
        </Tooltip>
      </div>
      <div className="flex items-start justify-between gap-4 rounded-xl border p-3">
        <div>
          <Label htmlFor="g-unsure">Escalate when unsure</Label>
          <p className="mt-1 text-xs text-muted-foreground">If the AI isn&apos;t confident, it tells the patient a team member will reply and flags Needs human.</p>
        </div>
        <Switch id="g-unsure" checked={settings.escalateWhenUnsure} onCheckedChange={(v) => onChange({ escalateWhenUnsure: v })} />
      </div>
      <div className="rounded-xl border p-3">
        <Label htmlFor="g-kw" className="flex items-center gap-1.5"><ShieldAlert className="size-3.5 text-amber-600" /> Escalation keywords</Label>
        <p className="mt-1 text-xs text-muted-foreground">Any message containing these goes straight to your team.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {settings.escalationKeywords.map((k) => (
            <span key={k} className="inline-flex items-center gap-1 rounded-full bg-amber-50 py-0.5 pr-1 pl-2.5 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
              {k}
              <button type="button" aria-label={`Remove ${k}`} onClick={() => onChange({ escalationKeywords: settings.escalationKeywords.filter((x) => x !== k) })} className="rounded-full p-0.5 outline-none hover:bg-amber-200/60 focus-visible:ring-2 focus-visible:ring-ring/50">
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
        <Input
          id="g-kw"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Add a keyword and press Enter"
          className="mt-3 h-8"
        />
      </div>
    </div>
  );
}
