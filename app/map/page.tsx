'use client'
// [AC-ITINPLAN0306-F8, E4, ERR3]
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/app/lib/store'
import { VENUE_MAP } from '@/app/lib/restaurants'
import MapView from '@/app/components/MapView'
import { usePollStream } from '@/app/hooks/usePollStream'

export default function MapPage() {
  const router = useRouter()
  const userName = useAppStore((s) => s.userName)
  const allVotes = useAppStore((s) => s.allVotes)

  usePollStream()

  useEffect(() => {
    const saved = localStorage.getItem('lu-outing-name')
    if (!saved && !userName) router.replace('/')
  }, [userName, router])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span aria-hidden="true">🗺️</span> Outing Map
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          All voted venues pinned on the La Union map — click a pin for details.
        </p>
      </div>

      {/* Map [AC-ITINPLAN0306-F8] */}
      <div className="animate-fade-in">
        <MapView votes={allVotes} venueMap={VENUE_MAP} />
      </div>

      {/* Vote summary below map */}
      {allVotes.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-600 mb-1">
            Total votes cast: <span className="text-coral font-bold">{allVotes.length}</span>
          </p>
          <p className="text-xs text-gray-400">
            Only venues with ≥1 vote show up as map pins.
          </p>
        </div>
      )}
    </div>
  )
}
