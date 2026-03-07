'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Venue } from '@/app/lib/types'
import { RESTAURANTS } from '@/app/lib/restaurants'
import { useAppStore } from '@/app/lib/store'

// [AC-ITINPLAN0306-F11] — DB-first venue list with static fallback
export function useRestaurants() {
  const [venues, setVenues] = useState<Venue[]>(RESTAURANTS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const setStoreVenues = useAppStore((s) => s.setVenues)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/restaurants')
      if (!res.ok) throw new Error('Failed to load restaurants')
      const data: Venue[] = await res.json()
      const resolved = data.length > 0 ? data : RESTAURANTS
      setVenues(resolved)
      setStoreVenues(resolved) // sync into store so rankVenues sees all DB venues
    } catch (e) {
      setError('Using cached restaurant list')
      setVenues(RESTAURANTS)
      setStoreVenues(RESTAURANTS)
    } finally {
      setIsLoading(false)
    }
  }, [setStoreVenues])

  useEffect(() => {
    load()
  }, [load])

  // [OWASP:A3] Build lookup map once — avoids O(n²) nested find() patterns
  const venueMap = useMemo(
    () => Object.fromEntries(venues.map((v) => [v.id, v])) as Record<string, Venue>,
    [venues]
  )

  return { venues, venueMap, isLoading, error, refetch: load }
}
