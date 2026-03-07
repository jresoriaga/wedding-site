import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TripConfigModal from '../TripConfigModal'

const MOCK_CONFIG = {
  id: 'main',
  trip_name: 'La Union Outing',
  start_date: '2026-04-10',
  end_date: '2026-04-12',
  stay_name: 'Flotsam & Jetsam Hostel',
  stay_lat: 16.6596,
  stay_lng: 120.3224,
  updated_by: 'Joef',
  updated_at: '2026-03-07T00:00:00Z',
}

describe('TripConfigModal', () => {
  const onSaved = vi.fn()
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  // [AC-TRIPCONFIG-F5] Pre-fill from existing prop
  it('[AC-TRIPCONFIG-F5] pre-fills trip name and stay name when existing config is provided', () => {
    render(<TripConfigModal existing={MOCK_CONFIG} onSaved={onSaved} onClose={onClose} />)
    expect(screen.getByRole('textbox', { name: /trip name/i })).toHaveValue('La Union Outing')
    expect(screen.getByRole('textbox', { name: /stay.*name/i })).toHaveValue('Flotsam & Jetsam Hostel')
  })

  it('[AC-TRIPCONFIG-F5] pre-fills lat and lng when existing config is provided', () => {
    render(<TripConfigModal existing={MOCK_CONFIG} onSaved={onSaved} onClose={onClose} />)
    expect(screen.getByRole('spinbutton', { name: /latitude/i })).toHaveValue(16.6596)
    expect(screen.getByRole('spinbutton', { name: /longitude/i })).toHaveValue(120.3224)
  })

  // [AC-TRIPCONFIG-F2] Correct request headers and method
  it('[AC-TRIPCONFIG-F2] calls PUT /api/trip-config with x-created-by: Joef on submit', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: MOCK_CONFIG }),
    } as Response)

    // Use existing to pre-fill all required fields
    render(<TripConfigModal existing={MOCK_CONFIG} onSaved={onSaved} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/trip-config',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({ 'x-created-by': 'Joef' }),
        })
      )
    })
  })

  it('[AC-TRIPCONFIG-F2] calls onSaved with the returned config after successful submit', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: MOCK_CONFIG }),
    } as Response)

    render(<TripConfigModal existing={MOCK_CONFIG} onSaved={onSaved} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(MOCK_CONFIG))
  })

  // [AC-TRIPCONFIG-ERR1] Server error displayed in modal
  it('[AC-TRIPCONFIG-ERR1] shows server error message when PUT returns error', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'DB constraint violated' }),
    } as Response)

    render(<TripConfigModal existing={MOCK_CONFIG} onSaved={onSaved} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('DB constraint violated')
    })
  })

  it('[AC-TRIPCONFIG-ERR1] shows generic error message on network failure', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'))

    render(<TripConfigModal existing={MOCK_CONFIG} onSaved={onSaved} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('close button calls onClose', () => {
    render(<TripConfigModal existing={null} onSaved={onSaved} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('clicking backdrop calls onClose', () => {
    render(<TripConfigModal existing={null} onSaved={onSaved} onClose={onClose} />)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
