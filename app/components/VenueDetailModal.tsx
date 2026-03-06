'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import type { Venue } from '@/app/lib/types'
import { useVenueImages } from '@/app/hooks/useVenueImages'
import { useAppStore } from '@/app/lib/store'

interface VenueDetailModalProps {
  venue: Venue
  onClose: () => void
}

const VIBE_COLORS: Record<string, string> = {
  party: 'bg-purple-100 text-purple-700',
  'casual dining': 'bg-green-100 text-green-700',
  buffet: 'bg-amber-100 text-amber-700',
  bar: 'bg-blue-100 text-blue-700',
  café: 'bg-orange-100 text-orange-700',
  'street food': 'bg-red-100 text-red-700',
}

const CATEGORY_EMOJI: Record<string, string> = {
  breakfast: '🌅',
  lunch: '🍜',
  dinner: '🌇',
}

// [WCAG:1.3.1, 2.1.1, 2.4.3]
export default function VenueDetailModal({ venue, onClose }: VenueDetailModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const userName = useAppStore((s) => s.userName)
  const isJoef = userName === 'Joef'

  // [AC-ITINPLAN0306-F13] persistent images from Supabase via API
  const { images, isLoading: imagesLoading, refetch } = useVenueImages(venue.id)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Reset carousel index when venue changes
  useEffect(() => { setCurrentIndex(0) }, [venue.id])

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1))
  }, [images.length])

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1))
  }, [images.length])

  // Keyboard navigation [WCAG:2.1.1]
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lightboxSrc) { if (e.key === 'Escape') setLightboxSrc(null); return }
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, lightboxSrc, goPrev, goNext])

  // Trap focus [WCAG:2.4.3]
  useEffect(() => { dialogRef.current?.focus() }, [])

  // [AC-ITINPLAN0306-F12] Joef-only upload to Supabase Storage via API
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    setUploadError(null)
    for (const file of files) {
      const formData = new FormData()
      formData.append('uploaded_by', 'Joef')
      formData.append('file', file)
      try {
        const res = await fetch(`/api/restaurants/${venue.id}/images`, { method: 'POST', body: formData })
        if (!res.ok) { const j = await res.json(); setUploadError(j.error ?? 'Upload failed') }
      } catch { setUploadError('Upload failed — check your connection') }
    }
    setUploading(false)
    e.target.value = ''
    await refetch()
    setCurrentIndex(Math.max(0, images.length - 1))
  }

  const currentImage = images[currentIndex] ?? null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Details for ${venue.name}`}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative bg-white w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col outline-none overflow-hidden animate-slide-up"
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span aria-hidden="true" className="text-xl">{CATEGORY_EMOJI[venue.category] ?? '🍽️'}</span>
              <h2 className="text-lg font-bold text-gray-800 truncate">{venue.name}</h2>
            </div>
            <p className="text-gray-500 text-xs truncate">📍 {venue.address}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean"
          >
            ✕
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

          {/* Meta: hours + vibe chips */}
          <div className="flex flex-wrap items-center gap-2">
            {venue.hours && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-ocean/10 text-ocean text-xs font-semibold">
                🕐 {venue.hours}
              </span>
            )}
            {venue.vibe.map((v) => (
              <span key={v} className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${VIBE_COLORS[v] ?? 'bg-gray-100 text-gray-600'}`}>
                {v}
              </span>
            ))}
          </div>

          {venue.description && (
            <p className="text-gray-700 text-sm leading-relaxed">{venue.description}</p>
          )}

          {/* ── Menu / Photos section ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-700 text-sm">
                Menu &amp; Photos
                {images.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-gray-400">{currentIndex + 1} / {images.length}</span>
                )}
              </h3>
              {/* Upload button — Joef only [AC-ITINPLAN0306-F12] */}
              {isJoef && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  aria-label="Upload photo"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-ocean text-white hover:bg-ocean/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean focus:ring-offset-2 disabled:opacity-60"
                >
                  {uploading ? '⏳ Uploading…' : '📷 Upload photo'}
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="sr-only" aria-label="Upload menu photo" onChange={handleFileChange} />
            </div>

            {uploadError && (
              <p role="alert" className="text-xs text-coral font-medium mb-2">⚠️ {uploadError}</p>
            )}

            {imagesLoading ? (
              <div className="w-full rounded-2xl bg-gray-100 animate-pulse aspect-[4/3]" aria-label="Loading images" />
            ) : images.length === 0 ? (
              <div className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-10 flex flex-col items-center gap-2 text-gray-400">
                <span className="text-3xl" aria-hidden="true">🖼️</span>
                <span className="text-sm font-medium">No photos yet</span>
                {isJoef && (
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs text-ocean font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-ocean rounded">
                    Tap to add the first photo
                  </button>
                )}
              </div>
            ) : (
              /* ── Carousel [AC-ITINPLAN0306-F13] ── */
              <div className="relative">
                {/* Main slide */}
                <div
                  className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-[4/3] cursor-pointer"
                  onClick={() => currentImage && setLightboxSrc(currentImage.image_url)}
                >
                  {currentImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentImage.image_url} alt={`${venue.name} photo ${currentIndex + 1}`} className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full pointer-events-none">⤢ Full screen</div>
                </div>

                {/* Prev / Next [WCAG:2.1.1] */}
                {images.length > 1 && (
                  <>
                    <button type="button" aria-label="Previous photo" onClick={goPrev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white text-lg leading-none">‹</button>
                    <button type="button" aria-label="Next photo" onClick={goNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white text-lg leading-none">›</button>
                  </>
                )}

                {/* Dot indicators */}
                {images.length > 1 && (
                  <div className="flex justify-center gap-1.5 mt-2" role="tablist" aria-label="Photo indicators">
                    {images.map((img, i) => (
                      <button key={img.id} type="button" role="tab" aria-selected={i === currentIndex} aria-label={`Photo ${i + 1}`} onClick={() => setCurrentIndex(i)}
                        className={`w-2 h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-ocean ${i === currentIndex ? 'bg-ocean scale-125' : 'bg-gray-300 hover:bg-gray-400'}`} />
                    ))}
                  </div>
                )}

                {/* Thumbnail strip */}
                {images.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {images.map((img, i) => (
                      <button key={img.id} type="button" aria-label={`View photo ${i + 1}`} onClick={() => setCurrentIndex(i)}
                        className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-ocean ${i === currentIndex ? 'border-ocean' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.image_url} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                    {/* Add more — Joef only */}
                    {isJoef && (
                      <button type="button" aria-label="Add more photos" onClick={() => fileInputRef.current?.click()}
                        className="flex-shrink-0 w-14 h-14 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-ocean hover:text-ocean transition-colors focus:outline-none focus:ring-2 focus:ring-ocean text-xl">
                        +
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Google Maps deep link */}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-ocean font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-ocean rounded"
          >
            🗺️ Open in Google Maps
          </a>
        </div>
      </div>

      {/* ── Lightbox [AC-ITINPLAN0306-F13] ── */}
      {lightboxSrc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightboxSrc(null)} role="dialog" aria-modal="true" aria-label="Full size photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxSrc} alt="Full size photo" className="max-w-full max-h-full object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
          <button type="button" aria-label="Close photo" onClick={() => setLightboxSrc(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white">✕</button>
        </div>
      )}
    </div>
  )
}
