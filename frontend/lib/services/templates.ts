import type { MessageTemplate } from "@/lib/types";
import { uid } from "@/lib/utils";
import { emit, request } from "./client";
import { db, findOrThrow } from "./db";

/** GET /templates */
export const listTemplates = () => request(() => db().templates);

/** PUT /templates/:id (creates when id is missing) */
export const saveTemplate = (input: Omit<MessageTemplate, "id" | "updatedAt" | "status"> & { id?: string }) =>
  request(() => {
    const list = db().templates;
    const existing = input.id ? list.find((t) => t.id === input.id) : undefined;
    const next: MessageTemplate = {
      ...input,
      id: existing?.id ?? uid("tp"),
      status: "Draft",
      rejectionReason: undefined,
      updatedAt: new Date().toISOString(),
    };
    if (existing) Object.assign(existing, next);
    else list.unshift(next);
    return next;
  });

/**
 * POST /templates/:id/submit — in production this calls the WhatsApp Business
 * Management API; approval arrives later via webhook. Here it auto-approves.
 */
export const submitTemplate = (id: string) =>
  request(() => {
    const t = findOrThrow(db().templates, id, "Template");
    Object.assign(t, { status: "Pending", rejectionReason: undefined, updatedAt: new Date().toISOString() });
    setTimeout(() => {
      Object.assign(t, { status: "Approved", updatedAt: new Date().toISOString() });
      emit({ type: "template.updated", template: t });
      emit({ type: "toast", title: "Template approved", description: `“${t.name}” is ready to use.`, variant: "success" });
    }, 4500);
    return t;
  });
