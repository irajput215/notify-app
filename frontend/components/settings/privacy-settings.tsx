"use client";

import { useState } from "react";
import { Database, Download, FileLock2, KeyRound, MapPin, ScrollText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Workspace } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CONTROLS = [
  { icon: MapPin, title: "Hosted in Sydney", text: "Messages, contacts and AI processing stay in Australian data centres." },
  { icon: FileLock2, title: "Encrypted", text: "TLS in transit and AES-256 at rest. Staff access is logged." },
  { icon: ScrollText, title: "Australian Privacy Principles", text: "Designed around the APPs, with consent and opt-out records kept per contact." },
  { icon: KeyRound, title: "Least-privilege access", text: "Integrations read only what messaging needs. Roles limit who sees what." },
];

export function PrivacySettings({ workspace }: { workspace: Workspace }) {
  const [confirm, setConfirm] = useState(false);
  const [typed, setTyped] = useState("");
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Data residency</CardTitle>
          <CardDescription>Region: {workspace.hostingRegion}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {CONTROLS.map((c) => (
            <div key={c.title} className="flex gap-3 rounded-xl border p-4">
              <c.icon className="mt-0.5 size-5 shrink-0 text-primary" />
              <div><p className="font-medium">{c.title}</p><p className="mt-1 text-sm text-muted-foreground">{c.text}</p></div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Retention and export</CardTitle><CardDescription>How long conversations are kept, and getting your data out.</CardDescription></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ret">Keep conversations for</Label>
            <Select defaultValue={String(workspace.retentionMonths)} onValueChange={(v) => toast.success(`Retention set to ${v} months`)}>
              <SelectTrigger id="ret" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{["6", "12", "24", "84"].map((m) => <SelectItem key={m} value={m}>{m === "84" ? "7 years" : `${m} months`}</SelectItem>)}</SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Clinical records stay in Cliniko. Notify keeps message history only.</p>
          </div>
          <div className="flex flex-col justify-end gap-2">
            <Button variant="outline" onClick={() => toast.success("Export started", { description: "We'll email a download link to the workspace owner." })}><Download /> Export all data (CSV + JSON)</Button>
            <Button variant="ghost" onClick={() => toast.info("Audit log: 1,284 events in the last 30 days (demo)")}><Database /> View audit log</Button>
          </div>
        </CardContent>
      </Card>
      <Card className="border-destructive/30">
        <CardHeader><CardTitle className="text-destructive">Delete workspace</CardTitle><CardDescription>Permanently deletes all conversations, contacts and settings after a 14-day grace period.</CardDescription></CardHeader>
        <CardContent><Button variant="destructive" onClick={() => setConfirm(true)}><Trash2 /> Delete workspace</Button></CardContent>
      </Card>
      <Dialog open={confirm} onOpenChange={(o) => { setConfirm(o); setTyped(""); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete {workspace.name}?</DialogTitle><DialogDescription>Type the workspace name to confirm. This is a demo, so nothing will actually be deleted.</DialogDescription></DialogHeader>
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={workspace.name} aria-label="Workspace name" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button variant="destructive" disabled={typed !== workspace.name} onClick={() => { setConfirm(false); toast.info("Deletion scheduled (demo only)"); }}>Delete workspace</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
