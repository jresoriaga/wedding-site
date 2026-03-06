'use client'
import { useState, useEffect, useCallback } from 'react'

export interface VenueImage {
  id: string
  image_url: string
  uploaded_by: string
  created_at: string
}

// [AC-ITINPLAN0306-F13] — fetches persistent images for a venue from Supabase via API
export function useVenueImages(venueId: string) {
  const [images, setImages] = useState<VenueImage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/restaurants/${venueId}/images`)
      if (!res.ok) throw new Error('Failed to fetch images')
      const data: VenueImage[] = await res.json()
      setImages(data)
    } catch {
      setImages([])
    } finally {
      setIsLoading(false)
    }
  }, [venueId])

  useEffect(() => {
    load()
  }, [load])

  return { images, isLoading, refetch: load }
}
