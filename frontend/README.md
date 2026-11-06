# Notify (working name): clickable demo

A front-end-only demo of a WhatsApp business messaging platform with a ready-made workflow for Australian health clinics. It's built for sales meetings and investor screen shares: everything is mock data and simulated events, behind a service layer that a real backend can replace.

Demo workspace: **Harbourside Physio, Parramatta NSW**. Three practitioners, two front desk staff, 42 contacts. Every person, clinic, phone number and figure is fictional.

## Run it

Requires Node 20+.

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build && npm start   # production build
npm run lint
```

- `/`: marketing site. `/pricing`: pricing page.
- `/app/inbox`: the product (no login).

## Five-minute demo script

1. **Dashboard** (`/app/dashboard`). Show the KPI cards, the confirmations chart and the "Needs attention" list.
2. **Inbox** (`/app/inbox`). Walk through the pre-loaded stories:
   - Liam Carter: reminder → Reschedule → picks Thu 2:30pm → confirmed
   - Grace Nguyen: parking question answered from the FAQ
   - Tom Fitzgerald: missed call → text-back → books an appointment
   - Aisha Rahman: new patient describes knee pain → summary saved to notes (see the contact panel)
   - Michael Rossi: "pain got much worse" → the AI doesn't advise, flags Needs human
   - Daniel Walsh: replied STOP → opted out, composer locked
   - Chloe Martin: fees enquiry answered by a receptionist
3. **Live moment.** Click **Simulate customer**. You're now Olivia Bennett on a phone.
   - **Send reminder**, then tap **Reschedule**, then tap a slot.
   - The thread updates, a toast says "Appointment moved in Cliniko", and the counters tick.
   - Click **Calendar** under the phone: the appointment has moved and is highlighted. Click **Dashboard**: "Reschedules by AI" went up.
   - Try the chips: "Is there parking?", "Can I come Friday instead?", "My pain got much worse…" (escalates), "STOP" (opts out).
4. **Reset demo** (Inbox toolbar or the user menu) puts everything back to the start.

Other highlights: Templates (submit one and watch Pending turn into Approved after about 5 seconds), Campaigns (the consent check excludes opted-out contacts), Automations → AI assistant ("Test the AI").

## Tech

Next.js 16 (App Router), TypeScript (strict), Tailwind CSS v4, shadcn/ui components (Radix), lucide-react, recharts, Zustand, sonner (toasts) and next-themes (dark mode).

```
app/
  (marketing)/            landing page and /pricing
  app/                    product shell (sidebar + top bar), one folder per page
components/
  ui/                     shadcn/ui primitives
  layout/  inbox/  chat/  simulator/  dashboard/  charts/  appointments/
  contacts/  templates/  campaigns/  automations/  ai/  integrations/  settings/  marketing/
lib/
  types.ts                domain types shared by everything
  mock/                   seed data (generated relative to "now")
  services/               the mock backend; the only code that touches mock data
  store/demo-store.ts     Zustand client cache for shared state
  format.ts  time.ts      AU formatting (DD/MM/YYYY, 2:30pm, AUD, +61) and date helpers
```

## How the mock service layer works

```
UI components ──calls──▶ lib/services/*  (async, 200–500 ms latency, returns copies)
      ▲                        │ mutates
      │                        ▼
 Zustand store ◀──events── in-memory db (lib/services/db.ts, seeded from lib/mock)
```

- **Services return Promises.** Every function goes through `request()` in `lib/services/client.ts`, which waits 200–500 ms and returns a deep copy, like a network call. UI code imports only from `@/lib/services`.
- **Realtime events.** Writes emit `ServerEvent`s (`message.created`, `conversation.updated`, `appointment.updated`, `counters.updated`, `typing`, `toast`, …) on a small in-process bus. This stands in for a WebSocket or SSE stream.
- **The store.** `lib/store/demo-store.ts` loads shared data on boot and applies events, so a reschedule in the simulator updates the inbox, calendar and dashboard together. Page-local data (templates, campaigns, settings) is fetched with `useAsync` straight from services.
- **The "AI".** `lib/services/intent.ts` holds keyword rules (friday, tomorrow, cancel, parking, fees, pain/worse…) plus a built-in clinical-symptom pattern that always escalates. `lib/services/bot.ts` acts on the intent: it replies with a typing delay, moves appointments, bumps counters and raises toasts.
- **Reset.** `demoApi.resetDemo()` re-seeds the db and the store reloads.

## Where a real backend plugs in

Each service module maps to a future FastAPI router. Swap the body of each function for a `fetch` and keep the signature:

| Service | FastAPI endpoint (suggested) | Real system behind it |
|---|---|---|
| `conversationsApi` | `GET /conversations`, `POST /conversations/:id/messages`, `/notes`, `/templates`, `PATCH /ai`, `/assignee` | Meta WhatsApp Cloud API (send messages and templates) |
| `simulatorApi.customerSend` → `bot.handleCustomerMessage` | `POST /webhooks/whatsapp` | Inbound WhatsApp webhook; LLM with guardrails replaces `intent.ts` |
| `appointmentsApi`, `slots.ts` | `GET /clinic/appointments`, `GET /clinic/slots`, `PATCH /clinic/appointments/:id` | Cliniko API (appointments, available times, patients) |
| `templatesApi` | `GET/PUT /templates`, `POST /templates/:id/submit` | WhatsApp Business Management API; approval arrives by webhook |
| `contactsApi` | `GET /contacts`, `POST /contacts/import` | Postgres plus Cliniko patient sync |
| `campaignsApi` | `POST /segments/:id/audience`, `POST /campaigns` | Postgres and a job queue; consent check runs server-side |
| `automationsApi`, `aiApi` | `GET/PATCH /automations`, `GET/PUT /ai/settings`, `POST /ai/test` | Scheduler (reminders), LLM config |
| `integrationsApi` | `POST /integrations/:id/connect` | OAuth flows |
| `subscribe()` in `client.ts` | `GET /events` (SSE) or a WebSocket | Server push |

Missed-call text-back would come from a telephony provider webhook (`POST /webhooks/calls`).

## Decisions and notes

- **Next.js 16 defaults trimmed.** `cacheComponents` and partial prefetching are switched off in `next.config.ts`, because the product is fully client-rendered demo state and doesn't need them.
- **shadcn/ui is vendored by hand.** The shadcn registry wasn't reachable from the build environment, so the components in `components/ui` were written from the standard shadcn source (Radix plus Tailwind). Their dependencies (`radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`) plus `sonner` and `next-themes` are the libraries shadcn/ui uses for these components and for toasts and theming.
- **Dates are relative.** Mock data is generated from the current time, so "today" always has activity. Times use the viewer's local time zone; the demo assumes it's presented in Sydney time.
- **Product pages render client-side only.** They depend on the viewer's clock, so the shell shows a skeleton until mount. This avoids hydration mismatches.
- **State lives in memory.** A full page reload resets the demo. That's deliberate: it gives the presenter a guaranteed clean slate.
- **One simulator patient.** The phone always plays Olivia Bennett, so the reschedule story is predictable.
- **Phone numbers.** Featured contacts use mobile numbers that ACMA lists for use in fiction (0491 570 xxx …); the clinic uses (02) 5550 xxxx. Domains end in `.example`.
- **Brands.** No WhatsApp, Meta, Cliniko or other vendor logos or UI. Integrations show plain-text names and neutral monograms, and chat bubbles use a generic style.
- **Example metrics.** Marketing figures are labelled "example". Pricing is placeholder.
- **Charts.** The AI vs human colour pair was checked for colour-blind separation and contrast in both light and dark mode.
