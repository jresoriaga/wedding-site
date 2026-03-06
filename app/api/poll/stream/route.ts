// [AC-ITINPLAN0306-F6, P2]
// Spike 1 validated: Node.js runtime required for streaming on Vercel
// See: docs/specs/ITINPLAN0306-plan.md — Risk: in-memory fan-out on serverless
// NOTE: If deploying to multiple Vercel instances, replace with Supabase Realtime fan-out
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { registerWriter, broadcast } from '@/app/lib/sseRegistry'
import { createServerClient } from '@/app/lib/supabase'

// Heartbeat every 25s to keep connection alive through proxies/load balancers
const HEARTBEAT_INTERVAL_MS = 25_000

export async function GET() {
  const supabase = createServerClient()

  // Fetch initial votes to send on connect
  const { data: initialVotes } = await supabase.from('votes').select('*')

  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()

  const write = (data: string) => {
    writer.write(encoder.encode(data)).catch(() => unregister())
  }

  const close = () => {
    writer.close().catch(() => {})
  }

  // Register with fan-out registry
  const unregister = registerWriter({ write, close })

  // Send initial state immediately on connect
  write(`event: votes\ndata: ${JSON.stringify(initialVotes ?? [])}\n\n`)

  // Heartbeat to prevent connection timeout [AC-ITINPLAN0306-ERR2]
  const heartbeat = setInterval(() => {
    write(`: heartbeat\n\n`)
  }, HEARTBEAT_INTERVAL_MS)

  // Cleanup on client disconnect
  const cleanup = () => {
    clearInterval(heartbeat)
    unregister()
  }

  // Use AbortSignal to detect disconnect (Next.js 13.4+)
  const response = new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // disable nginx buffering
    },
  })

  // Cleanup on abort
  stream.readable.cancel = async () => {
    cleanup()
  }

  return response
}

// Export broadcast so vote route can trigger updates
export { broadcast }
