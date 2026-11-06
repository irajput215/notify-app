import type { Contact, OptInStatus } from "@/lib/types";
import { daysAgo } from "@/lib/time";

/**
 * Fictional contacts. The first 29 use mobile numbers that ACMA lists for use in
 * fiction; the remainder are made-up numbers in the same 0491 57x block.
 */
const FICTIONAL_MOBILES = [
  "0491570156", "0491570157", "0491570158", "0491570159", "0491570110", "0491570313",
  "0491570737", "0491571266", "0491571491", "0491571804", "0491572549", "0491572665",
  "0491572983", "0491573770", "0491573087", "0491574118", "0491574632", "0491575254",
  "0491575789", "0491576398", "0491576801", "0491577426", "0491577644", "0491578957",
  "0491578148", "0491578888", "0491579212", "0491579760", "0491579455",
];

function phoneFor(i: number) {
  const local = FICTIONAL_MOBILES[i] ?? `049157${(9100 + i * 13).toString().slice(-4)}`;
  return `+61${local.slice(1)}`;
}
type Row = [id: string, name: string, tags: string[], optIn?: OptInStatus, isPatient?: boolean, suburb?: string];

const rows: Row[] = [
  ["ct_olivia", "Olivia Bennett", ["Patient", "Lower back"], "opted_in", true, "Harris Park"],
  ["ct_liam", "Liam Carter", ["Patient", "Shoulder"], "opted_in", true, "Westmead"],
  ["ct_grace", "Grace Nguyen", ["Patient", "Post-surgery"], "opted_in", true, "Rosehill"],
  ["ct_tom", "Tom Fitzgerald", ["Patient", "Missed call"], "opted_in", true, "North Parramatta"],
  ["ct_aisha", "Aisha Rahman", ["New patient", "Knee"], "opted_in", true, "Granville"],
  ["ct_michael", "Michael Rossi", ["Patient", "Ankle", "Priority"], "opted_in", true, "Merrylands"],
  ["ct_daniel", "Daniel Walsh", ["Patient"], "opted_out", true, "Wentworthville"],
  ["ct_chloe", "Chloe Martin", ["Enquiry"], "opted_in", false, "Parramatta"],
  ["ct_ethan", "Ethan Brooks", ["Patient", "Sports"], "opted_in", true, "Northmead"],
  ["ct_zoe", "Zoe Patel", ["Patient", "Pilates"], "opted_in", true, "Parramatta"],
  ["ct_noah", "Noah Kim", ["Patient", "Neck"], "opted_in", true, "Dundas"],
  ["ct_isla", "Isla Murphy", ["Patient", "Pregnancy"], "opted_in", true, "Ermington"],
  ["ct_ruby", "Ruby Clarke", ["Patient", "Pilates"], "opted_in", true, "Harris Park"],
  ["ct_lucas", "Lucas Silva", ["Patient", "Sports"], "opted_in", true, "Westmead"],
  ["ct_sophie", "Sophie Wright", ["Patient", "Lower back"], "opted_in", true, "Oatlands"],
  ["ct_oscar", "Oscar Huang", ["Patient", "Workers comp"], "opted_in", true, "Granville"],
  ["ct_amelia", "Amelia Jones", ["Patient", "Post-surgery"], "opted_in", true, "Rydalmere"],
  ["ct_henry", "Henry Doyle", ["Patient", "Knee"], "pending", true, "Telopea"],
  ["ct_ella", "Ella Fraser", ["Patient", "Pilates"], "opted_in", true, "Carlingford"],
  ["ct_leo", "Leo Martinez", ["Patient", "Sports"], "opted_in", true, "Parramatta"],
  ["ct_matilda", "Matilda Evans", ["Patient", "Shoulder"], "opted_in", true, "Mays Hill"],
  ["ct_archie", "Archie Bell", ["Patient", "DVA"], "opted_in", true, "Toongabbie"],
  ["ct_charlotte", "Charlotte Ng", ["Patient", "Neck"], "opted_in", true, "Pendle Hill"],
  ["ct_william", "William Tran", ["Patient", "Workers comp"], "opted_in", true, "Guildford"],
  ["ct_harper", "Harper Singh", ["Patient", "Pilates"], "opted_in", true, "Parramatta"],
  ["ct_mason", "Mason Reid", ["Patient", "Sports"], "opted_out", true, "Constitution Hill"],
  ["ct_evie", "Evie Campbell", ["Patient", "Pregnancy"], "opted_in", true, "Winston Hills"],
  ["ct_hudson", "Hudson Parker", ["Patient", "Knee"], "opted_in", true, "Baulkham Hills"],
  ["ct_ivy", "Ivy Sullivan", ["Patient", "Lower back"], "opted_in", true, "Silverwater"],
  ["ct_lachlan", "Lachlan Ward", ["Patient", "Sports"], "opted_in", true, "Northmead"],
  ["ct_freya", "Freya Edwards", ["Patient", "Pilates"], "pending", true, "Rosehill"],
  ["ct_xavier", "Xavier Costa", ["Patient", "Ankle"], "opted_in", true, "Parramatta"],
  ["ct_sienna", "Sienna Murray", ["Patient", "Shoulder"], "opted_in", true, "Ermington"],
  ["ct_kai", "Kai Anderson", ["Patient", "Sports"], "opted_in", true, "Westmead"],
  ["ct_layla", "Layla Hassan", ["Patient", "Neck"], "opted_in", true, "Granville"],
  ["ct_toby", "Toby Russo", ["Patient", "DVA"], "opted_in", true, "Merrylands"],
  ["ct_mila", "Mila Kovac", ["Enquiry"], "opted_in", false, "Harris Park"],
  ["ct_riley", "Riley O'Brien", ["Patient", "Workers comp"], "opted_in", true, "Wentworthville"],
  ["ct_ava", "Ava Delaney", ["Patient", "Lower back"], "opted_in", true, "Dundas Valley"],
  ["ct_samuel", "Samuel Yip", ["Patient", "Knee"], "opted_in", true, "Carlingford"],
  ["ct_hamish", "Hamish Grant", ["Patient", "Shoulder"], "opted_in", true, "North Rocks"],
  ["ct_nina", "Nina Petrovic", ["Enquiry"], "pending", false, "Parramatta"],
];

const SOURCES = ["Cliniko import", "Online booking form", "Reception (verbal consent)", "WhatsApp opt-in link"];

export function buildContacts(now: Date): Contact[] {
  return rows.map(([id, name, tags, optIn = "opted_in", isPatient = true, suburb], i) => {
    const first = name.split(" ")[0].toLowerCase();
    const last = name.split(" ").slice(-1)[0].toLowerCase().replace(/[^a-z]/g, "");
    return {
      id,
      name,
      phone: phoneFor(i),
      email: `${first}.${last}@mail.example`,
      tags,
      optIn,
      optInSource: SOURCES[i % SOURCES.length],
      optInAt: optIn === "pending" ? undefined : daysAgo(30 + i * 5, now),
      createdAt: daysAgo(40 + i * 9, now),
      isPatient,
      clinikoPatientId: isPatient ? `CLK-${(48210 + i * 37).toString()}` : undefined,
      dateOfBirth: isPatient ? `${String((i % 27) + 1).padStart(2, "0")}/${String((i % 12) + 1).padStart(2, "0")}/${1958 + ((i * 7) % 45)}` : undefined,
      suburb: suburb ? `${suburb} NSW` : undefined,
      assignedTo: undefined,
    };
  });
}
