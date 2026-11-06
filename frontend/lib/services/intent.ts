/**
 * Keyword-based intent rules that stand in for the real AI in the demo.
 * In production this is an LLM call on the backend, wrapped in the same
 * guardrails (no clinical advice, escalate when unsure).
 */
import type { AiSettings, FaqEntry } from "@/lib/types";

export interface CustomerInput {
  text?: string;
  /** Id of a tapped reply button or list option. */
  buttonId?: string;
  /** Visible label of the tapped button. */
  label?: string;
}

export type Intent =
  | { kind: "opt_out" }
  | { kind: "opt_in" }
  | { kind: "confirm" }
  | { kind: "reschedule"; day?: "tomorrow" | "friday" }
  | { kind: "pick_slot"; slotId: string }
  | { kind: "cancel_request" }
  | { kind: "cancel_yes" }
  | { kind: "cancel_no" }
  | { kind: "book"; day?: "tomorrow" | "friday" }
  | { kind: "escalate"; matched: string[] }
  | { kind: "faq"; faq: FaqEntry }
  | { kind: "greeting" }
  | { kind: "thanks" }
  | { kind: "yes" }
  | { kind: "no" }
  | { kind: "unknown" };

const BUTTONS: Record<string, Intent> = {
  confirm: { kind: "confirm" },
  reschedule: { kind: "reschedule" },
  cancel: { kind: "cancel_request" },
  cancel_yes: { kind: "cancel_yes" },
  cancel_no: { kind: "cancel_no" },
  book: { kind: "book" },
};

/** Symptom, treatment and medication language that always goes to a person. */
const CLINICAL_PATTERN =
  /\b(swollen|swell\w*|hurts?|hurting|aches?|aching|sore|numb\w*|tingl\w*|dizz\w*|bleed\w*|bruis\w*|fever|medicat\w*|painkillers?|ibuprofen|injur\w*|should i (ice|heat|exercise|stretch|rest|take|keep))\b/;

/** Keyword match. `prefix` lets "pain" also match "painful"; FAQs use whole words. */
const has = (text: string, words: string[], prefix = true) =>
  words.filter((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}${prefix ? "" : "\\b"}`, "i").test(text));

export function classify(input: CustomerInput, ai: AiSettings): Intent {
  if (input.buttonId) {
    if (input.buttonId.startsWith("slot:")) return { kind: "pick_slot", slotId: input.buttonId };
    const mapped = BUTTONS[input.buttonId];
    if (mapped) return mapped;
  }
  const text = (input.text ?? input.label ?? "").trim();
  const lower = text.toLowerCase();
  if (/^(stop|unsubscribe|stop all)$/i.test(text)) return { kind: "opt_out" };
  if (/^(start|subscribe)$/i.test(text)) return { kind: "opt_in" };

  // Safety first: anything that looks clinical goes to a person. The built-in
  // patterns back the locked "never give clinical advice" guardrail.
  const matched = has(lower, ai.escalationKeywords);
  const clinical = lower.match(CLINICAL_PATTERN)?.[0];
  if (matched.length || clinical) return { kind: "escalate", matched: matched.length ? matched : [clinical ?? "clinical"] };

  const day = /\bfri(day)?\b/.test(lower) ? "friday" : /\btomorrow\b/.test(lower) ? "tomorrow" : undefined;
  if (/\bcancel/.test(lower)) return { kind: "cancel_request" };
  if (/\b(reschedule|change|move|another time|different time)\b/.test(lower) || day) {
    return /\b(book|new appointment)\b/.test(lower) ? { kind: "book", day } : { kind: "reschedule", day };
  }
  if (/\b(confirm|confirmed|see you then)\b/.test(lower)) return { kind: "confirm" };
  if (/\b(book|appointment|booking)\b/.test(lower)) return { kind: "book" };

  const faq = ai.faqs.find((f) => has(lower, f.keywords, false).length > 0);
  if (faq) return { kind: "faq", faq };

  if (/^(hi|hello|hey|g'?day|good (morning|afternoon))\b/.test(lower)) return { kind: "greeting" };
  if (/\b(thanks|thank you|cheers|ta)\b/.test(lower)) return { kind: "thanks" };
  if (/^(yes|yep|yeah|sure|ok|okay)\b/.test(lower)) return { kind: "yes" };
  if (/^(no|nope|nah)\b/.test(lower)) return { kind: "no" };
  return { kind: "unknown" };
}

export const CLINICAL_HOLDING_REPLY = (first: string) =>
  `I'm sorry to hear that, ${first}. I'm not able to give medical advice over message, so I've passed this to our clinical team and a team member will reply to you shortly.\n\nIf the pain is severe or you're worried, please call us on (02) 5550 4321, or 000 in an emergency.`;

export const UNSURE_REPLY =
  "Thanks for your message. I want to make sure you get the right answer, so I've passed this to our front desk team. Someone will reply shortly.";

/** Side-effect-free preview used by the "Test the AI" box in settings. */
export function previewReply(text: string, ai: AiSettings): { reply: string; label: string; escalated: boolean } {
  const intent = classify({ text }, ai);
  switch (intent.kind) {
    case "escalate":
      return { reply: CLINICAL_HOLDING_REPLY("there"), label: `Escalated to a human (matched: ${intent.matched.join(", ")})`, escalated: true };
    case "faq":
      return { reply: intent.faq.answer, label: `Answered from FAQ: “${intent.faq.question}”`, escalated: false };
    case "reschedule":
    case "book":
      return { reply: "No problem! Here are the next available times. Tap one to choose: [3 slot buttons]", label: intent.day ? `Offers slots for ${intent.day}` : "Offers next 3 available slots", escalated: false };
    case "cancel_request":
      return { reply: "Are you sure you'd like to cancel? You can also move it to another time. [Yes, cancel] [Reschedule instead] [Keep it]", label: "Cancellation with confirmation", escalated: false };
    case "confirm":
      return { reply: "Thanks, you're confirmed. See you then!", label: "Confirms the appointment in Cliniko", escalated: false };
    case "opt_out":
      return { reply: "You've been unsubscribed. You can reply START at any time to opt back in.", label: "Opt-out recorded", escalated: false };
    case "greeting":
      return { reply: "Hi there! I'm the Harbourside Physio assistant. I can help you book, confirm or reschedule, or answer questions about the clinic.", label: "Greeting", escalated: false };
    case "thanks":
      return { reply: "You're welcome! Anything else, just message here.", label: "Small talk", escalated: false };
    default:
      return ai.escalateWhenUnsure
        ? { reply: UNSURE_REPLY, label: "Not sure, so escalated to a human", escalated: true }
        : { reply: "Sorry, I didn't quite get that. You can ask about bookings, fees, parking or opening hours.", label: "Fallback reply", escalated: false };
  }
}
