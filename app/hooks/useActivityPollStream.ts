'use client'
import { useEffect, useCallback } from 'react'
import { useAppStore } from '@/app/lib/store'
import { rankActivities } from '@/app/lib/rankActivities'
import type { ActivityVote, ActivityPollData, Day } from '@/app/lib/types'

const MAX_RETRIES = 5
const BASE_DELAY_MS = 1000

// [AC-ACTIVITIES-F5, F6] Activity poll SSE stream — mirrors usePollStream for activities
export function useActivityPollStream() {
  const setActivityPollData = useAppStore((s) => s.setActivityPollData)
  const setActivityAllVotes = useAppStore((s) => s.setActivityAllVotes)
  const setIsActivityReconnecting = useAppStore((s) => s.setIsActivityReconnecting)
  const activeDay = useAppStore((s) => s.activeDay)
  const activityAllVotes = useAppStore((s) => s.activityAllVotes)
  const activityVenues = useAppStore((s) => s.activityVenues)

  const buildActivityPollData = useCallback((votes: ActivityVote[], day: Day): ActivityPollData => ({
    morning: rankActivities(votes, 'morning', day, activityVenues),
    afternoon: rankActivities(votes, 'afternoon', day, activityVenues),
    evening: rankActivities(votes, 'evening', day, activityVenues),
  }), [activityVenues])

  // Re-derive poll data whenever the active day changes
  useEffect(() => {
    setActivityPollData(buildActivityPollData(activityAllVotes, activeDay))
  }, [activeDay, activityAllVotes, buildActivityPollData, setActivityPollData])

  useEffect(() => {
    let es: EventSource | null = null
    let retryCount = 0
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let active = true

    function connect() {
      if (!active) return
      es = new EventSource('/api/activity-poll/stream')

      es.onopen = () => {
        retryCount = 0
        setIsActivityReconnecting(false)
      }

      es.addEventListener('activity-votes', (event: MessageEvent) => {
        try {
          const votes: ActivityVote[] = JSON.parse(event.data)
          setActivityAllVotes(votes)

          const currentUser = useAppStore.getState().userName
          if (currentUser) {
            const myIds = new Set(
              votes
                .filter((v) => v.voter_name === currentUser)
                .map((v) => v.activity_id)
            )
            useAppStore.getState().setSelectedActivityIds(myIds)
          }

          setActivityPollData(buildActivityPollData(votes, useAppStore.getState().activeDay))
        } catch (err) {
          console.error('[useActivityPollStream] Failed to parse activity-votes event', err)
        }
      })

      es.onerror = () => {
        es?.close()
        es = null
        if (!active) return

        if (retryCount >= MAX_RETRIES) {
          setIsActivityReconnecting(false)
          console.error('[useActivityPollStream] Max retries reached, giving up')
          return
        }

        retryCount++
        setIsActivityReconnecting(true)
        const delay = BASE_DELAY_MS * Math.pow(2, retryCount - 1)
        timeoutId = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      active = false
      if (timeoutId) clearTimeout(timeoutId)
      es?.close()
    }
  }, [buildActivityPollData, setActivityPollData, setActivityAllVotes, setIsActivityReconnecting])
}
