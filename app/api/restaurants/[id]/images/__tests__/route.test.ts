import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/app/lib/supabase', () => ({
  createServerClient: vi.fn(),
}))

import { createServerClient } from '@/app/lib/supabase'
import { GET, POST } from '../route'

const VENUE_ID = 'b-01'

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

function mockSupabaseWithImages(images: unknown[]) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: images, error: null }),
        }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/storage/test.jpg' },
        }),
      }),
    },
  }
}

describe('GET /api/restaurants/[id]/images', () => {
  beforeEach(() => vi.clearAllMocks())

  it('[AC-ITINPLAN0306-F13] returns images for a venue', async () => {
    const mockImages = [
      { id: '1', image_url: 'https://example.com/img1.jpg', uploaded_by: 'Joef', created_at: '2026-01-01' },
    ]
    vi.mocked(createServerClient).mockReturnValue(
      mockSupabaseWithImages(mockImages) as unknown as ReturnType<typeof createServerClient>
    )

    const res = await GET(new Request('http://localhost'), makeParams(VENUE_ID))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual(mockImages)
  })

  it('[AC-ITINPLAN0306-F13] returns empty array when no images', async () => {
    vi.mocked(createServerClient).mockReturnValue(
      mockSupabaseWithImages([]) as unknown as ReturnType<typeof createServerClient>
    )

    const res = await GET(new Request('http://localhost'), makeParams(VENUE_ID))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual([])
  })
})

describe('POST /api/restaurants/[id]/images', () => {
  beforeEach(() => vi.clearAllMocks())

  it('[AC-ITINPLAN0306-S4] returns 403 when uploaded_by is not Joef', async () => {
    const formData = new FormData()
    formData.append('uploaded_by', 'Alice')
    const file = new File(['img'], 'test.jpg', { type: 'image/jpeg' })
    formData.append('file', file)

    const req = new Request('http://localhost', { method: 'POST', body: formData })
    const res = await POST(req, makeParams(VENUE_ID))
    expect(res.status).toBe(403)
  })

  it('[AC-ITINPLAN0306-S5] returns 400 for non-image MIME type', async () => {
    const formData = new FormData()
    formData.append('uploaded_by', 'Joef')
    const file = new File(['not an image'], 'script.exe', { type: 'application/octet-stream' })
    formData.append('file', file)

    const req = new Request('http://localhost', { method: 'POST', body: formData })
    const res = await POST(req, makeParams(VENUE_ID))
    expect(res.status).toBe(400)
  })

  it('[AC-ITINPLAN0306-S5] returns 413 for file over 5 MB', async () => {
    // Mock formData to return a file whose .size exceeds 5 MB — jsdom Uint8Array File size unreliable
    const mockFile = { type: 'image/jpeg', size: 6 * 1024 * 1024, name: 'big.jpg', arrayBuffer: async () => new ArrayBuffer(0) }
    const mockFD = { get: (key: string) => key === 'uploaded_by' ? 'Joef' : mockFile }
    const req = new Request('http://localhost', { method: 'POST', body: '' })
    vi.spyOn(req, 'formData').mockResolvedValue(mockFD as unknown as FormData)

    const res = await POST(req, makeParams(VENUE_ID))
    expect(res.status).toBe(413)
  })

  it('[AC-ITINPLAN0306-F12] uploads image and returns 201 with image_url for Joef', async () => {
    const mockClient = mockSupabaseWithImages([])
    vi.mocked(createServerClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof createServerClient>
    )

    const formData = new FormData()
    formData.append('uploaded_by', 'Joef')
    const file = new File(['img data'], 'food.jpg', { type: 'image/jpeg' })
    formData.append('file', file)

    const req = new Request('http://localhost', { method: 'POST', body: formData })
    const res = await POST(req, makeParams(VENUE_ID))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json).toHaveProperty('image_url')
  })
})
