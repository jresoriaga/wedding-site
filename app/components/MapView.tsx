'use client'
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps'
import { useState } from 'react'
import type { Venue, Vote } from '@/app/lib/types'

interface MapViewProps {
  votes: Vote[]
  venueMap: Record<string, Venue>
}

// La Union, Philippines center
const LA_UNION_CENTER = { lat: 16.6197, lng: 120.3199 }

// [AC-ITINPLAN0306-F8, E4, ERR3]
export default function MapView({ votes, venueMap }: MapViewProps) {
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY

  // Build vote count map O(n) — no nested loops [vercel-react-best-practices]
  const voteCountByVenue: Record<string, number> = {}
  const votersByVenue: Record<string, string[]> = {}
  for (const vote of votes) {
    voteCountByVenue[vote.venue_id] = (voteCountByVenue[vote.venue_id] ?? 0) + 1
    votersByVenue[vote.venue_id] = votersByVenue[vote.venue_id] ?? []
    votersByVenue[vote.venue_id].push(vote.voter_name)
  }

  // Only venues with ≥1 vote get a pin [AC-ITINPLAN0306-F8]
  const votedVenues = Object.values(venueMap).filter(
    (v) => (voteCountByVenue[v.id] ?? 0) > 0
  )

  // [AC-ITINPLAN0306-ERR3] Missing API key fallback
  if (!apiKey) {
    return (
      <div
        data-testid="map-view"
        className="flex flex-col items-center justify-center h-64 gap-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center"
      >
        <span className="text-4xl" aria-hidden="true">🗺️</span>
        <p className="text-gray-500 font-medium">
          Map unavailable — check your API key
        </p>
        <p className="text-gray-400 text-xs">
          Set <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_KEY</code> in{' '}
          <code className="bg-gray-100 px-1 rounded">.env.local</code>
        </p>
      </div>
    )
  }

  // [AC-ITINPLAN0306-E4] Zero voted venues
  if (votedVenues.length === 0) {
    return (
      <div
        data-testid="map-view"
        className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
      >
        <APIProvider apiKey={apiKey}>
          <Map
            mapId="lu-outing-map"
            defaultCenter={LA_UNION_CENTER}
            defaultZoom={13}
            style={{ width: '100%', height: '400px' }}
            gestureHandling="greedy"
            disableDefaultUI={false}
          />
        </APIProvider>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 text-center shadow-lg">
            <p className="text-2xl mb-2" aria-hidden="true">📍</p>
            <p className="font-semibold text-gray-700 text-sm">
              Vote on venues to see them on the map
            </p>
          </div>
        </div>
      </div>
    )
  }

  const selectedVenue = selectedVenueId ? venueMap[selectedVenueId] : null

  return (
    <div
      data-testid="map-view"
      className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
    >
      <APIProvider apiKey={apiKey}>
        <Map
          mapId="lu-outing-map"
          defaultCenter={LA_UNION_CENTER}
          defaultZoom={13}
          style={{ width: '100%', height: '500px' }}
          gestureHandling="greedy"
        >
          {votedVenues.map((venue) => (
            <AdvancedMarker
              key={venue.id}
              position={{ lat: venue.lat, lng: venue.lng }}
              title={venue.name}
              onClick={() => setSelectedVenueId(venue.id)}
            >
              <div
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 border-white
                  shadow-lg cursor-pointer transition-transform hover:scale-110
                  ${voteCountByVenue[venue.id] >= 3 ? 'bg-coral' : 'bg-ocean'}
                  text-white font-bold text-sm
                `}
              >
                {voteCountByVenue[venue.id]}
              </div>
            </AdvancedMarker>
          ))}

          {selectedVenue && (
            <InfoWindow
              position={{ lat: selectedVenue.lat, lng: selectedVenue.lng }}
              onCloseClick={() => setSelectedVenueId(null)}
            >
              <div className="p-1 max-w-[200px]">
                <p className="font-bold text-gray-800 text-sm">
                  {/* [OWASP:A3] Rendered via JSX — XSS safe [AC-ITINPLAN0306-S3] */}
                  {selectedVenue.name}
                </p>
                <p className="text-gray-500 text-xs capitalize mt-0.5">
                  {selectedVenue.category} · {selectedVenue.vibe.join(', ')}
                </p>
                <p className="mt-1 font-semibold text-coral text-sm">
                  {voteCountByVenue[selectedVenue.id]} vote{voteCountByVenue[selectedVenue.id] !== 1 ? 's' : ''}
                </p>
                {votersByVenue[selectedVenue.id]?.length > 0 && (
                  <p className="text-gray-400 text-xs mt-0.5">
                    {votersByVenue[selectedVenue.id].join(', ')}
                  </p>
                )}
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  )
}
