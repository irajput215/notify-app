import type { MessageTemplate } from "@/lib/types";
import { daysAgo } from "@/lib/time";

export function buildTemplates(now: Date): MessageTemplate[] {
  return [
    {
      id: "tp_reminder", name: "appointment_reminder", category: "Utility", status: "Approved", language: "English (AU)",
      body: "Hi {{1}}, this is a reminder of your {{2}} with {{3}} at Harbourside Physio on {{4}}.\n\nPlease let us know if you can make it.",
      footer: "Reply STOP to opt out",
      buttons: [{ type: "quick_reply", label: "Confirm" }, { type: "quick_reply", label: "Reschedule" }, { type: "quick_reply", label: "Cancel" }],
      samples: ["Olivia", "Standard consult", "Hannah Lowe", "Thu 12/11, 10am"], updatedAt: daysAgo(40, now),
    },
    {
      id: "tp_missed", name: "missed_call_textback", category: "Utility", status: "Approved", language: "English (AU)",
      body: "Hi, sorry we missed your call to {{1}}! We're with patients right now.\n\nReply here to book, reschedule or ask a question and we'll get straight back to you.",
      buttons: [{ type: "quick_reply", label: "Book an appointment" }, { type: "phone", label: "Call us", value: "(02) 5550 4321" }],
      samples: ["Harbourside Physio"], updatedAt: daysAgo(38, now),
    },
    {
      id: "tp_previsit", name: "pre_visit_description", category: "Utility", status: "Approved", language: "English (AU)",
      body: "Hi {{1}}, welcome to Harbourside Physio! Before your {{2}} on {{3}}, could you tell us briefly what's brought you in? It helps your physio prepare.\n\nPlease don't send anything urgent here. In an emergency call 000.",
      buttons: [],
      samples: ["Aisha", "Initial consult", "Mon 09/11, 3pm"], updatedAt: daysAgo(30, now),
    },
    {
      id: "tp_waitlist", name: "waitlist_slot_available", category: "Utility", status: "Approved", language: "English (AU)",
      body: "Hi {{1}}, good news! A spot has opened up with {{2}} on {{3}}.\n\nWould you like it? First to reply gets it.",
      buttons: [{ type: "quick_reply", label: "Yes, book me in" }, { type: "quick_reply", label: "No thanks" }],
      samples: ["Sophie", "Priya Raman", "Tue 10/11, 9:30am"], updatedAt: daysAgo(21, now),
    },
    {
      id: "tp_feedback", name: "post_visit_feedback", category: "Utility", status: "Approved", language: "English (AU)",
      body: "Thanks for visiting us today, {{1}}. How was your appointment with {{2}}?\n\nYour reply goes privately to our team.",
      buttons: [{ type: "quick_reply", label: "Great" }, { type: "quick_reply", label: "Okay" }, { type: "quick_reply", label: "Not great" }],
      samples: ["Grace", "Priya"], updatedAt: daysAgo(19, now),
    },
    {
      id: "tp_winter", name: "winter_wellness_checkin", category: "Marketing", status: "Approved", language: "English (AU)",
      header: "Winter check-in",
      body: "Hi {{1}}, it's been a while! Winter is a great time to get on top of niggles before they become injuries.\n\nBook a check-in this month and we'll include a free take-home exercise plan.",
      footer: "Reply STOP to opt out",
      buttons: [{ type: "quick_reply", label: "Book a check-in" }, { type: "quick_reply", label: "Not now" }],
      samples: ["Daniel"], updatedAt: daysAgo(60, now),
    },
    {
      id: "tp_pilates", name: "pilates_new_classes", category: "Marketing", status: "Pending", language: "English (AU)",
      header: "New Pilates times",
      body: "Hi {{1}}, we've added new Clinical Pilates classes on {{2}}. Spots are limited to 4 per class.\n\nWant us to hold one for you?",
      footer: "Reply STOP to opt out",
      buttons: [{ type: "quick_reply", label: "Hold a spot" }, { type: "url", label: "See timetable", value: "https://harbourside-physio.example/pilates" }],
      samples: ["Zoe", "Tuesday and Thursday evenings"], updatedAt: daysAgo(1, now),
    },
    {
      id: "tp_promo", name: "spring_discount_offer", category: "Marketing", status: "Rejected", language: "English (AU)",
      rejectionReason: "Promotional content must not be misleading. Claims like “guaranteed pain-free” are not permitted. Edit the copy and resubmit.",
      body: "Hi {{1}}! Get 30% off your next session and be guaranteed pain-free by summer. Book now!",
      buttons: [{ type: "quick_reply", label: "Book now" }],
      samples: ["Ethan"], updatedAt: daysAgo(4, now),
    },
    {
      id: "tp_code", name: "portal_login_code", category: "Authentication", status: "Approved", language: "English (AU)",
      body: "{{1}} is your Harbourside Physio patient portal code. For your security, do not share this code.",
      buttons: [{ type: "quick_reply", label: "Copy code" }],
      samples: ["482 913"], updatedAt: daysAgo(55, now),
    },
  ];
}
