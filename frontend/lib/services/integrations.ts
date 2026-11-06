import type { IntegrationStatus } from "@/lib/types";
import { request } from "./client";
import { db, findOrThrow } from "./db";

/** GET /integrations */
export const listIntegrations = () => request(() => db().integrations);

/** POST /integrations/:id/connect — mock OAuth handshake. */
export const setIntegrationStatus = (id: string, status: IntegrationStatus) =>
  request(() => {
    const item = findOrThrow(db().integrations, id, "Integration");
    item.status = status;
    item.detail = status === "connected" ? "Connected just now" : undefined;
    return item;
  }, 1200);
