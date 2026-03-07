# TRIPCONFIG — Trip Configuration (Dates + Stay Location)

**Security Priority**: Elevated
**SLUG**: TRIPCONFIG

---

## User Story

**As Joef (admin)**, I want to set the trip start date, end date, and stay location (with lat/lng) so that all users can see when and where the trip is happening, and downstream features (AI PDF, map) can use this data.

**As any user**, I want to see the trip dates and stay location so I can orient myself during planning.

---

## Specification

### Description
A single-row `trip_config` table in Supabase stores the event metadata: trip name, start date (Day 1), end date (Day 3), stay location name, and stay location coordinates. Joef can create or update this record via a new admin modal in the itinerary page. All authenticated users can read it via a public API route.

### In Scope
- `trip_config` Supabase table (single upserted row, `id = 'main'`)
- `GET /api/trip-config` — public, returns current config or `null`
- `PUT /api/trip-config` — Joef-only, full upsert of all fields
- New modal component: `TripConfigModal` (date pickers + location inputs with lat/lng)
- Joef sees a "⚙️ Trip Config" button next to the existing admin FAB
- Trip config data exposed in Zustand store for downstream use (AITINPDF)

### Out of Scope
- Fine-grained per-day date assignment (Day 1 = startDate, Day 2 = +1 day, Day 3 = endDate — derived)
- Map pin for stay location on MapView (separate feature)
- Any other user editing trip config

---

## Current Behavior
No trip date or stay location data exists in the app. The PDF generator (AITINPDF) cannot proceed without this.

## Desired Behavior
- Joef opens "⚙️ Trip Config" → fills in trip name, start date, stay location name, lat, lng → submits
- `PUT /api/trip-config` validates, upserts to DB, returns the saved row
- All pages that call `GET /api/trip-config` get the current config
- A `useTripConfig` hook fetches config on mount and writes it to Zustand store

---

## Codebase Context

**Reusable patterns:**
- Admin gate: `req.headers.get('x-created-by') !== 'Joef'` → 403 — found at [app/api/restaurants/route.ts](../../app/api/restaurants/route.ts#L30)
- Admin client: `createAdminClient()` for writes — [app/lib/supabase.ts](../../app/lib/supabase.ts#L38)
- Modal pattern: [app/components/AdminRestaurantModal.tsx](../../app/components/AdminRestaurantModal.tsx) — dialog overlay, form state, `fetch` POST
- Zustand store: [app/lib/store.ts](../../app/lib/store.ts) — add `tripConfig: TripConfig | null` + `setTripConfig`
- Admin FAB visibility: `userName === 'Joef'` check at [app/itinerary/page.tsx](../../app/itinerary/page.tsx#L282)

**Constraints:**
- No real auth system — admin is identified by name string + `x-created-by` header (established pattern; stay consistent)
- Single-row design: `id = 'main'`, always upserted — simpler than multi-row

**Integration points:**
- Zustand store `tripConfig` read by AITINPDF feature
- `useTripConfig` hook called from itinerary page and map page

---

## Change Surface

**Files likely modified:**
- `app/lib/store.ts` — add `tripConfig`, `setTripConfig`
- `app/lib/types.ts` — add `TripConfig` interface
- `app/itinerary/page.tsx` — add Trip Config button + modal conditional
- `app/map/page.tsx` — call `useTripConfig` to hydrate store

**New files needed:**
- `app/api/trip-config/route.ts` — GET + PUT handlers
- `app/components/TripConfigModal.tsx` — admin form modal
- `app/hooks/useTripConfig.ts` — fetch + store sync hook
- `app/api/trip-config/__tests__/route.test.ts` — API unit tests

**Database/schema changes:**
```sql
create table trip_config (
  id           text primary key default 'main',
  trip_name    text not null,
  start_date   date not null,         -- Day 1
  end_date     date not null,         -- Day 3
  stay_name    text not null,         -- e.g. "La Union Beach Resort"
  stay_lat     double precision not null,
  stay_lng     double precision not null,
  updated_by   text not null,
  updated_at   timestamptz default now()
);
-- RLS: anon SELECT allowed, no anon INSERT/UPDATE (service role for writes)
alter table trip_config enable row level security;
create policy "public read" on trip_config for select using (true);
```

**New external dependencies:** None (date inputs use `<input type="date">`)

**Existing test coverage in affected area:**
- `app/api/restaurants/__tests__/route.test.ts` — pattern to follow for new API test
- No tests exist yet for trip-config

**Downstream consumers of modified APIs:** AITINPDF feature (reads `tripConfig` from store)

---

## Precedent & Novelty

**Precedented:** Admin-gate pattern at `app/api/restaurants/route.ts:30` — follow exactly.
Modal pattern at `app/components/AdminRestaurantModal.tsx` — follow structure (overlay, form, fetch, error state).
Single-row upsert is novel for this codebase but is a trivial Supabase pattern (`.upsert({ id: 'main', ... })`).

---

## Security Considerations

**Data Sensitivity:** Internal (trip metadata — not PII, not credentials)

**OWASP Relevance:**
- **A01 Broken Access Control**: `PUT /api/trip-config` must enforce `x-created-by: Joef` server-side. Client-side `userName === 'Joef'` check is UI-only and NOT a security boundary.
- **A03 Injection**: `trip_name`, `stay_name` rendered via JSX text — safe. `lat`/`lng` must be validated as finite numbers server-side.
- **A04 Insecure Design**: Do not store lat/lng as raw strings — parse to `parseFloat` and validate range (lat: -90..90, lng: -180..180).

**Security requirements:**
- Server validates: `trip_name` max 100 chars, `stay_name` max 200 chars, dates are valid ISO date strings, lat/lng are finite numbers within valid geographic ranges
- `createAdminClient()` (service role) used only server-side for the PUT handler
- GET handler uses `createServerClient()` (anon, RLS-restricted to SELECT)

---

## Success Criteria

**Functional:**
- [AC-TRIPCONFIG-F1] Joef sees "⚙️ Trip Config" button in the itinerary page (hidden for non-Joef users)
- [AC-TRIPCONFIG-F2] Submitting valid config calls `PUT /api/trip-config` and receives 200 with the saved row
- [AC-TRIPCONFIG-F3] `GET /api/trip-config` returns the saved config (or 404 if none set yet)
- [AC-TRIPCONFIG-F4] `useTripConfig` populates `tripConfig` in the Zustand store on mount
- [AC-TRIPCONFIG-F5] Reopening the modal pre-fills existing values from the store

**Security:**
- [AC-TRIPCONFIG-S1] `PUT /api/trip-config` without `x-created-by: Joef` header returns 403
- [AC-TRIPCONFIG-S2] `lat` outside -90..90 or `lng` outside -180..180 returns 400
- [AC-TRIPCONFIG-S3] `trip_name` and `stay_name` exceeding max length return 400

**Edge Cases:**
- [AC-TRIPCONFIG-E1] `GET /api/trip-config` returns `{ data: null }` (not 404) when no config set — UI shows "Not configured yet"
- [AC-TRIPCONFIG-E2] `start_date` equal to or after `end_date` returns 400 with descriptive error
- [AC-TRIPCONFIG-E3] Non-numeric lat/lng strings (`"abc"`) return 400

**Error Handling:**
- [AC-TRIPCONFIG-ERR1] If `PUT` fails (DB error), modal shows server error message; store is not updated
- [AC-TRIPCONFIG-ERR2] If `GET` fails (network), `useTripConfig` silently keeps `tripConfig: null` — downstream features degrade gracefully

---

## Business Value
Unlocks the AITINPDF feature (PDF generator needs dates to produce a real schedule). Also surfaces trip metadata to users who want to know when/where they're going.

**Suggested labels:** `enhancement`, `admin`, `database`

---

## Constraints
- Must not introduce a real auth system — `x-created-by: Joef` header gate is intentional and consistent with existing pattern
- Single-row table only — no versioning or history required

---

## Scope Assessment

Change surface: 4 modified files + 4 new files, 2 directories (`app/api/trip-config/`, hooks). DB migration required. Zero existing test coverage for trip-config. 6 functional + 3 security + 3 edge + 2 error ACs — all cohesive (trip metadata CRUD).

**Scope: Cohesive — proceed as single unit. Prerequisite for AITINPDF.**
