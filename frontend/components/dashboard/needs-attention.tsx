"use client";

import Link from "next/link";
import { ChevronRight, PartyPopper } from "lucide-react";
import { useDemoStore } from "@/lib/store/demo-store";
import { formatRelative } from "@/lib/format";
import { useNow } from "@/lib/hooks/use-now";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactAvatar } from "@/components/shared/contact-avatar";
import { EmptyState } from "@/components/shared/empty-state";

export function NeedsAttention() {
  const now = useNow();
  const ready = useDemoStore((s) => s.status === "ready");
  const conversations = useDemoStore((s) => s.conversations);
  const contacts = useDemoStore((s) => s.contacts);
  const team = useDemoStore((s) => s.team);
  const items = Object.values(conversations)
    .filter((c) => c.tags.includes("needs_human") || c.unread > 0)
    .sort((a, b) => Number(b.tags.includes("needs_human")) - Number(a.tags.includes("needs_human")) || b.updatedAt.localeCompare(a.updatedAt));

  if (!ready) return <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>;
  if (!items.length) return <EmptyState icon={PartyPopper} title="All caught up" description="Nothing needs a human right now." className="py-8" />;

  return (
    <ul className="-mx-2 divide-y">
      {items.map((c) => {
        const contact = contacts[c.contactId];
        const owner = team.find((t) => t.id === c.assignedTo);
        return (
          <li key={c.id}>
            <Link href={`/app/inbox?c=${c.id}`} className="flex items-center gap-3 rounded-lg px-2 py-3 outline-none hover:bg-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/50">
              <ContactAvatar name={contact.name} className="size-9" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{contact.name}</span>
                  {c.tags.includes("needs_human") ? (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">Needs human</span>
                  ) : (
                    <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">Unread</span>
                  )}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{c.preview}</span>
              </span>
              <span className="hidden shrink-0 text-right text-xs text-muted-foreground sm:block">
                {formatRelative(c.updatedAt, now)}
                <span className="block">{owner ? owner.name.split(" ")[0] : "Unassigned"}</span>
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
