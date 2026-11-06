import type { Campaign } from "@/lib/types";
import { segments } from "@/lib/mock/campaigns";
import { uid } from "@/lib/utils";
import { request } from "./client";
import { db } from "./db";

/** GET /campaigns */
export const listCampaigns = () => request(() => db().campaigns);

/** GET /segments */
export const listSegments = () => request(() => segments);

/** POST /segments/:id/audience — the consent check: opted-out and unconfirmed contacts are excluded. */
export const getAudience = (segmentId: string) =>
  request(() => {
    const seg = segments.find((s) => s.id === segmentId);
    const members = db().contacts.filter((c) => !seg || seg.tags.length === 0 || seg.tags.some((t) => c.tags.includes(t)));
    const optedOut = members.filter((c) => c.optIn === "opted_out");
    const pending = members.filter((c) => c.optIn === "pending");
    return {
      total: members.length,
      eligible: members.length - optedOut.length - pending.length,
      optedOut: optedOut.map((c) => c.name),
      pending: pending.map((c) => c.name),
    };
  }, 350);

/** POST /campaigns */
export const createCampaign = (input: Omit<Campaign, "id" | "delivered" | "read" | "replied">) =>
  request(() => {
    const campaign: Campaign = { ...input, id: uid("cp"), delivered: 0, read: 0, replied: 0 };
    db().campaigns.unshift(campaign);
    return campaign;
  }, 500);
