'use client'
import { useRef, useState } from 'react'
import type { Venue, Activity, Category, ActivityCategory, Vibe, ActivityVibe } from '@/app/lib/types'
import { useVenueImages } from '@/app/hooks/useVenueImages'
import { useActivityImages } from '@/app/hooks/useActivityImages'
import { useAppStore } from '@/app/lib/store'

// [AC-ITINPLAN0306-F14] — Joef-only edit form for restaurants and activities
// [OWASP:A1] admin gate enforced server-side on save

interface AdminEditModalProps {
  item: Venue | Activity
  itemType: 'restaurant' | 'activity'
  onSaved: () => void
  onClose: () => void
}

const RESTAURANT_VIBES: Vibe[] = ['party', 'casual dining', 'buffet', 'bar', 'café', 'street food']
const ACTIVITY_VIBES: ActivityVibe[] = ['beach', 'adventure', 'sightseeing', 'leisure', 'nightlife', 'nature']

interface FormState {
  name: string
  category: string
  vibe: string[]
  address: string
  lat: string
  lng: string
  hours: string
  description: string
  imageUrl: string
}

function toForm(item: Venue | Activity): FormState {
  return {
    name: item.name ?? '',
    category: item.category ?? '',
    vibe: item.vibe ?? [],
    address: item.address ?? '',
    lat: String(item.lat ?? ''),
    lng: String(item.lng ?? ''),
    hours: item.hours ?? '',
    description: item.description ?? '',
    imageUrl: item.imageUrl ?? '',
  }
}

// [OWASP:A3] client-side validation mirrors server whitelist
function validate(f: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {}
  if (!f.name.trim()) errors.name = 'Name is required'
  if (!f.address.trim()) errors.address = 'Address is required'
  if (!f.lat.trim() || Number.isNaN(Number(f.lat))) errors.lat = 'Valid latitude is required'
  if (!f.lng.trim() || Number.isNaN(Number(f.lng))) errors.lng = 'Valid longitude is required'
  return errors
}

// Sub-component: gallery of uploaded images for an activity — click to set as featured
function ActivityImageGallery({
  activityId,
  selectedUrl,
  onSelect,
}: {
  activityId: string
  selectedUrl: string
  onSelect: (url: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { images, isLoading, refetch } = useActivityImages(activityId)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    setUploadError(null)
    for (const file of files) {
      const fd = new FormData()
      fd.append('uploaded_by', 'Joef')
      fd.append('file', file)
      try {
        const res = await fetch(`/api/activities/${activityId}/images`, { method: 'POST', body: fd })
        if (!res.ok) {
          const j = await res.json()
          setUploadError(j.error ?? 'Upload failed')
        }
      } catch {
        setUploadError('Upload failed — check your connection')
      }
    }
    setUploading(false)
    e.target.value = ''
    await refetch()
  }

  return (
    <div>
      <p className="text-xs font-semibold text-gray-700 mb-2">
        Featured Image{' '}
        <span className="font-normal text-gray-500">(click a photo to set as card hero)</span>
      </p>
      {isLoading ? (
        <p className="text-xs text-gray-400">Loading images…</p>
      ) : images.length === 0 ? (
        <p className="text-xs text-gray-400">No photos yet — upload below.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {images.map((img) => {
            const isSel = img.image_url === selectedUrl
            return (
              <button
                key={img.id}
                type="button"
                aria-label={isSel ? 'Selected as featured' : 'Set as featured image'}
                aria-pressed={isSel}
                onClick={() => onSelect(img.image_url)}
                className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-ocean flex-shrink-0 ${
                  isSel ? 'border-ocean shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                {isSel && (
                  <span className="absolute inset-0 flex items-center justify-center bg-ocean/30">
                    <span className="text-white text-lg font-bold drop-shadow">✓</span>
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Upload more */}
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="mt-2 px-3 py-1.5 rounded-xl border border-dashed border-gray-300 text-xs text-gray-500 hover:border-ocean hover:text-ocean transition-colors focus:outline-none focus:ring-2 focus:ring-ocean disabled:opacity-50"
      >
        {uploading ? 'Uploading…' : 'Upload photos'}
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      {uploadError && <p role="alert" className="text-xs text-coral mt-1">{uploadError}</p>}
    </div>
  )
}

// Sub-component: gallery of uploaded images for a restaurant — click to set as featured
function RestaurantImageGallery({
  venueId,
  selectedUrl,
  onSelect,
}: {
  venueId: string
  selectedUrl: string
  onSelect: (url: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { images, isLoading, refetch } = useVenueImages(venueId)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    setUploadError(null)
    for (const file of files) {
      const fd = new FormData()
      fd.append('uploaded_by', 'Joef')
      fd.append('file', file)
      try {
        const res = await fetch(`/api/restaurants/${venueId}/images`, { method: 'POST', body: fd })
        if (!res.ok) {
          const j = await res.json()
          setUploadError(j.error ?? 'Upload failed')
        }
      } catch {
        setUploadError('Upload failed — check your connection')
      }
    }
    setUploading(false)
    e.target.value = ''
    await refetch()
  }

  return (
    <div>
      <p className="text-xs font-semibold text-gray-700 mb-2">
        Featured Image{' '}
        <span className="font-normal text-gray-500">(click a photo to set as card hero)</span>
      </p>
      {isLoading ? (
        <p className="text-xs text-gray-400">Loading images…</p>
      ) : images.length === 0 ? (
        <p className="text-xs text-gray-400">No photos yet — upload below.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {images.map((img) => {
            const isSel = img.image_url === selectedUrl
            return (
              <button
                key={img.id}
                type="button"
                aria-label={isSel ? 'Selected as featured' : 'Set as featured image'}
                aria-pressed={isSel}
                onClick={() => onSelect(img.image_url)}
                className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-ocean flex-shrink-0 ${
                  isSel ? 'border-ocean shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                {isSel && (
                  <span className="absolute inset-0 flex items-center justify-center bg-ocean/30">
                    <span className="text-white text-lg font-bold drop-shadow">✓</span>
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Upload more */}
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="mt-2 px-3 py-1.5 rounded-xl border border-dashed border-gray-300 text-xs text-gray-500 hover:border-ocean hover:text-ocean transition-colors focus:outline-none focus:ring-2 focus:ring-ocean disabled:opacity-50"
      >
        {uploading ? 'Uploading…' : 'Upload photos'}
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      {uploadError && <p role="alert" className="text-xs text-coral mt-1">{uploadError}</p>}
    </div>
  )
}

export default function AdminEditModal({ item, itemType, onSaved, onClose }: AdminEditModalProps) {
  const updateVenue = useAppStore((s) => s.updateVenue)
  const updateActivity = useAppStore((s) => s.updateActivity)

  const [form, setForm] = useState<FormState>(() => toForm(item))
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isRestaurant = itemType === 'restaurant'
  const vibes = isRestaurant ? RESTAURANT_VIBES : ACTIVITY_VIBES

  function handleField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
  }

  function toggleVibe(v: string) {
    setForm((prev) => ({
      ...prev,
      vibe: prev.vibe.includes(v) ? prev.vibe.filter((x) => x !== v) : [...prev.vibe, v],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSubmitting(true)
    setServerError(null)

    const endpoint = isRestaurant ? `/api/restaurants/${item.id}` : `/api/activities/${item.id}`

    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-created-by': 'Joef', // [OWASP:A1] server validates this
        },
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category || undefined,
          vibe: form.vibe,
          address: form.address.trim(),
          lat: Number(form.lat),
          lng: Number(form.lng),
          hours: form.hours.trim() || undefined,
          description: form.description.trim() || undefined,
          imageUrl: form.imageUrl.trim() || undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        setServerError(json.error ?? `Failed to update ${itemType}`)
        return
      }

      if (isRestaurant) {
        updateVenue(json)
      } else {
        updateActivity(json)
      }
      onSaved()
    } catch {
      setServerError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  const categoryOptions: { value: Category | ActivityCategory; label: string }[] = isRestaurant
    ? [
        { value: 'breakfast', label: 'Breakfast' },
        { value: 'lunch', label: 'Lunch' },
        { value: 'dinner', label: 'Dinner' },
      ]
    : [
        { value: 'morning', label: 'Morning' },
        { value: 'afternoon', label: 'Afternoon' },
        { value: 'evening', label: 'Evening' },
      ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative bg-white w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <h2 id="edit-modal-title" className="text-lg font-bold text-gray-800">
            Edit {isRestaurant ? 'Restaurant' : 'Activity'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit form"
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean"
          >
            x
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {serverError && (
            <div role="alert" className="text-xs text-coral font-medium bg-coral/10 px-3 py-2 rounded-xl">
              {serverError}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="edit-name" className="block text-xs font-semibold text-gray-700 mb-1">
              Name <span aria-hidden="true" className="text-coral">*</span>
            </label>
            <input
              id="edit-name"
              type="text"
              value={form.name}
              onChange={(e) => handleField('name', e.target.value)}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'edit-name-err' : undefined}
              className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-ocean ${errors.name ? 'border-coral' : 'border-gray-200'}`}
            />
            {errors.name && <p id="edit-name-err" role="alert" className="text-xs text-coral mt-1">{errors.name}</p>}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="edit-category" className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
            <select
              id="edit-category"
              value={form.category}
              onChange={(e) => handleField('category', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ocean"
            >
              <option value="">Select category…</option>
              {categoryOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
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
            <label htmlFor="edit-address" className="block text-xs font-semibold text-gray-700 mb-1">
              Address <span aria-hidden="true" className="text-coral">*</span>
            </label>
            <input
              id="edit-address"
              type="text"
              value={form.address}
              onChange={(e) => handleField('address', e.target.value)}
              aria-invalid={!!errors.address}
              aria-describedby={errors.address ? 'edit-address-err' : undefined}
              className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-ocean ${errors.address ? 'border-coral' : 'border-gray-200'}`}
            />
            {errors.address && <p id="edit-address-err" role="alert" className="text-xs text-coral mt-1">{errors.address}</p>}
          </div>

          {/* Lat / Lng */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-lat" className="block text-xs font-semibold text-gray-700 mb-1">
                Latitude <span aria-hidden="true" className="text-coral">*</span>
              </label>
              <input
                id="edit-lat"
                type="number"
                step="any"
                value={form.lat}
                onChange={(e) => handleField('lat', e.target.value)}
                aria-invalid={!!errors.lat}
                aria-describedby={errors.lat ? 'edit-lat-err' : undefined}
                className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-ocean ${errors.lat ? 'border-coral' : 'border-gray-200'}`}
              />
              {errors.lat && <p id="edit-lat-err" role="alert" className="text-xs text-coral mt-1">{errors.lat}</p>}
            </div>
            <div>
              <label htmlFor="edit-lng" className="block text-xs font-semibold text-gray-700 mb-1">
                Longitude <span aria-hidden="true" className="text-coral">*</span>
              </label>
              <input
                id="edit-lng"
                type="number"
                step="any"
                value={form.lng}
                onChange={(e) => handleField('lng', e.target.value)}
                aria-invalid={!!errors.lng}
                aria-describedby={errors.lng ? 'edit-lng-err' : undefined}
                className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-ocean ${errors.lng ? 'border-coral' : 'border-gray-200'}`}
              />
              {errors.lng && <p id="edit-lng-err" role="alert" className="text-xs text-coral mt-1">{errors.lng}</p>}
            </div>
          </div>

          {/* Hours */}
          <div>
            <label htmlFor="edit-hours" className="block text-xs font-semibold text-gray-700 mb-1">Hours</label>
            <input
              id="edit-hours"
              type="text"
              value={form.hours}
              onChange={(e) => handleField('hours', e.target.value)}
              placeholder="7:00 AM – 10:00 PM"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ocean"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="edit-desc" className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              id="edit-desc"
              rows={3}
              value={form.description}
              onChange={(e) => handleField('description', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ocean resize-none"
            />
          </div>

          {/* Featured image — gallery picker for both restaurants and activities */}
          {isRestaurant ? (
            <RestaurantImageGallery
              venueId={item.id}
              selectedUrl={form.imageUrl}
              onSelect={(url) => handleField('imageUrl', url)}
            />
          ) : (
            <ActivityImageGallery
              activityId={item.id}
              selectedUrl={form.imageUrl}
              onSelect={(url) => handleField('imageUrl', url)}
            />
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-2xl bg-ocean text-white text-sm font-semibold hover:bg-ocean/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
