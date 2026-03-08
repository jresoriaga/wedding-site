# GUIDE Plan

**SLUG:** `GUIDE`
**Spec:** `docs/specs/GUIDE-spec.md`
**Created:** 2026-03-08

---

## Summary

Refactor the outing app from a multi-day collaborative poll planner into a single-page visual guide. Remove Day tabs, poll sidebar, and SSE vote streams. Combine restaurants and activities into a unified time-of-day feed (Morning / Afternoon / Evening) with image-rich mobile-first cards. Add an inline map toggle that pins all selected items and centers on the configured stay location with a red home pin.

---

## Security Assessment

- **Data Sensitivity**: Public — venue names, addresses, and images are public destination info; no PII added
- **OWASP Relevance**: A3 — `imageUrl` values sourced from DB must be validated (`https://` only) before rendering in `<img src>`; all text rendered as JSX nodes
- **Security Priority**: Standard — no auth changes, no new API endpoints, reduced attack surface (SSE connections removed)

---

## Test Strategy

### Functional Tests
- **Unit**: `safeImageUrl()` helper — validates `https://` prefix, rejects `javascript:` / `data:` / empty strings, returns `null` for invalid
- **Unit**: `timeOfDayToCategory()` mapping — morning→breakfast, afternoon→lunch, evening→dinner
- **Component**: `CategoryTabs` — renders Morning/Afternoon/Evening labels; correct active state; keyboard accessible
- **Component**: `RestaurantCard` — hero image rendered when `imageUrl` valid; placeholder rendered when absent/invalid; "More Details" button calls `onInfoClick` without triggering `onToggle`; selected state shows checkmark; no vote count rendered
- **Component**: `ActivityCard` — same hero/placeholder/details/selection assertions; `onInfoClick` prop accepted
- **Component**: `MapView` — stay pin rendered when `tripConfig` provided; map centered on stay coords; no stay pin when `tripConfig` null; all `selectedVenues` + `selectedActivities` show pins; empty-state overlay when both arrays are empty
- **Component**: `NavBar` — renders only one nav item (Itinerary); no Poll or Map links

### UI Test Selector Strategy
- Cards: use `data-testid="restaurant-card-{id}"` / `data-testid="activity-card-{id}"` (existing; retain)
- Stay pin: add `data-testid="stay-pin"` on the stay `AdvancedMarker` div
- Inline map panel: retain `id="inline-map"` (existing)
- "More Details" button: identifiable by `aria-label="More details about {name}"` — role-based selector, no `data-testid` needed

### Security Tests (OWASP-Aligned)
- **[AC-GUIDE-S1]** `safeImageUrl("javascript:alert(1)")` → `null`
- **[AC-GUIDE-S1]** `safeImageUrl("data:image/png;base64,abc")` → `null`
- **[AC-GUIDE-S1]** `safeImageUrl("https://valid.com/img.jpg")` → returns URL unchanged
- **[AC-GUIDE-S2]** No `dangerouslySetInnerHTML` in RestaurantCard or ActivityCard

### Performance Tests
- **[AC-GUIDE-P1]** Hero `<img>` has attribute `loading="lazy"`
- **[AC-GUIDE-P2]** Card container className does not include `will-change`

---

## Test List (TDD Cycles)

### Cycle 1: [AC-GUIDE-F1] `TimeOfDay` type + `timeOfDayToCategory` mapping
- **RED**: Test `timeOfDayToCategory` mapping — file: `app/lib/__tests__/filterVenues.test.ts`
- **GREEN**: Add `TimeOfDay` to `app/lib/types.ts`; add `timeOfDayToCategory()` to `app/lib/filterVenues.ts`
- **REFACTOR**: None expected

### Cycle 2: [AC-GUIDE-S1] `safeImageUrl` helper
- **RED**: Unit test rejects non-https, accepts `https://`, returns `null` for empty — file: `app/lib/__tests__/filterVenues.test.ts`
- **GREEN**: Add `safeImageUrl()` to `app/lib/filterVenues.ts`
- **REFACTOR**: None expected

### Cycle 3: [AC-GUIDE-F3, F4, F5, F6, P1, E1, S1] `RestaurantCard`
- **RED**: Update `app/components/__tests__/RestaurantCard.test.tsx`
- **GREEN**: Rewrite `app/components/RestaurantCard.tsx`
- **REFACTOR**: None expected

### Cycle 4: [AC-GUIDE-F3, F4, F5, F6, E1] `ActivityCard`
- **RED**: Update `app/components/__tests__/ActivityCard.test.tsx`
- **GREEN**: Update `app/components/ActivityCard.tsx`; add `imageUrl?` to `Activity` type
- **REFACTOR**: None expected

### Cycle 5: [AC-GUIDE-F1] `CategoryTabs`
- **RED**: Update `app/components/__tests__/CategoryTabs.test.tsx`
- **GREEN**: Update `app/components/CategoryTabs.tsx`
- **REFACTOR**: None expected

### Cycle 6: [AC-GUIDE-F7, F8, F12, F13, E3, E4] `MapView`
- **RED**: Update `app/components/__tests__/MapView.test.tsx`
- **GREEN**: Refactor `app/components/MapView.tsx` — new props, stay pin, stay center
- **REFACTOR**: Remove dead helpers

### Cycle 7: [AC-GUIDE-F9] `NavBar`
- **RED**: Update `app/components/__tests__/NavBar.test.tsx`
- **GREEN**: Update `app/components/NavBar.tsx`
- **REFACTOR**: None expected

### Cycle 8: [AC-GUIDE-F2, F5, F7, F8, F10, F11] `itinerary/page.tsx`
- **RED**: Page-level assertions in existing or new test
- **GREEN**: Rewrite `app/itinerary/page.tsx` — remove Days/Poll/SSE; unified guide
- **REFACTOR**: Prune dead imports

---

## File Manifest

| File | Action |
|------|--------|
| `app/lib/types.ts` | modify — add `TimeOfDay`; add `imageUrl?` to `Activity` |
| `app/lib/filterVenues.ts` | modify — add `timeOfDayToCategory()`, `safeImageUrl()` |
| `app/components/CategoryTabs.tsx` | modify — `TimeOfDay` labels |
| `app/components/RestaurantCard.tsx` | modify — hero image, no votes, More Details |
| `app/components/ActivityCard.tsx` | modify — hero image, no votes, `onInfoClick` |
| `app/components/MapView.tsx` | modify — new props, stay pin, stay center |
| `app/components/NavBar.tsx` | modify — single nav item |
| `app/itinerary/page.tsx` | modify — unified guide page |
| `app/components/__tests__/RestaurantCard.test.tsx` | modify |
| `app/components/__tests__/ActivityCard.test.tsx` | modify |
| `app/components/__tests__/CategoryTabs.test.tsx` | modify |
| `app/components/__tests__/MapView.test.tsx` | modify |
| `app/components/__tests__/NavBar.test.tsx` | modify |

---

## Dependencies

- `@vis.gl/react-google-maps` — already installed
- `TripConfig` in Zustand store — already exists
- `useTripConfig()` — already called in itinerary page
- Vitest + jsdom — already configured

---

## Complexity Estimate

**L** — 8 source files modified, 5 test files updated, no DB migrations, no new external dependencies.
