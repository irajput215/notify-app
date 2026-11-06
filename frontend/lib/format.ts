/**
 * Australian formatting helpers: DD/MM/YYYY, 12-hour times, AUD, +61 phones.
 * Times use the browser's local zone (the demo assumes it is presented in AEST/AEDT).
 */

const pad = (n: number) => n.toString().padStart(2, "0");

export function formatDate(iso: string | Date) {
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function formatTime(iso: string | Date) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${suffix}` : `${h12}:${pad(m)}${suffix}`;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function weekday(iso: string | Date, long = false) {
  const d = new Date(iso);
  return (long ? DAYS_LONG : DAYS)[d.getDay()];
}

/** e.g. "Thu 12/11, 2:30pm" */
export function formatSlot(iso: string | Date) {
  const d = new Date(iso);
  return `${weekday(d)} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}, ${formatTime(d)}`;
}

/** e.g. "Thursday 12/11/2026 at 2:30pm" */
export function formatLongDateTime(iso: string | Date) {
  return `${weekday(iso, true)} ${formatDate(iso)} at ${formatTime(iso)}`;
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Compact time label for lists: "9:41am", "Yesterday", "Mon", "03/11/2026". */
export function formatListTime(iso: string, now = new Date()) {
  const d = new Date(iso);
  if (isSameDay(d, now)) return formatTime(d);
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (isSameDay(d, y)) return "Yesterday";
  const diffDays = (now.getTime() - d.getTime()) / 86_400_000;
  if (diffDays < 6) return weekday(d);
  return formatDate(d);
}

export function formatRelative(iso: string, now = new Date()) {
  const diff = Math.round((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff} min ago`;
  const hours = Math.round(diff / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatListTime(iso, now);
}

const aud = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
export function formatAUD(amount: number) {
  return aud.format(amount);
}

const num = new Intl.NumberFormat("en-AU");
export function formatNumber(n: number) {
  return num.format(n);
}

/** Normalises "+61491570156" or "0491570156" to "+61 491 570 156". */
export function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  const local = digits.startsWith("61") ? digits.slice(2) : digits.replace(/^0/, "");
  if (local.length === 9 && local.startsWith("4")) {
    return `+61 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  if (local.length === 9) {
    return `+61 ${local.slice(0, 1)} ${local.slice(1, 5)} ${local.slice(5)}`;
  }
  return raw;
}

/** Hours left in the 24-hour customer service window, or null when closed. */
export function windowHoursLeft(lastCustomerMessageAt: string | undefined, now = new Date()) {
  if (!lastCustomerMessageAt) return null;
  const elapsed = (now.getTime() - new Date(lastCustomerMessageAt).getTime()) / 3_600_000;
  const left = 24 - elapsed;
  return left > 0 ? Math.max(1, Math.floor(left)) : null;
}
