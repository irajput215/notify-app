import type { AiSettings } from "@/lib/types";
import { request } from "./client";
import { db } from "./db";
import { previewReply } from "./intent";

/** GET /ai/settings */
export const getAiSettings = () => request(() => db().ai);

/** PUT /ai/settings — "never give clinical advice" cannot be switched off. */
export const saveAiSettings = (settings: AiSettings) =>
  request(() => {
    db().ai = { ...settings, neverClinicalAdvice: true };
    return db().ai;
  }, 400);

/** POST /ai/test — dry run, no messages sent. Pass unsaved settings to test a draft. */
export const testAi = (question: string, draft?: AiSettings) => request(() => previewReply(question, draft ?? db().ai), 700);
