'use client'
import type { Venue } from '@/app/lib/types'

interface RestaurantCardProps {
  venue: Venue
  selected: boolean
  voteCount: number
  voterNames?: string[]
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

// [AC-ITINPLAN0306-F5] [WCAG:1.3.1, 2.1.1]
export default function RestaurantCard({
  venue,
  selected,
  voteCount,
  voterNames = [],
  onToggle,
  onInfoClick,
}: RestaurantCardProps) {
  function handleToggle(e: React.MouseEvent | React.KeyboardEvent) {
    // Allow keyboard activation on the card itself
    if ('key' in e && e.key !== 'Enter' && e.key !== ' ') return
    onToggle(venue.id)
  }

  return (
    // Outer div acts as a card container; remove button is a real <button> inside [WCAG:4.1.2]
    <div
      data-testid={`restaurant-card-${venue.id}`}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`${venue.name}${selected ? ', selected — press to remove vote' : ' — press to vote'}`}
      onClick={handleToggle}
      onKeyDown={handleToggle}
      className={`
        w-full text-left rounded-2xl border-2 p-4 transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-ocean focus:ring-offset-2
        active:scale-[0.98] cursor-pointer group relative
        ${selected
          ? 'border-ocean bg-ocean/5 shadow-md shadow-ocean/20'
          : 'border-gray-200 bg-white hover:border-ocean/40 hover:shadow-sm'
        }
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={`font-bold text-base truncate ${selected ? 'text-ocean' : 'text-gray-800'}`}
            >
              {/* [OWASP:A3] JSX renders names as text — no dangerouslySetInnerHTML [AC-ITINPLAN0306-S3] */}
              {venue.name}
            </h3>
          </div>

          <p className="text-gray-500 text-xs mb-2 truncate">
            📍 {venue.address}
          </p>

          {venue.description && (
            <p className="text-gray-600 text-sm leading-snug mb-3 line-clamp-2">
              {venue.description}
            </p>
          )}

          {/* Vibe tags */}
          <div className="flex flex-wrap gap-1.5">
            {venue.vibe.map((v) => (
              <span
                key={v}
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${VIBE_COLORS[v] ?? 'bg-gray-100 text-gray-600'}`}
              >
                {v}
              </span>
            ))}
          </div>
        </div>

        {/* Right side: vote badge or remove button */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          {selected ? (
            /* Explicit remove button [WCAG:2.4.6] */
            <button
              type="button"
              aria-label={`Remove vote for ${venue.name}`}
              onClick={(e) => {
                e.stopPropagation() // prevent card click from re-toggling
                onToggle(venue.id)
              }}
              className="w-10 h-10 rounded-full bg-coral text-white flex items-center justify-center text-lg font-bold shadow-sm shadow-coral/30 hover:bg-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2"
            >
              ✕
            </button>
          ) : (
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                ${voteCount > 0
                  ? 'bg-coral text-white shadow-sm shadow-coral/30'
                  : 'bg-gray-100 text-gray-400'
                }
              `}
              aria-label={`${voteCount} vote${voteCount !== 1 ? 's' : ''}`}
            >
              {voteCount}
            </div>
          )}
          {voterNames.length > 0 && (
            <span className="text-xs text-gray-400" title={voterNames.join(', ')}>
              votes
            </span>
          )}
        </div>
      </div>

      {/* "Tap to vote / tap ✕ to remove" hint */}
      {selected && (
        <p className="text-xs text-ocean/70 mt-2 font-medium">✓ Your vote — tap ✕ to remove</p>
      )}

      {/* See menu link — stopPropagation so the card vote toggle isn't also triggered */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <button
          type="button"
          aria-label={`See menu and details for ${venue.name}`}
          onClick={(e) => {
            e.stopPropagation()
            onInfoClick(venue)
          }}
          className="text-xs font-semibold text-ocean hover:text-ocean/70 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-ocean rounded transition-colors"
        >
          📌 See menu &amp; details
        </button>
      </div>
    </div>
  )
}

