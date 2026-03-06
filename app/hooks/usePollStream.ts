'use client'
import { useEffect, useCallback } from 'react'
import { useAppStore } from '@/app/lib/store'
import { rankVenues } from '@/app/lib/rankVenues'
import type { Vote, PollData, Day } from '@/app/lib/types'

const MAX_RETRIES = 5
const BASE_DELAY_MS = 1000

// [AC-ITINPLAN0306-F6, ERR2]
export function usePollStream() {
  const setPollData = useAppStore((s) => s.setPollData)
  const setAllVotes = useAppStore((s) => s.setAllVotes)
  const setIsReconnecting = useAppStore((s) => s.setIsReconnecting)
  const activeDay = useAppStore((s) => s.activeDay)
  const allVotes = useAppStore((s) => s.allVotes)

  const buildPollData = useCallback((votes: Vote[], day: Day): PollData => ({
    breakfast: rankVenues(votes, 'breakfast', day),
    lunch: rankVenues(votes, 'lunch', day),
    dinner: rankVenues(votes, 'dinner', day),
  }), [])

  // Re-derive poll data whenever the active day changes [Day 1/2/3 support]
  useEffect(() => {
    setPollData(buildPollData(allVotes, activeDay))
  }, [activeDay, allVotes, buildPollData, setPollData])

  useEffect(() => {
    let es: EventSource | null = null
    let retryCount = 0
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let active = true

    function connect() {
      if (!active) return
      es = new EventSource('/api/poll/stream')

      es.onopen = () => {
        retryCount = 0
        setIsReconnecting(false)
      }

      es.addEventListener('votes', (event: MessageEvent) => {
        try {
          const votes: Vote[] = JSON.parse(event.data)
          setAllVotes(votes)
          // Seed selectedVenueIds from server so the UI reflects persisted votes
          // (handles page refresh / reconnect where Zustand state was lost)
          const currentUser = useAppStore.getState().userName
          if (currentUser) {
            const myIds = new Set(
              votes
                .filter((v) => v.voter_name === currentUser)
                .map((v) => v.venue_id)
            )
            useAppStore.getState().setSelectedVenueIds(myIds)
          }
          // pollData will be derived by the effect above when allVotes updates
          setPollData(buildPollData(votes, useAppStore.getState().activeDay))
        } catch (err) {
          console.error('[usePollStream] Failed to parse votes event', err)
        }
      })

      es.onerror = () => {
        es?.close()
        es = null
        if (!active) return

        if (retryCount >= MAX_RETRIES) {
          setIsReconnecting(false)
          console.error('[usePollStream] Max retries reached, giving up')
          return
        }

        retryCount++
        setIsReconnecting(true)
        const delay = BASE_DELAY_MS * Math.pow(2, retryCount - 1) // exponential backoff
        console.log(`[usePollStream] Reconnecting in ${delay}ms (attempt ${retryCount}/${MAX_RETRIES})`)
        timeoutId = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      active = false
      if (timeoutId) clearTimeout(timeoutId)
      es?.close()
    }
  }, [buildPollData, setPollData, setAllVotes, setIsReconnecting])
}

