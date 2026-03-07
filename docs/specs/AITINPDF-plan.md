# AITINPDF — TDD Implementation Plan

**SLUG**: AITINPDF
**Priority**: Elevated
**Prereq**: TRIPCONFIG shipped ✅ (commit 71cfa60)

---

## AC ID Registry

| ID | Type | Description |
|---|---|---|
| AC-AITINPDF-F1 | Functional | Download button visible to all logged-in users |
| AC-AITINPDF-F2 | Functional | Loading state shown during generation |
| AC-AITINPDF-F3 | Functional | PDF contains venue + AI-suggested time/duration/note per meal slot |
| AC-AITINPDF-F4 | Functional | PDF downloads as `lu-outing-itinerary.pdf` without new tab |
| AC-AITINPDF-F5 | Functional | Zero-vote slots show "No votes yet" |
| AC-AITINPDF-F6 | Functional | Trip name, dates, stay location in PDF header |
| AC-AITINPDF-S1 | Security | OPENAI_API_KEY server-only |
| AC-AITINPDF-S2 | Security | 502 on malformed AI JSON |
| AC-AITINPDF-P1 | Performance | Loading spinner within 200ms of click |
| AC-AITINPDF-E1 | Edge | tripConfig null → inline message, no API call |
| AC-AITINPDF-E2 | Edge | All-zero-vote → "No votes yet" throughout |
| AC-AITINPDF-E3 | Edge | tripConfig missing in DB → 400 |
| AC-AITINPDF-ERR1 | Error | OpenAI fails → 502 |
| AC-AITINPDF-ERR2 | Error | PDF render fails → error toast |

---

## File Manifest

| File | State |
|---|---|
| `app/lib/types.ts` | Modify — add `ItineraryMeal`, `ItineraryDay`, `GeneratedItinerary` |
| `app/api/itinerary/generate/route.ts` | Create |
| `app/api/itinerary/generate/__tests__/route.test.ts` | Create |
| `app/components/ItineraryPDF.tsx` | Create |
| `app/components/__tests__/ItineraryPDF.test.tsx` | Create |
| `app/hooks/useItineraryDownload.ts` | Create |
| `app/hooks/__tests__/useItineraryDownload.test.ts` | Create |
| `app/itinerary/page.tsx` | Modify — add Download button |

---

## TDD Cycles

### Cycle 1: Types (no tests — pure types)
Add `ItineraryMeal`, `ItineraryDay`, `GeneratedItinerary` to `app/lib/types.ts`.

### Cycle 2: API Route — RED → GREEN → REFACTOR
**Test file**: `app/api/itinerary/generate/__tests__/route.test.ts`

Tests (all with AC IDs in title):
1. `[AC-AITINPDF-E3]` returns 400 when tripConfig is not set
2. `[AC-AITINPDF-F3]` returns structured GeneratedItinerary on happy path
3. `[AC-AITINPDF-F5]` prompt uses "No votes yet" for zero-vote category slots
4. `[AC-AITINPDF-F3]` top venue is highest-vote-count, ties broken alphabetically
5. `[AC-AITINPDF-S2]` returns 502 when OpenAI returns malformed JSON
6. `[AC-AITINPDF-S2]` returns 502 when OpenAI returns non-JSON string
7. `[AC-AITINPDF-ERR1]` returns 502 when OpenAI call throws

**Implementation** (`route.ts`):
- `createServerClient()` for all 3 DB reads
- `getTopVenue()` helper: vote-count desc, alpha tie-break
- OpenAI `gpt-4o-mini` with `response_format: { type: 'json_object' }`
- Schema validation before returning

### Cycle 3: useItineraryDownload hook — RED → GREEN
**Test file**: `app/hooks/__tests__/useItineraryDownload.test.ts`

Tests:
1. `[AC-AITINPDF-E1]` sets error when tripConfig is null, no fetch called
2. `[AC-AITINPDF-ERR1]` sets error from API when fetch returns !ok
3. `[AC-AITINPDF-F4]` triggers download with correct filename on success

### Cycle 4: ItineraryPDF component — RED → GREEN
**Test file**: `app/components/__tests__/ItineraryPDF.test.tsx`

Tests (mocking `@react-pdf/renderer` with DOM stubs):
1. `[AC-AITINPDF-F6]` renders trip name in header
2. `[AC-AITINPDF-F6]` renders formatted start/end dates in header
3. `[AC-AITINPDF-F3]` renders venue name for each meal with suggested time
4. `[AC-AITINPDF-F5]` renders "No votes yet" for empty meal slots

### Cycle 5: Wire into itinerary page — Functional
Add `useItineraryDownload` hook and Download button to `ItineraryContent`.

### Cycle 6: Final verification
- `npx tsc --noEmit` → exit 0
- `npx vitest run` → all tests green
- Commit + push
