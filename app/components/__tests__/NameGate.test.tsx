import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NameGate from '../NameGate'

// Mock router (not needed for NameGate — it calls onSuccess, not router directly)
describe('NameGate', () => {
  it('[AC-ITINPLAN0306-F1] renders name input and submit button', () => {
    render(<NameGate onSuccess={vi.fn()} />)
    expect(screen.getByTestId('name-input')).toBeInTheDocument()
    expect(screen.getByTestId('name-submit')).toBeInTheDocument()
  })

  it('[AC-ITINPLAN0306-E1] shows inline error when submitted with empty string', async () => {
    const user = userEvent.setup()
    render(<NameGate onSuccess={vi.fn()} />)
    await user.click(screen.getByTestId('name-submit'))
    expect(screen.getByTestId('name-error')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter your name.')
  })

  it('[AC-ITINPLAN0306-E1] shows inline error for whitespace-only input', async () => {
    const user = userEvent.setup()
    render(<NameGate onSuccess={vi.fn()} />)
    await user.type(screen.getByTestId('name-input'), '   ')
    await user.click(screen.getByTestId('name-submit'))
    expect(screen.getByTestId('name-error')).toBeInTheDocument()
  })

  it('[AC-ITINPLAN0306-S1] shows error for name >50 chars', async () => {
    const user = userEvent.setup()
    render(<NameGate onSuccess={vi.fn()} />)
    await user.type(screen.getByTestId('name-input'), 'A'.repeat(51))
    await user.click(screen.getByTestId('name-submit'))
    expect(screen.getByTestId('name-error')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('50 characters')
  })

  it('[AC-ITINPLAN0306-F2] calls onSuccess with trimmed name for valid input', async () => {
    const onSuccess = vi.fn()
    const user = userEvent.setup()
    render(<NameGate onSuccess={onSuccess} />)
    await user.type(screen.getByTestId('name-input'), '  Maria  ')
    await user.click(screen.getByTestId('name-submit'))
    expect(onSuccess).toHaveBeenCalledWith('Maria')
  })

  it('[AC-ITINPLAN0306-E5] accepts Unicode and emoji names', async () => {
    const onSuccess = vi.fn()
    const user = userEvent.setup()
    render(<NameGate onSuccess={onSuccess} />)
    await user.type(screen.getByTestId('name-input'), 'María 🌊')
    await user.click(screen.getByTestId('name-submit'))
    expect(onSuccess).toHaveBeenCalledWith('María 🌊')
  })

  it('[AC-ITINPLAN0306-E6] input and submit have accessible labels', () => {
    render(<NameGate onSuccess={vi.fn()} />)
    // input has label via htmlFor
    expect(screen.getByLabelText('Your Name')).toBeInTheDocument()
    // button is a submit button
    expect(screen.getByRole('button', { name: /join the planning/i })).toBeInTheDocument()
  })
})
