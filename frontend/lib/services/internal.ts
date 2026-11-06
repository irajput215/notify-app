/**
 * Server-side helpers shared by the mock services and the mock bot.
 * They mutate the in-memory db and broadcast realtime events, the way a
 * FastAPI handler would write to Postgres and publish over a WebSocket.
 */
import type { Appointment, Contact, Conversation, ConversationTag, DashboardCounters, Message } from "@/lib/types";
import { previewOf } from "@/lib/mock/thread-builder";
import { isSameDay } from "@/lib/format";
import { uid } from "@/lib/utils";
import { emit } from "./client";
import { db, findOrThrow } from "./db";

export const getConversation = (id: string) => findOrThrow(db().conversations, id, "Conversation");
export const getContact = (id: string) => findOrThrow(db().contacts, id, "Contact");
export const getAppointment = (id: string) => db().appointments.find((a) => a.id === id);

export function patchConversation(conv: Conversation, patch: Partial<Conversation>) {
  Object.assign(conv, patch);
  emit({ type: "conversation.updated", conversation: conv });
  return conv;
}

export function patchContact(contact: Contact, patch: Partial<Contact>) {
  Object.assign(contact, patch);
  emit({ type: "contact.updated", contact });
  return contact;
}

export function patchAppointment(appt: Appointment, patch: Partial<Appointment>, historyText?: string) {
  Object.assign(appt, patch);
  if (historyText) appt.history = [...appt.history, { at: new Date().toISOString(), text: historyText }];
  emit({ type: "appointment.updated", appointment: appt });
  return appt;
}

export function addAppointment(appt: Appointment) {
  db().appointments.push(appt);
  emit({ type: "appointment.updated", appointment: appt });
  return appt;
}

export function withTags(conv: Conversation, add: ConversationTag[], remove: ConversationTag[] = []) {
  const set = new Set(conv.tags.filter((t) => !remove.includes(t)));
  add.forEach((t) => set.add(t));
  return [...set];
}

export function bumpCounters(delta: Partial<Record<keyof DashboardCounters, number>>) {
  const counters = db().counters;
  for (const [key, value] of Object.entries(delta) as [keyof DashboardCounters, number][]) {
    counters[key] += value;
  }
  emit({ type: "counters.updated", counters });
}

/** Persists a message, updates the conversation summary and broadcasts both. */
export function pushMessage(input: Omit<Message, "id" | "createdAt"> & { createdAt?: string }) {
  const now = new Date();
  const message: Message = {
    id: uid("msg"),
    createdAt: now.toISOString(),
    status: input.author === "customer" ? undefined : "delivered",
    ...input,
  };
  db().messages.push(message);
  emit({ type: "message.created", message });

  const conv = getConversation(message.conversationId);
  const patch: Partial<Conversation> = { updatedAt: message.createdAt };
  if (message.kind !== "note" && message.kind !== "event") patch.preview = previewOf(message);
  if (message.author === "customer") {
    patch.lastCustomerMessageAt = message.createdAt;
    patch.unread = conv.unread + 1;
  }
  if (!isSameDay(new Date(conv.updatedAt), now)) bumpCounters({ conversationsToday: 1 });
  patchConversation(conv, patch);

  if (patch.preview) {
    patchContact(getContact(conv.contactId), { lastMessageAt: message.createdAt, lastMessagePreview: patch.preview });
  }
  return message;
}

export function systemEvent(conversationId: string, body: string) {
  return pushMessage({ conversationId, author: "system", kind: "event", body });
}
