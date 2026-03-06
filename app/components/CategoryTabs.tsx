'use client'
import type { Category } from '@/app/lib/types'

interface CategoryTabsProps {
  active: Category
  onChange: (category: Category) => void
}

const TABS: { label: string; value: Category; emoji: string }[] = [
  { label: 'Breakfast', value: 'breakfast', emoji: '🌅' },
  { label: 'Lunch', value: 'lunch', emoji: '☀️' },
  { label: 'Dinner', value: 'dinner', emoji: '🌙' },
]

// [AC-ITINPLAN0306-F3] [WCAG:1.3.1, 2.1.1]
export default function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  return (
    <div role="tablist" aria-label="Meal category" className="flex gap-2 p-1 bg-sand/50 rounded-2xl">
      {TABS.map(({ label, value, emoji }) => {
        const isActive = active === value
        return (
          <button
            key={value}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${value}`}
            data-testid={`category-tab-${value}`}
            onClick={() => onChange(value)}
            className={`
              flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-sm font-semibold
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ocean focus:ring-offset-1
              ${isActive
                ? 'bg-ocean text-white shadow-md shadow-ocean/30 scale-[1.02]'
                : 'text-gray-500 hover:bg-white/60 hover:text-ocean'
              }
            `}
          >
            <span className="text-xl" aria-hidden="true">{emoji}</span>
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
