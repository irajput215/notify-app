import type { Appointment } from "@/lib/types";
import { formatLongDateTime, formatSlot } from "@/lib/format";
import { at, weekdayOffset } from "@/lib/time";
import { REMINDER_BUTTONS, reminderBody, thread, type Thread } from "./thread-builder";

const confirmFlow = (first: string, a: Appointment, practitioner: string, ago: number) => [
  { ago, author: "ai" as const, kind: "template" as const, templateName: "appointment_reminder", body: reminderBody(first, a.type, practitioner, formatSlot(a.start)), buttons: REMINDER_BUTTONS },
  { ago: ago - 6, author: "customer" as const, body: "Confirm", replyTo: { label: "Confirm", context: "appointment_reminder" } },
  { ago: ago - 6, author: "ai" as const, body: `Thanks ${first}, you're confirmed for ${formatLongDateTime(a.start)} with ${practitioner}. See you then!` },
];

/** Lighter background conversations so the inbox feels like a real day. */
export function buildExtraThreads(now: Date, appts: Record<string, Appointment>): Thread[] {
  const lucasOld = at(weekdayOffset(2, now), 9, 30, now);
  return [
    thread(now, "cv_ethan", "ct_ethan", confirmFlow("Ethan", appts.ap_ethan, "Priya Raman", 58), { tags: ["confirmed", "ai_handled"] }),
    thread(now, "cv_zoe", "ct_zoe", [
      ...confirmFlow("Zoe", appts.ap_zoe, "Hannah Lowe", 130),
      { ago: 110, author: "customer", body: "Do I need to bring anything for Pilates?" },
      { ago: 110, author: "ai", body: "Just comfortable clothes you can move in and a water bottle. We provide mats and grip socks are available at reception for $12." },
    ], { tags: ["confirmed", "ai_handled"], unread: 0 }),
    thread(now, "cv_noah", "ct_noah", confirmFlow("Noah", appts.ap_noah, "James Okafor", 150), { tags: ["confirmed", "ai_handled"] }),
    thread(now, "cv_isla", "ct_isla", [
      { ago: 60 * 20, author: "customer", body: "Hi, is it ok if I bring my 8 month old to my appointment? No one to watch him" },
      { ago: 60 * 20, author: "ai", body: "Of course, little ones are very welcome! We have a pram-friendly lift and a change table in the accessible bathroom on Level 2." },
      { ago: 60 * 19.8, author: "customer", body: "Amazing thank you!" },
    ], { tags: ["ai_handled"] }),
    thread(now, "cv_lucas", "ct_lucas", [
      { ago: 60 * 22, author: "ai", kind: "template", templateName: "appointment_reminder", body: reminderBody("Lucas", "Standard consult", "Priya Raman", formatSlot(lucasOld)), buttons: REMINDER_BUTTONS },
      { ago: 60 * 21.5, author: "customer", body: "Cancel", replyTo: { label: "Cancel", context: "appointment_reminder" } },
      { ago: 60 * 21.5, author: "ai", body: "Are you sure you'd like to cancel? You can also move it to another time.", buttons: [{ id: "cancel_yes", label: "Yes, cancel" }, { id: "reschedule", label: "Reschedule instead" }, { id: "cancel_no", label: "Keep it" }] },
      { ago: 60 * 21.4, author: "customer", body: "Yes, cancel", replyTo: { label: "Yes, cancel" } },
      { ago: 60 * 21.4, author: "ai", body: "All done, your appointment has been cancelled. We hope to see you again soon, Lucas. Just message here when you'd like to rebook." },
      { ago: 60 * 21.4, author: "system", kind: "event", body: "Appointment cancelled in Cliniko · Slot offered to waitlist (3 patients)" },
    ], { tags: ["cancelled", "ai_handled"] }),
    thread(now, "cv_sophie", "ct_sophie", [
      { ago: 60 * 21.3, author: "ai", kind: "template", templateName: "waitlist_slot_available", body: `Hi Sophie, good news! A spot has opened up with Priya Raman on ${formatSlot(lucasOld)}.\n\nWould you like it? First to reply gets it.`, buttons: [{ id: "take", label: "Yes, book me in" }, { id: "pass", label: "No thanks" }] },
      { ago: 60 * 21, author: "customer", body: "Yes, book me in", replyTo: { label: "Yes, book me in", context: "waitlist_slot_available" } },
      { ago: 60 * 21, author: "ai", body: `Great, you're booked in with Priya Raman on ${formatLongDateTime(lucasOld)}.` },
    ], { tags: ["ai_handled"] }),
    thread(now, "cv_ruby", "ct_ruby", [
      { ago: 60 * 50, author: "customer", body: "Hi, can I swap my Pilates class to the 6pm one next week?" },
      { ago: 60 * 49, author: "staff", staffId: "st_mia", body: "Hi Ruby, the 6pm class is full next week sorry, but I've added you to the waitlist and will let you know if a spot opens up." },
      { ago: 60 * 48.8, author: "customer", body: "No worries, thanks Mia" },
    ], { tags: [], assignedTo: "st_mia", aiEnabled: false }),
    thread(now, "cv_olivia", "ct_olivia", [
      { ago: 60 * 24 * 15, author: "ai", kind: "template", templateName: "appointment_reminder", body: reminderBody("Olivia", "Initial consult", "Hannah Lowe", formatSlot(at(-14, 10, 0, now))), buttons: REMINDER_BUTTONS },
      { ago: 60 * 24 * 15 - 20, author: "customer", body: "Confirm", replyTo: { label: "Confirm", context: "appointment_reminder" } },
      { ago: 60 * 24 * 15 - 20, author: "ai", body: "Thanks Olivia, you're confirmed. See you then!" },
    ], { tags: ["ai_handled"] }),
  ];
}
