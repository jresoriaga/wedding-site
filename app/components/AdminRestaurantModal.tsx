'use client'
import { useState } from 'react'
import type { Category, ActivityCategory, Vibe, ActivityVibe } from '@/app/lib/types'

// [AC-ITINPLAN0306-F14] — Joef-only form to create a restaurant or activity
// [SOLID:SRP] — single responsibility: content item creation form
// [WCAG:1.3.1, 3.3.1, 4.1.3]

interface AdminRestaurantModalProps {
  onCreated: (type: 'restaurant' | 'activity') => void
  onClose: () => void
}

type ItemType = 'restaurant' | 'activity'

const RESTAURANT_VIBES: Vibe[] = ['party', 'casual dining', 'buffet', 'bar', 'café', 'street food']
const ACTIVITY_VIBES: ActivityVibe[] = ['beach', 'adventure', 'sightseeing', 'leisure', 'nightlife', 'nature']

interface FormState {
  name: string
  category: Category | ActivityCategory | ''
  vibe: (Vibe | ActivityVibe)[]
  address: string
  lat: string
  lng: string
  hours: string
  description: string
}

const INITIAL: FormState = {
  name: '', category: '', vibe: [], address: '', lat: '', lng: '', hours: '', description: '',
}

// [OWASP:A3] validated on both client (UX) and server (security)
function validateForm(f: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {}
  if (!f.name.trim()) errors.name = 'Name is required'
  if (!f.category) errors.category = 'Category is required'
  if (!f.address.trim()) errors.address = 'Address is required'
  if (!f.lat.trim() || isNaN(Number(f.lat))) errors.lat = 'Valid latitude is required'
  if (!f.lng.trim() || isNaN(Number(f.lng))) errors.lng = 'Valid longitude is required'
  return errors
}

export default function AdminRestaurantModal({ onCreated, onClose }: AdminRestaurantModalProps) {
  const [itemType, setItemType] = useState<ItemType>('restaurant')
  const [form, setForm] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleTypeChange(type: ItemType) {
    setItemType(type)
    setForm(INITIAL)
    setErrors({})
    setServerError(null)
  }

  function handleField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
  }

  function toggleVibe(v: Vibe | ActivityVibe) {
    setForm((prev) => ({
      ...prev,
      vibe: prev.vibe.includes(v) ? prev.vibe.filter((x) => x !== v) : [...prev.vibe, v],
    }))
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

    const endpoint = itemType === 'restaurant' ? '/api/restaurants' : '/api/activities'

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-created-by': 'Joef', // [AC-ITINPLAN0306-S4]
        },
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category,
          vibe: form.vibe,
          address: form.address.trim(),
          lat: Number(form.lat),
          lng: Number(form.lng),
          hours: form.hours.trim() || undefined,
          description: form.description.trim() || undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        setServerError(json.error ?? `Failed to create ${itemType}`)
        return
      }

      onCreated(itemType)
    } catch {
      setServerError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  const isRestaurant = itemType === 'restaurant'
  const vibes = isRestaurant ? RESTAURANT_VIBES : ACTIVITY_VIBES

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative bg-white w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <h2 id="admin-modal-title" className="text-lg font-bold text-gray-800">
            Add {isRestaurant ? 'Restaurant' : 'Activity'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close form"
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean"
          >
            x
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Type toggle */}
          <div>
            <fieldset>
              <legend className="text-xs font-semibold text-gray-700 mb-1">Type</legend>
              <div className="flex gap-2">
                {(['restaurant', 'activity'] as ItemType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={itemType === type}
                    onClick={() => handleTypeChange(type)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-ocean capitalize ${
                      itemType === type
                        ? 'bg-ocean text-white border-ocean'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-ocean'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          {serverError && (
            <div role="alert" className="text-xs text-coral font-medium bg-coral/10 px-3 py-2 rounded-xl">
              {serverError}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="r-name" className="block text-xs font-semibold text-gray-700 mb-1">
              {isRestaurant ? 'Restaurant' : 'Activity'} Name <span aria-hidden="true" className="text-coral">*</span>
            </label>
            <input
              id="r-name"
              type="text"
              value={form.name}
              onChange={(e) => handleField('name', e.target.value)}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'r-name-err' : undefined}
              className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-ocean ${errors.name ? 'border-coral' : 'border-gray-200'}`}
              placeholder={isRestaurant ? 'El Union Coffee' : 'Surfing at Urbiztondo Beach'}
            />
            {errors.name && <p id="r-name-err" role="alert" className="text-xs text-coral mt-1">{errors.name}</p>}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="r-category" className="block text-xs font-semibold text-gray-700 mb-1">
              Category <span aria-hidden="true" className="text-coral">*</span>
            </label>
            <select
              id="r-category"
              value={form.category}
              onChange={(e) => handleField('category', e.target.value)}
              aria-invalid={!!errors.category}
              className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-ocean ${errors.category ? 'border-coral' : 'border-gray-200'}`}
            >
              <option value="">Select category…</option>
              {isRestaurant ? (
                <>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                </>
              ) : (
                <>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </>
              )}
            </select>
            {errors.category && <p role="alert" className="text-xs text-coral mt-1">{errors.category}</p>}
          </div>

          {/* Vibe */}
          <div>
            <fieldset>
              <legend className="text-xs font-semibold text-gray-700 mb-1">Vibe</legend>
              <div className="flex flex-wrap gap-2">
                {vibes.map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={form.vibe.includes(v)}
                    onClick={() => toggleVibe(v)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-ocean ${
                      form.vibe.includes(v)
                        ? 'bg-ocean text-white border-ocean'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-ocean hover:text-ocean'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="r-address" className="block text-xs font-semibold text-gray-700 mb-1">
              Address <span aria-hidden="true" className="text-coral">*</span>
            </label>
            <input
              id="r-address"
              type="text"
              value={form.address}
              onChange={(e) => handleField('address', e.target.value)}
              aria-invalid={!!errors.address}
              className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-ocean ${errors.address ? 'border-coral' : 'border-gray-200'}`}
              placeholder="Urbiztondo, San Juan, La Union"
            />
            {errors.address && <p role="alert" className="text-xs text-coral mt-1">{errors.address}</p>}
          </div>

          {/* Lat / Lng */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="r-lat" className="block text-xs font-semibold text-gray-700 mb-1">
                Latitude <span aria-hidden="true" className="text-coral">*</span>
              </label>
              <input
                id="r-lat"
                type="number"
                step="any"
                value={form.lat}
                onChange={(e) => handleField('lat', e.target.value)}
                aria-invalid={!!errors.lat}
                className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-ocean ${errors.lat ? 'border-coral' : 'border-gray-200'}`}
                placeholder="16.6596"
              />
              {errors.lat && <p role="alert" className="text-xs text-coral mt-1">{errors.lat}</p>}
            </div>
            <div>
              <label htmlFor="r-lng" className="block text-xs font-semibold text-gray-700 mb-1">
                Longitude <span aria-hidden="true" className="text-coral">*</span>
              </label>
              <input
                id="r-lng"
                type="number"
                step="any"
                value={form.lng}
                onChange={(e) => handleField('lng', e.target.value)}
                aria-invalid={!!errors.lng}
                className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-ocean ${errors.lng ? 'border-coral' : 'border-gray-200'}`}
                placeholder="120.3223"
              />
              {errors.lng && <p role="alert" className="text-xs text-coral mt-1">{errors.lng}</p>}
            </div>
          </div>

          {/* Hours */}
          <div>
            <label htmlFor="r-hours" className="block text-xs font-semibold text-gray-700 mb-1">Hours</label>
            <input
              id="r-hours"
              type="text"
              value={form.hours}
              onChange={(e) => handleField('hours', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ocean"
              placeholder="7:00 AM – 10:00 PM"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="r-desc" className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              id="r-desc"
              value={form.description}
              onChange={(e) => handleField('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ocean resize-none"
              placeholder={isRestaurant ? 'A short description of the restaurant…' : 'A short description of the activity…'}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 pb-1">
            <button
              type="button"
              onClick={onClose}
              aria-label="Cancel"
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              aria-label={`Add ${itemType}`}
              className="flex-1 py-2.5 rounded-xl bg-ocean text-white text-sm font-semibold hover:bg-ocean/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean focus:ring-offset-2 disabled:opacity-60"
            >
              {submitting ? 'Adding...' : `Add ${itemType}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

