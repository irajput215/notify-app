import type { AiTone } from "@/lib/types";
import { cn } from "@/lib/utils";

const TONES: { tone: AiTone; example: string }[] = [
  { tone: "Warm and friendly", example: "No worries at all, Olivia! Here are a few times that might suit." },
  { tone: "Professional", example: "Certainly, Olivia. The following appointment times are available." },
  { tone: "Concise", example: "Sure. Available times:" },
];

export function TonePicker({ value, onChange }: { value: AiTone; onChange: (t: AiTone) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Tone">
      {TONES.map((t) => (
        <button
          key={t.tone}
          type="button"
          role="radio"
          aria-checked={value === t.tone}
          onClick={() => onChange(t.tone)}
          className={cn("rounded-xl border p-3 text-left outline-none transition-colors hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50", value === t.tone && "border-primary bg-accent")}
        >
          <span className="block text-sm font-medium">{t.tone}</span>
          <span className="mt-1 block text-xs text-muted-foreground italic">“{t.example}”</span>
        </button>
      ))}
    </div>
  );
}
