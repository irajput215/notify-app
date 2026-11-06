import type { Appointment, AppointmentStatus, PatientDescription } from "@/lib/types";
import { addDays, at, hoursAgo, nextWeekday, seededRandom, startOfDay, weekdayOffset } from "@/lib/time";
import { practitioners } from "./workspace";

/** Clinic hours: Mon–Fri 8am–6pm, Sat 8am–12pm, closed Sunday. */
export function clinicHours(day: number): [number, number] | null {
  if (day === 0) return null;
  if (day === 6) return [8, 12];
  return [8, 18];
}

export const LUNCH_MINUTES = [12 * 60 + 30];

/** Extra fictional patients who are in the practice system but not messaging contacts. */
const FIRST = ["Jack", "Emily", "Ryan", "Hannah", "Josh", "Meg", "Ben", "Lucy", "Nathan", "Tara", "Adam", "Kate", "Luke", "Jess", "Sean", "Alice", "Owen", "Rosie", "Callum", "Bella"];
const LAST = ["Mitchell", "Hughes", "Kelly", "Duncan", "Price", "Morgan", "Lam", "Santos", "Webb", "Fowler", "Baxter", "Quinn", "Ellis", "Hart", "Pham", "Byrne"];

const TYPES: { type: string; duration: number; weight: number }[] = [
  { type: "Standard consult", duration: 30, weight: 5 },
  { type: "Follow-up", duration: 30, weight: 3 },
  { type: "Initial consult", duration: 60, weight: 1.5 },
  { type: "Clinical Pilates", duration: 60, weight: 1 },
];

const DESCRIPTIONS: PatientDescription[] = [
  {
    summary: "Lower back stiffness after long drives, worse in the mornings. ~3 weeks. No numbness reported.",
    original: "my lower back has been really stiff for about 3 weeks, mostly in the morning and after driving to work",
    capturedAt: "",
  },
  {
    summary: "Right shoulder pain reaching overhead since starting a new gym program. Sleeping OK.",
    original: "shoulder hurts when I reach up, started when I changed my gym program. sleeping fine though",
    capturedAt: "",
  },
  {
    summary: "Follow-up for ankle sprain (netball). Swelling down, still sore on uneven ground.",
    original: "follow up for my ankle from netball, swelling is mostly gone but still sore on uneven ground",
    capturedAt: "",
  },
];

function pickStatus(start: Date, now: Date, r: number): AppointmentStatus {
  const days = (start.getTime() - now.getTime()) / 86_400_000;
  if (days < 0) return r < 0.92 ? "confirmed" : "cancelled";
  if (days < 2) return r < 0.6 ? "confirmed" : r < 0.95 ? "unconfirmed" : "cancelled";
  return r < 0.25 ? "confirmed" : r < 0.93 ? "unconfirmed" : "rescheduled";
}

function scripted(now: Date): Appointment[] {
  const thu = nextWeekday(4, now);
  const wd = (n: number) => weekdayOffset(n, now);
  let back = 1;
  while ([0, 6].includes(addDays(startOfDay(now), -back).getDay())) back += 1;
  const base = (a: Omit<Appointment, "history"> & { history?: Appointment["history"] }): Appointment => ({
    history: [{ at: hoursAgo(24 * 9, now), text: "Booked in Cliniko" }],
    ...a,
  });
  return [
    base({ id: "ap_olivia", contactId: "ct_olivia", patientName: "Olivia Bennett", practitionerId: "pr_hannah", start: at(wd(1), 10, 0, now), durationMin: 30, type: "Standard consult", status: "unconfirmed" }),
    base({
      id: "ap_liam", contactId: "ct_liam", patientName: "Liam Carter", practitionerId: "pr_james", start: at(thu, 14, 30, now), durationMin: 30, type: "Follow-up", status: "rescheduled",
      history: [
        { at: hoursAgo(24 * 9, now), text: "Booked in Cliniko for Tue 10am" },
        { at: hoursAgo(1.2, now), text: "Rescheduled by patient via WhatsApp to Thu 2:30pm" },
      ],
    }),
    base({ id: "ap_grace", contactId: "ct_grace", patientName: "Grace Nguyen", practitionerId: "pr_priya", start: at(wd(2), 9, 0, now), durationMin: 30, type: "Follow-up", status: "confirmed" }),
    base({
      id: "ap_tom", contactId: "ct_tom", patientName: "Tom Fitzgerald", practitionerId: "pr_priya", start: at(wd(2), 11, 0, now), durationMin: 30, type: "Standard consult", status: "confirmed",
      history: [{ at: hoursAgo(3, now), text: "Booked via WhatsApp after missed call text-back" }],
    }),
    base({
      id: "ap_aisha", contactId: "ct_aisha", patientName: "Aisha Rahman", practitionerId: "pr_hannah", start: at(wd(3), 15, 0, now), durationMin: 60, type: "Initial consult", status: "confirmed",
      description: {
        summary: "Left knee pain for ~2 weeks after increasing running distance. Pain on stairs and when squatting; mild swelling after runs. No locking or giving way reported.",
        original: "Hi, my left knee has been sore for about 2 weeks since I upped my running for a half marathon. It hurts going down stairs and when I squat, and it puffs up a little after a run. It doesn't lock or give way.",
        capturedAt: hoursAgo(5, now),
      },
      history: [{ at: hoursAgo(26, now), text: "New patient booked online" }, { at: hoursAgo(5, now), text: "Pre-visit description saved to notes by Notify AI" }],
    }),
    base({ id: "ap_michael_prev", contactId: "ct_michael", patientName: "Michael Rossi", practitionerId: "pr_james", start: at(-back, 16, 0, now), durationMin: 30, type: "Standard consult", status: "confirmed" }),
    base({ id: "ap_michael", contactId: "ct_michael", patientName: "Michael Rossi", practitionerId: "pr_james", start: at(wd(4), 8, 30, now), durationMin: 30, type: "Follow-up", status: "unconfirmed" }),
    base({
      id: "ap_sophie", contactId: "ct_sophie", patientName: "Sophie Wright", practitionerId: "pr_priya", start: at(wd(2), 9, 30, now), durationMin: 30, type: "Standard consult", status: "confirmed",
      history: [{ at: hoursAgo(21, now), text: "Booked from waitlist via WhatsApp (slot released by cancellation)" }],
    }),
    base({ id: "ap_ethan", contactId: "ct_ethan", patientName: "Ethan Brooks", practitionerId: "pr_priya", start: at(wd(1), 16, 0, now), durationMin: 30, type: "Follow-up", status: "confirmed" }),
    base({ id: "ap_zoe", contactId: "ct_zoe", patientName: "Zoe Patel", practitionerId: "pr_hannah", start: at(wd(1), 13, 30, now), durationMin: 60, type: "Clinical Pilates", status: "confirmed" }),
    base({ id: "ap_noah", contactId: "ct_noah", patientName: "Noah Kim", practitionerId: "pr_james", start: at(wd(1), 9, 0, now), durationMin: 30, type: "Standard consult", status: "confirmed" }),
  ];
}

export function buildAppointments(now: Date, contactIds: string[]): Appointment[] {
  const rand = seededRandom(20261105);
  const list = scripted(now);
  const taken = new Set(list.map((a) => `${a.practitionerId}|${a.start}`));
  const blockLater = new Set<string>();
  for (const a of list) {
    if (a.durationMin === 60) blockLater.add(`${a.practitionerId}|${new Date(new Date(a.start).getTime() + 30 * 60_000).toISOString()}`);
  }
  const today = startOfDay(now);
  let n = 0;
  for (let offset = -7; offset <= 13; offset += 1) {
    const day = addDays(today, offset);
    const hours = clinicHours(day.getDay());
    if (!hours) continue;
    for (const pr of practitioners) {
      let skipNext = false;
      for (let m = hours[0] * 60; m < hours[1] * 60; m += 30) {
        const start = new Date(day);
        start.setHours(Math.floor(m / 60), m % 60, 0, 0);
        const key = `${pr.id}|${start.toISOString()}`;
        if (skipNext || blockLater.has(key)) { skipNext = false; continue; }
        if (taken.has(key)) {
          const existing = list.find((a) => `${a.practitionerId}|${a.start}` === key);
          skipNext = existing?.durationMin === 60;
          continue;
        }
        if (LUNCH_MINUTES.includes(m)) continue;
        if (rand() > 0.58) continue;
        const total = TYPES.reduce((s, t) => s + t.weight, 0);
        let pick = rand() * total;
        const t = TYPES.find((x) => (pick -= x.weight) < 0) ?? TYPES[0];
        const duration = m + t.duration > hours[1] * 60 ? 30 : t.duration;
        const useContact = rand() < 0.35;
        const contactId = useContact ? contactIds[Math.floor(rand() * contactIds.length)] : undefined;
        const status = pickStatus(start, now, rand());
        const withDescription = start > now && rand() < 0.25;
        n += 1;
        list.push({
          id: `ap_${n}`,
          contactId,
          patientName: contactId ? "" : `${FIRST[Math.floor(rand() * FIRST.length)]} ${LAST[Math.floor(rand() * LAST.length)]}`,
          practitionerId: pr.id,
          start: start.toISOString(),
          durationMin: duration,
          type: duration === 30 && t.duration === 60 ? "Standard consult" : t.type,
          status,
          description: withDescription
            ? { ...DESCRIPTIONS[n % DESCRIPTIONS.length], capturedAt: hoursAgo(10 + (n % 20), now) }
            : undefined,
          history: [{ at: hoursAgo(24 * 10, now), text: "Booked in Cliniko" }],
        });
        taken.add(key);
        if (duration === 60) skipNext = true;
      }
    }
  }
  return list;
}
