import type { DailyPoint, DashboardCounters } from "@/lib/types";
import { addDays, startOfDay } from "@/lib/time";
import { weekday } from "@/lib/format";

export const initialCounters: DashboardCounters = {
  conversationsToday: 38,
  remindersSent: 46,
  confirmations: 31,
  reschedulesByAi: 7,
  missedCallsRecovered: 4,
  aiHandled: 214,
  humanHandled: 47,
};

/** Previous six days; today's point is derived from live counters. */
const history: [confirmations: number, reminders: number][] = [
  [28, 41], [33, 44], [25, 37], [36, 49], [30, 42], [12, 18],
];

export function buildConfirmationHistory(now: Date): DailyPoint[] {
  const today = startOfDay(now);
  return history.map(([confirmations, reminders], i) => {
    const d = addDays(today, i - history.length);
    return { date: d.toISOString(), label: weekday(d), confirmations, reminders };
  });
}
