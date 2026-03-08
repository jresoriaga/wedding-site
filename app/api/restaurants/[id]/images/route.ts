import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/app/lib/supabase'

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const BUCKET = 'restaurant-images'

type Params = { params: Promise<{ id: string }> }

// GET /api/restaurants/[id]/images — public, lists images for a venue [AC-ITINPLAN0306-F13]
// Anon key is fine here because RLS is disabled on restaurant_images
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('restaurant_images')
      .select('id, image_url, uploaded_by, created_at')
      .eq('venue_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[GET images] Supabase query error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[GET images] Uncaught error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/restaurants/[id]/images — Joef-only image upload [AC-ITINPLAN0306-F12, S4, S5]
// [OWASP:A1] admin gate server-side
// [OWASP:A3] file validated before storage write
export async function POST(req: Request, { params }: Params) {
  const { id: venueId } = await params

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  // [AC-ITINPLAN0306-S4] admin gate
  const uploadedBy = formData.get('uploaded_by') as string | null
  if (uploadedBy !== 'Joef') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // [AC-ITINPLAN0306-S5] MIME type validation [OWASP:A3]
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
  }

  // [AC-ITINPLAN0306-S5] file size validation [OWASP:A3]
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File exceeds 5 MB limit' }, { status: 413 })
  }

  const supabase = createAdminClient() // service role — bypasses RLS for trusted server writes [OWASP:A1]

  // Upload to Supabase Storage
  const ext = file.name.split('.').pop() ?? 'jpg'
  const storagePath = `${venueId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, { contentType: file.type })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  const imageUrl = urlData.publicUrl

  // Insert record in restaurant_images table
  const { error: dbError } = await supabase.from('restaurant_images').insert({
    venue_id: venueId,
    image_url: imageUrl,
    uploaded_by: uploadedBy,
  })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ image_url: imageUrl }, { status: 201 })
}
