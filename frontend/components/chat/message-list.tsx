"use client";

import { useEffect, useRef } from "react";
import { MessageSquareText } from "lucide-react";
import type { Message } from "@/lib/types";
import { useDemoStore } from "@/lib/store/demo-store";
import { formatDate, isSameDay } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { MessageBubble } from "./message-bubble";
import { AiTypingBubble } from "./typing-indicator";

function dayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (isSameDay(d, now)) return "Today";
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (isSameDay(d, y)) return "Yesterday";
  return formatDate(d);
}

export function MessageList({ conversationId }: { conversationId: string }) {
  const messages = useDemoStore((s) => s.messages[conversationId]);
  const typing = useDemoStore((s) => Boolean(s.typing[conversationId]));
  const team = useDemoStore((s) => s.team);
  const loadMessages = useDemoStore((s) => s.loadMessages);
  const endRef = useRef<HTMLDivElement>(null);

  const loaded = Boolean(messages);
  useEffect(() => {
    if (!loaded) void loadMessages(conversationId);
  }, [conversationId, loaded, loadMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages?.length, typing, conversationId]);

  if (!messages) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6">
        <Skeleton className="h-14 w-2/5 rounded-2xl" />
        <Skeleton className="ml-auto h-20 w-1/2 rounded-2xl" />
        <Skeleton className="h-10 w-1/3 rounded-2xl" />
        <Skeleton className="ml-auto h-16 w-2/5 rounded-2xl" />
      </div>
    );
  }

  if (messages.length === 0) {
    return <EmptyState className="flex-1" icon={MessageSquareText} title="No messages yet" description="Send a template to start the conversation." />;
  }

  const items: ({ type: "day"; label: string; key: string } | { type: "msg"; m: Message })[] = [];
  let lastDay = "";
  for (const m of messages) {
    const label = dayLabel(m.createdAt);
    if (label !== lastDay) {
      items.push({ type: "day", label, key: `day-${m.id}` });
      lastDay = label;
    }
    items.push({ type: "msg", m });
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-5 md:px-8" aria-live="polite">
      {items.map((it) =>
        it.type === "day" ? (
          <div key={it.key} className="flex justify-center py-1">
            <span className="rounded-full bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-xs">{it.label}</span>
          </div>
        ) : (
          <MessageBubble key={it.m.id} message={it.m} author={team.find((t) => t.id === it.m.staffId)} />
        ),
      )}
      {typing && <AiTypingBubble />}
      <div ref={endRef} />
    </div>
  );
}
