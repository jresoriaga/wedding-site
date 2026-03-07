import { describe, it, expect, vi, beforeEach } from 'vitest'

// [OWASP:A3] — Mock Supabase so tests never hit real DB [AC-ACTIVITIES-F16]
vi.mock('@/app/lib/supabase', () => ({
  createServerClient: vi.fn(),
}))

// Static fallbacks are used when DB is empty
vi.mock('@/app/lib/restaurants', () => ({
  RESTAURANTS: [
    { id: 'b-01', name: 'El Union Coffee', category: 'breakfast', address: 'San Juan', lat: 16.66, lng: 120.32, vibe: ['café'] },
    { id: 'b-02', name: 'Aliro Coffee',    category: 'breakfast', address: 'San Juan', lat: 16.66, lng: 120.32, vibe: ['café'] },
    { id: 'l-01', name: 'Tagpuan',          category: 'lunch',     address: 'San Juan', lat: 16.65, lng: 120.32, vibe: ['casual dining'] },
    { id: 'd-01', name: 'Surf Shack',       category: 'dinner',    address: 'San Juan', lat: 16.65, lng: 120.32, vibe: ['bar'] },
  ],
}))

vi.mock('@/app/lib/activities', () => ({
  ACTIVITIES: [
    { id: 'surf-01', name: 'Surfing at San Juan', category: 'morning',   vibe: ['beach'], address: 'San Juan', lat: 16.66, lng: 120.32 },
    { id: 'hike-01', name: 'Tangadan Falls Hike', category: 'morning',   vibe: ['adventure'], address: 'San Gabriel', lat: 16.65, lng: 120.43 },
    { id: 'atv-01',  name: 'ATV Riding',          category: 'afternoon', vibe: ['adventure'], address: 'Urbiztondo', lat: 16.67, lng: 120.33 },
    { id: 'bg-01',   name: 'Bar Gaming Night',    category: 'evening',   vibe: ['nightlife'], address: 'San Juan', lat: 16.66, lng: 120.32 },
  ],
  ACTIVITY_MAP: {},
}))

import { createServerClient } from '@/app/lib/supabase'
import { POST } from '../route'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_TRIP_CONFIG = {
  id: 'main',
  trip_name: 'La Union Outing',
  start_date: '2026-04-10',
  end_date: '2026-04-12',
  stay_name: 'Flotsam & Jetsam',
  stay_lat: 16.6596,
  stay_lng: 120.3224,
  updated_by: 'Joef',
  updated_at: '2026-03-07T00:00:00Z',
}

const MOCK_RESTAURANTS = [
  { id: 'b-01', name: 'El Union Coffee', category: 'breakfast', address: 'San Juan, La Union', lat: 16.66, lng: 120.32, vibe: ['café'] },
  { id: 'b-02', name: 'Aliro Coffee',    category: 'breakfast', address: 'San Juan, La Union', lat: 16.66, lng: 120.32, vibe: ['café'] },
  { id: 'l-01', name: 'Tagpuan',         category: 'lunch',     address: 'San Juan, La Union', lat: 16.65, lng: 120.32, vibe: ['casual dining'] },
  { id: 'd-01', name: 'Surf Shack',      category: 'dinner',    address: 'San Juan, La Union', lat: 16.65, lng: 120.32, vibe: ['bar'] },
]

const MOCK_ACTIVITIES = [
  { id: 'surf-01', name: 'Surfing at San Juan', category: 'morning',   vibe: ['beach'], address: 'San Juan', lat: 16.66, lng: 120.32 },
  { id: 'atv-01',  name: 'ATV Riding',          category: 'afternoon', vibe: ['adventure'], address: 'Urbiztondo', lat: 16.67, lng: 120.33 },
  { id: 'bg-01',   name: 'Bar Gaming Night',    category: 'evening',   vibe: ['nightlife'], address: 'San Juan, La Union', lat: 16.66, lng: 120.32 },
]

const MOCK_VOTES = [
  // Day 1 — breakfast: El Union 2 votes, Aliro 1 vote; lunch: Tagpuan 1 vote; dinner: Surf Shack 1 vote
  { id: 'v1', venue_id: 'd1:b-01', voter_name: 'Alice', created_at: '2026-03-07T00:00:00Z' },
  { id: 'v2', venue_id: 'd1:b-01', voter_name: 'Bob', created_at: '2026-03-07T00:00:00Z' },
  { id: 'v3', venue_id: 'd1:b-02', voter_name: 'Carol', created_at: '2026-03-07T00:00:00Z' },
  { id: 'v4', venue_id: 'd1:l-01', voter_name: 'Alice', created_at: '2026-03-07T00:00:00Z' },
  { id: 'v5', venue_id: 'd1:d-01', voter_name: 'Alice', created_at: '2026-03-07T00:00:00Z' },
  // Day 2 & 3 — no votes for any category (all "No votes yet")
]

const MOCK_ACTIVITY_VOTES = [
  { id: 'av1', activity_id: 'd1:act:surf-01', voter_name: 'Alice', created_at: '' },
  { id: 'av2', activity_id: 'd1:act:atv-01', voter_name: 'Bob',   created_at: '' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSupabase({
  tripConfig,
  votes = MOCK_VOTES,
  restaurants = MOCK_RESTAURANTS,
  activityVotes = MOCK_ACTIVITY_VOTES,
  activities = MOCK_ACTIVITIES,
  tripError = null as null | { code?: string; message: string },
}: {
  tripConfig: typeof MOCK_TRIP_CONFIG | null
  votes?: typeof MOCK_VOTES
  restaurants?: typeof MOCK_RESTAURANTS
  activityVotes?: typeof MOCK_ACTIVITY_VOTES
  activities?: typeof MOCK_ACTIVITIES
  tripError?: null | { code?: string; message: string }
}) {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'trip_config') {
        const result = tripConfig
          ? { data: tripConfig, error: null }
          : { data: null, error: tripError ?? { code: 'PGRST116', message: 'Not found' } }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue(result),
            }),
          }),
        }
      }
      if (table === 'votes') {
        return { select: vi.fn().mockResolvedValue({ data: votes, error: null }) }
      }
      if (table === 'activity_votes') {
        return { select: vi.fn().mockResolvedValue({ data: activityVotes, error: null }) }
      }
      if (table === 'activities') {
        return { select: vi.fn().mockResolvedValue({ data: activities, error: null }) }
      }
      // restaurants
      return { select: vi.fn().mockResolvedValue({ data: restaurants, error: null }) }
    }),
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/itinerary/generate', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('[AC-AITINPDF-E3] returns 400 when trip config is not set', async () => {
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSupabase({ tripConfig: null })
    )

    const req = new Request('http://localhost/api/itinerary/generate', { method: 'POST' })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toMatch(/not set/i)
  })

  it('[AC-ACTIVITIES-F16] returns days with items[] on happy path', async () => {
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSupabase({ tripConfig: MOCK_TRIP_CONFIG })
    )

    const req = new Request('http://localhost/api/itinerary/generate', { method: 'POST' })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.days).toHaveLength(3)
    // items[] replaces meals[] — each day has a flat unified timeline
    expect(Array.isArray(json.days[0].items)).toBe(true)
    expect(json.days[0].items.length).toBeGreaterThan(0)
  })

  it('[AC-ACTIVITIES-F16] top meal venue is highest-vote-count winner', async () => {
    // El Union (b-01) has 2 votes vs Aliro (b-02) 1 vote → El Union wins breakfast on Day 1
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSupabase({ tripConfig: MOCK_TRIP_CONFIG })
    )

    const req = new Request('http://localhost/api/itinerary/generate', { method: 'POST' })
    const res = await POST(req)
    const json = await res.json()

    const breakfastItem = json.days[0].items.find(
      (item: { label: string }) => item.label === 'Breakfast'
    )
    expect(breakfastItem).toBeDefined()
    expect(breakfastItem.name).toBe('El Union Coffee')
    expect(breakfastItem.type).toBe('meal')
  })

  it('[AC-ACTIVITIES-F16] top venue ties broken alphabetically — Aliro before El Union', async () => {
    const tieVotes = [
      { id: 'v1', venue_id: 'd1:b-01', voter_name: 'Alice', created_at: '' },
      { id: 'v2', venue_id: 'd1:b-01', voter_name: 'Bob',   created_at: '' },
      { id: 'v3', venue_id: 'd1:b-02', voter_name: 'Carol', created_at: '' },
      { id: 'v4', venue_id: 'd1:b-02', voter_name: 'Dan',   created_at: '' },
    ]
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSupabase({ tripConfig: MOCK_TRIP_CONFIG, votes: tieVotes })
    )

    const req = new Request('http://localhost/api/itinerary/generate', { method: 'POST' })
    const res = await POST(req)
    const json = await res.json()

    const breakfastItem = json.days[0].items.find(
      (item: { label: string }) => item.label === 'Breakfast'
    )
    // Aliro < El Union alphabetically → Aliro wins the tie
    expect(breakfastItem.name).toBe('Aliro Coffee')
  })

  it('[AC-ACTIVITIES-F16] zero-vote meal slots show "No votes yet"', async () => {
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSupabase({ tripConfig: MOCK_TRIP_CONFIG, votes: [], activityVotes: [] })
    )

    const req = new Request('http://localhost/api/itinerary/generate', { method: 'POST' })
    const res = await POST(req)
    const json = await res.json()

    const mealItems = json.days[0].items.filter(
      (item: { type: string }) => item.type === 'meal'
    )
    for (const item of mealItems) {
      expect(item.name).toBe('No votes yet')
    }
  })

  it('[AC-ACTIVITIES-F16] zero-vote activity slots show "No activity selected"', async () => {
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSupabase({ tripConfig: MOCK_TRIP_CONFIG, votes: [], activityVotes: [] })
    )

    const req = new Request('http://localhost/api/itinerary/generate', { method: 'POST' })
    const res = await POST(req)
    const json = await res.json()

    const actItems = json.days[0].items.filter(
      (item: { type: string }) => item.type === 'activity'
    )
    for (const item of actItems) {
      expect(item.name).toBe('No activity selected')
    }
  })

  it('[AC-ACTIVITIES-F14] Day 1 arrival 12:00 PM skips Breakfast and Morning Activity', async () => {
    const earlyArrivalConfig = { ...MOCK_TRIP_CONFIG, arrival_time: '12:00 PM' }
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSupabase({ tripConfig: earlyArrivalConfig })
    )

    const req = new Request('http://localhost/api/itinerary/generate', { method: 'POST' })
    const res = await POST(req)
    const json = await res.json()

    const day1Items = json.days[0].items as { label: string }[]
    const labels = day1Items.map((i) => i.label)
    expect(labels).not.toContain('Breakfast')
    expect(labels).not.toContain('Morning Activity')
    expect(labels).toContain('Lunch')
  })
})
