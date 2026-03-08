import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import MapView from '../MapView'
import type { Venue, Activity, TripConfig } from '@/app/lib/types'

// [AC-GUIDE-F7, F8, F12, F13, E3, E4, ERR2]

// Mock @vis.gl/react-google-maps
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

const mockVenue: Venue = {
  id: 'b-01',
  name: 'Elyu Café',
  category: 'breakfast',
  vibe: ['café'],
  address: 'San Juan, La Union',
  lat: 16.67,
  lng: 120.32,
}

const mockActivity: Activity = {
  id: 'surf-01',
  name: 'Surfing',
  category: 'morning',
  vibe: ['beach'],
  address: 'Urbiztondo, La Union',
  lat: 16.676,
  lng: 120.322,
}

const mockTripConfig: TripConfig = {
  id: 'main',
  trip_name: 'La Union Trip',
  start_date: '2026-04-10',
  end_date: '2026-04-12',
  stay_name: 'The Beach House',
  stay_lat: 16.65,
  stay_lng: 120.31,
  updated_by: 'Joef',
  updated_at: '2026-03-08',
}

describe('MapView', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', 'test-key')
  })

  it('[AC-GUIDE-ERR2] shows fallback message when API key is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', '')
    render(
      <MapView
        selectedVenues={[]}
        selectedActivities={[]}
        tripConfig={null}
      />
    )
    expect(screen.getByTestId('map-view')).toBeInTheDocument()
    expect(screen.getByText(/map unavailable/i)).toBeInTheDocument()
  })

  it('[AC-GUIDE-E3] shows "tap cards" overlay when nothing is selected', () => {
    render(
      <MapView
        selectedVenues={[]}
        selectedActivities={[]}
        tripConfig={null}
      />
    )
    expect(screen.getByTestId('map-view')).toBeInTheDocument()
    expect(screen.getByText(/tap cards to pin them here/i)).toBeInTheDocument()
  })

  it('[AC-GUIDE-F13] renders stay pin when tripConfig is provided', () => {
    render(
      <MapView
        selectedVenues={[]}
        selectedActivities={[]}
        tripConfig={mockTripConfig}
      />
    )
    expect(screen.getByTestId('stay-pin')).toBeInTheDocument()
  })

  it('[AC-GUIDE-E4] does not render stay pin when tripConfig is null', () => {
    render(
      <MapView
        selectedVenues={[]}
        selectedActivities={[]}
        tripConfig={null}
      />
    )
    expect(screen.queryByTestId('stay-pin')).not.toBeInTheDocument()
  })

  it('[AC-GUIDE-F8] renders marker for each selected venue', () => {
    render(
      <MapView
        selectedVenues={[mockVenue]}
        selectedActivities={[]}
        tripConfig={null}
      />
    )
    expect(screen.getByTestId('marker-Elyu Café')).toBeInTheDocument()
  })

  it('[AC-GUIDE-F8] renders marker for each selected activity', () => {
    render(
      <MapView
        selectedVenues={[]}
        selectedActivities={[mockActivity]}
        tripConfig={null}
      />
    )
    expect(screen.getByTestId('marker-Surfing')).toBeInTheDocument()
  })

  it('[AC-GUIDE-F8] renders both venue and activity pins simultaneously', () => {
    render(
      <MapView
        selectedVenues={[mockVenue]}
        selectedActivities={[mockActivity]}
        tripConfig={null}
      />
    )
    expect(screen.getByTestId('marker-Elyu Café')).toBeInTheDocument()
    expect(screen.getByTestId('marker-Surfing')).toBeInTheDocument()
  })

  it('[AC-GUIDE-E3] hides "tap cards" overlay when items are selected', () => {
    render(
      <MapView
        selectedVenues={[mockVenue]}
        selectedActivities={[]}
        tripConfig={null}
      />
    )
    expect(screen.queryByText(/tap cards to pin them here/i)).not.toBeInTheDocument()
  })
})
