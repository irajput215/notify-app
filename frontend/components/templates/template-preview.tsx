import { ExternalLink, Phone, Reply } from "lucide-react";
import type { TemplateButton } from "@/lib/types";
import { PhoneFrame } from "@/components/simulator/phone-frame";

export function fillVariables(body: string, samples: string[]) {
  return body.replace(/\{\{(\d+)\}\}/g, (m, n: string) => samples[Number(n) - 1] || m);
}

export function TemplatePreview({
  header,
  body,
  footer,
  buttons,
  samples,
}: {
  header?: string;
  body: string;
  footer?: string;
  buttons: TemplateButton[];
  samples: string[];
}) {
  return (
    <PhoneFrame typing={false} footer={<div className="m-2 h-9 rounded-full border bg-muted/50" aria-hidden="true" />}>
      <div className="p-3">
        <div className="max-w-[90%] animate-message-in">
          <div className="rounded-2xl rounded-tl-md bg-bubble-in px-3 py-2 text-[13px] shadow-xs">
            {header && <p className="mb-1 font-semibold">{fillVariables(header, samples)}</p>}
            <p className="whitespace-pre-wrap break-words">{body ? fillVariables(body, samples) : <span className="text-muted-foreground">Your message body appears here…</span>}</p>
            {footer && <p className="mt-1.5 text-[11px] text-muted-foreground">{footer}</p>}
            <p className="mt-0.5 text-right text-[10px] text-muted-foreground">9:41am</p>
          </div>
          <div className="mt-1 flex flex-col gap-1">
            {buttons.filter((b) => b.label).map((b, i) => (
              <div key={i} className="flex items-center justify-center gap-1.5 rounded-xl border bg-card py-2 text-[13px] font-medium text-primary shadow-xs">
                {b.type === "url" ? <ExternalLink className="size-3.5" /> : b.type === "phone" ? <Phone className="size-3.5" /> : <Reply className="size-3.5" />}
                {b.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
