"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Workflow } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { AiSettingsView } from "@/components/ai/ai-settings-view";
import { AutomationsFlows } from "./automations-flows";

export function AutomationsView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = params.get("tab") === "ai" ? "ai" : "flows";
  return (
    <PageContainer>
      <PageHeader title="Automations" description="Ready-made clinic workflows and the AI assistant that runs them. Turn on what you need." />
      <Tabs value={tab} onValueChange={(v) => router.replace(v === "ai" ? `${pathname}?tab=ai` : pathname, { scroll: false })}>
        <TabsList>
          <TabsTrigger value="flows"><Workflow /> Flows</TabsTrigger>
          <TabsTrigger value="ai"><Sparkles /> AI assistant</TabsTrigger>
        </TabsList>
        <TabsContent value="flows" className="pt-2"><AutomationsFlows /></TabsContent>
        <TabsContent value="ai" className="pt-2"><AiSettingsView /></TabsContent>
      </Tabs>
    </PageContainer>
  );
}
