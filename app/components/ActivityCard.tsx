'use client'
import type { Activity } from '@/app/lib/types'

interface ActivityCardProps {
  activity: Activity
  selected: boolean
  voteCount: number
  voterNames?: string[]
  onToggle: (activityId: string) => void
}

const VIBE_COLORS: Record<string, string> = {
  beach: 'bg-sky-100 text-sky-700',
  adventure: 'bg-orange-100 text-orange-700',
  sightseeing: 'bg-purple-100 text-purple-700',
  leisure: 'bg-green-100 text-green-700',
  nightlife: 'bg-indigo-100 text-indigo-700',
  nature: 'bg-emerald-100 text-emerald-700',
}

const CATEGORY_EMOJI: Record<string, string> = {
  morning: '🌅',
  afternoon: '☀️',
  evening: '🌙',
}

// [AC-ACTIVITIES-F8] ActivityCard — same interaction model as RestaurantCard [WCAG:1.3.1, 2.1.1]
export default function ActivityCard({
  activity,
  selected,
  voteCount,
  voterNames = [],
  onToggle,
}: ActivityCardProps) {
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
      aria-label={`${activity.name}${selected ? ', selected — press to remove vote' : ' — press to vote'}`}
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
            <span aria-hidden="true">{CATEGORY_EMOJI[activity.category]}</span>
            <h3 className={`font-bold text-base truncate ${selected ? 'text-ocean' : 'text-gray-800'}`}>
              {/* [OWASP:A3] JSX renders text — XSS safe */}
              {activity.name}
            </h3>
          </div>

          <p className="text-gray-500 text-xs mb-2 truncate">
            📍 {activity.address}
          </p>

          {activity.hours && (
            <p className="text-gray-400 text-xs mb-2">
              🕐 {activity.hours}
            </p>
          )}

          {activity.description && (
            <p className="text-gray-600 text-sm leading-snug mb-3 line-clamp-2">
              {activity.description}
            </p>
          )}

          {/* Vibe tags */}
          <div className="flex flex-wrap gap-1.5">
            {activity.vibe.map((v) => (
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
            <button
              type="button"
              aria-label={`Remove vote for ${activity.name}`}
              onClick={(e) => {
                e.stopPropagation()
                onToggle(activity.id)
              }}
              className="w-8 h-8 rounded-full bg-ocean text-white flex items-center justify-center hover:bg-ocean/80 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean focus:ring-offset-1"
            >
              <span aria-hidden="true" className="text-base">✓</span>
            </button>
          ) : (
            <div className="w-8 h-8 rounded-full border-2 border-gray-300 group-hover:border-ocean/60 transition-colors" />
          )}

          {voteCount > 0 && (
            <span
              aria-label={`${voteCount} vote${voteCount !== 1 ? 's' : ''}`}
              className="text-xs font-bold text-ocean"
            >
              {voteCount}
            </span>
          )}
        </div>
      </div>

      {/* Always-visible voter names [same pattern as RestaurantCard] */}
      {voterNames.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            <span className="font-medium text-ocean">{voterNames.join(', ')}</span>
            {' '}voted
          </p>
        </div>
      )}
    </div>
  )
}
