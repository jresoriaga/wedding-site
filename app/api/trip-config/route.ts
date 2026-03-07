import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/app/lib/supabase'

// GET /api/trip-config — public read via RLS SELECT policy [AC-TRIPCONFIG-F3, E1]
export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('trip_config')
      .select('*')
      .eq('id', 'main')
      .single()

    // PGRST116 = no rows found — expected when Joef hasn't configured yet
    if (error && error.code !== 'PGRST116') {
      // Any other DB error: degrade gracefully, return null [AC-TRIPCONFIG-E1]
      return NextResponse.json({ data: null })
    }
    return NextResponse.json({ data: data ?? null })
  } catch {
    return NextResponse.json({ data: null })
  }
}

// PUT /api/trip-config — Joef-only full upsert [AC-TRIPCONFIG-F2, S1, S2, S3, E2, E3, ERR1]
export async function PUT(req: Request) {
  // [AC-TRIPCONFIG-S1] server-side admin gate — UI check alone is not a security boundary [OWASP:A1]
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

  // Lat/lng numeric + range validation [AC-TRIPCONFIG-S2, E3] [OWASP:A3]
  const lat = Number(body.stay_lat)
  const lng = Number(body.stay_lng)
  if (!isFinite(lat) || lat < -90 || lat > 90) {
    return NextResponse.json({ error: 'stay_lat must be a finite number between -90 and 90' }, { status: 400 })
  }
  if (!isFinite(lng) || lng < -180 || lng > 180) {
    return NextResponse.json({ error: 'stay_lng must be a finite number between -180 and 180' }, { status: 400 })
  }

  // Date ordering validation [AC-TRIPCONFIG-E2]
  const start = new Date(body.start_date as string)
  const end = new Date(body.end_date as string)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: 'start_date and end_date must be valid ISO dates' }, { status: 400 })
  }
  if (start >= end) {
    return NextResponse.json({ error: 'start_date must be before end_date' }, { status: 400 })
  }

  // Upsert via service-role client — bypasses RLS for trusted server write [OWASP:A1]
  const supabase = createAdminClient()

  // Validate optional time fields [AC-ACTIVITIES-F13]
  const timeFormat = /^\d{1,2}:\d{2}\s*(AM|PM)$/i
  if (body.departure_time !== undefined && body.departure_time !== null && body.departure_time !== '') {
    if (typeof body.departure_time !== 'string' || !timeFormat.test(body.departure_time as string)) {
      return NextResponse.json({ error: 'departure_time must be in HH:MM AM/PM format' }, { status: 400 })
    }
  }
  if (body.arrival_time !== undefined && body.arrival_time !== null && body.arrival_time !== '') {
    if (typeof body.arrival_time !== 'string' || !timeFormat.test(body.arrival_time as string)) {
      return NextResponse.json({ error: 'arrival_time must be in HH:MM AM/PM format' }, { status: 400 })
    }
  }

  const { data, error } = await supabase
    .from('trip_config')
    .upsert({
      id: 'main',
      trip_name: (body.trip_name as string).trim(),
      start_date: body.start_date,
      end_date: body.end_date,
      stay_name: (body.stay_name as string).trim(),
      stay_lat: lat,
      stay_lng: lng,
      ...(body.departure_time ? { departure_time: (body.departure_time as string).trim() } : {}),
      ...(body.arrival_time ? { arrival_time: (body.arrival_time as string).trim() } : {}),
      updated_by: 'Joef',
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    // [AC-TRIPCONFIG-ERR1]
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ data })
}
