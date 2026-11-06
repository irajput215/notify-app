"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RotateCcw, Smartphone } from "lucide-react";
import type { InboxFilter } from "@/lib/types";
import { useDemoStore } from "@/lib/store/demo-store";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ChatThread } from "./chat-thread";
import { ContactPanel } from "./contact-panel";
import { ConversationList } from "./conversation-list";
import { SimulatorPanel } from "@/components/simulator/simulator-panel";

const FILTERS: InboxFilter[] = ["all", "needs_human", "mine", "ai_handled"];

export function InboxView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const ready = useDemoStore((s) => s.status === "ready");
  const conversations = useDemoStore((s) => s.conversations);
  const contacts = useDemoStore((s) => s.contacts);
  const simulatorOpen = useDemoStore((s) => s.simulatorOpen);
  const setSimulatorOpen = useDemoStore((s) => s.setSimulatorOpen);
  const reset = useDemoStore((s) => s.reset);
  const resetting = useDemoStore((s) => s.resetting);
  const [panelOpen, setPanelOpen] = useState(false);
  const isLarge = useMediaQuery("(min-width: 1024px)");

  const paramFilter = params.get("filter") as InboxFilter | null;
  const filter: InboxFilter = paramFilter && FILTERS.includes(paramFilter) ? paramFilter : "all";
  const selectedId = params.get("c") ?? undefined;

  const setParams = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(params.toString());
      Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  // Open the most recent conversation by default on desktop.
  useEffect(() => {
    if (!ready || selectedId || window.innerWidth < 768) return;
    const latest = Object.values(conversations).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    if (latest) setParams({ c: latest.id });
  }, [ready, selectedId, conversations, setParams]);

  const selected = selectedId ? conversations[selectedId] : undefined;
  const contact = selected ? contacts[selected.contactId] : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b bg-card px-4 py-2.5">
        <h1 className="text-base font-semibold">Inbox</h1>
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {ready ? `${Object.keys(conversations).length} conversations` : "Loading…"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => void reset()} disabled={resetting}>
            <RotateCcw className={cn(resetting && "animate-spin")} /> <span className="hidden sm:inline">Reset demo</span>
          </Button>
          <Button
            size="sm"
            variant={simulatorOpen ? "secondary" : "default"}
            onClick={() => {
              const open = !simulatorOpen;
              setSimulatorOpen(open);
              if (open) setParams({ c: "cv_olivia", filter: undefined });
            }}
          >
            <Smartphone /> {simulatorOpen ? "Close simulator" : "Simulate customer"}
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className={cn("w-full shrink-0 border-r bg-card md:w-[320px]", selectedId ? "hidden md:block" : "block")}>
          <ConversationList
            selectedId={selectedId}
            filter={filter}
            onFilterChange={(f) => setParams({ filter: f === "all" ? undefined : f })}
            onSelect={(id) => setParams({ c: id })}
          />
        </aside>
        <section className={cn("min-w-0 flex-1", selectedId ? "block" : "hidden md:block")} aria-label="Conversation">
          <ChatThread conversationId={selectedId} onBack={() => setParams({ c: undefined })} onTogglePanel={() => setPanelOpen(true)} />
        </section>
        {simulatorOpen ? (
          <aside className="hidden w-[380px] shrink-0 border-l bg-muted/40 lg:block" aria-label="Customer simulator">
            <SimulatorPanel />
          </aside>
        ) : (
          selected && contact && (
            <aside className="hidden w-[300px] shrink-0 border-l bg-card xl:block" aria-label="Contact details">
              <ContactPanel contact={contact} conversation={selected} />
            </aside>
          )
        )}
      </div>

      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent className="w-[340px] p-0">
          <SheetTitle className="sr-only">Contact details</SheetTitle>
          {selected && contact && <ContactPanel contact={contact} conversation={selected} />}
        </SheetContent>
      </Sheet>
      {simulatorOpen && !isLarge && (
        <Sheet open onOpenChange={(o) => !o && setSimulatorOpen(false)}>
          <SheetContent className="w-full max-w-[400px] bg-muted p-0">
            <SheetTitle className="sr-only">Customer simulator</SheetTitle>
            <SimulatorPanel />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
