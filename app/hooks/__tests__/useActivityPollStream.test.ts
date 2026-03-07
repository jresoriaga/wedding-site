import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// [AC-ACTIVITIES-F5, F6] useActivityPollStream hook tests
// Use vi.hoisted so mockStore is available inside the vi.mock factory (hoisting requirement)

const mockStore = vi.hoisted(() => ({
  setActivityPollData: vi.fn(),
  setActivityAllVotes: vi.fn(),
  setIsActivityReconnecting: vi.fn(),
  setSelectedActivityIds: vi.fn(),
  activeDay: 1 as 1 | 2 | 3,
  activityAllVotes: [] as unknown[],
  activityVenues: [] as unknown[],
  userName: 'Alice',
}))

vi.mock('@/app/lib/store', () => ({
  useAppStore: Object.assign(
    vi.fn((selector: (s: typeof mockStore) => unknown) => selector(mockStore)),
    { getState: () => mockStore },
  ),
}))

vi.mock('@/app/lib/rankActivities', () => ({ rankActivities: vi.fn().mockReturnValue([]) }))

// ── EventSource mock ──────────────────────────────────────────────────────────

let mockEventSources: MockEventSource[] = []


class MockEventSource {
  url: string
  listeners: Record<string, ((e: MessageEvent) => void)[]> = {}
  onopen: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor(url: string) {
    this.url = url
    mockEventSources.push(this)
  }

  addEventListener(event: string, cb: (e: MessageEvent) => void) {
    if (!this.listeners[event]) this.listeners[event] = []
    this.listeners[event].push(cb)
  }

  dispatchEvent(event: string, data: unknown) {
    const cbs = this.listeners[event] ?? []
    const msgEvent = { data: JSON.stringify(data) } as MessageEvent
    cbs.forEach((cb) => cb(msgEvent))
  }

  close() {}
}

vi.stubGlobal('EventSource', MockEventSource)

import { useActivityPollStream } from '../useActivityPollStream'

describe('useActivityPollStream', () => {
  beforeEach(() => {
    // Reset call history without clearing implementations
    vi.clearAllMocks()
    mockEventSources = []
    // Restore vi.fn implementations cleared by clearAllMocks
    mockStore.setActivityPollData.mockImplementation(() => {})
    mockStore.setActivityAllVotes.mockImplementation(() => {})
    mockStore.setIsActivityReconnecting.mockImplementation(() => {})
    mockStore.setSelectedActivityIds.mockImplementation(() => {})
    mockStore.activityAllVotes = []
    mockStore.activityVenues = []
    mockStore.activeDay = 1
    mockStore.userName = 'Alice'
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('[AC-ACTIVITIES-F5] connects to /api/activity-poll/stream', () => {
    renderHook(() => useActivityPollStream())
    expect(mockEventSources).toHaveLength(1)
    expect(mockEventSources[0].url).toBe('/api/activity-poll/stream')
  })

  it('[AC-ACTIVITIES-F6] parses activity-votes event and calls setActivityAllVotes', () => {
    renderHook(() => useActivityPollStream())
    const es = mockEventSources[0]
    es.onopen?.()

    const votes = [
      { id: 'av1', activity_id: 'd1:act:surf-01', voter_name: 'Alice', created_at: '' },
    ]

    act(() => {
      es.dispatchEvent('activity-votes', votes)
    })

    expect(mockStore.setActivityAllVotes).toHaveBeenCalledWith(votes)
  })

  it('[AC-ACTIVITIES-F6] resets reconnecting flag on open', () => {
    renderHook(() => useActivityPollStream())
    const es = mockEventSources[0]

    act(() => {
      es.onopen?.()
    })

    expect(mockStore.setIsActivityReconnecting).toHaveBeenCalledWith(false)
  })

  it('[AC-ACTIVITIES-F5] sets isActivityReconnecting=true on error', () => {
    vi.useFakeTimers()
    renderHook(() => useActivityPollStream())
    const es = mockEventSources[0]

    act(() => {
      es.onerror?.()
    })

    expect(mockStore.setIsActivityReconnecting).toHaveBeenCalledWith(true)
  })

  it('[AC-ACTIVITIES-F5] reconnects with backoff after error', () => {
    vi.useFakeTimers()
    renderHook(() => useActivityPollStream())

    act(() => {
      mockEventSources[0].onerror?.()
      vi.advanceTimersByTime(2000) // wait past first retry delay
    })

    expect(mockEventSources.length).toBeGreaterThanOrEqual(2)
  })
})
