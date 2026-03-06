import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import MapView from '../MapView'
import type { Venue, Vote } from '@/app/lib/types'

// Mock @vis.gl/react-google-maps — spike 2 validates real integration
vi.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Map: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="google-map">{children}</div>
  ),
  AdvancedMarker: ({ children, title }: { children?: React.ReactNode; title?: string }) => (
    <div data-testid={`marker-${title}`} aria-label={title}>{children}</div>
  ),
  InfoWindow: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="info-window">{children}</div>
  ),
}))

const mockVenueMap: Record<string, Venue> = {
  'b-01': {
    id: 'b-01',
    name: 'Elyu Café',
    category: 'breakfast',
    vibe: ['café'],
    address: 'San Juan, La Union',
    lat: 16.67,
    lng: 120.32,
  },
  'l-01': {
    id: 'l-01',
    name: 'Flotsam Bar',
    category: 'lunch',
    vibe: ['bar'],
    address: 'San Juan, La Union',
    lat: 16.67,
    lng: 120.321,
  },
}

describe('MapView', () => {
  beforeEach(() => {
    // Simulate API key present — must match NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', 'test-key')
  })

  it('[AC-ITINPLAN0306-ERR3] shows fallback message when API key is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', '')
    render(<MapView votes={[]} venueMap={mockVenueMap} />)
    expect(screen.getByTestId('map-view')).toBeInTheDocument()
    expect(screen.getByText(/map unavailable/i)).toBeInTheDocument()
  })

  it('[AC-ITINPLAN0306-E4] shows placeholder message when no votes exist', () => {
    render(<MapView votes={[]} venueMap={mockVenueMap} />)
    expect(screen.getByTestId('map-view')).toBeInTheDocument()
    expect(screen.getByText(/vote on venues/i)).toBeInTheDocument()
  })

  it('[AC-ITINPLAN0306-F8] renders map container with votes present', () => {
    // votes now carry day prefix (d1:, d2:, d3:)
    const votes: Vote[] = [
      { id: 'v1', venue_id: 'd1:b-01', voter_name: 'Maria', created_at: '' },
    ]
    render(<MapView votes={votes} venueMap={mockVenueMap} />)
    expect(screen.getByTestId('map-view')).toBeInTheDocument()
  })

  it('[AC-ITINPLAN0306-F8] only renders markers for venues with ≥1 vote', () => {
    const votes: Vote[] = [
      { id: 'v1', venue_id: 'd1:b-01', voter_name: 'Maria', created_at: '' },
    ]
    render(<MapView votes={votes} venueMap={mockVenueMap} />)
    expect(screen.getByTestId('marker-Elyu Café')).toBeInTheDocument()
    // l-01 has 0 votes — no marker
    expect(screen.queryByTestId('marker-Flotsam Bar')).not.toBeInTheDocument()
  })
})
