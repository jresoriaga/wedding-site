'use client'
import type { TimeOfDay } from '@/app/lib/types'

interface CategoryTabsProps {
  active: TimeOfDay
  onChange: (tod: TimeOfDay) => void
}

const TABS: { label: string; value: TimeOfDay }[] = [
  { label: 'Morning', value: 'morning' },
  { label: 'Afternoon', value: 'afternoon' },
  { label: 'Evening', value: 'evening' },
]

// [AC-GUIDE-F1] Time-of-day filter — unified restaurant + activity guide [WCAG:1.3.1, 2.1.1]
export default function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  return (
    <div role="tablist" aria-label="Time of day" className="flex gap-1.5 p-1 bg-gray-100/80 rounded-2xl">
      {TABS.map(({ label, value }) => {
        const isActive = active === value
        return (
          <button
            key={value}
            role="tab"
            aria-selected={isActive}
            data-testid={`category-tab-${value}`}
            onClick={() => onChange(value)}
            className={`
              flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-sm font-semibold
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ocean focus:ring-offset-1
              ${isActive
                ? 'bg-white text-ocean shadow-md scale-[1.02]'
                : 'text-gray-500 hover:bg-white/60 hover:text-ocean'
              }
            `}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
