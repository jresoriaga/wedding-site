import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import NavBar from '../NavBar'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/itinerary',
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// [AC-GUIDE-F9] NavBar — single guide link only, no Poll or Map
describe('NavBar', () => {
  it('[AC-GUIDE-F9] renders itinerary/guide navigation link', () => {
    render(<NavBar />)
    const links = screen.getAllByRole('link', { name: /itinerary|guide/i })
    expect(links.length).toBeGreaterThan(0)
  })

  it('[AC-GUIDE-F9] does not render Poll navigation link', () => {
    render(<NavBar />)
    expect(screen.queryByText(/^Poll$/i)).not.toBeInTheDocument()
  })

  it('[AC-GUIDE-F9] does not render Map navigation link', () => {
    render(<NavBar />)
    // Only look at nav links — "Map" text should not appear in navigation
    const navLinks = screen.queryAllByRole('link', { name: /map/i })
    expect(navLinks).toHaveLength(0)
  })

  it('[AC-GUIDE-F9] active route has aria-current="page"', () => {
    render(<NavBar />)
    // usePathname mocked to '/itinerary'
    const currentLinks = screen.getAllByRole('link', { name: /itinerary|guide/i })
    const hasAriaCurrentPage = currentLinks.some(
      (link) => link.getAttribute('aria-current') === 'page'
    )
    expect(hasAriaCurrentPage).toBe(true)
  })

  it('[AC-GUIDE-F9] nav elements have accessible labels', () => {
    render(<NavBar />)
    const navs = screen.getAllByRole('navigation', { name: /main navigation/i })
    expect(navs.length).toBeGreaterThan(0)
  })
})
