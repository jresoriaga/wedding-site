import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/app/lib/supabase'
import { validateName, sanitizeName } from '@/app/lib/validateName'
import { broadcast } from '@/app/lib/sseRegistry'
import { memAddVote, memRemoveVote, memGetVotes, memRenameVoter, memClearDayVotes } from '@/app/lib/memoryStore'

const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)

// PostgreSQL "undefined_table" error code — votes table not yet created
const PG_UNDEFINED_TABLE = '42P01'

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

async function broadcastCurrentVotes(supabase?: ReturnType<typeof createServerClient>) {
  if (supabase) {
    const { data: votes, error } = await supabase.from('votes').select('*')
    if (!error) {
      broadcast('votes', votes ?? [])
      return
    }
  }
  broadcast('votes', memGetVotes())
}

// POST /api/votes — add a vote [AC-ITINPLAN0306-S1, S2]
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const validated = validatePayload(body)
  if ('error' in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  if (supabaseConfigured) {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('votes')
      .insert({ venue_id: validated.venue_id, voter_name: validated.voter_name })
      .select()
      .single()

    if (!error) {
      await broadcastCurrentVotes(supabase)
      return NextResponse.json(data, { status: 201 })
    }

    // Unique constraint violation → 409 [AC-ITINPLAN0306-S2]
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already voted for this venue' }, { status: 409 })
    }

    // Table not created yet — fall through to in-memory
    if (error.code !== PG_UNDEFINED_TABLE) {
      console.error('[POST /api/votes] Supabase error', error)
      return NextResponse.json({ error: 'Failed to save vote' }, { status: 500 })
    }

    console.warn('[POST /api/votes] votes table not found — using in-memory fallback. Run the SQL from .env.local.example in your Supabase SQL Editor.')
  }

  // --- In-memory fallback ---
  const vote = memAddVote(validated.venue_id, validated.voter_name)
  if (!vote) {
    return NextResponse.json({ error: 'Already voted for this venue' }, { status: 409 })
  }
  await broadcastCurrentVotes()
  return NextResponse.json(vote, { status: 201 })
}

// DELETE /api/votes — remove a single vote OR all votes for a day
export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { venue_id, voter_name, day_prefix } = body as Record<string, unknown>

  // ── Bulk: clear all votes for a user on a given day ──────────────────────
  if (!venue_id && day_prefix !== undefined) {
    if (typeof voter_name !== 'string' || !voter_name.trim()) {
      return NextResponse.json({ error: 'voter_name is required' }, { status: 400 })
    }
    if (typeof day_prefix !== 'string' || !/^d[1-3]:$/.test(day_prefix)) {
      return NextResponse.json({ error: 'Invalid day_prefix' }, { status: 400 })
    }
    const cleanName = sanitizeName(voter_name)

    if (supabaseConfigured) {
      const supabase = createServerClient()
      const { error } = await supabase
        .from('votes')
        .delete()
        .like('venue_id', `${day_prefix}%`)
        .eq('voter_name', cleanName)

      if (!error) {
        await broadcastCurrentVotes(supabase)
        return NextResponse.json({ success: true })
      }
      if (error.code !== PG_UNDEFINED_TABLE) {
        console.error('[DELETE /api/votes bulk] Supabase error', error)
        return NextResponse.json({ error: 'Failed to clear votes' }, { status: 500 })
      }
      console.warn('[DELETE /api/votes bulk] votes table not found — using in-memory fallback.')
    }

    memClearDayVotes(cleanName, day_prefix)
    await broadcastCurrentVotes()
    return NextResponse.json({ success: true })
  }

  // ── Single delete (existing behaviour) ───────────────────────────────────
  const validated = validatePayload(body)
  if ('error' in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  if (supabaseConfigured) {
    const supabase = createServerClient()
    const { error } = await supabase
      .from('votes')
      .delete()
      .eq('venue_id', validated.venue_id)
      .eq('voter_name', validated.voter_name)

    if (!error) {
      await broadcastCurrentVotes(supabase)
      return NextResponse.json({ success: true })
    }

    if (error.code !== PG_UNDEFINED_TABLE) {
      console.error('[DELETE /api/votes] Supabase error', error)
      return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 })
    }

    console.warn('[DELETE /api/votes] votes table not found — using in-memory fallback.')
  }

  // --- In-memory fallback ---
  memRemoveVote(validated.venue_id, validated.voter_name)
  await broadcastCurrentVotes()
  return NextResponse.json({ success: true })
}

// GET /api/votes — fetch all votes
export async function GET() {
  if (supabaseConfigured) {
    const supabase = createServerClient()
    const { data, error } = await supabase.from('votes').select('*')

    if (!error) return NextResponse.json(data)

    if (error.code !== PG_UNDEFINED_TABLE) {
      console.error('[GET /api/votes] Supabase error', error)
      return NextResponse.json({ error: 'Failed to fetch votes' }, { status: 500 })
    }

    console.warn('[GET /api/votes] votes table not found — using in-memory fallback.')
  }

  return NextResponse.json(memGetVotes())
}

// PATCH /api/votes — rename a voter across all their votes
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { old_name, new_name } = body as Record<string, unknown>
  if (typeof old_name !== 'string' || !old_name.trim()) {
    return NextResponse.json({ error: 'old_name is required' }, { status: 400 })
  }
  const nameError = validateName(new_name as string)
  if (nameError) return NextResponse.json({ error: nameError }, { status: 400 })

  const cleanOld = sanitizeName(old_name)
  const cleanNew = sanitizeName(new_name as string)

  if (supabaseConfigured) {
    const supabase = createServerClient()
    const { error } = await supabase
      .from('votes')
      .update({ voter_name: cleanNew })
      .eq('voter_name', cleanOld)

    if (!error) {
      await broadcastCurrentVotes(supabase)
      return NextResponse.json({ success: true })
    }

    if (error.code !== PG_UNDEFINED_TABLE) {
      console.error('[PATCH /api/votes] Supabase error', error)
      return NextResponse.json({ error: 'Failed to rename' }, { status: 500 })
    }

    console.warn('[PATCH /api/votes] votes table not found — using in-memory fallback.')
  }

  // --- In-memory fallback ---
  memRenameVoter(cleanOld, cleanNew)
  await broadcastCurrentVotes()
  return NextResponse.json({ success: true })
}


