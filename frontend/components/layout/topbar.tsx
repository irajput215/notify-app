"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, Menu } from "lucide-react";
import { useDemoStore } from "@/lib/store/demo-store";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GlobalSearch } from "./global-search";
import { SidebarNav } from "./sidebar-nav";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function Topbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const workspace = useDemoStore((s) => s.workspace);
  const needsHuman = useDemoStore((s) => Object.values(s.conversations).filter((c) => c.tags.includes("needs_human")).length);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-6">
      <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
        <Menu />
      </Button>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 gap-0 bg-sidebar p-0">
          <SheetTitle className="flex h-16 items-center border-b px-5"><Logo /></SheetTitle>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="hidden min-w-0 items-center gap-2.5 lg:flex">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-xs font-bold text-accent-foreground">HP</span>
        <span className="leading-tight">
          <span className="block truncate text-sm font-semibold">{workspace?.name ?? "Loading…"}</span>
          <span className="block truncate text-xs text-muted-foreground">{workspace?.location ?? ""}</span>
        </span>
      </div>

      <div className="flex flex-1 justify-center px-1 lg:px-8">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link href="/app/inbox?filter=needs_human" aria-label={`${needsHuman} conversations need a human`}>
                <Bell className="size-[18px]" />
                {needsHuman > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
                    {needsHuman}
                  </span>
                )}
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{needsHuman} need a human</TooltipContent>
        </Tooltip>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
