import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategoryTabs from '../CategoryTabs'

// [AC-GUIDE-F1] CategoryTabs now uses TimeOfDay: morning / afternoon / evening

describe('CategoryTabs', () => {
  it('[AC-GUIDE-F1] renders Morning, Afternoon, Evening tabs', () => {
    render(<CategoryTabs active="morning" onChange={vi.fn()} />)
    expect(screen.getByText('Morning')).toBeInTheDocument()
    expect(screen.getByText('Afternoon')).toBeInTheDocument()
    expect(screen.getByText('Evening')).toBeInTheDocument()
  })

  it('[AC-GUIDE-F1] has data-testid for each tab', () => {
    render(<CategoryTabs active="morning" onChange={vi.fn()} />)
    expect(screen.getByTestId('category-tab-morning')).toBeInTheDocument()
    expect(screen.getByTestId('category-tab-afternoon')).toBeInTheDocument()
    expect(screen.getByTestId('category-tab-evening')).toBeInTheDocument()
  })

  it('[AC-GUIDE-F1] active tab has aria-selected="true"', () => {
    render(<CategoryTabs active="afternoon" onChange={vi.fn()} />)
    expect(screen.getByTestId('category-tab-afternoon')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('category-tab-morning')).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByTestId('category-tab-evening')).toHaveAttribute('aria-selected', 'false')
  })

  it('[AC-GUIDE-F1] clicking Evening calls onChange with "evening"', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<CategoryTabs active="morning" onChange={onChange} />)
    await user.click(screen.getByTestId('category-tab-evening'))
    expect(onChange).toHaveBeenCalledWith('evening')
  })

  it('[AC-GUIDE-F1] clicking Morning calls onChange with "morning"', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<CategoryTabs active="evening" onChange={onChange} />)
    await user.click(screen.getByTestId('category-tab-morning'))
    expect(onChange).toHaveBeenCalledWith('morning')
  })

  it('[AC-GUIDE-F1] tabs are accessible via role=tablist + role=tab', () => {
    render(<CategoryTabs active="morning" onChange={vi.fn()} />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(3)
  })
})
