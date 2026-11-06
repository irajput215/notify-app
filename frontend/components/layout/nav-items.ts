import {
  Blocks, CalendarDays, FileText, LayoutDashboard, Megaphone, MessagesSquare, Settings, Users, Workflow,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: "inbox";
}

export const mainNav: NavItem[] = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/inbox", label: "Inbox", icon: MessagesSquare, badge: "inbox" },
  { href: "/app/contacts", label: "Contacts", icon: Users },
  { href: "/app/templates", label: "Templates", icon: FileText },
  { href: "/app/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/app/automations", label: "Automations", icon: Workflow },
  { href: "/app/integrations", label: "Integrations", icon: Blocks },
];

export const clinicNav: NavItem[] = [
  { href: "/app/clinic/appointments", label: "Appointments", icon: CalendarDays },
];

export const footerNav: NavItem[] = [{ href: "/app/settings", label: "Settings", icon: Settings }];
