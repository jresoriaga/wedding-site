'use client'
// [AC-ITINPLAN0306-F3, F4, F5, E2, ERR4]
import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/app/lib/store'
import { filterVenues } from '@/app/lib/filterVenues'
import type { Category, Vibe, Venue } from '@/app/lib/types'
import CategoryTabs from '@/app/components/CategoryTabs'
import DayTabs from '@/app/components/DayTabs'
import VibeFilter from '@/app/components/VibeFilter'
import RestaurantCard from '@/app/components/RestaurantCard'
import PollSidebar from '@/app/components/PollSidebar'
import MapView from '@/app/components/MapView'
import RenameModal from '@/app/components/RenameModal'
import VenueDetailModal from '@/app/components/VenueDetailModal'
import AdminRestaurantModal from '@/app/components/AdminRestaurantModal'
import TripConfigModal from '@/app/components/TripConfigModal'
import { useRestaurants } from '@/app/hooks/useRestaurants'
import { useTripConfig } from '@/app/hooks/useTripConfig'
import { useItineraryDownload } from '@/app/hooks/useItineraryDownload'
import { ErrorBoundary } from '@/app/components/ErrorBoundary'
import { usePollStream } from '@/app/hooks/usePollStream'
import { useVotes } from '@/app/hooks/useVotes'

function ItineraryContent() {
  const router = useRouter()
  const userName = useAppStore((s) => s.userName)
  const setUserName = useAppStore((s) => s.setUserName)
  const pollData = useAppStore((s) => s.pollData)
  const allVotes = useAppStore((s) => s.allVotes)
  const isReconnecting = useAppStore((s) => s.isReconnecting)
  const activeDay = useAppStore((s) => s.activeDay)
  const setActiveDay = useAppStore((s) => s.setActiveDay)

  const [activeCategory, setActiveCategory] = useState<Category>('breakfast')
  const [selectedVibes, setSelectedVibes] = useState<Set<Vibe>>(new Set())
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [showRename, setShowRename] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [venueForDetail, setVenueForDetail] = useState<Venue | null>(null)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [showTripConfigModal, setShowTripConfigModal] = useState(false)
  const tripConfig = useAppStore((s) => s.tripConfig)
  const setTripConfig = useAppStore((s) => s.setTripConfig)

  useTripConfig()

  const { download: downloadItinerary, loading: pdfLoading, error: pdfError, setError: setPdfError } = useItineraryDownload()

  // [AC-ITINPLAN0306-F11] Dynamic restaurants from DB with static fallback
  const { venues, venueMap, refetch: refetchRestaurants } = useRestaurants()

  // Auth guard — redirect effect only; loading is derived from userName directly [AC-ITINPLAN0306-F1]
  useEffect(() => {
    if (!userName) {
      router.replace('/')
    }
  }, [userName, router])

  usePollStream()

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const { isSelected, toggleVote, clearDayVotes, selectedVenueIds } = useVotes({ onError: showToast, day: activeDay })

  const dayPrefix = `d${activeDay}:`

  // Count of the current user's own votes for the active day
  const myDayVoteCount = useMemo(
    () => [...selectedVenueIds].filter((id) => id.startsWith(dayPrefix)).length,
    [selectedVenueIds, dayPrefix]
  )

  const voteCountByVenue = useMemo(() => {
    const map: Record<string, number> = {}
    for (const vote of allVotes) {
      if (!vote.venue_id.startsWith(dayPrefix)) continue
      const base = vote.venue_id.slice(dayPrefix.length)
      map[base] = (map[base] ?? 0) + 1
    }
    return map
  }, [allVotes, dayPrefix])

  // Votes for this day — MapView strips the prefix internally
  const dayVotes = useMemo(
    () => allVotes.filter((v) => v.venue_id.startsWith(dayPrefix)),
    [allVotes, dayPrefix]
  )

  // Votes for this day AND the active category (used for inline map)
  const categoryDayVotes = useMemo(
    () =>
      dayVotes.filter((v) => {
        const base = v.venue_id.slice(dayPrefix.length)
        return venueMap[base]?.category === activeCategory
      }),
    [dayVotes, dayPrefix, venueMap, activeCategory]
  )

  const filteredVenues = useMemo(
    () => filterVenues(venues, activeCategory, selectedVibes),
    [venues, activeCategory, selectedVibes]
  )

  const handleTabChange = useCallback((cat: Category) => {
    setActiveCategory(cat)
    setSelectedVibes(new Set())
  }, [])

  function handleRenameSuccess(newName: string) {
    setUserName(newName)
    setShowRename(false)
    showToast(`Name changed to "${newName}" ✓`)
  }

  if (!userName) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-ocean animate-pulse text-lg">Loading…</div>
      </div>
    )
  }

  return (
    <>
      <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-6 max-w-7xl mx-auto px-4 py-6">
        {/* ── Main column ─────────────────────────────────────────────── */}
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-5 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Hey {userName ?? 'there'} 👋
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Pick where you want to eat — La Union outing!
              </p>
            </div>
            {/* [AC-AITINPDF-F1] Header actions row */}
            <div className="flex-shrink-0 mt-1 flex gap-2">
              {/* [AC-AITINPDF-F1, F2] Download button — visible to all logged-in users */}
              <button
                type="button"
                onClick={() => { setPdfError(null); downloadItinerary() }}
                disabled={pdfLoading}
                aria-label="Download PDF itinerary"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-ocean/30 bg-ocean/5 text-ocean text-xs font-semibold hover:bg-ocean/15 disabled:opacity-60 disabled:cursor-wait transition-colors focus:outline-none focus:ring-2 focus:ring-ocean"
              >
                {pdfLoading ? (
                  <>
                    <span className="inline-block w-3 h-3 rounded-full border-2 border-ocean border-t-transparent animate-spin" aria-hidden="true" />
                    Generating…
                  </>
                ) : '📄 Download Itinerary'}
              </button>
              <button
                type="button"
                onClick={() => setShowRename(true)}
                aria-label="Change your name"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-500 text-xs font-medium hover:border-ocean hover:text-ocean transition-colors focus:outline-none focus:ring-2 focus:ring-ocean"
              >
                ✏️ Rename
              </button>
            </div>
          </div>
          {/* [AC-AITINPDF-E1, ERR1] PDF error banner */}
          {pdfError && (
            <div
              role="alert"
              className="mb-4 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-coral/10 border border-coral/30 text-coral text-xs font-medium animate-fade-in"
            >
              <span>⚠️ {pdfError}</span>
              <button
                type="button"
                onClick={() => setPdfError(null)}
                aria-label="Dismiss error"
                className="ml-2 text-coral/70 hover:text-coral text-sm"
              >✕</button>
            </div>
          )}

          {/* ── Day strip (left) + Content (right) ────────────────────── */}
          <div className="flex gap-4 items-start">
            {/* Vertical day tabs + clear CTA — sticky so always visible while scrolling */}
            <div className="flex-shrink-0 flex flex-col items-center gap-2 sticky top-0 sm:top-16 self-start z-10">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center leading-none">
                Day
              </p>
              <DayTabs active={activeDay} onChange={setActiveDay} orientation="vertical" />

              {/* Clear all my votes for this day */}
              {myDayVoteCount > 0 && (
                <button
                  type="button"
                  onClick={() => clearDayVotes()}
                  aria-label={`Clear all your Day ${activeDay} votes`}
                  title={`Clear ${myDayVoteCount} vote${myDayVoteCount !== 1 ? 's' : ''} for Day ${activeDay}`}
                  className="w-14 flex flex-col items-center gap-0.5 py-2 rounded-xl bg-coral/10 hover:bg-coral/20 text-coral border border-coral/30 transition-colors focus:outline-none focus:ring-2 focus:ring-coral text-center"
                >
                  <span className="text-sm" aria-hidden="true">🗑️</span>
                  <span className="text-[9px] font-bold leading-none">{myDayVoteCount}v</span>
                  <span className="text-[8px] leading-none opacity-80">clear</span>
                </button>
              )}
            </div>

            {/* Right: filters + map + cards */}
            <div className="flex-1 min-w-0">
              {/* ── Sticky controls bar: category + vibes + map button ── */}
              <div className="sticky top-0 sm:top-14 z-20 bg-[#FBE9D0]/95 backdrop-blur-sm -mx-1 px-1 pt-1 pb-3 space-y-3">
                {/* Category tabs */}
                <CategoryTabs active={activeCategory} onChange={handleTabChange} />

                {/* Vibe filter */}
                <VibeFilter selected={selectedVibes} onChange={setSelectedVibes} />

                {/* Map toggle row */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">
                    {filteredVenues.length} spot{filteredVenues.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMap((v) => !v)}
                    aria-expanded={showMap}
                    aria-controls="inline-map"
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                      border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ocean
                      ${showMap
                        ? 'border-ocean bg-ocean text-white shadow-sm shadow-ocean/30'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-ocean hover:text-ocean'
                      }
                    `}
                  >
                    🗺️ {showMap ? 'Hide map' : 'Show map'}
                  </button>
                </div>
              </div>

              {/* ── Scrollable content: map + venue grid ── */}
              <div className="space-y-4">
              {/* Inline map */}
              {showMap && (
                <div id="inline-map" className="animate-fade-in">
                  <MapView votes={categoryDayVotes} venueMap={venueMap} />
                </div>
              )}

              {/* Venue grid [AC-ITINPLAN0306-F3, F4] */}
              <div
                role="tabpanel"
                aria-label={`Day ${activeDay} ${activeCategory} venues`}
              >
                {filteredVenues.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
                    <span className="text-4xl mb-3" aria-hidden="true">🌴</span>
                    <p className="font-semibold text-gray-600">
                      No spots match this vibe — try another!
                    </p>
                    <button
                      onClick={() => setSelectedVibes(new Set())}
                      className="mt-3 px-4 py-2 text-sm text-ocean font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-ocean rounded-lg"
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
                        selected={isSelected(venue.id)}
                        voteCount={voteCountByVenue[venue.id] ?? 0}
                        onToggle={toggleVote}
                        onInfoClick={setVenueForDetail}
                      />
                    ))}
                  </div>
                )}
              </div>
              </div>{/* end scrollable content */}
            </div>
          </div>
        </div>

        {/* ── Poll sidebar (desktop) ──────────────────────────────────── */}
        <div className="hidden lg:block sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
          <PollSidebar pollData={pollData} isReconnecting={isReconnecting} />
        </div>

        {/* ── Toast [AC-ITINPLAN0306-ERR1] ───────────────────────────── */}
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

      {showRename && userName && (
        <RenameModal
          currentName={userName}
          onSuccess={handleRenameSuccess}
          onClose={() => setShowRename(false)}
        />
      )}

      {venueForDetail && (
        <VenueDetailModal
          venue={venueForDetail}
          onClose={() => setVenueForDetail(null)}
        />
      )}

      {/* [AC-ITINPLAN0306-F14] Joef-only: Admin FAB + modal */}
      {userName === 'Joef' && (
        <>
          {/* [AC-TRIPCONFIG-F1] Trip config FAB */}
          <button
            type="button"
            onClick={() => setShowTripConfigModal(true)}
            aria-label="Configure trip"
            data-testid="trip-config-fab"
            className="fixed bottom-6 right-[5.5rem] z-40 w-14 h-14 rounded-full bg-sand text-white shadow-xl flex items-center justify-center text-2xl hover:bg-sand/90 transition-all focus:outline-none focus:ring-4 focus:ring-sand/40 active:scale-95"
          >
            ⚙️
          </button>
          <button
            type="button"
            onClick={() => setShowAdminModal(true)}
            aria-label="Add restaurant"
            data-testid="admin-fab"
            className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-ocean text-white shadow-xl flex items-center justify-center text-2xl hover:bg-ocean/90 transition-all focus:outline-none focus:ring-4 focus:ring-ocean/40 active:scale-95"
          >
            ➕
          </button>
          {showAdminModal && (
            <AdminRestaurantModal
              onCreated={() => { setShowAdminModal(false); refetchRestaurants() }}
              onClose={() => setShowAdminModal(false)}
            />
          )}
          {showTripConfigModal && (
            <TripConfigModal
              existing={tripConfig}
              onSaved={(config) => { setTripConfig(config); setShowTripConfigModal(false) }}
              onClose={() => setShowTripConfigModal(false)}
            />
          )}
        </>
      )}
    </>
  )
}

export default function ItineraryPage() {
  return (
    <ErrorBoundary>
      <ItineraryContent />
    </ErrorBoundary>
  )
}

