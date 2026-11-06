"use client";

import type { Contact, Conversation } from "@/lib/types";
import { formatListTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ContactAvatar } from "@/components/shared/contact-avatar";
import { ConversationTagBadge } from "@/components/shared/conversation-tag";

export function ConversationItem({
  conversation,
  contact,
  selected,
  typing,
  now,
  onSelect,
}: {
  conversation: Conversation;
  contact: Contact;
  selected: boolean;
  typing: boolean;
  now: Date;
  onSelect: () => void;
}) {
  const unread = conversation.unread > 0;
  const tags = [...conversation.tags].sort((a) => (a === "needs_human" ? -1 : 0));
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "relative flex w-full gap-3 rounded-xl px-3 py-3 text-left transition-colors outline-none hover:bg-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/50",
        selected && "bg-accent hover:bg-accent",
      )}
    >
      <ContactAvatar name={contact.name} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className={cn("flex-1 truncate text-sm", unread ? "font-semibold" : "font-medium")}>{contact.name}</span>
          <span className={cn("shrink-0 text-xs", unread ? "font-medium text-primary" : "text-muted-foreground")}>
            {formatListTime(conversation.updatedAt, now)}
          </span>
        </span>
        <span className="mt-0.5 flex items-center gap-2">
          <span className={cn("flex-1 truncate text-[13px]", unread ? "text-foreground" : "text-muted-foreground")}>
            {typing ? <span className="text-primary italic">typing…</span> : conversation.preview}
          </span>
          {unread && (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground" aria-label={`${conversation.unread} unread`}>
              {conversation.unread}
            </span>
          )}
        </span>
        {tags.length > 0 && (
          <span className="mt-2 flex flex-wrap gap-1">
            {tags.slice(0, 2).map((t) => <ConversationTagBadge key={t} tag={t} />)}
            {tags.length > 2 && <span className="text-xs text-muted-foreground">+{tags.length - 2}</span>}
          </span>
        )}
      </span>
    </button>
  );
}
