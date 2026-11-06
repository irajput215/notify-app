"use client";

import { toast } from "sonner";
import type { Workspace } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "./field";

export function WorkspaceSettings({ workspace }: { workspace: Workspace }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace profile</CardTitle>
        <CardDescription>Shown to your team and used in AI replies.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field id="ws-name" label="Business name" defaultValue={workspace.name} />
        <Field id="ws-loc" label="Location" defaultValue={workspace.location} />
        <div className="sm:col-span-2"><Field id="ws-addr" label="Address" defaultValue={workspace.address} /></div>
        <Field id="ws-phone" label="Clinic phone" defaultValue={workspace.phone} />
        <Field id="ws-web" label="Website" defaultValue={workspace.website} />
        <Field id="ws-abn" label="ABN" defaultValue={workspace.abn} hint="Placeholder for the demo" />
        <div className="space-y-1.5">
          <Label htmlFor="ws-tz">Time zone</Label>
          <Select defaultValue={workspace.timezone}>
            <SelectTrigger id="ws-tz" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane", "Australia/Adelaide", "Australia/Perth", "Australia/Hobart", "Australia/Darwin"].map((z) => <SelectItem key={z} value={z}>{z.replace("Australia/", "")} ({z})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="justify-end border-t pt-5">
        <Button onClick={() => toast.success("Workspace profile saved")}>Save changes</Button>
      </CardFooter>
    </Card>
  );
}
