import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/app/lib/supabase'
import { ACTIVITIES } from '@/app/lib/activities'
import type { Activity } from '@/app/lib/types'

const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
const PG_UNDEFINED_TABLE = '42P01'

// GET /api/activities — returns enriched activity list (DB-first, static fallback)
// [AC-ACTIVITIES-F1]
export async function GET() {
  if (supabaseConfigured) {
    const supabase = createServerClient()
    const { data, error } = await supabase.from('activities').select('*')

    if (!error && data && data.length > 0) {
      // Batch-fetch featured images from activity_images table (no N+1)
      const activityIds = data.map((r: Record<string, unknown>) => r.id as string)
      const { data: featuredImages } = await supabase
        .from('activity_images')
        .select('activity_id, image_url')
        .in('activity_id', activityIds)
        .eq('is_featured', true)

      const featuredMap = new Map(
        (featuredImages ?? []).map((img: { activity_id: string; image_url: string }) => [
          img.activity_id,
          img.image_url,
        ])
      )

      const mapped = data.map((row: Record<string, unknown>) => {
        const { image_url: _legacy, ...rest } = row
        void _legacy
        return { ...rest, imageUrl: featuredMap.get(rest.id as string) ?? undefined }
      })
      return NextResponse.json({ activities: mapped })
    }

    if (error && error.code !== PG_UNDEFINED_TABLE) {
      console.error('[GET /api/activities] Supabase error', error)
    }
    // Fall through to static data if table missing or empty
  }

  return NextResponse.json({ activities: ACTIVITIES })
}

// POST /api/activities — Joef-only: create a new activity [OWASP:A1]
export async function POST(req: Request) {
  // [AC-ITINPLAN0306-S4] admin gate — checked server-side, not just UI
  const createdBy = req.headers.get('x-created-by')
  if (createdBy !== 'Joef') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Partial<Activity>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // [OWASP:A3] Validate required fields
  const required = ['name', 'category', 'address', 'lat', 'lng'] as const
  for (const field of required) {
    if (!body[field] && body[field] !== 0) {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 })
    }
  }

  if (!['morning', 'afternoon', 'evening'].includes(body.category as string)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  const supabase = createAdminClient() // service role — bypasses RLS for trusted server writes [OWASP:A1]
  const { data, error } = await supabase
    .from('activities')
    .insert({
      id: `act-${Date.now()}`,
      name: body.name,
      category: body.category,
      vibe: body.vibe ?? [],
      address: body.address,
      lat: body.lat,
      lng: body.lng,
      hours: body.hours ?? null,
      description: body.description ?? null,
      // image_url not written — featured image is managed via activity_images.is_featured
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { image_url, ...rest } = data as Record<string, unknown>
  return NextResponse.json({ ...rest, imageUrl: image_url ?? undefined }, { status: 201 })
}
