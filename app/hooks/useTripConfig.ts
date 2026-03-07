'use client'
import { useEffect } from 'react'
import { useAppStore } from '@/app/lib/store'
import type { TripConfig } from '@/app/lib/types'

// [AC-TRIPCONFIG-F4] Fetches trip config from DB on mount and syncs into Zustand store.
// Called from itinerary and map pages so all downstream features (AITINPDF) can read tripConfig.
export function useTripConfig() {
  const setTripConfig = useAppStore((s) => s.setTripConfig)

  useEffect(() => {
    fetch('/api/trip-config')
      .then((r) => r.json())
      .then((json: { data: TripConfig | null }) => {
        setTripConfig(json.data)
      })
      .catch(() => {
        // [AC-TRIPCONFIG-ERR2] Network failure — store stays null, downstream features degrade gracefully
      })
  }, [setTripConfig])
}
