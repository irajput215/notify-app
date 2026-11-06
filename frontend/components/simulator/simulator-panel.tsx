"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BellRing, Check, PhoneMissed, Send, Smartphone } from "lucide-react";
import { toast } from "sonner";
import type { MessageButton } from "@/lib/types";
import { simulatorApi } from "@/lib/services";
import { SIMULATOR_CONVERSATION_ID } from "@/lib/services/simulator";
import { useDemoStore } from "@/lib/store/demo-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PhoneChat } from "./phone-chat";
import { PhoneFrame } from "./phone-frame";

const SUGGESTIONS = [
  "Can I come Friday instead?",
  "Tomorrow works better",
  "Is there parking?",
  "How much are your fees?",
  "I need to cancel",
  "My pain got much worse after yesterday",
  "STOP",
];

function Step({ n, done, active, children }: { n: number; done: boolean; active: boolean; children: React.ReactNode }) {
  return (
    <li className={cn("flex items-center gap-2 text-xs", done ? "text-foreground" : active ? "font-medium text-foreground" : "text-muted-foreground")}>
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors",
          done ? "border-primary bg-primary text-primary-foreground" : active ? "border-primary text-primary" : "",
        )}
      >
        {done ? <Check className="size-3" /> : n}
      </span>
      {children}
    </li>
  );
}

export function SimulatorPanel() {
  const id = SIMULATOR_CONVERSATION_ID;
  const conversation = useDemoStore((s) => s.conversations[id]);
  const contact = useDemoStore((s) => (conversation ? s.contacts[conversation.contactId] : undefined));
  const messages = useDemoStore((s) => s.messages[id]);
  const typing = useDemoStore((s) => Boolean(s.typing[id]));
  const counters = useDemoStore((s) => s.counters);
  const loadMessages = useDemoStore((s) => s.loadMessages);
  const ready = useDemoStore((s) => s.status === "ready");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const loaded = Boolean(messages);
  useEffect(() => {
    if (ready && !loaded) void loadMessages(id);
  }, [ready, loaded, id, loadMessages]);

  const step = conversation?.flow?.step ?? "idle";
  const optedOut = contact?.optIn === "opted_out";
  const sent = step !== "idle";
  const offered = ["offering", "done"].includes(step) && sent;
  const moved = Boolean(conversation?.tags.includes("rescheduled"));

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const send = (input: { text?: string; buttonId?: string; label?: string }) => run(() => simulatorApi.customerSend(input));
  const onTap = (b: MessageButton) => void send({ buttonId: b.id, label: b.label });

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4">
      <div className="rounded-xl border bg-card p-3 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand-soft"><Smartphone className="size-4 text-primary" /></span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-sm font-semibold">Customer simulator</p>
            <p className="truncate text-xs text-muted-foreground">You are {contact?.name ?? "the patient"}. Tap buttons or type.</p>
          </div>
        </div>
        <ol className="mt-3 space-y-1.5">
          <Step n={1} done={sent} active={!sent}>Send the appointment reminder</Step>
          <Step n={2} done={offered} active={sent && !offered}>Tap <strong>Reschedule</strong> on the phone</Step>
          <Step n={3} done={moved} active={offered && !moved}>Pick a new time</Step>
        </ol>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button size="sm" disabled={busy || !ready} onClick={() => void run(simulatorApi.sendReminder)}>
            <BellRing /> Send reminder
          </Button>
          <Button size="sm" variant="outline" disabled={busy || !ready} onClick={() => void run(simulatorApi.simulateMissedCall)}>
            <PhoneMissed /> Missed call
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <PhoneFrame
          typing={typing}
          footer={
            <form
              className="flex items-center gap-2 p-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!text.trim()) return;
                void send({ text: text.trim() });
                setText("");
              }}
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={optedOut ? "Reply START to opt back in" : "Message"}
                aria-label="Type a message as the patient"
                className="h-9 min-w-0 flex-1 rounded-full border bg-muted/50 px-4 text-[13px] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
              <Button type="submit" size="icon-sm" className="rounded-full" disabled={!text.trim()} aria-label="Send as patient">
                <Send />
              </Button>
            </form>
          }
        >
          {messages ? (
            <PhoneChat messages={messages} typing={typing} onTap={onTap} />
          ) : (
            <div className="space-y-3 p-4"><Skeleton className="h-16 w-3/4 rounded-2xl" /><Skeleton className="ml-auto h-8 w-1/3 rounded-2xl" /></div>
          )}
        </PhoneFrame>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5" aria-label="Suggested patient messages">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void send({ text: s })}
              className="rounded-full border bg-card px-2.5 py-1 text-[11px] text-muted-foreground transition-colors outline-none hover:border-primary hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-xs">
          <span className="text-muted-foreground">
            Reschedules by AI <strong className="text-foreground tabular-nums">{counters?.reschedulesByAi ?? "–"}</strong>
            {" · "}Reminders <strong className="text-foreground tabular-nums">{counters?.remindersSent ?? "–"}</strong>
          </span>
          <span className="flex gap-2">
            <Link href="/app/clinic/appointments" className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline">Calendar <ArrowUpRight className="size-3" /></Link>
            <Link href="/app/dashboard" className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline">Dashboard <ArrowUpRight className="size-3" /></Link>
          </span>
        </div>
      </div>
    </div>
  );
}
