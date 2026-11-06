/**
 * Domain types shared by the mock service layer, the store and the UI.
 * These mirror the shapes a real FastAPI backend would return.
 * All timestamps are ISO 8601 strings.
 */

export type ID = string;

/* ---------- Workspace & team ---------- */

export type Role = "Owner" | "Admin" | "Agent";

export interface StaffMember {
  id: ID;
  name: string;
  email: string;
  role: Role;
  title: string;
  /** Tailwind classes used for the avatar chip. */
  avatarClass: string;
  online: boolean;
}

export interface Practitioner {
  id: ID;
  name: string;
  title: string;
  /** Short label for compact calendar views. */
  short: string;
  /** Tailwind dot/border colour classes. */
  colorClass: string;
}

export interface Workspace {
  id: ID;
  name: string;
  location: string;
  timezone: string;
  phone: string;
  whatsappNumber: string;
  displayName: string;
  website: string;
  address: string;
  abn: string;
  qualityRating: "High" | "Medium" | "Low";
  messagingTier: string;
  hostingRegion: string;
  retentionMonths: number;
  plan: string;
}

/* ---------- Contacts ---------- */

export type OptInStatus = "opted_in" | "opted_out" | "pending";

export interface PatientDescription {
  /** AI-generated summary saved to appointment notes. */
  summary: string;
  /** The patient's original words. */
  original: string;
  capturedAt: string;
}

export interface Contact {
  id: ID;
  name: string;
  phone: string;
  email?: string;
  tags: string[];
  optIn: OptInStatus;
  optInSource: string;
  optInAt?: string;
  assignedTo?: ID;
  createdAt: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  isPatient: boolean;
  clinikoPatientId?: string;
  dateOfBirth?: string;
  suburb?: string;
}

/* ---------- Appointments ---------- */

export type AppointmentStatus = "confirmed" | "unconfirmed" | "rescheduled" | "cancelled";

export interface Appointment {
  id: ID;
  /** Linked messaging contact, when the patient has one. */
  contactId?: ID;
  patientName: string;
  practitionerId: ID;
  start: string;
  durationMin: number;
  type: string;
  status: AppointmentStatus;
  description?: PatientDescription;
  /** Human-readable history lines, newest last. */
  history: { at: string; text: string }[];
  /** Set by the service when the slot changed recently, used to animate. */
  movedAt?: string;
}

export interface Slot {
  id: ID;
  practitionerId: ID;
  start: string;
}

/* ---------- Conversations & messages ---------- */

export type ConversationTag =
  | "ai_handled"
  | "needs_human"
  | "rescheduled"
  | "new_contact"
  | "opted_out"
  | "confirmed"
  | "missed_call"
  | "cancelled";

export type MessageAuthor = "customer" | "ai" | "staff" | "system";

export interface MessageButton {
  id: string;
  label: string;
}

export interface MessageList {
  buttonLabel: string;
  sectionTitle: string;
  options: { id: string; title: string; description?: string }[];
}

export interface Message {
  id: ID;
  conversationId: ID;
  author: MessageAuthor;
  staffId?: ID;
  /** note = internal staff note, event = system timeline line. */
  kind: "text" | "template" | "note" | "event";
  body: string;
  templateName?: string;
  buttons?: MessageButton[];
  list?: MessageList;
  /** For customer messages that were a button / list tap. */
  replyTo?: { label: string; context?: string };
  createdAt: string;
  status?: "sent" | "delivered" | "read";
}

export interface Conversation {
  id: ID;
  contactId: ID;
  tags: ConversationTag[];
  unread: number;
  assignedTo?: ID;
  /** False once a staff member takes over from the AI. */
  aiEnabled: boolean;
  /** Drives the 24-hour customer service window. */
  lastCustomerMessageAt?: string;
  updatedAt: string;
  preview: string;
  /** Free-form state used by the scripted bot flows. */
  flow?: { step: string; appointmentId?: ID; practitionerId?: ID; origin?: "missed_call" };
}

export type InboxFilter = "all" | "needs_human" | "mine" | "ai_handled";

/* ---------- Templates & campaigns ---------- */

export type TemplateCategory = "Utility" | "Marketing" | "Authentication";
export type TemplateStatus = "Approved" | "Pending" | "Rejected" | "Draft";

export interface TemplateButton {
  type: "quick_reply" | "url" | "phone";
  label: string;
  value?: string;
}

export interface MessageTemplate {
  id: ID;
  name: string;
  category: TemplateCategory;
  status: TemplateStatus;
  rejectionReason?: string;
  language: string;
  header?: string;
  body: string;
  footer?: string;
  buttons: TemplateButton[];
  /** Sample values for {{1}}, {{2}}… used in previews. */
  samples: string[];
  updatedAt: string;
}

export type CampaignStatus = "Draft" | "Scheduled" | "Sending" | "Sent";

export interface Campaign {
  id: ID;
  name: string;
  templateId: ID;
  segmentId: ID;
  status: CampaignStatus;
  scheduledAt: string;
  recipients: number;
  excluded: number;
  delivered: number;
  read: number;
  replied: number;
}

export interface Segment {
  id: ID;
  name: string;
  description: string;
  /** Contact tags that define the segment; empty = all contacts. */
  tags: string[];
}

/* ---------- Automations & AI ---------- */

export interface AutomationSetting {
  key: string;
  label: string;
  type: "select" | "toggle" | "text" | "number";
  value: string | number | boolean;
  options?: string[];
  help?: string;
}

export interface Automation {
  id: ID;
  key:
    | "reminders"
    | "missed_call"
    | "waitlist"
    | "pre_visit"
    | "feedback"
    | "out_of_hours";
  name: string;
  description: string;
  enabled: boolean;
  previewMessage: string;
  previewButtons?: string[];
  settings: AutomationSetting[];
  stats: { label: string; value: string }[];
}

export interface FaqEntry {
  id: ID;
  question: string;
  answer: string;
  keywords: string[];
}

export type AiTone = "Warm and friendly" | "Professional" | "Concise";

export interface AiSettings {
  tone: AiTone;
  neverClinicalAdvice: true;
  escalateWhenUnsure: boolean;
  escalationKeywords: string[];
  aiSignature: string;
  faqs: FaqEntry[];
}

/* ---------- Integrations, billing ---------- */

export type IntegrationStatus = "connected" | "available" | "coming_soon";

export interface Integration {
  id: ID;
  name: string;
  kind: "app" | "channel";
  category: string;
  description: string;
  status: IntegrationStatus;
  detail?: string;
  /** Two-letter monogram shown instead of a brand logo. */
  monogram: string;
  monogramClass: string;
}

export interface Invoice {
  id: ID;
  number: string;
  date: string;
  amountAud: number;
  status: "Paid" | "Due";
}

export interface UsageSummary {
  periodLabel: string;
  conversationsUsed: number;
  conversationsIncluded: number;
  aiRepliesUsed: number;
  aiRepliesIncluded: number;
}

/* ---------- Dashboard ---------- */

export interface DashboardCounters {
  conversationsToday: number;
  remindersSent: number;
  confirmations: number;
  reschedulesByAi: number;
  missedCallsRecovered: number;
  /** Conversations this week resolved by AI vs a person. */
  aiHandled: number;
  humanHandled: number;
}

export interface DailyPoint {
  date: string;
  label: string;
  confirmations: number;
  reminders: number;
}

export interface DashboardData {
  counters: DashboardCounters;
  /** The previous six days; today's point comes from the live counters. */
  history: DailyPoint[];
}

/* ---------- Realtime events (mock websocket) ---------- */

export type ServerEvent =
  | { type: "message.created"; message: Message }
  | { type: "conversation.updated"; conversation: Conversation }
  | { type: "contact.updated"; contact: Contact }
  | { type: "appointment.updated"; appointment: Appointment }
  | { type: "counters.updated"; counters: DashboardCounters }
  | { type: "typing"; conversationId: ID; isTyping: boolean }
  | { type: "template.updated"; template: MessageTemplate }
  | {
      type: "toast";
      title: string;
      description?: string;
      variant?: "success" | "info" | "warning";
    };
