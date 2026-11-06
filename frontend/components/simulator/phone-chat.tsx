"use client";

import { useEffect, useRef } from "react";
import type { Message, MessageButton } from "@/lib/types";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { InteractiveButtons } from "@/components/chat/interactive-buttons";
import { TypingDots } from "@/components/chat/typing-indicator";

/** The patient's view of the conversation: business on the left, patient on the right. */
export function PhoneChat({
  messages,
  typing,
  onTap,
}: {
  messages: Message[];
  typing: boolean;
  onTap: (b: MessageButton) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const visible = messages.filter((m) => m.kind !== "note" && m.kind !== "event");
  const lastCustomerIdx = visible.map((m) => m.author).lastIndexOf("customer");

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [visible.length, typing]);

  return (
    <div className="flex flex-col gap-2 px-3 py-4">
      {visible.map((m, i) => {
        const mine = m.author === "customer";
        const tappable = !mine && Boolean(m.buttons?.length) && i > lastCustomerIdx;
        const answer = !mine && m.buttons?.length ? visible.slice(i + 1).find((x) => x.author === "customer")?.replyTo?.label : undefined;
        return (
          <div key={m.id} className={cn("flex animate-message-in", mine ? "justify-end" : "justify-start")}>
            <div className={cn("flex max-w-[85%] flex-col", mine ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "rounded-2xl px-3 py-1.5 text-[13px] leading-snug shadow-xs",
                  mine ? "rounded-tr-md bg-bubble-out" : "rounded-tl-md bg-bubble-in",
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className="mt-0.5 text-right text-[10px] text-muted-foreground">{formatTime(m.createdAt)}</p>
              </div>
              <InteractiveButtons
                buttons={m.buttons}
                onTap={tappable ? onTap : undefined}
                usedLabel={answer}
                className={cn("w-full", !tappable && "opacity-70")}
              />
            </div>
          </div>
        );
      })}
      {typing && (
        <div className="flex justify-start animate-message-in">
          <span className="rounded-2xl rounded-tl-md bg-bubble-in px-3 py-2.5 text-muted-foreground shadow-xs"><TypingDots /></span>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
