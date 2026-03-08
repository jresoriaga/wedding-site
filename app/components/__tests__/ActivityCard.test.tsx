import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ActivityCard from '../ActivityCard'
import type { Activity } from '@/app/lib/types'

// [AC-GUIDE-F3, F4, F5, F6, E1, S1, S2, F11] — ActivityCard guide mode

const MOCK_ACTIVITY: Activity = {
  id: 'surf-01',
  name: 'Surfing at San Juan',
  category: 'morning',
  vibe: ['beach', 'adventure'],
  address: 'Urbiztondo, San Juan, La Union',
  lat: 16.6596,
  lng: 120.3224,
  description: 'Catch waves at the famous surf spot.',
  hours: '6:00 AM – 6:00 PM',
}

const MOCK_ACTIVITY_WITH_IMAGE: Activity = {
  ...MOCK_ACTIVITY,
  id: 'surf-02',
  imageUrl: 'https://example.com/surf.jpg',
}

describe('ActivityCard', () => {
  it('[AC-GUIDE-F3] renders hero image when imageUrl is a valid https URL', () => {
    render(
      <ActivityCard
        activity={MOCK_ACTIVITY_WITH_IMAGE}
        selected={false}
        onToggle={vi.fn()}
        onInfoClick={vi.fn()}
      />
    )
    const img = screen.getByRole('img', { name: /Surfing at San Juan/i })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/surf.jpg')
  })

  it('[AC-GUIDE-P1] hero image has loading="lazy"', () => {
    render(
      <ActivityCard
        activity={MOCK_ACTIVITY_WITH_IMAGE}
        selected={false}
        onToggle={vi.fn()}
        onInfoClick={vi.fn()}
      />
    )
    expect(screen.getByRole('img', { name: /Surfing at San Juan/i })).toHaveAttribute('loading', 'lazy')
  })

  it('[AC-GUIDE-E1] renders placeholder when imageUrl is absent', () => {
    render(
      <ActivityCard
        activity={MOCK_ACTIVITY}
        selected={false}
        onToggle={vi.fn()}
        onInfoClick={vi.fn()}
      />
    )
    expect(screen.getByTestId('card-image-placeholder')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /Surfing at San Juan/i })).not.toBeInTheDocument()
  })

  it('[AC-GUIDE-S1] renders placeholder when imageUrl is unsafe (non-https)', () => {
    const unsafeActivity: Activity = { ...MOCK_ACTIVITY, id: 'surf-xss', imageUrl: 'javascript:alert(1)' }
    render(
      <ActivityCard
        activity={unsafeActivity}
        selected={false}
        onToggle={vi.fn()}
        onInfoClick={vi.fn()}
      />
    )
    expect(screen.getByTestId('card-image-placeholder')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('[AC-GUIDE-F5] renders activity name and address', () => {
    render(
      <ActivityCard
        activity={MOCK_ACTIVITY}
        selected={false}
        onToggle={vi.fn()}
        onInfoClick={vi.fn()}
      />
    )
    expect(screen.getByText('Surfing at San Juan')).toBeInTheDocument()
    expect(screen.getByText(/Urbiztondo/)).toBeInTheDocument()
  })

  it('[AC-GUIDE-F5] aria-pressed is false when not selected', () => {
    render(
      <ActivityCard
        activity={MOCK_ACTIVITY}
        selected={false}
        onToggle={vi.fn()}
        onInfoClick={vi.fn()}
      />
    )
    expect(screen.getByTestId('activity-card-surf-01')).toHaveAttribute('aria-pressed', 'false')
  })

  it('[AC-GUIDE-F5] aria-pressed is true when selected', () => {
    render(
      <ActivityCard
        activity={MOCK_ACTIVITY}
        selected={true}
        onToggle={vi.fn()}
        onInfoClick={vi.fn()}
      />
    )
    expect(screen.getByTestId('activity-card-surf-01')).toHaveAttribute('aria-pressed', 'true')
  })

  it('[AC-GUIDE-F5] calls onToggle with activity id when clicked', () => {
    const onToggle = vi.fn()
    render(
      <ActivityCard
        activity={MOCK_ACTIVITY}
        selected={false}
        onToggle={onToggle}
        onInfoClick={vi.fn()}
      />
    )
    fireEvent.click(screen.getByTestId('activity-card-surf-01'))
    expect(onToggle).toHaveBeenCalledWith('surf-01')
  })

  it('[AC-GUIDE-F11] does not render vote count numbers', () => {
    render(
      <ActivityCard
        activity={MOCK_ACTIVITY}
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
      <ActivityCard
        activity={MOCK_ACTIVITY}
        selected={false}
        onToggle={onToggle}
        onInfoClick={onInfoClick}
      />
    )
    await user.click(screen.getByRole('button', { name: /more details about Surfing at San Juan/i }))
    expect(onInfoClick).toHaveBeenCalledWith(MOCK_ACTIVITY)
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('[AC-GUIDE-F5] keyboard Enter triggers onToggle', () => {
    const onToggle = vi.fn()
    render(
      <ActivityCard
        activity={MOCK_ACTIVITY}
        selected={false}
        onToggle={onToggle}
        onInfoClick={vi.fn()}
      />
    )
    fireEvent.keyDown(screen.getByTestId('activity-card-surf-01'), { key: 'Enter' })
    expect(onToggle).toHaveBeenCalledWith('surf-01')
  })

  it('[AC-GUIDE-S2] XSS: script in name is escaped text only', () => {
    const bad: Activity = { ...MOCK_ACTIVITY, id: 'surf-xss2', name: '<script>alert(1)</script>' }
    const { container } = render(
      <ActivityCard
        activity={bad}
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
      <ActivityCard
        activity={MOCK_ACTIVITY}
        selected={false}
        onToggle={vi.fn()}
        onInfoClick={vi.fn()}
      />
    )
    expect(screen.getByTestId('activity-card-surf-01')).toBeInTheDocument()
  })
})
