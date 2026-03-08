'use client'
import type { Activity } from '@/app/lib/types'
import { safeImageUrl } from '@/app/lib/filterVenues'

interface ActivityCardProps {
  activity: Activity
  selected: boolean
  onToggle: (activityId: string) => void
  onInfoClick: (activity: Activity) => void
}

const VIBE_COLORS: Record<string, string> = {
  beach: 'bg-sky-100 text-sky-700',
  adventure: 'bg-orange-100 text-orange-700',
  sightseeing: 'bg-purple-100 text-purple-700',
  leisure: 'bg-green-100 text-green-700',
  nightlife: 'bg-indigo-100 text-indigo-700',
  nature: 'bg-emerald-100 text-emerald-700',
}

const GRADIENT: Record<string, string> = {
  morning: 'from-amber-400 to-orange-500',
  afternoon: 'from-sky-400 to-teal-500',
  evening: 'from-purple-500 to-indigo-600',
}

// [AC-GUIDE-F3, F4, F5, F6] ActivityCard — same mobile-first design as RestaurantCard [AC-ACTIVITIES-F8] [WCAG:1.3.1, 2.1.1]
export default function ActivityCard({ activity, selected, onToggle, onInfoClick }: ActivityCardProps) {
  // [AC-GUIDE-S1] Only render validated https:// image URLs
  const heroSrc = safeImageUrl(activity.imageUrl)

  function handleToggle(e: React.MouseEvent | React.KeyboardEvent) {
    if ('key' in e && e.key !== 'Enter' && e.key !== ' ') return
    onToggle(activity.id)
  }

  return (
    <div
      data-testid={`activity-card-${activity.id}`}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`${activity.name}${selected ? ', selected — press to deselect' : ' — press to select'}`}
      onClick={handleToggle}
      onKeyDown={handleToggle}
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
            alt={activity.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            data-testid="card-image-placeholder"
            className={`w-full h-full bg-gradient-to-br ${GRADIENT[activity.category] ?? 'from-gray-300 to-gray-400'}`}
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

        {/* Category badge */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-semibold">
            {activity.category}
          </span>
        </div>
      </div>

      {/* ── Card body ── */}
      <div className={`p-4 ${selected ? 'bg-ocean/5' : 'bg-white'}`}>
        {/* [OWASP:A3] JSX text — XSS safe [AC-GUIDE-S2] */}
        <h3 className={`font-bold text-base leading-snug mb-1 ${selected ? 'text-ocean' : 'text-gray-800'}`}>
          {activity.name}
        </h3>

        <p className="text-gray-500 text-xs mb-2">{activity.address}</p>

        {activity.hours && (
          <p className="text-gray-400 text-xs mb-2">Hours: {activity.hours}</p>
        )}

        {activity.description && (
          <p className="text-gray-600 text-sm leading-snug mb-3 line-clamp-2">
            {activity.description}
          </p>
        )}

        {/* Vibe tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {activity.vibe.map((v) => (
            <span
              key={v}
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${VIBE_COLORS[v] ?? 'bg-gray-100 text-gray-600'}`}
            >
              {v}
            </span>
          ))}
        </div>

        {/* [AC-GUIDE-F6] More Details — stopPropagation prevents card toggle */}
        <button
          type="button"
          aria-label={`More details about ${activity.name}`}
          onClick={(e) => {
            e.stopPropagation()
            onInfoClick(activity)
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-ocean/30 text-ocean text-sm font-semibold hover:bg-ocean/8 active:bg-ocean/15 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean"
        >
          More Details →
        </button>
      </div>
    </div>
  )
}
