import { Quote, Sparkles } from "lucide-react";
import type { PatientDescription } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/format";

export function PatientDescriptionCard({ description }: { description: PatientDescription }) {
  return (
    <div className="space-y-2">
      <div className="rounded-lg bg-bubble-ai/70 p-3">
        <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-sky-800 uppercase dark:text-sky-200">
          <Sparkles className="size-3" /> AI summary · saved to notes
        </p>
        <p className="text-sm leading-relaxed">{description.summary}</p>
      </div>
      <div className="rounded-lg border bg-muted/40 p-3">
        <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase">
          <Quote className="size-3" /> Patient&apos;s own words
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground italic">“{description.original}”</p>
      </div>
      {description.capturedAt && (
        <p className="text-[11px] text-muted-foreground">Captured {formatDate(description.capturedAt)} at {formatTime(description.capturedAt)} via WhatsApp</p>
      )}
    </div>
  );
}
