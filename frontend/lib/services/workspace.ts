import { CURRENT_USER_ID, practitioners, staff, workspace } from "@/lib/mock/workspace";
import { request } from "./client";

/** GET /workspace */
export const getWorkspace = () => request(() => workspace);
/** GET /team */
export const getTeam = () => request(() => staff);
/** GET /practitioners (synced from Cliniko) */
export const getPractitioners = () => request(() => practitioners);
/** GET /me */
export const getCurrentUserId = () => request(() => CURRENT_USER_ID, 50);
