"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MessagesSquare, Search, UserRound } from "lucide-react";
import { useDemoStore } from "@/lib/store/demo-store";
import { formatPhone } from "@/lib/format";
import { Input } from "@/components/ui/input";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const contacts = useDemoStore((s) => s.contacts);
  const conversations = useDemoStore((s) => s.conversations);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const convByContact = Object.fromEntries(Object.values(conversations).map((c) => [c.contactId, c.id]));
    return Object.values(contacts)
      .filter((c) => c.name.toLowerCase().includes(q) || c.phone.replace(/\D/g, "").includes(q.replace(/\D/g, "") || "~") || c.tags.some((t) => t.toLowerCase().includes(q)))
      .slice(0, 6)
      .map((c) => ({ contact: c, conversationId: convByContact[c.id] }));
  }, [query, contacts, conversations]);

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => e.key === "Escape" && (e.currentTarget.blur(), setQuery(""))}
        placeholder="Search contacts, phone numbers, tags…"
        aria-label="Search"
        className="h-9 bg-muted/60 pr-12 pl-9 shadow-none dark:bg-input/30"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">
        Ctrl K
      </kbd>
      {open && query.trim() && (
        <div className="absolute top-11 right-0 left-0 z-50 overflow-hidden rounded-xl border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95">
          {results.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No contacts match “{query}”.</p>
          ) : (
            <ul className="p-1">
              {results.map(({ contact, conversationId }) => (
                <li key={contact.id}>
                  <Link
                    href={conversationId ? `/app/inbox?c=${conversationId}` : `/app/contacts?id=${contact.id}`}
                    onClick={() => { setQuery(""); setOpen(false); }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none hover:bg-accent focus-visible:bg-accent"
                  >
                    <span className="flex size-8 items-center justify-center rounded-full bg-muted">
                      {conversationId ? <MessagesSquare className="size-4 text-primary" /> : <UserRound className="size-4 text-muted-foreground" />}
                    </span>
                    <span className="flex-1">
                      <span className="block font-medium">{contact.name}</span>
                      <span className="block text-xs text-muted-foreground">{formatPhone(contact.phone)} · {contact.tags.join(", ")}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{conversationId ? "Open chat" : "View contact"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
