# Timy Redesign — PRD + Build Plan

Rebuild the UI/flow to match the mockups in **`mockups/`** (open `mockups/index.html`), TDD-first.
Every phase ships only when its **acceptance tests pass in a real browser**, then is **committed + pushed**.

> Incorporates the Codex review (P0/P1/P2) — see **Review log** at the bottom for where each finding landed.

---

## Current architecture (what we're working with)

- **Frontend:** Next.js 16 (App Router, React 19 + React Compiler), Tailwind v4, Base-UI primitives in `src/components/ui/*`. Animation uses **Motion** (motion.dev) — the repo still has the legacy `framer-motion`; swap it for the renamed **`motion`** package (`motion/react`).
- **Backend:** **PocketBase** — 4 collections (`events`, `time_slots`, `participants`, `votes`), all rules **open**, accessed server-side with an admin token (`src/lib/pb-admin.ts`). Schema in `scripts/setup-collections.ts`. `events.creator_name` exists but is unused.
- **Writes:** Next.js **server actions** — currently N+1 loops + string-interpolated filters.
- **Reads:** server components query PB directly.
- **Ranking:** `src/lib/resolve.ts` — pure, already testable.
- **Calendar:** OAuth `/api/gcal` → `/api/gcal/callback` → Google `freeBusy`. **Vote-flow only** — it takes an `eventId` + existing `slots` and marks which are free; there is **no create-time "suggest free slots" path**.
- **Identity:** anonymous, `localStorage` (`identity.ts`, `creator.ts`). No auth.
- **AI:** `/api/ai` + client keys — **being retired** (AI is a disabled "Soon" chip only). Note: `results/confirm-section.tsx` still imports `AIResultsSuggestion`.
- **Tests:** none installed.

**Verdict:** sound for its size, not "bad" — missing 4 foundations. So Phases 0–3 are foundation, 4–10 are screens, 11 is cleanup/hardening.

---

## Conventions (apply to every phase)

- **TDD loop:** failing test → implement → green → commit → push.
- **Test stack:**
  - **Vitest browser mode** (Playwright/chromium) + `vitest-browser-react` → component/"unit-in-browser" tests = the acceptance gate.
  - **MSW** mocks all HTTP (`freeBusy`, calendar list).
  - Plain **Vitest** for pure logic.
  - **Playwright** E2E — and **per-phase route/action smoke tests** for every phase with a server route/action (**6** calendar endpoint; **7, 9, 10** persistence), run against a controlled PocketBase/test repo (or live calendar mock) so server actions + RSC are exercised before the final E2E, not only at the end.
- **Mockup fidelity is asserted, not just behavior:** each screen's tests check the layout the mockup defines — dock = secondary-above-primary, responsive CTA widths, emerald "available"/green-calendar states, date-strip presence, separate cards. (Use DOM/computed-style assertions; optional screenshot snapshots.)
- **No stray AI:** every screen's acceptance asserts **no visible AI surface** except the single disabled "Soon" chip in the Times add-sheet.
- **Calendar mocks = real API shape** (Context7 / Google docs):
  - Req `POST …/calendar/v3/freeBusy` → `{ timeMin, timeMax, timeZone, items:[{id}] }`
  - Res → `{ kind:"calendar#freeBusy", calendars:{ "<calId>": { busy:[{ start, end }] } } }`
  - **Timezone/DST is explicit:** all candidate generation + busy-overlap math uses an **IANA tz** (event tz, default the host's), **half-open** `[start,end)` intervals, a fixed **horizon** (default next 14 days). DST-boundary cases are unit-tested.
- **Animation:** use **Motion** (motion.dev — the `motion` package, imported from `motion/react`; it replaces the legacy `framer-motion` dep) for all motion; centralize variants in `src/lib/motion.ts`; everything respects `prefers-reduced-motion`. Motions are specified per screen below.
- One **commit + push** per phase (`pnpm test` green first).

---

## Screens (PRD) — what each should do / look / feel

> Source of truth = the referenced mockup file. "Motion" = the Motion (motion.dev) behavior to build.

### Home — `mockups/home.html`
- **Purpose:** entry point; start a new poll or reopen a recent one.
- **Look:** centered "Timy" wordmark + tagline; a quiet recent-meetings list (avatar stack + status); one docked **Create meeting** button. No AI bar.
- **Feel:** calm, near-empty, one obvious action.
- **Interactions:** Create → Setup; tap a recent → its event.
- **Motion:** wordmark fade/scale-in; recents stagger-in; CTA press-scale.
- **States:** with recents · empty (wordmark + CTA only).

### Create · Setup — `mockups/create-1-setup.html`
- **Purpose:** capture the basics — meeting **name**, **poll-closes**, **slot length** (+ host name, see P1.2).
- **Look:** big "What are you planning?" + name input; two chip rows; docked **Continue**; stepper 1/3.
- **Feel:** friendly, fast, low-friction; three taps and you're moving.
- **Interactions:** name enables Continue; single-select chips; Continue → Times.
- **Motion:** step-in slide/fade; chip-select spring.
- **States:** invalid (Continue disabled) · valid.

### Create · Times — `mockups/create-2-times.html`
- **Purpose:** assemble candidate slots across the chosen days.
- **Look:** date strip; **separate floating** slot cards (emerald check when picked); sticky **Done** (secondary) / **+ Add** (primary, blue); bottom sheet for add-modes; calendar result list is **all-green** (cards + green "Add entries").
- **Feel:** tactile and card-based; +Add is a quick menu; calendar output reads unmistakably different (green).
- **Interactions:** pick day on strip; tap cards to toggle; **+Add** → sheet (single / **range** / **check calendar** / AI-"Soon"); range = which-days + window + interval; calendar = config sheet (weekdays + working hours) → green suggestions; Done → Review.
- **Motion:** sheet **slide-up + scrim fade** (AnimatePresence); card tap spring + check pop; green results stagger-in after a pull.
- **States:** empty · picking · add-sheet · range-sheet · calendar-config · green-results.

### Create · Review — `mockups/create-3-review.html`
- **Purpose:** confirm the locked times, one day at a time.
- **Look:** date strip (days show counts); **plain** floating cards + 🗑; sticky **← Back** / **Confirm**; stepper 3/3.
- **Feel:** a calm final check, nothing flashy.
- **Interactions:** switch day on strip; 🗑 removes; Back → Times; Confirm → persist → Share.
- **Motion:** card removal **exit** (collapse + fade); day-switch crossfade.
- **States:** per-day view · (empty day).

### Create · Share — `mockups/create-4-share.html`
- **Purpose:** the poll is live — share it, optionally fill your own availability.
- **Look:** success check; invite-link field (copy); docked **Share** (primary, opens OS sheet) / **Fill out my availability** (secondary); stepper "Done ✓".
- **Feel:** celebratory but clean — a small moment of done.
- **Interactions:** copy link; Share → `navigator.share`; Fill out → Vote (as host).
- **Motion:** success-check spring/pop; content fade-in.
- **States:** default (post-create).

### Vote — `mockups/vote.html`
- **Purpose:** a participant marks when they're free.
- **Look:** header (title + "Hosted by <host>" + avatar stack); date strip; floating slot cards; sticky **📅 Auto-check calendar** (secondary) / **Submit** (primary). The auto-filled result is **the same "When are you free?" list with more boxes ticked** — not a separate theme.
- **Feel:** the same tactile card flow as Times; obvious and quick; no AI.
- **Interactions:** pick day; toggle cards; **Auto-check forces a config sheet first** (which weekdays + working hours to scan — you can't scan without it), then returns with more slots ticked (editable, tap to drop); Submit → Results.
- **Motion:** card tap spring; config sheet slide-up; the extra ticks pop in on fill.
- **States:** manual picking · **auto-check config sheet (required)** · filled (more ticked) · submitting.

### Results — `mockups/results.html`
- **Purpose:** reveal the best time; host confirms + shares.
- **Look:** **best-slot hero** (5/5, "Everyone available", meter) + ranked others; or **heatmap matrix**; **confirmed** state (green banner + attendees); **share-time** modal with a prefilled message.
- **Feel:** a satisfying reveal — the winner pops.
- **Interactions:** **Confirm** (primary) / **See options matrix** (secondary); after confirm → **Add to calendar** (primary) / **Change time** (secondary) + **Share time** modal; re-confirm a new time → **Share update**.
- **Motion:** meter fill + count-up; confirmed-check spring; modal slide-up.
- **States:** pre-confirm hero · matrix · confirmed · re-confirmed (changed).

---

## Phases

### 0 · Test harness
- **Build:** Vitest (browser mode, chromium) + `vitest-browser-react` + MSW + Playwright; `test` / `test:e2e` scripts; MSW server.
- **Accept:** a smoke component test renders & passes in-browser; `pnpm test` green.

### 1 · Design system + motion (ref: `theme.css` + all screens)
- **Build:** port theme tokens into `globals.css`; primitives — `AppShell` (stream + sticky **Dock**), `Stepper`, `DateStrip`, `SlotCard`, `BottomSheet`, `Chip`, `AvatarStack`, `Button`. Swap `framer-motion` → **`motion`** (motion.dev); add `src/lib/motion.ts` (shared Motion variants; reduced-motion aware).
- **Accept:** Dock stacks secondary-above-primary & narrows on tablet/desktop (fidelity assert); `SlotCard` toggles emerald; `DateStrip` selects a day; `BottomSheet` opens/closes with AnimatePresence; reduced-motion disables transforms; a11y roles present.

### 2 · Domain + data layer (architecture fix)
- **Build:** `src/server/repo.ts` (typed PB repo, **batch** writes — kills N+1) + `src/lib/domain/*`: `rankSlots`, `generateSlots(days, window, interval, tz)`, `freeBusyToFreeSlots(busy, candidates)`, `computeExpiry`, `shareMessage`, plus `creator_name` plumbing. **Stub PB access rules** behind a documented gate (tightened in Phase 11).
- **Accept:** 100% unit coverage on pure fns incl. **DST-boundary** cases for generate/free-busy; repo CRUD (incl. `creator_name`) tested vs a PB test instance.

### 3 · Create-wizard state
- **Build:** `CreateDraft` context + `sessionStorage` keyed by a **generated draft id** (namespaced) holding name/host/expiry/slotLength/slots across Setup→Times→Review; new draft per fresh start.
- **Accept:** values survive nav + refresh; **two tabs don't stomp each other**; abandoned draft → fresh start; reset after submit.

### 4 · Home (ref: `home.html`)  *(was missing — added per review)*
- **Build:** rebuild `src/app/page.tsx` — wordmark, recents list, docked Create. Remove the old AI-bar/recents markup.
- **Accept:** Create routes to Setup; recents render from store (avatars + status); empty state; **no AI surface**.

### 5 · Create · Setup (ref: `create-1-setup.html`)
- **Build:** `/create` = host name + meeting name + poll-closes chips + slot-length chips + Continue. Remove `event-form.tsx`.
- **Accept:** Continue disabled until named; chips single-select; values (incl. host) → draft; routes to Times.

### 6 · Create · Times + calendar (ref: `create-2-times.html`)
- **Build:** DateStrip + separate SlotCards; **+Add** sheet (single / range / check-calendar / AI-"Soon"); range adds across selected days; calendar-config sheet (weekdays + working hours) → suggestions. **New create-time gcal path:** a dedicated OAuth/session endpoint that returns **raw free slots to the draft** (distinct from the vote-flow filter, which keeps `eventId`+`slots`). Extend gcal to *generate* candidates in-window via `freeBusy` and keep the free ones.
- **Mocks:** MSW `freeBusy` (documented shape) + calendarList.
- **Accept:** add single/range (range respects days+interval+tz — unit); suggestions exclude busy intervals incl. **DST** cases (unit); suggestions render all-green; green "Add entries" → draft; Done → Review; **no AI** beyond the "Soon" row.

### 7 · Create · Review + persist (ref: `create-3-review.html`)
- **Build:** per-day date-strip, plain cards + 🗑, ← Back / Confirm. Confirm → `repo.createEventWithSlots` (batch) → route to the **event/share route** (a minimal Share stub lands here; full Share is Phase 8, so this phase isn't blocked on it). Remove `create/slots/page.tsx` + old `create/actions.ts`.
- **Accept:** per-day filtering; trash removes from draft; Confirm persists (browser test w/ repo mocked **+ a Playwright action smoke test** vs test PB) → routes to the new event id.

### 8 · Share (ref: `create-4-share.html`)
- **Build:** flesh out the share/done screen — success, invite link/copy, **Share** (Web Share API) primary, Fill-out secondary.
- **Accept:** copy writes clipboard; Share calls `navigator.share` (mocked); Fill-out routes host into Vote.

### 9 · Vote (ref: `vote.html`)
- **Build:** header (host name + avatars), DateStrip, SlotCards, **Auto-check calendar** (secondary) that **opens a required config sheet — weekdays + working hours — before any scan**, then `freeBusy` ticks more slots on the same list; Submit (batch votes). Remove `event/[id]/client.tsx`, `ai-input-bar.tsx`.
- **Accept:** toggle slots; **Auto-check is blocked until days + working hours are set** (config sheet); confirming the sheet ticks the free slots (more checked, mocked freebusy) on the same screen; cancelling ticks nothing; Submit persists votes (repo mocked **+ Playwright smoke**) → Results; host name shown; **no AI surface**.

### 10 · Results (ref: `results.html`)
- **Build:** best-slot hero (Confirm / See-matrix) → heatmap matrix → confirmed (Add-to-calendar / Change-time + **Share-time** modal) → re-confirm = "Share update". Uses `rankSlots` + `shareMessage`; add-to-calendar via existing `lib/ics`. **Remove `AIResultsSuggestion`** import/usage here.
- **Accept:** best surfaces (unit); matrix grid renders; Confirm sets `resolved_slot` (repo mocked **+ Playwright smoke**); modal shows formatted message (unit); changed time → "Share update"; **no AI surface**.

### 11 · Cleanup + hardening + E2E
- **Build/Remove:** delete `/api/ai`, `ai-client.ts`, `ai-config*.ts`, `api-key-dialog.tsx`, `mock-data.ts`, dead Base-UI + old screen components, unused i18n keys. **Tighten PocketBase rules** (at least list/delete restrictions) as a pre-release gate.
- **Accept:** Playwright E2E happy path create → share → vote → results green; no dead imports; access-rule check passes.

---

## Throw-out summary
Old screens (`page.tsx`, `create/*`, `event/[id]/*`, `results/*`) are **replaced**, not patched. All **AI** code is deleted (kept only as a disabled "Soon" chip; `AIResultsSuggestion` pulled in Phase 10). `gcal` is **kept + extended** (now also *generates* free slots from a days+working-hours window for the create flow). PocketBase schema is unchanged; open rules are **gated to tighten in Phase 11**.

---

## Review log (Codex findings → where addressed)
- **P0·1** create-time vs vote-flow gcal mismatch → new create-time endpoint in **Phase 6**.
- **P0·2** Phase 6 coupled to Share → persist routes to a **minimal share stub**; full Share stays **Phase 8** (Phase 7).
- **P1·1** Home had no phase → **Phase 4**.
- **P1·2** host name unwired → added to **Phases 2/5/9** + draft.
- **P1·3** server actions only tested at the end → **per-phase Playwright smoke** (Conventions; Phases 6/7/9/10).
- **P1·4** tz/DST/horizon undefined → **explicit in Conventions** + DST unit tests (Phases 2/6).
- **P1·5** open PB rules → **gated**, tightened in **Phase 11**.
- **P2·1** mockup fidelity unchecked → **fidelity assertions** in Conventions + every screen phase.
- **P2·2** AI removed late/partially → **"no AI surface" acceptance** per screen + `AIResultsSuggestion` removed in Phase 10.
- **P2·3** single draft key collides → **namespaced draft id** in Phase 3.
