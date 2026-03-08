'use client'
import { useState, useEffect } from 'react'
import type { Venue, Activity, TripConfig } from '@/app/lib/types'

// ── Cache utilities ────────────────────────────────────────────────────────────

const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours in ms

interface CacheEntry { dataUrl: string; ts: number }

/** djb2-style hash → stable short key for localStorage */
function hashStr(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

/** Sort-stable cache key based on which IDs and stay coords are selected */
function getCacheKey(venues: Venue[], activities: Activity[], tripConfig: TripConfig | null): string {
  const stay = tripConfig ? `${tripConfig.stay_lat},${tripConfig.stay_lng}` : 'none'
  const rs = [...venues].sort((a, b) => a.id.localeCompare(b.id)).map((v) => v.id).join(',')
  const as_ = [...activities].sort((a, b) => a.id.localeCompare(b.id)).map((a) => a.id).join(',')
  return `map-img-${hashStr(`${stay}|${rs}|${as_}`)}`
}

function readCache(key: string): string | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const entry: CacheEntry = JSON.parse(raw)
    if (Date.now() - entry.ts > CACHE_TTL) { localStorage.removeItem(key); return null }
    return entry.dataUrl
  } catch { return null }
}

function writeCache(key: string, dataUrl: string): void {
  try {
    const entry: CacheEntry = { dataUrl, ts: Date.now() }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch { /* QuotaExceededError — silently skip */ }
}

/** Convert a Blob to a data URL so it can be stored in localStorage */
async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res(reader.result as string)
    reader.onerror = rej
    reader.readAsDataURL(blob)
  })
}

// ── Marker labels (1-9 then A-Z, mirrors API route) ──────────────────────────

function markerLabel(i: number): string {
  return i < 9 ? String(i + 1) : String.fromCodePoint(65 + (i - 9))
}

// ── Component ─────────────────────────────────────────────────────────────────

interface LegendItem { name: string; type: 'restaurant' | 'activity'; label: string }

interface MapImageModalProps {
  selectedVenues: Venue[]
  selectedActivities: Activity[]
  tripConfig: TripConfig | null
  onClose: () => void
}

export default function MapImageModal({
  selectedVenues,
  selectedActivities,
  tripConfig,
  onClose,
}: MapImageModalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)

  // Ordered list mirroring the numbered pins drawn on the map
  const legendItems: LegendItem[] = [
    ...selectedVenues.map((v, i) => ({ name: v.name, type: 'restaurant' as const, label: markerLabel(i) })),
    ...selectedActivities.map((a, i) => ({
      name: a.name,
      type: 'activity' as const,
      label: markerLabel(selectedVenues.length + i),
    })),
  ]

  /**
   * Fetch (or serve from cache). Call with force=true to bypass cache.
   * Defined as a plain async function so the mount effect can call it once
   * with the current closure values without stale-closure issues.
   */
  async function generate(force = false) {
    setLoading(true)
    setError(null)

    const cacheKey = getCacheKey(selectedVenues, selectedActivities, tripConfig)

    if (!force) {
      const cached = readCache(cacheKey)
      if (cached) {
        setImageUrl(cached)
        setFromCache(true)
        setLoading(false)
        return
      }
    }

    setFromCache(false)
    setImageUrl(null)

    try {
      const body = {
        stay: tripConfig
          ? { name: tripConfig.stay_name, lat: tripConfig.stay_lat, lng: tripConfig.stay_lng }
          : null,
        restaurants: selectedVenues.map((v) => ({ name: v.name, lat: v.lat, lng: v.lng })),
        activities: selectedActivities.map((a) => ({ name: a.name, lat: a.lat, lng: a.lng })),
      }

      const res = await fetch('/api/map-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError((json as { error?: string }).error ?? 'Failed to generate map')
        return
      }

      const blob = await res.blob()
      const dataUrl = await blobToDataUrl(blob) // data URL = storable in localStorage
      writeCache(cacheKey, dataUrl)
      setImageUrl(dataUrl)
    } catch {
      setError('Network error — check your connection and try again')
    } finally {
      setLoading(false)
    }
  }

  // Auto-generate once on modal open; stale-closure is intentional here
  useEffect(() => {
    void generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleDownload() {
    if (!imageUrl) return
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = `la-union-map-${new Date().toISOString().slice(0, 10)}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const totalSelected = selectedVenues.length + selectedActivities.length

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="La Union Map Preview"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
    >
      {/* Wider than before (2xl) so the map has room to breathe */}
      <div className="bg-white w-full sm:max-w-2xl max-h-[92dvh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-800">Our La Union Map</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {tripConfig?.stay_name ? `Centred on ${tripConfig.stay_name}` : 'La Union, Philippines'}
              {totalSelected > 0 && ` · ${totalSelected} spot${totalSelected !== 1 ? 's' : ''}`}
              {fromCache && ' · cached'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close map preview"
            className="shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* Map image — square, full width */}
          <div className="relative bg-gray-100 aspect-square w-full">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50">
                <div
                  className="w-10 h-10 rounded-full border-4 border-ocean border-t-transparent animate-spin"
                  aria-label="Generating map"
                />
                <p className="text-sm text-gray-500 font-medium">Generating your map…</p>
                {totalSelected > 0 && (
                  <p className="text-xs text-gray-400">Fetching driving routes for {totalSelected} spot{totalSelected !== 1 ? 's' : ''}</p>
                )}
              </div>
            )}

            {error && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center bg-gray-50">
                <span className="text-4xl" aria-hidden="true">🗺️</span>
                <p className="text-sm text-red-500 font-medium leading-relaxed">{error}</p>
                <button
                  type="button"
                  onClick={() => { void generate(true) }}
                  className="mt-1 px-4 py-2 rounded-xl bg-ocean text-white text-xs font-bold hover:bg-ocean/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean"
                >
                  Try again
                </button>
              </div>
            )}

            {imageUrl && !loading && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt="Generated cartoon map of La Union with selected spots"
                className="w-full h-full object-contain"
                draggable={false}
              />
            )}
          </div>

          {/* Named legend — numbered pins matching the map */}
          {imageUrl && !loading && (
            <div className="px-5 py-4 border-t border-gray-100">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Map Legend</h3>

              {/* Stay */}
              {tripConfig?.stay_name && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-red-500 border-2 border-white shadow text-white text-[10px] font-bold flex items-center justify-center">
                    H
                  </span>
                  <span className="text-sm font-semibold text-gray-800 truncate">{tripConfig.stay_name}</span>
                  <span className="text-[11px] text-gray-400 shrink-0">Our stay</span>
                </div>
              )}

              {/* Restaurants + activities in numbered order */}
              {legendItems.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                  {legendItems.map((item) => (
                    <div key={`${item.type}-${item.label}`} className="flex items-center gap-2 min-w-0">
                      <span
                        className={`shrink-0 w-6 h-6 rounded-full border-2 border-white shadow text-white text-[10px] font-bold flex items-center justify-center ${
                          item.type === 'restaurant' ? 'bg-blue-600' : 'bg-orange-500'
                        }`}
                      >
                        {item.label}
                      </span>
                      <span className="text-sm text-gray-700 truncate">{item.name}</span>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {item.type === 'restaurant' ? 'Rest.' : 'Activity'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {totalSelected === 0 && !loading && !error && (
            <p className="px-5 py-6 text-xs text-gray-400 text-center">
              Add restaurants and activities to your list so they appear as numbered pins on the map.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 flex gap-3 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={() => { void generate(true) }}
            disabled={loading}
            className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean disabled:opacity-50"
          >
            {loading ? 'Generating…' : 'Regenerate'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!imageUrl || loading}
            className="flex-1 py-2.5 rounded-2xl bg-ocean text-white text-sm font-semibold hover:bg-ocean/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Download PNG
          </button>
        </div>
      </div>
    </div>
  )
}
