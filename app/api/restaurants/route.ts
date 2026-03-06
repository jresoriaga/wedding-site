import { NextResponse } from 'next/server'
import { createServerClient } from '@/app/lib/supabase'
import { RESTAURANTS } from '@/app/lib/restaurants'
import type { Venue } from '@/app/lib/types'

// [SOLID:SRP] — each handler does one thing
// [OWASP:A3] — body parsed via JSON, no string concatenation

// GET /api/restaurants — returns all venues from DB, falls back to static list
export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('category')

    if (error || !data || data.length === 0) {
      return NextResponse.json(RESTAURANTS)
    }
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(RESTAURANTS)
  }
}

// POST /api/restaurants — Joef-only: create a new restaurant [OWASP:A1]
export async function POST(req: Request) {
  // [AC-ITINPLAN0306-S4] admin gate — checked server-side, not just UI
  const createdBy = req.headers.get('x-created-by')
  if (createdBy !== 'Joef') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Partial<Venue & { created_by?: string }>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // [AC-ITINPLAN0306-F14] validate required fields [OWASP:A3]
  const required = ['name', 'category', 'address', 'lat', 'lng'] as const
  for (const field of required) {
    if (!body[field] && body[field] !== 0) {
      return NextResponse.json(
        { error: `${field} is required` },
        { status: 400 }
      )
    }
  }

  // Validate category enum
  if (!['breakfast', 'lunch', 'dinner'].includes(body.category as string)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('restaurants')
    .insert({
      id: body.id ?? `${body.category![0]}-${Date.now()}`,
      name: body.name,
      category: body.category,
      vibe: body.vibe ?? [],
      address: body.address,
      lat: body.lat,
      lng: body.lng,
      hours: body.hours ?? null,
      description: body.description ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
