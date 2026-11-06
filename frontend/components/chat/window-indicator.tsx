import { Clock } from "lucide-react";
import { windowHoursLeft } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function WindowIndicator({ lastCustomerMessageAt, now }: { lastCustomerMessageAt?: string; now: Date }) {
  const left = windowHoursLeft(lastCustomerMessageAt, now);
  const open = left !== null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
            open
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
          )}
        >
          <span className={cn("size-1.5 rounded-full", open ? "bg-emerald-500" : "bg-amber-500")} />
          <Clock className="size-3" />
          {open ? `Window open: ${left}h left` : "Window closed: send a template"}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        Free-form replies are allowed for 24 hours after the customer&apos;s last message. After that, only approved templates can be sent.
      </TooltipContent>
    </Tooltip>
  );
}
