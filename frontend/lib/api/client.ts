/**
 * The typed client for the Notify API (`backend/`), generated from its OpenAPI document.
 *
 * `schema.d.ts` is generated: run `scripts/generate-client.sh` after any API change, never edit it.
 * Every path, body and response here is checked against the backend's own schema, so a renamed field
 * fails `npm run build` instead of failing in the browser.
 *
 * The services in `lib/services/` still serve the demo's mock data; each moves onto this client as its
 * backend module lands (contacts, workspace, team and auth first).
 */
import createClient, { type Middleware } from "openapi-fetch";

import type { paths } from "./schema";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

let accessToken: string | null = null;

/** Set (or clear) the bearer token every request carries. Tokens live 15 minutes. */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

const auth: Middleware = {
  onRequest({ request }) {
    if (accessToken) request.headers.set("Authorization", `Bearer ${accessToken}`);
    return request;
  },
};

export const api = createClient<paths>({ baseUrl: API_URL });
api.use(auth);

/** Sign in with email and password; the token is kept for later calls. */
export async function logIn(email: string, password: string): Promise<boolean> {
  const { data } = await api.POST("/api/v1/login/access-token", {
    body: { username: email, password, scope: "" },
    bodySerializer: (body) => new URLSearchParams(body as Record<string, string>),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  setAccessToken(data?.access_token ?? null);
  return Boolean(data);
}
