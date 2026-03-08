'use client'
// [AC-GUIDE-F2, F5, F7, F8, F10, F11, F12, F13]
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/app/lib/store'
import { filterVenues, timeOfDayToCategory } from '@/app/lib/filterVenues'
import type { TimeOfDay, Venue, Activity } from '@/app/lib/types'
import CategoryTabs from '@/app/components/CategoryTabs'
import VibeFilter from '@/app/components/VibeFilter'
import RestaurantCard from '@/app/components/RestaurantCard'
import ActivityCard from '@/app/components/ActivityCard'
import MapView from '@/app/components/MapView'
import RenameModal from '@/app/components/RenameModal'
import VenueDetailModal from '@/app/components/VenueDetailModal'
import AdminRestaurantModal from '@/app/components/AdminRestaurantModal'
import AdminEditModal from '@/app/components/AdminEditModal'
import TripConfigModal from '@/app/components/TripConfigModal'
import { useRestaurants } from '@/app/hooks/useRestaurants'
import { useTripConfig } from '@/app/hooks/useTripConfig'
import { useItineraryDownload } from '@/app/hooks/useItineraryDownload'
import { useActivityImages } from '@/app/hooks/useActivityImages'
import { ErrorBoundary } from '@/app/components/ErrorBoundary'

const ACTIVITY_VIBE_COLORS: Record<string, string> = {
  beach: 'bg-sky-100 text-sky-700',
  adventure: 'bg-orange-100 text-orange-700',
  sightseeing: 'bg-purple-100 text-purple-700',
  leisure: 'bg-green-100 text-green-700',
  nightlife: 'bg-indigo-100 text-indigo-700',
  nature: 'bg-emerald-100 text-emerald-700',
}

interface ActivityDetailSheetProps {
  activity: Activity
  isSelected: boolean
  userName: string | null
  onToggle: () => void
  onClose: () => void
  onEdit: () => void
}

function ActivityDetailSheet({ activity, isSelected, userName, onToggle, onClose, onEdit }: ActivityDetailSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const updateActivity = useAppStore((s) => s.updateActivity)
  const isJoef = userName === 'Joef'

  const { images, isLoading: imagesLoading, refetch } = useActivityImages(activity.id)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [settingFeatured, setSettingFeatured] = useState(false)
  const [featuredUrl, setFeaturedUrl] = useState(activity.imageUrl ?? '')

  useEffect(() => { setCurrentIndex(0) }, [activity.id])

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1))
  }, [images.length])

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1))
  }, [images.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, goPrev, goNext])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    setUploadError(null)
    for (const file of files) {
      const formData = new FormData()
      formData.append('uploaded_by', 'Joef')
      formData.append('file', file)
      try {
        const res = await fetch(`/api/activities/${activity.id}/images`, { method: 'POST', body: formData })
        if (!res.ok) { const j = await res.json(); setUploadError(j.error ?? 'Upload failed') }
      } catch { setUploadError('Upload failed — check your connection') }
    }
    setUploading(false)
    e.target.value = ''
    await refetch()
    setCurrentIndex(Math.max(0, images.length - 1))
  }

  async function handleSetFeatured(imageUrl: string) {
    if (imageUrl === featuredUrl || settingFeatured) return
    setSettingFeatured(true)
    try {
      const res = await fetch(`/api/activities/${activity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-created-by': 'Joef' },
        body: JSON.stringify({ imageUrl }),
      })
      if (res.ok) {
        const updated = await res.json()
        setFeaturedUrl(imageUrl)
        updateActivity(updated)
      }
    } catch { /* silent */ }
    setSettingFeatured(false)
  }

  const currentImage = images[currentIndex] ?? null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Details for ${activity.name}`}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white w-full max-h-[85dvh] rounded-t-3xl shadow-2xl flex flex-col animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{activity.category}</span>
              <h2 className="text-lg font-bold text-gray-800 truncate">{activity.name}</h2>
            </div>
            <p className="text-gray-500 text-xs truncate">{activity.address}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isJoef && (
              <button
                type="button"
                onClick={onEdit}
                aria-label="Edit activity"
                className="px-3 py-1.5 rounded-xl border border-ocean/30 text-ocean text-xs font-semibold hover:bg-ocean/10 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean"
              >
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean"
            >
              x
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Meta chips */}
          <div className="flex flex-wrap items-center gap-2">
            {activity.hours && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-ocean/10 text-ocean text-xs font-semibold">
                Hours: {activity.hours}
              </span>
            )}
            {activity.vibe.map((v) => (
              <span key={v} className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${ACTIVITY_VIBE_COLORS[v] ?? 'bg-gray-100 text-gray-600'}`}>{v}</span>
            ))}
          </div>

          {activity.description && (
            <p className="text-gray-700 text-sm leading-relaxed">{activity.description}</p>
          )}

          {/* Photos section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-700 text-sm">
                Photos
                {images.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-gray-400">{currentIndex + 1} / {images.length}</span>
                )}
              </h3>
              {isJoef && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  aria-label="Upload photo"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-ocean text-white hover:bg-ocean/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean focus:ring-offset-2 disabled:opacity-60"
                >
                  {uploading ? '⏳ Uploading…' : '📷 Upload photo'}
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="sr-only" aria-label="Upload activity photo" onChange={handleFileChange} />
            </div>

            {uploadError && (
              <p role="alert" className="text-xs text-coral font-medium mb-2">⚠️ {uploadError}</p>
            )}

            {imagesLoading ? (
              <div className="w-full rounded-2xl bg-gray-100 animate-pulse aspect-[4/3]" aria-label="Loading images" />
            ) : images.length === 0 ? (
              <div className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-10 flex flex-col items-center gap-2 text-gray-400">
                <span className="text-3xl" aria-hidden="true">🖼️</span>
                <span className="text-sm font-medium">No photos yet</span>
                {isJoef && (
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs text-ocean font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-ocean rounded">
                    Tap to add the first photo
                  </button>
                )}
              </div>
            ) : (
              <div className="relative">
                {/* Main slide */}
                <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-[4/3]">
                  {currentImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentImage.image_url} alt={`${activity.name} photo ${currentIndex + 1}`} className="w-full h-full object-cover" />
                  )}
                </div>

                {/* Prev / Next */}
                {images.length > 1 && (
                  <>
                    <button type="button" aria-label="Previous photo" onClick={goPrev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white text-lg leading-none">‹</button>
                    <button type="button" aria-label="Next photo" onClick={goNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white text-lg leading-none">›</button>
                  </>
                )}

                {/* Dot indicators */}
                {images.length > 1 && (
                  <div className="flex justify-center gap-1.5 mt-2" role="tablist" aria-label="Photo indicators">
                    {images.map((img, i) => (
                      <button key={img.id} type="button" role="tab" aria-selected={i === currentIndex} aria-label={`Photo ${i + 1}`} onClick={() => setCurrentIndex(i)}
                        className={`w-2 h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-ocean ${i === currentIndex ? 'bg-ocean scale-125' : 'bg-gray-300 hover:bg-gray-400'}`} />
                    ))}
                  </div>
                )}

                {/* Thumbnail strip with ★ set-featured buttons */}
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <div key={img.id} className="relative flex-shrink-0">
                      <button type="button" aria-label={`View photo ${i + 1}`} onClick={() => setCurrentIndex(i)}
                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-ocean block ${i === currentIndex ? 'border-ocean' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.image_url} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                      {isJoef && (
                        <button
                          type="button"
                          aria-label={img.image_url === featuredUrl ? 'Featured image' : 'Set as featured card image'}
                          aria-pressed={img.image_url === featuredUrl}
                          onClick={() => handleSetFeatured(img.image_url)}
                          disabled={settingFeatured}
                          className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full border border-white flex items-center justify-center text-[9px] font-bold shadow transition-all focus:outline-none focus:ring-2 focus:ring-ocean disabled:opacity-50 ${
                            img.image_url === featuredUrl ? 'bg-ocean text-white' : 'bg-gray-100 text-gray-400 hover:bg-ocean hover:text-white'
                          }`}
                        >
                          ★
                        </button>
                      )}
                    </div>
                  ))}
                  {isJoef && (
                    <button type="button" aria-label="Add more photos" onClick={() => fileInputRef.current?.click()}
                      className="flex-shrink-0 w-14 h-14 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-ocean hover:text-ocean transition-colors focus:outline-none focus:ring-2 focus:ring-ocean text-xl">
                      +
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Google Maps deep link */}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${activity.lat},${activity.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-ocean font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-ocean rounded"
          >
            🗺️ Open in Google Maps
          </a>

          {/* Toggle selection */}
          <button
            type="button"
            onClick={onToggle}
            className={`w-full py-3 rounded-2xl text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-ocean ${
              isSelected ? 'bg-ocean/10 text-ocean border-2 border-ocean' : 'bg-ocean text-white'
            }`}
          >
            {isSelected ? 'On my list - tap to remove' : 'Add to my list'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ItineraryContent() {
  const router = useRouter()
  const userName = useAppStore((s) => s.userName)
  const setUserName = useAppStore((s) => s.setUserName)
  const tripConfig = useAppStore((s) => s.tripConfig)
  const setTripConfig = useAppStore((s) => s.setTripConfig)
  const venues = useAppStore((s) => s.venues)
  const activityVenues = useAppStore((s) => s.activityVenues)
  const setActivityVenues = useAppStore((s) => s.setActivityVenues)
  const selectedVenueIds = useAppStore((s) => s.selectedVenueIds)
  const toggleVenueSelection = useAppStore((s) => s.toggleVenueSelection)
  const selectedActivityIds = useAppStore((s) => s.selectedActivityIds)
  const toggleActivitySelection = useAppStore((s) => s.toggleActivitySelection)

  const [activeTimeOfDay, setActiveTimeOfDay] = useState<TimeOfDay>('morning')
  const [selectedVibes, setSelectedVibes] = useState<Set<string>>(new Set())
  const [visibleCount, setVisibleCount] = useState(10)
  const [showMap, setShowMap] = useState(false)
  const [venueForDetail, setVenueForDetail] = useState<Venue | null>(null)
  const [activityForDetail, setActivityForDetail] = useState<Activity | null>(null)
  const [showRename, setShowRename] = useState(false)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [showTripConfigModal, setShowTripConfigModal] = useState(false)
  const [editItem, setEditItem] = useState<Venue | Activity | null>(null)
  const [editItemType, setEditItemType] = useState<'restaurant' | 'activity'>('restaurant')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useTripConfig()
  const { refetch: refetchRestaurants } = useRestaurants()
  const { download: downloadItinerary, loading: pdfLoading, error: pdfError, setError: setPdfError } = useItineraryDownload()

  // [AC-GUIDE-ERR1] Fetch activities from DB once; static ACTIVITIES fallback already in store
  useEffect(() => {
    fetch('/api/activities')
      .then((r) => r.json())
      .then((json) => {
        const data: Activity[] = Array.isArray(json) ? json : (json.activities ?? [])
        if (data.length > 0) setActivityVenues(data)
      })
      .catch(() => { /* keep static fallback */ })
  }, [setActivityVenues])

  // Auth guard [AC-ITINPLAN0306-F1]
  useEffect(() => {
    if (!userName) router.replace('/')
  }, [userName, router])

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  function handleRenameSuccess(newName: string) {
    setUserName(newName)
    setShowRename(false)
    showToast(`Name changed to "${newName}"`)
  }

  const handleTabChange = useCallback((tod: TimeOfDay) => {
    setActiveTimeOfDay(tod)
    setSelectedVibes(new Set())
    setVisibleCount(10)
  }, [])

  // [AC-GUIDE-F8] All selected items across all time-of-day tabs (for the map)
  const selectedVenues = useMemo(
    () => venues.filter((v) => selectedVenueIds.has(v.id)),
    [venues, selectedVenueIds]
  )
  const selectedActivities = useMemo(
    () => activityVenues.filter((a) => selectedActivityIds.has(a.id)),
    [activityVenues, selectedActivityIds]
  )

  // [AC-GUIDE-F1, F2] Combined feed for the current time-of-day tab
  const restaurantCategory = timeOfDayToCategory(activeTimeOfDay)
  const filteredRestaurants = useMemo(
    () => filterVenues(venues, restaurantCategory, selectedVibes),
    [venues, restaurantCategory, selectedVibes]
  )
  const filteredActivities = useMemo(
    () => {
      const byCategory = activityVenues.filter((a) => a.category === activeTimeOfDay)
      if (selectedVibes.size === 0) return byCategory
      return byCategory.filter((a) => a.vibe.some((v) => selectedVibes.has(v)))
    },
    [activityVenues, activeTimeOfDay, selectedVibes]
  )

  // Unique vibes from all items for the current tab (before vibe filter) [dynamic]
  const availableVibes = useMemo(() => {
    const allRestaurants = filterVenues(venues, restaurantCategory, new Set())
    const allActivities = activityVenues.filter((a) => a.category === activeTimeOfDay)
    const combined = [
      ...allRestaurants.flatMap((r) => r.vibe),
      ...allActivities.flatMap((a) => a.vibe),
    ]
    return [...new Set(combined)].sort((a, b) => a.localeCompare(b))
  }, [venues, restaurantCategory, activityVenues, activeTimeOfDay])

  // Paginated combined feed — restaurants first, then activities [AC-GUIDE-F1]
  const allFeedItems = useMemo<Array<{ kind: 'restaurant'; data: Venue } | { kind: 'activity'; data: Activity }>>(() => [
    ...filteredRestaurants.map((r) => ({ kind: 'restaurant' as const, data: r })),
    ...filteredActivities.map((a) => ({ kind: 'activity' as const, data: a })),
  ], [filteredRestaurants, filteredActivities])
  const visibleItems = allFeedItems.slice(0, visibleCount)
  const hasMore = visibleCount < allFeedItems.length
  const hasItems = allFeedItems.length > 0
  const selectedCount = selectedVenues.length + selectedActivities.length

  if (!userName) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-ocean animate-pulse text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-lg mx-auto px-4 pt-4 pb-32">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Hey {userName}!
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Your La Union guide</p>
          </div>

          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            <div className="flex gap-2">
              {/* [AC-AITINPDF-F1] Download PDF */}
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
                    Generating...
                  </>
                ) : 'Download PDF'}
              </button>
              <button
                type="button"
                onClick={() => setShowRename(true)}
                aria-label="Change your name"
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-500 text-xs font-medium hover:border-ocean hover:text-ocean transition-colors focus:outline-none focus:ring-2 focus:ring-ocean"
              >
                Edit Name
              </button>
            </div>

            {/* [AC-GUIDE-F7] Map toggle with selection count badge */}
            <button
              type="button"
              onClick={() => setShowMap((v) => !v)}
              aria-expanded={showMap}
              aria-controls="inline-map"
              className={`
                relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border
                transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ocean
                ${showMap
                  ? 'border-ocean bg-ocean text-white shadow-sm shadow-ocean/30'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-ocean hover:text-ocean'
                }
              `}
            >
              {showMap ? 'Hide Map' : 'Show Map'}
              {selectedCount > 0 && (
                <span
                  aria-label={`${selectedCount} selected`}
                  className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1 ${
                    showMap ? 'bg-white text-ocean' : 'bg-ocean text-white'
                  }`}
                >
                  {selectedCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* PDF error banner */}
        {pdfError && (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium animate-fade-in"
          >
            <span>Error: {pdfError}</span>
            <button
              type="button"
              onClick={() => setPdfError(null)}
              aria-label="Dismiss error"
              className="text-red-400 hover:text-red-600 text-sm"
            >x</button>
          </div>
        )}

        {/* [AC-GUIDE-F7] Inline map panel */}
        {showMap && (
          <div id="inline-map" className="mb-5 rounded-2xl overflow-hidden animate-fade-in">
            <MapView
              selectedVenues={selectedVenues}
              selectedActivities={selectedActivities}
              tripConfig={tripConfig}
            />
          </div>
        )}

        {/* [AC-GUIDE-F1] Time-of-day tabs */}
        <div className="mb-4">
          <CategoryTabs active={activeTimeOfDay} onChange={handleTabChange} />
        </div>

        {/* Vibe filter — dynamic from current tab's items */}
        <div className="mb-5">
          <VibeFilter vibes={availableVibes} selected={selectedVibes} onChange={(v) => { setSelectedVibes(v); setVisibleCount(10) }} />
        </div>

        {/* Combined card feed — restaurants first, then activities */}
        {hasItems ? (
          <div className="grid grid-cols-1 gap-5 animate-fade-in">
            {visibleItems.map((entry) =>
              entry.kind === 'restaurant' ? (
                <RestaurantCard
                  key={entry.data.id}
                  venue={entry.data}
                  selected={selectedVenueIds.has(entry.data.id)}
                  onToggle={toggleVenueSelection}
                  onInfoClick={setVenueForDetail}
                />
              ) : (
                <ActivityCard
                  key={entry.data.id}
                  activity={entry.data}
                  selected={selectedActivityIds.has(entry.data.id)}
                  onToggle={toggleActivitySelection}
                  onInfoClick={setActivityForDetail}
                />
              )
            )}
            {hasMore && (
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + 10)}
                className="w-full py-3 rounded-2xl border-2 border-ocean/30 text-ocean font-semibold text-sm hover:border-ocean hover:bg-ocean/5 transition-all focus:outline-none focus:ring-2 focus:ring-ocean"
              >
                Load more
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
            <p className="font-semibold text-gray-600 text-lg">Nothing here yet</p>
            <p className="text-gray-400 text-sm mt-1">More spots coming soon!</p>
          </div>
        )}
      </div>

      {/* Toast */}
      {toastMessage && (
        <div
          role="alert"
          aria-live="assertive"
          data-testid="toast-error"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-ocean text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium animate-slide-up"
        >
          {toastMessage}
        </div>
      )}

      {/* Rename modal */}
      {showRename && userName && (
        <RenameModal
          currentName={userName}
          onSuccess={handleRenameSuccess}
          onClose={() => setShowRename(false)}
        />
      )}

      {/* Venue detail modal */}
      {venueForDetail && (
        <VenueDetailModal
          venue={venueForDetail}
          onEdit={() => {
            setEditItem(venueForDetail)
            setEditItemType('restaurant')
            setVenueForDetail(null)
          }}
          onClose={() => setVenueForDetail(null)}
        />
      )}

      {/* Activity detail sheet */}
      {activityForDetail && (
        <ActivityDetailSheet
          activity={activityForDetail}
          isSelected={selectedActivityIds.has(activityForDetail.id)}
          userName={userName}
          onToggle={() => toggleActivitySelection(activityForDetail.id)}
          onClose={() => setActivityForDetail(null)}
          onEdit={() => {
            setEditItem(activityForDetail)
            setEditItemType('activity')
            setActivityForDetail(null)
          }}
        />
      )}

      {/* Joef-only admin FABs */}
      {userName === 'Joef' && (
        <>
          {/* [AC-TRIPCONFIG-F1] Trip config FAB */}
          <button
            type="button"
            onClick={() => setShowTripConfigModal(true)}
            aria-label="Configure trip"
            data-testid="trip-config-fab"
            className="fixed bottom-24 right-[5.5rem] z-40 w-14 h-14 rounded-full bg-sand text-white shadow-xl flex items-center justify-center text-sm font-bold hover:bg-sand/90 transition-all focus:outline-none focus:ring-4 focus:ring-sand/40 active:scale-95"
          >
            Config
          </button>
          <button
            type="button"
            onClick={() => setShowAdminModal(true)}
            aria-label="Add restaurant"
            data-testid="admin-fab"
            className="fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full bg-ocean text-white shadow-xl flex items-center justify-center text-2xl font-bold hover:bg-ocean/90 transition-all focus:outline-none focus:ring-4 focus:ring-ocean/40 active:scale-95"
          >
            +
          </button>
          {showAdminModal && (
            <AdminRestaurantModal
              onCreated={(type) => {
              setShowAdminModal(false)
              if (type === 'activity') {
                fetch('/api/activities')
                  .then((r) => r.json())
                  .then((json) => {
                    const data: Activity[] = Array.isArray(json) ? json : (json.activities ?? [])
                    if (data.length > 0) setActivityVenues(data)
                  })
                  .catch(() => {})
              } else {
                refetchRestaurants()
              }
            }}
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

      {/* Edit modal — restaurant or activity */}
      {editItem && (
        <AdminEditModal
          item={editItem}
          itemType={editItemType}
          onSaved={() => setEditItem(null)}
          onClose={() => setEditItem(null)}
        />
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

