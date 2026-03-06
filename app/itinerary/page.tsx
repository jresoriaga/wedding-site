'use client'
// [AC-ITINPLAN0306-F3, F4, F5, E2, ERR4]
import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/app/lib/store'
import { RESTAURANTS } from '@/app/lib/restaurants'
import { filterVenues } from '@/app/lib/filterVenues'
import type { Category, Vibe } from '@/app/lib/types'
import CategoryTabs from '@/app/components/CategoryTabs'
import VibeFilter from '@/app/components/VibeFilter'
import RestaurantCard from '@/app/components/RestaurantCard'
import PollSidebar from '@/app/components/PollSidebar'
import SkeletonCard from '@/app/components/SkeletonCard'
import { ErrorBoundary } from '@/app/components/ErrorBoundary'
import { usePollStream } from '@/app/hooks/usePollStream'
import { useVotes } from '@/app/hooks/useVotes'

function ItineraryContent() {
  const router = useRouter()
  const userName = useAppStore((s) => s.userName)
  const pollData = useAppStore((s) => s.pollData)
  const allVotes = useAppStore((s) => s.allVotes)
  const isReconnecting = useAppStore((s) => s.isReconnecting)

  const [activeCategory, setActiveCategory] = useState<Category>('breakfast')
  const [selectedVibes, setSelectedVibes] = useState<Set<Vibe>>(new Set())
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Auth guard — redirect to / if no name [AC-ITINPLAN0306-F1]
  useEffect(() => {
    const saved = localStorage.getItem('lu-outing-name')
    if (!saved && !userName) {
      router.replace('/')
    } else {
      setIsLoading(false)
    }
  }, [userName, router])

  // SSE real-time poll [AC-ITINPLAN0306-F6]
  usePollStream()

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const { selectedVenueIds, toggleVote } = useVotes({ onError: showToast })

  // Build vote count index O(n) — no nested loops [vercel-react-best-practices]
  const voteCountByVenue = useMemo(() => {
    const map: Record<string, number> = {}
    for (const vote of allVotes) {
      map[vote.venue_id] = (map[vote.venue_id] ?? 0) + 1
    }
    return map
  }, [allVotes])

  // Filtered venues — memoized [AC-ITINPLAN0306-F3, F4]
  const filteredVenues = useMemo(
    () => filterVenues(RESTAURANTS, activeCategory, selectedVibes),
    [activeCategory, selectedVibes]
  )

  const handleTabChange = useCallback((cat: Category) => {
    setActiveCategory(cat)
    setSelectedVibes(new Set()) // reset vibe filter on tab switch
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-ocean animate-pulse text-lg">Loading…</div>
      </div>
    )
  }

  return (
    <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-6 max-w-7xl mx-auto px-4 py-6">
      {/* ── Main column ─────────────────────────────────────────────── */}
      <div className="space-y-5">
        {/* Page header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-gray-800">
            Hey {userName ?? 'there'} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Pick where you want to eat for the La Union outing!
          </p>
        </div>

        {/* Category tabs [AC-ITINPLAN0306-F3] */}
        <CategoryTabs active={activeCategory} onChange={handleTabChange} />

        {/* Vibe filter [AC-ITINPLAN0306-F4] */}
        <VibeFilter selected={selectedVibes} onChange={setSelectedVibes} />

        {/* Venue grid */}
        <div
          id={`panel-${activeCategory}`}
          role="tabpanel"
          aria-label={`${activeCategory} venues`}
        >
          {filteredVenues.length === 0 ? (
            /* Empty state [AC-ITINPLAN0306-E2] */
            <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
              <span className="text-5xl mb-4" aria-hidden="true">🌴</span>
              <p className="font-semibold text-gray-600 text-lg">
                No spots match this vibe — try another!
              </p>
              <button
                onClick={() => setSelectedVibes(new Set())}
                className="mt-4 px-4 py-2 text-sm text-ocean font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-ocean rounded-lg"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
              {filteredVenues.map((venue) => (
                <RestaurantCard
                  key={venue.id}
                  venue={venue}
                  selected={selectedVenueIds.has(venue.id)}
                  voteCount={voteCountByVenue[venue.id] ?? 0}
                  onToggle={toggleVote}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Poll sidebar (desktop) ──────────────────────────────────── */}
      <div className="hidden lg:block mt-0 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
        <PollSidebar pollData={pollData} isReconnecting={isReconnecting} />
      </div>

      {/* ── Toast error [AC-ITINPLAN0306-ERR1] ─────────────────────── */}
      {toastMessage && (
        <div
          role="alert"
          aria-live="assertive"
          data-testid="toast-error"
          className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-coral text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium animate-slide-up"
        >
          ⚠️ {toastMessage}
        </div>
      )}
    </div>
  )
}

export default function ItineraryPage() {
  return (
    <ErrorBoundary>
      <ItineraryContent />
    </ErrorBoundary>
  )
}
