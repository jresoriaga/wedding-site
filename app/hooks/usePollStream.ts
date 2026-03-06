'use client'
import { useEffect, useCallback } from 'react'
import { useAppStore } from '@/app/lib/store'
import { rankVenues } from '@/app/lib/rankVenues'
import type { Vote, PollData } from '@/app/lib/types'

const MAX_RETRIES = 5
const BASE_DELAY_MS = 1000

// [AC-ITINPLAN0306-F6, ERR2]
export function usePollStream() {
  const setPollData = useAppStore((s) => s.setPollData)
  const setAllVotes = useAppStore((s) => s.setAllVotes)
  const setIsReconnecting = useAppStore((s) => s.setIsReconnecting)

  const buildPollData = useCallback((votes: Vote[]): PollData => ({
    breakfast: rankVenues(votes, 'breakfast'),
    lunch: rankVenues(votes, 'lunch'),
    dinner: rankVenues(votes, 'dinner'),
  }), [])

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
          setPollData(buildPollData(votes))
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
