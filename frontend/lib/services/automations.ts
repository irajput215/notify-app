import type { Automation } from "@/lib/types";
import { request } from "./client";
import { db, findOrThrow } from "./db";

/** GET /automations */
export const listAutomations = () => request(() => db().automations);

/** PATCH /automations/:id */
export const updateAutomation = (id: string, patch: Partial<Pick<Automation, "enabled" | "settings">>) =>
  request(() => Object.assign(findOrThrow(db().automations, id, "Automation"), patch), 250);
