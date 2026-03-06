'use client'
import { useCallback, useState } from 'react'
import { useAppStore } from '@/app/lib/store'

interface UseVotesOptions {
  onError?: (message: string) => void
}

// [AC-ITINPLAN0306-F5, ERR1]
export function useVotes({ onError }: UseVotesOptions = {}) {
  const userName = useAppStore((s) => s.userName)
  const selectedVenueIds = useAppStore((s) => s.selectedVenueIds)
  const toggleVenueSelection = useAppStore((s) => s.toggleVenueSelection)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

  const toggleVote = useCallback(
    async (venueId: string) => {
      if (!userName) return
      if (pendingIds.has(venueId)) return // debounce rapid clicks

      const wasSelected = selectedVenueIds.has(venueId)

      // Optimistic update [AC-ITINPLAN0306-F5]
      toggleVenueSelection(venueId)
      setPendingIds((prev) => new Set(prev).add(venueId))

      try {
        const method = wasSelected ? 'DELETE' : 'POST'
        const res = await fetch('/api/votes', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ venue_id: venueId, voter_name: userName }),
        })

        if (!res.ok && res.status !== 409) {
          // Revert optimistic update [AC-ITINPLAN0306-ERR1]
          toggleVenueSelection(venueId)
          const msg = 'Couldn\'t save your vote — try again'
          onError?.(msg)
          console.error('[useVotes] API error', { status: res.status, venueId })
        }
      } catch (err) {
        // Network error — revert [AC-ITINPLAN0306-ERR1]
        toggleVenueSelection(venueId)
        onError?.('Couldn\'t save your vote — try again')
        console.error('[useVotes] Network error', err)
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev)
          next.delete(venueId)
          return next
        })
      }
    },
    [userName, selectedVenueIds, toggleVenueSelection, onError, pendingIds]
  )

  return {
    selectedVenueIds,
    toggleVote,
    isPending: (venueId: string) => pendingIds.has(venueId),
  }
}
