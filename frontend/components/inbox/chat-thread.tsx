"use client";

import { useEffect } from "react";
import { MessagesSquare } from "lucide-react";
import { conversationsApi } from "@/lib/services";
import { useDemoStore } from "@/lib/store/demo-store";
import { useNow } from "@/lib/hooks/use-now";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ChatHeader } from "@/components/chat/chat-header";
import { Composer } from "@/components/chat/composer";
import { MessageList } from "@/components/chat/message-list";

export function ChatThread({
  conversationId,
  onBack,
  onTogglePanel,
}: {
  conversationId?: string;
  onBack: () => void;
  onTogglePanel: () => void;
}) {
  const now = useNow();
  const ready = useDemoStore((s) => s.status === "ready");
  const conversation = useDemoStore((s) => (conversationId ? s.conversations[conversationId] : undefined));
  const contact = useDemoStore((s) => (conversation ? s.contacts[conversation.contactId] : undefined));
  const unread = conversation?.unread ?? 0;

  useEffect(() => {
    if (conversationId && unread > 0) {
      const t = setTimeout(() => void conversationsApi.markRead(conversationId), 600);
      return () => clearTimeout(t);
    }
  }, [conversationId, unread]);

  if (!ready) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b p-4">
          <Skeleton className="size-9 rounded-full" />
          <div className="space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-28" /></div>
        </div>
        <div className="flex-1" />
      </div>
    );
  }

  if (!conversation || !contact) {
    return (
      <EmptyState
        className="h-full"
        icon={MessagesSquare}
        title="Select a conversation"
        description="Pick a conversation from the list, or open the simulator to message the clinic as a patient."
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChatHeader conversation={conversation} contact={contact} now={now} onBack={onBack} onTogglePanel={onTogglePanel} />
      <div className="min-h-0 flex-1 overflow-y-auto bg-chat-bg">
        <MessageList conversationId={conversation.id} />
      </div>
      <Composer key={conversation.id} conversation={conversation} contact={contact} now={now} />
    </div>
  );
}
