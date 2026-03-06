import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategoryTabs from '../CategoryTabs'

describe('CategoryTabs', () => {
  it('[AC-ITINPLAN0306-F3] renders all 3 category tabs', () => {
    render(<CategoryTabs active="breakfast" onChange={vi.fn()} />)
    expect(screen.getByTestId('category-tab-breakfast')).toBeInTheDocument()
    expect(screen.getByTestId('category-tab-lunch')).toBeInTheDocument()
    expect(screen.getByTestId('category-tab-dinner')).toBeInTheDocument()
  })

  it('[AC-ITINPLAN0306-F3] active tab has aria-selected="true"', () => {
    render(<CategoryTabs active="lunch" onChange={vi.fn()} />)
    expect(screen.getByTestId('category-tab-lunch')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('category-tab-breakfast')).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByTestId('category-tab-dinner')).toHaveAttribute('aria-selected', 'false')
  })

  it('[AC-ITINPLAN0306-F3] clicking Lunch tab calls onChange with "lunch"', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<CategoryTabs active="breakfast" onChange={onChange} />)
    await user.click(screen.getByTestId('category-tab-lunch'))
    expect(onChange).toHaveBeenCalledWith('lunch')
  })

  it('[AC-ITINPLAN0306-E6] tabs are accessible via role=tablist + role=tab', () => {
    render(<CategoryTabs active="breakfast" onChange={vi.fn()} />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(3)
  })
})
