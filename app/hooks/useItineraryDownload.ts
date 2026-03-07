'use client'
import { useState } from 'react'
import React from 'react'
import { useAppStore } from '@/app/lib/store'
import type { GeneratedItinerary } from '@/app/lib/types'

// [AC-AITINPDF-F2, F4, E1, ERR1, ERR2]
// @react-pdf/renderer is browser-only — dynamically imported to avoid SSR [OWASP:A5]
export function useItineraryDownload() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tripConfig = useAppStore((s) => s.tripConfig)

  async function download() {
    // [AC-AITINPDF-E1] Guard: no API call if tripConfig missing
    if (!tripConfig) {
      setError('Trip dates not set yet — ask Joef to configure them')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/itinerary/generate', { method: 'POST' })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Failed to generate itinerary')
        return
      }

      const data: GeneratedItinerary = await res.json()

      // Dynamic imports — prevent @react-pdf/renderer from being bundled server-side
      const [{ pdf }, { default: ItineraryPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/app/components/ItineraryPDF'),
      ])

      // [AC-AITINPDF-F4] Render PDF to blob and trigger browser download
      // Type cast needed: react-pdf's pdf() expects DocumentProps element; ItineraryPDF wraps Document internally
      const blob = await pdf(
        React.createElement(ItineraryPDF, { itinerary: data, tripConfig }) as unknown as Parameters<typeof pdf>[0]
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'lu-outing-itinerary.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // [AC-AITINPDF-ERR2] PDF render or network errors — never crash the page
      setError('PDF generation failed — try again')
    } finally {
      setLoading(false)
    }
  }

  return { download, loading, error, setError }
}
