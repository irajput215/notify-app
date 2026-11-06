"use client";

import { ArrowLeft, CheckCircle2, PanelRight, UserRound } from "lucide-react";
import { toast } from "sonner";
import type { Contact, Conversation } from "@/lib/types";
import { conversationsApi } from "@/lib/services";
import { useDemoStore } from "@/lib/store/demo-store";
import { formatPhone } from "@/lib/format";
import { initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContactAvatar } from "@/components/shared/contact-avatar";
import { ConversationTagBadge } from "@/components/shared/conversation-tag";
import { WindowIndicator } from "./window-indicator";

export function ChatHeader({
  conversation,
  contact,
  now,
  onBack,
  onTogglePanel,
}: {
  conversation: Conversation;
  contact: Contact;
  now: Date;
  onBack: () => void;
  onTogglePanel: () => void;
}) {
  const team = useDemoStore((s) => s.team);
  const assignee = team.find((t) => t.id === conversation.assignedTo);
  const needsHuman = conversation.tags.includes("needs_human");

  return (
    <div className="@container shrink-0 space-y-2 border-b bg-card px-4 py-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={onBack} aria-label="Back to conversations">
          <ArrowLeft />
        </Button>
        <ContactAvatar name={contact.name} className="size-9" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold">{contact.name}</h2>
          <p className="truncate text-xs whitespace-nowrap text-muted-foreground">{formatPhone(contact.phone)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" aria-label="Assign conversation">
              {assignee ? (
                <span className={`flex size-5 items-center justify-center rounded-full text-[9px] font-semibold ${assignee.avatarClass}`}>{initials(assignee.name)}</span>
              ) : (
                <UserRound />
              )}
              <span className="hidden @lg:inline">{assignee ? assignee.name.split(" ")[0] : "Assign"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Assign to</DropdownMenuLabel>
            {team.map((t) => (
              <DropdownMenuCheckboxItem
                key={t.id}
                checked={t.id === conversation.assignedTo}
                onCheckedChange={() => void conversationsApi.assignConversation(conversation.id, t.id).then(() => toast.success(`Assigned to ${t.name}`))}
              >
                {t.name} <span className="ml-auto text-xs text-muted-foreground">{t.title.split(" ")[0]}</span>
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={!conversation.assignedTo} onCheckedChange={() => void conversationsApi.assignConversation(conversation.id, undefined)}>
              Unassigned
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {needsHuman && (
          <Button size="sm" variant="outline" onClick={() => void conversationsApi.resolveConversation(conversation.id).then(() => toast.success("Marked as resolved"))}>
            <CheckCircle2 /> <span className="hidden @lg:inline">Resolve</span>
          </Button>
        )}
        <Button variant="ghost" size="icon-sm" className="xl:hidden" onClick={onTogglePanel} aria-label="Show contact details">
          <PanelRight />
        </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <WindowIndicator lastCustomerMessageAt={conversation.lastCustomerMessageAt} now={now} />
        {conversation.tags.map((t) => <ConversationTagBadge key={t} tag={t} />)}
      </div>
    </div>
  );
}
