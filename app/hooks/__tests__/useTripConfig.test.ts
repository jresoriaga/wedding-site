import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAppStore } from '@/app/lib/store'
import { useTripConfig } from '../useTripConfig'

const MOCK_CONFIG = {
  id: 'main',
  trip_name: 'La Union Outing',
  start_date: '2026-04-10',
  end_date: '2026-04-12',
  stay_name: 'Flotsam & Jetsam Hostel',
  stay_lat: 16.6596,
  stay_lng: 120.3224,
  updated_by: 'Joef',
  updated_at: '2026-03-07T00:00:00Z',
}

describe('useTripConfig', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    useAppStore.setState({ tripConfig: null })
  })

  it('[AC-TRIPCONFIG-F4] fetches config on mount and writes it to the Zustand store', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: MOCK_CONFIG }),
    } as Response)

    renderHook(() => useTripConfig())

    await waitFor(() => {
      expect(useAppStore.getState().tripConfig).toMatchObject({
        trip_name: 'La Union Outing',
        stay_lat: 16.6596,
      })
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/trip-config')
  })

  it('[AC-TRIPCONFIG-E1] sets tripConfig to null when API returns { data: null }', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: null }),
    } as Response)

    renderHook(() => useTripConfig())

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    expect(useAppStore.getState().tripConfig).toBeNull()
  })

  it('[AC-TRIPCONFIG-ERR2] leaves tripConfig null and does not throw when fetch fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    renderHook(() => useTripConfig())

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    expect(useAppStore.getState().tripConfig).toBeNull()
  })
})
