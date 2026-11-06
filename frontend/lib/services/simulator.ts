/**
 * Demo-only controls that stand in for real-world events: a patient's phone
 * receiving a reminder, a missed call, a patient typing a reply.
 */
import { formatSlot } from "@/lib/format";
import { REMINDER_BUTTONS, reminderBody } from "@/lib/mock/thread-builder";
import { practitioners } from "@/lib/mock/workspace";
import { request } from "./client";
import { handleCustomerMessage } from "./bot";
import type { CustomerInput } from "./intent";
import { bumpCounters, getAppointment, getContact, getConversation, patchConversation, pushMessage, systemEvent } from "./internal";

export const SIMULATOR_CONVERSATION_ID = "cv_olivia";
export const SIMULATOR_APPOINTMENT_ID = "ap_olivia";

/** Fires the 24h reminder automation for the demo patient. */
export const sendReminder = () =>
  request(() => {
    const conv = getConversation(SIMULATOR_CONVERSATION_ID);
    const contact = getContact(conv.contactId);
    const appt = getAppointment(SIMULATOR_APPOINTMENT_ID);
    if (!appt) throw new Error("Demo appointment missing");
    const practitioner = practitioners.find((p) => p.id === appt.practitionerId)?.name ?? "";
    patchConversation(conv, { flow: { step: "reminder", appointmentId: appt.id, practitionerId: appt.practitionerId }, aiEnabled: true });
    bumpCounters({ remindersSent: 1 });
    return pushMessage({
      conversationId: conv.id, author: "ai", kind: "template", templateName: "appointment_reminder",
      body: reminderBody(contact.name.split(" ")[0], appt.type, practitioner, formatSlot(appt.start)),
      buttons: REMINDER_BUTTONS,
    });
  }, 300);

/** Simulates an unanswered call followed by the automatic text-back. */
export const simulateMissedCall = () =>
  request(() => {
    const conv = getConversation(SIMULATOR_CONVERSATION_ID);
    const contact = getContact(conv.contactId);
    systemEvent(conv.id, `Missed call from ${contact.phone.replace(/^\+61(\d{3})(\d{3})(\d{3})$/, "+61 $1 $2 $3")} · SMS text-back sent and WhatsApp follow-up started`);
    patchConversation(conv, { flow: { step: "missed_call", origin: "missed_call", practitionerId: "pr_hannah" }, aiEnabled: true });
    return pushMessage({
      conversationId: conv.id, author: "ai", kind: "template", templateName: "missed_call_textback",
      body: "Hi, sorry we missed your call to Harbourside Physio! We're with patients right now.\n\nReply here to book, reschedule or ask a question and we'll get straight back to you.",
      buttons: [{ id: "book", label: "Book an appointment" }],
    });
  }, 300);

/** The patient sends a message or taps a button on their phone. */
export async function customerSend(input: CustomerInput) {
  await request(() => true, 150);
  void handleCustomerMessage(SIMULATOR_CONVERSATION_ID, input);
}

