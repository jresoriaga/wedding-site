'use client'
import { create } from 'zustand'
import type { Day, PollData, Vote } from './types'

interface AppState {
  // User identity
  userName: string | null
  setUserName: (name: string) => void
  clearUserName: () => void

  // Selected venue IDs (optimistic)
  selectedVenueIds: Set<string>
  toggleVenueSelection: (venueId: string) => void
  setSelectedVenueIds: (ids: Set<string>) => void

  // Poll data from SSE
  pollData: PollData | null
  setPollData: (data: PollData) => void

  // All votes (for map)
  allVotes: Vote[]
  setAllVotes: (votes: Vote[]) => void

  // SSE connection state
  isReconnecting: boolean
  setIsReconnecting: (v: boolean) => void

  // Active day (1 | 2 | 3)
  activeDay: Day
  setActiveDay: (day: Day) => void
}

export const useAppStore = create<AppState>((set) => ({
  userName: null,
  setUserName: (name) => set({ userName: name }),
  clearUserName: () => set({ userName: null }),

  selectedVenueIds: new Set(),
  toggleVenueSelection: (venueId) =>
    set((state) => {
      const next = new Set(state.selectedVenueIds)
      if (next.has(venueId)) {
        next.delete(venueId)
      } else {
        next.add(venueId)
      }
      return { selectedVenueIds: next }
    }),
  setSelectedVenueIds: (ids) => set({ selectedVenueIds: ids }),

  pollData: null,
  setPollData: (data) => set({ pollData: data }),

  allVotes: [],
  setAllVotes: (votes) => set({ allVotes: votes }),

  isReconnecting: false,
  setIsReconnecting: (v) => set({ isReconnecting: v }),

  activeDay: 1,
  setActiveDay: (day) => set({ activeDay: day }),
}))
