import type { Appointment } from "@/lib/types";
import { formatLongDateTime, formatSlot } from "@/lib/format";
import { at, weekdayOffset } from "@/lib/time";
import { REMINDER_BUTTONS, reminderBody, thread, type Thread } from "./thread-builder";

/** The seven pre-loaded demo stories (a–g) from the product brief. */
export function buildScriptedThreads(now: Date, appts: Record<string, Appointment>): Thread[] {
  const liam = appts.ap_liam;
  const liamOriginal = at(weekdayOffset(1, now), 10, 0, now);
  const liamAlt1 = at(weekdayOffset(1, now), 15, 30, now);
  const liamAlt2 = at(weekdayOffset(5, now), 11, 0, now);
  const tom = appts.ap_tom;
  const tomAlt1 = at(weekdayOffset(1, now), 17, 0, now);
  const tomAlt2 = at(weekdayOffset(3, now), 8, 30, now);

  return [
    // a) Reminder → Reschedule → picks Thu 2:30pm → confirmed
    thread(now, "cv_liam", "ct_liam", [
      { ago: 96, author: "ai", kind: "template", templateName: "appointment_reminder", body: reminderBody("Liam", "Follow-up", "James Okafor", formatSlot(liamOriginal)), buttons: REMINDER_BUTTONS },
      { ago: 81, author: "customer", body: "Reschedule", replyTo: { label: "Reschedule", context: "appointment_reminder" } },
      {
        ago: 81, author: "ai", body: "No problem, Liam. Here are the next available times with James. Tap one to move your appointment.",
        buttons: [
          { id: "slot_a", label: formatSlot(liamAlt1) },
          { id: "slot_b", label: formatSlot(liam.start) },
          { id: "slot_c", label: formatSlot(liamAlt2) },
        ],
      },
      { ago: 79, author: "customer", body: formatSlot(liam.start), replyTo: { label: formatSlot(liam.start), context: "Available times" } },
      { ago: 79, author: "ai", body: `Done! Your appointment is now ${formatLongDateTime(liam.start)} with James Okafor. You'll get a reminder the day before.` },
      { ago: 79, author: "system", kind: "event", body: `Appointment moved in Cliniko: ${formatSlot(liamOriginal)} → ${formatSlot(liam.start)}` },
      { ago: 78, author: "customer", body: "Thanks heaps 👍" },
    ], { tags: ["rescheduled", "ai_handled"] }),

    // b) Parking question answered from the FAQ
    thread(now, "cv_grace", "ct_grace", [
      { ago: 42, author: "customer", body: "Hi! Is there parking at the clinic? Haven't been to this location before" },
      { ago: 42, author: "ai", body: "Hi Grace! Yes, there's free 2-hour parking in the Riverbank Lane car park directly behind our building. We're on Level 2 and there's lift access from the car park. Street parking is also available on Riverbank Lane." },
      { ago: 39, author: "customer", body: "Perfect, thank you" },
      { ago: 39, author: "ai", body: `You're welcome! See you on ${formatSlot(appts.ap_grace.start)}.` },
    ], { tags: ["ai_handled"], unread: 0 }),

    // c) Missed call → auto text → books a new appointment
    thread(now, "cv_tom", "ct_tom", [
      { ago: 190, author: "system", kind: "event", body: "Missed call from +61 491 570 159 · SMS text-back sent and WhatsApp follow-up started" },
      { ago: 189, author: "ai", kind: "template", templateName: "missed_call_textback", body: "Hi, sorry we missed your call to Harbourside Physio! We're with patients right now.\n\nReply here to book, reschedule or ask a question and we'll get straight back to you." },
      { ago: 184, author: "customer", body: "Hi yes I was trying to book in, my back's playing up again. Got anything this week?" },
      {
        ago: 184, author: "ai", body: "Thanks Tom, let's get you in. Here are the next available times for a Standard consult. Tap one to book:",
        buttons: [
          { id: "slot_a", label: formatSlot(tomAlt1) },
          { id: "slot_b", label: formatSlot(tom.start) },
          { id: "slot_c", label: formatSlot(tomAlt2) },
        ],
      },
      { ago: 181, author: "customer", body: formatSlot(tom.start), replyTo: { label: formatSlot(tom.start), context: "Available times" } },
      { ago: 181, author: "ai", body: `You're booked in with Priya Raman on ${formatLongDateTime(tom.start)}. We'll send a reminder the day before. Reply here any time if you need to change it.` },
      { ago: 181, author: "system", kind: "event", body: "New appointment created in Cliniko" },
    ], { tags: ["missed_call", "ai_handled"] }),

    // d) New patient describes knee pain → summary saved to notes
    thread(now, "cv_aisha", "ct_aisha", [
      { ago: 320, author: "ai", kind: "template", templateName: "pre_visit_description", body: `Hi Aisha, welcome to Harbourside Physio! Before your Initial consult on ${formatSlot(appts.ap_aisha.start)}, could you tell us briefly what's brought you in? It helps your physio prepare.\n\nPlease don't send anything urgent here. In an emergency call 000.` },
      { ago: 301, author: "customer", body: appts.ap_aisha.description?.original ?? "" },
      { ago: 301, author: "ai", body: "Thanks Aisha, that's really helpful. I've added this to your appointment notes for Hannah. If anything changes before your visit, just let us know here." },
      { ago: 301, author: "system", kind: "event", body: "Pre-visit summary saved to appointment notes in Cliniko" },
    ], { tags: ["new_contact", "ai_handled"] }),

    // e) Pain got worse → AI does not advise, escalates to a human
    thread(now, "cv_michael", "ct_michael", [
      { ago: 21, author: "customer", body: "My pain got much worse after yesterday. Is that normal? Should I ice it or keep doing the exercises?" },
      { ago: 21, author: "ai", body: "I'm sorry to hear that, Michael. I'm not able to give medical advice over message, so I've passed this to our clinical team and a team member will reply to you shortly.\n\nIf the pain is severe or you're worried, please call us on (02) 5550 4321, or 000 in an emergency." },
      { ago: 21, author: "system", kind: "event", body: "Escalated to team: possible clinical question (matched “pain”, “worse”). AI paused for this conversation." },
      { ago: 12, author: "staff", staffId: "st_mia", kind: "note", body: "James is with a patient until 11:30. I'll ask him to call Michael straight after. Flagged as priority." },
    ], { tags: ["needs_human"], unread: 1, aiEnabled: false, assignedTo: "st_mia" }),

    // f) Patient replies STOP → opted out
    thread(now, "cv_daniel", "ct_daniel", [
      { ago: 60 * 50, author: "ai", kind: "template", templateName: "winter_wellness_checkin", body: "Hi Daniel, it's been a while! Winter is a great time to get on top of niggles before they become injuries.\n\nBook a check-in this month and we'll include a free take-home exercise plan." , buttons: [{ id: "book", label: "Book a check-in" }, { id: "no_thanks", label: "Not now" }] },
      { ago: 60 * 49, author: "customer", body: "STOP" },
      { ago: 60 * 49, author: "ai", body: "You've been unsubscribed from Harbourside Physio messages. You can reply START at any time to opt back in." },
      { ago: 60 * 49, author: "system", kind: "event", body: "Contact opted out. Marketing and automated messages are now blocked." },
    ], { tags: ["opted_out"] }),

    // g) Fees enquiry answered by a receptionist
    thread(now, "cv_chloe", "ct_chloe", [
      { ago: 68, author: "customer", body: "Hi, what are your fees for an initial consult? And can I claim with my health fund on the spot?" },
      { ago: 66, author: "system", kind: "event", body: "Sam Nguyen took over from AI" },
      { ago: 64, author: "staff", staffId: "st_sam", body: "Hi Chloe, thanks for getting in touch! An initial consult is $115 (45 min) and standard consults are $98. We have HICAPS, so you can claim with your health fund on the spot and just pay the gap." },
      { ago: 63, author: "staff", staffId: "st_sam", body: "Would you like me to find you a time this week?" },
      { ago: 51, author: "customer", body: "That's great, I'll check my calendar and get back to you. Thanks Sam!" },
      { ago: 50, author: "staff", staffId: "st_sam", kind: "note", body: "New patient lead from Google search. Follow up Friday if no reply." },
    ], { tags: ["new_contact"], aiEnabled: false, assignedTo: "st_sam" }),
  ];
}
