import type { Automation } from "@/lib/types";

export const automations: Automation[] = [
  {
    id: "au_reminders", key: "reminders", name: "Appointment reminders", enabled: true,
    description: "Sends a reminder with Confirm, Reschedule and Cancel buttons. Replies update Cliniko automatically.",
    previewMessage: "Hi Olivia, this is a reminder of your Standard consult with Hannah Lowe at Harbourside Physio on Thu 12/11, 10am.",
    previewButtons: ["Confirm", "Reschedule", "Cancel"],
    settings: [
      { key: "timing", label: "Send reminder", type: "select", value: "24 hours before", options: ["48 hours before", "24 hours before", "Morning of the appointment"] },
      { key: "second", label: "Second reminder if unconfirmed", type: "toggle", value: true, help: "Sent 4 hours before if the patient hasn't replied." },
      { key: "quiet", label: "Don't send between", type: "select", value: "8pm – 8am", options: ["9pm – 7am", "8pm – 8am", "Never pause"] },
    ],
    stats: [{ label: "Sent this week", value: "212" }, { label: "Confirmed", value: "81%" }],
  },
  {
    id: "au_missed", key: "missed_call", name: "Missed-call text-back", enabled: true,
    description: "When a call to the clinic goes unanswered, Notify texts the caller and continues the conversation on WhatsApp.",
    previewMessage: "Hi, sorry we missed your call to Harbourside Physio! Reply here to book, reschedule or ask a question.",
    previewButtons: ["Book an appointment"],
    settings: [
      { key: "delay", label: "Send after", type: "select", value: "1 minute", options: ["Immediately", "1 minute", "5 minutes"] },
      { key: "hours", label: "Only during opening hours", type: "toggle", value: false },
    ],
    stats: [{ label: "Missed calls this week", value: "17" }, { label: "Recovered", value: "11" }],
  },
  {
    id: "au_waitlist", key: "waitlist", name: "Waitlist fill for cancelled slots", enabled: true,
    description: "When an appointment is cancelled, offers the slot to waitlisted patients. First to reply gets it.",
    previewMessage: "Hi Sophie, good news! A spot has opened up with Priya Raman on Tue 10/11, 9:30am. Would you like it?",
    previewButtons: ["Yes, book me in", "No thanks"],
    settings: [
      { key: "batch", label: "Offer to", type: "select", value: "3 patients at a time", options: ["1 patient at a time", "3 patients at a time", "Everyone on the waitlist"] },
      { key: "notice", label: "Minimum notice", type: "select", value: "2 hours", options: ["1 hour", "2 hours", "4 hours"] },
    ],
    stats: [{ label: "Slots refilled", value: "9" }, { label: "Revenue recovered", value: "$882" }],
  },
  {
    id: "au_previsit", key: "pre_visit", name: "Pre-visit description request", enabled: true,
    description: "Asks new patients what brought them in. The AI writes a short summary into the appointment notes, alongside the patient's own words.",
    previewMessage: "Hi Aisha, before your Initial consult could you tell us briefly what's brought you in? It helps your physio prepare.",
    settings: [
      { key: "who", label: "Send to", type: "select", value: "New patients only", options: ["New patients only", "All patients"] },
      { key: "when", label: "Send", type: "select", value: "2 days before", options: ["Right after booking", "2 days before", "1 day before"] },
    ],
    stats: [{ label: "Descriptions captured", value: "24" }, { label: "Response rate", value: "73%" }],
  },
  {
    id: "au_feedback", key: "feedback", name: "Private post-visit feedback", enabled: false,
    description: "Asks how the visit went. Replies go privately to your team so you can follow up before issues become reviews.",
    previewMessage: "Thanks for visiting us today, Grace. How was your appointment with Priya? Your reply goes privately to our team.",
    previewButtons: ["Great", "Okay", "Not great"],
    settings: [
      { key: "delay", label: "Send after visit", type: "select", value: "2 hours", options: ["30 minutes", "2 hours", "Next morning"] },
      { key: "alert", label: "Alert team on “Not great”", type: "toggle", value: true },
    ],
    stats: [{ label: "Last 30 days", value: "Off" }, { label: "Avg. rating", value: "–" }],
  },
  {
    id: "au_ooh", key: "out_of_hours", name: "Out-of-hours auto reply", enabled: true,
    description: "Outside opening hours the AI still answers FAQs and handles bookings, and lets patients know when the team is back.",
    previewMessage: "Thanks for your message! Our team is back at 8am. I can still help with bookings and general questions now.",
    settings: [
      { key: "ai", label: "Let AI handle bookings after hours", type: "toggle", value: true },
      { key: "msg", label: "Back-at message", type: "text", value: "Our team is back at 8am." },
    ],
    stats: [{ label: "After-hours chats", value: "38" }, { label: "Resolved by AI", value: "29" }],
  },
];
