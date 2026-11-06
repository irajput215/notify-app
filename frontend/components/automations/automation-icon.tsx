import { BellRing, ListRestart, MessageSquareText, Moon, PhoneMissed, Star, type LucideIcon } from "lucide-react";
import type { Automation } from "@/lib/types";

export const AUTOMATION_ICONS: Record<Automation["key"], LucideIcon> = {
  reminders: BellRing,
  missed_call: PhoneMissed,
  waitlist: ListRestart,
  pre_visit: MessageSquareText,
  feedback: Star,
  out_of_hours: Moon,
};
