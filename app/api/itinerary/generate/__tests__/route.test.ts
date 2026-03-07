import { describe, it, expect, vi, beforeEach } from 'vitest'

// [OWASP:A3, A5] — Mock OpenAI before import so tests never hit real API
// Use a proper ES6 class (not arrow fn) so `new OpenAI()` works in Vitest 4 [AC-AITINPDF-S1]
const mockCreate = vi.hoisted(() => vi.fn())

vi.mock('openai', () => ({
  default: class MockOpenAI {
    chat = { completions: { create: mockCreate } }
  },
}))

vi.mock('@/app/lib/supabase', () => ({
  createServerClient: vi.fn(),
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
  { id: 'b-02', name: 'Aliro Coffee', category: 'breakfast', address: 'San Juan, La Union', lat: 16.66, lng: 120.32, vibe: ['café'] },
  { id: 'l-01', name: 'Tagpuan', category: 'lunch', address: 'San Juan, La Union', lat: 16.65, lng: 120.32, vibe: ['casual dining'] },
  { id: 'd-01', name: 'Surf Shack', category: 'dinner', address: 'San Juan, La Union', lat: 16.65, lng: 120.32, vibe: ['bar'] },
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

const VALID_AI_RESPONSE = {
  days: [
    {
      day: 1,
      date: '2026-04-10',
      meals: [
        { meal: 'breakfast', venue: 'El Union Coffee', address: 'San Juan, La Union', suggestedTime: '8:00 AM', duration: '1 hour', travelNote: '5 min walk from hostel' },
        { meal: 'lunch', venue: 'Tagpuan', address: 'San Juan, La Union', suggestedTime: '12:30 PM', duration: '1.5 hours', travelNote: '10 min drive' },
        { meal: 'dinner', venue: 'Surf Shack', address: 'San Juan, La Union', suggestedTime: '7:00 PM', duration: '2 hours', travelNote: 'Beachfront' },
      ],
    },
    {
      day: 2,
      date: '2026-04-11',
      meals: [
        { meal: 'breakfast', venue: 'No votes yet', address: '', suggestedTime: '—', duration: '—', travelNote: '—' },
        { meal: 'lunch', venue: 'No votes yet', address: '', suggestedTime: '—', duration: '—', travelNote: '—' },
        { meal: 'dinner', venue: 'No votes yet', address: '', suggestedTime: '—', duration: '—', travelNote: '—' },
      ],
    },
    {
      day: 3,
      date: '2026-04-12',
      meals: [
        { meal: 'breakfast', venue: 'No votes yet', address: '', suggestedTime: '—', duration: '—', travelNote: '—' },
        { meal: 'lunch', venue: 'No votes yet', address: '', suggestedTime: '—', duration: '—', travelNote: '—' },
        { meal: 'dinner', venue: 'No votes yet', address: '', suggestedTime: '—', duration: '—', travelNote: '—' },
      ],
    },
  ],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSupabase({
  tripConfig,
  votes = MOCK_VOTES,
  restaurants = MOCK_RESTAURANTS,
  tripError = null as null | { code?: string; message: string },
}: {
  tripConfig: typeof MOCK_TRIP_CONFIG | null
  votes?: typeof MOCK_VOTES
  restaurants?: typeof MOCK_RESTAURANTS
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
      // restaurants
      return { select: vi.fn().mockResolvedValue({ data: restaurants, error: null }) }
    }),
  }
}

function setupOpenAI(response: unknown) {
  mockCreate.mockResolvedValue({
    choices: [{ message: { content: JSON.stringify(response) } }],
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/itinerary/generate', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.OPENAI_API_KEY = 'test-key'
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

  it('[AC-AITINPDF-F3] returns structured GeneratedItinerary on happy path', async () => {
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSupabase({ tripConfig: MOCK_TRIP_CONFIG })
    )
    setupOpenAI(VALID_AI_RESPONSE)

    const req = new Request('http://localhost/api/itinerary/generate', { method: 'POST' })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.days).toHaveLength(3)
    expect(json.days[0].meals[0].venue).toBe('El Union Coffee')
  })

  it('[AC-AITINPDF-F5] prompt contains "No votes yet" for zero-vote slots', async () => {
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSupabase({ tripConfig: MOCK_TRIP_CONFIG, votes: [] })
    )
    setupOpenAI(VALID_AI_RESPONSE)

    const req = new Request('http://localhost/api/itinerary/generate', { method: 'POST' })
    await POST(req)

    expect(mockCreate).toHaveBeenCalledOnce()
    const callArg = mockCreate.mock.calls[0][0]
    const userMessage = callArg.messages.find((m: { role: string }) => m.role === 'user').content as string
    expect(userMessage).toMatch(/No votes yet/i)
  })

  it('[AC-AITINPDF-F3] top venue is highest-vote-count; ties broken alphabetically', async () => {
    // Aliro (b-02) gets 2 votes, El Union (b-01) gets 2 votes — tie → alphabetical → Aliro wins
    const tieVotes = [
      { id: 'v1', venue_id: 'd1:b-01', voter_name: 'Alice', created_at: '' },
      { id: 'v2', venue_id: 'd1:b-01', voter_name: 'Bob', created_at: '' },
      { id: 'v3', venue_id: 'd1:b-02', voter_name: 'Carol', created_at: '' },
      { id: 'v4', venue_id: 'd1:b-02', voter_name: 'Dan', created_at: '' },
    ]
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSupabase({ tripConfig: MOCK_TRIP_CONFIG, votes: tieVotes })
    )
    setupOpenAI(VALID_AI_RESPONSE)

    const req = new Request('http://localhost/api/itinerary/generate', { method: 'POST' })
    await POST(req)

    const callArg = mockCreate.mock.calls[0][0]
    const userMessage = callArg.messages.find((m: { role: string }) => m.role === 'user').content as string
    // Aliro comes before El Union alphabetically → should appear in prompt first
    const aliroIdx = userMessage.indexOf('Aliro Coffee')
    const elUnionIdx = userMessage.indexOf('El Union Coffee')
    // Day 1 breakfast: Aliro should be the top pick (tie broken by name asc)
    expect(aliroIdx).toBeGreaterThanOrEqual(0)
    expect(aliroIdx).toBeLessThan(elUnionIdx === -1 ? Infinity : elUnionIdx)
  })

  it('[AC-AITINPDF-S2] returns 502 when OpenAI returns malformed JSON', async () => {
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSupabase({ tripConfig: MOCK_TRIP_CONFIG })
    )
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'not valid json {{{' } }],
    })

    const req = new Request('http://localhost/api/itinerary/generate', { method: 'POST' })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(502)
    expect(json.error).toBeDefined()
  })

  it('[AC-AITINPDF-S2] returns 502 when OpenAI returns JSON not matching GeneratedItinerary schema', async () => {
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSupabase({ tripConfig: MOCK_TRIP_CONFIG })
    )
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ wrong: 'shape' }) } }],
    })

    const req = new Request('http://localhost/api/itinerary/generate', { method: 'POST' })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(502)
    expect(json.error).toMatch(/schema/i)
  })

  it('[AC-AITINPDF-ERR1] returns 502 when OpenAI call throws', async () => {
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSupabase({ tripConfig: MOCK_TRIP_CONFIG })
    )
    mockCreate.mockRejectedValue(new Error('Rate limit exceeded'))

    const req = new Request('http://localhost/api/itinerary/generate', { method: 'POST' })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(502)
    expect(json.error).toMatch(/AI generation failed/i)
  })
})
