import { NextResponse } from 'next/server'
import { createAdminClient } from '@/app/lib/supabase'

type Params = { params: Promise<{ id: string }> }

const ALLOWED_CATEGORIES = ['morning', 'afternoon', 'evening'] as const

// PATCH /api/activities/[id] — Joef-only: update an activity [OWASP:A1, A3]
// Featured image is managed via activity_images.is_featured (same pattern as restaurants)
export async function PATCH(req: Request, { params }: Params) {
  // [OWASP:A1] admin gate — server-side, not UI-only
  const createdBy = req.headers.get('x-created-by')
  if (createdBy !== 'Joef') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Separate imageUrl (handled via activity_images table) from table fields
  const { imageUrl, ...rest } = body

  // [OWASP:A3] whitelist fields — ignore any unrecognised keys
  const ALLOWED = ['name', 'category', 'vibe', 'address', 'lat', 'lng', 'hours', 'description'] as const
  const update: Record<string, unknown> = {}
  for (const field of ALLOWED) {
    if (field in rest) {
      update[field] = rest[field]
    }
  }

  // Validate category enum if provided
  if ('category' in update && !ALLOWED_CATEGORIES.includes(update.category as typeof ALLOWED_CATEGORIES[number])) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  // Validate vibe array if provided
  if ('vibe' in update && !Array.isArray(update.vibe)) {
    return NextResponse.json({ error: 'vibe must be an array' }, { status: 400 })
  }

  // Initialise admin client inside a try/catch so a missing/wrong SUPABASE_SERVICE_ROLE_KEY
  // returns a proper JSON 500 instead of crashing Next.js into an HTML error page
  let supabase: ReturnType<typeof createAdminClient>
  try {
    supabase = createAdminClient()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server configuration error'
    console.error('[PATCH activities] createAdminClient failed:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // Update activity table fields (if any changed)
  let activityRow: Record<string, unknown> | null = null
  if (Object.keys(update).length > 0) {
    const { data, error } = await supabase
      .from('activities')
      .update(update)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    activityRow = data as Record<string, unknown>
  } else {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    activityRow = data as Record<string, unknown>
  }

  // Handle featured image: update is_featured in activity_images table
  let featuredImageUrl: string | undefined
  if (typeof imageUrl === 'string' && imageUrl) {
    // Clear existing featured flag for this activity
    await supabase
      .from('activity_images')
      .update({ is_featured: false })
      .eq('activity_id', id)

    // Set is_featured on the selected image
    await supabase
      .from('activity_images')
      .update({ is_featured: true })
      .eq('activity_id', id)
      .eq('image_url', imageUrl)

    featuredImageUrl = imageUrl
  } else {
    // Read current featured image
    const { data: feat } = await supabase
      .from('activity_images')
      .select('image_url')
      .eq('activity_id', id)
      .eq('is_featured', true)
      .maybeSingle()
    featuredImageUrl = feat?.image_url
  }

  // Strip legacy image_url from activities table row (source of truth is activity_images)
  const { image_url: _legacy, ...rowWithoutLegacy } = activityRow
  void _legacy
  return NextResponse.json({ ...rowWithoutLegacy, imageUrl: featuredImageUrl ?? undefined })
}
