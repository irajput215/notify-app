"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDemoStore } from "@/lib/store/demo-store";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { BillingSettings } from "./billing-settings";
import { NumberSettings } from "./number-settings";
import { PrivacySettings } from "./privacy-settings";
import { TeamSettings } from "./team-settings";
import { WorkspaceSettings } from "./workspace-settings";

const TABS = [
  { id: "workspace", label: "Workspace" },
  { id: "team", label: "Team & roles" },
  { id: "number", label: "WhatsApp number" },
  { id: "billing", label: "Billing" },
  { id: "privacy", label: "Data & privacy" },
];

export function SettingsView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const workspace = useDemoStore((s) => s.workspace);
  const team = useDemoStore((s) => s.team);
  const tab = TABS.some((t) => t.id === params.get("tab")) ? params.get("tab")! : "workspace";

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader title="Settings" description="Workspace, team, messaging number, billing and privacy." />
      <Tabs value={tab} onValueChange={(v) => router.replace(`${pathname}?tab=${v}`, { scroll: false })}>
        <TabsList className="h-auto flex-wrap justify-start">
          {TABS.map((t) => <TabsTrigger key={t.id} value={t.id} className="flex-none">{t.label}</TabsTrigger>)}
        </TabsList>
        {!workspace ? (
          <Skeleton className="mt-2 h-96 w-full rounded-xl" />
        ) : (
          <>
            <TabsContent value="workspace"><WorkspaceSettings workspace={workspace} /></TabsContent>
            <TabsContent value="team"><TeamSettings team={team} /></TabsContent>
            <TabsContent value="number"><NumberSettings workspace={workspace} /></TabsContent>
            <TabsContent value="billing"><BillingSettings /></TabsContent>
            <TabsContent value="privacy"><PrivacySettings workspace={workspace} /></TabsContent>
          </>
        )}
      </Tabs>
    </PageContainer>
  );
}
