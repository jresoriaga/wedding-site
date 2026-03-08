import { useState, useEffect, useCallback } from 'react'

export interface ActivityImage {
  id: string
  image_url: string
  uploaded_by: string
  created_at: string
}

export function useActivityImages(activityId: string | null) {
  const [images, setImages] = useState<ActivityImage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchImages = useCallback(async () => {
    if (!activityId) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/activities/${activityId}/images`)
      if (res.ok) {
        const data: ActivityImage[] = await res.json()
        setImages(data)
      }
    } finally {
      setIsLoading(false)
    }
  }, [activityId])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  return { images, isLoading, refetch: fetchImages }
}
