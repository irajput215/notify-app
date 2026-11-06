"use client";

import { BadgeCheck, CircleCheck, Gauge } from "lucide-react";
import { toast } from "sonner";
import type { Workspace } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Field, Stat } from "./field";

export function NumberSettings({ workspace }: { workspace: Workspace }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp business number</CardTitle>
          <CardDescription>Connected through the official WhatsApp Business Platform.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Phone number">{workspace.whatsappNumber}</Stat>
          <Stat label="Display name"><span className="flex items-center gap-1.5">{workspace.displayName} <BadgeCheck className="size-4 text-primary" /></span></Stat>
          <Stat label="Quality rating"><Badge variant="success" className="text-sm"><CircleCheck /> {workspace.qualityRating}</Badge></Stat>
          <Stat label="Messaging limit"><span className="flex items-center gap-1.5"><Gauge className="size-4 text-primary" /> Tier 2</span></Stat>
        </CardContent>
        <CardContent>
          <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            {workspace.messagingTier}. Your quality rating is based on how customers respond to your messages. Keep it high by messaging people who opted in and honouring STOP straight away.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Business profile</CardTitle>
          <CardDescription>What patients see when they tap your name.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bp-about">About</Label>
            <Textarea id="bp-about" defaultValue="Physiotherapy, Clinical Pilates and sports injury care in Parramatta. Message us to book or reschedule." />
          </div>
          <Field id="bp-addr" label="Address" defaultValue={workspace.address} />
          <Field id="bp-hours" label="Hours" defaultValue="Mon–Fri 8am–6pm · Sat 8am–12pm" />
          <Field id="bp-email" label="Email" defaultValue={`hello@${workspace.website}`} />
          <Field id="bp-web" label="Website" defaultValue={`https://${workspace.website}`} />
        </CardContent>
        <CardFooter className="justify-end border-t pt-5"><Button onClick={() => toast.success("Business profile updated")}>Save profile</Button></CardFooter>
      </Card>
    </div>
  );
}
