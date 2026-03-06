'use client'
import type { Vibe } from '@/app/lib/types'

interface VibeFilterProps {
  selected: Set<Vibe>
  onChange: (vibes: Set<Vibe>) => void
}

const ALL_VIBES: { label: string; value: Vibe; emoji: string }[] = [
  { label: 'Party', value: 'party', emoji: '🎉' },
  { label: 'Casual Dining', value: 'casual dining', emoji: '🍽️' },
  { label: 'Buffet', value: 'buffet', emoji: '🥘' },
  { label: 'Bar', value: 'bar', emoji: '🍺' },
  { label: 'Café', value: 'café', emoji: '☕' },
  { label: 'Street Food', value: 'street food', emoji: '🌮' },
]

// [AC-ITINPLAN0306-F4] [WCAG:1.3.1]
export default function VibeFilter({ selected, onChange }: VibeFilterProps) {
  function toggle(vibe: Vibe) {
    const next = new Set(selected)
    if (next.has(vibe)) {
      next.delete(vibe)
    } else {
      next.add(vibe)
    }
    onChange(next)
  }

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Filter by Vibe
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Vibe filters">
        {ALL_VIBES.map(({ label, value, emoji }) => {
          const isSelected = selected.has(value)
          return (
            <button
              key={value}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              data-testid={`vibe-chip-${value}`}
              onClick={() => toggle(value)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                transition-all duration-150 border-2 focus:outline-none focus:ring-2 focus:ring-ocean focus:ring-offset-1
                ${isSelected
                  ? 'bg-coral text-white border-coral shadow-sm shadow-coral/30'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-coral hover:text-coral'
                }
              `}
            >
              <span aria-hidden="true">{emoji}</span>
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
