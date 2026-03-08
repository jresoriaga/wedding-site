# GUIDE Feature Specification

**SLUG:** `GUIDE`
**Source:** User requirements — chat session 2026-03-08
**Date:** 2026-03-08

---

## Problem Statement

The current `/itinerary` page is designed as a multi-day collaborative poll planner (Day 1/2/3 tabs, SSE vote streams, a PollSidebar, a separate `/map` page). The group now needs a **visual guide** instead: a single scrollable page showing restaurants and activities together, filtered by time-of-day, with image-rich cards and an inline map toggle — optimised for mobile use only.

---

## Functional Requirements

| ID | Requirement |
|----|-------------|
| AC-GUIDE-F1 | The time-of-day filter renders three tabs: **🌅 Morning**, **☀️ Afternoon**, **🌙 Evening**. Restaurant categories map at filter time: breakfast → Morning, lunch → Afternoon, dinner → Evening. Activity categories are already `morning / afternoon / evening`. |
| AC-GUIDE-F2 | Each time-of-day tab displays a single scrollable list of both restaurant **and** activity cards, combined. Restaurants appear first within each time slot. |
| AC-GUIDE-F3 | Restaurant cards display a hero image (`venue.imageUrl`) at the top of the card using a 16:9 / 4:3 aspect-ratio box with `object-cover`. |
| AC-GUIDE-F4 | Cards with no `imageUrl` render a full-width gradient banner with the time-of-day category emoji (🌅 / ☀️ / 🌙) — no broken `<img>` tags allowed. |
| AC-GUIDE-F5 | Tapping a card body toggles its selected state in the Zustand store (local, in-memory — no API call). Selected cards show a checkmark badge and a highlighted border. |
| AC-GUIDE-F6 | Each card has a **"More Details"** button that opens `VenueDetailModal` (restaurants) or an activity detail view, without triggering the card's toggle. |
| AC-GUIDE-F7 | A **Map** toggle button in the page header shows/hides an inline `MapView` panel below the header. |
| AC-GUIDE-F8 | The inline `MapView` shows pins for **all** selected restaurants and activities simultaneously, regardless of which time-of-day tab is currently active. |
| AC-GUIDE-F9 | `NavBar` displays only **Itinerary** (one item). The Poll and Map nav links are removed from both desktop and mobile nav. |
| AC-GUIDE-F10 | `DayTabs` (Day 1 / 2 / 3 selector) is not rendered on any page. |
| AC-GUIDE-F11 | `PollSidebar` is not rendered; no vote-count numbers are shown on cards. SSE poll stream hooks are not called from the itinerary page. |
| AC-GUIDE-F12 | The inline `MapView` centers on `tripConfig.stay_lat` / `tripConfig.stay_lng` when a config is loaded from the database. Falls back to the La Union hardcoded coordinates `{ lat: 16.6197, lng: 120.3199 }` when `tripConfig` is null or coordinates are absent. |
| AC-GUIDE-F13 | A distinct red **"🏠 Our Stay"** pin is rendered at `tripConfig.stay_lat` / `tripConfig.stay_lng` when `tripConfig` is loaded. The pin uses a red filled circle with a house emoji label and is visually distinguishable from venue/activity pins. |

---

## Security Requirements

| ID | Requirement |
|----|-------------|
| AC-GUIDE-S1 | Any `imageUrl` value sourced from the database is validated to start with `https://` before being set as an `<img src>`. Values failing this check fall back to the placeholder gradient — no `javascript:` or `data:` URLs rendered. |
| AC-GUIDE-S2 | All venue/activity text fields (name, address, description, hours) are rendered as JSX text nodes — zero `dangerouslySetInnerHTML` usage throughout the component tree. |

---

## Performance Requirements

| ID | Requirement |
|----|-------------|
| AC-GUIDE-P1 | Card images use `loading="lazy"` so off-screen images do not block initial render on mobile. |
| AC-GUIDE-P2 | No `will-change: transform` on card containers unless a CSS animation is actively running (avoids GPU layer explosion on mobile). |

---

## Edge Cases

| ID | Requirement |
|----|-------------|
| AC-GUIDE-E1 | Cards with no `imageUrl` (or an `imageUrl` that fails the `https://` validation) render a full-width gradient banner with the category emoji. |
| AC-GUIDE-E2 | A time-of-day tab with zero items renders the empty state: "Nothing here yet 🌊" with a subline. |
| AC-GUIDE-E3 | Map toggle opened with no items selected renders the map centered on stay / La Union with an overlay: "Tap cards to pin them here 📍". |
| AC-GUIDE-E4 | If `tripConfig` is null or `stay_lat`/`stay_lng` are absent/zero, the map centers on the La Union fallback and no stay pin is shown. |

---

## Error Handling

| ID | Requirement |
|----|-------------|
| AC-GUIDE-ERR1 | If the restaurants or activities fetch fails, the client silently falls back to the static data arrays — no disruptive error modal. |
| AC-GUIDE-ERR2 | If the Google Maps API key is absent, the map toggle renders the existing text-only fallback (no crash, no broken map frame). |

---

## Change Surface

**Files modified (source):**
- `app/lib/types.ts` — add `TimeOfDay` type; add `imageUrl?: string` to `Activity`
- `app/lib/filterVenues.ts` — add `TimeOfDay`→`Category` mapping helper
- `app/components/CategoryTabs.tsx` — switch from `Category` to `TimeOfDay` labels
- `app/components/RestaurantCard.tsx` — add hero image, remove vote UI, add "More Details" button
- `app/components/ActivityCard.tsx` — add hero image/placeholder, remove vote UI, add "More Details" button
- `app/components/MapView.tsx` — accept `selectedVenues[]`, `selectedActivities[]`, `tripConfig`; add stay pin; center on stay coords
- `app/components/NavBar.tsx` — remove Poll and Map links
- `app/itinerary/page.tsx` — remove Days/Poll/SSE; unified time-of-day feed; inline map toggle; pass `tripConfig` to MapView

**Files modified (tests):**
- `app/components/__tests__/RestaurantCard.test.tsx`
- `app/components/__tests__/ActivityCard.test.tsx`
- `app/components/__tests__/CategoryTabs.test.tsx`
- `app/components/__tests__/MapView.test.tsx`
- `app/components/__tests__/NavBar.test.tsx`

**Files deprecated (kept on disk, removed from nav/rendering):**
- `app/map/page.tsx`
- `app/poll/page.tsx`
- `app/components/PollSidebar.tsx`
- `app/components/DayTabs.tsx`

**DB / schema changes:** None — restaurant `category` column remains `breakfast | lunch | dinner` in Supabase. Mapping is client-side only.

---

## Precedent & Novelty

- **Precedented:** Hero image on card — pattern exists in `VenueDetailModal` image carousel. `showMap` toggle — already exists on itinerary page. Stay coords — `tripConfig.stay_lat/stay_lng` already stored in DB and in Zustand store.
- **Novel:** Combining restaurants + activities into a single unified feed per time-of-day tab. Stay pin on map. `TimeOfDay` → `Category` mapping layer.

---

## Technical Signals

- Restaurant cards have no `onInfoClick` handler in `ActivityCard` — must be added symmetrically.
- `ActivityCard` currently lacks `onInfoClick` prop entirely — needs adding.
- `MapView` currently accepts `Vote[]` and `venueMap` — both props are replaced; all consumers must update.
- `useVotes` and `useActivityVotes` are referenced in itinerary page — both can be removed once selection goes local-only.
- SSE hooks (`usePollStream`, `useActivityPollStream`) called unconditionally in itinerary page — must be removed to close long-lived connections.
