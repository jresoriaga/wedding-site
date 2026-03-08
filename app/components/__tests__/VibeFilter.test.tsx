import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VibeFilter from '../VibeFilter'

const VIBES = ['party', 'casual dining', 'buffet', 'bar', 'café', 'street food']

describe('VibeFilter', () => {
  it('[AC-ITINPLAN0306-F4] renders all vibe chips from props', () => {
    render(<VibeFilter vibes={VIBES} selected={new Set<string>()} onChange={vi.fn()} />)
    expect(screen.getByTestId('vibe-chip-party')).toBeInTheDocument()
    expect(screen.getByTestId('vibe-chip-casual dining')).toBeInTheDocument()
    expect(screen.getByTestId('vibe-chip-buffet')).toBeInTheDocument()
    expect(screen.getByTestId('vibe-chip-bar')).toBeInTheDocument()
    expect(screen.getByTestId('vibe-chip-café')).toBeInTheDocument()
    expect(screen.getByTestId('vibe-chip-street food')).toBeInTheDocument()
  })

  it('[AC-ITINPLAN0306-F4] renders nothing when vibes list is empty', () => {
    const { container } = render(<VibeFilter vibes={[]} selected={new Set<string>()} onChange={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('[AC-ITINPLAN0306-F4] toggling a chip adds it to selected set', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<VibeFilter vibes={VIBES} selected={new Set<string>()} onChange={onChange} />)
    await user.click(screen.getByTestId('vibe-chip-party'))
    expect(onChange).toHaveBeenCalledWith(new Set<string>(['party']))
  })

  it('[AC-ITINPLAN0306-F4] toggling a selected chip removes it from selected set', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<VibeFilter vibes={VIBES} selected={new Set<string>(['party'])} onChange={onChange} />)
    await user.click(screen.getByTestId('vibe-chip-party'))
    expect(onChange).toHaveBeenCalledWith(new Set<string>())
  })

  it('[AC-ITINPLAN0306-F4] selected chips have aria-checked="true"', () => {
    render(<VibeFilter vibes={VIBES} selected={new Set<string>(['café'])} onChange={vi.fn()} />)
    expect(screen.getByTestId('vibe-chip-café')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByTestId('vibe-chip-party')).toHaveAttribute('aria-checked', 'false')
  })

  it('[AC-ITINPLAN0306-E6] chips accessible via group role', () => {
    render(<VibeFilter vibes={VIBES} selected={new Set<string>()} onChange={vi.fn()} />)
    expect(screen.getByRole('group', { name: /vibe filters/i })).toBeInTheDocument()
  })

  it('[AC-ITINPLAN0306-F4] shows activity vibes like beach and nature', () => {
    const activityVibes = ['beach', 'adventure', 'nature', 'sightseeing']
    render(<VibeFilter vibes={activityVibes} selected={new Set<string>()} onChange={vi.fn()} />)
    expect(screen.getByTestId('vibe-chip-beach')).toBeInTheDocument()
    expect(screen.getByTestId('vibe-chip-nature')).toBeInTheDocument()
  })
})
