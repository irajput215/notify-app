import { ArrowLeft, BadgeCheck, Phone, Signal, Wifi } from "lucide-react";
import { TypingDots } from "@/components/chat/typing-indicator";

/** A generic, unbranded phone mock-up used by the customer simulator. */
export function PhoneFrame({ typing, children, footer }: { typing: boolean; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="mx-auto flex h-full max-h-[720px] w-full max-w-[340px] flex-col overflow-hidden rounded-[2.5rem] border-[10px] border-neutral-900 bg-neutral-900 shadow-2xl dark:border-neutral-700">
      <div className="relative flex items-center justify-between bg-card px-5 pt-2 pb-1 text-[11px] font-semibold">
        <span>9:41</span>
        <span className="absolute top-1.5 left-1/2 h-5 w-20 -translate-x-1/2 rounded-full bg-neutral-900" aria-hidden="true" />
        <span className="flex items-center gap-1"><Signal className="size-3" /><Wifi className="size-3" /><span className="h-2.5 w-5 rounded-sm border border-current" /></span>
      </div>
      <div className="flex items-center gap-2.5 border-b bg-card px-3 py-2.5">
        <ArrowLeft className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">HP</span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="flex items-center gap-1 truncate text-sm font-semibold">Harbourside Physio <BadgeCheck className="size-3.5 text-primary" /></p>
          <p className="text-[11px] text-muted-foreground">
            {typing ? <span className="inline-flex items-center gap-1 text-primary">typing <TypingDots /></span> : "Business account"}
          </p>
        </div>
        <Phone className="size-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-chat-bg">{children}</div>
      <div className="bg-card">{footer}</div>
    </div>
  );
}
