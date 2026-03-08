import { NextResponse } from 'next/server'
import { createAdminClient } from '@/app/lib/supabase'

type Params = { params: Promise<{ id: string }> }

const ALLOWED_CATEGORIES = ['breakfast', 'lunch', 'dinner'] as const

// PATCH /api/restaurants/[id] — Joef-only: update restaurant fields and/or featured image
// Featured image is stored via restaurant_images.is_featured, NOT on the restaurants table [OWASP:A1, A3]
export async function PATCH(req: Request, { params }: Params) {
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

  // [OWASP:A3] whitelist restaurant table fields (imageUrl handled separately)
  const RESTAURANT_FIELDS = ['name', 'category', 'vibe', 'address', 'lat', 'lng', 'hours', 'description'] as const
  const restaurantUpdate: Record<string, unknown> = {}
  let newFeaturedUrl: string | null | undefined = undefined // undefined = not present in request

  for (const field of RESTAURANT_FIELDS) {
    if (field in body) restaurantUpdate[field] = body[field]
  }
  if ('imageUrl' in body) newFeaturedUrl = body.imageUrl as string | null

  if (Object.keys(restaurantUpdate).length === 0 && newFeaturedUrl === undefined) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  if ('category' in restaurantUpdate && !ALLOWED_CATEGORIES.includes(restaurantUpdate.category as typeof ALLOWED_CATEGORIES[number])) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  if ('vibe' in restaurantUpdate && !Array.isArray(restaurantUpdate.vibe)) {
    return NextResponse.json({ error: 'vibe must be an array' }, { status: 400 })
  }

  // Initialise admin client inside a try/catch so a missing/wrong SUPABASE_SERVICE_ROLE_KEY
  // returns a proper JSON 500 instead of crashing Next.js into an HTML error page
  let supabase: ReturnType<typeof createAdminClient>
  try {
    supabase = createAdminClient()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server configuration error'
    console.error('[PATCH restaurants] createAdminClient failed:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // Handle featured image via restaurant_images.is_featured — restaurants table has no image_url column
  if (newFeaturedUrl !== undefined) {
    await supabase.from('restaurant_images').update({ is_featured: false }).eq('venue_id', id)
    if (newFeaturedUrl) {
      await supabase
        .from('restaurant_images')
        .update({ is_featured: true })
        .eq('venue_id', id)
        .eq('image_url', newFeaturedUrl)
    }
  }

  // Update restaurant metadata fields if provided
  let restaurantRow: Record<string, unknown>
  if (Object.keys(restaurantUpdate).length > 0) {
    const { data, error } = await supabase.from('restaurants').update(restaurantUpdate).eq('id', id).select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    restaurantRow = data as Record<string, unknown>
  } else {
    const { data, error } = await supabase.from('restaurants').select('*').eq('id', id).single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    restaurantRow = data as Record<string, unknown>
  }

  // Always resolve current featured image URL for the response so updateVenue() in store stays accurate
  const { data: feat } = await supabase
    .from('restaurant_images')
    .select('image_url')
    .eq('venue_id', id)
    .eq('is_featured', true)
    .maybeSingle()

  return NextResponse.json({ ...restaurantRow, imageUrl: (feat?.image_url as string) ?? undefined })
}
