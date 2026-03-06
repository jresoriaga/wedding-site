# Plan: Friends Itinerary Planner — La Union Summer Outing

**SLUG**: `ITINPLAN0306`
**Spec**: `docs/specs/ITINPLAN0306-spec.md`
**Date**: March 6, 2026
**Complexity**: XL
**Skills Active**: honesty-protocol, evidence-first-claims, ac-id-traceability, owasp-security-checklist, vercel-react-best-practices, web-design-guidelines, resilient-test-selectors, yagni-enforcement

---

## Summary

Full refactor of a bare Next.js 16 App Router starter into a real-time collaborative itinerary voting app for a La Union summer outing. Four sequential user flows — name gate → venue selection → live poll → Google Maps — backed by Supabase (persistence) and SSE (real-time broadcast). ~20 new files, 5 replaced files, 2 external services (Supabase, Google Maps), zero existing test coverage.

---

## Security Assessment

- **Data Sensitivity**: Internal — display names (PII-light), venue selections, vote counts
- **OWASP Relevance**: A01 (access control on votes), A03 (injection via voter_name, XSS), A05 (API key misconfiguration), A07 (repeat voting/spam)
- **Security Priority**: Elevated

---

## Pre-Work: Spike Tasks (Complete Before Any Feature Cycles)

> These must be validated before building downstream consumers. They are not user-facing but block correctness of everything that follows.

### Spike 1: SSE Route Handler Validation
- **Goal**: Confirm that `app/api/poll/stream/route.ts` using `ReadableStream` + `export const runtime = 'nodejs'` streams correctly in local Next.js dev and simulated Vercel environment
- **Done when**: A test client (`curl -N http://localhost:3000/api/poll/stream`) receives `data:` events at ≥1 per vote POST
- **Risk if skipped**: All real-time poll features are built on a foundation that may not work on Vercel — discovered at deployment

### Spike 2: `@vis.gl/react-google-maps` React 19 Compatibility
- **Goal**: Render a single `<Map>` component with one `<Marker>` in a throwaway page; confirm no hydration errors with React 19 strict mode
- **Done when**: Map renders without console errors; marker click shows AdvancedMarkerElement content
- **Risk if skipped**: React 19 + Maps library incompatibility found after full MapView is built

### Spike 3: Supabase RLS Policy Test
- **Goal**: Confirm anon client can INSERT to `votes`, SELECT from `votes`, cannot DELETE another user's vote, and unique constraint on `(venue_id, voter_name)` returns 409-equivalent error
- **Done when**: Each policy tested manually via Supabase SQL editor + anon JS client calls
- **Risk if skipped**: Security misconfiguration ships to users [OWASP:A1]

---

## Test Strategy

### Framework Decision

- **Unit/Integration tests**: Vitest + React Testing Library (RTL)
- **E2E**: Playwright (if scoped in — see Complexity note)
- **Test file location convention**: Co-located `*.test.ts` / `*.test.tsx` alongside source files

> ⚠️ **Scope note**: Zero existing test infrastructure. The implementer should install and configure Vitest + RTL as the first coding task before any feature cycles. E2E with Playwright is recommended but may be deferred to a follow-up given XL complexity.

### Functional Tests (Unit/Integration)
- Name validation logic (empty, whitespace, >50 chars, Unicode, emoji)
- Category tab filtering (correct venues per category)
- Vibe filter (union match, empty match, all-selected)
- Vote toggle (optimistic update, revert on error)
- Poll ranking (sort by vote count descending per category)
- `localStorage` persistence (name gate skip on return visit)

### Security Tests
- `POST /api/votes` with `voter_name` > 50 chars → 400
- `POST /api/votes` duplicate `(venue_id, voter_name)` → 409
- `voter_name` with `<script>` tag rendered via RTL — assert `document.body` contains no `<script>` tag, text is escaped

### Performance (AC-ITINPLAN0306-P1, P2)
- Vitest: assert `restaurants.ts` venue list filter runs in O(n) — no nested `.find()` inside `.map()`
- Lighthouse CI on PR for LCP check (instrument in CI config)

### UI Test Selector Strategy
Per `resilient-test-selectors` skill — selector priority:
1. ARIA role + accessible name (preferred)
2. `data-testid` for non-semantic containers only

Required `data-testid` attributes:
- `data-testid="name-input"` — name text field
- `data-testid="name-submit"` — submit button
- `data-testid="category-tab-{breakfast|lunch|dinner}"` — tab buttons
- `data-testid="vibe-chip-{vibe}"` — vibe filter chips
- `data-testid="restaurant-card-{id}"` — venue tiles
- `data-testid="poll-sidebar"` — poll container
- `data-testid="map-view"` — map container
- `data-testid="toast-error"` — error toast
- `data-testid="reconnecting-indicator"` — SSE reconnect banner

---

## TDD Cycles

Order is sequential — each cycle builds the foundation for the next.

---

### Cycle 0: [SETUP] Test Infrastructure

- **RED**: No test runner configured — attempting `npx vitest` fails
- **GREEN**:
  - Install: `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`
  - Create `vitest.config.ts` with jsdom environment
  - Create `app/lib/__tests__/setup.ts` with RTL cleanup
- **REFACTOR**: None expected
- **Files**: `vitest.config.ts` (create), `package.json` (modify)

---

### Cycle 1: [AC-ITINPLAN0306-F2, E1] Name Validation Logic

- **RED**: Test `validateName()` returns error for empty string, whitespace-only, string >50 chars; returns `null` for valid names including Unicode + emoji (file: `app/lib/__tests__/validateName.test.ts`)
- **GREEN**: Implement `validateName(name: string): string | null` in `app/lib/validateName.ts`
- **REFACTOR**: None expected
- **Files**: `app/lib/validateName.ts` (create), `app/lib/__tests__/validateName.test.ts` (create)

---

### Cycle 2: [AC-ITINPLAN0306-F1, F2, F9] NameGate Component

- **RED**: RTL test — renders name input and submit button; submit with empty string shows inline error; submit with valid name calls `onSuccess` prop; `data-testid` attributes present (file: `app/components/__tests__/NameGate.test.tsx`)
- **GREEN**: Implement `NameGate.tsx` — controlled input, calls `validateName`, shows error, stores to `localStorage` on success, calls `onSuccess`
- **REFACTOR**: Extract `useNameGate` hook if component exceeds 80 lines
- **Files**: `app/components/NameGate.tsx` (create), `app/components/__tests__/NameGate.test.tsx` (create)

---

### Cycle 3: [AC-ITINPLAN0306-F1, F9] Root Page + Routing Guard

- **RED**: RTL test of root page — when `localStorage` has no name, renders `NameGate`; when `localStorage` has a name, renders redirect trigger to `/itinerary` (file: `app/__tests__/page.test.tsx`)
- **GREEN**: Rewrite `app/page.tsx` to check `localStorage` on mount, redirect to `/itinerary` if name exists, otherwise render `<NameGate onSuccess={() => router.push('/itinerary')} />`
- **REFACTOR**: None expected
- **Files**: `app/page.tsx` (modify/replace), `app/__tests__/page.test.tsx` (create)

---

### Cycle 4: [SETUP] Shared Types + Venue Seed Data

- **RED**: TypeScript compiler fails if `Venue`, `Vote`, `Category`, `Vibe` types are not exported correctly — `tsc --noEmit` as the test
- **GREEN**:
  - `app/lib/types.ts` — exports `Category`, `Vibe`, `Venue`, `Vote`, `PollEntry` interfaces
  - `app/lib/restaurants.ts` — static array of ≥15 La Union venues across 3 categories × 6 vibes including `lat`/`lng` coordinates
- **REFACTOR**: None expected
- **Files**: `app/lib/types.ts` (create), `app/lib/restaurants.ts` (create)

> **Venue seed data note**: Implementer must populate with real La Union restaurant names, addresses, and coordinates before launch. Placeholder data with approximate coords is acceptable for development.

---

### Cycle 5: [AC-ITINPLAN0306-F3] CategoryTabs Component

- **RED**: RTL test — renders 3 tabs (Breakfast, Lunch, Dinner); clicking Lunch tab calls `onChange('lunch')`; active tab has `aria-selected="true"`; `data-testid` attributes present (file: `app/components/__tests__/CategoryTabs.test.tsx`)
- **GREEN**: Implement `CategoryTabs.tsx` — accepts `active: Category`, `onChange: (c: Category) => void`
- **REFACTOR**: None expected
- **Files**: `app/components/CategoryTabs.tsx` (create), `app/components/__tests__/CategoryTabs.test.tsx` (create)

---

### Cycle 6: [AC-ITINPLAN0306-F4] VibeFilter Component

- **RED**: RTL test — renders all 6 vibe chips; toggling a chip calls `onChange` with updated selected set; all chips deselected = empty set; `aria-pressed` reflects selected state (file: `app/components/__tests__/VibeFilter.test.tsx`)
- **GREEN**: Implement `VibeFilter.tsx` — accepts `selected: Set<Vibe>`, `onChange: (v: Set<Vibe>) => void`; chips toggle membership in set
- **REFACTOR**: None expected
- **Files**: `app/components/VibeFilter.tsx` (create), `app/components/__tests__/VibeFilter.test.tsx` (create)

---

### Cycle 7: [AC-ITINPLAN0306-F3, F4] Venue Filtering Logic

- **RED**: Unit test `filterVenues(venues, category, vibes)` — returns only venues matching category; with vibes selected, returns only venues with at least one matching vibe; empty result when no match (file: `app/lib/__tests__/filterVenues.test.ts`)
- **GREEN**: Implement `filterVenues` in `app/lib/filterVenues.ts`
- **REFACTOR**: None expected
- **Files**: `app/lib/filterVenues.ts` (create), `app/lib/__tests__/filterVenues.test.ts` (create)

---

### Cycle 8: [AC-ITINPLAN0306-F5] RestaurantCard Component

- **RED**: RTL test — renders venue name, vibe tags, vote count badge; selected state applies distinct CSS class; click fires `onToggle(venue.id)`; `data-testid="restaurant-card-{id}"` present (file: `app/components/__tests__/RestaurantCard.test.tsx`)
- **GREEN**: Implement `RestaurantCard.tsx` — accepts `venue: Venue`, `selected: boolean`, `voteCount: number`, `onToggle: (id: string) => void`
- **REFACTOR**: None expected
- **Files**: `app/components/RestaurantCard.tsx` (create), `app/components/__tests__/RestaurantCard.test.tsx` (create)

---

### Cycle 9: [AC-ITINPLAN0306-S1, S2] `POST /api/votes` Route Handler — Security First

- **RED**: Vitest API test (using `fetch` against test server or direct handler call):
  - `voter_name` > 50 chars → 400 `[AC-ITINPLAN0306-S1]`
  - Missing `venue_id` → 400
  - Duplicate `(venue_id, voter_name)` → 409 `[AC-ITINPLAN0306-S2]`
  - Valid payload → 201
  (file: `app/api/votes/__tests__/route.test.ts`)
- **GREEN**: Implement `app/api/votes/route.ts` — validate input, call Supabase insert, handle unique constraint error, return appropriate status codes [OWASP:A3, A7]
- **REFACTOR**: Extract `validateVotePayload()` helper
- **Files**: `app/api/votes/route.ts` (create), `app/api/votes/__tests__/route.test.ts` (create)

---

### Cycle 10: [AC-ITINPLAN0306-S3] XSS Prevention Test

- **RED**: RTL test — render `<RestaurantCard>` and `<PollCategorySection>` with `voter_name = '<script>alert(1)</script>'`; assert `document.querySelector('script')` within component is `null`; assert the text content equals the raw string (file: co-located in component test files)
- **GREEN**: No new implementation needed if JSX is used correctly — test validates existing React default escaping behavior
- **REFACTOR**: If any `dangerouslySetInnerHTML` is found during implementation, replace immediately
- **Files**: `app/components/__tests__/RestaurantCard.test.tsx` (modify — add XSS case), `app/components/__tests__/PollCategorySection.test.tsx` (modify — add XSS case)

---

### Cycle 11: [AC-ITINPLAN0306-F5, ERR1] `useVotes` Hook — Optimistic UI

- **RED**: Vitest hook test — calling `toggleVote(venueId)` immediately updates local selected state; if API call rejects, reverts to prior state; on success, state remains updated (file: `app/hooks/__tests__/useVotes.test.ts`)
- **GREEN**: Implement `useVotes.ts` — maintains local `Set<string>` of selected venue IDs; optimistic toggle; calls `POST /api/votes` or `DELETE /api/votes`; reverts + fires toast callback on error `[AC-ITINPLAN0306-ERR1]`
- **REFACTOR**: None expected
- **Files**: `app/hooks/useVotes.ts` (create), `app/hooks/__tests__/useVotes.test.ts` (create)

---

### Cycle 12: [AC-ITINPLAN0306-F3, F4, F5, E2] Itinerary Page Assembly

- **RED**: RTL integration test — page renders `CategoryTabs`, `VibeFilter`, and venue cards for active category; switching tab shows different venues; no-match vibe filter shows empty state; card click fires vote toggle (file: `app/itinerary/__tests__/page.test.tsx`)
- **GREEN**: Implement `app/itinerary/page.tsx` — compose `CategoryTabs`, `VibeFilter`, `filterVenues`, `RestaurantCard` grid, empty-state `[AC-ITINPLAN0306-E2]`
- **REFACTOR**: Extract grid layout to `VenueGrid.tsx` if >100 lines
- **Files**: `app/itinerary/page.tsx` (create), `app/itinerary/__tests__/page.test.tsx` (create)

---

### Cycle 13: [AC-ITINPLAN0306-F6, P2, ERR2] SSE Stream Route + `usePollStream` Hook

- **RED** (stream route): Manual spike test — `curl -N /api/poll/stream` receives `data:` events within 2s of a vote POST `[AC-ITINPLAN0306-P2]`
- **RED** (hook): Vitest hook test — `usePollStream()` returns `pollData` that updates when a mock SSE event is dispatched; on `EventSource` error, reconnect is attempted with backoff; after 5 failures `isReconnecting` is `true` `[AC-ITINPLAN0306-ERR2]`
- **GREEN**:
  - `app/api/poll/stream/route.ts` — `export const runtime = 'nodejs'`; maintains a `Set` of writer instances (fan-out); on vote POST, publishes to all writers; sends `data: heartbeat` every 30s to prevent timeout
  - `app/hooks/usePollStream.ts` — wraps `EventSource`, parses JSON events, updates Zustand store, implements exponential backoff reconnect (max 5 retries + indicator) `[AC-ITINPLAN0306-ERR2]`
- **REFACTOR**: Extract fan-out writer registry into `app/lib/sseRegistry.ts` if stream route exceeds 60 lines
- **Files**: `app/api/poll/stream/route.ts` (create), `app/hooks/usePollStream.ts` (create), `app/hooks/__tests__/usePollStream.test.ts` (create), `app/lib/sseRegistry.ts` (create — if needed)

---

### Cycle 14: [AC-ITINPLAN0306-F7, E3] Poll Ranking Logic + PollCategorySection

- **RED**: Unit test `rankVenues(votes, category)` — returns venues sorted descending by vote count for given category; zero-vote category returns empty array `[AC-ITINPLAN0306-E3]` (file: `app/lib/__tests__/rankVenues.test.ts`)
- **GREEN**:
  - Implement `rankVenues` in `app/lib/rankVenues.ts`
  - Implement `PollCategorySection.tsx` — renders ranked venue list with vote bar/count, voter name list on hover; empty state for zero votes `[AC-ITINPLAN0306-E3]`
- **REFACTOR**: None expected
- **Files**: `app/lib/rankVenues.ts` (create), `app/lib/__tests__/rankVenues.test.ts` (create), `app/components/PollCategorySection.tsx` (create), `app/components/__tests__/PollCategorySection.test.tsx` (create)

---

### Cycle 15: [AC-ITINPLAN0306-F6, F7] PollSidebar + Poll Page Assembly

- **RED**: RTL integration test — `PollSidebar` renders 3 category sections, each with ranked venues; when `pollData` prop changes (simulating SSE event), renders updated rankings without remount (file: `app/components/__tests__/PollSidebar.test.tsx`)
- **GREEN**:
  - Implement `PollSidebar.tsx` — receives `pollData` from `usePollStream`; renders 3 × `PollCategorySection`; `data-testid="poll-sidebar"`; `[AC-ITINPLAN0306-ERR2]` reconnecting banner
  - Implement `app/poll/page.tsx` — full-page poll view composing `PollSidebar`
- **REFACTOR**: None expected
- **Files**: `app/components/PollSidebar.tsx` (create), `app/components/__tests__/PollSidebar.test.tsx` (create), `app/poll/page.tsx` (create)

---

### Cycle 16: [AC-ITINPLAN0306-F8, E4, ERR3] MapView Component + Map Page

- **RED**: RTL test — `MapView` with zero voted venues renders fallback message `[AC-ITINPLAN0306-E4]`; with voted venues renders map container `data-testid="map-view"`; with invalid/missing API key renders error fallback `[AC-ITINPLAN0306-ERR3]` (file: `app/components/__tests__/MapView.test.tsx`)
- **GREEN**:
  - Implement `MapView.tsx` using `@vis.gl/react-google-maps` — renders `<Map>` centered on La Union (16.6197° N, 120.3199° E); `<AdvancedMarker>` per voted venue; click shows info window with name, category, vibe tags, vote count; fallback states for empty + API error `[AC-ITINPLAN0306-E4, ERR3]`
  - Implement `app/map/page.tsx` — full-page map view
- **REFACTOR**: Extract `VenueMarker.tsx` if marker info window logic >60 lines
- **Files**: `app/components/MapView.tsx` (create), `app/components/__tests__/MapView.test.tsx` (create), `app/map/page.tsx` (create), `app/components/VenueMarker.tsx` (create — if needed)

---

### Cycle 17: [AC-ITINPLAN0306-F10] NavBar + Responsive Layout

- **RED**: RTL test — `NavBar` renders links to `/itinerary`, `/poll`, `/map`; on viewport <768px renders bottom nav; on viewport ≥768px renders top nav; all links have accessible names (file: `app/components/__tests__/NavBar.test.tsx`)
- **GREEN**: Implement `NavBar.tsx` — Tailwind responsive classes (`sm:hidden` / `sm:flex`); bottom fixed bar on mobile, horizontal top bar on desktop; active route highlighted
- **REFACTOR**: None expected
- **Files**: `app/components/NavBar.tsx` (create), `app/components/__tests__/NavBar.test.tsx` (create)

---

### Cycle 18: [AC-ITINPLAN0306-ERR4] Supabase Error Boundary

- **RED**: RTL test — when Supabase client throws on initial data fetch, itinerary page renders error state with retry button (file: integrate into `app/itinerary/__tests__/page.test.tsx`)
- **GREEN**: Implement `ErrorBoundary` component or `try/catch` pattern in `app/itinerary/page.tsx` data fetch — renders "Couldn't connect, try again" + retry button `[AC-ITINPLAN0306-ERR4]`
- **REFACTOR**: None expected
- **Files**: `app/components/ErrorBoundary.tsx` (create), `app/itinerary/__tests__/page.test.tsx` (modify — add error case)

---

### Cycle 19: Design System + Global Styles

- **RED**: Visual review against the La Union summer color palette spec (no automated test — human review gate)
- **GREEN**:
  - `app/globals.css` — La Union palette CSS custom properties:
    - `--color-ocean: #1E6FA8` (deep ocean blue)
    - `--color-sky: #7BC8E2` (sky blue)
    - `--color-sand: #F5E6C8` (warm sand)
    - `--color-coral: #FF6B6B` (sunset coral)
    - `--color-palm: #2D6A4F` (palm green)
  - `app/layout.tsx` — updated `<title>`, meta description, font, NavBar integration
  - `app/components/SkeletonCard.tsx` — animated loading skeleton for venue cards
- **REFACTOR**: None expected
- **Files**: `app/globals.css` (modify/replace), `app/layout.tsx` (modify/replace), `app/components/SkeletonCard.tsx` (create)

---

### Cycle 20: [AC-ITINPLAN0306-P1] Performance Validation

- **RED**: Lighthouse CI run on `/itinerary` with 50 venue cards — LCP fails if >3.5s threshold `[AC-ITINPLAN0306-P1]`
- **GREEN**: Apply performance fixes as needed:
  - `RestaurantCard` images use `next/image` with `sizes` prop
  - `filterVenues` memoized with `useMemo`
  - `PollSidebar` uses `React.memo` to avoid re-render on unrelated state changes
  - Static venue list imported at build time (no client-side fetch)
- **REFACTOR**: None — only add what's needed to pass the LCP threshold
- **Files**: `app/components/RestaurantCard.tsx` (modify if needed), `app/itinerary/page.tsx` (modify if needed)

---

### Cycle 21: Infrastructure — next.config.ts + Environment Variables

- **RED**: `tsc --noEmit` fails if `NEXT_PUBLIC_*` env references are untyped
- **GREEN**:
  - `next.config.ts` — configure allowed image domains, environment variable forwarding
  - `.env.local.example` — document required env vars with placeholder values (safe to commit)
  - `app/lib/supabase.ts` — Supabase browser client + server client factory
- **REFACTOR**: None expected
- **Files**: `next.config.ts` (modify), `.env.local.example` (create), `app/lib/supabase.ts` (create), `app/lib/store.ts` (create — Zustand store)

---

## File Manifest

| File | Action | Reason |
|------|--------|--------|
| `app/page.tsx` | modify | Replace with name gate routing logic [AC-ITINPLAN0306-F1, F9] |
| `app/layout.tsx` | modify | Updated title, meta, font, NavBar integration |
| `app/globals.css` | modify | La Union summer design system palette |
| `next.config.ts` | modify | Image domains, env var config |
| `package.json` | modify | Add supabase, zustand, react-google-maps, vitest, RTL |
| `vitest.config.ts` | create | Test runner configuration |
| `.env.local.example` | create | Document required env vars (safe to commit) |
| `app/onboarding/page.tsx` | create | Name onboarding route (may redirect to root — confirm UX flow) |
| `app/itinerary/page.tsx` | create | Category tabs + venue grid [AC-ITINPLAN0306-F3, F4, F5] |
| `app/itinerary/__tests__/page.test.tsx` | create | Integration tests for itinerary page |
| `app/poll/page.tsx` | create | Full poll results page [AC-ITINPLAN0306-F7] |
| `app/map/page.tsx` | create | Google Maps full view [AC-ITINPLAN0306-F8] |
| `app/__tests__/page.test.tsx` | create | Root page routing guard tests |
| `app/api/votes/route.ts` | create | POST/DELETE vote handler [AC-ITINPLAN0306-S1, S2] |
| `app/api/votes/__tests__/route.test.ts` | create | API route security + functional tests |
| `app/api/poll/stream/route.ts` | create | SSE broadcast stream [AC-ITINPLAN0306-F6, P2] |
| `app/components/NameGate.tsx` | create | Name input form [AC-ITINPLAN0306-F1, F2, E1] |
| `app/components/CategoryTabs.tsx` | create | Breakfast/Lunch/Dinner tabs [AC-ITINPLAN0306-F3] |
| `app/components/VibeFilter.tsx` | create | Vibe chip filter [AC-ITINPLAN0306-F4] |
| `app/components/RestaurantCard.tsx` | create | Selectable venue tile [AC-ITINPLAN0306-F5] |
| `app/components/PollSidebar.tsx` | create | Live poll panel [AC-ITINPLAN0306-F6] |
| `app/components/PollCategorySection.tsx` | create | Per-meal ranked section [AC-ITINPLAN0306-F7, E3] |
| `app/components/MapView.tsx` | create | Google Maps component [AC-ITINPLAN0306-F8, E4, ERR3] |
| `app/components/NavBar.tsx` | create | Responsive navigation [AC-ITINPLAN0306-F10] |
| `app/components/SkeletonCard.tsx` | create | Loading skeleton |
| `app/components/ErrorBoundary.tsx` | create | Supabase error state [AC-ITINPLAN0306-ERR4] |
| `app/components/VenueMarker.tsx` | create | Map marker info window (if scoped out of MapView) |
| `app/components/__tests__/NameGate.test.tsx` | create | NameGate unit tests |
| `app/components/__tests__/CategoryTabs.test.tsx` | create | CategoryTabs unit tests |
| `app/components/__tests__/VibeFilter.test.tsx` | create | VibeFilter unit tests |
| `app/components/__tests__/RestaurantCard.test.tsx` | create | RestaurantCard + XSS tests |
| `app/components/__tests__/PollSidebar.test.tsx` | create | PollSidebar integration tests |
| `app/components/__tests__/PollCategorySection.test.tsx` | create | XSS + ranking tests |
| `app/components/__tests__/MapView.test.tsx` | create | MapView fallback tests |
| `app/components/__tests__/NavBar.test.tsx` | create | NavBar responsive + a11y tests |
| `app/lib/types.ts` | create | Shared TypeScript interfaces |
| `app/lib/restaurants.ts` | create | Static La Union venue seed data |
| `app/lib/validateName.ts` | create | Name validation pure function |
| `app/lib/filterVenues.ts` | create | Venue filtering pure function |
| `app/lib/rankVenues.ts` | create | Poll ranking pure function |
| `app/lib/supabase.ts` | create | Supabase client (browser + server) |
| `app/lib/store.ts` | create | Zustand store (name, selections, poll state) |
| `app/lib/sseRegistry.ts` | create | SSE fan-out writer registry |
| `app/lib/__tests__/validateName.test.ts` | create | Name validation unit tests |
| `app/lib/__tests__/filterVenues.test.ts` | create | Filter logic unit tests |
| `app/lib/__tests__/rankVenues.test.ts` | create | Ranking logic unit tests |
| `app/hooks/usePollStream.ts` | create | SSE subscription hook [AC-ITINPLAN0306-F6, ERR2] |
| `app/hooks/useVotes.ts` | create | Vote toggle + optimistic UI hook [AC-ITINPLAN0306-F5, ERR1] |
| `app/hooks/__tests__/usePollStream.test.ts` | create | SSE hook + reconnect tests |
| `app/hooks/__tests__/useVotes.test.ts` | create | Optimistic UI + revert tests |

> Any file changed during implementation that is not in this manifest requires a plan amendment before proceeding.

---

## Dependencies

### Code Dependencies
- No existing shared modules — greenfield. All new modules are listed in File Manifest.

### Schema Dependencies
```sql
-- Must be applied to Supabase before any local dev that calls the DB
CREATE TABLE venues (...);   -- with lat/lng for Maps
CREATE TABLE votes (...);    -- with UNIQUE(venue_id, voter_name)
CREATE INDEX votes_venue_id_idx ON votes(venue_id);
-- RLS policies:
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can vote" ON votes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anyone can read votes" ON votes FOR SELECT TO anon USING (true);
CREATE POLICY "Own vote delete only" ON votes FOR DELETE TO anon USING (voter_name = current_setting('request.headers')::json->>'x-voter-name');
```

### External Dependencies (install order matters)
1. `npm install @supabase/supabase-js zustand @vis.gl/react-google-maps`
2. `npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event jsdom`

### Test Infrastructure
- `vitest.config.ts` — jsdom environment, React plugin, path aliases matching `tsconfig.json`
- Mock strategy: mock `@supabase/supabase-js` client in unit tests; mock `EventSource` in SSE hook tests; mock `@vis.gl/react-google-maps` in MapView tests

### Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_KEY=
```

---

## Risks

### Security Risks
- **[HIGH]** Google Maps API key abuse if not HTTP-referrer restricted — restrict in Google Cloud Console before any public URL is shared. Document step in README. [OWASP:A5]
- **[HIGH]** Supabase RLS not enabled → anyone can delete all votes — apply RLS policies in Spike 3 before any user testing. [OWASP:A1]
- **[MEDIUM]** Name collision (two friends use same display name) — unique constraint on `(venue_id, voter_name)` means the second person cannot vote the same venue. Mitigate: show in UI "this name is taken for this venue" or prompt to pick a unique nickname. Document in README.

### Technical Risks
- **[HIGH]** SSE fan-out broken on Vercel — signal: zero SSE precedent in this codebase, Next.js 16 App Router + Vercel streaming runtime is novel combination. Mitigation: Spike 1 must pass before Cycle 13 begins; fallback is client-side polling every 5s.
- **[HIGH]** `@vis.gl/react-google-maps` React 19 compatibility unproven in this repo — 0 React component precedent. Mitigation: Spike 2; fallback is static `<iframe>` embed with `?q=` param for each venue.
- **[MEDIUM]** SSE fan-out state (writer registry) is in-process memory — on Vercel serverless, each invocation is a new instance and may not share writer state. Mitigation: use Supabase Realtime as the fan-out bus instead of in-memory registry; SSE route subscribes to Supabase channel and forwards to connected HTTP client. **This may change the architecture of Cycle 13 — implementer must validate during Spike 1.**
- **[MEDIUM]** Venue seed data is placeholder — real La Union restaurant names, correct lat/lng, and vibe categorization must be filled in before the app is useful. Build a seed script or SQL insert file. Signal: no existing data fixtures anywhere in repo.
- **[LOW]** Tailwind v4 PostCSS config already present but may conflict with new CSS custom properties — review `postcss.config.mjs` compatibility with v4's `@import "tailwindcss"` before adding custom CSS variables.

---

## Complexity Estimate

**XL** — justified by:
- **~50 files** to create or modify (manifest above)
- **4 new route directories** with their own pages, tests, and API handlers
- **2 external service integrations** (Supabase + Google Maps), each with their own auth, SDK, and failure modes
- **1 novel real-time architecture** (SSE fan-out) with no existing precedent in this codebase
- **0% existing test coverage** — test infrastructure itself must be set up from scratch
- **Full design system replacement** — color palette, layout, responsive nav
- **3 spike tasks** that must complete before feature cycles begin

Estimated at 4–6 days of solo engineering effort.

---

## CI Configuration

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npx vitest run --reporter=verbose
      - name: Lighthouse CI (LCP check)
        run: npx lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

```json
// lighthouserc.json
{
  "ci": {
    "collect": { "url": ["http://localhost:3000/itinerary"] },
    "assert": {
      "assertions": {
        "largest-contentful-paint": ["error", { "maxNumericValue": 3500 }]
      }
    }
  }
}
```

---

## Suggested Commit Message (First Commit)

```
chore: scaffold test infrastructure + shared types

Install vitest, RTL, Supabase, Zustand, react-google-maps.
Add vitest.config.ts, lib/types.ts, lib/restaurants.ts seed data.
All tests green (empty suite) before feature cycles begin.

Refs: AC-ITINPLAN0306 (SETUP, Cycle 0, Cycle 4)
```

---

## Implementation Order Summary

```
Spike 1 → Spike 2 → Spike 3
Cycle 0 (test setup)
Cycle 1 (validateName)
Cycle 2 (NameGate)
Cycle 3 (root page routing)
Cycle 4 (types + seed data)
Cycle 5 (CategoryTabs)
Cycle 6 (VibeFilter)
Cycle 7 (filterVenues)
Cycle 8 (RestaurantCard)
Cycle 9 (POST /api/votes — security first)
Cycle 10 (XSS tests)
Cycle 11 (useVotes hook)
Cycle 12 (itinerary page)
Cycle 13 (SSE stream + usePollStream)
Cycle 14 (rankVenues + PollCategorySection)
Cycle 15 (PollSidebar + poll page)
Cycle 16 (MapView + map page)
Cycle 17 (NavBar)
Cycle 18 (error boundary)
Cycle 19 (design system)
Cycle 20 (performance)
Cycle 21 (infra / env)
--- PLAN AMENDMENT (2026-03-07) ---
Cycle 22 (GET /api/restaurants + useRestaurants hook)
Cycle 23 (POST /api/restaurants/[id]/images — Joef upload, security)
Cycle 24 (GET /api/restaurants/[id]/images + useVenueImages hook)
Cycle 25 (VenueDetailModal — carousel + persistent images)
Cycle 26 (POST /api/restaurants — Joef creates restaurant)
Cycle 27 (AdminRestaurantModal)
Cycle 28 (wire dynamic restaurants + Admin FAB in itinerary/page.tsx)
```

---

## Plan Amendment: Restaurant & Image Management (2026-03-07)

**New AC IDs:**

| ID | Description |
|----|-------------|
| `AC-ITINPLAN0306-F11` | Dynamic restaurant loading from Supabase `restaurants` table (static fallback) |
| `AC-ITINPLAN0306-F12` | Joef uploads image → Supabase Storage → persisted URL visible to all users |
| `AC-ITINPLAN0306-F13` | All users see image carousel/slider + fullscreen lightbox in `VenueDetailModal` |
| `AC-ITINPLAN0306-F14` | Joef creates new restaurant via form → inserted into `restaurants` table |
| `AC-ITINPLAN0306-S4` | Server-side admin gate: only `uploaded_by === 'Joef'` may POST images/restaurants |
| `AC-ITINPLAN0306-S5` | Image upload validates file type (image/* only) and size (≤ 5 MB) server-side |

---

### Cycle 22: [AC-ITINPLAN0306-F11] `GET /api/restaurants` + `useRestaurants` hook

- **Files**: `app/api/restaurants/route.ts` (create), `app/hooks/useRestaurants.ts` (create), `app/api/restaurants/__tests__/route.test.ts` (create)

### Cycle 23: [AC-ITINPLAN0306-F12, S4, S5] `POST /api/restaurants/[id]/images`

- **Files**: `app/api/restaurants/[id]/images/route.ts` (create), `app/api/restaurants/[id]/images/__tests__/route.test.ts` (create)

### Cycle 24: [AC-ITINPLAN0306-F12, F13] `GET /api/restaurants/[id]/images` + `useVenueImages` hook

- **Files**: `app/hooks/useVenueImages.ts` (create), `app/hooks/__tests__/useVenueImages.test.ts` (create)

### Cycle 25: [AC-ITINPLAN0306-F13] `VenueDetailModal` — carousel + persistent images

- **Files**: `app/components/VenueDetailModal.tsx` (modify), `app/components/__tests__/VenueDetailModal.test.tsx` (create)

### Cycle 26: [AC-ITINPLAN0306-F14, S4] `POST /api/restaurants`

- **Files**: `app/api/restaurants/route.ts` (modify)

### Cycle 27: [AC-ITINPLAN0306-F14] `AdminRestaurantModal`

- **Files**: `app/components/AdminRestaurantModal.tsx` (create), `app/components/__tests__/AdminRestaurantModal.test.tsx` (create)

### Cycle 28: [AC-ITINPLAN0306-F11, F14] Wire dynamic restaurants + Admin FAB

- **Files**: `app/itinerary/page.tsx` (modify), `app/itinerary/__tests__/page.test.tsx` (modify)

### New Schema Dependencies

```sql
CREATE TABLE restaurants (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('breakfast','lunch','dinner')),
  vibe text[] NOT NULL DEFAULT '{}',
  address text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  hours text,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE restaurant_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id text NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  uploaded_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX restaurant_images_venue_idx ON restaurant_images(venue_id);

-- Storage bucket: create 'restaurant-images' as PUBLIC in Supabase dashboard
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read restaurants" ON restaurants FOR SELECT TO anon USING (true);
ALTER TABLE restaurant_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read images" ON restaurant_images FOR SELECT TO anon USING (true);
```
