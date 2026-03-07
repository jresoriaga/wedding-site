import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Mock @react-pdf/renderer with DOM stubs so RTL can query the output
vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: { children: React.ReactNode }) => <div data-testid="pdf-document">{children}</div>,
  Page: ({ children }: { children: React.ReactNode }) => <div data-testid="pdf-page">{children}</div>,
  Text: ({ children, style }: { children: React.ReactNode; style?: object }) => (
    <span data-style={JSON.stringify(style ?? {})}>{children}</span>
  ),
  View: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  StyleSheet: { create: (s: Record<string, object>) => s },
}))

import ItineraryPDF from '../ItineraryPDF'
import type { GeneratedItinerary, TripConfig } from '@/app/lib/types'

const MOCK_CONFIG: TripConfig = {
  id: 'main',
  trip_name: 'La Union Outing 2026',
  start_date: '2026-04-10',
  end_date: '2026-04-12',
  stay_name: 'Flotsam & Jetsam',
  stay_lat: 16.6596,
  stay_lng: 120.3224,
  updated_by: 'Joef',
  updated_at: '2026-03-07T00:00:00Z',
}

const MOCK_ITINERARY: GeneratedItinerary = {
  days: [
    {
      day: 1,
      date: '2026-04-10',
      items: [
        {
          type: 'meal',
          label: 'Breakfast',
          name: 'El Union Coffee',
          address: 'San Juan, La Union',
          startTime: '8:00 AM',
          duration: '1 hour',
          distanceFromPrev: '—',
          travelNote: '5 min walk from hostel',
        },
        {
          type: 'meal',
          label: 'Lunch',
          name: 'No votes yet',
          address: '',
          startTime: '—',
          duration: '—',
          distanceFromPrev: '—',
          travelNote: '—',
        },
      ],
    },
  ],
}

describe('ItineraryPDF', () => {
  it('[AC-AITINPDF-F6] renders the trip name in the document', () => {
    render(<ItineraryPDF itinerary={MOCK_ITINERARY} tripConfig={MOCK_CONFIG} />)
    expect(screen.getByText(/La Union Outing 2026/i)).toBeDefined()
  })

  it('[AC-AITINPDF-F6] renders the stay location name', () => {
    render(<ItineraryPDF itinerary={MOCK_ITINERARY} tripConfig={MOCK_CONFIG} />)
    expect(screen.getByText(/Flotsam & Jetsam/i)).toBeDefined()
  })

  it('[AC-AITINPDF-F3] renders the venue name with its suggested time', () => {
    render(<ItineraryPDF itinerary={MOCK_ITINERARY} tripConfig={MOCK_CONFIG} />)
    expect(screen.getByText(/El Union Coffee/i)).toBeDefined()
    expect(screen.getByText(/8:00 AM/i)).toBeDefined()
  })

  it('[AC-AITINPDF-F5] renders "No votes yet" for meal slots with no venue', () => {
    render(<ItineraryPDF itinerary={MOCK_ITINERARY} tripConfig={MOCK_CONFIG} />)
    expect(screen.getByText(/No votes yet/i)).toBeDefined()
  })
})
