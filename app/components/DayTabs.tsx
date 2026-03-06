'use client'
import type { Day } from '@/app/lib/types'

interface DayTabsProps {
  active: Day
  onChange: (day: Day) => void
  orientation?: 'horizontal' | 'vertical'
}

const DAYS: { day: Day; emoji: string; sub: string }[] = [
  { day: 1, emoji: '🌅', sub: 'Arrival' },
  { day: 2, emoji: '☀️', sub: 'Full Day' },
  { day: 3, emoji: '🌊', sub: 'Last Day' },
]

// [WCAG:1.3.1, 2.1.1]
export default function DayTabs({ active, onChange, orientation = 'horizontal' }: DayTabsProps) {
  if (orientation === 'vertical') {
    return (
      <div
        role="tablist"
        aria-label="Select day"
        className="flex flex-col gap-1"
      >
        {DAYS.map(({ day, emoji, sub }) => {
          const isActive = active === day
          return (
            <button
              key={day}
              role="tab"
              aria-selected={isActive}
              data-testid={`day-tab-${day}`}
              onClick={() => onChange(day)}
              className={`
                relative flex flex-col items-center justify-center gap-0.5 w-14 py-3 rounded-xl
                font-semibold text-xs transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-ocean focus:ring-offset-2
                ${isActive
                  ? 'bg-ocean text-white shadow-md shadow-ocean/30'
                  : 'bg-gray-100 text-gray-500 hover:bg-ocean/10 hover:text-ocean'
                }
              `}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-2 bottom-2 w-0.5 bg-white/60 rounded-full"
                  aria-hidden="true"
                />
              )}
              <span className="text-base leading-none" aria-hidden="true">{emoji}</span>
              <span className="font-bold leading-none">D{day}</span>
              <span className={`text-[9px] leading-none font-normal ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                {sub}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  // Horizontal (used on poll page)
  return (
    <div
      role="tablist"
      aria-label="Select day"
      className="flex gap-2"
    >
      {DAYS.map(({ day, emoji, sub }) => {
        const isActive = active === day
        return (
          <button
            key={day}
            role="tab"
            aria-selected={isActive}
            data-testid={`day-tab-${day}`}
            onClick={() => onChange(day)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-semibold text-sm
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ocean focus:ring-offset-2
              ${isActive
                ? 'border-ocean bg-ocean text-white shadow-md shadow-ocean/30'
                : 'border-gray-200 bg-white text-gray-600 hover:border-ocean/40 hover:bg-ocean/5'
              }
            `}
          >
            <span aria-hidden="true">{emoji}</span>
            <span>Day {day}</span>
            <span className={`text-xs font-normal hidden sm:inline ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
              · {sub}
            </span>
          </button>
        )
      })}
    </div>
  )
}
