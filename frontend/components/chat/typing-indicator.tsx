import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function TypingDots({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)} aria-label="Typing">
      {[0, 150, 300].map((d) => (
        <span key={d} className="size-1.5 animate-bounce rounded-full bg-current opacity-60" style={{ animationDelay: `${d}ms` }} />
      ))}
    </span>
  );
}

export function AiTypingBubble() {
  return (
    <div className="flex justify-end animate-message-in">
      <div className="flex items-center gap-2 rounded-2xl rounded-tr-md bg-bubble-ai px-3.5 py-2.5 text-xs text-sky-800 dark:text-sky-200">
        <Sparkles className="size-3.5" /> Notify AI is replying <TypingDots />
      </div>
    </div>
  );
}
