"use client";

import { useEffect } from "react";
import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { useDemoStore } from "@/lib/store/demo-store";
import { formatDate, formatPhone, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactAvatar } from "@/components/shared/contact-avatar";
import { OptInBadge } from "@/components/shared/opt-in-badge";

export function ContactDrawer({ contactId, onClose }: { contactId?: string; onClose: () => void }) {
  const contact = useDemoStore((s) => (contactId ? s.contacts[contactId] : undefined));
  const conversation = useDemoStore((s) => (contactId ? Object.values(s.conversations).find((c) => c.contactId === contactId) : undefined));
  const messages = useDemoStore((s) => (conversation ? s.messages[conversation.id] : undefined));
  const loadMessages = useDemoStore((s) => s.loadMessages);
  const team = useDemoStore((s) => s.team);
  const convId = conversation?.id;

  useEffect(() => {
    if (convId) void loadMessages(convId);
  }, [convId, loadMessages]);

  return (
    <Sheet open={Boolean(contact)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        {contact && (
          <>
            <SheetHeader className="flex-row items-center gap-3">
              <ContactAvatar name={contact.name} className="size-12" />
              <div>
                <SheetTitle className="text-lg">{contact.name}</SheetTitle>
                <SheetDescription>{formatPhone(contact.phone)}</SheetDescription>
              </div>
            </SheetHeader>
            <div className="space-y-5 px-5 pb-6">
              <div className="flex flex-wrap gap-1.5">
                <OptInBadge status={contact.optIn} />
                {contact.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border p-4 text-sm">
                <div><dt className="text-xs text-muted-foreground">Email</dt><dd className="truncate font-medium">{contact.email ?? "–"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Suburb</dt><dd className="font-medium">{contact.suburb ?? "–"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Opt-in source</dt><dd className="font-medium">{contact.optInSource}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Added</dt><dd className="font-medium">{formatDate(contact.createdAt)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Cliniko ID</dt><dd className="font-medium">{contact.clinikoPatientId ?? "Not a patient"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Assigned</dt><dd className="font-medium">{team.find((t) => t.id === contact.assignedTo)?.name ?? "Unassigned"}</dd></div>
              </dl>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Conversation history</h3>
                  {conversation && <Button size="sm" variant="ghost" asChild><Link href={`/app/inbox?c=${conversation.id}`}><MessagesSquare /> Open in inbox</Link></Button>}
                </div>
                {!conversation ? (
                  <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">No messages with {contact.name.split(" ")[0]} yet.</p>
                ) : !messages ? (
                  <div className="space-y-2"><Skeleton className="h-10 w-3/4" /><Skeleton className="ml-auto h-10 w-2/3" /></div>
                ) : (
                  <ul className="space-y-2 rounded-xl bg-chat-bg p-3">
                    {messages.filter((m) => m.kind !== "event").map((m) => (
                      <li key={m.id} className={cn("flex", m.author === "customer" ? "justify-start" : "justify-end")}>
                        <div className={cn("max-w-[85%] rounded-xl px-3 py-1.5 text-xs shadow-xs", m.kind === "note" ? "border border-dashed border-note-border bg-note text-note-foreground" : m.author === "customer" ? "bg-bubble-in" : m.author === "ai" ? "bg-bubble-ai" : "bg-bubble-out")}>
                          <p className="line-clamp-4 whitespace-pre-wrap">{m.body}</p>
                          <p className="mt-0.5 text-right text-[10px] text-muted-foreground">
                            {m.kind === "note" ? "Note · " : m.author === "ai" ? "AI · " : ""}{formatDate(m.createdAt)} {formatTime(m.createdAt)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
