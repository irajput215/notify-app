import { request } from "./client";
import { resetDb } from "./db";

/** Restores every mock record to its initial state. */
export const resetDemo = () => request(() => { resetDb(); return true; }, 400);
