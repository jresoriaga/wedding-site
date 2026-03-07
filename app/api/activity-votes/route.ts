import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/app/lib/supabase'
import { validateName, sanitizeName } from '@/app/lib/validateName'
import { broadcastActivity } from '@/app/lib/sseActivityRegistry'
import {
  memAddActivityVote,
  memRemoveActivityVote,
  memGetActivityVotes,
  memClearDayActivityVotes,
} from '@/app/lib/memoryStore'

const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
const PG_UNDEFINED_TABLE = '42P01'

// [OWASP:A3] Input validation before any DB operation
function validatePayload(
  body: unknown,
): { activity_id: string; voter_name: string } | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Invalid request body' }
  const { activity_id, voter_name } = body as Record<string, unknown>

  if (!activity_id || typeof activity_id !== 'string') return { error: 'activity_id is required' }
  if (!voter_name || typeof voter_name !== 'string') return { error: 'voter_name is required' }

  const nameError = validateName(voter_name)
  if (nameError) return { error: nameError }

  return { activity_id: activity_id.trim(), voter_name: sanitizeName(voter_name) }
}

async function broadcastCurrentActivityVotes(supabase?: ReturnType<typeof createServerClient>) {
  if (supabase) {
    const { data: votes, error } = await supabase.from('activity_votes').select('*')
    if (!error) {
      broadcastActivity('activity-votes', votes ?? [])
      return
    }
  }
  broadcastActivity('activity-votes', memGetActivityVotes())
}

// POST /api/activity-votes — add a vote [AC-ACTIVITIES-F3]
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const validated = validatePayload(body)
  if ('error' in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  if (supabaseConfigured) {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('activity_votes')
      .insert({ activity_id: validated.activity_id, voter_name: validated.voter_name })
      .select()
      .single()

    if (!error) {
      await broadcastCurrentActivityVotes(supabase)
      return NextResponse.json(data, { status: 201 })
    }

    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already voted for this activity' }, { status: 409 })
    }

    if (error.code !== PG_UNDEFINED_TABLE) {
      console.error('[POST /api/activity-votes] Supabase error', error)
      return NextResponse.json({ error: 'Failed to save vote' }, { status: 500 })
    }

    console.warn('[POST /api/activity-votes] activity_votes table not found — using in-memory fallback')
  }

  // --- In-memory fallback ---
  const vote = memAddActivityVote(validated.activity_id, validated.voter_name)
  if (!vote) {
    return NextResponse.json({ error: 'Already voted for this activity' }, { status: 409 })
  }
  await broadcastCurrentActivityVotes()
  return NextResponse.json(vote, { status: 201 })
}

// DELETE /api/activity-votes — remove a single vote OR all activity votes for a user on a day
// [AC-ACTIVITIES-F4]
export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { activity_id, voter_name, day_prefix } = body as Record<string, unknown>

  // ── Bulk: clear all activity votes for a user on a given day ─────────────
  if (!activity_id && day_prefix !== undefined) {
    if (typeof voter_name !== 'string' || !voter_name.trim()) {
      return NextResponse.json({ error: 'voter_name is required' }, { status: 400 })
    }
    if (typeof day_prefix !== 'string' || !/^d[1-3]:act:$/.test(day_prefix)) {
      return NextResponse.json({ error: 'Invalid day_prefix for activities' }, { status: 400 })
    }
    const cleanName = sanitizeName(voter_name)

    if (supabaseConfigured) {
      const supabase = createServerClient()
      const { error } = await supabase
        .from('activity_votes')
        .delete()
        .eq('voter_name', cleanName)
        .like('activity_id', `${day_prefix}%`)

      if (error && error.code !== PG_UNDEFINED_TABLE) {
        console.error('[DELETE /api/activity-votes bulk] Supabase error', error)
        return NextResponse.json({ error: 'Failed to clear votes' }, { status: 500 })
      }

      if (!error) {
        await broadcastCurrentActivityVotes(supabase)
        return NextResponse.json({ ok: true })
      }
    }

    memClearDayActivityVotes(cleanName, day_prefix)
    await broadcastCurrentActivityVotes()
    return NextResponse.json({ ok: true })
  }

  // ── Single vote removal ───────────────────────────────────────────────────
  if (!activity_id || !voter_name) {
    return NextResponse.json({ error: 'activity_id and voter_name are required' }, { status: 400 })
  }

  const nameError = validateName(voter_name as string)
  if (nameError) return NextResponse.json({ error: nameError }, { status: 400 })

  const cleanName = sanitizeName(voter_name as string)
  const cleanId = (activity_id as string).trim()

  if (supabaseConfigured) {
    const supabase = createServerClient()
    const { error } = await supabase
      .from('activity_votes')
      .delete()
      .eq('activity_id', cleanId)
      .eq('voter_name', cleanName)

    if (error && error.code !== PG_UNDEFINED_TABLE) {
      console.error('[DELETE /api/activity-votes] Supabase error', error)
      return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 })
    }

    if (!error) {
      await broadcastCurrentActivityVotes(supabase)
      return NextResponse.json({ ok: true })
    }
  }

  memRemoveActivityVote(cleanId, cleanName)
  await broadcastCurrentActivityVotes()
  return NextResponse.json({ ok: true })
}
