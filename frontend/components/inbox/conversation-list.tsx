"use client";

import { useMemo, useState } from "react";
import { Inbox, Search } from "lucide-react";
import type { InboxFilter } from "@/lib/types";
import { useDemoStore } from "@/lib/store/demo-store";
import { useNow } from "@/lib/hooks/use-now";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ConversationItem } from "./conversation-item";

const FILTERS: { id: InboxFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "needs_human", label: "Needs human" },
  { id: "mine", label: "Assigned to me" },
  { id: "ai_handled", label: "AI handled" },
];

export function ConversationList({
  selectedId,
  filter,
  onFilterChange,
  onSelect,
}: {
  selectedId?: string;
  filter: InboxFilter;
  onFilterChange: (f: InboxFilter) => void;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const now = useNow();
  const ready = useDemoStore((s) => s.status === "ready");
  const conversations = useDemoStore((s) => s.conversations);
  const contacts = useDemoStore((s) => s.contacts);
  const typing = useDemoStore((s) => s.typing);
  const me = useDemoStore((s) => s.currentUserId);

  const sorted = useMemo(
    () => Object.values(conversations).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [conversations],
  );
  const matches = (f: InboxFilter) => (c: (typeof sorted)[number]) =>
    f === "all" ? true : f === "mine" ? c.assignedTo === me : c.tags.includes(f);
  const counts = Object.fromEntries(FILTERS.map((f) => [f.id, sorted.filter(matches(f.id)).length]));
  const q = query.trim().toLowerCase();
  const visible = sorted
    .filter(matches(filter))
    .filter((c) => !q || contacts[c.contactId]?.name.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-3 border-b p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search conversations" aria-label="Search conversations" className="pl-9" />
        </div>
        <div role="tablist" aria-label="Filter conversations" className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              type="button"
              aria-selected={filter === f.id}
              onClick={() => onFilterChange(f.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                filter === f.id ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
              <span className={cn("rounded-full px-1.5 text-[10px]", filter === f.id ? "bg-primary-foreground/20" : "bg-muted")}>
                {ready ? counts[f.id] : "–"}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {!ready ? (
          <div className="space-y-1 p-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-2">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState icon={Inbox} title="No conversations here" description={q ? `Nothing matches “${query}”.` : "When a conversation matches this filter it will show up here."} />
        ) : (
          <ul className="space-y-0.5">
            {visible.map((c) => (
              <li key={c.id} className="animate-in fade-in-0">
                <ConversationItem
                  conversation={c}
                  contact={contacts[c.contactId]}
                  selected={c.id === selectedId}
                  typing={Boolean(typing[c.id])}
                  now={now}
                  onSelect={() => onSelect(c.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
