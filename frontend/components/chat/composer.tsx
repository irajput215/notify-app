"use client";

import { useState } from "react";
import { Ban, Bot, FileText, Loader2, Lock, Send, StickyNote } from "lucide-react";
import { toast } from "sonner";
import type { Contact, Conversation } from "@/lib/types";
import { conversationsApi } from "@/lib/services";
import { useDemoStore } from "@/lib/store/demo-store";
import { formatDate, windowHoursLeft } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { QuickReplies } from "./quick-replies";
import { TemplatePicker } from "./template-picker";

type Mode = "reply" | "note";

export function Composer({ conversation, contact, now }: { conversation: Conversation; contact: Contact; now: Date }) {
  const me = useDemoStore((s) => s.currentUserId);
  const [mode, setMode] = useState<Mode>("reply");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const optedOut = contact.optIn === "opted_out";
  const windowOpen = windowHoursLeft(conversation.lastCustomerMessageAt, now) !== null;
  const humanMode = !conversation.aiEnabled;
  const replyBlocked = mode === "reply" && (optedOut || !windowOpen);
  const first = contact.name.split(" ")[0];

  async function submit() {
    const body = text.trim();
    if (!body || sending || replyBlocked) return;
    setSending(true);
    try {
      if (mode === "note") await conversationsApi.addNote(conversation.id, me, body);
      else await conversationsApi.sendStaffMessage(conversation.id, me, body);
      setText("");
    } catch (e) {
      toast.error("Message not sent", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setSending(false);
    }
  }

  async function toggleTakeover(human: boolean) {
    await conversationsApi.setAiEnabled(conversation.id, me, !human);
    toast.success(human ? "You're now handling this conversation" : "Handed back to the AI");
  }

  return (
    <div className="@container shrink-0 border-t bg-card">
      {!optedOut && (
        <div className={cn("flex flex-wrap items-center gap-3 px-4 py-2 text-xs", humanMode ? "bg-muted/60" : "bg-bubble-ai/60")}>
          <span className="flex flex-1 items-center gap-1.5 text-muted-foreground">
            <Bot className="size-3.5 text-primary" />
            {humanMode ? "A team member is handling this conversation. The AI won't reply." : "Notify AI is replying to this conversation automatically."}
          </span>
          <Label htmlFor={`takeover-${conversation.id}`} className="text-xs font-medium">Take over from AI</Label>
          <Switch id={`takeover-${conversation.id}`} checked={humanMode} onCheckedChange={(v) => void toggleTakeover(v)} />
        </div>
      )}

      {optedOut && mode === "reply" ? (
        <div className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted"><Ban className="size-4 text-muted-foreground" /></span>
          <p className="flex-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{first} opted out.</span> Messages can&apos;t be sent until they reply START to opt back in.
            Opt-outs are logged for compliance{contact.lastMessageAt ? ` (last activity ${formatDate(contact.lastMessageAt)})` : ""}.
          </p>
          <Button variant="outline" size="sm" onClick={() => setMode("note")}><StickyNote /> Add internal note</Button>
        </div>
      ) : (
        <div className="p-3">
          <div className="mb-2 flex items-center gap-1" role="tablist" aria-label="Composer mode">
            {(["reply", "note"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  mode === m ? (m === "note" ? "bg-note text-note-foreground" : "bg-accent text-accent-foreground") : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "reply" ? <Send className="size-3" /> : <Lock className="size-3" />}
                {m === "reply" ? "Reply" : "Internal note"}
              </button>
            ))}
          </div>

          {replyBlocked ? (
            <div className="flex flex-col gap-3 rounded-xl border border-dashed bg-muted/40 p-4 sm:flex-row sm:items-center">
              <p className="flex-1 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">The 24-hour window has closed.</span> Send an approved template to restart the conversation. Free-form replies unlock when {first} replies.
              </p>
              <Button size="sm" onClick={() => setTemplatesOpen(true)}><FileText /> Choose template</Button>
            </div>
          ) : (
            <div className={cn("rounded-xl border transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30", mode === "note" && "border-note-border bg-note")}>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submit();
                  }
                }}
                placeholder={mode === "note" ? "Write a note for your team. The customer won't see this." : `Reply to ${first}…`}
                aria-label={mode === "note" ? "Internal note" : "Reply message"}
                className="max-h-40 min-h-12 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
              />
              <div className="flex items-center gap-1 px-2 pb-2">
                <QuickReplies disabled={mode === "note"} onPick={(b) => setText((t) => (t ? `${t} ${b}` : b))} />
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setTemplatesOpen(true)} disabled={optedOut}>
                  <FileText /> <span className="hidden @md:inline">Templates</span>
                </Button>
                <span className="ml-auto hidden text-[11px] text-muted-foreground @2xl:inline">
                  {mode === "reply" && !humanMode ? "Sending takes over from the AI" : "Enter to send · Shift+Enter for new line"}
                </span>
                <Button size="sm" onClick={() => void submit()} disabled={!text.trim() || sending} className="ml-auto @2xl:ml-2">
                  {sending ? <Loader2 className="animate-spin" /> : mode === "note" ? <StickyNote /> : <Send />}
                  {mode === "note" ? "Add note" : "Send"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <TemplatePicker
        open={templatesOpen}
        onOpenChange={setTemplatesOpen}
        firstName={first}
        onSend={async (id) => {
          try {
            await conversationsApi.sendTemplate(conversation.id, me, id);
            toast.success("Template sent");
          } catch (e) {
            toast.error("Template not sent", { description: e instanceof Error ? e.message : undefined });
          }
        }}
      />
    </div>
  );
}
