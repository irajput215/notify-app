"use client";

import { CheckCheck, CornerDownRight, Lock, Sparkles, Zap } from "lucide-react";
import type { Message, StaffMember } from "@/lib/types";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { InteractiveButtons } from "./interactive-buttons";

function EventLine({ message }: { message: Message }) {
  return (
    <div className="flex justify-center py-1 animate-message-in">
      <span className="inline-flex max-w-[85%] items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-center text-xs text-muted-foreground shadow-xs">
        <Zap className="size-3 shrink-0 text-primary" />
        <span>{message.body}</span>
        <span className="shrink-0 text-muted-foreground/70">· {formatTime(message.createdAt)}</span>
      </span>
    </div>
  );
}

function NoteCard({ message, author }: { message: Message; author?: StaffMember }) {
  return (
    <div className="flex justify-end animate-message-in">
      <div className="w-full max-w-[75%] rounded-2xl border border-dashed border-note-border bg-note px-4 py-2.5 text-note-foreground">
        <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
          <Lock className="size-3" /> Internal note · only visible to staff
        </p>
        <p className="text-sm whitespace-pre-wrap">{message.body}</p>
        <p className="mt-1 text-[11px] opacity-75">{author?.name ?? "Staff"} · {formatTime(message.createdAt)}</p>
      </div>
    </div>
  );
}

export function MessageBubble({ message, author }: { message: Message; author?: StaffMember }) {
  if (message.kind === "event") return <EventLine message={message} />;
  if (message.kind === "note") return <NoteCard message={message} author={author} />;

  const inbound = message.author === "customer";
  const isAi = message.author === "ai";
  const isTemplate = message.kind === "template";

  return (
    <div className={cn("flex animate-message-in", inbound ? "justify-start" : "justify-end")}>
      <div className={cn("flex max-w-[75%] flex-col", inbound ? "items-start" : "items-end")}>
        {!inbound && (
          <div className="mb-1 flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
            {isAi && !isTemplate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-bubble-ai px-1.5 py-0.5 font-semibold text-sky-800 dark:text-sky-200">
                <Sparkles className="size-3" /> AI
              </span>
            )}
            {isTemplate && (
              <span className="inline-flex items-center gap-1 rounded-full border bg-card px-1.5 py-0.5 font-medium">
                Template · {message.templateName}
              </span>
            )}
            <span>{isAi ? (isTemplate ? "Automation" : "Notify AI") : author?.name ?? "Staff"}</span>
          </div>
        )}
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm shadow-xs",
            inbound && "rounded-tl-md border bg-bubble-in",
            !inbound && "rounded-tr-md",
            !inbound && (isAi ? "bg-bubble-ai" : "bg-bubble-out"),
          )}
        >
          {message.replyTo && (
            <p className="mb-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <CornerDownRight className="size-3" /> Tapped button
            </p>
          )}
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
          <p className={cn("mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground")}>
            {formatTime(message.createdAt)}
            {!inbound && <CheckCheck className={cn("size-3.5", message.status === "read" ? "text-sky-500" : "")} aria-label={message.status ?? "sent"} />}
          </p>
        </div>
        <InteractiveButtons buttons={message.buttons} list={message.list} className="w-full min-w-48" />
      </div>
    </div>
  );
}
