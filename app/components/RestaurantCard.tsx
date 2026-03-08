'use client'
import type { Venue } from '@/app/lib/types'
import { safeImageUrl } from '@/app/lib/filterVenues'

interface RestaurantCardProps {
  venue: Venue
  selected: boolean
  onToggle: (venueId: string) => void
  onInfoClick: (venue: Venue) => void
}

const VIBE_COLORS: Record<string, string> = {
  'party': 'bg-purple-100 text-purple-700',
  'casual dining': 'bg-green-100 text-green-700',
  'buffet': 'bg-amber-100 text-amber-700',
  'bar': 'bg-blue-100 text-blue-700',
  'café': 'bg-orange-100 text-orange-700',
  'street food': 'bg-red-100 text-red-700',
}

const GRADIENT: Record<string, string> = {
  breakfast: 'from-amber-400 to-orange-500',
  lunch: 'from-sky-400 to-teal-500',
  dinner: 'from-purple-500 to-indigo-600',
}

// [AC-GUIDE-F3, F4, F5, F6] Mobile-first restaurant card with hero image [WCAG:1.3.1, 2.1.1]
export default function RestaurantCard({ venue, selected, onToggle, onInfoClick }: RestaurantCardProps) {
  // [AC-GUIDE-S1] Only render validated https:// image URLs
  const heroSrc = safeImageUrl(venue.imageUrl)

  function handleCardClick(e: React.MouseEvent | React.KeyboardEvent) {
    if ('key' in e && e.key !== 'Enter' && e.key !== ' ') return
    onToggle(venue.id)
  }

  return (
    <div
      data-testid={`restaurant-card-${venue.id}`}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`${venue.name}${selected ? ', selected — press to deselect' : ' — press to select'}`}
      onClick={handleCardClick}
      onKeyDown={handleCardClick}
      className={`
        w-full text-left rounded-2xl overflow-hidden border-2 transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-ocean focus:ring-offset-2
        active:scale-[0.98] cursor-pointer
        ${selected
          ? 'border-ocean shadow-lg shadow-ocean/20'
          : 'border-gray-200 bg-white hover:border-ocean/40 hover:shadow-md'
        }
      `}
    >
      {/* ── Hero image or gradient placeholder [AC-GUIDE-F3, F4, E1] ── */}
      <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
        {heroSrc ? (
          <img
            src={heroSrc}
            alt={venue.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            data-testid="card-image-placeholder"
            className={`w-full h-full bg-gradient-to-br ${GRADIENT[venue.category] ?? 'from-gray-300 to-gray-400'}`}
          />
        )}

        {/* Selected checkmark overlay */}
        {selected && (
          <div
            aria-hidden="true"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-ocean text-white flex items-center justify-center text-lg font-bold shadow-lg shadow-ocean/40 border-2 border-white"
          >
            ✓
          </div>
        )}

        {/* Time-of-day badge */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-semibold">
            {venue.category}
          </span>
        </div>
      </div>

      {/* ── Card body ── */}
      <div className={`p-4 ${selected ? 'bg-ocean/5' : 'bg-white'}`}>
        {/* [OWASP:A3] JSX renders text — XSS safe [AC-GUIDE-S2] */}
        <h3 className={`font-bold text-base leading-snug mb-1 ${selected ? 'text-ocean' : 'text-gray-800'}`}>
          {venue.name}
        </h3>

        <p className="text-gray-500 text-xs mb-2">{venue.address}</p>

        {venue.hours && (
          <p className="text-gray-400 text-xs mb-2">Hours: {venue.hours}</p>
        )}

        {venue.description && (
          <p className="text-gray-600 text-sm leading-snug mb-3 line-clamp-2">
            {venue.description}
          </p>
        )}

        {/* Vibe tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {venue.vibe.map((v) => (
            <span
              key={v}
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${VIBE_COLORS[v] ?? 'bg-gray-100 text-gray-600'}`}
            >
              {v}
            </span>
          ))}
        </div>

        {/* [AC-GUIDE-F6] More Details button — stopPropagation prevents card toggle */}
        <button
          type="button"
          aria-label={`More details about ${venue.name}`}
          onClick={(e) => {
            e.stopPropagation()
            onInfoClick(venue)
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-ocean/30 text-ocean text-sm font-semibold hover:bg-ocean/8 active:bg-ocean/15 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean"
        >
          More Details →
        </button>
      </div>
    </div>
  )
}

