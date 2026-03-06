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

describe('NavBar', () => {
  it('[AC-ITINPLAN0306-F10] renders navigation links to itinerary, poll, and map', () => {
    render(<NavBar />)
    const links = screen.getAllByRole('link', { name: /itinerary/i })
    expect(links.length).toBeGreaterThan(0)
  })

  it('[AC-ITINPLAN0306-F10] renders poll navigation link', () => {
    render(<NavBar />)
    const links = screen.getAllByRole('link', { name: /poll/i })
    expect(links.length).toBeGreaterThan(0)
  })

  it('[AC-ITINPLAN0306-F10] renders map navigation link', () => {
    render(<NavBar />)
    const links = screen.getAllByRole('link', { name: /map/i })
    expect(links.length).toBeGreaterThan(0)
  })

  it('[AC-ITINPLAN0306-F10] active route has aria-current="page"', () => {
    render(<NavBar />)
    // usePathname mocked to '/itinerary' — itinerary links should be current
    const currentLinks = screen.getAllByRole('link', { name: /itinerary/i })
    const hasAriaCurrentPage = currentLinks.some(
      (link) => link.getAttribute('aria-current') === 'page'
    )
    expect(hasAriaCurrentPage).toBe(true)
  })

  it('[AC-ITINPLAN0306-E6] nav elements have accessible labels', () => {
    render(<NavBar />)
    const navs = screen.getAllByRole('navigation', { name: /main navigation/i })
    expect(navs.length).toBeGreaterThan(0)
  })
})
