"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Globe, LogOut, Moon, RotateCcw, Settings, Sun } from "lucide-react";
import { useCurrentUser, useDemoStore } from "@/lib/store/demo-store";
import { initials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const user = useCurrentUser();
  const reset = useDemoStore((s) => s.reset);
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full p-0.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:rounded-lg sm:py-1 sm:pr-2 sm:pl-1 sm:hover:bg-accent"
        aria-label="Open user menu"
      >
        <Avatar className="size-8">
          <AvatarFallback className={user?.avatarClass}>{user ? initials(user.name) : ""}</AvatarFallback>
        </Avatar>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-medium">{user?.name ?? "…"}</span>
          <span className="block text-xs text-muted-foreground">{user?.role}</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <span className="block text-sm font-medium text-foreground">{user?.name}</span>
          <span className="block font-normal">{user?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app/settings"><Settings /> Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
          {resolvedTheme === "dark" ? <Sun /> : <Moon />} {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void reset()}>
          <RotateCcw /> Reset demo data
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/"><Globe /> Back to website</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/"><LogOut /> Sign out</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
