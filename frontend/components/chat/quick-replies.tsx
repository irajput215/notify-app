"use client";

import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";

export const QUICK_REPLIES = [
  { title: "Checking", body: "Thanks for your message! Let me check and get back to you shortly." },
  { title: "Find a time", body: "Would you like me to find you a time this week?" },
  { title: "Health fund", body: "We have HICAPS, so you can claim with your health fund on the spot and just pay the gap." },
  { title: "Address", body: "We're at Level 2, 18 Riverbank Lane, Parramatta NSW 2150. Free 2-hour parking is behind the building." },
  { title: "Physio will call", body: "I've passed this on to your physio, who will give you a call today." },
];

export function QuickReplies({ onPick, disabled }: { onPick: (body: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" disabled={disabled} className="text-muted-foreground">
          <Zap /> <span className="hidden @md:inline">Quick replies</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-1">
        <p className="px-3 pt-2 pb-1 text-xs font-medium text-muted-foreground">Saved replies</p>
        <ul>
          {QUICK_REPLIES.map((q) => (
            <li key={q.title}>
              <button
                type="button"
                className="w-full rounded-lg px-3 py-2 text-left outline-none hover:bg-accent focus-visible:bg-accent"
                onClick={() => { onPick(q.body); setOpen(false); }}
              >
                <span className="block text-sm font-medium">{q.title}</span>
                <span className="line-clamp-1 text-xs text-muted-foreground">{q.body}</span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
