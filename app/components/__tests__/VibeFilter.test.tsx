import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VibeFilter from '../VibeFilter'
import type { Vibe } from '@/app/lib/types'

describe('VibeFilter', () => {
  it('[AC-ITINPLAN0306-F4] renders all 6 vibe chips', () => {
    render(<VibeFilter selected={new Set<Vibe>()} onChange={vi.fn()} />)
    expect(screen.getByTestId('vibe-chip-party')).toBeInTheDocument()
    expect(screen.getByTestId('vibe-chip-casual dining')).toBeInTheDocument()
    expect(screen.getByTestId('vibe-chip-buffet')).toBeInTheDocument()
    expect(screen.getByTestId('vibe-chip-bar')).toBeInTheDocument()
    expect(screen.getByTestId('vibe-chip-café')).toBeInTheDocument()
    expect(screen.getByTestId('vibe-chip-street food')).toBeInTheDocument()
  })

  it('[AC-ITINPLAN0306-F4] toggling a chip adds it to selected set', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<VibeFilter selected={new Set<Vibe>()} onChange={onChange} />)
    await user.click(screen.getByTestId('vibe-chip-party'))
    expect(onChange).toHaveBeenCalledWith(new Set<Vibe>(['party']))
  })

  it('[AC-ITINPLAN0306-F4] toggling a selected chip removes it from selected set', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<VibeFilter selected={new Set<Vibe>(['party'])} onChange={onChange} />)
    await user.click(screen.getByTestId('vibe-chip-party'))
    expect(onChange).toHaveBeenCalledWith(new Set<Vibe>())
  })

  it('[AC-ITINPLAN0306-F4] selected chips have aria-checked="true"', () => {
    render(<VibeFilter selected={new Set<Vibe>(['café'])} onChange={vi.fn()} />)
    expect(screen.getByTestId('vibe-chip-café')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByTestId('vibe-chip-party')).toHaveAttribute('aria-checked', 'false')
  })

  it('[AC-ITINPLAN0306-E6] chips accessible via group role', () => {
    render(<VibeFilter selected={new Set<Vibe>()} onChange={vi.fn()} />)
    expect(screen.getByRole('group', { name: /vibe filters/i })).toBeInTheDocument()
  })
})
