'use client'
// [AC-ITINPLAN0306-F8, E4, ERR3]
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/app/lib/store'
import MapView from '@/app/components/MapView'
import DayTabs from '@/app/components/DayTabs'
import CategoryTabs from '@/app/components/CategoryTabs'
import { usePollStream } from '@/app/hooks/usePollStream'
import type { Category } from '@/app/lib/types'

export default function MapPage() {
  const router = useRouter()
  const userName = useAppStore((s) => s.userName)
  const allVotes = useAppStore((s) => s.allVotes)
  const venues = useAppStore((s) => s.venues)
  const activeDay = useAppStore((s) => s.activeDay)
  const setActiveDay = useAppStore((s) => s.setActiveDay)
  const [activeCategory, setActiveCategory] = useState<Category>('breakfast')

  usePollStream()

  useEffect(() => {
    const saved = localStorage.getItem('lu-outing-name')
    if (!saved && !userName) router.replace('/')
  }, [userName, router])

  const dayPrefix = `d${activeDay}:`

  // Build dynamic venueMap from store (includes admin-added venues)
  const venueMap = useMemo(
    () => Object.fromEntries(venues.map((v) => [v.id, v])),
    [venues]
  )

  // Votes for this day + category only
  const filteredVotes = useMemo(
    () =>
      allVotes.filter((v) => {
        if (!v.venue_id.startsWith(dayPrefix)) return false
        const base = v.venue_id.slice(dayPrefix.length)
        return venueMap[base]?.category === activeCategory
      }),
    [allVotes, dayPrefix, venueMap, activeCategory]
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span aria-hidden="true">🗺️</span> Outing Map
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Voted venues for the selected day and meal — click a pin for details.
        </p>
      </div>

      {/* Day + Category selectors */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3 animate-fade-in">
        <DayTabs active={activeDay} onChange={setActiveDay} />
        <CategoryTabs active={activeCategory} onChange={setActiveCategory} />
      </div>

      {/* Map [AC-ITINPLAN0306-F8] */}
      <div className="animate-fade-in">
        <MapView votes={filteredVotes} venueMap={venueMap} />
      </div>

      {/* Vote summary */}
      {filteredVotes.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-600 mb-1">
            Day {activeDay} {activeCategory} votes:{' '}
            <span className="text-coral font-bold">{filteredVotes.length}</span>
          </p>
          <p className="text-xs text-gray-400">
            Only venues with ≥1 vote show up as map pins.
          </p>
        </div>
      )}
    </div>
  )
}
