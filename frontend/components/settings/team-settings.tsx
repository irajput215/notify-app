"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { Role, StaffMember } from "@/lib/types";
import { initials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ROLES: { role: Role; text: string }[] = [
  { role: "Owner", text: "Everything, including billing and deleting the workspace" },
  { role: "Admin", text: "Manage team, templates, automations and integrations" },
  { role: "Agent", text: "Reply to conversations and add notes" },
];

export function TeamSettings({ team }: { team: StaffMember[] }) {
  const [roles, setRoles] = useState<Record<string, Role>>(Object.fromEntries(team.map((t) => [t.id, t.role])));
  const [invite, setInvite] = useState(false);
  return (
    <div className="space-y-4">
      <Card className="gap-0 pb-0">
        <CardHeader className="pb-4">
          <CardTitle>Team</CardTitle>
          <CardDescription>{team.length} members · 3 practitioners and 2 front desk staff</CardDescription>
          <CardAction><Button size="sm" onClick={() => setInvite(true)}><UserPlus /> Invite</Button></CardAction>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent"><TableHead className="pl-5">Member</TableHead><TableHead className="hidden sm:table-cell">Title</TableHead><TableHead>Role</TableHead><TableHead className="hidden md:table-cell pr-5">Status</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {team.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="pl-5">
                  <div className="flex items-center gap-3">
                    <Avatar><AvatarFallback className={t.avatarClass}>{initials(t.name)}</AvatarFallback></Avatar>
                    <div><p className="font-medium">{t.name}</p><p className="text-xs text-muted-foreground">{t.email}</p></div>
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">{t.title}</TableCell>
                <TableCell>
                  <Select value={roles[t.id]} disabled={t.role === "Owner"} onValueChange={(v) => { setRoles((r) => ({ ...r, [t.id]: v as Role })); toast.success(`${t.name} is now ${v}`); }}>
                    <SelectTrigger size="sm" className="w-28" aria-label={`Role for ${t.name}`}><SelectValue /></SelectTrigger>
                    <SelectContent>{ROLES.map((r) => <SelectItem key={r.role} value={r.role} disabled={r.role === "Owner"}>{r.role}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="hidden pr-5 md:table-cell">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><span className={`size-2 rounded-full ${t.online ? "bg-emerald-500" : "bg-slate-300"}`} />{t.online ? "Online" : "Away"}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Card>
        <CardHeader><CardTitle>Roles</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {ROLES.map((r) => <div key={r.role} className="rounded-xl border p-3"><p className="font-medium">{r.role}</p><p className="mt-1 text-xs text-muted-foreground">{r.text}</p></div>)}
        </CardContent>
      </Card>
      <Dialog open={invite} onOpenChange={setInvite}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite a team member</DialogTitle><DialogDescription>They&apos;ll get an email to join Harbourside Physio on Notify.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="inv-email">Email</Label><Input id="inv-email" type="email" placeholder="name@harbourside-physio.example" /></div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-role">Role</Label>
              <Select defaultValue="Agent"><SelectTrigger id="inv-role" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Admin">Admin</SelectItem><SelectItem value="Agent">Agent</SelectItem></SelectContent></Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setInvite(false)}>Cancel</Button><Button onClick={() => { setInvite(false); toast.success("Invitation sent"); }}>Send invite</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
