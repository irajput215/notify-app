import { List, Reply } from "lucide-react";
import type { MessageButton, MessageList } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Renders reply buttons and list pickers attached to a message (generic messaging style). */
export function InteractiveButtons({
  buttons,
  list,
  onTap,
  usedLabel,
  className,
}: {
  buttons?: MessageButton[];
  list?: MessageList;
  onTap?: (b: MessageButton) => void;
  usedLabel?: string;
  className?: string;
}) {
  if (!buttons?.length && !list) return null;
  const interactive = Boolean(onTap);
  return (
    <div className={cn("mt-1 flex flex-col gap-1", className)}>
      {buttons?.map((b) => {
        const used = usedLabel === b.label;
        return (
          <button
            key={b.id}
            type="button"
            disabled={!interactive}
            onClick={() => onTap?.(b)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl border bg-card/90 px-3 py-2 text-[13px] font-medium text-primary shadow-xs transition-all outline-none disabled:cursor-default",
              interactive && "hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.98]",
              used && "border-primary/50 bg-brand-soft",
            )}
          >
            <Reply className="size-3.5" />
            {b.label}
          </button>
        );
      })}
      {list && (
        <div className="rounded-xl border bg-card/90 shadow-xs">
          <p className="flex items-center justify-center gap-1.5 border-b px-3 py-2 text-[13px] font-medium text-primary">
            <List className="size-3.5" /> {list.buttonLabel}
          </p>
          <ul className="divide-y text-[13px]">
            {list.options.map((o) => (
              <li key={o.id} className="px-3 py-1.5">
                <span className="font-medium">{o.title}</span>
                {o.description && <span className="block text-xs text-muted-foreground">{o.description}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
