/**
 * Demo clock helpers. Mock data is generated relative to "now" so the demo
 * always looks current, whatever day it is presented.
 */

export function minutesAgo(min: number, from = new Date()) {
  return new Date(from.getTime() - min * 60_000).toISOString();
}

export function hoursAgo(h: number, from = new Date()) {
  return minutesAgo(h * 60, from);
}

export function daysAgo(d: number, from = new Date()) {
  return minutesAgo(d * 24 * 60, from);
}

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Monday of the week containing d. */
export function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(x, diff);
}

/** A date at a given hour/minute, `dayOffset` days from today. */
export function at(dayOffset: number, hour: number, minute = 0, from = new Date()) {
  const x = addDays(startOfDay(from), dayOffset);
  x.setHours(hour, minute, 0, 0);
  return x.toISOString();
}

/** Next occurrence (strictly after today) of a weekday: 0 = Sun … 6 = Sat. */
export function nextWeekday(target: number, from = new Date()) {
  const today = startOfDay(from);
  let offset = (target - today.getDay() + 7) % 7;
  if (offset === 0) offset = 7;
  return offset;
}

/** Day offset of the next clinic day (Mon–Sat) after today. */
export function nextClinicDay(from = new Date()) {
  const tomorrow = addDays(startOfDay(from), 1);
  return tomorrow.getDay() === 0 ? 2 : 1;
}

/** Day offset of the n-th weekday (Mon–Fri) from today; n=0 is today if a weekday. */
export function weekdayOffset(n: number, from = new Date()) {
  let offset = 0;
  let count = -1;
  const today = startOfDay(from);
  while (true) {
    const day = addDays(today, offset).getDay();
    if (day !== 0 && day !== 6) count += 1;
    if (count >= n && day !== 0 && day !== 6) return offset;
    offset += 1;
  }
}

/** Deterministic PRNG so mock data is stable between resets. */
export function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
