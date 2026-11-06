import type { DashboardData } from "@/lib/types";
import { request } from "./client";
import { db } from "./db";

/** GET /dashboard */
export const getDashboard = () =>
  request<DashboardData>(() => ({ counters: db().counters, history: db().confirmationHistory }));
