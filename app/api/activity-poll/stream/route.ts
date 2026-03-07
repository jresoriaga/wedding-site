// [AC-ACTIVITIES-F5] Activity votes SSE stream
// Node.js runtime required for streaming on Vercel
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { registerActivityWriter, broadcastActivity } from '@/app/lib/sseActivityRegistry'
import { createServerClient } from '@/app/lib/supabase'
import { memGetActivityVotes } from '@/app/lib/memoryStore'

const useSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)

const HEARTBEAT_INTERVAL_MS = 25_000

export async function GET() {
  // Fetch initial activity votes on connect
  let initialVotes: unknown[] = []
  if (useSupabase) {
    const supabase = createServerClient()
    const { data, error } = await supabase.from('activity_votes').select('*')
    if (!error) {
      initialVotes = data ?? []
    } else {
      initialVotes = memGetActivityVotes()
    }
  } else {
    initialVotes = memGetActivityVotes()
  }

  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()

  const write = (data: string) => {
    writer.write(encoder.encode(data)).catch(() => unregister())
  }

  const close = () => {
    writer.close().catch(() => {})
  }

  const unregister = registerActivityWriter({ write, close })

  // Send initial state immediately on connect
  write(`event: activity-votes\ndata: ${JSON.stringify(initialVotes)}\n\n`)

  // Heartbeat to prevent connection timeout
  const heartbeat = setInterval(() => {
    write(': heartbeat\n\n')
  }, HEARTBEAT_INTERVAL_MS)

  // Cleanup on client disconnect
  const cleanup = () => {
    clearInterval(heartbeat)
    unregister()
  }

  const response = new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })

  stream.readable.cancel = async () => {
    cleanup()
  }

  return response
}

export { broadcastActivity }

