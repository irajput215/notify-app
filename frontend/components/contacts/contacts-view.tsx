"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Upload, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import type { OptInStatus } from "@/lib/types";
import { useDemoStore } from "@/lib/store/demo-store";
import { useNow } from "@/lib/hooks/use-now";
import { formatListTime, formatPhone } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ContactAvatar } from "@/components/shared/contact-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { OptInBadge } from "@/components/shared/opt-in-badge";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { ContactDrawer } from "./contact-drawer";
import { ImportDialog } from "./import-dialog";

export function ContactsView() {
  const params = useSearchParams();
  const now = useNow(60_000);
  const ready = useDemoStore((s) => s.status === "ready");
  const contacts = useDemoStore((s) => s.contacts);
  const team = useDemoStore((s) => s.team);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("all");
  const [optIn, setOptIn] = useState<"all" | OptInStatus>("all");
  const [openId, setOpenId] = useState<string | undefined>(params.get("id") ?? undefined);
  const [importOpen, setImportOpen] = useState(false);

  const all = useMemo(() => Object.values(contacts).sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? "") || a.name.localeCompare(b.name)), [contacts]);
  const tags = useMemo(() => [...new Set(all.flatMap((c) => c.tags))].sort(), [all]);
  const q = query.trim().toLowerCase();
  const rows = all.filter(
    (c) =>
      (!q || c.name.toLowerCase().includes(q) || c.phone.replace(/\D/g, "").includes(q.replace(/\D/g, "") || "~") || (c.email ?? "").includes(q)) &&
      (tag === "all" || c.tags.includes(tag)) &&
      (optIn === "all" || c.optIn === optIn),
  );
  const optedIn = all.filter((c) => c.optIn === "opted_in").length;

  return (
    <PageContainer>
      <PageHeader
        title="Contacts"
        description={ready ? `${all.length} contacts · ${optedIn} opted in · synced with Cliniko` : "Loading…"}
        actions={
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}><Upload /> Import CSV</Button>
            <Button onClick={() => toast.info("Add contact", { description: "Contacts are created automatically from Cliniko and new conversations." })}><UserPlus /> Add contact</Button>
          </>
        }
      />
      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, mobile or email" aria-label="Search contacts" className="pl-9 sm:max-w-sm" />
          </div>
          <Select value={tag} onValueChange={setTag}>
            <SelectTrigger className="w-full sm:w-44" aria-label="Filter by tag"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tags</SelectItem>
              {tags.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={optIn} onValueChange={(v) => setOptIn(v as typeof optIn)}>
            <SelectTrigger className="w-full sm:w-44" aria-label="Filter by opt-in"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any opt-in status</SelectItem>
              <SelectItem value="opted_in">Opted in</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="opted_out">Opted out</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {!ready ? (
          <div className="space-y-3 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Users} title="No contacts match" description="Try a different search or clear the filters." action={<Button variant="outline" size="sm" onClick={() => { setQuery(""); setTag("all"); setOptIn("all"); }}>Clear filters</Button>} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Name</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Opt-in</TableHead>
                <TableHead className="hidden lg:table-cell">Assigned</TableHead>
                <TableHead>Last message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow
                  key={c.id}
                  tabIndex={0}
                  onClick={() => setOpenId(c.id)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOpenId(c.id))}
                  className="cursor-pointer outline-none focus-visible:bg-accent"
                  aria-label={`Open ${c.name}`}
                >
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <ContactAvatar name={c.name} className="size-8 text-xs" />
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{formatPhone(c.phone)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">{c.tags.slice(0, 2).map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}{c.tags.length > 2 && <Badge variant="outline">+{c.tags.length - 2}</Badge>}</div>
                  </TableCell>
                  <TableCell><OptInBadge status={c.optIn} /></TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{team.find((t) => t.id === c.assignedTo)?.name ?? "–"}</TableCell>
                  <TableCell className="max-w-72">
                    {c.lastMessageAt ? (
                      <div className="min-w-0">
                        <p className="truncate text-sm">{c.lastMessagePreview}</p>
                        <p className="text-xs text-muted-foreground">{formatListTime(c.lastMessageAt, now)}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No messages</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      <ContactDrawer contactId={openId} onClose={() => setOpenId(undefined)} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </PageContainer>
  );
}
