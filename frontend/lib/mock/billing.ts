import type { Invoice, UsageSummary } from "@/lib/types";

export const usage: UsageSummary = {
  periodLabel: "01/11/2026 – 30/11/2026",
  conversationsUsed: 642,
  conversationsIncluded: 1500,
  aiRepliesUsed: 1873,
  aiRepliesIncluded: 5000,
};

export const invoices: Invoice[] = [
  { id: "inv_6", number: "NTF-000186", date: "2026-11-01", amountAud: 249, status: "Paid" },
  { id: "inv_5", number: "NTF-000171", date: "2026-10-01", amountAud: 249, status: "Paid" },
  { id: "inv_4", number: "NTF-000158", date: "2026-09-01", amountAud: 263.4, status: "Paid" },
  { id: "inv_3", number: "NTF-000140", date: "2026-08-01", amountAud: 249, status: "Paid" },
];
