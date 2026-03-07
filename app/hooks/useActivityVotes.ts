'use client'
import { useCallback, useState } from 'react'
import { useAppStore } from '@/app/lib/store'
import { rankActivities } from '@/app/lib/rankActivities'
import type { Day, ActivityVote } from '@/app/lib/types'

interface UseActivityVotesOptions {
  onError?: (message: string) => void
  day?: Day
}

// [AC-ACTIVITIES-F3, F4] Activity vote toggle hook — mirrors useVotes but for activities
// Activity IDs are namespaced as "d{day}:act:{activity_id}"
export function useActivityVotes({ onError, day = 1 }: UseActivityVotesOptions = {}) {
  const userName = useAppStore((s) => s.userName)
  const selectedActivityIds = useAppStore((s) => s.selectedActivityIds)
  const toggleActivitySelection = useAppStore((s) => s.toggleActivitySelection)
  const setSelectedActivityIds = useAppStore((s) => s.setSelectedActivityIds)
  const setActivityAllVotes = useAppStore((s) => s.setActivityAllVotes)
  const setActivityPollData = useAppStore((s) => s.setActivityPollData)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [isClearing, setIsClearing] = useState(false)

  const makeActivityId = (activityId: string) => `d${day}:act:${activityId}`

  const toggleVote = useCallback(
    async (activityId: string) => {
      if (!userName) {
        onError?.('Please enter your name first')
        return
      }
      const namespacedId = makeActivityId(activityId)
      if (pendingIds.has(namespacedId)) return

      const wasSelected = selectedActivityIds.has(namespacedId)
      const currentAllVotes = useAppStore.getState().activityAllVotes
      const currentDay = useAppStore.getState().activeDay
      const liveActivities = useAppStore.getState().activityVenues

      toggleActivitySelection(namespacedId)
      setPendingIds((prev) => new Set(prev).add(namespacedId))

      let optimisticVotes: ActivityVote[]
      if (wasSelected) {
        optimisticVotes = currentAllVotes.filter(
          (v) => !(v.activity_id === namespacedId && v.voter_name === userName)
        )
      } else {
        optimisticVotes = [
          ...currentAllVotes,
          {
            id: `optimistic-${namespacedId}-${userName}`,
            activity_id: namespacedId,
            voter_name: userName,
            created_at: new Date().toISOString(),
          },
        ]
      }

      setActivityAllVotes(optimisticVotes)
      setActivityPollData({
        morning: rankActivities(optimisticVotes, 'morning', currentDay, liveActivities),
        afternoon: rankActivities(optimisticVotes, 'afternoon', currentDay, liveActivities),
        evening: rankActivities(optimisticVotes, 'evening', currentDay, liveActivities),
      })

      try {
        const method = wasSelected ? 'DELETE' : 'POST'
        const res = await fetch('/api/activity-votes', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activity_id: namespacedId, voter_name: userName }),
        })

        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          onError?.(json.error ?? 'Vote failed')
          // Rollback optimistic update
          toggleActivitySelection(namespacedId)
          setActivityAllVotes(currentAllVotes)
          setActivityPollData({
            morning: rankActivities(currentAllVotes, 'morning', currentDay, liveActivities),
            afternoon: rankActivities(currentAllVotes, 'afternoon', currentDay, liveActivities),
            evening: rankActivities(currentAllVotes, 'evening', currentDay, liveActivities),
          })
        }
      } catch {
        onError?.('Network error — vote not saved')
        toggleActivitySelection(namespacedId)
        setActivityAllVotes(currentAllVotes)
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev)
          next.delete(namespacedId)
          return next
        })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userName, selectedActivityIds, pendingIds, day]
  )

  const clearDayVotes = useCallback(async () => {
    if (!userName || isClearing) return
    setIsClearing(true)
    const dayPrefix = `d${day}:act:`

    const currentAllVotes = useAppStore.getState().activityAllVotes
    const currentDay = useAppStore.getState().activeDay
    const liveActivities = useAppStore.getState().activityVenues

    // Optimistic clear
    const myDayIds = new Set(
      currentAllVotes
        .filter((v) => v.activity_id.startsWith(dayPrefix) && v.voter_name === userName)
        .map((v) => v.activity_id)
    )
    myDayIds.forEach((id) => {
      if (selectedActivityIds.has(id)) toggleActivitySelection(id)
    })
    const filtered = currentAllVotes.filter(
      (v) => !(v.activity_id.startsWith(dayPrefix) && v.voter_name === userName)
    )
    setActivityAllVotes(filtered)
    setActivityPollData({
      morning: rankActivities(filtered, 'morning', currentDay, liveActivities),
      afternoon: rankActivities(filtered, 'afternoon', currentDay, liveActivities),
      evening: rankActivities(filtered, 'evening', currentDay, liveActivities),
    })

    try {
      await fetch('/api/activity-votes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voter_name: userName, day_prefix: dayPrefix }),
      })
    } catch {
      // Best-effort clear — server will reconcile on next SSE push
    } finally {
      setIsClearing(false)
    }
  }, [userName, isClearing, day, selectedActivityIds, toggleActivitySelection, setActivityAllVotes, setActivityPollData])

  const isSelected = useCallback(
    (activityId: string) => selectedActivityIds.has(makeActivityId(activityId)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedActivityIds, day]
  )

  const isPending = useCallback(
    (activityId: string) => pendingIds.has(makeActivityId(activityId)),
    [pendingIds, day]
  )

  return { toggleVote, clearDayVotes, isSelected, isPending, isClearing }
}
