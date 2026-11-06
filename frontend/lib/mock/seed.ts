import type {
  AiSettings, Appointment, Automation, Campaign, Contact, Conversation, DailyPoint,
  DashboardCounters, Integration, Message, MessageTemplate,
} from "@/lib/types";
import { aiSettings } from "./ai";
import { buildAppointments } from "./appointments";
import { automations } from "./automations";
import { buildCampaigns } from "./campaigns";
import { buildContacts } from "./contacts";
import { buildScriptedThreads } from "./conversations";
import { buildExtraThreads } from "./conversations-extra";
import { buildConfirmationHistory, initialCounters } from "./dashboard";
import { integrations } from "./integrations";
import { buildTemplates } from "./templates";

export interface Seed {
  contacts: Contact[];
  conversations: Conversation[];
  messages: Message[];
  appointments: Appointment[];
  templates: MessageTemplate[];
  campaigns: Campaign[];
  automations: Automation[];
  ai: AiSettings;
  integrations: Integration[];
  counters: DashboardCounters;
  confirmationHistory: DailyPoint[];
}

/** Contacts with scripted stories never get random appointments that could contradict them. */
const FEATURED = new Set([
  "ct_olivia", "ct_liam", "ct_grace", "ct_tom", "ct_aisha", "ct_michael", "ct_daniel", "ct_chloe",
  "ct_ethan", "ct_zoe", "ct_noah", "ct_isla", "ct_ruby", "ct_lucas", "ct_sophie",
]);

/** Builds a fresh copy of the whole demo workspace relative to `now`. */
export function createSeed(now = new Date()): Seed {
  const contacts = buildContacts(now);
  const byId = Object.fromEntries(contacts.map((c) => [c.id, c]));
  const appointments = buildAppointments(
    now,
    contacts.filter((c) => c.isPatient && !FEATURED.has(c.id)).map((c) => c.id),
  ).map((a) => (a.contactId && !a.patientName ? { ...a, patientName: byId[a.contactId].name } : a));
  const apptMap = Object.fromEntries(appointments.map((a) => [a.id, a]));
  const threads = [...buildScriptedThreads(now, apptMap), ...buildExtraThreads(now, apptMap)];

  for (const t of threads) {
    const c = byId[t.conversation.contactId];
    c.lastMessageAt = t.conversation.updatedAt;
    c.lastMessagePreview = t.conversation.preview;
    c.assignedTo = t.conversation.assignedTo;
  }
  // Link the simulator conversation to Olivia's upcoming appointment.
  const olivia = threads.find((t) => t.conversation.id === "cv_olivia");
  if (olivia) olivia.conversation.flow = { step: "idle", appointmentId: "ap_olivia" };

  return structuredClone({
    contacts,
    conversations: threads.map((t) => t.conversation),
    messages: threads.flatMap((t) => t.messages),
    appointments,
    templates: buildTemplates(now),
    campaigns: buildCampaigns(now),
    automations,
    ai: aiSettings,
    integrations,
    counters: initialCounters,
    confirmationHistory: buildConfirmationHistory(now),
  });
}
