"use client";

import { Plus, Trash2 } from "lucide-react";
import type { FaqEntry } from "@/lib/types";
import { uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function FaqEditor({ faqs, onChange }: { faqs: FaqEntry[]; onChange: (f: FaqEntry[]) => void }) {
  const update = (id: string, patch: Partial<FaqEntry>) => onChange(faqs.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  return (
    <div className="space-y-3">
      {faqs.map((f, i) => (
        <div key={f.id} className="space-y-2 rounded-xl border p-3">
          <div className="flex items-center gap-2">
            <Label htmlFor={`faq-q-${f.id}`} className="sr-only">Question {i + 1}</Label>
            <Input id={`faq-q-${f.id}`} value={f.question} onChange={(e) => update(f.id, { question: e.target.value })} className="h-8 font-medium" placeholder="Question" />
            <Button variant="ghost" size="icon-sm" aria-label={`Delete “${f.question}”`} onClick={() => onChange(faqs.filter((x) => x.id !== f.id))}><Trash2 /></Button>
          </div>
          <Label htmlFor={`faq-a-${f.id}`} className="sr-only">Answer</Label>
          <Textarea id={`faq-a-${f.id}`} value={f.answer} onChange={(e) => update(f.id, { answer: e.target.value })} className="min-h-14 text-sm" placeholder="Answer the AI should give" />
          <div className="flex items-center gap-2">
            <Label htmlFor={`faq-k-${f.id}`} className="shrink-0 text-xs font-normal text-muted-foreground">Matches</Label>
            <Input
              id={`faq-k-${f.id}`}
              value={f.keywords.join(", ")}
              onChange={(e) => update(f.id, { keywords: e.target.value.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean) })}
              className="h-7 text-xs"
              placeholder="keywords, separated, by commas"
            />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...faqs, { id: uid("faq"), question: "", answer: "", keywords: [] }])}>
        <Plus /> Add question
      </Button>
    </div>
  );
}
