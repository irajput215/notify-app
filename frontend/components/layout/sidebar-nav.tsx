"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin } from "lucide-react";
import { useDemoStore } from "@/lib/store/demo-store";
import { cn } from "@/lib/utils";
import { clinicNav, footerNav, mainNav, type NavItem } from "./nav-items";

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const unread = useDemoStore((s) =>
    item.badge === "inbox" ? Object.values(s.conversations).filter((c) => c.unread > 0 || c.tags.includes("needs_human")).length : 0,
  );
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors outline-none hover:bg-sidebar-accent/70 hover:text-sidebar-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
        active && "bg-sidebar-accent text-sidebar-foreground",
      )}
    >
      <Icon className={cn("size-[18px] text-sidebar-foreground/55 transition-colors group-hover:text-primary", active && "text-primary")} />
      <span className="flex-1">{item.label}</span>
      {unread > 0 && (
        <span className="min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-center text-[11px] leading-none font-semibold text-primary-foreground">
          {unread}
        </span>
      )}
    </Link>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      <div className="flex flex-col gap-0.5">
        {mainNav.map((item) => <NavLink key={item.href} item={item} onNavigate={onNavigate} />)}
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Clinic</p>
        {clinicNav.map((item) => <NavLink key={item.href} item={item} onNavigate={onNavigate} />)}
      </div>
      <div className="mt-auto flex flex-col gap-3">
        {footerNav.map((item) => <NavLink key={item.href} item={item} onNavigate={onNavigate} />)}
        <div className="rounded-lg border bg-card/60 p-3 text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5 font-medium text-foreground">
            <MapPin className="size-3.5 text-primary" /> Data hosted in Sydney
          </p>
          <p className="mt-1 leading-relaxed">Messages and patient data stay in Australia.</p>
        </div>
      </div>
    </nav>
  );
}
