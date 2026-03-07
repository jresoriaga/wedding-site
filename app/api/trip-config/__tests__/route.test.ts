import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/app/lib/supabase', () => ({
  createServerClient: vi.fn(),
  createAdminClient: vi.fn(),
}))

import { createServerClient, createAdminClient } from '@/app/lib/supabase'
import { GET, PUT } from '../route'

// ── Fixtures ──────────────────────────────────────────────────────────────────

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

const VALID_BODY = {
  trip_name: 'La Union Outing',
  start_date: '2026-04-10',
  end_date: '2026-04-12',
  stay_name: 'Flotsam & Jetsam Hostel',
  stay_lat: 16.6596,
  stay_lng: 120.3224,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSupabase(result: { data: unknown; error: unknown }) {
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

function makeReq(body: unknown, headers: Record<string, string> = { 'x-created-by': 'Joef' }) {
  return new Request('http://localhost/api/trip-config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

// ── GET ───────────────────────────────────────────────────────────────────────

describe('GET /api/trip-config', () => {
  beforeEach(() => vi.clearAllMocks())

  it('[AC-TRIPCONFIG-F3] returns saved config when row exists', async () => {
    vi.mocked(createServerClient).mockReturnValue(
      makeSupabase({ data: MOCK_CONFIG, error: null }) as any
    )
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toMatchObject({ trip_name: 'La Union Outing', stay_lat: 16.6596 })
  })

  it('[AC-TRIPCONFIG-E1] returns { data: null } when no config row exists (PGRST116)', async () => {
    vi.mocked(createServerClient).mockReturnValue(
      makeSupabase({ data: null, error: { code: 'PGRST116' } }) as any
    )
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toBeNull()
  })

  it('[AC-TRIPCONFIG-E1] returns { data: null } on unexpected DB error', async () => {
    vi.mocked(createServerClient).mockReturnValue(
      makeSupabase({ data: null, error: { code: '42P01', message: 'table not found' } }) as any
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

  // Security: admin gate [AC-TRIPCONFIG-S1]
  it('[AC-TRIPCONFIG-S1] returns 403 when x-created-by header is absent', async () => {
    const res = await PUT(makeReq(VALID_BODY, {}))
    expect(res.status).toBe(403)
  })

  it('[AC-TRIPCONFIG-S1] returns 403 when x-created-by is not Joef', async () => {
    const res = await PUT(makeReq(VALID_BODY, { 'x-created-by': 'Alice' }))
    expect(res.status).toBe(403)
  })

  // Date ordering [AC-TRIPCONFIG-E2]
  it('[AC-TRIPCONFIG-E2] returns 400 when start_date >= end_date', async () => {
    const res = await PUT(makeReq({ ...VALID_BODY, start_date: '2026-04-12', end_date: '2026-04-10' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/start_date must be before end_date/i)
  })

  it('[AC-TRIPCONFIG-E2] returns 400 when start_date equals end_date', async () => {
    const res = await PUT(makeReq({ ...VALID_BODY, start_date: '2026-04-10', end_date: '2026-04-10' }))
    expect(res.status).toBe(400)
  })

  // Coordinate range validation [AC-TRIPCONFIG-S2]
  it('[AC-TRIPCONFIG-S2] returns 400 when stay_lat > 90', async () => {
    const res = await PUT(makeReq({ ...VALID_BODY, stay_lat: 200 }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/stay_lat/i)
  })

  it('[AC-TRIPCONFIG-S2] returns 400 when stay_lat < -90', async () => {
    const res = await PUT(makeReq({ ...VALID_BODY, stay_lat: -91 }))
    expect(res.status).toBe(400)
  })

  it('[AC-TRIPCONFIG-S2] returns 400 when stay_lng > 180', async () => {
    const res = await PUT(makeReq({ ...VALID_BODY, stay_lng: 200 }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/stay_lng/i)
  })

  it('[AC-TRIPCONFIG-S2] returns 400 when stay_lng < -180', async () => {
    const res = await PUT(makeReq({ ...VALID_BODY, stay_lng: -181 }))
    expect(res.status).toBe(400)
  })

  // Non-numeric coordinates [AC-TRIPCONFIG-E3]
  it('[AC-TRIPCONFIG-E3] returns 400 when stay_lat is a non-numeric string', async () => {
    const res = await PUT(makeReq({ ...VALID_BODY, stay_lat: 'abc' }))
    expect(res.status).toBe(400)
  })

  it('[AC-TRIPCONFIG-E3] returns 400 when stay_lng is a non-numeric string', async () => {
    const res = await PUT(makeReq({ ...VALID_BODY, stay_lng: 'xyz' }))
    expect(res.status).toBe(400)
  })

  // String length [AC-TRIPCONFIG-S3]
  it('[AC-TRIPCONFIG-S3] returns 400 when trip_name exceeds 100 chars', async () => {
    const res = await PUT(makeReq({ ...VALID_BODY, trip_name: 'x'.repeat(101) }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/trip_name/i)
  })

  it('[AC-TRIPCONFIG-S3] returns 400 when stay_name exceeds 200 chars', async () => {
    const res = await PUT(makeReq({ ...VALID_BODY, stay_name: 'x'.repeat(201) }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/stay_name/i)
  })

  // Happy path [AC-TRIPCONFIG-F2]
  it('[AC-TRIPCONFIG-F2] upserts config and returns saved row on valid request', async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      makeSupabase({ data: MOCK_CONFIG, error: null }) as any
    )
    const res = await PUT(makeReq(VALID_BODY))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toMatchObject({ trip_name: 'La Union Outing', stay_lat: 16.6596 })
  })

  // DB error [AC-TRIPCONFIG-ERR1]
  it('[AC-TRIPCONFIG-ERR1] returns 500 with error message when DB upsert fails', async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      makeSupabase({ data: null, error: { message: 'DB constraint violated' } }) as any
    )
    const res = await PUT(makeReq(VALID_BODY))
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBeTruthy()
  })
})
