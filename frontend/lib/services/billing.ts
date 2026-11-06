import { invoices, usage } from "@/lib/mock/billing";
import { request } from "./client";

/** GET /billing/usage */
export const getUsage = () => request(() => usage);
/** GET /billing/invoices */
export const listInvoices = () => request(() => invoices);
