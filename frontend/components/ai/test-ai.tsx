"use client";

import { useState } from "react";
import { Bot, Hand, Loader2, Send, Sparkles } from "lucide-react";
import type { AiSettings } from "@/lib/types";
import { aiApi } from "@/lib/services";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SAMPLES = ["Is there parking?", "How much is an initial consult?", "Can I move my appointment to Friday?", "My knee is swollen, should I still exercise?", "Do you sell gift cards?"];

type Result = Awaited<ReturnType<typeof aiApi.testAi>>;

export function TestAi({ settings }: { settings: AiSettings }) {
  const [q, setQ] = useState("");
  const [asked, setAsked] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(question: string) {
    if (!question.trim()) return;
    setAsked(question);
    setResult(null);
    setLoading(true);
    setResult(await aiApi.testAi(question, settings));
    setLoading(false);
    setQ("");
  }

  return (
    <div className="space-y-3">
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void ask(q); }}>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask something a patient might ask" aria-label="Test question" />
        <Button type="submit" size="icon" disabled={!q.trim() || loading} aria-label="Test"><Send /></Button>
      </form>
      <div className="flex flex-wrap gap-1.5">
        {SAMPLES.map((s) => (
          <button key={s} type="button" onClick={() => void ask(s)} className="rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground outline-none hover:border-primary hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50">{s}</button>
        ))}
      </div>
      <div className="min-h-48 space-y-2 rounded-xl bg-chat-bg p-3">
        {!asked && <p className="flex h-44 items-center justify-center text-center text-sm text-muted-foreground"><Bot className="mr-2 size-4" /> Try a question to see how the AI would reply.</p>}
        {asked && (
          <div className="flex justify-start animate-message-in"><div className="max-w-[85%] rounded-2xl rounded-tl-md bg-bubble-in px-3 py-2 text-sm shadow-xs">{asked}</div></div>
        )}
        {loading && <div className="flex justify-end"><span className="flex items-center gap-2 rounded-2xl bg-bubble-ai px-3 py-2 text-xs"><Loader2 className="size-3.5 animate-spin" /> Thinking…</span></div>}
        {result && (
          <div className="flex flex-col items-end gap-1 animate-message-in">
            <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-bubble-ai px-3 py-2 text-sm whitespace-pre-wrap shadow-xs">{result.reply}</div>
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", result.escalated ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" : "bg-brand-soft text-accent-foreground")}>
              {result.escalated ? <Hand className="size-3" /> : <Sparkles className="size-3" />} {result.label}
            </span>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Dry run using the settings on this page, including unsaved changes. Nothing is sent.</p>
    </div>
  );
}
