import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminRestaurantModal from '../AdminRestaurantModal'

describe('AdminRestaurantModal', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = vi.fn()
  })

  it('[AC-ITINPLAN0306-F14] renders all required form fields', () => {
    render(<AdminRestaurantModal onCreated={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByLabelText(/restaurant name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/latitude/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/longitude/i)).toBeInTheDocument()
  })

  it('[AC-ITINPLAN0306-F14] shows inline error when required fields are missing on submit', async () => {
    const user = userEvent.setup()
    render(<AdminRestaurantModal onCreated={vi.fn()} onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /add restaurant/i }))

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument()
  })

  it('[AC-ITINPLAN0306-F14] calls POST /api/restaurants and onCreated on valid submit', async () => {
    const onCreated = vi.fn()
    const user = userEvent.setup()
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 'x-01', name: 'New Spot' }),
    } as Response)

    render(<AdminRestaurantModal onCreated={onCreated} onClose={vi.fn()} />)

    await user.type(screen.getByLabelText(/restaurant name/i), 'New Spot')
    await user.selectOptions(screen.getByLabelText(/category/i), 'breakfast')
    await user.type(screen.getByLabelText(/address/i), 'La Union')
    await user.type(screen.getByLabelText(/latitude/i), '16.66')
    await user.type(screen.getByLabelText(/longitude/i), '120.32')

    await user.click(screen.getByRole('button', { name: /add restaurant/i }))

    await waitFor(() => expect(onCreated).toHaveBeenCalled())
    expect(fetch).toHaveBeenCalledWith(
      '/api/restaurants',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('[AC-ITINPLAN0306-F14] close button calls onClose', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<AdminRestaurantModal onCreated={vi.fn()} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('[AC-ITINPLAN0306-F14] shows server error message on failed submit', async () => {
    const user = userEvent.setup()
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Database error' }),
    } as Response)

    render(<AdminRestaurantModal onCreated={vi.fn()} onClose={vi.fn()} />)

    await user.type(screen.getByLabelText(/restaurant name/i), 'New Spot')
    await user.selectOptions(screen.getByLabelText(/category/i), 'lunch')
    await user.type(screen.getByLabelText(/address/i), 'La Union')
    await user.type(screen.getByLabelText(/latitude/i), '16.66')
    await user.type(screen.getByLabelText(/longitude/i), '120.32')

    await user.click(screen.getByRole('button', { name: /add restaurant/i }))

    expect(await screen.findByText(/database error/i)).toBeInTheDocument()
  })
})
