/** Free-slot search over the practitioner's calendar (server-side logic). */
import type { Slot } from "@/lib/types";
import { clinicHours, LUNCH_MINUTES } from "@/lib/mock/appointments";
import { addDays, startOfDay } from "@/lib/time";
import { db } from "./db";

export type DayPreference = "tomorrow" | "friday" | undefined;

function isFree(practitionerId: string, start: Date, ignoreId?: string) {
  const s = start.getTime();
  const e = s + 30 * 60_000;
  return !db().appointments.some((a) => {
    if (a.practitionerId !== practitionerId || a.status === "cancelled" || a.id === ignoreId) return false;
    const as = new Date(a.start).getTime();
    const ae = as + a.durationMin * 60_000;
    return s < ae && e > as;
  });
}

function freeSlotsOn(day: Date, practitionerId: string, earliest: Date, ignoreId?: string) {
  const hours = clinicHours(day.getDay());
  if (!hours) return [];
  const out: Date[] = [];
  for (let m = hours[0] * 60; m < hours[1] * 60; m += 30) {
    if (LUNCH_MINUTES.includes(m)) continue;
    const start = new Date(day);
    start.setHours(Math.floor(m / 60), m % 60, 0, 0);
    if (start <= earliest) continue;
    if (isFree(practitionerId, start, ignoreId)) out.push(start);
  }
  return out;
}

/** Picks the free slot closest to a target time of day, for natural-looking offers. */
function closestTo(slots: Date[], targetMinutes: number) {
  return slots.reduce<Date | undefined>((best, s) => {
    const d = Math.abs(s.getHours() * 60 + s.getMinutes() - targetMinutes);
    if (!best) return s;
    const bd = Math.abs(best.getHours() * 60 + best.getMinutes() - targetMinutes);
    return d < bd ? s : best;
  }, undefined);
}

export function findSlots(practitionerId: string, opts: { day?: DayPreference; ignoreId?: string; count?: number } = {}): Slot[] {
  const now = new Date();
  const earliest = new Date(now.getTime() + 2 * 3_600_000);
  const count = opts.count ?? 3;
  const today = startOfDay(now);
  const toSlot = (d: Date): Slot => ({ id: `slot:${d.toISOString()}`, practitionerId, start: d.toISOString() });

  if (opts.day) {
    let day = addDays(today, 1);
    if (opts.day === "friday") {
      day = addDays(today, ((5 - today.getDay() + 7) % 7) || 7);
    } else if (day.getDay() === 0) {
      day = addDays(day, 1);
    }
    const free = freeSlotsOn(day, practitionerId, earliest, opts.ignoreId);
    const picks = [9 * 60 + 30, 12 * 60, 15 * 60]
      .map((t) => closestTo(free, t))
      .filter((d): d is Date => Boolean(d));
    const unique = [...new Map(picks.map((d) => [d.getTime(), d])).values()];
    return unique.slice(0, count).map(toSlot);
  }

  const targets = [14 * 60 + 30, 9 * 60 + 30, 11 * 60];
  const out: Slot[] = [];
  for (let i = 1; i <= 14 && out.length < count; i += 1) {
    const free = freeSlotsOn(addDays(today, i), practitionerId, earliest, opts.ignoreId);
    const pick = closestTo(free, targets[out.length % targets.length]);
    if (pick) out.push(toSlot(pick));
  }
  return out;
}

export function slotStartFromId(id: string) {
  return id.startsWith("slot:") ? id.slice(5) : undefined;
}
