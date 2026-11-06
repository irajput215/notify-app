/**
 * Mock conversational engine: reacts to inbound customer messages the way
 * the real backend would (webhook → intent → reply + Cliniko updates).
 */
import type { Appointment, Conversation, MessageButton } from "@/lib/types";
import { formatLongDateTime, formatSlot } from "@/lib/format";
import { practitioners } from "@/lib/mock/workspace";
import { uid } from "@/lib/utils";
import { emit, sleep } from "./client";
import { db } from "./db";
import { classify, CLINICAL_HOLDING_REPLY, UNSURE_REPLY, type CustomerInput, type Intent } from "./intent";
import {
  addAppointment, bumpCounters, getAppointment, getContact, getConversation, patchAppointment,
  patchContact, patchConversation, pushMessage, systemEvent, withTags,
} from "./internal";
import { findSlots, slotStartFromId, type DayPreference } from "./slots";

const practitionerName = (id: string) => practitioners.find((p) => p.id === id)?.name ?? "your practitioner";

async function aiSay(conv: Conversation, body: string, buttons?: MessageButton[]) {
  emit({ type: "typing", conversationId: conv.id, isTyping: true });
  await sleep(850 + Math.random() * 500);
  emit({ type: "typing", conversationId: conv.id, isTyping: false });
  return pushMessage({ conversationId: conv.id, author: "ai", kind: "text", body, buttons });
}

function activeAppointment(conv: Conversation): Appointment | undefined {
  const byFlow = conv.flow?.appointmentId ? getAppointment(conv.flow.appointmentId) : undefined;
  if (byFlow && byFlow.status !== "cancelled") return byFlow;
  const now = Date.now();
  return db()
    .appointments.filter((a) => a.contactId === conv.contactId && a.status !== "cancelled" && new Date(a.start).getTime() > now)
    .sort((a, b) => a.start.localeCompare(b.start))[0];
}

async function offerSlots(conv: Conversation, first: string, appt: Appointment | undefined, day: DayPreference, isNew: boolean) {
  const practitionerId = appt?.practitionerId ?? conv.flow?.practitionerId ?? "pr_hannah";
  const slots = findSlots(practitionerId, { day, ignoreId: appt?.id });
  patchConversation(conv, { flow: { ...conv.flow, step: "offering", appointmentId: isNew ? undefined : appt?.id, practitionerId } });
  if (!slots.length) {
    await aiSay(conv, `Sorry ${first}, ${practitionerName(practitionerId)} is fully booked ${day === "friday" ? "on Friday" : day === "tomorrow" ? "tomorrow" : "this week"}. I've let the front desk know and they'll find you a time.`);
    patchConversation(conv, { tags: withTags(conv, ["needs_human"]) });
    return;
  }
  const dayText = day === "friday" ? " on Friday" : day === "tomorrow" ? " tomorrow" : "";
  const lead = isNew ? `Let's get you booked in, ${first}.` : `No problem, ${first}.`;
  await aiSay(
    conv,
    `${lead} Here are the available times${dayText} with ${practitionerName(practitionerId)}. Tap one to ${isNew ? "book" : "move your appointment"}.`,
    slots.map((s) => ({ id: s.id, label: formatSlot(s.start) })),
  );
}

async function pickSlot(conv: Conversation, first: string, slotId: string) {
  const start = slotStartFromId(slotId);
  if (!start) return;
  const existing = conv.flow?.appointmentId ? getAppointment(conv.flow.appointmentId) : undefined;
  const contact = getContact(conv.contactId);
  if (existing && existing.status !== "cancelled") {
    const from = existing.start;
    patchAppointment(existing, { start, status: "rescheduled", movedAt: new Date().toISOString() }, `Rescheduled by patient via WhatsApp: ${formatSlot(from)} → ${formatSlot(start)}`);
    await aiSay(conv, `Done! Your appointment is now ${formatLongDateTime(start)} with ${practitionerName(existing.practitionerId)}. You'll get a reminder the day before.`);
    systemEvent(conv.id, `Appointment moved in Cliniko: ${formatSlot(from)} → ${formatSlot(start)}`);
    bumpCounters({ reschedulesByAi: 1, aiHandled: 1 });
    patchConversation(conv, { tags: withTags(conv, ["rescheduled", "ai_handled"], ["needs_human"]), flow: { ...conv.flow, step: "done" } });
    emit({ type: "toast", title: "Appointment moved in Cliniko", description: `${contact.name} → ${formatSlot(start)} with ${practitionerName(existing.practitionerId)}`, variant: "success" });
    return;
  }
  const practitionerId = conv.flow?.practitionerId ?? "pr_hannah";
  const appt = addAppointment({
    id: uid("ap"), contactId: contact.id, patientName: contact.name, practitionerId, start, durationMin: 30,
    type: "Standard consult", status: "confirmed", movedAt: new Date().toISOString(),
    history: [{ at: new Date().toISOString(), text: "Booked by patient via WhatsApp" }],
  });
  await aiSay(conv, `You're booked in with ${practitionerName(practitionerId)} on ${formatLongDateTime(start)}. We'll send a reminder the day before.`);
  systemEvent(conv.id, "New appointment created in Cliniko");
  const fromMissedCall = conv.flow?.origin === "missed_call";
  bumpCounters({ aiHandled: 1, ...(fromMissedCall ? { missedCallsRecovered: 1 } : {}) });
  patchConversation(conv, { tags: withTags(conv, ["ai_handled"], ["needs_human"]), flow: { step: "done", appointmentId: appt.id, practitionerId } });
  emit({ type: "toast", title: "New appointment created in Cliniko", description: `${contact.name} · ${formatSlot(start)}`, variant: "success" });
}

async function escalate(conv: Conversation, first: string, matched: string[]) {
  await aiSay(conv, CLINICAL_HOLDING_REPLY(first));
  systemEvent(conv.id, `Escalated to team: possible clinical question (matched ${matched.map((m) => `“${m}”`).join(", ")}). AI paused for this conversation.`);
  bumpCounters({ humanHandled: 1 });
  patchConversation(conv, { tags: withTags(conv, ["needs_human"], ["ai_handled"]), aiEnabled: false });
  emit({ type: "toast", title: "Needs human", description: `${getContact(conv.contactId).name} asked something clinical. The AI did not advise.`, variant: "warning" });
}

async function respond(conv: Conversation, intent: Intent, first: string) {
  const appt = activeAppointment(conv);
  const step = conv.flow?.step;
  switch (intent.kind) {
    case "confirm":
      if (!appt) return aiSay(conv, `Thanks ${first}! I can't see an upcoming appointment for you. Would you like to book one?`, [{ id: "book", label: "Book an appointment" }]);
      patchAppointment(appt, { status: "confirmed" }, "Confirmed by patient via WhatsApp");
      await aiSay(conv, `Thanks ${first}, you're confirmed for ${formatLongDateTime(appt.start)} with ${practitionerName(appt.practitionerId)}. See you then!`);
      bumpCounters({ confirmations: 1, aiHandled: 1 });
      patchConversation(conv, { tags: withTags(conv, ["confirmed", "ai_handled"]), flow: { ...conv.flow, step: "done" } });
      emit({ type: "toast", title: "Appointment confirmed in Cliniko", description: `${getContact(conv.contactId).name} · ${formatSlot(appt.start)}`, variant: "success" });
      return;
    case "reschedule":
      return offerSlots(conv, first, appt, intent.day, !appt);
    case "book":
      return offerSlots(conv, first, undefined, intent.day, true);
    case "pick_slot":
      return pickSlot(conv, first, intent.slotId);
    case "cancel_request":
      if (!appt) return aiSay(conv, `I can't see an upcoming appointment to cancel, ${first}. Is there anything else I can help with?`);
      patchConversation(conv, { flow: { ...conv.flow, step: "cancel_confirm", appointmentId: appt.id } });
      return aiSay(conv, `Are you sure you'd like to cancel your appointment on ${formatSlot(appt.start)}? You can also move it to another time.`, [
        { id: "cancel_yes", label: "Yes, cancel" }, { id: "reschedule", label: "Reschedule instead" }, { id: "cancel_no", label: "Keep it" },
      ]);
    case "cancel_yes":
      if (!appt) return;
      patchAppointment(appt, { status: "cancelled" }, "Cancelled by patient via WhatsApp · offered to waitlist");
      await aiSay(conv, `All done, your appointment has been cancelled. We hope to see you again soon, ${first}. Just message here when you'd like to rebook.`);
      systemEvent(conv.id, "Appointment cancelled in Cliniko · Slot offered to waitlist (3 patients)");
      bumpCounters({ aiHandled: 1 });
      patchConversation(conv, { tags: withTags(conv, ["cancelled", "ai_handled"], ["confirmed"]), flow: { ...conv.flow, step: "done" } });
      emit({ type: "toast", title: "Appointment cancelled in Cliniko", description: "Waitlist fill started for the free slot", variant: "info" });
      return;
    case "cancel_no":
      patchConversation(conv, { flow: { ...conv.flow, step: "done" } });
      return aiSay(conv, `No problem, your appointment ${appt ? `on ${formatSlot(appt.start)} ` : ""}stays as it is. See you then!`);
    case "yes":
      if (step === "reminder") return respond(conv, { kind: "confirm" }, first);
      if (step === "cancel_confirm") return respond(conv, { kind: "cancel_yes" }, first);
      return aiSay(conv, "Great! What can I help you with?");
    case "no":
      if (step === "cancel_confirm") return respond(conv, { kind: "cancel_no" }, first);
      return aiSay(conv, "No worries. Let me know if there's anything else I can help with.");
    case "escalate":
      return escalate(conv, first, intent.matched);
    case "faq":
      await aiSay(conv, intent.faq.answer);
      patchConversation(conv, { tags: withTags(conv, ["ai_handled"]) });
      return;
    case "greeting":
      if (appt) {
        return aiSay(conv, `Hi ${first}! I'm the Harbourside Physio assistant. Your next appointment is ${formatLongDateTime(appt.start)} with ${practitionerName(appt.practitionerId)}. How can I help?`, [
          { id: "confirm", label: "Confirm" }, { id: "reschedule", label: "Reschedule" }, { id: "cancel", label: "Cancel" },
        ]);
      }
      return aiSay(conv, `Hi ${first}! I'm the Harbourside Physio assistant. I can help you book an appointment or answer questions about the clinic.`, [{ id: "book", label: "Book an appointment" }]);
    case "thanks":
      return aiSay(conv, `You're welcome, ${first}! Anything else, just message here.`);
    case "unknown":
    default:
      if (db().ai.escalateWhenUnsure) {
        await aiSay(conv, UNSURE_REPLY);
        bumpCounters({ humanHandled: 1 });
        patchConversation(conv, { tags: withTags(conv, ["needs_human"], ["ai_handled"]) });
        return;
      }
      return aiSay(conv, "Sorry, I didn't quite get that. You can ask about bookings, fees, parking or opening hours.");
  }
}

/** Entry point for an inbound customer message (the WhatsApp webhook in production). */
export async function handleCustomerMessage(conversationId: string, input: CustomerInput) {
  const conv = getConversation(conversationId);
  const contact = getContact(conv.contactId);
  const first = contact.name.split(" ")[0];
  pushMessage({
    conversationId,
    author: "customer",
    kind: "text",
    body: input.text ?? input.label ?? "",
    replyTo: input.buttonId ? { label: input.label ?? "" } : undefined,
  });

  const intent = classify(input, db().ai);
  if (intent.kind === "opt_out") {
    patchContact(contact, { optIn: "opted_out" });
    patchConversation(conv, { tags: withTags(conv, ["opted_out"], ["needs_human"]) });
    await aiSay(conv, "You've been unsubscribed from Harbourside Physio messages. You can reply START at any time to opt back in.");
    systemEvent(conv.id, "Contact opted out. Marketing and automated messages are now blocked.");
    emit({ type: "toast", title: "Contact opted out", description: `${contact.name} replied STOP. Messaging is now disabled.`, variant: "info" });
    return;
  }
  if (intent.kind === "opt_in" && contact.optIn === "opted_out") {
    patchContact(contact, { optIn: "opted_in", optInAt: new Date().toISOString(), optInSource: "Replied START on WhatsApp" });
    patchConversation(conv, { tags: withTags(conv, [], ["opted_out"]) });
    await aiSay(conv, `Welcome back, ${first}! You'll receive messages from Harbourside Physio again.`);
    return;
  }
  if (contact.optIn === "opted_out") return;
  if (!conv.aiEnabled) {
    patchConversation(conv, { tags: withTags(conv, ["needs_human"], ["ai_handled"]) });
    return;
  }
  await respond(conv, intent, first);
}
