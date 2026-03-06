# Specification: Friends Itinerary Planner — La Union Summer Outing

**SLUG**: `ITINPLAN0306`
**Security Priority**: Elevated
**Date**: March 6, 2026
**Status**: Approved

---

## User Story

As a **friend in a group La Union outing**, I want to enter my name, pick restaurants/venues by meal category and vibe, and see everyone else's votes update in real time on a shared poll and map — so that the group can collectively decide the itinerary without group chat chaos.

---

## Description

Full refactor of the bare Next.js 16 starter into a collaborative, real-time itinerary voting app purpose-built for La Union summer group outings. Friends share a single room link, each enters their name, votes on dining options across Breakfast/Lunch/Dinner categories with vibe filters, see a live-updating ranked poll, and view all selected venues pinned on Google Maps.

---

## In Scope

- Name onboarding (gated entry before any voting)
- Restaurant/venue selection UI: Breakfast, Lunch, Dinner categories × vibe filters (Party, Casual Dining, Buffet, Bar, Café, Street Food)
- Real-time poll sidebar: vote counts ranked per category, live via SSE
- Google Maps view: pins for all venues with ≥1 vote
- Supabase as persistence layer (votes + room state)
- Consistent La Union summer color scheme, mobile-first, animated/interactive UI
- Environment variables for Google Maps API key and Supabase credentials

## Out of Scope

- User authentication / accounts (name is session-only, no passwords)
- Admin moderation or room management UI
- Multiple concurrent rooms (single shared room for the outing)
- Restaurant CRUD — venue list is seeded/static in v1
- Payment or booking integration

---

## Current Behavior

No existing behavior — net-new feature. The project is a bare Next.js 16 App Router starter with a default `page.tsx` placeholder.

---

## Desired Behavior

1. **Name Gate**: User lands on `/` and is prompted to enter their name. Cannot proceed without a non-empty name (trimmed). Name stored in `localStorage`.
2. **Itinerary Selection** (`/itinerary`): Tabs for Breakfast / Lunch / Dinner. Each tab shows restaurant cards filterable by vibe chip. User can toggle-select multiple restaurants per category. Selections persist to Supabase on toggle.
3. **Live Poll View** (`/poll`): Shows all venues ranked by total vote count, segmented by Breakfast/Lunch/Dinner. Updates in real time via SSE as any friend submits/removes a vote. Voter names shown on hover/tap per venue.
4. **Map View** (`/map`): Google Maps with markers for every venue that has ≥1 vote. Clicking a marker shows venue name, category, vibe, vote count.
5. **Navigation**: Persistent bottom nav (mobile) / top nav (desktop) across all views.
6. **Design**: La Union summer palette (ocean blues, sand, coral/sunset accents), Tailwind CSS v4, smooth transitions, skeleton loaders while SSE connects.

---

## Change Surface

**Files replaced (full rewrite)**:
- `app/layout.tsx`
- `app/globals.css`
- `app/page.tsx`
- `next.config.ts`
- `package.json`

**New files**:
```
app/
  onboarding/page.tsx
  itinerary/page.tsx
  poll/page.tsx
  map/page.tsx
  api/votes/route.ts
  api/poll/stream/route.ts
  components/
    NameGate.tsx
    CategoryTabs.tsx
    VibeFilter.tsx
    RestaurantCard.tsx
    PollSidebar.tsx
    PollCategorySection.tsx
    MapView.tsx
    NavBar.tsx
    SkeletonCard.tsx
  lib/
    supabase.ts
    types.ts
    restaurants.ts
    store.ts
  hooks/
    usePollStream.ts
    useVotes.ts
.env.local (not committed)
```

**Database schema**:
```sql
CREATE TABLE venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text CHECK (category IN ('breakfast','lunch','dinner')),
  vibe text[],
  address text,
  lat numeric,
  lng numeric
);

CREATE TABLE votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE,
  voter_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(venue_id, voter_name)
);

CREATE INDEX votes_venue_id_idx ON votes(venue_id);
```

**New external dependencies**:
- `@supabase/supabase-js`
- `zustand`
- `@vis.gl/react-google-maps`
- `@types/googlemaps` (dev)

---

## Precedent & Novelty

**Fully novel** — no prior components, routes, hooks, or API patterns in this codebase.

Novel areas requiring spikes:
1. SSE Route Handler in Next.js 16 App Router (`ReadableStream` pattern)
2. Supabase RLS configuration
3. `@vis.gl/react-google-maps` React 19 compatibility

---

## Security Considerations

| Risk | OWASP | Mitigation |
|------|-------|-----------|
| SQL Injection via `voter_name` | A03 | Parameterized queries via Supabase JS client; trim + max 50 chars |
| API key exposure | A05 | Google Maps key restricted to HTTP referrer; Supabase anon key safe with RLS |
| Repeat voting / spam | A07 | Unique constraint `(venue_id, voter_name)`; IP rate-limit on `/api/votes` |
| XSS via voter names in poll/map | A03 | React JSX rendering only — never `dangerouslySetInnerHTML` |
| Broken access control on votes | A01 | Supabase RLS: INSERT/SELECT open, DELETE requires matching `voter_name` |

---

## Acceptance Criteria

### Functional

- **[AC-ITINPLAN0306-F1]** Given a first-time visitor, when they open the app, they see only the name input form — no itinerary or poll content is accessible until a name is submitted.
- **[AC-ITINPLAN0306-F2]** Given a valid name (non-empty, trimmed, ≤50 chars), when submitted, the name is stored in `localStorage` and the user is routed to `/itinerary`.
- **[AC-ITINPLAN0306-F3]** Given the itinerary page, when the user switches between Breakfast / Lunch / Dinner tabs, only venues for that category are displayed.
- **[AC-ITINPLAN0306-F4]** Given active vibe filter chips, when one or more vibes are selected, only venues matching at least one selected vibe are shown within the active category tab.
- **[AC-ITINPLAN0306-F5]** Given a restaurant card, when the user clicks/taps it, their vote is toggled (added or removed) and the card reflects selected state immediately (optimistic UI).
- **[AC-ITINPLAN0306-F6]** Given any active connected client, when any other user submits or removes a vote, the poll sidebar updates within 2 seconds without a page refresh.
- **[AC-ITINPLAN0306-F7]** Given the poll view, venues within each category are ranked descending by vote count; top-voted venue appears first.
- **[AC-ITINPLAN0306-F8]** Given the map view, every venue with ≥1 vote has a visible map marker; clicking a marker shows a tooltip with venue name, category, vibe tags, and vote count.
- **[AC-ITINPLAN0306-F9]** Given a returning visitor (name in `localStorage`), when they reload the app, they are routed directly to `/itinerary` — the name gate is not shown again.
- **[AC-ITINPLAN0306-F10]** Given any screen width ≥320px, all views render without horizontal overflow or clipped content (mobile-first responsive).

### Security

- **[AC-ITINPLAN0306-S1]** Given a `voter_name` input exceeding 50 characters, when submitted to `POST /api/votes`, the API returns `400` and no DB record is created.
- **[AC-ITINPLAN0306-S2]** Given a duplicate vote attempt (same `voter_name` + `venue_id`), when submitted, the API returns `409` and the DB unique constraint prevents a second row.
- **[AC-ITINPLAN0306-S3]** Given any `voter_name` containing HTML/script tags, when rendered in poll or map tooltip, no script executes — displayed as escaped text.
- **[AC-ITINPLAN0306-S4]** Google Maps API key is restricted to the app's domain in Google Cloud Console before any public deployment.

### Performance

- **[AC-ITINPLAN0306-P1]** Given the itinerary page with ≤50 venue cards, LCP on mobile (throttled 4G) is ≤3.5 seconds.
- **[AC-ITINPLAN0306-P2]** Given the SSE stream, when a vote is posted, the change is broadcast to all connected clients within 2 seconds.

### Edge Cases

- **[AC-ITINPLAN0306-E1]** Given the name form, when the user submits an empty or whitespace-only string, a visible inline error is shown and submission is blocked.
- **[AC-ITINPLAN0306-E2]** Given no venues matching the active vibe filter, an empty-state message is shown ("No spots match this vibe — try another!").
- **[AC-ITINPLAN0306-E3]** Given zero votes cast, each poll category section shows ("No votes yet — be the first!").
- **[AC-ITINPLAN0306-E4]** Given the map with zero voted venues, the map renders centered on La Union with a placeholder message.
- **[AC-ITINPLAN0306-E5]** Given a `voter_name` containing Unicode or emoji, the name is stored and displayed correctly.
- **[AC-ITINPLAN0306-E6]** All interactive elements are identifiable by ARIA role + label or `data-testid` for automated testing.

### Error Handling

- **[AC-ITINPLAN0306-ERR1]** Given a failed `POST /api/votes`, the optimistic UI reverts and displays a toast error.
- **[AC-ITINPLAN0306-ERR2]** Given the SSE stream disconnecting, the client auto-reconnects with exponential backoff (max 5 retries); a "Reconnecting…" indicator is shown.
- **[AC-ITINPLAN0306-ERR3]** Given an invalid/missing Google Maps API key, the map view displays a fallback message instead of a broken iframe.
- **[AC-ITINPLAN0306-ERR4]** Given a Supabase connection failure on load, a full-page error state with a retry button is shown.

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| SSE fan-out not supported on Vercel Edge Runtime | HIGH | Use Node.js runtime on stream route; validate in spike |
| Google Maps API key abuse | HIGH | Restrict to HTTP referrer immediately [OWASP:A5] |
| Supabase RLS misconfigured | MEDIUM | Write explicit RLS policies; test with anon client |
| Name collision (two friends same name) | MEDIUM | Document: use unique nickname; suffix in follow-up |
| `@vis.gl/react-google-maps` React 19 compat | MEDIUM | Validate in spike; fallback is iframe embed |

---

## Constraints

- Must run on Vercel free tier (SSE chosen over WebSocket for this reason)
- Static venue seed data in v1
- No login/auth
- Google Maps API key managed via env var — never committed to git
- Supabase free tier (500MB DB, 50K MAU)
