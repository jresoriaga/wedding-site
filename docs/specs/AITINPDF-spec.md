# AITINPDF — AI-Generated PDF Itinerary Download

**Security Priority**: Elevated
**SLUG**: AITINPDF
**Prerequisite**: TRIPCONFIG must be deployed and trip_config data must exist in DB

---

## User Story

**As any user**, I want to download a PDF itinerary for the trip that lists the top-voted restaurant for each meal each day, with AI-suggested times for each activity, so I have a concrete schedule to follow during the outing.

---

## Specification

### Description
A "Download Itinerary PDF" button (visible to all logged-in users) triggers an API call to `POST /api/itinerary/generate`. The server reads top-voted venues from the current poll votes and trip config (dates, stay location), then calls the OpenAI Chat Completions API to generate a day-by-day time-slotted schedule. The response is a JSON structure that the client renders into a PDF using `@react-pdf/renderer` and triggers a browser download.

### In Scope
- `POST /api/itinerary/generate` — server Route Handler that calls OpenAI and returns structured JSON
- Top venue per category per day = the single venue with the highest vote count (ties broken by name alphabetically)
- AI generates suggested arrival time, duration, and any travel notes for each venue, for each day
- Client renders the JSON response into a PDF using `@react-pdf/renderer` and triggers download
- Trip dates and stay location read from Zustand `tripConfig` (populated by TRIPCONFIG feature)
- Download button in itinerary page header, visible to all logged-in users
- Loading state while AI generates (spinner, button disabled)

### Out of Scope
- Real-time streaming of AI response to client (implement as single blocking call)
- Saving the generated PDF to Supabase Storage
- Customising the schedule (add/remove venues, change times) — AI output is read-only
- Venues with zero votes are excluded (not shown in PDF even if they exist)
- Multiple AI providers (OpenAI only; no fallback provider)
- If no tripConfig exists: button is shown but clicking shows a modal prompt "Joef hasn't set the trip dates yet"

---

## Current Behavior
No PDF download exists. The poll sidebar shows vote rankings but there's no way to export or get a schedule.

## Desired Behavior
1. User clicks "📄 Download Itinerary" button in the itinerary page header
2. Client calls `POST /api/itinerary/generate` (no body needed — server reads live data)
3. Server: reads all votes from DB, reads trip_config, computes top venue per category per day, builds OpenAI prompt
4. OpenAI returns a structured JSON schedule (day → meal → venue → time + notes)
5. Server returns that JSON to client
6. Client renders it with `@react-pdf/renderer` and triggers `window.URL.createObjectURL()` download
7. PDF filename: `lu-outing-itinerary.pdf`

---

## Codebase Context

**Reusable patterns:**
- Vote reading: `app/api/votes/route.ts` GET handler — returns all votes from Supabase
- Admin client for server reads: `createServerClient()` — [app/lib/supabase.ts](../../app/lib/supabase.ts#L29)
- `rankVenues` logic in [app/lib/rankVenues.ts](../../app/lib/rankVenues.ts) — already computes top venues sorted by vote count; reuse this logic server-side to find the #1 venue per category
- Trip config: read from `trip_config` table via `createServerClient()`
- Venue data: read from `restaurants` table via `createServerClient()`
- Error surface pattern: `try/catch` returning `{ error: message }` JSON — [app/api/restaurants/[id]/images/route.ts](../../app/api/restaurants/%5Bid%5D/images/route.ts#L10)

**Constraints:**
- OpenAI API key (`OPENAI_API_KEY`) must be a server-only env var — never exposed to client or included in `NEXT_PUBLIC_*` namespace
- `@react-pdf/renderer` runs client-side only (uses browser APIs) — must be dynamically imported with `next/dynamic` and `{ ssr: false }`
- Vercel serverless function timeout: 30s (Pro: 60s) — OpenAI call must complete within this window; use `gpt-4o-mini` for speed

**Integration points:**
- Reads `trip_config` from DB (written by TRIPCONFIG feature)
- Reads `votes` from DB (written by existing votes system)
- Reads `restaurants` from DB (existing table)
- OpenAI `openai` npm package (new dependency)
- `@react-pdf/renderer` (new dependency)

---

## Change Surface

**Files likely modified:**
- `app/itinerary/page.tsx` — add Download button + loading state + call to generate + PDF render trigger
- `app/lib/types.ts` — add `GeneratedItinerary`, `ItineraryDay`, `ItineraryMeal` types
- `app/lib/store.ts` — add `tripConfig: TripConfig | null` (already added by TRIPCONFIG)

**New files needed:**
- `app/api/itinerary/generate/route.ts` — POST handler: reads DB, calls OpenAI, returns JSON
- `app/components/ItineraryPDF.tsx` — `@react-pdf/renderer` Document component (client-only)
- `app/hooks/useItineraryDownload.ts` — orchestrates fetch + dynamic PDF render + download trigger
- `app/api/itinerary/__tests__/generate.test.ts` — unit tests with mocked OpenAI + Supabase

**Database/schema changes:** None (reads existing tables)

**New external dependencies:**
- `openai` — official OpenAI Node.js SDK (server-side only)
- `@react-pdf/renderer` — client-side PDF rendering

**Existing test coverage in affected area:**
- `app/api/restaurants/__tests__/route.test.ts` — pattern for mocking Supabase in API tests
- No existing coverage for `/api/itinerary/`

**Downstream consumers:** None — this is a leaf feature

---

## OpenAI Prompt Design

The server constructs a prompt using only structured data (no raw user input injected into the prompt body):

```
System: You are a travel itinerary assistant. Given a list of restaurants (one per meal per day) 
and a trip start date, produce a realistic daily schedule with suggested meal times, estimated 
duration, and brief travel notes. Respond ONLY with valid JSON matching the schema provided.

User: Trip: {tripName}
Stay: {stayName} (lat {lat}, lng {lng})
Day 1 ({date}): Breakfast at {venue.name} ({venue.address}), Lunch at {venue.name}, Dinner at {venue.name}
Day 2 ({date}): ...
Day 3 ({date}): ...

Respond with this JSON schema:
{ "days": [ { "day": 1, "date": "YYYY-MM-DD", "meals": [ { "meal": "breakfast", "venue": "...", "address": "...", "suggestedTime": "8:00 AM", "duration": "1 hour", "travelNote": "..." }, ... ] } ] }
```

**Prompt injection hardening:**
- Venue names and addresses are fetched from DB (trusted source), not from user text input
- Voter names are NOT included in the prompt
- `JSON.stringify` is NOT used to embed user content — values are interpolated as plain strings after being validated as known DB records

---

## Precedent & Novelty

**Novel:** No existing AI or PDF generation in the codebase. Both `openai` and `@react-pdf/renderer` are new dependencies.

**Spike recommended for:** `@react-pdf/renderer` + Next.js 16 App Router SSR compatibility — the library uses browser canvas APIs; must be loaded with `next/dynamic({ ssr: false })`. Verify this pattern works before full implementation.

**Precedented building blocks:**
- Server DB reads: follows pattern at `app/api/restaurants/route.ts`
- Error handling: follows `app/api/restaurants/[id]/images/route.ts` try/catch pattern

---

## Security Considerations

**Data Sensitivity:** Internal (poll results, trip metadata — no PII beyond voter first names already visible in poll sidebar)

**OWASP Relevance:**
- **A01 Broken Access Control**: `POST /api/itinerary/generate` is intentionally public to all logged-in users. No admin gate needed. However, the endpoint must not accept any user-supplied data in the prompt — all prompt content is sourced from the DB.
- **A03 Injection / Prompt Injection**: Venue names from DB are treated as data values in a structured prompt, not as instructions. The system prompt explicitly instructs the model to respond only with JSON. No user-controlled text (voter names, free-text inputs) is included in the prompt.
- **A05 Security Misconfiguration**: `OPENAI_API_KEY` must be server-only (no `NEXT_PUBLIC_` prefix). Must not appear in any client bundle. Validate with `process.env.OPENAI_API_KEY` inside the Route Handler only.
- **A08 Software & Data Integrity**: Parse and validate OpenAI response JSON against expected schema before passing to client. If response doesn't match schema, return 502 with error — do not pass raw AI text to client.

**Security requirements:**
- `OPENAI_API_KEY` never referenced in any `'use client'` file
- OpenAI response validated against `GeneratedItinerary` schema before returning to client
- Rate-limit consideration: endpoint is unauthenticated beyond name check — consider adding a server-side cooldown (1 request per user per 30s) or accept risk given small user set

---

## Success Criteria

**Functional:**
- [AC-AITINPDF-F1] "📄 Download Itinerary" button is visible to all logged-in users in the itinerary page header
- [AC-AITINPDF-F2] Clicking the button calls `POST /api/itinerary/generate` and renders a loading state while waiting
- [AC-AITINPDF-F3] The generated PDF contains one section per day, each with breakfast/lunch/dinner venue, AI-suggested time, duration, and travel note
- [AC-AITINPDF-F4] PDF filename is `lu-outing-itinerary.pdf` and downloads immediately without opening a new tab
- [AC-AITINPDF-F5] Only venues with ≥1 vote are included in the PDF; days with zero votes for a category show "No votes yet" for that meal slot
- [AC-AITINPDF-F6] Trip name, dates, and stay location appear in the PDF header section

**Security:**
- [AC-AITINPDF-S1] `OPENAI_API_KEY` does not appear in any client bundle (verified via `next build` bundle analysis)
- [AC-AITINPDF-S2] If OpenAI returns malformed JSON (not matching schema), the API returns 502 — client shows error toast, no raw AI text exposed

**Performance:**
- [AC-AITINPDF-P1] Button shows loading spinner within 200ms of click; total round-trip (API + PDF render) completes within 30s

**Edge Cases:**
- [AC-AITINPDF-E1] If `tripConfig` is null (Joef hasn't configured it), button click shows an inline message: "Trip dates not set yet — ask Joef to configure them" — no API call is made
- [AC-AITINPDF-E2] If all votes are zero (nobody voted), PDF generates with "No votes yet" for all meal slots and a note "Cast your votes on the Itinerary page"
- [AC-AITINPDF-E3] `GET /api/trip-config` returns null mid-generation (race condition) — API returns 400 "Trip config not set"

**Error Handling:**
- [AC-AITINPDF-ERR1] If OpenAI API call fails (network, rate limit, 5xx), API returns 502 with `{ error: "AI generation failed — try again" }` and client shows error toast
- [AC-AITINPDF-ERR2] If PDF render fails client-side, show error toast "PDF generation failed — try again"; do not crash the page

---

## Business Value
Gives the group a concrete, shareable schedule based on democratic vote results, with AI handling the tedious time-planning work. Primary output artifact of the entire planning app.

**Suggested labels:** `enhancement`, `ai`, `pdf`, `feature`

---

## Constraints
- Must not stream AI response (single blocking call, simpler implementation)
- `gpt-4o-mini` preferred over `gpt-4o` for Vercel timeout headroom
- PDF must be client-side rendered (not server-side) to avoid Vercel memory limits with `@react-pdf/renderer`
- OpenAI structured output (`response_format: { type: 'json_object' }`) should be used to guarantee parseable JSON

---

## Risks & Considerations
- **Vercel timeout**: `gpt-4o-mini` typically responds in 2–5s for this prompt size. Risk is LOW.
- **`@react-pdf/renderer` SSR**: Known to break with server-side rendering. Mitigate with `next/dynamic({ ssr: false })`. If it still breaks with App Router, fallback: use `jsPDF` (simpler but less styled).
- **OpenAI cost**: Each PDF generation = ~500 input tokens + ~400 output tokens ≈ $0.0003 per call at `gpt-4o-mini` pricing. Negligible for small user set.
- **Open Question**: Should `OPENAI_API_KEY` be added to Vercel env now (TRIPCONFIG phase) or deferred to AITINPDF phase? → Defer to AITINPDF phase.

---

## Scope Assessment

Change surface: 2 modified files + 4 new files, 2 new API directories. No DB migrations. 2 new npm packages. Zero existing coverage for itinerary generation. 6 functional + 2 security + 1 performance + 3 edge + 2 error ACs — all cohesive (single download feature).

**Scope: Cohesive — proceed as single unit. Depends on TRIPCONFIG being complete first.**
