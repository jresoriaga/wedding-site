'use client'
import { create } from 'zustand'
import type { Day, PollData, Vote, Venue, TripConfig, ActivityPollData, ActivityVote, Activity } from './types'
import { RESTAURANTS } from './restaurants'
import { ACTIVITIES } from './activities'

interface AppState {
  // User identity
  userName: string | null
  setUserName: (name: string) => void
  clearUserName: () => void

  // Restaurant voting â€” selected venue IDs (optimistic)
  selectedVenueIds: Set<string>
  toggleVenueSelection: (venueId: string) => void
  setSelectedVenueIds: (ids: Set<string>) => void

  // Activity voting â€” selected activity IDs (optimistic)
  selectedActivityIds: Set<string>
  toggleActivitySelection: (activityId: string) => void
  setSelectedActivityIds: (ids: Set<string>) => void

  // Restaurant poll data from SSE
  pollData: PollData | null
  setPollData: (data: PollData) => void

  // Activity poll data from SSE
  activityPollData: ActivityPollData | null
  setActivityPollData: (data: ActivityPollData) => void

  // All restaurant votes (for map + ranking)
  allVotes: Vote[]
  setAllVotes: (votes: Vote[]) => void

  // All activity votes (for ranking)
  activityAllVotes: ActivityVote[]
  setActivityAllVotes: (votes: ActivityVote[]) => void

  // Live venue list (DB-first, falls back to static)
  venues: Venue[]
  setVenues: (venues: Venue[]) => void
  updateVenue: (venue: Venue) => void

  // Live activity list (DB-first, falls back to static)
  activityVenues: Activity[]
  setActivityVenues: (activities: Activity[]) => void
  updateActivity: (activity: Activity) => void

  // SSE connection state
  isReconnecting: boolean
  setIsReconnecting: (v: boolean) => void

  // Activity SSE connection state
  isActivityReconnecting: boolean
  setIsActivityReconnecting: (v: boolean) => void

  // Active day (1 | 2 | 3)
  activeDay: Day
  setActiveDay: (day: Day) => void

  // Trip configuration (dates + stay location) set by Joef [AC-TRIPCONFIG-F4]
  tripConfig: TripConfig | null
  setTripConfig: (config: TripConfig | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  userName: null,
  setUserName: (name) => set({ userName: name }),
  clearUserName: () => set({ userName: null }),

  selectedVenueIds: new Set(),
  toggleVenueSelection: (venueId) =>
    set((state) => {
      const next = new Set(state.selectedVenueIds)
      if (next.has(venueId)) next.delete(venueId)
      else next.add(venueId)
      return { selectedVenueIds: next }
    }),
  setSelectedVenueIds: (ids) => set({ selectedVenueIds: ids }),

  selectedActivityIds: new Set(),
  toggleActivitySelection: (activityId) =>
    set((state) => {
      const next = new Set(state.selectedActivityIds)
      if (next.has(activityId)) next.delete(activityId)
      else next.add(activityId)
      return { selectedActivityIds: next }
    }),
  setSelectedActivityIds: (ids) => set({ selectedActivityIds: ids }),

  pollData: null,
  setPollData: (data) => set({ pollData: data }),

  activityPollData: null,
  setActivityPollData: (data) => set({ activityPollData: data }),

  allVotes: [],
  setAllVotes: (votes) => set({ allVotes: votes }),

  activityAllVotes: [],
  setActivityAllVotes: (votes) => set({ activityAllVotes: votes }),

  venues: RESTAURANTS,
  setVenues: (venues) => set({ venues }),
  updateVenue: (venue) => set((state) => ({ venues: state.venues.map(v => v.id === venue.id ? venue : v) })),

  activityVenues: ACTIVITIES,
  setActivityVenues: (activities) => set({ activityVenues: activities }),
  updateActivity: (activity) => set((state) => ({ activityVenues: state.activityVenues.map(a => a.id === activity.id ? activity : a) })),

  isReconnecting: false,
  setIsReconnecting: (v) => set({ isReconnecting: v }),

  isActivityReconnecting: false,
  setIsActivityReconnecting: (v) => set({ isActivityReconnecting: v }),

  activeDay: 1,
  setActiveDay: (day) => set({ activeDay: day }),

  tripConfig: null,
  setTripConfig: (config) => set({ tripConfig: config }),
}))


