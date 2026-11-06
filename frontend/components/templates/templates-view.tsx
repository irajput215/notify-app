"use client";

import { useEffect, useState } from "react";
import { FileText, Plus } from "lucide-react";
import type { MessageTemplate, TemplateStatus } from "@/lib/types";
import { subscribe, templatesApi } from "@/lib/services";
import { useAsync } from "@/lib/hooks/use-async";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { TemplateEditor } from "./template-editor";
import { CategoryBadge, TemplateStatusBadge } from "./template-status";

const FILTERS: ("All" | TemplateStatus)[] = ["All", "Approved", "Pending", "Rejected", "Draft"];

export function TemplatesView() {
  const { data, setData, loading } = useAsync(templatesApi.listTemplates);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [editing, setEditing] = useState<{ open: boolean; template?: MessageTemplate; key: number }>({ open: false, key: 0 });

  useEffect(
    () =>
      subscribe((e) => {
        if (e.type === "template.updated") setData((list) => list?.map((t) => (t.id === e.template.id ? e.template : t)));
      }),
    [setData],
  );

  const upsert = (t: MessageTemplate) =>
    setData((list) => (list?.some((x) => x.id === t.id) ? list.map((x) => (x.id === t.id ? t : x)) : [t, ...(list ?? [])]));
  const rows = (data ?? []).filter((t) => filter === "All" || t.status === filter);

  return (
    <PageContainer>
      <PageHeader
        title="Templates"
        description="Pre-approved messages for reminders, follow-ups and campaigns. Required to message someone outside the 24-hour window."
        actions={<Button onClick={() => setEditing((e) => ({ open: true, template: undefined, key: e.key + 1 }))}><Plus /> New template</Button>}
      />
      <Card className="gap-0 py-0">
        <div className="flex flex-wrap gap-1 border-b p-3" role="tablist" aria-label="Filter templates by status">
          {FILTERS.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                filter === f ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f} <span className="text-muted-foreground">{data ? (f === "All" ? data.length : data.filter((t) => t.status === f).length) : ""}</span>
            </button>
          ))}
        </div>
        {loading ? (
          <div className="space-y-3 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={FileText} title={`No ${filter.toLowerCase()} templates`} description="Create a template to send reminders and campaigns." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Language</TableHead>
                <TableHead className="hidden md:table-cell">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => (
                <TableRow
                  key={t.id}
                  tabIndex={0}
                  className="cursor-pointer outline-none focus-visible:bg-accent"
                  onClick={() => setEditing((e) => ({ open: true, template: t, key: e.key + 1 }))}
                  onKeyDown={(ev) => ev.key === "Enter" && setEditing((e) => ({ open: true, template: t, key: e.key + 1 }))}
                >
                  <TableCell className="max-w-md pl-4 whitespace-normal">
                    <p className="font-mono text-[13px] font-medium">{t.name}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{t.body}</p>
                    {t.status === "Rejected" && t.rejectionReason && <p className="mt-1 line-clamp-2 text-xs text-destructive">{t.rejectionReason}</p>}
                  </TableCell>
                  <TableCell><CategoryBadge category={t.category} /></TableCell>
                  <TableCell><TemplateStatusBadge status={t.status} /></TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{t.language}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{formatDate(t.updatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      <TemplateEditor
        key={editing.key}
        template={editing.template}
        open={editing.open}
        onOpenChange={(open) => setEditing((e) => ({ ...e, open }))}
        onSaved={upsert}
      />
    </PageContainer>
  );
}
