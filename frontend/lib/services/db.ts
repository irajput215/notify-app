/**
 * In-memory "database" for the demo. Only service modules import this file.
 * In production this is replaced by the FastAPI backend and Postgres.
 */
import { createSeed, type Seed } from "@/lib/mock/seed";

let state: Seed | null = null;

export function db(): Seed {
  if (!state) state = createSeed();
  return state;
}

export function resetDb() {
  state = createSeed();
}

export function findOrThrow<T extends { id: string }>(list: T[], id: string, what: string): T {
  const item = list.find((x) => x.id === id);
  if (!item) throw new Error(`${what} ${id} not found`);
  return item;
}
