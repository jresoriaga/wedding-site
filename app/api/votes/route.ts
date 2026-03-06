import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/app/lib/supabase'
import { validateName, sanitizeName } from '@/app/lib/validateName'
import { broadcast } from '@/app/lib/sseRegistry'

// [OWASP:A3] Input validation before any DB operation
function validatePayload(body: unknown): { venue_id: string; voter_name: string } | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Invalid request body' }
  const { venue_id, voter_name } = body as Record<string, unknown>

  if (!venue_id || typeof venue_id !== 'string') return { error: 'venue_id is required' }
  if (!voter_name || typeof voter_name !== 'string') return { error: 'voter_name is required' }

  const nameError = validateName(voter_name) // [AC-ITINPLAN0306-S1]
  if (nameError) return { error: nameError }

  return { venue_id: venue_id.trim(), voter_name: sanitizeName(voter_name) }
}

async function broadcastCurrentVotes(supabase: ReturnType<typeof createServerClient>) {
  const { data: votes } = await supabase.from('votes').select('*')
  broadcast('votes', votes ?? [])
}

// POST /api/votes — add a vote [AC-ITINPLAN0306-S1, S2]
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const validated = validatePayload(body)
  if ('error' in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('votes')
    .insert({ venue_id: validated.venue_id, voter_name: validated.voter_name })
    .select()
    .single()

  if (error) {
    // Unique constraint violation → 409 [AC-ITINPLAN0306-S2]
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already voted for this venue' }, { status: 409 })
    }
    console.error('[POST /api/votes]', error)
    return NextResponse.json({ error: 'Failed to save vote' }, { status: 500 })
  }

  // Broadcast updated votes to all SSE clients [AC-ITINPLAN0306-F6]
  await broadcastCurrentVotes(supabase)

  return NextResponse.json(data, { status: 201 })
}

// DELETE /api/votes — remove a vote
export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const validated = validatePayload(body)
  if ('error' in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('votes')
    .delete()
    .eq('venue_id', validated.venue_id)
    .eq('voter_name', validated.voter_name)

  if (error) {
    console.error('[DELETE /api/votes]', error)
    return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 })
  }

  await broadcastCurrentVotes(supabase)

  return NextResponse.json({ success: true })
}

// GET /api/votes — fetch all votes
export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('votes').select('*')

  if (error) {
    console.error('[GET /api/votes]', error)
    return NextResponse.json({ error: 'Failed to fetch votes' }, { status: 500 })
  }

  return NextResponse.json(data)
}
