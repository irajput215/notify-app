import type { Practitioner, StaffMember, Workspace } from "@/lib/types";

/** All names, numbers and businesses below are fictional. */
export const workspace: Workspace = {
  id: "ws_harbourside",
  name: "Harbourside Physio",
  location: "Parramatta NSW",
  timezone: "Australia/Sydney",
  phone: "(02) 5550 4321",
  whatsappNumber: "+61 491 570 006",
  displayName: "Harbourside Physio",
  website: "harbourside-physio.example",
  address: "Level 2, 18 Riverbank Lane, Parramatta NSW 2150",
  abn: "00 000 000 000",
  qualityRating: "High",
  messagingTier: "Tier 2 · 10,000 business-initiated conversations / 24h",
  hostingRegion: "Sydney, Australia (ap-southeast-2)",
  retentionMonths: 24,
  plan: "Growth",
};

export const CURRENT_USER_ID = "st_mia";

export const staff: StaffMember[] = [
  {
    id: "st_hannah",
    name: "Hannah Lowe",
    email: "hannah@harbourside-physio.example",
    role: "Owner",
    title: "Principal Physiotherapist",
    avatarClass: "bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-200",
    online: true,
  },
  {
    id: "st_mia",
    name: "Mia Thompson",
    email: "mia@harbourside-physio.example",
    role: "Admin",
    title: "Front Desk Lead",
    avatarClass: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
    online: true,
  },
  {
    id: "st_sam",
    name: "Sam Nguyen",
    email: "sam@harbourside-physio.example",
    role: "Agent",
    title: "Receptionist",
    avatarClass: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200",
    online: false,
  },
  {
    id: "st_james",
    name: "James Okafor",
    email: "james@harbourside-physio.example",
    role: "Agent",
    title: "Physiotherapist",
    avatarClass: "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200",
    online: true,
  },
  {
    id: "st_priya",
    name: "Priya Raman",
    email: "priya@harbourside-physio.example",
    role: "Agent",
    title: "Physiotherapist",
    avatarClass: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200",
    online: false,
  },
];

export const practitioners: Practitioner[] = [
  { id: "pr_hannah", name: "Hannah Lowe", short: "Hannah", title: "Principal Physiotherapist", colorClass: "bg-teal-500" },
  { id: "pr_james", name: "James Okafor", short: "James", title: "Physiotherapist", colorClass: "bg-violet-500" },
  { id: "pr_priya", name: "Priya Raman", short: "Priya", title: "Sports Physiotherapist", colorClass: "bg-rose-500" },
];
