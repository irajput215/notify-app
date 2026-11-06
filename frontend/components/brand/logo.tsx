import { cn } from "@/lib/utils";

/** Notify wordmark: an original speech-bubble mark, not based on any third-party brand. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M9 10.5A2.5 2.5 0 0 1 11.5 8h9A2.5 2.5 0 0 1 23 10.5v7a2.5 2.5 0 0 1-2.5 2.5H15l-4.2 3.4c-.5.4-1.3 0-1.3-.6V20h0A2.5 2.5 0 0 1 9 17.5v-7Z"
        className="fill-primary-foreground"
      />
      <circle cx="21.5" cy="9.5" r="3.5" className="fill-amber-400 stroke-primary" strokeWidth="1.5" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark className="size-7" />
      <span className="text-[17px]">Notify</span>
    </span>
  );
}
