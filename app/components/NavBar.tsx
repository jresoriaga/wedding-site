'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/itinerary', label: 'Itinerary', emoji: '🍽️' },
  { href: '/poll', label: 'Poll', emoji: '📊' },
  { href: '/map', label: 'Map', emoji: '🗺️' },
]

// [AC-ITINPLAN0306-F10] Mobile-first responsive nav [WCAG:1.3.1, 2.1.1, 2.4.7]
export default function NavBar() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop top nav */}
      <nav
        aria-label="Main navigation"
        className="hidden sm:flex fixed top-0 left-0 right-0 z-50 bg-ocean/95 backdrop-blur-md border-b border-ocean/20 px-6 py-3 items-center justify-between shadow-md"
      >
        <Link href="/itinerary" className="flex items-center gap-2 text-white font-bold text-lg">
          <span aria-hidden="true">🌊</span>
          <span>LU Outing</span>
        </Link>
        <div className="flex items-center gap-1" role="menubar">
          {NAV_ITEMS.map(({ href, label, emoji }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                role="menuitem"
                aria-current={isActive ? 'page' : undefined}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                  transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 focus:ring-offset-ocean
                  ${isActive
                    ? 'bg-white/20 text-white'
                    : 'text-sky-200 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <span aria-hidden="true">{emoji}</span>
                {label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Main navigation"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 py-2 flex items-center shadow-xl"
      >
        {NAV_ITEMS.map(({ href, label, emoji }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={`
                flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-xs font-semibold
                transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ocean focus:ring-offset-1
                ${isActive ? 'text-ocean' : 'text-gray-400 hover:text-ocean'}
              `}
            >
              <span className="text-xl" aria-hidden="true">{emoji}</span>
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
