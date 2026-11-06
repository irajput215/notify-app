"use client";

import { useState } from "react";
import { CircleAlert, CircleCheck, FileUp, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { contactsApi } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

type Result = Awaited<ReturnType<typeof contactsApi.importContacts>>;

export function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [stage, setStage] = useState<"pick" | "uploading" | "done">("pick");
  const [result, setResult] = useState<Result | null>(null);

  async function start(name: string) {
    setStage("uploading");
    const r = await contactsApi.importContacts(name);
    setResult(r);
    setStage("done");
  }

  function close(o: boolean) {
    onOpenChange(o);
    if (!o) setTimeout(() => { setStage("pick"); setResult(null); }, 200);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import contacts from CSV</DialogTitle>
          <DialogDescription>Columns: name, mobile, email, tags, consent. Mobiles are normalised to +61 format.</DialogDescription>
        </DialogHeader>

        {stage === "pick" && (
          <div className="space-y-3">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors hover:border-primary hover:bg-accent/40 focus-within:ring-[3px] focus-within:ring-ring/50">
              <Upload className="size-6 text-primary" />
              <span className="text-sm font-medium">Drop a CSV here or click to browse</span>
              <span className="text-xs text-muted-foreground">Up to 10,000 rows. Nothing leaves your browser in this demo.</span>
              <input type="file" accept=".csv" className="sr-only" onChange={(e) => e.target.files?.[0] && void start(e.target.files[0].name)} />
            </label>
            <Button variant="outline" className="w-full" onClick={() => void start("cliniko-patients-export.csv")}>
              <FileUp /> Use sample file (cliniko-patients-export.csv)
            </Button>
          </div>
        )}

        {stage === "uploading" && (
          <div className="space-y-3 py-6 text-center">
            <Loader2 className="mx-auto size-6 animate-spin text-primary" />
            <p className="text-sm">Checking numbers, duplicates and consent…</p>
            <Progress value={66} className="animate-pulse" />
          </div>
        )}

        {stage === "done" && result && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{result.fileName} · {result.rows} rows</p>
            <ul className="divide-y rounded-xl border text-sm">
              <li className="flex items-center gap-2 p-3"><CircleCheck className="size-4 text-emerald-600" /> <span className="flex-1">Ready to import</span> <strong>{result.imported}</strong></li>
              <li className="flex items-center gap-2 p-3"><CircleAlert className="size-4 text-muted-foreground" /> <span className="flex-1">Duplicates merged</span> <strong>{result.duplicates}</strong></li>
              <li className="flex items-center gap-2 p-3"><CircleAlert className="size-4 text-destructive" /> <span className="flex-1">Invalid mobile numbers skipped</span> <strong>{result.invalidNumbers}</strong></li>
              <li className="flex items-center gap-2 p-3"><CircleAlert className="size-4 text-amber-600" /> <span className="flex-1">No consent recorded: imported as Pending</span> <strong>{result.withoutConsent}</strong></li>
            </ul>
            <p className="text-xs text-muted-foreground">Pending contacts can receive appointment messages but are excluded from marketing campaigns until they opt in.</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>Cancel</Button>
          <Button
            disabled={stage !== "done"}
            onClick={() => {
              toast.success(`${result?.imported ?? 0} contacts imported`, { description: "This is a demo, so the list itself doesn't change." });
              close(false);
            }}
          >
            Import contacts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
