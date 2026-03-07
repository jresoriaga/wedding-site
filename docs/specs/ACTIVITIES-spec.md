# ACTIVITIES Feature Specification

**SLUG:** `ACTIVITIES`
**Source:** User requirements provided directly (no @prompt session — synthesized from chat)
**Date:** 2026-03-07

---

## Problem Statement

The trip planner only supports voting on restaurants (breakfast/lunch/dinner). The group also needs to vote on **activities** to do in La Union — surfing, sightseeing, beach hopping, etc. Activities are a separate domain from dining and need their own poll, static list, and real-time vote tracking with the same functionality as the restaurant poll.

---

## Functional Requirements

| ID | Requirement |
|----|-------------|
| AC-ACTIVITIES-F1 | A static list of La Union activities exists in `app/lib/activities.ts`, with categories `morning \| afternoon \| evening` covering typical activity time slots |
| AC-ACTIVITIES-F2 | `GET /api/activities` returns the full activities list (from Supabase `activities` table, falling back to static) |
| AC-ACTIVITIES-F3 | `POST /api/activity-votes` adds one activity vote for the current user and day (namespaced as `d{day}:act:{activity_id}`) |
| AC-ACTIVITIES-F4 | `DELETE /api/activity-votes` removes a single activity vote or bulk-clears all activity votes by a user for a given day |
| AC-ACTIVITIES-F5 | `GET /api/activity-poll/stream` broadcasts real-time SSE events (`activity-votes`) whenever any vote changes |
| AC-ACTIVITIES-F6 | Zustand store holds `activityPollData`, `selectedActivityIds`, `activityVenues`, and `activityAllVotes` |
| AC-ACTIVITIES-F7 | `useActivityPollStream` hook connects to the SSE stream, populates store, and reconnects with exponential backoff |
| AC-ACTIVITIES-F8 | `ActivityCard` renders an activity with its category, vibe tags, vote count, voter-name badges, and a toggle vote button — same interaction model as `RestaurantCard` |
| AC-ACTIVITIES-F9 | `ActivityPollSection` shows ranked activities per category with progress bars and always-visible voter name badges — same as `PollCategorySection` |
| AC-ACTIVITIES-F10 | The `/poll` page gets a tab switcher: **🍽️ Restaurants** and **🎯 Activities** — each tab shows day tabs + the matching poll sections |
| AC-ACTIVITIES-F11 | The `/itinerary` page shows activity vote results alongside restaurant results |
| AC-ACTIVITIES-F12 | `rankActivities` utility returns `ActivityPollEntry[]` for a given category and day, sorted by vote count descending |
| AC-ACTIVITIES-F13 | `TripConfig` gains two new fields: `departure_time` (e.g. "6:00 AM") and `arrival_time` (e.g. "12:00 PM") — set by Joef in the Trip Config modal |
| AC-ACTIVITIES-F14 | Server uses `arrival_time` to auto-determine the first action on Day 1: before 2:00 PM → lunch; 2:00–5:00 PM → activity + early dinner; after 5:00 PM → dinner only |
| AC-ACTIVITIES-F15 | `app/lib/scheduleBuilder.ts` exposes a `buildDaySchedule()` function — given the hotel coordinates, the top-voted restaurant per meal slot, and the top-voted activity per activity slot, it returns slots ordered by proximity (greedy nearest-neighbor from hotel) with estimated travel times |
| AC-ACTIVITIES-F16 | `POST /api/itinerary/generate` reads both `votes` (restaurants) and `activity_votes` (activities) from Supabase, runs `buildDaySchedule()` per day, and sends a proximity-ordered prompt to the AI with full coordinates so the AI can fill in realistic start times, durations, and travel notes |
| AC-ACTIVITIES-F17 | The AI response is a unified `GeneratedItinerary` with `days[].items[]` — each item is either a meal or an activity, ordered chronologically with `startTime`, `duration`, `distanceFromPrev`, `travelNote` |
| AC-ACTIVITIES-F18 | `ItineraryPDF.tsx` renders a chronological timeline (not just meal cards) — each item shows its start time, type badge (🍽️ meal or 🎯 activity), venue/activity name, duration, and travel time to the next stop |

---

## Security Requirements

| ID | Requirement |
|----|-------------|
| AC-ACTIVITIES-S1 | `activity_id` and `voter_name` validated server-side (same `validateName` + `sanitizeName` rules as restaurant votes) |
| AC-ACTIVITIES-S2 | One vote per activity per voter per day enforced via unique constraint and 409 response |
| AC-ACTIVITIES-S3 | All activity names and voter names rendered via JSX text — no `dangerouslySetInnerHTML` |

---

## Edge Cases

| ID | Requirement |
|----|-------------|
| AC-ACTIVITIES-E1 | "No votes yet" shown when an activity category has 0 votes |
| AC-ACTIVITIES-E2 | SSE reconnects with exponential backoff (same as restaurant poll — max 5 retries) |

---

## Change Surface

- **New files:** `app/lib/activities.ts`, `app/lib/rankActivities.ts`, `app/lib/sseActivityRegistry.ts`, `app/lib/scheduleBuilder.ts`, `app/api/activities/route.ts`, `app/api/activity-votes/route.ts`, `app/api/activity-poll/stream/route.ts`, `app/hooks/useActivityPollStream.ts`, `app/components/ActivityCard.tsx`, `app/components/ActivityPollSection.tsx`
- **Modified files:** `app/lib/types.ts`, `app/lib/store.ts`, `app/lib/memoryStore.ts`, `app/poll/page.tsx`, `app/components/TripConfigModal.tsx`, `app/api/trip-config/route.ts`, `app/api/itinerary/generate/route.ts`, `app/components/ItineraryPDF.tsx`
- **Supabase tables:** `activities`, `activity_votes`
- **Supabase schema change:** `trip_config` table gains `departure_time` (text) and `arrival_time` (text) columns

---

## Precedent & Novelty

- **Fully precedented:** Every pattern needed already exists in the restaurant poll stack. `ActivityCard` mirrors `RestaurantCard`. `rankActivities` mirrors `rankVenues`. SSE stream mirrors `/api/poll/stream` with a separate registry.
- **Novel:** Separate SSE registry (`sseActivityRegistry`) to keep activity and restaurant streams independent.

---

## Technical Signals

- 22 test files, 126 tests — stable test foundation
- Restaurant poll stack: well-tested, clean separation of concerns
- `sseRegistry.ts` is a single module — safe to duplicate for activities
- Vote ID namespacing (`d{day}:act:{id}`) avoids collision with restaurant votes (`d{day}:{category}:{id}`)
