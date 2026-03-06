import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Venue } from '@/app/lib/types'

// Mock useVenueImages hook
vi.mock('@/app/hooks/useVenueImages', () => ({
  useVenueImages: vi.fn(),
}))

// Mock useAppStore
vi.mock('@/app/lib/store', () => ({
  useAppStore: vi.fn(),
}))

import { useVenueImages } from '@/app/hooks/useVenueImages'
import { useAppStore } from '@/app/lib/store'
import VenueDetailModal from '../VenueDetailModal'

const mockVenue: Venue = {
  id: 'b-01',
  name: 'El Union Coffee',
  category: 'breakfast',
  vibe: ['café'],
  address: 'San Juan, La Union',
  lat: 16.6596395,
  lng: 120.3223696,
  hours: '7:00 AM – 10:00 PM',
  description: 'Great coffee.',
}

const mockImages = [
  { id: '1', image_url: 'https://example.com/img1.jpg', uploaded_by: 'Joef', created_at: '2026-01-01' },
  { id: '2', image_url: 'https://example.com/img2.jpg', uploaded_by: 'Joef', created_at: '2026-01-02' },
  { id: '3', image_url: 'https://example.com/img3.jpg', uploaded_by: 'Joef', created_at: '2026-01-03' },
]

function setupMocks(userName: string | null = null, images = mockImages) {
  vi.mocked(useVenueImages).mockReturnValue({
    images,
    isLoading: false,
    refetch: vi.fn(),
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(useAppStore).mockImplementation((selector: (s: any) => unknown) =>
    selector({ userName })
  )
}

describe('VenueDetailModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('[AC-ITINPLAN0306-F13] renders venue name and hours', () => {
    setupMocks()
    render(<VenueDetailModal venue={mockVenue} onClose={vi.fn()} />)
    expect(screen.getByText('El Union Coffee')).toBeInTheDocument()
    expect(screen.getByText(/7:00 AM/)).toBeInTheDocument()
  })

  it('[AC-ITINPLAN0306-F13] renders carousel with images from useVenueImages', () => {
    setupMocks()
    render(<VenueDetailModal venue={mockVenue} onClose={vi.fn()} />)
    // Should show image count indicator or images
    const images = screen.getAllByRole('img')
    expect(images.length).toBeGreaterThanOrEqual(1)
  })

  it('[AC-ITINPLAN0306-F13] shows prev and next carousel buttons when images exist', () => {
    setupMocks()
    render(<VenueDetailModal venue={mockVenue} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
  })

  it('[AC-ITINPLAN0306-F13] non-Joef user does not see upload button', () => {
    setupMocks('Alice')
    render(<VenueDetailModal venue={mockVenue} onClose={vi.fn()} />)
    expect(screen.queryByText(/upload/i)).not.toBeInTheDocument()
  })

  it('[AC-ITINPLAN0306-F12] Joef sees upload button', () => {
    setupMocks('Joef')
    render(<VenueDetailModal venue={mockVenue} onClose={vi.fn()} />)
    expect(screen.getByText(/upload/i)).toBeInTheDocument()
  })

  it('[AC-ITINPLAN0306-F13] shows empty state when no images', () => {
    setupMocks(null, [])
    render(<VenueDetailModal venue={mockVenue} onClose={vi.fn()} />)
    expect(screen.getByText(/no photos yet/i)).toBeInTheDocument()
  })

  it('[AC-ITINPLAN0306-F13] close button calls onClose', async () => {
    setupMocks()
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<VenueDetailModal venue={mockVenue} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('[AC-ITINPLAN0306-F13] Escape key closes the modal', async () => {
    setupMocks()
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<VenueDetailModal venue={mockVenue} onClose={onClose} />)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })
})
