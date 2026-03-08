import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RestaurantCard from '../RestaurantCard'
import type { Venue } from '@/app/lib/types'

// [AC-GUIDE-F3, F4, F5, F6, P1, E1, S1, S2, F11]

const mockVenue: Venue = {
  id: 'test-01',
  name: 'Elyu Café',
  category: 'breakfast',
  vibe: ['café', 'casual dining'],
  address: 'San Juan, La Union',
  lat: 16.67,
  lng: 120.32,
  description: 'Great coffee by the beach.',
}

const mockVenueWithImage: Venue = {
  ...mockVenue,
  id: 'test-02',
  imageUrl: 'https://example.com/cafe.jpg',
}

describe('RestaurantCard', () => {
  it('[AC-GUIDE-F3] renders hero image when imageUrl is a valid https URL', () => {
    render(
      <RestaurantCard
        venue={mockVenueWithImage}
        selected={false}
        onToggle={vi.fn()}
        onInfoClick={vi.fn()}
      />
    )
    const img = screen.getByRole('img', { name: /Elyu Café/i })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/cafe.jpg')
  })

  it('[AC-GUIDE-P1] hero image has loading="lazy"', () => {
    render(
      <RestaurantCard
        venue={mockVenueWithImage}
        selected={false}
        onToggle={vi.fn()}
        onInfoClick={vi.fn()}
      />
    )
    expect(screen.getByRole('img', { name: /Elyu Café/i })).toHaveAttribute('loading', 'lazy')
  })

  it('[AC-GUIDE-E1] renders placeholder when imageUrl is absent', () => {
    render(
      <RestaurantCard
        venue={mockVenue}
        selected={false}
        onToggle={vi.fn()}
        onInfoClick={vi.fn()}
      />
    )
    expect(screen.getByTestId('card-image-placeholder')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /Elyu Café/i })).not.toBeInTheDocument()
  })

  it('[AC-GUIDE-S1] renders placeholder when imageUrl is unsafe (non-https)', () => {
    const unsafeVenue: Venue = { ...mockVenue, id: 'test-03', imageUrl: 'javascript:alert(1)' }
    render(
      <RestaurantCard
        venue={unsafeVenue}
        selected={false}
        onToggle={vi.fn()}
        onInfoClick={vi.fn()}
      />
    )
    expect(screen.getByTestId('card-image-placeholder')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('[AC-GUIDE-F5] renders venue name, address, and vibe tags', () => {
    render(
      <RestaurantCard
        venue={mockVenue}
        selected={false}
        onToggle={vi.fn()}
        onInfoClick={vi.fn()}
      />
    )
    expect(screen.getByText('Elyu Café')).toBeInTheDocument()
    expect(screen.getByText(/San Juan/)).toBeInTheDocument()
    expect(screen.getByText('café')).toBeInTheDocument()
    expect(screen.getByText('casual dining')).toBeInTheDocument()
  })

  it('[AC-GUIDE-F5] card click calls onToggle with venue id', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    render(
      <RestaurantCard
        venue={mockVenue}
        selected={false}
        onToggle={onToggle}
        onInfoClick={vi.fn()}
      />
    )
    await user.click(screen.getByTestId('restaurant-card-test-01'))
    expect(onToggle).toHaveBeenCalledWith('test-01')
  })

  it('[AC-GUIDE-F5] selected state sets aria-pressed="true"', () => {
    render(
      <RestaurantCard
        venue={mockVenue}
        selected={true}
        onToggle={vi.fn()}
        onInfoClick={vi.fn()}
      />
    )
    expect(screen.getByTestId('restaurant-card-test-01')).toHaveAttribute('aria-pressed', 'true')
  })

  it('[AC-GUIDE-F11] does not render vote count numbers', () => {
    render(
      <RestaurantCard
        venue={mockVenue}
        selected={false}
        onToggle={vi.fn()}
        onInfoClick={vi.fn()}
      />
    )
    expect(screen.queryByLabelText(/votes/i)).not.toBeInTheDocument()
  })

  it('[AC-GUIDE-F6] More Details button calls onInfoClick without calling onToggle', async () => {
    const onToggle = vi.fn()
    const onInfoClick = vi.fn()
    const user = userEvent.setup()
    render(
      <RestaurantCard
        venue={mockVenue}
        selected={false}
        onToggle={onToggle}
        onInfoClick={onInfoClick}
      />
    )
    await user.click(screen.getByRole('button', { name: /more details about Elyu Café/i }))
    expect(onInfoClick).toHaveBeenCalledWith(mockVenue)
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('[AC-GUIDE-S2] XSS: script tag in name rendered as escaped text, not executed', () => {
    const maliciousVenue: Venue = { ...mockVenue, id: 'test-xss', name: '<script>alert(1)</script>' }
    const { container } = render(
      <RestaurantCard
        venue={maliciousVenue}
        selected={false}
        onToggle={vi.fn()}
        onInfoClick={vi.fn()}
      />
    )
    expect(container.querySelector('script')).toBeNull()
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument()
  })

  it('[AC-GUIDE-F5] data-testid present for resilient selection', () => {
    render(
      <RestaurantCard
        venue={mockVenue}
        selected={false}
        onToggle={vi.fn()}
        onInfoClick={vi.fn()}
      />
    )
    expect(screen.getByTestId('restaurant-card-test-01')).toBeInTheDocument()
  })
})
