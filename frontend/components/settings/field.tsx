import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function Field({ id, label, defaultValue, hint, type = "text" }: { id: string; label: string; defaultValue?: string; hint?: string; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} defaultValue={defaultValue} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 font-semibold">{children}</div>
    </div>
  );
}
