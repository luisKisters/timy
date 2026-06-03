# Timy Redesign — Build Plan

Rebuild the UI/flow to match the mockups in **`mockups/`** (open `mockups/index.html`), TDD-first.
Every phase ships only when its **acceptance tests pass in a real browser**, then is **committed + pushed**.

---

## Current architecture (what we're working with)

- **Frontend:** Next.js 16 (App Router, React 19 + React Compiler), Tailwind v4, Base-UI primitives in `src/components/ui/*`.
- **Backend:** **PocketBase** — 4 collections (`events`, `time_slots`, `participants`, `votes`), all rules **open**, accessed server-side with an admin token (`src/lib/pb-admin.ts`). Schema lives in `scripts/setup-collections.ts`.
- **Writes:** Next.js **server actions** (`create/actions.ts`, `event/[id]/actions.ts`, `results/actions.ts`) — currently N+1 loops + string-interpolated filters.
- **Reads:** server components query PB directly (`results/page.tsx`).
- **Ranking:** `src/lib/resolve.ts` — pure, already testable.
- **Calendar:** OAuth via `/api/gcal` → `/api/gcal/callback` → Google `freeBusy`; today it only filters *existing* slots.
- **Identity:** anonymous, `localStorage` (`identity.ts`, `creator.ts`). No auth.
- **AI:** `/api/ai` + client-stored keys — **being retired** (AI is "coming soon" only).
- **Tests:** none. No test tooling installed.

**Verdict:** sound for its size, not "bad" — but missing 4 things the redesign needs. So Phases 0–3 are foundation, 4–9 are screens, 10 is cleanup.

---

## Conventions (apply to every phase)

- **TDD loop:** write failing test → implement → green → commit → push.
- **Test stack:**
  - **Vitest browser mode** (Playwright/chromium provider) + `vitest-browser-react` → component/"unit-in-browser" tests = the acceptance gate.
  - **MSW** mocks all HTTP (Google `freeBusy`, calendar list).
  - Plain **Vitest** for pure logic; **Playwright** E2E for the final flow.
- **Calendar mocks = real API shape** (per Context7 / Google docs):
  - Request `POST https://www.googleapis.com/calendar/v3/freeBusy` → `{ timeMin, timeMax, timeZone?, items:[{id}] }`
  - Response → `{ kind:"calendar#freeBusy", calendars:{ "<calId>": { busy:[{ start, end }] } } }`
- **Mockup is the source of truth** for each screen (file referenced per phase).
- One **commit + push** per phase (`pnpm test` green first).

---

## Phases

### 0 · Test harness
- **Build:** install Vitest (browser mode, chromium), `vitest-browser-react`, MSW, Playwright; `test` / `test:e2e` scripts; MSW server.
- **Accept:** a smoke component test renders & passes in-browser; `pnpm test` green.

### 1 · Design system (ref: `mockups/theme.css` + all screens)
- **Build:** port theme tokens into `globals.css` (indigo brand, emerald availability, radii, shadows). Primitives: `AppShell` (stream + sticky **Dock**: primary-bottom / secondary-above, responsive width), `Stepper`, `DateStrip`, `SlotCard`, `BottomSheet`, `Chip`, `AvatarStack`, `Button`.
- **Accept:** Dock stacks secondary above primary & narrows on tablet/desktop; `SlotCard` toggles selected (emerald); `DateStrip` selects a day; `BottomSheet` opens/closes; all have a11y roles.

### 2 · Domain + data layer (architecture fix)
- **Build:** `src/server/repo.ts` (typed PB repo, **batch** creates — kills N+1) + `src/lib/domain/*` pure fns: `rankSlots` (move from resolve), `generateSlots(days, window, interval)`, `freeBusyToFreeSlots(busy, candidates)`, `computeExpiry`, `shareMessage`.
- **Accept:** 100% unit coverage on the pure fns (ranking, generation, busy-exclusion, expiry, message); repo CRUD tested against a PB test instance.

### 3 · Create-wizard state
- **Build:** `CreateDraft` context + `sessionStorage` holding name/expiry/slotLength/slots across Setup→Times→Review (replaces today's URL-param passing).
- **Accept:** values set in Setup survive navigation + refresh; reset after submit.

### 4 · Create · Setup (ref: `create-1-setup.html`)
- **Build:** `/create` = name + poll-closes chips + slot-length chips + Continue. **Remove** `event-form.tsx`.
- **Accept:** Continue disabled until named; chips single-select; values → draft; routes to Times.

### 5 · Create · Times + calendar (ref: `create-2-times.html`)
- **Build:** DateStrip + separate SlotCards; **+Add** sheet (single / range / **check-calendar** / AI-disabled "Soon"); range adds across selected days; calendar-config sheet (weekdays + working hours) → `freeBusy` → **all-green** suggested slots. Extend gcal to *generate* candidate slots in-window and keep the free ones.
- **Mocks:** MSW `freeBusy` (documented shape) + calendarList.
- **Accept:** add single/range (range respects days + interval — unit); calendar suggestions exclude busy intervals (unit on `freeBusyToFreeSlots`); suggestions render green; green "Add entries" → draft; Done → Review.

### 6 · Create · Review + persist (ref: `create-3-review.html`)
- **Build:** per-day date-strip, plain cards + 🗑, ← Back / Confirm. Confirm → `repo.createEventWithSlots` (batch). **Remove** `create/slots/page.tsx` + old `create/actions.ts`.
- **Accept:** per-day filtering; trash removes from draft; Confirm persists (repo mocked) → routes to Share with new id.

### 7 · Share (ref: `create-4-share.html`)
- **Build:** success + invite link/copy; **Share** (Web Share API) = primary; Fill-out-availability = secondary.
- **Accept:** copy writes clipboard; Share calls `navigator.share` (mocked); Fill-out routes host into Vote.

### 8 · Vote (ref: `vote.html`)
- **Build:** header (host + avatars), DateStrip, SlotCards, **Auto-check calendar** (secondary, green-fills via `freeBusy`), Submit (batch votes). **Remove** `event/[id]/client.tsx`, `ai-input-bar.tsx`.
- **Accept:** toggle slots; auto-check selects free as green (mocked freebusy); Submit persists votes → Results.

### 9 · Results (ref: `results.html`)
- **Build:** best-slot hero (Confirm primary / See-matrix secondary) → heatmap matrix → confirmed (Add-to-calendar primary / Change-time secondary + **Share-time** modal w/ prefilled message) → re-confirm = "Share update". Uses `rankSlots` + `shareMessage`; add-to-calendar via existing `lib/ics`.
- **Accept:** best surfaces (unit); matrix grid renders; Confirm sets `resolved_slot` (repo mocked); modal shows formatted message (unit); changed time shows "Share update".

### 10 · Cleanup + E2E
- **Remove:** `/api/ai`, `ai-client.ts`, `ai-config*.ts`, `api-key-dialog.tsx`, `mock-data.ts`, dead Base-UI + old screen components, unused i18n keys.
- **Accept:** Playwright E2E happy path create → share → vote → results green; no dead imports.

---

## Throw-out summary
Old screens (`page.tsx` home, `create/*`, `event/[id]/*`, `results/*`) are **replaced**, not patched. All **AI** code is deleted (kept only as a disabled "Soon" affordance). `gcal` is **kept + extended**. PocketBase schema is unchanged (open rules stay for now; auth/sign-in-at-end is a later, optional phase).
