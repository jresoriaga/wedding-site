'use client'
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps'
import { useState, useMemo } from 'react'
import type { Venue, Activity, TripConfig } from '@/app/lib/types'

interface MapViewProps {
  selectedVenues: Venue[]
  selectedActivities: Activity[]
  tripConfig: TripConfig | null
}

// La Union, Philippines — fallback center [AC-GUIDE-E4]
const LA_UNION_CENTER = { lat: 16.6197, lng: 120.3199 }

// [AC-GUIDE-F7, F8, F12, F13, E3, E4, ERR2]
export default function MapView({ selectedVenues, selectedActivities, tripConfig }: MapViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  // [AC-GUIDE-F12] Center on configured stay location, fallback to La Union hardcoded coords
  const center = useMemo(() => {
    if (tripConfig?.stay_lat && tripConfig?.stay_lng) {
      return { lat: tripConfig.stay_lat, lng: tripConfig.stay_lng }
    }
    return LA_UNION_CENTER
  }, [tripConfig])

  const hasAnySelected = selectedVenues.length > 0 || selectedActivities.length > 0

  // [AC-GUIDE-ERR2] Missing API key — existing text fallback
  if (!apiKey) {
    return (
      <div
        data-testid="map-view"
        className="flex flex-col items-center justify-center h-48 gap-3 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center"
      >
        <p className="text-gray-500 font-medium text-sm">
          Map unavailable — add{' '}
          <code className="bg-gray-100 px-1 rounded text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>{' '}
          to <code className="bg-gray-100 px-1 rounded text-xs">.env.local</code>
        </p>
      </div>
    )
  }

  const selectedVenue = selectedId ? selectedVenues.find((v) => v.id === selectedId) : null
  const selectedActivity = selectedId ? selectedActivities.find((a) => a.id === selectedId) : null
  const infoItem = selectedVenue ?? selectedActivity ?? null

  return (
    <div
      data-testid="map-view"
      className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
    >
      <APIProvider apiKey={apiKey}>
        <Map
          mapId="lu-outing-map"
          defaultCenter={center}
          defaultZoom={14}
          style={{ width: '100%', height: '360px' }}
          gestureHandling="greedy"
        >
          {/* [AC-GUIDE-F13] Stay location — red home pin */}
          {tripConfig?.stay_lat && tripConfig?.stay_lng && (
            <AdvancedMarker
              position={{ lat: tripConfig.stay_lat, lng: tripConfig.stay_lng }}
              title="Our Stay"
            >
              <div
                data-testid="stay-pin"
                className="flex flex-col items-center"
                aria-label={`Our stay: ${tripConfig.stay_name}`}
              >
                <div className="w-11 h-11 rounded-full bg-red-500 border-[3px] border-white flex items-center justify-center shadow-xl shadow-red-500/50">
                </div>
                <div className="mt-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-lg whitespace-nowrap">
                  Our Stay
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* [AC-GUIDE-F8] Selected restaurant venue pins */}
          {selectedVenues.map((venue) => (
            <AdvancedMarker
              key={venue.id}
              position={{ lat: venue.lat, lng: venue.lng }}
              title={venue.name}
              onClick={() => setSelectedId(venue.id)}
            >
              <div className="w-10 h-10 rounded-full bg-ocean border-[3px] border-white flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-110">
              </div>
            </AdvancedMarker>
          ))}

          {/* [AC-GUIDE-F8] Selected activity pins */}
          {selectedActivities.map((activity) => (
            <AdvancedMarker
              key={activity.id}
              position={{ lat: activity.lat, lng: activity.lng }}
              title={activity.name}
              onClick={() => setSelectedId(activity.id)}
            >
              <div className="w-10 h-10 rounded-full bg-purple-500 border-[3px] border-white flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-110">
              </div>
            </AdvancedMarker>
          ))}

          {/* Info window for tapped pin */}
          {infoItem && (
            <InfoWindow
              position={{ lat: infoItem.lat, lng: infoItem.lng }}
              onCloseClick={() => setSelectedId(null)}
            >
              <div className="p-1 max-w-[200px]">
                {/* [OWASP:A3] [AC-GUIDE-S2] JSX text only — XSS safe */}
                <p className="font-bold text-gray-800 text-sm">{infoItem.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{infoItem.address}</p>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* [AC-GUIDE-E3] Empty-state overlay when nothing selected */}
      {!hasAnySelected && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-5 py-3 text-center shadow-lg">
            <p className="font-semibold text-gray-700 text-sm">
              Tap cards to pin them here
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

