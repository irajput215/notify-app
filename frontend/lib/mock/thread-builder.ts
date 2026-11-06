import type { Conversation, ConversationTag, Message } from "@/lib/types";
import { minutesAgo } from "@/lib/time";

export type Step = Omit<Message, "id" | "conversationId" | "createdAt" | "kind"> & {
  ago: number;
  kind?: Message["kind"];
};

export interface Thread {
  conversation: Conversation;
  messages: Message[];
}

export function previewOf(m: Message) {
  if (m.kind === "template") return m.body.split("\n")[0];
  if (m.replyTo) return m.replyTo.label;
  return m.body;
}

/** Builds a conversation and its messages from a compact list of steps. */
export function thread(
  now: Date,
  id: string,
  contactId: string,
  steps: Step[],
  opts: Partial<Omit<Conversation, "id" | "contactId">> & { tags: ConversationTag[] },
): Thread {
  const messages: Message[] = steps.map((s, i) => {
    const { ago, kind, ...rest } = s;
    return {
      id: `${id}_m${i + 1}`,
      conversationId: id,
      kind: kind ?? "text",
      createdAt: minutesAgo(ago, now),
      status: rest.author === "customer" ? undefined : "read",
      ...rest,
    };
  });
  const visible = messages.filter((m) => m.kind !== "note" && m.kind !== "event");
  const last = visible[visible.length - 1];
  const lastCustomer = [...messages].reverse().find((m) => m.author === "customer");
  const conversation: Conversation = {
    id,
    contactId,
    unread: 0,
    aiEnabled: true,
    updatedAt: messages[messages.length - 1]?.createdAt ?? now.toISOString(),
    preview: last ? previewOf(last) : "",
    lastCustomerMessageAt: lastCustomer?.createdAt,
    ...opts,
  };
  return { conversation, messages };
}

export const REMINDER_BUTTONS = [
  { id: "confirm", label: "Confirm" },
  { id: "reschedule", label: "Reschedule" },
  { id: "cancel", label: "Cancel" },
];

export function reminderBody(first: string, type: string, practitioner: string, when: string) {
  return `Hi ${first}, this is a reminder of your ${type} with ${practitioner} at Harbourside Physio on ${when}.\n\nPlease let us know if you can make it.`;
}
