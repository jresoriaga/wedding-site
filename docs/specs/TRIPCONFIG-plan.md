# Plan: Trip Configuration (Dates + Stay Location)

**SLUG**: `TRIPCONFIG`
**Spec**: `docs/specs/TRIPCONFIG-spec.md`
**Date**: March 7, 2026
**Skills Active**: node-tdd, vercel-react-best-practices, owasp-security-checklist, yagni-enforcement, evidence-first-claims

---

## Summary

Three deliverables in dependency order: (1) DB migration + API routes, (2) Zustand store + `useTripConfig` hook, (3) `TripConfigModal` UI + itinerary page wiring. Each step is test-driven — test written first, watched fail, then minimal implementation to green. No code ships without a failing test first.

**Complexity**: Medium (4 new files + 4 modified files, 1 DB migration, no new npm deps)
**Prerequisite for**: AITINPDF

---

## Security Checklist (Pre-Implementation)

- [ ] `PUT /api/trip-config` gate: `x-created-by: Joef` header checked **server-side** before any DB write
- [ ] `lat`/`lng` validated as finite numbers in range server-side (not just UI)
- [ ] `createAdminClient()` used **only** in PUT handler, never GET
- [ ] `createServerClient()` used for GET (anon, RLS SELECT-only)
- [ ] No user-supplied strings injected into SQL (Supabase JS SDK parameterises automatically)

---

## Pre-Work: Database Migration

Run this in **Supabase Dashboard → SQL Editor** before writing any code. Tests will mock Supabase, but the real table must exist for the deployed app.

```sql
create table trip_config (
  id           text primary key default 'main',
  trip_name    text not null,
  start_date   date not null,
  end_date     date not null,
  stay_name    text not null,
  stay_lat     double precision not null,
  stay_lng     double precision not null,
  updated_by   text not null default 'Joef',
  updated_at   timestamptz default now()
);

alter table trip_config enable row level security;
create policy "public read" on trip_config for select using (true);
-- No anon insert/update policy — service role used for writes
```

**Verify before proceeding**: Run `select * from trip_config` — empty result, no error = table exists with correct schema.

---

## Types First (no test needed — pure TypeScript)

Add `TripConfig` to `app/lib/types.ts` before any hook or API code references it.

```typescript
export interface TripConfig {
  id: string           // always 'main'
  trip_name: string
  start_date: string   // ISO date, e.g. "2026-04-10"
  end_date: string
  stay_name: string
  stay_lat: number
  stay_lng: number
  updated_by: string
  updated_at: string
}
```

---

## Cycle 1 — `GET /api/trip-config` Route Handler

### Files
- **Test**: `app/api/trip-config/__tests__/route.test.ts`
- **Source**: `app/api/trip-config/route.ts`

### Step 1 — RED: Write the tests first

```typescript
// app/api/trip-config/__tests__/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/app/lib/supabase', () => ({
  createServerClient: vi.fn(),
  createAdminClient: vi.fn(),
}))

import { createServerClient, createAdminClient } from '@/app/lib/supabase'
import { GET, PUT } from '../route'

// ── Helpers ──────────────────────────────────────────────────────────────────

const MOCK_CONFIG = {
  id: 'main',
  trip_name: 'La Union Outing',
  start_date: '2026-04-10',
  end_date: '2026-04-12',
  stay_name: 'Flotsam & Jetsam Hostel',
  stay_lat: 16.6596,
  stay_lng: 120.3224,
  updated_by: 'Joef',
  updated_at: '2026-03-07T00:00:00Z',
}

function makeSelectSingle(result: { data: unknown; error: unknown }) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(result),
        }),
      }),
      upsert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(result),
        }),
      }),
    }),
  }
}

// ── GET ───────────────────────────────────────────────────────────────────────

describe('GET /api/trip-config', () => {
  beforeEach(() => vi.clearAllMocks())

  it('[AC-TRIPCONFIG-F3] returns saved config when row exists', async () => {
    vi.mocked(createServerClient).mockReturnValue(
      makeSelectSingle({ data: MOCK_CONFIG, error: null }) as any
    )
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toMatchObject({ trip_name: 'La Union Outing', stay_lat: 16.6596 })
  })

  it('[AC-TRIPCONFIG-E1] returns { data: null } when no config row exists', async () => {
    vi.mocked(createServerClient).mockReturnValue(
      makeSelectSingle({ data: null, error: { code: 'PGRST116' } }) as any
      // PGRST116 = "no rows returned" from PostgREST
    )
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toBeNull()
  })
})

// ── PUT ───────────────────────────────────────────────────────────────────────

describe('PUT /api/trip-config', () => {
  beforeEach(() => vi.clearAllMocks())

  const VALID_BODY = {
    trip_name: 'La Union Outing',
    start_date: '2026-04-10',
    end_date: '2026-04-12',
    stay_name: 'Flotsam & Jetsam Hostel',
    stay_lat: 16.6596,
    stay_lng: 120.3224,
  }

  function makeReq(body: unknown, headers: Record<string, string> = { 'x-created-by': 'Joef' }) {
    return new Request('http://localhost/api/trip-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    })
  }

  it('[AC-TRIPCONFIG-S1] returns 403 when x-created-by header is missing', async () => {
    const res = await PUT(makeReq(VALID_BODY, {}))
    expect(res.status).toBe(403)
  })

  it('[AC-TRIPCONFIG-S1] returns 403 when x-created-by is not Joef', async () => {
    const res = await PUT(makeReq(VALID_BODY, { 'x-created-by': 'Alice' }))
    expect(res.status).toBe(403)
  })

  it('[AC-TRIPCONFIG-E2] returns 400 when start_date >= end_date', async () => {
    const res = await PUT(makeReq({ ...VALID_BODY, start_date: '2026-04-12', end_date: '2026-04-10' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/start_date must be before end_date/i)
  })

  it('[AC-TRIPCONFIG-S2] returns 400 when lat is out of -90..90 range', async () => {
    const res = await PUT(makeReq({ ...VALID_BODY, stay_lat: 200 }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/lat/i)
  })

  it('[AC-TRIPCONFIG-S2] returns 400 when lng is out of -180..180 range', async () => {
    const res = await PUT(makeReq({ ...VALID_BODY, stay_lng: -200 }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/lng/i)
  })

  it('[AC-TRIPCONFIG-E3] returns 400 when lat is not a number', async () => {
    const res = await PUT(makeReq({ ...VALID_BODY, stay_lat: 'abc' }))
    expect(res.status).toBe(400)
  })

  it('[AC-TRIPCONFIG-S3] returns 400 when trip_name exceeds 100 chars', async () => {
    const res = await PUT(makeReq({ ...VALID_BODY, trip_name: 'x'.repeat(101) }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/trip_name/i)
  })

  it('[AC-TRIPCONFIG-F2] upserts config and returns saved row on valid request', async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      makeSelectSingle({ data: MOCK_CONFIG, error: null }) as any
    )
    const res = await PUT(makeReq(VALID_BODY))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toMatchObject({ trip_name: 'La Union Outing' })
  })

  it('[AC-TRIPCONFIG-ERR1] returns 500 with error message when DB upsert fails', async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      makeSelectSingle({ data: null, error: { message: 'DB constraint' } }) as any
    )
    const res = await PUT(makeReq(VALID_BODY))
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBeTruthy()
  })
})
```

### Step 2 — Verify RED

```bash
npx vitest run app/api/trip-config/__tests__/route.test.ts
```

Expected: all tests fail with `Cannot find module '../route'`.

### Step 3 — GREEN: Implement the route

```typescript
// app/api/trip-config/route.ts
import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/app/lib/supabase'
import type { TripConfig } from '@/app/lib/types'

// GET /api/trip-config — public read, returns { data: TripConfig | null }
export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('trip_config')
      .select('*')
      .eq('id', 'main')
      .single()

    // PGRST116 = no rows found — not an error for this endpoint
    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ data: null }, { status: 200 })
    }
    return NextResponse.json({ data: data ?? null })
  } catch {
    return NextResponse.json({ data: null })
  }
}

// PUT /api/trip-config — Joef-only upsert [OWASP:A1, AC-TRIPCONFIG-S1]
export async function PUT(req: Request) {
  // [AC-TRIPCONFIG-S1] server-side admin gate
  if (req.headers.get('x-created-by') !== 'Joef') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Partial<Record<string, unknown>>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Required field presence
  const required = ['trip_name', 'start_date', 'end_date', 'stay_name', 'stay_lat', 'stay_lng'] as const
  for (const field of required) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 })
    }
  }

  // String length validation [AC-TRIPCONFIG-S3]
  if (typeof body.trip_name === 'string' && body.trip_name.length > 100) {
    return NextResponse.json({ error: 'trip_name must be 100 characters or fewer' }, { status: 400 })
  }
  if (typeof body.stay_name === 'string' && body.stay_name.length > 200) {
    return NextResponse.json({ error: 'stay_name must be 200 characters or fewer' }, { status: 400 })
  }

  // Lat/lng numeric validation [AC-TRIPCONFIG-S2, E3]
  const lat = Number(body.stay_lat)
  const lng = Number(body.stay_lng)
  if (!isFinite(lat) || lat < -90 || lat > 90) {
    return NextResponse.json({ error: 'stay_lat must be a number between -90 and 90' }, { status: 400 })
  }
  if (!isFinite(lng) || lng < -180 || lng > 180) {
    return NextResponse.json({ error: 'stay_lng must be a number between -180 and 180' }, { status: 400 })
  }

  // Date ordering validation [AC-TRIPCONFIG-E2]
  const start = new Date(body.start_date as string)
  const end = new Date(body.end_date as string)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: 'start_date and end_date must be valid dates' }, { status: 400 })
  }
  if (start >= end) {
    return NextResponse.json({ error: 'start_date must be before end_date' }, { status: 400 })
  }

  // Upsert via admin client (bypasses RLS) [OWASP:A1]
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('trip_config')
    .upsert({
      id: 'main',
      trip_name: body.trip_name,
      start_date: body.start_date,
      end_date: body.end_date,
      stay_name: body.stay_name,
      stay_lat: lat,
      stay_lng: lng,
      updated_by: 'Joef',
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ data })
}
```

### Step 4 — Verify GREEN

```bash
npx vitest run app/api/trip-config/__tests__/route.test.ts
# Expected: 9/9 passing
npx vitest run
# Expected: all existing tests still passing
```

---

## Cycle 2 — Zustand Store + `useTripConfig` Hook

### Files
- **Source (types)**: `app/lib/types.ts` — already done in Types First section
- **Source (store)**: `app/lib/store.ts`
- **Source (hook)**: `app/hooks/useTripConfig.ts`

No isolated unit test needed for the store slice (it's a pure object mutation — tested implicitly through the hook). Test the hook via a component render.

### Step 1 — RED: Hook test

```typescript
// app/hooks/__tests__/useTripConfig.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// Reset store between tests
beforeEach(() => {
  vi.restoreAllMocks()
  // Reset store to initial state
  const { useAppStore } = require('@/app/lib/store')
  useAppStore.setState({ tripConfig: null })
})

const MOCK_CONFIG = {
  id: 'main',
  trip_name: 'La Union Outing',
  start_date: '2026-04-10',
  end_date: '2026-04-12',
  stay_name: 'Flotsam & Jetsam Hostel',
  stay_lat: 16.6596,
  stay_lng: 120.3224,
  updated_by: 'Joef',
  updated_at: '2026-03-07T00:00:00Z',
}

describe('useTripConfig', () => {
  it('[AC-TRIPCONFIG-F4] fetches config and writes to store on mount', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: MOCK_CONFIG }),
    }))

    const { useTripConfig } = await import('@/app/hooks/useTripConfig')
    const { useAppStore } = await import('@/app/lib/store')

    renderHook(() => useTripConfig())

    await waitFor(() => {
      expect(useAppStore.getState().tripConfig).toMatchObject({ trip_name: 'La Union Outing' })
    })
  })

  it('[AC-TRIPCONFIG-ERR2] leaves tripConfig null when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const { useTripConfig } = await import('@/app/hooks/useTripConfig')
    const { useAppStore } = await import('@/app/lib/store')

    renderHook(() => useTripConfig())

    await waitFor(() => {
      expect(useAppStore.getState().tripConfig).toBeNull()
    })
  })
})
```

### Step 2 — Verify RED

```bash
npx vitest run app/hooks/__tests__/useTripConfig.test.ts
# Expected: fails — module not found
```

### Step 3 — GREEN: Store slice + hook

**Store slice — add to `app/lib/store.ts`:**

```typescript
// In the interface, add:
tripConfig: TripConfig | null
setTripConfig: (config: TripConfig | null) => void

// In create(), add:
tripConfig: null,
setTripConfig: (config) => set({ tripConfig: config }),
```

**Hook:**

```typescript
// app/hooks/useTripConfig.ts
'use client'
import { useEffect } from 'react'
import { useAppStore } from '@/app/lib/store'
import type { TripConfig } from '@/app/lib/types'

export function useTripConfig() {
  const setTripConfig = useAppStore((s) => s.setTripConfig)

  useEffect(() => {
    fetch('/api/trip-config')
      .then((r) => r.json())
      .then((json: { data: TripConfig | null }) => {
        setTripConfig(json.data)
      })
      .catch(() => {
        // [AC-TRIPCONFIG-ERR2] silently degrade — store stays null
      })
  }, [setTripConfig])
}
```

### Step 4 — Verify GREEN

```bash
npx vitest run app/hooks/__tests__/useTripConfig.test.ts
npx vitest run
```

---

## Cycle 3 — `TripConfigModal` Component

### Files
- **Source**: `app/components/TripConfigModal.tsx`

This is purely a client component with fetch logic. Test that it: (1) submits the correct payload, (2) shows server errors, (3) pre-fills existing values.

### Step 1 — RED: Component tests

```typescript
// app/components/__tests__/TripConfigModal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TripConfigModal from '../TripConfigModal'

const MOCK_CONFIG = {
  id: 'main',
  trip_name: 'La Union Outing',
  start_date: '2026-04-10',
  end_date: '2026-04-12',
  stay_name: 'Flotsam & Jetsam Hostel',
  stay_lat: 16.6596,
  stay_lng: 120.3224,
  updated_by: 'Joef',
  updated_at: '2026-03-07T00:00:00Z',
}

describe('TripConfigModal', () => {
  const onSaved = vi.fn()
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('[AC-TRIPCONFIG-F5] pre-fills form fields when existing config is provided', () => {
    render(<TripConfigModal existing={MOCK_CONFIG} onSaved={onSaved} onClose={onClose} />)
    expect(screen.getByRole('textbox', { name: /trip name/i })).toHaveValue('La Union Outing')
    expect(screen.getByRole('textbox', { name: /stay.*name/i })).toHaveValue('Flotsam & Jetsam Hostel')
  })

  it('[AC-TRIPCONFIG-F2] calls PUT /api/trip-config with correct headers on submit', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: MOCK_CONFIG }),
    } as Response)

    render(<TripConfigModal existing={null} onSaved={onSaved} onClose={onClose} />)

    await userEvent.type(screen.getByRole('textbox', { name: /trip name/i }), 'La Union Outing')
    await userEvent.type(screen.getByRole('textbox', { name: /stay.*name/i }), 'Flotsam')
    // ... fill other required fields
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      const [url, opts] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit]
      expect(url).toBe('/api/trip-config')
      expect(opts.method).toBe('PUT')
      expect((opts.headers as Record<string, string>)['x-created-by']).toBe('Joef')
    })
  })

  it('[AC-TRIPCONFIG-ERR1] shows server error when PUT returns error', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'DB constraint violated' }),
    } as Response)

    render(<TripConfigModal existing={null} onSaved={onSaved} onClose={onClose} />)
    // fill form...
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('DB constraint violated')
    })
  })

  it('close button calls onClose', () => {
    render(<TripConfigModal existing={null} onSaved={onSaved} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close|cancel/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
```

### Step 2 — Verify RED

```bash
npx vitest run app/components/__tests__/TripConfigModal.test.tsx
# Expected: fails — module not found
```

### Step 3 — GREEN: Implement `TripConfigModal`

Component structure (follow `AdminRestaurantModal.tsx` exactly):

```
TripConfigModal props: { existing: TripConfig | null; onSaved: (c: TripConfig) => void; onClose: () => void }

Form fields (all required):
  - Trip name        → <input type="text" aria-label="Trip name" maxLength={100}>
  - Start date       → <input type="date" aria-label="Start date">
  - End date         → <input type="date" aria-label="End date">
  - Stay name        → <input type="text" aria-label="Stay location name" maxLength={200}>
  - Latitude         → <input type="number" aria-label="Stay latitude" step="any" min="-90" max="90">
  - Longitude        → <input type="number" aria-label="Stay longitude" step="any" min="-180" max="180">

Submit: PUT /api/trip-config with header x-created-by: Joef
On success: call onSaved(data), setTripConfig(data) in store
On error: show <p role="alert"> with error message
```

### Step 4 — Verify GREEN

```bash
npx vitest run app/components/__tests__/TripConfigModal.test.tsx
npx vitest run
```

---

## Cycle 4 — Wire into Itinerary Page

No isolated test needed — the component and hook are already tested. This cycle is minimal wiring only.

**Changes to `app/itinerary/page.tsx`:**

1. Import: `useTripConfig`, `TripConfigModal`
2. Call `useTripConfig()` at the top of `ItineraryContent` (alongside `usePollStream()`)
3. Add state: `const [showTripConfigModal, setShowTripConfigModal] = useState(false)`
4. Add button next to existing admin FAB (also gated on `userName === 'Joef'`):

```tsx
{userName === 'Joef' && (
  <button
    type="button"
    onClick={() => setShowTripConfigModal(true)}
    aria-label="Configure trip dates and location"
    data-testid="trip-config-fab"
    className="..." // same styling as admin-fab
  >
    ⚙️
  </button>
)}
{showTripConfigModal && (
  <TripConfigModal
    existing={tripConfig}  // from useAppStore((s) => s.tripConfig)
    onSaved={(config) => { setTripConfig(config); setShowTripConfigModal(false) }}
    onClose={() => setShowTripConfigModal(false)}
  />
)}
```

5. Call `useTripConfig()` in `app/map/page.tsx` as well so the map page hydrates `tripConfig` in store.

**Verify:**

```bash
npx tsc --noEmit --pretty false
npx vitest run
# Expected: all previous tests pass + new cycle tests pass
```

---

## Cycle 5 — Final Verification & Commit

### Full test run

```bash
npx vitest run --reporter=verbose 2>&1 | tail -20
# Expected: ≥84 + new tests passing, 0 failing
```

### Type check

```bash
npx tsc --noEmit --pretty false
# Expected: exit 0
```

### Manual smoke test (after `npx next dev`)

- [ ] Log in as "Joef" → see ⚙️ Trip Config button
- [ ] Log in as "Alice" → ⚙️ Trip Config button absent
- [ ] Open modal → fill form → submit → modal closes, no error
- [ ] Reopen modal → values pre-filled from store [AC-TRIPCONFIG-F5]
- [ ] Submit with `start_date >= end_date` → 400 error shown in modal [AC-TRIPCONFIG-E2]
- [ ] `GET /api/trip-config` in browser → returns `{ data: { trip_name: ... } }` [AC-TRIPCONFIG-F3]
- [ ] `PUT /api/trip-config` without header in curl → 403 [AC-TRIPCONFIG-S1]

### Commit message

```
feat: trip configuration — admin sets dates + stay location (TRIPCONFIG)

- DB: trip_config table (single-row upsert, RLS public read)
- API: GET /api/trip-config (anon read), PUT /api/trip-config (Joef-only)
- Store: tripConfig + setTripConfig added to Zustand
- Hook: useTripConfig fetches on mount, writes to store
- UI: TripConfigModal (date pickers + lat/lng inputs), Joef-only FAB
- Server validates lat/lng ranges, date ordering, string length [OWASP:A1,A3]

Prerequisite for: AITINPDF
```

---

## New File Checklist

| File | Status |
|------|--------|
| `app/api/trip-config/route.ts` | ⬜ not started |
| `app/api/trip-config/__tests__/route.test.ts` | ⬜ not started |
| `app/components/TripConfigModal.tsx` | ⬜ not started |
| `app/components/__tests__/TripConfigModal.test.tsx` | ⬜ not started |
| `app/hooks/useTripConfig.ts` | ⬜ not started |
| `app/hooks/__tests__/useTripConfig.test.ts` | ⬜ not started |

## Modified File Checklist

| File | Change |
|------|--------|
| `app/lib/types.ts` | Add `TripConfig` interface |
| `app/lib/store.ts` | Add `tripConfig` + `setTripConfig` |
| `app/itinerary/page.tsx` | Add `useTripConfig()`, Trip Config button + modal |
| `app/map/page.tsx` | Add `useTripConfig()` call |

---

## AC Coverage Map

| AC ID | Cycle | Test Location |
|-------|-------|---------------|
| AC-TRIPCONFIG-F1 | 4 | Manual smoke test |
| AC-TRIPCONFIG-F2 | 1 + 3 | `route.test.ts` PUT valid, `TripConfigModal.test.tsx` submit |
| AC-TRIPCONFIG-F3 | 1 | `route.test.ts` GET happy path |
| AC-TRIPCONFIG-F4 | 2 | `useTripConfig.test.ts` mount |
| AC-TRIPCONFIG-F5 | 3 | `TripConfigModal.test.tsx` pre-fill |
| AC-TRIPCONFIG-S1 | 1 | `route.test.ts` PUT 403 cases |
| AC-TRIPCONFIG-S2 | 1 | `route.test.ts` PUT lat/lng range |
| AC-TRIPCONFIG-S3 | 1 | `route.test.ts` PUT name length |
| AC-TRIPCONFIG-E1 | 1 | `route.test.ts` GET null |
| AC-TRIPCONFIG-E2 | 1 | `route.test.ts` PUT date ordering |
| AC-TRIPCONFIG-E3 | 1 | `route.test.ts` PUT non-numeric lat |
| AC-TRIPCONFIG-ERR1 | 3 | `TripConfigModal.test.tsx` server error |
| AC-TRIPCONFIG-ERR2 | 2 | `useTripConfig.test.ts` fetch fail |
