'use client'

interface VibeFilterProps {
  vibes: string[]
  selected: Set<string>
  onChange: (vibes: Set<string>) => void
}

// [AC-ITINPLAN0306-F4] [WCAG:1.3.1]
export default function VibeFilter({ vibes, selected, onChange }: VibeFilterProps) {
  function toggle(vibe: string) {
    const next = new Set(selected)
    if (next.has(vibe)) next.delete(vibe)
    else next.add(vibe)
    onChange(next)
  }

  if (vibes.length === 0) return null

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Filter by Vibe
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Vibe filters">
        {vibes.map((value) => {
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
                flex items-center px-3 py-1.5 rounded-full text-sm font-medium
                transition-all duration-150 border-2 focus:outline-none focus:ring-2 focus:ring-ocean focus:ring-offset-1
                ${isSelected
                  ? 'bg-coral text-white border-coral shadow-sm shadow-coral/30'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-coral hover:text-coral'
                }
              `}
            >
              {value}
            </button>
          )
        })}
      </div>
    </div>
  )
}
