import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/app/lib/supabase', () => ({
  createServerClient: vi.fn(),
  createAdminClient: vi.fn(),
}))

vi.mock('@/app/lib/restaurants', () => ({
  RESTAURANTS: [
    {
      id: 'b-01',
      name: 'El Union Coffee',
      category: 'breakfast',
      vibe: ['café'],
      address: 'San Juan, La Union',
      lat: 16.6596395,
      lng: 120.3223696,
    },
    {
      id: 'l-01',
      name: 'Tagpuan Sa San Juan',
      category: 'lunch',
      vibe: ['casual dining'],
      address: 'San Juan, La Union',
      lat: 16.658650,
      lng: 120.321850,
    },
  ],
}))

import { createServerClient, createAdminClient } from '@/app/lib/supabase'
import { RESTAURANTS } from '@/app/lib/restaurants'
import { GET, POST } from '../route'

function makeOrderSelect(result: { data: unknown; error: unknown }) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue(result),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  }
}

describe('GET /api/restaurants', () => {
  beforeEach(() => vi.clearAllMocks())

  it('[AC-ITINPLAN0306-F11] returns venues from Supabase when table exists', async () => {
    const mockVenues = [RESTAURANTS[0]]
    vi.mocked(createServerClient).mockReturnValue(
      makeOrderSelect({ data: mockVenues, error: null }) as unknown as ReturnType<typeof createServerClient>
    )

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual(mockVenues)
  })

  it('[AC-ITINPLAN0306-F11] falls back to static RESTAURANTS on DB error', async () => {
    vi.mocked(createServerClient).mockReturnValue(
      makeOrderSelect({ data: null, error: { message: '42P01' } }) as unknown as ReturnType<typeof createServerClient>
    )

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual(RESTAURANTS)
  })
})

describe('POST /api/restaurants', () => {
  beforeEach(() => vi.clearAllMocks())

  it('[AC-ITINPLAN0306-S4] returns 403 when created_by is not Joef', async () => {
    const req = new Request('http://localhost/api/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-created-by': 'Alice' },
      body: JSON.stringify({ name: 'Test', category: 'breakfast', address: 'La Union', lat: 16.6, lng: 120.3 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('[AC-ITINPLAN0306-F14] returns 400 when required fields are missing', async () => {
    const req = new Request('http://localhost/api/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-created-by': 'Joef' },
      body: JSON.stringify({ name: 'Test' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('[AC-ITINPLAN0306-F14] inserts restaurant and returns 201 for Joef', async () => {
    const newVenue = {
      id: 'b-99',
      name: 'New Place',
      category: 'breakfast',
      address: 'San Juan, La Union',
      lat: 16.66,
      lng: 120.32,
      vibe: ['café'],
    }
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: newVenue, error: null }),
          }),
        }),
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServerClient>)
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createAdminClient>)

    const req = new Request('http://localhost/api/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-created-by': 'Joef' },
      body: JSON.stringify(newVenue),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.name).toBe('New Place')
  })
})
