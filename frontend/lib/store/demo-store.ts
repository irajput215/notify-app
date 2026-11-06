"use client";

/**
 * Client-side cache of shared demo state. Pages read from here so an action
 * on one screen (e.g. a patient rescheduling in the simulator) is reflected
 * everywhere. All writes go through the service layer; the store applies the
 * resulting realtime events.
 */
import { create } from "zustand";
import { toast } from "sonner";
import type {
  Appointment, Contact, Conversation, DailyPoint, DashboardCounters, Message,
  Practitioner, ServerEvent, StaffMember, Workspace,
} from "@/lib/types";
import {
  appointmentsApi, contactsApi, conversationsApi, dashboardApi, demoApi, subscribe, workspaceApi,
} from "@/lib/services";

const byId = <T extends { id: string }>(list: T[]) => Object.fromEntries(list.map((x) => [x.id, x])) as Record<string, T>;

interface DemoState {
  status: "idle" | "loading" | "ready";
  workspace?: Workspace;
  team: StaffMember[];
  practitioners: Practitioner[];
  currentUserId: string;
  contacts: Record<string, Contact>;
  conversations: Record<string, Conversation>;
  messages: Record<string, Message[] | undefined>;
  appointments: Record<string, Appointment>;
  counters?: DashboardCounters;
  history: DailyPoint[];
  typing: Record<string, boolean>;
  simulatorOpen: boolean;
  resetting: boolean;

  boot: () => Promise<void>;
  reset: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  apply: (event: ServerEvent) => void;
  setSimulatorOpen: (open: boolean) => void;
}

let unsubscribe: (() => void) | null = null;
const pending = new Set<string>();

async function loadAll() {
  const [workspace, team, practitioners, currentUserId, contacts, conversations, appointments, dashboard] =
    await Promise.all([
      workspaceApi.getWorkspace(),
      workspaceApi.getTeam(),
      workspaceApi.getPractitioners(),
      workspaceApi.getCurrentUserId(),
      contactsApi.listContacts(),
      conversationsApi.listConversations(),
      appointmentsApi.listAppointments(),
      dashboardApi.getDashboard(),
    ]);
  return {
    workspace, team, practitioners, currentUserId,
    contacts: byId(contacts),
    conversations: byId(conversations),
    appointments: byId(appointments),
    counters: dashboard.counters,
    history: dashboard.history,
  };
}

export const useDemoStore = create<DemoState>((set, get) => ({
  status: "idle",
  team: [],
  practitioners: [],
  currentUserId: "",
  contacts: {},
  conversations: {},
  messages: {},
  appointments: {},
  history: [],
  typing: {},
  simulatorOpen: false,
  resetting: false,

  boot: async () => {
    if (get().status !== "idle") return;
    set({ status: "loading" });
    if (!unsubscribe) unsubscribe = subscribe((e) => get().apply(e));
    const data = await loadAll();
    set({ ...data, status: "ready" });
  },

  reset: async () => {
    set({ resetting: true });
    await demoApi.resetDemo();
    const data = await loadAll();
    set({ ...data, messages: {}, typing: {}, resetting: false });
    toast.success("Demo reset", { description: "All conversations, appointments and counters are back to the start." });
  },

  loadMessages: async (conversationId) => {
    if (get().messages[conversationId] || pending.has(conversationId)) return;
    pending.add(conversationId);
    try {
      const list = await conversationsApi.getMessages(conversationId);
      set((s) => ({ messages: { ...s.messages, [conversationId]: list } }));
    } finally {
      pending.delete(conversationId);
    }
  },

  apply: (event) => {
    switch (event.type) {
      case "message.created": {
        const m = event.message;
        set((s) => {
          const existing = s.messages[m.conversationId];
          if (!existing) return s;
          if (existing.some((x) => x.id === m.id)) return s;
          return { messages: { ...s.messages, [m.conversationId]: [...existing, m] } };
        });
        return;
      }
      case "conversation.updated":
        set((s) => ({ conversations: { ...s.conversations, [event.conversation.id]: event.conversation } }));
        return;
      case "contact.updated":
        set((s) => ({ contacts: { ...s.contacts, [event.contact.id]: event.contact } }));
        return;
      case "appointment.updated":
        set((s) => ({ appointments: { ...s.appointments, [event.appointment.id]: event.appointment } }));
        return;
      case "counters.updated":
        set({ counters: event.counters });
        return;
      case "typing":
        set((s) => ({ typing: { ...s.typing, [event.conversationId]: event.isTyping } }));
        return;
      case "toast": {
        const fn = event.variant === "warning" ? toast.warning : event.variant === "info" ? toast.info : toast.success;
        fn(event.title, { description: event.description });
        return;
      }
      default:
        return;
    }
  },

  setSimulatorOpen: (open) => set({ simulatorOpen: open }),
}));

/* ---------- Selectors ---------- */

export const useCurrentUser = () =>
  useDemoStore((s) => s.team.find((t) => t.id === s.currentUserId));

export function useStaff(id?: string) {
  return useDemoStore((s) => (id ? s.team.find((t) => t.id === id) : undefined));
}
