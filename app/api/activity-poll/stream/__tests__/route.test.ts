import { describe, it, expect, vi, beforeEach } from 'vitest'

// [AC-ACTIVITIES-F5] Activity poll SSE stream

vi.mock('@/app/lib/sseActivityRegistry', () => ({
  registerActivityWriter: vi.fn().mockReturnValue(() => {}), // returns unregister fn
  broadcastActivity: vi.fn(),
}))

vi.mock('@/app/lib/supabase', () => ({
  createServerClient: vi.fn(),
}))

vi.mock('@/app/lib/memoryStore', () => ({
  memGetActivityVotes: vi.fn().mockReturnValue([]),
}))

import { registerActivityWriter } from '@/app/lib/sseActivityRegistry'
import { GET } from '../route'

describe('GET /api/activity-poll/stream', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(registerActivityWriter).mockReturnValue(() => {})
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
  })

  it('[AC-ACTIVITIES-F5] returns text/event-stream Content-Type', async () => {
    const res = await GET()
    expect(res.headers.get('Content-Type')).toContain('text/event-stream')
  })

  it('[AC-ACTIVITIES-F5] registers a writer via registerActivityWriter', async () => {
    await GET()
    expect(registerActivityWriter).toHaveBeenCalledOnce()
    // Writer object must have write and close methods
    const writerArg = vi.mocked(registerActivityWriter).mock.calls[0][0]
    expect(typeof writerArg.write).toBe('function')
    expect(typeof writerArg.close).toBe('function')
  })

  it('[AC-ACTIVITIES-F5] sets Cache-Control: no-cache', async () => {
    const res = await GET()
    // Value may include directives; must contain no-cache
    expect(res.headers.get('Cache-Control')).toContain('no-cache')
  })
})
