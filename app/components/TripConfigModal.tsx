'use client'
import { useState } from 'react'
import type { TripConfig } from '@/app/lib/types'

// [AC-TRIPCONFIG-F1, F2, F5, ERR1] — Joef-only modal to set trip dates + stay location
// [SOLID:SRP] — single responsibility: trip configuration form
// [WCAG:1.3.1, 3.3.1, 4.1.3]

interface TripConfigModalProps {
  existing: TripConfig | null
  onSaved: (config: TripConfig) => void
  onClose: () => void
}

interface FormState {
  trip_name: string
  start_date: string
  end_date: string
  departure_time: string
  arrival_time: string
  stay_name: string
  stay_lat: string
  stay_lng: string
}

function toForm(c: TripConfig | null): FormState {
  if (!c) return { trip_name: '', start_date: '', end_date: '', departure_time: '', arrival_time: '', stay_name: '', stay_lat: '', stay_lng: '' }
  return {
    trip_name: c.trip_name,
    start_date: c.start_date,
    end_date: c.end_date,
    departure_time: c.departure_time ?? '',
    arrival_time: c.arrival_time ?? '',
    stay_name: c.stay_name,
    stay_lat: String(c.stay_lat),
    stay_lng: String(c.stay_lng),
  }
}

// [OWASP:A3] client-side validation for UX; server validates independently for security
function validateForm(f: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {}
  if (!f.trip_name.trim()) errors.trip_name = 'Trip name is required'
  if (f.trip_name.trim().length > 100) errors.trip_name = 'Trip name must be 100 characters or fewer'
  if (!f.start_date) errors.start_date = 'Start date is required'
  if (!f.end_date) errors.end_date = 'End date is required'
  if (f.start_date && f.end_date && new Date(f.start_date) >= new Date(f.end_date)) {
    errors.end_date = 'End date must be after start date'
  }
  if (!f.stay_name.trim()) errors.stay_name = 'Stay location name is required'
  if (f.stay_name.trim().length > 200) errors.stay_name = 'Stay name must be 200 characters or fewer'
  if (!f.stay_lat.trim() || isNaN(Number(f.stay_lat))) errors.stay_lat = 'Valid latitude is required'
  if (!f.stay_lng.trim() || isNaN(Number(f.stay_lng))) errors.stay_lng = 'Valid longitude is required'
  return errors
}

export default function TripConfigModal({ existing, onSaved, onClose }: TripConfigModalProps) {
  const [form, setForm] = useState<FormState>(toForm(existing))
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validateForm(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSubmitting(true)
    setServerError(null)

    try {
      const res = await fetch('/api/trip-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-created-by': 'Joef', // [AC-TRIPCONFIG-S1] — server validates this too
        },
        body: JSON.stringify({
          trip_name: form.trip_name.trim(),
          start_date: form.start_date,
          end_date: form.end_date,
          ...(form.departure_time.trim() ? { departure_time: form.departure_time.trim() } : {}),
          ...(form.arrival_time.trim() ? { arrival_time: form.arrival_time.trim() } : {}),
          stay_name: form.stay_name.trim(),
          stay_lat: Number(form.stay_lat),
          stay_lng: Number(form.stay_lng),
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        setServerError(json.error ?? 'Failed to save trip configuration')
        return
      }
      onSaved(json.data as TripConfig)
    } catch {
      setServerError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trip-config-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative bg-white w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <h2 id="trip-config-modal-title" className="text-lg font-bold text-gray-800">
            ⚙️ Trip Configuration
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* [AC-TRIPCONFIG-ERR1] Server error */}
          {serverError && (
            <div role="alert" className="text-xs text-coral font-medium bg-coral/10 px-3 py-2 rounded-xl">
              ⚠️ {serverError}
            </div>
          )}

          {/* Trip Name */}
          <div>
            <label htmlFor="tc-trip-name" className="block text-xs font-semibold text-gray-700 mb-1">
              Trip Name <span aria-hidden="true" className="text-coral">*</span>
            </label>
            <input
              id="tc-trip-name"
              type="text"
              aria-label="Trip name"
              value={form.trip_name}
              onChange={(e) => handleField('trip_name', e.target.value)}
              maxLength={100}
              aria-invalid={!!errors.trip_name}
              aria-describedby={errors.trip_name ? 'tc-trip-name-err' : undefined}
              className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-ocean ${errors.trip_name ? 'border-coral' : 'border-gray-200'}`}
              placeholder="La Union Summer Outing"
            />
            {errors.trip_name && (
              <p id="tc-trip-name-err" role="alert" className="text-xs text-coral mt-1">{errors.trip_name}</p>
            )}
          </div>

          {/* Dates row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="tc-start-date" className="block text-xs font-semibold text-gray-700 mb-1">
                Start Date (Day 1) <span aria-hidden="true" className="text-coral">*</span>
              </label>
              <input
                id="tc-start-date"
                type="date"
                aria-label="Start date"
                value={form.start_date}
                onChange={(e) => handleField('start_date', e.target.value)}
                aria-invalid={!!errors.start_date}
                className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-ocean ${errors.start_date ? 'border-coral' : 'border-gray-200'}`}
              />
              {errors.start_date && (
                <p role="alert" className="text-xs text-coral mt-1">{errors.start_date}</p>
              )}
            </div>
            <div>
              <label htmlFor="tc-end-date" className="block text-xs font-semibold text-gray-700 mb-1">
                End Date (Day 3) <span aria-hidden="true" className="text-coral">*</span>
              </label>
              <input
                id="tc-end-date"
                type="date"
                aria-label="End date"
                value={form.end_date}
                onChange={(e) => handleField('end_date', e.target.value)}
                aria-invalid={!!errors.end_date}
                className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-ocean ${errors.end_date ? 'border-coral' : 'border-gray-200'}`}
              />
              {errors.end_date && (
                <p role="alert" className="text-xs text-coral mt-1">{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* Bus Schedule — optional [AC-ACTIVITIES-F13] */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="tc-departure-time" className="block text-xs font-semibold text-gray-700 mb-1">
                🚌 Bus Departure (Optional)
              </label>
              <input
                id="tc-departure-time"
                type="text"
                aria-label="Bus departure time from Manila"
                value={form.departure_time}
                onChange={(e) => handleField('departure_time', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ocean"
                placeholder="6:00 AM"
              />
              <p className="text-[10px] text-gray-400 mt-1">Time leaving Manila</p>
            </div>
            <div>
              <label htmlFor="tc-arrival-time" className="block text-xs font-semibold text-gray-700 mb-1">
                📍 Arrival in La Union (Optional)
              </label>
              <input
                id="tc-arrival-time"
                type="text"
                aria-label="Estimated arrival time in La Union"
                value={form.arrival_time}
                onChange={(e) => handleField('arrival_time', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ocean"
                placeholder="12:00 PM"
              />
              <p className="text-[10px] text-gray-400 mt-1">Arrival Day 1 — shapes itinerary</p>
            </div>
          </div>

          {/* Stay Location Name */}
          <div>
            <label htmlFor="tc-stay-name" className="block text-xs font-semibold text-gray-700 mb-1">
              Stay Location Name <span aria-hidden="true" className="text-coral">*</span>
            </label>
            <input
              id="tc-stay-name"
              type="text"
              aria-label="Stay location name"
              value={form.stay_name}
              onChange={(e) => handleField('stay_name', e.target.value)}
              maxLength={200}
              aria-invalid={!!errors.stay_name}
              aria-describedby={errors.stay_name ? 'tc-stay-name-err' : undefined}
              className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-ocean ${errors.stay_name ? 'border-coral' : 'border-gray-200'}`}
              placeholder="Flotsam & Jetsam Hostel"
            />
            {errors.stay_name && (
              <p id="tc-stay-name-err" role="alert" className="text-xs text-coral mt-1">{errors.stay_name}</p>
            )}
          </div>

          {/* Lat / Lng row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="tc-lat" className="block text-xs font-semibold text-gray-700 mb-1">
                Latitude <span aria-hidden="true" className="text-coral">*</span>
              </label>
              <input
                id="tc-lat"
                type="number"
                aria-label="Stay latitude"
                value={form.stay_lat}
                onChange={(e) => handleField('stay_lat', e.target.value)}
                step="any"
                min="-90"
                max="90"
                aria-invalid={!!errors.stay_lat}
                className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-ocean ${errors.stay_lat ? 'border-coral' : 'border-gray-200'}`}
                placeholder="16.6197"
              />
              {errors.stay_lat && (
                <p role="alert" className="text-xs text-coral mt-1">{errors.stay_lat}</p>
              )}
            </div>
            <div>
              <label htmlFor="tc-lng" className="block text-xs font-semibold text-gray-700 mb-1">
                Longitude <span aria-hidden="true" className="text-coral">*</span>
              </label>
              <input
                id="tc-lng"
                type="number"
                aria-label="Stay longitude"
                value={form.stay_lng}
                onChange={(e) => handleField('stay_lng', e.target.value)}
                step="any"
                min="-180"
                max="180"
                aria-invalid={!!errors.stay_lng}
                className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-ocean ${errors.stay_lng ? 'border-coral' : 'border-gray-200'}`}
                placeholder="120.3199"
              />
              {errors.stay_lng && (
                <p role="alert" className="text-xs text-coral mt-1">{errors.stay_lng}</p>
              )}
            </div>
          </div>

          <p className="text-[10px] text-gray-400 leading-relaxed">
            💡 Find coordinates on{' '}
            <span className="font-medium">Google Maps</span> → right-click a location → copy the numbers shown.
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-2 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              aria-label="Save trip configuration"
              className="flex-1 px-4 py-2.5 rounded-xl bg-ocean text-white text-sm font-semibold hover:bg-ocean/90 disabled:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean focus:ring-offset-2"
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
