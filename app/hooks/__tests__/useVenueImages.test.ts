import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useVenueImages } from '../useVenueImages'

describe('useVenueImages', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('[AC-ITINPLAN0306-F13] fetches images for a venue on mount', async () => {
    const mockImages = [
      { id: '1', image_url: 'https://example.com/img1.jpg', uploaded_by: 'Joef', created_at: '2026-01-01' },
    ]
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockImages,
    } as Response)

    const { result } = renderHook(() => useVenueImages('b-01'))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.images).toEqual(mockImages)
    expect(fetch).toHaveBeenCalledWith('/api/restaurants/b-01/images')
  })

  it('[AC-ITINPLAN0306-F13] returns empty array on network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useVenueImages('b-01'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.images).toEqual([])
  })

  it('[AC-ITINPLAN0306-F13] refetch re-loads images', async () => {
    const first = [{ id: '1', image_url: 'https://example.com/img1.jpg', uploaded_by: 'Joef', created_at: '2026-01-01' }]
    const second = [
      ...first,
      { id: '2', image_url: 'https://example.com/img2.jpg', uploaded_by: 'Joef', created_at: '2026-01-02' },
    ]
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => first } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => second } as Response)

    const { result } = renderHook(() => useVenueImages('b-01'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.images).toHaveLength(1)

    result.current.refetch()
    await waitFor(() => expect(result.current.images).toHaveLength(2))
  })
})
