'use client'
import { useCallback, useState } from 'react'
import { useAppStore } from '@/app/lib/store'
import { rankVenues } from '@/app/lib/rankVenues'
import type { Day, Vote } from '@/app/lib/types'

interface UseVotesOptions {
  onError?: (message: string) => void
  day?: Day
}

// [AC-ITINPLAN0306-F5, ERR1]
export function useVotes({ onError, day = 1 }: UseVotesOptions = {}) {
  const userName = useAppStore((s) => s.userName)
  const selectedVenueIds = useAppStore((s) => s.selectedVenueIds)
  const toggleVenueSelection = useAppStore((s) => s.toggleVenueSelection)
  const setSelectedVenueIds = useAppStore((s) => s.setSelectedVenueIds)
  const setAllVotes = useAppStore((s) => s.setAllVotes)
  const setPollData = useAppStore((s) => s.setPollData)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [isClearing, setIsClearing] = useState(false)

  // Namespace venue ids per day so Day 1 votes don't clash with Day 2 votes
  const makeVenueId = (venueId: string) => `d${day}:${venueId}`

  const toggleVote = useCallback(
    async (venueId: string) => {
      if (!userName) {
        onError?.('Please enter your name first')
        return
      }
      const namespacedId = makeVenueId(venueId)
      if (pendingIds.has(namespacedId)) return // debounce rapid clicks

      const wasSelected = selectedVenueIds.has(namespacedId)
      const currentAllVotes = useAppStore.getState().allVotes
      const currentDay = useAppStore.getState().activeDay

      // Snapshot for rollback
      const prevAllVotes = currentAllVotes

      // Optimistic update — selectedVenueIds, allVotes, AND pollData all at once
      // so card badge, card checkmark, and poll sidebar all update immediately [AC-ITINPLAN0306-F5]
      toggleVenueSelection(namespacedId)
      setPendingIds((prev) => new Set(prev).add(namespacedId))

      let optimisticVotes: Vote[]
      if (wasSelected) {
        // removing a vote
        optimisticVotes = currentAllVotes.filter(
          (v) => !(v.venue_id === namespacedId && v.voter_name === userName)
        )
      } else {
        // adding a vote
        optimisticVotes = [
          ...currentAllVotes,
          {
            id: `optimistic-${namespacedId}-${userName}`,
            venue_id: namespacedId,
            voter_name: userName,
            created_at: new Date().toISOString(),
          },
        ]
      }
      const liveVenues = useAppStore.getState().venues
      setAllVotes(optimisticVotes)
      setPollData({
        breakfast: rankVenues(optimisticVotes, 'breakfast', currentDay, liveVenues),
        lunch: rankVenues(optimisticVotes, 'lunch', currentDay, liveVenues),
        dinner: rankVenues(optimisticVotes, 'dinner', currentDay, liveVenues),
      })

      try {
        const method = wasSelected ? 'DELETE' : 'POST'
        const res = await fetch('/api/votes', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ venue_id: namespacedId, voter_name: userName }),
        })

        if (!res.ok && res.status !== 409) {
          // Revert all three optimistic updates [AC-ITINPLAN0306-ERR1]
          const revertVenues = useAppStore.getState().venues
          toggleVenueSelection(namespacedId)
          setAllVotes(prevAllVotes)
          setPollData({
            breakfast: rankVenues(prevAllVotes, 'breakfast', currentDay, revertVenues),
            lunch: rankVenues(prevAllVotes, 'lunch', currentDay, revertVenues),
            dinner: rankVenues(prevAllVotes, 'dinner', currentDay, revertVenues),
          })
          const msg = 'Couldn\'t save your vote — try again'
          onError?.(msg)
          console.error('[useVotes] API error', { status: res.status, venueId: namespacedId })
        }
      } catch (err) {
        // Network error — revert all three [AC-ITINPLAN0306-ERR1]
        const revertVenues = useAppStore.getState().venues
        toggleVenueSelection(namespacedId)
        setAllVotes(prevAllVotes)
        setPollData({
          breakfast: rankVenues(prevAllVotes, 'breakfast', currentDay, revertVenues),
          lunch: rankVenues(prevAllVotes, 'lunch', currentDay, revertVenues),
          dinner: rankVenues(prevAllVotes, 'dinner', currentDay, revertVenues),
        })
        onError?.('Couldn\'t save your vote — try again')
        console.error('[useVotes] Network error', err)
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev)
          next.delete(namespacedId)
          return next
        })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userName, selectedVenueIds, toggleVenueSelection, setAllVotes, setPollData, onError, pendingIds, day]
  )

  // Clear ALL of the current user's votes for this day in one API call
  const clearDayVotes = useCallback(async () => {
    if (!userName || isClearing) return
    const dayPrefix = `d${day}:`

    // Snapshot which IDs we're removing for rollback
    const toRemove = [...selectedVenueIds].filter((id) => id.startsWith(dayPrefix))
    if (toRemove.length === 0) return

    // Optimistic clear — update selectedVenueIds, allVotes, and pollData
    // so badges and the poll sidebar update immediately without waiting for SSE
    setIsClearing(true)
    setSelectedVenueIds(new Set([...selectedVenueIds].filter((id) => !id.startsWith(dayPrefix))))
    const optimisticVotes = useAppStore.getState().allVotes.filter(
      (v) => !(v.venue_id.startsWith(dayPrefix) && v.voter_name === userName)
    )
    setAllVotes(optimisticVotes)
    setPollData({
      breakfast: rankVenues(optimisticVotes, 'breakfast', day),
      lunch: rankVenues(optimisticVotes, 'lunch', day),
      dinner: rankVenues(optimisticVotes, 'dinner', day),
    })

    try {
      const res = await fetch('/api/votes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voter_name: userName, day_prefix: dayPrefix }),
      })

      if (!res.ok) {
        // Revert — merge removed IDs back in
        setSelectedVenueIds(new Set([...useAppStore.getState().selectedVenueIds, ...toRemove]))
        onError?.('Couldn\'t clear votes — try again')
        console.error('[useVotes] clearDayVotes API error', { status: res.status })
      }
    } catch (err) {
      // Rollback all optimistic updates on failure
      setSelectedVenueIds(new Set([...useAppStore.getState().selectedVenueIds, ...toRemove]))
      onError?.('Couldn\'t clear votes — try again')
      console.error('[useVotes] clearDayVotes network error', err)
    } finally {
      setIsClearing(false)
    }
  }, [userName, selectedVenueIds, setSelectedVenueIds, setAllVotes, setPollData, onError, day, isClearing])

  // Expose a namespaced check so components can check "is d1:some-id selected"
  const isSelected = (venueId: string) => selectedVenueIds.has(makeVenueId(venueId))

  return {
    selectedVenueIds,
    toggleVote,
    clearDayVotes,
    isClearing,
    isSelected,
    isPending: (venueId: string) => pendingIds.has(makeVenueId(venueId)),
  }
}

