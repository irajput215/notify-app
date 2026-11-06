import type { MessageTemplate } from "@/lib/types";
import { staff } from "@/lib/mock/workspace";
import { request } from "./client";
import { db } from "./db";
import { getContact, getConversation, patchConversation, pushMessage, systemEvent, withTags } from "./internal";

const staffName = (id: string) => staff.find((s) => s.id === id)?.name ?? "A team member";

/** GET /conversations */
export const listConversations = () => request(() => db().conversations);

/** GET /conversations/:id/messages */
export const getMessages = (conversationId: string) =>
  request(() => db().messages.filter((m) => m.conversationId === conversationId));

/** POST /conversations/:id/read */
export const markRead = (conversationId: string) =>
  request(() => patchConversation(getConversation(conversationId), { unread: 0 }), 80);

/** POST /conversations/:id/messages — a staff reply. Replying takes over from the AI. */
export const sendStaffMessage = (conversationId: string, staffId: string, body: string) =>
  request(() => {
    const conv = getConversation(conversationId);
    if (getContact(conv.contactId).optIn === "opted_out") throw new Error("Contact has opted out");
    if (conv.aiEnabled) {
      systemEvent(conversationId, `${staffName(staffId)} took over from AI`);
      patchConversation(conv, { aiEnabled: false });
    }
    const message = pushMessage({ conversationId, author: "staff", staffId, kind: "text", body });
    patchConversation(conv, { tags: withTags(conv, [], ["needs_human"]), assignedTo: conv.assignedTo ?? staffId });
    return message;
  }, 250);

/** POST /conversations/:id/notes — internal note, never sent to the customer. */
export const addNote = (conversationId: string, staffId: string, body: string) =>
  request(() => pushMessage({ conversationId, author: "staff", staffId, kind: "note", body }), 200);

function fillTemplate(t: MessageTemplate, firstName: string) {
  return t.body.replace(/\{\{(\d+)\}\}/g, (_, n: string) => (n === "1" ? firstName : t.samples[Number(n) - 1] ?? ""));
}

/** POST /conversations/:id/templates — allowed even when the 24h window is closed. */
export const sendTemplate = (conversationId: string, staffId: string, templateId: string) =>
  request(() => {
    const conv = getConversation(conversationId);
    const contact = getContact(conv.contactId);
    if (contact.optIn === "opted_out") throw new Error("Contact has opted out");
    const t = db().templates.find((x) => x.id === templateId);
    if (!t || t.status !== "Approved") throw new Error("Template is not approved");
    return pushMessage({
      conversationId, author: "staff", staffId, kind: "template", templateName: t.name,
      body: fillTemplate(t, contact.name.split(" ")[0]),
      buttons: t.buttons.filter((b) => b.type === "quick_reply").map((b, i) => ({ id: `tpl_${i}`, label: b.label })),
    });
  }, 300);

/** PATCH /conversations/:id/ai — hand the conversation to a human or back to the AI. */
export const setAiEnabled = (conversationId: string, staffId: string, enabled: boolean) =>
  request(() => {
    const conv = getConversation(conversationId);
    systemEvent(conversationId, enabled ? `${staffName(staffId)} handed the conversation back to AI` : `${staffName(staffId)} took over from AI`);
    return patchConversation(conv, {
      aiEnabled: enabled,
      assignedTo: enabled ? conv.assignedTo : conv.assignedTo ?? staffId,
      tags: enabled ? withTags(conv, [], ["needs_human"]) : conv.tags,
    });
  }, 200);

/** PATCH /conversations/:id/assignee */
export const assignConversation = (conversationId: string, staffId: string | undefined) =>
  request(() => patchConversation(getConversation(conversationId), { assignedTo: staffId }), 200);

/** PATCH /conversations/:id/resolve — clears the Needs human flag. */
export const resolveConversation = (conversationId: string) =>
  request(() => {
    const conv = getConversation(conversationId);
    return patchConversation(conv, { tags: withTags(conv, [], ["needs_human"]) });
  }, 200);
