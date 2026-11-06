"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type { AiSettings } from "@/lib/types";
import { aiApi } from "@/lib/services";
import { useAsync } from "@/lib/hooks/use-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FaqEditor } from "./faq-editor";
import { Guardrails } from "./guardrails";
import { TestAi } from "./test-ai";
import { TonePicker } from "./tone-picker";

function Editor({ initial }: { initial: AiSettings }) {
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const patch = (p: Partial<AiSettings>) => setDraft((d) => ({ ...d, ...p }));

  async function save() {
    setSaving(true);
    const s = await aiApi.saveAiSettings(draft);
    setSaved(s);
    setDraft(s);
    setSaving(false);
    toast.success("AI settings saved", { description: "Live conversations use the new settings straight away." });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Guardrails</CardTitle>
            <CardDescription>What the AI must never do, and when it hands over to your team.</CardDescription>
          </CardHeader>
          <CardContent><Guardrails settings={draft} onChange={patch} /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tone</CardTitle>
            <CardDescription>How the assistant sounds when it writes to patients.</CardDescription>
          </CardHeader>
          <CardContent><TonePicker value={draft.tone} onChange={(tone) => patch({ tone })} /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Business FAQ</CardTitle>
            <CardDescription>The AI only answers general questions from these approved answers.</CardDescription>
          </CardHeader>
          <CardContent><FaqEditor faqs={draft.faqs} onChange={(faqs) => patch({ faqs })} /></CardContent>
        </Card>
      </div>
      <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Test the AI</CardTitle>
            <CardDescription>See exactly how Notify would reply.</CardDescription>
          </CardHeader>
          <CardContent><TestAi settings={draft} /></CardContent>
        </Card>
        <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-xs">
          <p className="text-sm text-muted-foreground">{dirty ? "You have unsaved changes" : "All changes saved"}</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" disabled={!dirty} onClick={() => setDraft(saved)}>Discard</Button>
            <Button size="sm" disabled={!dirty || saving} onClick={() => void save()}>{saving ? <Loader2 className="animate-spin" /> : <Save />} Save</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AiSettingsView() {
  const { data } = useAsync(aiApi.getAiSettings);
  if (!data) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-6"><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-40 rounded-xl" /></div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }
  return <Editor initial={data} />;
}
