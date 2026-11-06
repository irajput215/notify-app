/**
 * Transport helpers for the mock service layer.
 *
 * Every service function goes through `request()`, which simulates network
 * latency and returns a deep copy so callers can never mutate "server" state.
 * Swap `request()` for `fetch()` calls to a FastAPI backend and the rest of
 * the app keeps working.
 */
import type { ServerEvent } from "@/lib/types";

export function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Simulated latency between 200 and 500 ms. */
export function latency() {
  return 200 + Math.round(Math.random() * 300);
}

export async function request<T>(fn: () => T, ms = latency()): Promise<T> {
  await sleep(ms);
  return structuredClone(fn());
}

/* ---------- Mock realtime channel (stands in for a WebSocket / SSE stream) ---------- */

type Listener = (event: ServerEvent) => void;
const listeners = new Set<Listener>();

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emit(event: ServerEvent) {
  const copy = structuredClone(event);
  listeners.forEach((l) => l(copy));
}
