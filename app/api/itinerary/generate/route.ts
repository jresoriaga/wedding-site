import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerClient } from '@/app/lib/supabase'
import type { TripConfig, Venue, Vote, GeneratedItinerary } from '@/app/lib/types'

// [AC-AITINPDF-S1] AI client is server-only — never imported in 'use client' files
// [OWASP:A5] API key only accessed at request time, never at module level
// Uses Groq (free tier) via OpenAI-compatible SDK — model: llama-3.3-70b-versatile
function makeOpenAI(): OpenAI {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY not set')
  return new OpenAI({
    apiKey: key,
    baseURL: 'https://api.groq.com/openai/v1',
  })
}

const CATEGORIES = ['breakfast', 'lunch', 'dinner'] as const

// [AC-AITINPDF-F3, F5] Top venue per category per day — most votes; alpha tie-break
// Returns null when no votes exist for the category on that day
function getTopVenue(
  votes: Vote[],
  restaurants: Venue[],
  day: number,
  category: string,
): Venue | null {
  const prefix = `d${day}:`
  const counts: Record<string, number> = {}

  for (const vote of votes) {
    if (!vote.venue_id.startsWith(prefix)) continue
    const base = vote.venue_id.slice(prefix.length)
    counts[base] = (counts[base] ?? 0) + 1
  }

  const catVenues = restaurants.filter((v) => v.category === category)
  const withVotes = catVenues.filter((v) => (counts[v.id] ?? 0) >= 1)
  if (withVotes.length === 0) return null

  // Sort vote-count desc → name asc (stable, O(n log n))
  withVotes.sort((a, b) => {
    const voteDiff = (counts[b.id] ?? 0) - (counts[a.id] ?? 0)
    return voteDiff !== 0 ? voteDiff : a.name.localeCompare(b.name)
  })

  return withVotes[0]
}

// [OWASP:A3] Prompt injection hardening: venue names come from DB (trusted), no user text
function buildUserContent(
  cfg: TripConfig,
  days: Array<{ day: number; date: string; venues: Record<string, Venue | null> }>,
): string {
  const header = [
    `Trip: ${cfg.trip_name}`,
    `Stay: ${cfg.stay_name} (lat ${cfg.stay_lat}, lng ${cfg.stay_lng})`,
  ].join('\n')

  const dayLines = days.map(({ day, date, venues }) => {
    const meals = CATEGORIES.map((cat) => {
      const v = venues[cat]
      return v ? `${cap(cat)} at ${v.name} (${v.address})` : `${cap(cat)}: No votes yet`
    }).join(', ')
    return `Day ${day} (${date}): ${meals}`
  })

  const schema = `{ "days": [ { "day": 1, "date": "YYYY-MM-DD", "meals": [ { "meal": "breakfast", "venue": "...", "address": "...", "suggestedTime": "8:00 AM", "duration": "1 hour", "travelNote": "..." } ] } ] }`

  return [header, '', ...dayLines, '', `Respond ONLY with valid JSON matching this schema:\n${schema}`].join('\n')
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function isValidItinerary(obj: unknown): obj is GeneratedItinerary {
  return (
    !!obj &&
    typeof obj === 'object' &&
    Array.isArray((obj as Record<string, unknown>).days)
  )
}

// POST /api/itinerary/generate [AC-AITINPDF-F2, F3, E3, S2, ERR1]
// Intentionally public to all logged-in users — no admin gate [OWASP:A1 permissive by design]
export async function POST(_req: Request) {
  const supabase = createServerClient()

  // 1. Read trip_config [AC-AITINPDF-E3]
  const { data: tripConfig, error: tcError } = await supabase
    .from('trip_config')
    .select('*')
    .eq('id', 'main')
    .single()

  if (!tripConfig || tcError) {
    return NextResponse.json({ error: 'Trip config not set' }, { status: 400 })
  }

  // 2. Read votes
  const { data: votes, error: vError } = await supabase.from('votes').select('*')
  if (vError) {
    return NextResponse.json({ error: 'Failed to read votes' }, { status: 500 })
  }

  // 3. Read restaurants
  const { data: restaurants, error: rError } = await supabase.from('restaurants').select('*')
  if (rError) {
    return NextResponse.json({ error: 'Failed to read restaurants' }, { status: 500 })
  }

  // 4. Compute top venues per day × category
  const startDate = new Date(tripConfig.start_date)
  const days = [1, 2, 3].map((day) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + day - 1)
    const venues: Record<string, Venue | null> = {}
    for (const cat of CATEGORIES) {
      venues[cat] = getTopVenue(votes as Vote[] ?? [], restaurants as Venue[] ?? [], day, cat)
    }
    return { day, date: date.toISOString().slice(0, 10), venues }
  })

  // 5. Call OpenAI [AC-AITINPDF-S1, ERR1]
  let openai: OpenAI
  try {
    openai = makeOpenAI()
  } catch {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
  }

  let aiContent: string
  try {
    const completion = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a travel itinerary assistant. Given a list of restaurants (one per meal per day) and a trip start date, produce a realistic daily schedule with suggested meal times, estimated duration, and brief travel notes. Respond ONLY with valid JSON matching the schema provided.',
        },
        {
          role: 'user',
          content: buildUserContent(tripConfig as TripConfig, days),
        },
      ],
    })
    aiContent = completion.choices[0].message.content ?? ''
  } catch {
    return NextResponse.json({ error: 'AI generation failed — try again' }, { status: 502 })
  }

  // 6. Parse and validate [AC-AITINPDF-S2] — never pass raw AI text to client
  let parsed: unknown
  try {
    parsed = JSON.parse(aiContent)
  } catch {
    return NextResponse.json(
      { error: 'AI returned invalid JSON — please try again' },
      { status: 502 },
    )
  }

  if (!isValidItinerary(parsed)) {
    return NextResponse.json(
      { error: 'AI response schema mismatch — please try again' },
      { status: 502 },
    )
  }

  return NextResponse.json(parsed)
}
