import type { Campaign, Segment } from "@/lib/types";
import { at, daysAgo } from "@/lib/time";

export const segments: Segment[] = [
  { id: "sg_all", name: "All contacts", description: "Everyone in your contact list", tags: [] },
  { id: "sg_pilates", name: "Pilates clients", description: "Contacts tagged Pilates", tags: ["Pilates"] },
  { id: "sg_sports", name: "Sports patients", description: "Contacts tagged Sports", tags: ["Sports"] },
  { id: "sg_back", name: "Lower back patients", description: "Contacts tagged Lower back", tags: ["Lower back"] },
  { id: "sg_lapsed", name: "Patients", description: "All contacts tagged Patient", tags: ["Patient"] },
];

export function buildCampaigns(now: Date): Campaign[] {
  return [
    { id: "cp_winter", name: "Winter wellness check-in", templateId: "tp_winter", segmentId: "sg_lapsed", status: "Sent", scheduledAt: daysAgo(3, now), recipients: 31, excluded: 2, delivered: 31, read: 27, replied: 9 },
    { id: "cp_pilates", name: "New Pilates timetable", templateId: "tp_pilates", segmentId: "sg_pilates", status: "Draft", scheduledAt: at(4, 9, 0, now), recipients: 6, excluded: 0, delivered: 0, read: 0, replied: 0 },
    { id: "cp_sports", name: "Pre-season screening", templateId: "tp_winter", segmentId: "sg_sports", status: "Scheduled", scheduledAt: at(2, 10, 0, now), recipients: 6, excluded: 1, delivered: 0, read: 0, replied: 0 },
  ];
}
