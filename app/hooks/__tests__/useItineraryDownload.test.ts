import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAppStore } from '@/app/lib/store'

// [AC-AITINPDF-F4] Mock PDF renderer + component to prevent jsdom canvas errors
const mockPdfToBlob = vi.hoisted(() => vi.fn())
vi.mock('@react-pdf/renderer', () => ({
  // plain function (not vi.fn) so vi.resetAllMocks() doesn't wipe the implementation
  pdf: () => ({ toBlob: mockPdfToBlob }),
}))
vi.mock('@/app/components/ItineraryPDF', () => ({
  default: () => null,
}))

import { useItineraryDownload } from '../useItineraryDownload'

const MOCK_TRIP_CONFIG = {
  id: 'main',
  trip_name: 'La Union Outing',
  start_date: '2026-04-10',
  end_date: '2026-04-12',
  stay_name: 'Flotsam & Jetsam',
  stay_lat: 16.6596,
  stay_lng: 120.3224,
  updated_by: 'Joef',
  updated_at: '2026-03-07T00:00:00Z',
}

const MOCK_ITINERARY = {
  days: [
    {
      day: 1,
      date: '2026-04-10',
      meals: [
        { meal: 'breakfast', venue: 'El Union Coffee', address: 'San Juan, La Union', suggestedTime: '8:00 AM', duration: '1 hour', travelNote: 'Close to hostel' },
      ],
    },
  ],
}

describe('useItineraryDownload', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    useAppStore.setState({ tripConfig: null })
    // jsdom stubs for URL and anchor
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  it('[AC-AITINPDF-E1] sets error when tripConfig is null — no fetch called', async () => {
    useAppStore.setState({ tripConfig: null })
    global.fetch = vi.fn()

    const { result } = renderHook(() => useItineraryDownload())

    await act(async () => {
      await result.current.download()
    })

    expect(global.fetch).not.toHaveBeenCalled()
    expect(result.current.error).toMatch(/trip dates not set/i)
    expect(result.current.loading).toBe(false)
  })

  it('[AC-AITINPDF-ERR1] sets error from API message when fetch returns !ok', async () => {
    useAppStore.setState({ tripConfig: MOCK_TRIP_CONFIG })
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'AI generation failed — try again' }),
    } as Response)

    const { result } = renderHook(() => useItineraryDownload())

    await act(async () => {
      await result.current.download()
    })

    expect(result.current.error).toMatch(/AI generation failed/i)
    expect(result.current.loading).toBe(false)
  })

  it('[AC-AITINPDF-F4] triggers download with filename lu-outing-itinerary.pdf on success', async () => {
    useAppStore.setState({ tripConfig: MOCK_TRIP_CONFIG })
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_ITINERARY,
    } as Response)
    mockPdfToBlob.mockResolvedValue(new Blob(['%PDF'], { type: 'application/pdf' }))

    // Mount hook first so React's own appendChild calls don't pollute the spy
    const { result } = renderHook(() => useItineraryDownload())

    // Set up spies AFTER renderHook so mock.calls[0] is the download anchor, not the React root
    const clickSpy = vi.fn()
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((el) => {
      ;(el as HTMLAnchorElement).click = clickSpy
      return el as HTMLElement
    })
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((el) => el as HTMLElement)

    await act(async () => {
      await result.current.download()
    })

    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(clickSpy).toHaveBeenCalled()

    // Verify anchor was configured with the correct download filename
    const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement
    expect(anchor.download).toBe('lu-outing-itinerary.pdf')

    appendSpy.mockRestore()
    removeSpy.mockRestore()
  })
})
