import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PollSidebar from '../PollSidebar'
import type { PollData } from '@/app/lib/types'

const emptyPollData: PollData = {
  breakfast: [],
  lunch: [],
  dinner: [],
}

describe('PollSidebar', () => {
  it('[AC-ITINPLAN0306-F6] renders poll container with data-testid', () => {
    render(<PollSidebar pollData={emptyPollData} isReconnecting={false} />)
    expect(screen.getByTestId('poll-sidebar')).toBeInTheDocument()
  })

  it('[AC-ITINPLAN0306-F7] renders all 3 category sections', () => {
    render(<PollSidebar pollData={emptyPollData} isReconnecting={false} />)
    expect(screen.getByRole('heading', { name: /breakfast/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /lunch/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /dinner/i })).toBeInTheDocument()
  })

  it('[AC-ITINPLAN0306-ERR2] shows reconnecting indicator when isReconnecting=true', () => {
    render(<PollSidebar pollData={emptyPollData} isReconnecting={true} />)
    expect(screen.getByTestId('reconnecting-indicator')).toBeInTheDocument()
    expect(screen.getByTestId('reconnecting-indicator')).toHaveTextContent(/reconnecting/i)
  })

  it('[AC-ITINPLAN0306-ERR2] hides reconnecting indicator when isReconnecting=false', () => {
    render(<PollSidebar pollData={emptyPollData} isReconnecting={false} />)
    expect(screen.queryByTestId('reconnecting-indicator')).not.toBeInTheDocument()
  })

  it('shows skeleton when pollData is null', () => {
    render(<PollSidebar pollData={null} isReconnecting={false} />)
    // No category headings should appear while loading
    expect(screen.queryByRole('heading', { name: /breakfast/i })).not.toBeInTheDocument()
  })
})
