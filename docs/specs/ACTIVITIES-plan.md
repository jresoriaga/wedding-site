# ACTIVITIES Plan

**SLUG:** `ACTIVITIES`  
**Spec:** `docs/specs/ACTIVITIES-spec.md`  
**Created:** 2026-03-07

---

## Summary

Add a La Union **activities poll** — fully parallel to the existing restaurant poll. Users vote on activities (surfing, sightseeing, beach, etc.) per day, see real-time results with progress bars and voter name badges, and switch between Restaurants and Activities via a tab on `/poll`.

---

## Security Assessment

- **Data Sensitivity:** Internal (trip group only, no PII beyond voter first names)
- **OWASP Relevance:** A3 (Injection — activity_id/voter_name input validation), A1 (Broken Access Control — admin-only activity creation)
- **Security Priority:** Standard (same threat model as existing restaurant poll)

---

## Test Strategy

### Functional Tests
- Unit: `rankActivities` — correct sort order, tie-breaking, zero-vote inclusion, day isolation
- Unit: `memAddActivityVote` / `memRemoveActivityVote` — duplicate detection, in-memory CRUD
- Integration: `POST /api/activity-votes` — happy path 201, duplicate 409, missing field 400
- Integration: `DELETE /api/activity-votes` — single delete, bulk clear by day
- Integration: `GET /api/activities` — returns static fallback when DB empty
- Component: `ActivityCard` — renders name, vibe tags, vote toggle, voter badges
- Component: `ActivityPollSection` — ranked list, progress bars, "No votes yet" empty state
- Hook: `useActivityPollStream` — reconnects on SSE drop, populates activityPollData

### Security Tests (OWASP-Aligned)
- `POST /api/activity-votes` with XSS payload in voter_name → sanitized, no injection (OWASP A3)
- `POST /api/activity-votes` with empty activity_id → 400 (OWASP A3)
- `POST /api/activity-votes` duplicate → 409 (OWASP A1 — prevents ballot stuffing)
- `GET /api/activity-poll/stream` — no authentication required (same as restaurant stream — public trip)

---

## Test List (TDD Cycles)

### Cycle 1: [AC-ACTIVITIES-F12] `rankActivities` utility

- **RED:** Test `rankActivities` sorts by vote count desc, includes zero-vote entries, isolates by day — file: `app/lib/__tests__/rankActivities.test.ts`
- **GREEN:** Create `app/lib/rankActivities.ts` mirroring `rankVenues` with `ActivityCategory` and `ActivityVote` — file: `app/lib/rankActivities.ts`
- **REFACTOR:** None expected — pure function

### Cycle 2: [AC-ACTIVITIES-F3, F4, S1, S2] Activity votes API

- **RED:** Test POST 201 happy path, POST 409 duplicate, POST 400 bad payload, DELETE single, DELETE bulk day prefix — file: `app/api/activity-votes/__tests__/route.test.ts`
- **GREEN:** Create `app/api/activity-votes/route.ts` — input validation, Supabase `activity_votes` table, in-memory fallback, SSE broadcast — file: `app/api/activity-votes/route.ts`
- **REFACTOR:** None expected

### Cycle 3: [AC-ACTIVITIES-F5] Activity SSE stream

- **RED:** Test GET returns `text/event-stream` with `activity-votes` event — file: `app/api/activity-poll/stream/__tests__/route.test.ts`
- **GREEN:** Create `app/lib/sseActivityRegistry.ts` (copy of `sseRegistry.ts`) + `app/api/activity-poll/stream/route.ts` — files: `app/lib/sseActivityRegistry.ts`, `app/api/activity-poll/stream/route.ts`
- **REFACTOR:** None expected

### Cycle 4: [AC-ACTIVITIES-F8] `ActivityCard` component

- **RED:** Test renders activity name, vibe tags, voter badges when voted, aria-pressed toggle — file: `app/components/__tests__/ActivityCard.test.tsx`
- **GREEN:** Create `app/components/ActivityCard.tsx` mirroring `RestaurantCard` — file: `app/components/ActivityCard.tsx`
- **REFACTOR:** None expected

### Cycle 5: [AC-ACTIVITIES-F9, E1] `ActivityPollSection` component

- **RED:** Test renders ranked list, progress bars, voter badges, "No votes yet" empty state — file: `app/components/__tests__/ActivityPollSection.test.tsx`
- **GREEN:** Create `app/components/ActivityPollSection.tsx` mirroring `PollCategorySection` — file: `app/components/ActivityPollSection.tsx`
- **REFACTOR:** None expected

### Cycle 6: [AC-ACTIVITIES-F10] Poll page tab switcher

- **RED:** Test "Activities" tab renders ActivityPollSection, "Restaurants" tab renders existing PollCategorySection — file: `app/poll/__tests__/page.test.tsx` (new or update existing)
- **GREEN:** Update `app/poll/page.tsx` — add `pollTab` state (`'restaurants' | 'activities'`), render tab buttons, conditionally render restaurant vs activity sections
- **REFACTOR:** Extract tab button to inline component if repeated 3+ times

### Cycle 7: [AC-ACTIVITIES-F7, E2] `useActivityPollStream` hook

- **RED:** Test SSE message populates `activityPollData`, reconnects on error — file: `app/hooks/__tests__/useActivityPollStream.test.ts`
- **GREEN:** Create `app/hooks/useActivityPollStream.ts` mirroring `usePollStream.ts` with `activity-votes` event name and `rankActivities` — file: `app/hooks/useActivityPollStream.ts`
- **REFACTOR:** None expected

### Cycle 8: [AC-ACTIVITIES-F13, F14] TripConfig expansion — departure & arrival times

- **RED:** Test that `PUT /api/trip-config` accepts and persists `departure_time` + `arrival_time`; test that missing values default gracefully — file: update `app/api/trip-config/__tests__/route.test.ts` (if exists) or create
- **GREEN:** 
  - Add `departure_time?: string` and `arrival_time?: string` to `TripConfig` in `app/lib/types.ts`
  - Update `PUT /api/trip-config` route to accept + validate the new fields
  - Update `TripConfigModal.tsx` to show two time inputs (departure, arrival) with `HH:MM AM/PM` format
  - Run `ALTER TABLE trip_config ADD COLUMN departure_time text; ALTER TABLE trip_config ADD COLUMN arrival_time text;` in Supabase
- **REFACTOR:** None expected

### Cycle 9: [AC-ACTIVITIES-F15] `scheduleBuilder` — proximity-ordered day planner

- **RED:** Test `haversineKm` returns correct distances; test `buildDaySchedule` returns slots ordered by proximity (hotel → nearest → next nearest); test Day 1 arrival logic (before 2pm → lunch first, 2-5pm → activity first, after 5pm → dinner first) — file: `app/lib/__tests__/scheduleBuilder.test.ts`
- **GREEN:** Create `app/lib/scheduleBuilder.ts`:
  - `haversineKm(lat1, lng1, lat2, lng2): number` — pure math, no deps
  - `estimateTravelMinutes(km: number): number` — 30 km/h avg La Union traffic
  - `buildDaySchedule(config, topRestaurants, topActivities, day): ScheduleSlot[]` — greedy nearest-neighbor starting from hotel coords; Day 1 uses `arrival_time` to skip earlier time slots
- **REFACTOR:** None expected — pure functions, no side effects

### Cycle 10: [AC-ACTIVITIES-F16, F17] Update itinerary generate route — unified AI schedule

- **RED:** Test that the generate route now reads `activity_votes` in addition to `votes`; test that the prompt includes distance/proximity data; test that response validates new `GeneratedItinerary` schema with `items[]` (meals + activities) — file: update `app/api/itinerary/generate/__tests__/route.test.ts`
- **GREEN:** Update `app/api/itinerary/generate/route.ts`:
  - Read `activity_votes` from Supabase (or `memGetActivityVotes()` fallback)
  - Build top activity per slot per day using same vote-count desc + alpha tie-break
  - Call `buildDaySchedule()` to get proximity-ordered `ScheduleSlot[]` per day
  - Update `buildUserContent()` prompt to include `[Type: meal|activity] [Name] at [Address] (lat, lng) — ~Xkm from prev, ~Y min travel`
  - Instruct AI to fill `startTime`, `duration` (realistic: surf lesson = 2hrs, lunch = 1hr), `travelNote`
  - Update `isValidItinerary()` to validate new `items[]` schema
- **REFACTOR:** None expected

### Cycle 11: [AC-ACTIVITIES-F18] Update `ItineraryPDF.tsx` — chronological timeline layout

- **RED:** Test that ItineraryPDF renders both meal items AND activity items; test that items are in time order; test travel time note between consecutive stops — file: update `app/components/__tests__/ItineraryPDF.test.tsx`
- **GREEN:** Update `app/components/ItineraryPDF.tsx`:
  - Replace meal-only cards with a unified `TimelineItem` component
  - Each item shows: start time badge, type icon (🍽️ meal / 🎯 activity), name, address, duration, travel-to-next note
  - Day header now shows Day 1 arrival time and Day 3 departure time
- **REFACTOR:** None expected

---

## File Manifest

| File | Action | Reason |
|------|--------|--------|
| `app/lib/types.ts` | modify | Add `ActivityCategory`, `ActivityVibe`, `Activity`, `ActivityVote`, `ActivityPollEntry`, `ActivityPollData`, `ScheduleSlot`, `ItineraryItem`; expand `TripConfig` with `departure_time`, `arrival_time` |
| `app/lib/activities.ts` | create | Static list of ~15 La Union activities (morning/afternoon/evening categories) |
| `app/lib/rankActivities.ts` | create | Sort `ActivityPollEntry[]` by vote count, day-isolated |
| `app/lib/sseActivityRegistry.ts` | create | Separate fan-out registry for activity SSE stream |
| `app/lib/scheduleBuilder.ts` | create | `haversineKm`, `estimateTravelMinutes`, `buildDaySchedule` — proximity ordering and Day 1 arrival logic |
| `app/lib/memoryStore.ts` | modify | Add `memAddActivityVote`, `memRemoveActivityVote`, `memGetActivityVotes`, `memClearDayActivityVotes` |
| `app/lib/store.ts` | modify | Add `activityPollData`, `selectedActivityIds`, `activityVenues`, `activityAllVotes` state slices |
| `app/lib/__tests__/rankActivities.test.ts` | create | TDD — Cycle 1 |
| `app/lib/__tests__/scheduleBuilder.test.ts` | create | TDD — Cycle 9 |
| `app/api/activities/route.ts` | create | `GET /api/activities` — returns activity list from Supabase or static fallback |
| `app/api/activity-votes/route.ts` | create | `POST/DELETE /api/activity-votes` — add/remove activity votes |
| `app/api/activity-votes/__tests__/route.test.ts` | create | TDD — Cycle 2 |
| `app/api/activity-poll/stream/route.ts` | create | `GET /api/activity-poll/stream` — SSE fan-out for activity votes |
| `app/api/activity-poll/stream/__tests__/route.test.ts` | create | TDD — Cycle 3 |
| `app/api/trip-config/route.ts` | modify | Accept + validate `departure_time` + `arrival_time` fields |
| `app/api/itinerary/generate/route.ts` | modify | Read activity votes, call `buildDaySchedule`, send proximity-ordered prompt, validate new schema |
| `app/api/itinerary/generate/__tests__/route.test.ts` | modify | Add tests for activity slots, proximity ordering, arrival-time logic — Cycle 10 |
| `app/components/ActivityCard.tsx` | create | Card UI for voting on an activity |
| `app/components/ActivityPollSection.tsx` | create | Ranked poll section for one activity category |
| `app/components/TripConfigModal.tsx` | modify | Add departure time + arrival time inputs |
| `app/components/ItineraryPDF.tsx` | modify | Replace meal-only cards with unified chronological timeline (meals + activities) |
| `app/components/__tests__/ActivityCard.test.tsx` | create | TDD — Cycle 4 |
| `app/components/__tests__/ActivityPollSection.test.tsx` | create | TDD — Cycle 5 |
| `app/components/__tests__/ItineraryPDF.test.tsx` | modify | Add tests for activity items in timeline — Cycle 11 |
| `app/hooks/useActivityPollStream.ts` | create | SSE connection + store wiring for activity votes |
| `app/hooks/__tests__/useActivityPollStream.test.ts` | create | TDD — Cycle 7 |
| `app/poll/page.tsx` | modify | Add 🍽️/🎯 tab switcher + Activities poll sections |

---

## Implementation Notes (for @implementer)

### Types to add to `app/lib/types.ts`

```typescript
export type ActivityCategory = 'morning' | 'afternoon' | 'evening'

export type ActivityVibe =
  | 'beach'
  | 'adventure'
  | 'sightseeing'
  | 'leisure'
  | 'nightlife'
  | 'nature'

export interface Activity {
  id: string
  name: string
  category: ActivityCategory
  vibe: ActivityVibe[]
  address: string
  lat: number
  lng: number
  description?: string
  hours?: string
}

export interface ActivityVote {
  id: string
  activity_id: string   // e.g. "d1:act:surf-01"
  voter_name: string
  created_at: string
}

export interface ActivityPollEntry {
  activity: Activity
  votes: ActivityVote[]
  voteCount: number
}

export interface ActivityPollData {
  morning: ActivityPollEntry[]
  afternoon: ActivityPollEntry[]
  evening: ActivityPollEntry[]
}

// Unified itinerary item — can be a meal OR an activity
export interface ItineraryItem {
  type: 'meal' | 'activity'
  label: string        // e.g. "Breakfast", "Morning Activity"
  name: string         // venue or activity name
  address: string
  startTime: string    // e.g. "8:00 AM"
  duration: string     // e.g. "1 hour"
  distanceFromPrev: string  // e.g. "1.2 km"
  travelNote: string   // e.g. "~5 min walk from hotel"
}

export interface ItineraryDay {
  day: number
  date: string          // "YYYY-MM-DD"
  items: ItineraryItem[]
}

export interface GeneratedItinerary {
  days: ItineraryDay[]
}

// TripConfig expanded with travel times
export interface TripConfig {
  id: string
  trip_name: string
  start_date: string
  end_date: string
  stay_name: string
  stay_lat: number
  stay_lng: number
  departure_time: string   // NEW: e.g. "6:00 AM" — time group leaves by bus
  arrival_time: string     // NEW: e.g. "12:00 PM" — time group arrives in La Union
  updated_by: string
  updated_at: string
}

// Schedule builder output
export interface ScheduleSlot {
  type: 'meal' | 'activity'
  label: string           // "Breakfast", "Morning Activity", etc.
  name: string
  address: string
  lat: number
  lng: number
  distanceKmFromPrev: number
  travelMinutes: number
}
```

### Vote ID namespacing

Activity votes use `d{day}:act:{activity_id}` (e.g., `d1:act:surf-01`). The `act:` prefix avoids collision with restaurant vote IDs (`d1:breakfast:b-01`). Apply same `baseId()` strip pattern in `rankActivities`.

### `scheduleBuilder.ts` logic

```typescript
// Haversine distance between two GPS points
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number

// Estimate travel time assuming 30 km/h average (La Union traffic + walking mix)
export function estimateTravelMinutes(km: number): number  // e.g. 1.2km → 2.4min → rounded to ~5min

// Build a proximity-ordered schedule for one day
// currentLat/Lng starts at hotel coords, updates after each slot
export function buildDaySchedule(
  config: TripConfig,
  topRestaurants: Record<'breakfast' | 'lunch' | 'dinner', Venue | null>,
  topActivities: Record<'morning' | 'afternoon' | 'evening', Activity | null>,
  day: number
): ScheduleSlot[]
```

**Day 1 arrival logic:** Parse `config.arrival_time` to hour (24h). Then:
- `hour < 14` (before 2 PM): include lunch → afternoon activity → dinner
- `hour >= 14 && hour < 17` (2-5 PM): include afternoon activity → dinner
- `hour >= 17` (5 PM+): include dinner only
- Day 2 & 3: full schedule (breakfast → morning activity → lunch → afternoon activity → dinner)

**Proximity ordering (greedy nearest-neighbor):**
1. Start from hotel lat/lng
2. For each time slot in order (morning → noon → afternoon → evening), pick the top-voted venue/activity
3. Compute distance from previous location to next
4. Set next location as current for travel time to the following slot

### AI prompt structure (updated)

```
Trip: La Union Outing
Departs: 6:00 AM from Manila → Arrives: 12:00 PM at Urbiztondo
Stay: [stay_name] (lat, lng)

Day 1 Schedule (arrival day — starting 12:00 PM):
  [meal] Lunch at Tagpuan Sa San Juan (Address) — 0.8km from hotel, ~2min drive
  [activity] Afternoon: Surfing Lesson at Urbiztondo Beach — 0.3km from lunch, ~1min walk
  [meal] Dinner at Flotsam & Jetsam — 1.2km from surf spot, ~4min drive

Day 2 Full Day:
  [meal] Breakfast at El Union Coffee — 0.5km from hotel, ~2min walk
  [activity] Morning: Sunrise Yoga on the Beach — 0.1km from breakfast, ~1min walk
  ...

For each item, respond with: startTime (realistic, based on arrival/duration chain),
duration (e.g. "1 hour", "2 hours"), travelNote (friendly phrase).

Respond ONLY with valid JSON:
{ "days": [ { "day": 1, "date": "YYYY-MM-DD", "items": [
  { "type": "meal", "label": "Lunch", "name": "...", "address": "...",
    "startTime": "12:30 PM", "duration": "1 hour",
    "distanceFromPrev": "0.8 km", "travelNote": "~2 min drive from hotel" }
] } ] }
```

### Suggested La Union activities for static list (`app/lib/activities.ts`)

**Morning:**
- `surf-01` — Surfing Lesson at Urbiztondo (surf school, beginner-friendly)
- `yoga-01` — Sunrise Yoga on the Beach
- `hike-01` — Grape Farm Hike (Tangadan Falls trail)
- `bike-01` — Bike along MacArthur Highway

**Afternoon:**
- `beach-01` — Pebble Beach / Tarec Beach hopping
- `dive-01` — Cliff jumping at Ma-Cho Temple Area
- `kayak-01` — Kayaking at the bay
- `spa-01` — Massage & Spa at Elyu resort
- `shop-01` — Souvenir shopping at San Fernando Public Market
- `snorkel-01` — Snorkeling at Aringay area

**Evening:**
- `sunset-01` — Sunset watching at Urbiztondo beachfront
- `bonfire-01` — Beach bonfire / drinks
- `karaoke-01` — Local karaoke bar night
- `bar-01` — Flotsam & Jetsam beach party
- `dinner-walk-01` — Night walk along the strip

### Supabase SQL (to run in dashboard)

```sql
-- New tables
create table activities (
  id text primary key,
  name text not null,
  category text not null check (category in ('morning','afternoon','evening')),
  vibe text[] not null default '{}',
  address text not null,
  lat double precision not null,
  lng double precision not null,
  description text,
  hours text
);
alter table activities enable row level security;
create policy "public read" on activities for select using (true);

create table activity_votes (
  id text primary key,
  activity_id text not null,
  voter_name text not null,
  created_at timestamptz default now(),
  unique(activity_id, voter_name)
);
alter table activity_votes enable row level security;
create policy "public read" on activity_votes for select using (true);
create policy "public insert" on activity_votes for insert with check (true);
create policy "public delete" on activity_votes for delete using (true);

-- Expand trip_config
alter table trip_config
  add column if not exists departure_time text,
  add column if not exists arrival_time text;
```

### Poll page tab switcher pattern

```tsx
const [pollTab, setPollTab] = useState<'restaurants' | 'activities'>('restaurants')
// Tab buttons with aria-selected + role="tab"
// Conditionally render restaurant sections or activity sections
```

---

## Dependencies

- **Code:** `app/lib/sseRegistry.ts` (clone pattern for activity registry), `app/lib/rankVenues.ts` (clone pattern for `rankActivities`), `app/api/votes/route.ts` (clone pattern for activity votes route), `app/hooks/usePollStream.ts` (clone pattern for activity stream hook), `app/api/itinerary/generate/route.ts` (modify — add activity reads + proximity ordering), `app/components/TripConfigModal.tsx` (modify — add time fields)
- **Schema:** New `activities` + `activity_votes` Supabase tables; `ALTER TABLE trip_config` to add `departure_time`, `arrival_time`
- **External:** None (no new npm packages — Haversine is a pure math formula)
- **Test infrastructure:** Existing Vitest 4 + jsdom setup — no changes needed

## Risks

### Security Risks
- **Low** — Same input validation pattern as restaurant votes. Risk of voter_name injection mitigated by `validateName` + JSX rendering.
- **Low** — Proximity coords (lat/lng) come from the static activity list and trip_config (trusted server sources), not user input — no injection surface.

### Technical Risks
- **Low** — Activity poll is a direct clone of restaurant poll. Fully precedented.
- **Medium** — `buildDaySchedule()` greedy nearest-neighbor is a new pure-function algorithm with no existing precedent. Mitigated: it's a unit-tested pure function with no external dependencies.
- **Low** — Groq AI must now produce the unified `items[]` schema (not just meals). If the AI returns the old schema, `isValidItinerary()` will reject it → 502. Mitigated: clear schema in prompt + updated validation + test coverage.
- **Low** — `trip_config` ALTER TABLE may fail if done in wrong order. Mitigated: use `ADD COLUMN IF NOT EXISTS` — idempotent.

## Complexity Estimate

**L (Large)** — 28 files touched/created across 4 feature areas (activities poll, schedule builder, itinerary generate expansion, PDF layout update). All patterns precedented except `scheduleBuilder.ts`. No new npm packages. Supabase schema changes are additive (safe).
