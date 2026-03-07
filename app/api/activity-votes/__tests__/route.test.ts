import { describe, it, expect, vi, beforeEach } from 'vitest'

// [OWASP:A3] — Mock Supabase and SSE registry so tests never hit real external services
vi.mock('@/app/lib/supabase', () => ({
  createServerClient: vi.fn(),
}))

vi.mock('@/app/lib/sseActivityRegistry', () => ({
  broadcastActivity: vi.fn(),
}))

vi.mock('@/app/lib/memoryStore', () => ({
  memAddActivityVote:      vi.fn(),
  memRemoveActivityVote:   vi.fn(),
  memGetActivityVotes:     vi.fn().mockReturnValue([]),
  memClearDayActivityVotes: vi.fn(),
}))

import { NextRequest } from 'next/server'
import { createServerClient } from '@/app/lib/supabase'
import { broadcastActivity } from '@/app/lib/sseActivityRegistry'
import { memAddActivityVote, memRemoveActivityVote, memGetActivityVotes, memClearDayActivityVotes } from '@/app/lib/memoryStore'
import { POST, DELETE } from '../route'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSupabase({
  insertResult = { data: { id: 'av1', activity_id: 'd1:act:surf-01', voter_name: 'Alice', created_at: '' }, error: null },
  deleteError  = null as null | { code?: string; message: string },
  selectResult = { data: [], error: null },
}: {
  insertResult?: { data: unknown; error: null | { code?: string; message: string } }
  deleteError?: null | { code?: string; message: string }
  selectResult?: { data: unknown; error: null | { code?: string; message: string } }
} = {}) {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'activity_votes') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue(insertResult),
            }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq:   vi.fn().mockResolvedValue({ error: deleteError }),
              like: vi.fn().mockResolvedValue({ error: deleteError }),
            }),
          }),
          select: vi.fn().mockResolvedValue(selectResult),
        }
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) }
    }),
  }
}

function postRequest(body: unknown) {
  return new Request('http://localhost/api/activity-votes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest
}

function deleteRequest(body: unknown) {
  return new Request('http://localhost/api/activity-votes', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest
}

// ── Tests: POST ───────────────────────────────────────────────────────────────

describe('POST /api/activity-votes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Input validation tests don't need a Supabase mock.
    // Tests that need in-memory fallback set up 42P01 mock per-case.
  })

  it('[AC-ACTIVITIES-F3] returns 400 when body is missing activity_id', async () => {
    const res = await POST(postRequest({ voter_name: 'Alice' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/activity_id/i)
  })

  it('[AC-ACTIVITIES-F3] returns 400 when body is missing voter_name', async () => {
    const res = await POST(postRequest({ activity_id: 'd1:act:surf-01' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/voter_name/i)
  })

  it('[AC-ACTIVITIES-F3] returns 400 when voter_name exceeds 50 chars', async () => {
    const res = await POST(postRequest({ activity_id: 'd1:act:surf-01', voter_name: 'A'.repeat(51) }))
    expect(res.status).toBe(400)
  })

  it('[AC-ACTIVITIES-F3] in-memory fallback (42P01) — returns 201 on success', async () => {
    const mockVote = { id: 'av1', activity_id: 'd1:act:surf-01', voter_name: 'Alice', created_at: '' }
    // Return 42P01 error to trigger in-memory fallback path
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSupabase({
        insertResult: { data: null, error: { code: '42P01', message: 'relation not found' } },
      })
    )
    vi.mocked(memAddActivityVote).mockReturnValue(mockVote)

    const res = await POST(postRequest({ activity_id: 'd1:act:surf-01', voter_name: 'Alice' }))
    expect(res.status).toBe(201)
    expect(broadcastActivity).toHaveBeenCalled()
  })

  it('[AC-ACTIVITIES-F3] in-memory fallback (42P01) — returns 409 on duplicate', async () => {
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSupabase({
        insertResult: { data: null, error: { code: '42P01', message: 'relation not found' } },
      })
    )
    vi.mocked(memAddActivityVote).mockReturnValue(null) // duplicate

    const res = await POST(postRequest({ activity_id: 'd1:act:surf-01', voter_name: 'Alice' }))
    expect(res.status).toBe(409)
  })

  it('[AC-ACTIVITIES-S1] returns 400 when body is malformed JSON', async () => {
    const req = new Request('http://localhost/api/activity-votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    }) as unknown as NextRequest
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

// ── Tests: DELETE ─────────────────────────────────────────────────────────────

describe('DELETE /api/activity-votes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // These tests don't set up createServerClient mock — 42P01 fallback path tests do so per-case.
    // For tests that only check input validation, no Supabase call is made.
  })

  it('[AC-ACTIVITIES-F4] single removal — in-memory fallback returns 200', async () => {
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSupabase({ deleteError: { code: '42P01', message: 'relation not found' } })
    )
    vi.mocked(memRemoveActivityVote).mockReturnValue(undefined)

    const res = await DELETE(deleteRequest({ activity_id: 'd1:act:surf-01', voter_name: 'Alice' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('[AC-ACTIVITIES-F4] bulk clear — valid day_prefix returns 200', async () => {
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSupabase({ deleteError: { code: '42P01', message: 'relation not found' } })
    )
    vi.mocked(memClearDayActivityVotes).mockReturnValue(undefined)

    const res = await DELETE(deleteRequest({ day_prefix: 'd1:act:', voter_name: 'Alice' }))
    expect(res.status).toBe(200)
  })

  it('[AC-ACTIVITIES-S2] bulk clear — invalid day_prefix returns 400', async () => {
    const res = await DELETE(deleteRequest({ day_prefix: 'd1:', voter_name: 'Alice' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/invalid day_prefix/i)
  })

  it('[AC-ACTIVITIES-S2] bulk clear — day_prefix d4 (out of range) returns 400', async () => {
    const res = await DELETE(deleteRequest({ day_prefix: 'd4:act:', voter_name: 'Alice' }))
    expect(res.status).toBe(400)
  })

  it('[AC-ACTIVITIES-F4] bulk clear — missing voter_name returns 400', async () => {
    const res = await DELETE(deleteRequest({ day_prefix: 'd1:act:' }))
    expect(res.status).toBe(400)
  })

  it('[AC-ACTIVITIES-F4] single removal — missing activity_id returns 400', async () => {
    const res = await DELETE(deleteRequest({ voter_name: 'Alice' }))
    expect(res.status).toBe(400)
  })
})
