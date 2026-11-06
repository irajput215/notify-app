import { Ban, Bot, CalendarCheck, CalendarClock, CalendarX, Hand, PhoneMissed, UserPlus } from "lucide-react";
import type { ConversationTag } from "@/lib/types";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

export const TAG_META: Record<ConversationTag, { label: string; variant: BadgeVariant; icon: typeof Bot }> = {
  ai_handled: { label: "AI handled", variant: "brand", icon: Bot },
  needs_human: { label: "Needs human", variant: "warning", icon: Hand },
  rescheduled: { label: "Rescheduled", variant: "violet", icon: CalendarClock },
  new_contact: { label: "New contact", variant: "info", icon: UserPlus },
  opted_out: { label: "Opted out", variant: "muted", icon: Ban },
  confirmed: { label: "Confirmed", variant: "success", icon: CalendarCheck },
  missed_call: { label: "Missed call", variant: "outline", icon: PhoneMissed },
  cancelled: { label: "Cancelled", variant: "destructive", icon: CalendarX },
};

export function ConversationTagBadge({ tag, withIcon = true }: { tag: ConversationTag; withIcon?: boolean }) {
  const meta = TAG_META[tag];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant} className="animate-in fade-in-0 zoom-in-95">
      {withIcon && <Icon />}
      {meta.label}
    </Badge>
  );
}
